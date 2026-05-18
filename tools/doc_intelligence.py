#!/usr/bin/env python3
"""
Document Intelligence for ZCODE Memory System
Parses Markdown documents, extracts terminology, instructions, commands, and tags.

Two extraction modes:
  1. Regex (default) - fast, offline, uses MarkdownParser heuristics
  2. LLM (--llm) - uses z-ai-web-dev-sdk via ai_extract.mjs bridge for AI-powered extraction

Usage:
    python doc_intelligence.py extract doc.md                 # Regex preview
    python doc_intelligence.py extract doc.md --llm           # LLM preview
    python doc_intelligence.py ingest doc.md                  # Ingest with regex
    python doc_intelligence.py ingest doc.md --llm            # Ingest with LLM
    python doc_intelligence.py ingest --stdin < doc.md        # Ingest from stdin
    python doc_intelligence.py ingest doc.md --source wiki    # Custom source tag
    python doc_intelligence.py batch ./docs/                  # Ingest all .md files
"""

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, List, Tuple

# ── Constants ──────────────────────────────────────────────

ENTRY_TYPES = ["session", "knowledge", "pattern", "project", "template", "command"]

# New edge types for document intelligence
DOC_EDGE_TYPES = {
    "defines_term":      "Document defines a term/concept",
    "has_instruction":   "Document contains an instruction/how-to",
    "has_command":       "Document references a command/CLI recipe",
    "tagged_with":       "Entry is tagged with a concept",
}

DEFAULT_MEMORY_PATH = Path.home() / ".zcode" / "memory" / "chromadb"

# Path to ai_extract.mjs bridge (same directory as this script)
AI_EXTRACT_BRIDGE = Path(__file__).parent / "ai_extract.mjs"


# ── Markdown Parser (Regex-based) ──────────────────────────

class MarkdownParser:
    """Parse markdown and extract structured knowledge using regex heuristics."""

    def __init__(self, content: str, source: str = ""):
        self.content = content
        self.source = source
        self.lines = content.split("\n")

    def extract_title(self) -> str:
        """Extract document title from first heading."""
        for line in self.lines:
            line = line.strip()
            if line.startswith("# "):
                return line[2:].strip()
        return self.source or "Untitled"

    def extract_sections(self) -> List[Dict]:
        """Extract all sections (headings + content)."""
        sections = []
        current = None

        for line in self.lines:
            heading_match = re.match(r'^(#{1,6})\s+(.+)$', line)
            if heading_match:
                if current:
                    sections.append(current)
                level = len(heading_match.group(1))
                title = heading_match.group(2).strip()
                current = {"level": level, "title": title, "content": ""}
            elif current is not None:
                current["content"] += line + "\n"

        if current:
            sections.append(current)

        return sections

    def extract_terms(self) -> List[Dict]:
        """
        Extract terminology/definitions using regex patterns.
        Patterns:
          - **Term**: definition
          - **Term** - definition
          - `Term` - definition
          - ## Term / ### Term (short heading likely a term)
          - | Term | Definition | (table rows)
        """
        terms = []
        seen = set()

        # Pattern 1: **Bold term**: definition
        for match in re.finditer(r'\*\*([^*]+)\*\*\s*[:\u2014\u2013\-]\s*(.+)', self.content):
            term = match.group(1).strip()
            definition = match.group(2).strip()
            if term not in seen and len(definition) > 5:
                seen.add(term)
                terms.append({"term": term, "definition": definition, "pattern": "bold_def"})

        # Pattern 2: `Code term` - definition
        for match in re.finditer(r'`([^`]+)`\s*[:\u2014\u2013\-]\s*(.+)', self.content):
            term = match.group(1).strip()
            definition = match.group(2).strip()
            if term not in seen and len(definition) > 5:
                seen.add(term)
                terms.append({"term": term, "definition": definition, "pattern": "code_def"})

        # Pattern 3: Table rows | Term | Definition |
        in_table = False
        for line in self.lines:
            if "|" in line and line.strip().startswith("|"):
                cells = [c.strip() for c in line.split("|")[1:-1]]
                if len(cells) >= 2:
                    if all(set(c) <= {"-", ":", " "} for c in cells):
                        in_table = True
                        continue
                    if in_table and cells[0] and cells[1]:
                        term = cells[0].strip("*` ")
                        definition = cells[1].strip()
                        # Filter out TypeScript type names and generic words
                        _skip_terms = {
                            "number", "string", "boolean", "class", "function",
                            "object", "array", "void", "any", "null", "undefined",
                            "true", "false", "yes", "no", "n/a", "-",
                        }
                        if (term not in seen
                            and len(term) < 50
                            and len(definition) > 3
                            and term.lower() not in _skip_terms
                            and not term.startswith("`")):
                            seen.add(term)
                            terms.append({"term": term, "definition": definition, "pattern": "table"})
                in_table = True
            else:
                in_table = False

        # Pattern 4: Short section headings (1-4 words, likely terms)
        for section in self.extract_sections():
            if section["level"] >= 2:
                title = section["title"].strip("*` ")
                words = title.split()
                content = section["content"].strip()
                if (title not in seen
                    and 1 <= len(words) <= 4
                    and len(content) > 20
                    and not title.lower().startswith(("how to", "step", "example", "note", "warning"))):
                    seen.add(title)
                    terms.append({"term": title, "definition": content[:300], "pattern": "heading"})

        return terms

    def extract_instructions(self) -> List[Dict]:
        """
        Extract instructions/how-to steps using regex patterns.
        """
        instructions = []
        sections = self.extract_sections()

        for section in sections:
            content = section["content"]
            title = section["title"]
            title_lower = title.lower()

            is_howto = any(kw in title_lower for kw in [
                "how to", "how-to", "howto", "guide", "tutorial",
                "setup", "install", "configure", "getting started",
                "deployment", "build", "run"
            ])
            has_steps = bool(re.search(r'^\s*\d+[.\)]\s', content, re.MULTILINE))
            has_code = "```" in content
            has_imperative = bool(re.search(
                r'^(?:\s*[-*\u2022]\s+(?:run|create|add|install|open|use|set|configure|build|deploy|start|stop|enable|disable|check|verify|test))',
                content, re.MULTILINE | re.IGNORECASE
            ))

            if is_howto or has_steps or (has_code and has_imperative):
                instructions.append({
                    "title": title,
                    "content": content.strip(),
                    "section_level": section["level"],
                    "has_code": has_code,
                    "has_steps": has_steps,
                })

        return instructions

    def extract_commands(self) -> List[Dict]:
        """Extract CLI commands and code recipes."""
        commands = []
        seen_cmds = set()

        in_code_block = False
        code_lang = ""
        code_buf = []

        for line in self.lines:
            if line.strip().startswith("```"):
                if in_code_block:
                    code = "\n".join(code_buf).strip()
                    if code and self._looks_like_command(code, code_lang):
                        first_cmd = self._first_command_line(code)
                        if first_cmd and first_cmd not in seen_cmds:
                            seen_cmds.add(first_cmd)
                            commands.append({
                                "command": first_cmd,
                                "full_code": code,
                                "language": code_lang or "text",
                                "source_section": "",
                            })
                    code_buf = []
                    in_code_block = False
                else:
                    code_lang = line.strip()[3:].strip().lower()
                    in_code_block = True
                    code_buf = []
            elif in_code_block:
                code_buf.append(line)

        # Inline code that looks like commands
        for match in re.finditer(r'`([^`]{3,80})`', self.content):
            code = match.group(1).strip()
            if self._is_cli_command(code) and code not in seen_cmds:
                seen_cmds.add(code)
                commands.append({
                    "command": code,
                    "full_code": code,
                    "language": "shell",
                    "source_section": "",
                })

        return commands

    def extract_api_endpoints(self) -> List[Dict]:
        """Extract REST API endpoints (POST /api/..., GET /api/...) from text."""
        endpoints = []
        seen = set()
        api_pattern = re.compile(
            r'((?:GET|POST|PUT|DELETE|PATCH)\s+/[a-zA-Z][a-zA-Z0-9_/.-]*(?:\{[^}]+\})*[^\s]*)',
            re.IGNORECASE
        )
        for line in self.lines:
            for match in api_pattern.finditer(line):
                ep = match.group(1).strip()
                if len(ep) > 5 and ep not in seen:
                    seen.add(ep)
                    method = ep.split()[0].upper()
                    path = ep.split()[1] if len(ep.split()) > 1 else ep
                    endpoints.append({
                        "endpoint": ep,
                        "method": method,
                        "path": path,
                        "source_section": "",
                    })
        return endpoints

    def extract_api_functions(self) -> List[Dict]:
        """Extract TS/JS function signatures from code blocks."""
        functions = []
        seen_names = set()
        ts_type_filter = {
            'string', 'number', 'boolean', 'void', 'class', 'function', 'object',
            'array', 'null', 'undefined', 'Promise', 'Record', 'Date', 'Map', 'Set',
            'Error', 'Response', 'Request', 'Headers', 'Type', 'Props', 'State',
        }
        func_patterns = [
            re.compile(r'(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)'),
            re.compile(r'(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*(?::\s*[^=]+)?\s*=>'),
            re.compile(r'class\s+(\w+)'),
        ]
        in_code_block = False
        code_lang = ""
        code_buf = []
        current_section = ""
        for line in self.lines:
            if line.startswith("#"):
                current_section = line.lstrip("#").strip()
            if line.strip().startswith("```"):
                if in_code_block:
                    code = "\n".join(code_buf).strip()
                    for pattern in func_patterns:
                        for match in pattern.finditer(code):
                            name = match.group(1)
                            if name not in ts_type_filter and len(name) > 1 and name not in seen_names:
                                seen_names.add(name)
                                sig_start = match.start()
                                sig_end = code.find("\n", sig_start)
                                signature = code[sig_start:sig_end].strip() if sig_end != -1 else match.group(0)
                                functions.append({
                                    "name": name,
                                    "signature": signature[:200],
                                    "language": code_lang or "typescript",
                                    "context": current_section,
                                })
                    code_buf = []
                    in_code_block = False
                else:
                    code_lang = line.strip()[3:].strip().lower()
                    in_code_block = True
                    code_buf = []
            elif in_code_block:
                code_buf.append(line)
        return functions

    def _looks_like_command(self, code: str, lang: str) -> bool:
        if lang in ("bash", "sh", "shell", "zsh", "fish", "powershell", "cmd", "bat"):
            return True
        cli_prefixes = [
            "npm ", "npx ", "pip ", "cargo ", "go ", "docker ", "kubectl ",
            "git ", "python ", "node ", "deno ", "curl ", "wget ",
            "make ", "cmake ", "gcc ", "pipenv ", "poetry ", "bun "
        ]
        first_line = code.split("\n")[0].strip().lstrip("$> ")
        return any(first_line.startswith(p) for p in cli_prefixes)

    def _is_cli_command(self, code: str) -> bool:
        code = code.strip().lstrip("$> ")
        cli_prefixes = [
            "npm ", "npx ", "pip ", "cargo ", "go ", "docker ", "kubectl ",
            "git ", "python ", "node ", "curl ", "make ", "bun "
        ]
        return any(code.startswith(p) for p in cli_prefixes)

    def _first_command_line(self, code: str) -> str:
        for line in code.split("\n"):
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            line = line.lstrip("$> ")
            if line:
                return line[:120]
        return ""

    def extract_tags(self) -> List[str]:
        """Auto-generate tags from content."""
        tags = set()

        # YAML frontmatter tags
        if self.content.startswith("---"):
            end = self.content.find("---", 3)
            if end > 0:
                frontmatter = self.content[3:end]
                for match in re.finditer(r'tags?:\s*\[(.+?)\]', frontmatter):
                    for tag in match.group(1).split(","):
                        tag = tag.strip().strip("\"'")
                        if tag:
                            tags.add(tag.lower())

        # #tag patterns
        for match in re.finditer(r'(?:^|\s)#([a-zA-Z][\w-]*)', self.content):
            tag = match.group(1).lower()
            if tag not in ("title", "description", "summary", "note", "todo", "fixme",
                          "see", "ref", "source", "date", "author"):
                tags.add(tag)

        # Technology names
        tech_patterns = [
            r'\b(react|nextjs|next\.js|vue|angular|svelte|typescript|javascript|python|rust|go|golang)\b',
            r'\b(docker|kubernetes|k8s|nginx|postgres|mysql|redis|mongodb|elasticsearch)\b',
            r'\b(git|github|gitlab|ci/cd|jenkins|github\.actions)\b',
            r'\b(prisma|drizzle|typeorm|sequelize|supabase|firebase)\b',
            r'\b(tailwind|css|scss|sass|bootstrap|chakra)\b',
            r'\b(chromadb|langchain|openai|anthropic|ollama|llm|rag)\b',
            r'\b(linux|ubuntu|debian|macos|windows|wsl)\b',
        ]
        for pattern in tech_patterns:
            for match in re.finditer(pattern, self.content, re.IGNORECASE):
                tags.add(match.group(1).lower().replace(".js", "js"))

        # Short section headings as tags (strip special chars)
        for section in self.extract_sections():
            title = section["title"].strip()
            title = re.sub(r'[`()]', '', title)
            title = re.sub(r'^\d+\.\s*', '', title)
            title = title.rstrip(":;.,!?").strip()
            words = title.split()
            if 1 <= len(words) <= 3 and title.isascii():
                tags.add(title.lower().replace(" ", "-"))

        return sorted(tags)


# ── Plain Text Parser (for .txt and unstructured text) ─────

class PlainTextParser:
    """
    Parse plain text documents (.txt) without markdown formatting.
    Detects terminology, instructions, and commands using structural heuristics:
      - "Term - Definition" patterns (capitalized word followed by dash)
      - "Term:" patterns (word followed by colon on its own or start of line)
      - Numbered/bulleted step sequences
      - Lines starting with known CLI prefixes (git, npm, pip, etc.)
      - Blank-line-separated sections as pseudo-sections
    """

    # CLI command prefixes (shared with MarkdownParser)
    CLI_PREFIXES = [
        "npm ", "npx ", "pip ", "cargo ", "go ", "docker ", "kubectl ",
        "git ", "python ", "node ", "deno ", "curl ", "wget ",
        "make ", "cmake ", "gcc ", "pipenv ", "poetry ", "bun ",
        "export ", "cd ", "ls ", "cat ", "echo ", "mkdir ", "rm ",
        "chmod ", "sudo ", "apt ", "brew ", "choco ", "winget ",
    ]

    def __init__(self, content: str, source: str = ""):
        self.content = content
        self.source = source
        self.lines = content.split("\n")

    def extract_title(self) -> str:
        """Extract title: first non-empty line, or source name."""
        for line in self.lines:
            stripped = line.strip()
            if stripped:
                return stripped
        return self.source or "Untitled"

    def extract_sections(self) -> List[Dict]:
        """
        Extract pseudo-sections from plain text.
        Sections are separated by blank lines; a line that looks like a header
        (short, possibly ALL CAPS or Title Case, no trailing period) becomes a title.
        """
        sections = []
        current_title = ""
        current_content = ""
        current_level = 1

        for line in self.lines:
            stripped = line.strip()

            if not stripped:
                # Blank line — might end a section
                if current_content.strip() or current_title:
                    # Only commit if we have content
                    pass
                continue

            # Detect header-like lines: short, no period at end, possibly ALL CAPS
            is_header = self._looks_like_header(stripped)

            if is_header:
                # Save previous section
                if current_content.strip():
                    sections.append({
                        "level": current_level,
                        "title": current_title or "Introduction",
                        "content": current_content.strip(),
                    })
                current_title = stripped
                current_content = ""
                current_level = 2
            else:
                current_content += line + "\n"

        # Save last section
        if current_content.strip():
            sections.append({
                "level": current_level,
                "title": current_title or "Content",
                "content": current_content.strip(),
            })

        return sections

    def _looks_like_header(self, line: str) -> bool:
        """Heuristic: does this line look like a section header?"""
        if len(line) > 80:
            return False
        if line.endswith((".", ",", ";", ":", "!", "?")):
            # Ends with colon might be a term definition start, not header
            if line.endswith(":"):
                # "Key Terms:" could be a header, but "Term: definition" is not
                words = line.rstrip(":").split()
                return len(words) <= 4
            return False
        # ALL CAPS line = likely header
        if line.isupper() and len(line) > 2:
            return True
        # Title Case with multiple words and short = likely header
        words = line.split()
        if 1 <= len(words) <= 6:
            # Check if most words are capitalized (Title Case)
            caps_count = sum(1 for w in words if w[0].isupper())
            if caps_count >= len(words) * 0.5 and len(words) >= 2:
                return True
        # Short standalone line (<= 5 words, no period)
        if len(words) <= 5 and not any(c.isdigit() for c in line):
            return True
        return False

    def extract_terms(self) -> List[Dict]:
        """
        Extract terminology from plain text.
        Patterns:
          - "Term - definition" (capitalized word(s) + dash + explanation)
          - "Term:" or "Term -" at line start
          - Standalone capitalized word followed by multi-line explanation
        """
        terms = []
        seen = set()

        # Pattern 0: Tab-separated "Term\tdefinition" (common in notes/spreadsheets)
        for line in self.lines:
            if '\t' in line:
                parts = line.split('\t', 1)
                if len(parts) == 2:
                    term = parts[0].strip()
                    definition = parts[1].strip()
                    if (term not in seen
                        and 1 <= len(term.split()) <= 5
                        and len(definition) > 5
                        and not term.lower().startswith(("the ", "this ", "that "))):
                        seen.add(term)
                        terms.append({"term": term, "definition": definition, "pattern": "tab_sep"})

        # Pattern 1: "Term - definition" or "Term — definition"
        for match in re.finditer(
            r'^([A-Z][\w\s]{1,40}?)\s*[\u2014\u2013\-:]\s*(.+)$',
            self.content, re.MULTILINE
        ):
            term = match.group(1).strip()
            definition = match.group(2).strip()
            # Filter out false positives: too many words = probably not a term
            if (term not in seen
                and len(term.split()) <= 4
                and len(definition) > 5
                and not term.lower().startswith(("the ", "this ", "that ", "these ", "those "))):
                seen.add(term)
                terms.append({"term": term, "definition": definition, "pattern": "dash_def"})

        # Pattern 2: "Term:" at start of line followed by explanation on next lines
        for i, line in enumerate(self.lines):
            match = re.match(r'^([A-Z][\w\s]{1,30}?):\s*$', line.strip())
            if match:
                term = match.group(1).strip()
                if term in seen or len(term.split()) > 4:
                    continue
                # Collect following lines as definition
                definition_lines = []
                for j in range(i + 1, min(i + 6, len(self.lines))):
                    next_line = self.lines[j].strip()
                    if not next_line or self._looks_like_header(next_line):
                        break
                    definition_lines.append(next_line)
                definition = " ".join(definition_lines)
                if len(definition) > 10:
                    seen.add(term)
                    terms.append({"term": term, "definition": definition, "pattern": "colon_def"})

        # Pattern 3: Short section titles from extract_sections() as terms
        for section in self.extract_sections():
            title = section["title"].strip()
            content = section["content"].strip()
            words = title.split()
            if (title not in seen
                and 1 <= len(words) <= 3
                and len(content) > 30
                and not title.lower().startswith(("how to", "step", "example", "note"))):
                seen.add(title)
                terms.append({"term": title, "definition": content[:300], "pattern": "section_title"})

        return terms

    def extract_instructions(self) -> List[Dict]:
        """
        Extract instructions/how-to from plain text.
        Detects: numbered lists, "How to" lines, imperative verb sequences.
        """
        instructions = []
        sections = self.extract_sections()

        for section in sections:
            content = section["content"]
            title = section["title"]

            # Detect numbered steps
            has_steps = bool(re.search(r'^\s*\d+[.\)]\s', content, re.MULTILINE))

            # Detect imperative verbs at start of lines
            has_imperative = bool(re.search(
                r'^(?:\s*[-*\u2022]\s+(?:run|create|add|install|open|use|set|configure|'
                r'build|deploy|start|stop|enable|disable|check|verify|test|make|pull|push))',
                content, re.MULTILINE | re.IGNORECASE
            ))

            # Detect "How to" in title
            is_howto = "how to" in title.lower() or "how-to" in title.lower()

            if is_howto or has_steps or has_imperative:
                instructions.append({
                    "title": title,
                    "content": content.strip(),
                    "section_level": section["level"],
                    "has_code": bool(re.search(r'(?:git |npm |pip |python |docker )', content)),
                    "has_steps": has_steps,
                })

        # Also detect standalone numbered sequences not in sections
        current_steps = []
        step_title = ""
        for line in self.lines:
            if re.match(r'^\s*\d+[.\)]\s', line):
                if not current_steps:
                    # Look back for a title
                    pass
                current_steps.append(line.strip())
            else:
                if len(current_steps) >= 3:
                    # We found a step sequence
                    title_words = []
                    for prev_line in reversed(self.lines[:self.lines.index(line) - len(current_steps)]):
                        prev_stripped = prev_line.strip()
                        if prev_stripped and not prev_stripped.startswith(("1.", "2.", "3.")):
                            title_words.insert(0, prev_stripped)
                            if len(title_words) >= 2:
                                break
                    step_title = " ".join(title_words) if title_words else "Steps"
                    instructions.append({
                        "title": step_title,
                        "content": "\n".join(current_steps),
                        "section_level": 2,
                        "has_code": bool(re.search(r'(?:git |npm |pip |python |docker )', "\n".join(current_steps))),
                        "has_steps": True,
                    })
                current_steps = []

        return instructions

    def extract_commands(self) -> List[Dict]:
        """Extract CLI commands from plain text (lines starting with known prefixes)."""
        commands = []
        seen_cmds = set()

        for line in self.lines:
            stripped = line.strip().lstrip("$> ")
            if not stripped or stripped.startswith("#"):
                continue

            is_cmd = any(stripped.startswith(prefix) for prefix in self.CLI_PREFIXES)
            if is_cmd and stripped not in seen_cmds:
                seen_cmds.add(stripped)
                commands.append({
                    "command": stripped[:120],
                    "full_code": stripped,
                    "language": "shell",
                    "source_section": "",
                })

        return commands

    def extract_tags(self) -> List[str]:
        """Auto-generate tags from plain text content."""
        tags = set()

        # Technology name patterns (same as MarkdownParser)
        tech_patterns = [
            r'\b(react|nextjs|next\.js|vue|angular|svelte|typescript|javascript|python|rust|go|golang)\b',
            r'\b(docker|kubernetes|k8s|nginx|postgres|mysql|redis|mongodb|elasticsearch)\b',
            r'\b(git|github|gitlab|ci/cd|jenkins|github\.actions)\b',
            r'\b(prisma|drizzle|typeorm|sequelize|supabase|firebase)\b',
            r'\b(tailwind|css|scss|sass|bootstrap|chakra)\b',
            r'\b(chromadb|langchain|openai|anthropic|ollama|llm|rag)\b',
            r'\b(linux|ubuntu|debian|macos|windows|wsl)\b',
        ]
        for pattern in tech_patterns:
            for match in re.finditer(pattern, self.content, re.IGNORECASE):
                tags.add(match.group(1).lower().replace(".js", "js"))

        # Section titles as tags (strip trailing punctuation and special chars)
        for section in self.extract_sections():
            title = section["title"].strip()
            # Remove markdown backticks, parens, numbers prefix
            title = re.sub(r'[`()]', '', title)
            title = re.sub(r'^\d+\.\s*', '', title)
            title = title.rstrip(":;.,!?").strip()
            words = title.split()
            if 1 <= len(words) <= 3 and title.isascii() and title and len(title) > 1:
                tags.add(title.lower().replace(" ", "-"))

        return sorted(tags)


def detect_parser(content: str, source: str = "") -> object:
    """
    Auto-detect which parser to use based on content and file extension.
    Returns MarkdownParser or PlainTextParser instance.
    """
    # Check file extension
    source_lower = source.lower()
    if source_lower.endswith(".txt"):
        return PlainTextParser(content, source)

    # Check if content has markdown formatting
    md_signals = [
        bool(re.search(r'^#{1,6}\s', content, re.MULTILINE)),  # headings
        bool(re.search(r'\*\*[^*]+\*\*', content)),             # bold
        bool(re.search(r'```', content)),                        # code blocks
        bool(re.search(r'^\|.*\|$', content, re.MULTILINE)),    # tables
        bool(re.search(r'^---', content)),                       # frontmatter
    ]
    md_score = sum(md_signals)

    if md_score >= 2:
        return MarkdownParser(content, source)
    elif md_score == 0:
        return PlainTextParser(content, source)
    else:
        # Ambiguous — try markdown first since it has richer extraction
        return MarkdownParser(content, source)


# ── LLM Extractor (via ai_extract.mjs bridge) ─────────────

class LLMExtractor:
    """
    AI-powered extraction using z-ai-web-dev-sdk via Node.js bridge.
    Provides richer, context-aware extraction than regex heuristics.
    """

    def __init__(self, content: str, source: str = ""):
        self.content = content
        self.source = source

    def _call_bridge(self, mode: str, input_content: str = None) -> Dict:
        """Call ai_extract.mjs and return parsed JSON."""
        if not AI_EXTRACT_BRIDGE.exists():
            raise FileNotFoundError(
                f"AI bridge not found: {AI_EXTRACT_BRIDGE}\n"
                f"Make sure ai_extract.mjs is in the same directory as doc_intelligence.py"
            )

        input_data = input_content or self.content

        try:
            result = subprocess.run(
                ["node", str(AI_EXTRACT_BRIDGE), mode],
                input=input_data,
                capture_output=True,
                text=True,
                timeout=60,
            )

            if result.returncode != 0:
                stderr = result.stderr.strip()
                raise RuntimeError(f"ai_extract.mjs failed: {stderr}")

            return json.loads(result.stdout.strip())

        except subprocess.TimeoutExpired:
            raise RuntimeError("AI extraction timed out (60s)")
        except json.JSONDecodeError as e:
            raise RuntimeError(f"Failed to parse AI response: {e}")

    def extract_terms(self) -> List[Dict]:
        """Extract terms with LLM - returns term + translation + explanation."""
        try:
            data = self._call_bridge("terms")
        except Exception as e:
            print(f"  WARNING: LLM terms extraction failed: {e}", file=sys.stderr)
            return []

        items = data.get("items", [])
        terms = []
        seen = set()

        for item in items:
            term = item.get("term", "").strip()
            if not term or term in seen:
                continue
            seen.add(term)
            terms.append({
                "term": term,
                "definition": item.get("explanation", ""),
                "translation": item.get("translation", ""),
                "usage": item.get("usage", ""),
                "pattern": "llm",
            })

        return terms

    def extract_instructions(self) -> List[Dict]:
        """Extract step-by-step instructions with LLM."""
        try:
            data = self._call_bridge("instructions")
        except Exception as e:
            print(f"  WARNING: LLM instructions extraction failed: {e}", file=sys.stderr)
            return []

        items = data.get("items", [])
        instructions = []

        for item in items:
            steps = item.get("steps", [])
            has_code = any(
                block.get("code", "")
                for step in steps
                for block in step.get("codeBlocks", [])
            )
            instructions.append({
                "title": item.get("title", ""),
                "description": item.get("description", ""),
                "content": json.dumps(steps, ensure_ascii=False),
                "steps": steps,
                "has_code": has_code,
                "has_steps": len(steps) > 0,
                "pattern": "llm",
            })

        return instructions

    def extract_commands(self) -> List[Dict]:
        """Extract CLI commands with LLM."""
        try:
            data = self._call_bridge("commands")
        except Exception as e:
            print(f"  WARNING: LLM commands extraction failed: {e}", file=sys.stderr)
            return []

        items = data.get("items", [])
        commands = []
        seen = set()

        for item in items:
            cmd = item.get("command", "").strip()
            if not cmd or cmd in seen:
                continue
            seen.add(cmd)
            commands.append({
                "command": cmd,
                "full_code": item.get("full_code", cmd),
                "language": item.get("language", "shell"),
                "description": item.get("description", ""),
                "source_section": "",
                "pattern": "llm",
            })

        return commands

    def analyze(self) -> Dict:
        """Analyze document: summary, tags, category, difficulty."""
        try:
            data = self._call_bridge("analyze")
        except Exception as e:
            print(f"  WARNING: LLM analysis failed: {e}", file=sys.stderr)
            return {
                "summary": "",
                "suggested_tags": [],
                "category": "",
                "difficulty": "",
            }

        return {
            "summary": data.get("summary", ""),
            "suggested_tags": data.get("suggested_tags", []),
            "category": data.get("category", ""),
            "difficulty": data.get("difficulty", ""),
        }


# ── Document Ingestion ─────────────────────────────────────

def ingest_document(
    content: str,
    source: str = "",
    no_graph: bool = False,
    dry_run: bool = False,
    use_llm: bool = False,
) -> Dict:
    """
    Ingest a document: parse, extract, store to ChromaDB, create graph edges.

    Args:
        content: Markdown content
        source: Source identifier (file path, URL, etc.)
        no_graph: Skip graph edge creation
        dry_run: Preview only, don't store
        use_llm: Use LLM-powered extraction instead of regex

    Returns a summary dict of what was extracted and stored.
    """
    from memory_cli import get_client, store_entry, get_graph_engine, check_duplicate

    # Auto-detect parser: MarkdownParser for .md, PlainTextParser for .txt
    parser = detect_parser(content, source)
    title = parser.extract_title()
    sections = parser.extract_sections()

    # Choose extraction engine
    if use_llm:
        llm = LLMExtractor(content, source)
        terms = llm.extract_terms()
        instructions = llm.extract_instructions()
        commands = llm.extract_commands()
        api_endpoints = parser.extract_api_endpoints()
        api_functions = parser.extract_api_functions()
        analysis = llm.analyze()
        # Merge regex tags + LLM suggested tags
        regex_tags = parser.extract_tags()
        llm_tags = analysis.get("suggested_tags", [])
        tags = sorted(set(regex_tags) | set(llm_tags))
    else:
        terms = parser.extract_terms()
        instructions = parser.extract_instructions()
        commands = parser.extract_commands()
        api_endpoints = parser.extract_api_endpoints()
        api_functions = parser.extract_api_functions()
        tags = parser.extract_tags()
        analysis = {}

    result = {
        "title": title,
        "source": source,
        "sections": len(sections),
        "terms": len(terms),
        "instructions": len(instructions),
        "commands": len(commands),
        "api_endpoints": len(api_endpoints),
        "api_functions": len(api_functions),
        "tags": tags,
        "analysis": analysis,
        "mode": "llm" if use_llm else "regex",
        "stored_ids": [],
        "edges_created": [],
    }

    if dry_run:
        result["terms_detail"] = terms[:8]
        result["instructions_detail"] = [
            {"title": i["title"], "has_code": i["has_code"], "steps_count": len(i.get("steps", []))}
            for i in instructions
        ]
        result["commands_detail"] = [c["command"] for c in commands[:8]]
        return result

    client = get_client()

    # Ensure 'command' collection exists
    try:
        client.get_or_create_collection(name="command", metadata={"type": "command"})
    except Exception:
        pass

    # 1. Store source document as 'project' entry
    doc_metadata = {
        "source": source,
        "title": title,
        "doc_type": "markdown",
        "tags": ",".join(tags),
        "verification_status": "unverified",
    }
    if analysis:
        doc_metadata["summary"] = analysis.get("summary", "")
        doc_metadata["category"] = analysis.get("category", "")
        doc_metadata["difficulty"] = analysis.get("difficulty", "")

    doc_id = store_entry(
        "project",
        content,
        metadata=doc_metadata,
        no_graph=True,
        dedup=False,  # Always store full document
    )
    result["stored_ids"].append(doc_id)

    # 2. Store extracted terms as 'knowledge' entries
    engine = None
    if not no_graph:
        try:
            engine = get_graph_engine()
            engine.load()
        except Exception:
            engine = None

    for term in terms:
        term_content = term["definition"]
        if term.get("translation"):
            term_content = f"{term['translation']}\n\n{term_content}"
        if term.get("usage"):
            term_content += f"\n\nUsage:\n{term['usage']}"

        term_id = store_entry(
            "knowledge",
            term_content,
            metadata={
                "term": term["term"],
                "pattern": term.get("pattern", "unknown"),
                "source": source,
                "tags": ",".join(tags),
                "verification_status": "unverified",
            },
            no_graph=True,
        )
        result["stored_ids"].append(term_id)

        if engine:
            engine.add_edge(doc_id, term_id, "defines_term")
            result["edges_created"].append(f"{doc_id} --defines_term--> {term_id}")

    # 3. Store instructions as 'pattern' entries
    for inst in instructions:
        # For LLM instructions, store structured steps as JSON
        inst_content = inst["content"]
        if inst.get("description"):
            inst_content = f"{inst['description']}\n\n{inst_content}"

        inst_id = store_entry(
            "pattern",
            inst_content,
            metadata={
                "title": inst["title"],
                "has_code": str(inst.get("has_code", False)),
                "has_steps": str(inst.get("has_steps", False)),
                "source": source,
                "tags": ",".join(tags),
                "verification_status": "unverified",
            },
            no_graph=True,
        )
        result["stored_ids"].append(inst_id)

        if engine:
            engine.add_edge(doc_id, inst_id, "has_instruction")
            result["edges_created"].append(f"{doc_id} --has_instruction--> {inst_id}")

    # 4. Store commands as 'command' entries
    for cmd in commands:
        cmd_id = store_entry(
            "command",
            cmd["full_code"],
            metadata={
                "command": cmd["command"][:100],
                "language": cmd.get("language", "text"),
                "source": source,
                "tags": ",".join(tags),
                "verification_status": "unverified",
            },
            no_graph=True,
        )
        result["stored_ids"].append(cmd_id)

        if engine:
            engine.add_edge(doc_id, cmd_id, "has_command")
            result["edges_created"].append(f"{doc_id} --has_command--> {cmd_id}")

    # 4b. Store API endpoints as 'knowledge' entries
    for ep in api_endpoints:
        ep_id = store_entry(
            "knowledge",
            f"API Endpoint: {ep['method']} {ep['path']}",
            metadata={
                "term": ep["endpoint"][:100],
                "pattern": "api_endpoint",
                "method": ep["method"],
                "path": ep["path"],
                "source": source,
                "tags": ",".join(tags),
                "verification_status": "unverified",
            },
            no_graph=True,
        )
        result["stored_ids"].append(ep_id)
        if engine:
            engine.add_edge(doc_id, ep_id, "has_api_endpoint")
            result["edges_created"].append(f"{doc_id} --has_api_endpoint--> {ep_id}")

    # 4c. Store API functions as 'knowledge' entries
    for fn in api_functions:
        fn_id = store_entry(
            "knowledge",
            f"API Function: {fn['name']}\n{fn['signature']}",
            metadata={
                "term": fn["name"],
                "pattern": "api_function",
                "language": fn.get("language", "typescript"),
                "context": fn.get("context", ""),
                "source": source,
                "tags": ",".join(tags),
                "verification_status": "unverified",
            },
            no_graph=True,
        )
        result["stored_ids"].append(fn_id)
        if engine:
            engine.add_edge(doc_id, fn_id, "has_api_function")
            result["edges_created"].append(f"{doc_id} --has_api_function--> {fn_id}")

    # 5. Create tag edges (doc --tagged_with--> tag)
    if engine:
        for tag in tags:
            tag_node = f"tag:{tag}"
            engine.add_edge(doc_id, tag_node, "tagged_with")
            result["edges_created"].append(f"{doc_id} --tagged_with--> {tag_node}")

        engine.save()

    return result


# ── CLI ────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Document Intelligence for ZCODE Memory System",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python doc_intelligence.py extract README.md
    python doc_intelligence.py extract README.md --llm
    python doc_intelligence.py ingest README.md
    python doc_intelligence.py ingest README.md --llm
    python doc_intelligence.py ingest --stdin < doc.md
    python doc_intelligence.py ingest doc.md --source wiki
    python doc_intelligence.py batch ./docs/
    python doc_intelligence.py batch ./docs/ --llm
        """
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Shared LLM flag
    def add_llm_flag(p):
        p.add_argument("--llm", action="store_true",
                       help="Use LLM (z-ai-web-dev-sdk) for extraction instead of regex")

    # ingest
    ingest_p = subparsers.add_parser("ingest", help="Ingest a markdown document")
    ingest_p.add_argument("file", nargs="?", help="Markdown file to ingest")
    ingest_p.add_argument("--stdin", action="store_true", help="Read from stdin")
    ingest_p.add_argument("--source", "-s", default="", help="Source tag (e.g. 'wiki', 'readme')")
    ingest_p.add_argument("--no-graph", action="store_true", help="Skip graph edge creation")
    add_llm_flag(ingest_p)

    # extract (preview)
    extract_p = subparsers.add_parser("extract", help="Preview extraction without storing")
    extract_p.add_argument("file", help="Markdown file to analyze")
    add_llm_flag(extract_p)

    # batch
    batch_p = subparsers.add_parser("batch", help="Ingest all .md files in directory")
    batch_p.add_argument("directory", help="Directory to scan")
    batch_p.add_argument("--source", "-s", default="", help="Source tag for all files")
    batch_p.add_argument("--no-graph", action="store_true", help="Skip graph edge creation")
    add_llm_flag(batch_p)

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    # Change CWD to tools directory so imports work
    tools_dir = Path(__file__).parent
    if tools_dir != Path.cwd():
        os.chdir(tools_dir)
        sys.path.insert(0, str(tools_dir))

    use_llm = getattr(args, 'llm', False)
    mode_label = "LLM" if use_llm else "regex"

    if args.command == "ingest":
        if args.stdin:
            content = sys.stdin.read()
            source = args.source or "stdin"
        elif args.file:
            path = Path(args.file)
            if not path.exists():
                print(f"ERROR: File not found: {path}")
                sys.exit(1)
            content = path.read_text(encoding="utf-8")
            source = args.source or str(path)
        else:
            print("ERROR: Provide a file or use --stdin")
            sys.exit(1)

        print(f"Ingesting [{mode_label}]: {source}")
        print("=" * 50)

        result = ingest_document(content, source=source, no_graph=args.no_graph, use_llm=use_llm)

        print(f"\nDocument: {result['title']}")
        print(f"Mode: {result['mode']}")
        print(f"Sections: {result['sections']}")
        print(f"Terms extracted: {result['terms']}")
        print(f"Instructions: {result['instructions']}")
        print(f"Commands: {result['commands']}")
        print(f"Tags: {', '.join(result['tags'])}")

        if result.get('analysis', {}).get('summary'):
            print(f"\nSummary: {result['analysis']['summary']}")

        print(f"\nEntries stored: {len(result['stored_ids'])}")
        print(f"Graph edges: {len(result['edges_created'])}")

    elif args.command == "extract":
        path = Path(args.file)
        if not path.exists():
            print(f"ERROR: File not found: {path}")
            sys.exit(1)

        content = path.read_text(encoding="utf-8")
        result = ingest_document(content, source=str(path), dry_run=True, use_llm=use_llm)

        print(f"Dry-run [{mode_label}]: {result['title']}")
        print("=" * 50)
        print(f"Sections: {result['sections']}")
        print(f"Terms: {result['terms']}")
        print(f"Instructions: {result['instructions']}")
        print(f"Commands: {result['commands']}")
        print(f"Tags: {', '.join(result['tags'])}")

        if result.get('analysis', {}).get('summary'):
            print(f"\nAI Summary: {result['analysis']['summary']}")
            if result['analysis'].get('category'):
                print(f"Category: {result['analysis']['category']}")
            if result['analysis'].get('difficulty'):
                print(f"Difficulty: {result['analysis']['difficulty']}")

        if result.get('terms_detail'):
            print(f"\nExtracted terms:")
            for t in result['terms_detail']:
                pattern = t.get('pattern', '?')
                term = t['term']
                definition = t.get('definition', '')[:80]
                translation = t.get('translation', '')
                if translation:
                    print(f"  [{pattern}] {term} = {translation}")
                    print(f"           {definition}...")
                else:
                    print(f"  [{pattern}] {term}: {definition}...")

        if result.get('instructions_detail'):
            print(f"\nInstructions:")
            for i in result['instructions_detail']:
                code_flag = " [code]" if i.get('has_code') else ""
                steps = i.get('steps_count', '?')
                print(f"  - {i['title']} ({steps} steps){code_flag}")

        if result.get('commands_detail'):
            print(f"\nCommands:")
            for c in result['commands_detail']:
                print(f"  $ {c}")

    elif args.command == "batch":
        directory = Path(args.directory)
        if not directory.is_dir():
            print(f"ERROR: Not a directory: {directory}")
            sys.exit(1)

        md_files = sorted(directory.rglob("*.md"))
        if not md_files:
            print(f"No .md files found in {directory}")
            sys.exit(0)

        print(f"Found {len(md_files)} markdown files [{mode_label}]")

        total = {"entries": 0, "edges": 0, "terms": 0, "commands": 0, "instructions": 0}
        for i, path in enumerate(md_files, 1):
            print(f"\n[{i}/{len(md_files)}] {path.name}...")
            try:
                content = path.read_text(encoding="utf-8")
                result = ingest_document(
                    content, source=str(path),
                    no_graph=args.no_graph, use_llm=use_llm
                )
                total["entries"] += len(result["stored_ids"])
                total["edges"] += len(result["edges_created"])
                total["terms"] += result["terms"]
                total["commands"] += result["commands"]
                total["instructions"] += result["instructions"]
                print(f"  Terms: {result['terms']}, Instructions: {result['instructions']}, Commands: {result['commands']}")
            except Exception as e:
                print(f"  ERROR: {e}")

        print(f"\n{'=' * 50}")
        print(f"Batch complete [{mode_label}]!")
        print(f"Files: {len(md_files)}")
        print(f"Total entries: {total['entries']}")
        print(f"Total edges: {total['edges']}")
        print(f"Total terms: {total['terms']}")
        print(f"Total instructions: {total['instructions']}")
        print(f"Total commands: {total['commands']}")


if __name__ == "__main__":
    main()
