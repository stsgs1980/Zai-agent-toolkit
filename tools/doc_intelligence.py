#!/usr/bin/env python3
"""
Document Intelligence for ZCode Memory System
Parses Markdown documents, extracts terminology, instructions, commands, and tags.
Uses ChromaDB's built-in embedding for semantic grouping (no external LLM needed).

Usage:
    python doc_intelligence.py ingest doc.md                  # Ingest a markdown file
    python doc_intelligence.py ingest --stdin < doc.md        # Ingest from stdin
    python doc_intelligence.py ingest doc.md --source wiki    # Custom source tag
    python doc_intelligence.py extract doc.md                 # Preview extraction without storing
    python doc_intelligence.py batch ./docs/                  # Ingest all .md files in directory
"""

import argparse
import json
import os
import re
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

# ── Markdown Parser ────────────────────────────────────────

class MarkdownParser:
    """Parse markdown and extract structured knowledge."""

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
            # Skip content before first heading

        if current:
            sections.append(current)

        return sections

    def extract_terms(self) -> List[Dict]:
        """
        Extract terminology/definitions.
        Patterns:
          - **Term**: definition
          - **Term** — definition
          - `Term` — definition
          - ## Term / ### Term (short heading likely a term)
          - | Term | Definition | (table rows)
        """
        terms = []
        seen = set()

        # Pattern 1: **Bold term**: definition
        for match in re.finditer(r'\*\*([^*]+)\*\*\s*[:—–-]\s*(.+)', self.content):
            term = match.group(1).strip()
            definition = match.group(2).strip()
            if term not in seen and len(definition) > 5:
                seen.add(term)
                terms.append({"term": term, "definition": definition, "pattern": "bold_def"})

        # Pattern 2: `Code term` — definition
        for match in re.finditer(r'`([^`]+)`\s*[:—–-]\s*(.+)', self.content):
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
                    # Skip separator rows like |---|---|
                    if all(set(c) <= {"-", ":", " "} for c in cells):
                        in_table = True
                        continue
                    if in_table and cells[0] and cells[1]:
                        term = cells[0].strip("*` ")
                        definition = cells[1].strip()
                        if term not in seen and len(term) < 50 and len(definition) > 3:
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
        Extract instructions/how-to steps.
        Patterns:
          - Numbered lists (1. 2. 3.)
          - Step headers: ## Step 1, ## How to X
          - Code blocks with comments explaining steps
          - Bulleted action lists with imperative verbs
        """
        instructions = []
        sections = self.extract_sections()

        for section in sections:
            content = section["content"]
            title = section["title"]
            title_lower = title.lower()

            # Check if section looks like instructions
            is_howto = any(kw in title_lower for kw in ["how to", "how-to", "howto", "guide", "tutorial", "setup", "install", "configure", "getting started"])
            has_steps = bool(re.search(r'^\s*\d+[\.\)]\s', content, re.MULTILINE))
            has_code = "```" in content
            has_imperative = bool(re.search(r'^(?:\s*[-*•]\s+(?:run|create|add|install|open|use|set|configure|build|deploy|start|stop|enable|disable|check|verify|test))', content, re.MULTILINE | re.IGNORECASE))

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
        """
        Extract CLI commands and code recipes.
        Patterns:
          - Code blocks containing shell commands
          - Lines starting with $ or > or #
          - npm/pip/cargo/go/docker/git/kubectl commands
        """
        commands = []
        seen_cmds = set()

        # Extract from code blocks
        in_code_block = False
        code_lang = ""
        code_buf = []

        for line in self.lines:
            if line.strip().startswith("```"):
                if in_code_block:
                    # End of code block
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
                    # Start of code block
                    code_lang = line.strip()[3:].strip().lower()
                    in_code_block = True
                    code_buf = []
            elif in_code_block:
                code_buf.append(line)

        # Also extract inline code that looks like commands
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

    def _looks_like_command(self, code: str, lang: str) -> bool:
        """Heuristic: does this code block contain CLI commands?"""
        if lang in ("bash", "sh", "shell", "zsh", "fish", "powershell", "cmd", "bat"):
            return True
        # Check for common command prefixes
        cli_prefixes = ["npm ", "pip ", "cargo ", "go ", "docker ", "kubectl ",
                       "git ", "python ", "node ", "deno ", "curl ", "wget ",
                       "make ", "cmake ", "gcc ", "pipenv ", "poetry "]
        first_line = code.split("\n")[0].strip().lstrip("$> ")
        return any(first_line.startswith(p) for p in cli_prefixes)

    def _is_cli_command(self, code: str) -> bool:
        """Check if inline code is a CLI command."""
        code = code.strip().lstrip("$> ")
        cli_prefixes = ["npm ", "pip ", "cargo ", "go ", "docker ", "kubectl ",
                       "git ", "python ", "node ", "curl ", "make "]
        return any(code.startswith(p) for p in cli_prefixes)

    def _first_command_line(self, code: str) -> str:
        """Extract the primary command from a code block."""
        for line in code.split("\n"):
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            line = line.lstrip("$> ")
            if line:
                return line[:120]
        return ""

    def extract_tags(self) -> List[str]:
        """
        Auto-generate tags from content.
        - Existing tags (frontmatter, #tag patterns)
        - Key terms from headings
        - Technology names
        """
        tags = set()

        # Pattern 1: YAML frontmatter tags
        if self.content.startswith("---"):
            end = self.content.find("---", 3)
            if end > 0:
                frontmatter = self.content[3:end]
                for match in re.finditer(r'tags?:\s*\[(.+?)\]', frontmatter):
                    for tag in match.group(1).split(","):
                        tag = tag.strip().strip("\"'")
                        if tag:
                            tags.add(tag.lower())
                for match in re.finditer(r'-\s+(.+)', frontmatter):
                    tag = match.group(1).strip().strip("\"'")
                    if tag and not tag.startswith("http"):
                        tags.add(tag.lower())

        # Pattern 2: #tag patterns in content
        for match in re.finditer(r'(?:^|\s)#([a-zA-Z][\w-]*)', self.content):
            tag = match.group(1).lower()
            if tag not in ("title", "description", "summary", "note", "todo", "fixme",
                          "see", "ref", "source", "date", "author"):
                tags.add(tag)

        # Pattern 3: Technology names from headings and code
        tech_patterns = [
            r'\b(react|nextjs|next\.js|vue|angular|svelte|typescript|javascript|python|rust|go|golang)\b',
            r'\b(docker|kubernetes|k8s|nginx|postgres|mysql|redis|mongodb|elasticsearch)\b',
            r'\b(git|github|gitlab|ci/cd|jenkins|github.actions)\b',
            r'\b(prisma|drizzle|typeorm|sequelize|supabase|firebase)\b',
            r'\b(tailwind|css|scss|sass|bootstrap|chakra)\b',
            r'\b(chromadb|langchain|openai|anthropic|ollama|llm|rag)\b',
            r'\b(linux|ubuntu|debian|macos|windows|wsl)\b',
        ]
        for pattern in tech_patterns:
            for match in re.finditer(pattern, self.content, re.IGNORECASE):
                tags.add(match.group(1).lower())

        # Pattern 4: Section headings (short ones are likely tags)
        for section in self.extract_sections():
            title = section["title"].strip()
            words = title.split()
            if 1 <= len(words) <= 3 and title.isascii():
                tags.add(title.lower().replace(" ", "-"))

        return sorted(tags)


# ── Document Ingestion ─────────────────────────────────────

def ingest_document(
    content: str,
    source: str = "",
    no_graph: bool = False,
    dry_run: bool = False,
) -> Dict:
    """
    Ingest a document: parse, extract, store to ChromaDB, create graph edges.

    Returns a summary dict of what was extracted and stored.
    """
    from memory_cli import get_client, store_entry, get_graph_engine

    parser = MarkdownParser(content, source)
    title = parser.extract_title()
    sections = parser.extract_sections()
    terms = parser.extract_terms()
    instructions = parser.extract_instructions()
    commands = parser.extract_commands()
    tags = parser.extract_tags()

    result = {
        "title": title,
        "source": source,
        "sections": len(sections),
        "terms": len(terms),
        "instructions": len(instructions),
        "commands": len(commands),
        "tags": tags,
        "stored_ids": [],
        "edges_created": [],
    }

    if dry_run:
        result["terms_detail"] = terms[:5]
        result["instructions_detail"] = [{"title": i["title"], "has_code": i["has_code"]} for i in instructions]
        result["commands_detail"] = [c["command"] for c in commands[:5]]
        return result

    client = get_client()

    # Ensure 'command' collection exists
    try:
        client.get_or_create_collection(name="command", metadata={"type": "command"})
    except Exception:
        pass

    # 1. Store source document as 'project' entry
    doc_id = store_entry(
        "project",
        content,
        metadata={
            "source": source,
            "title": title,
            "doc_type": "markdown",
            "tags": ",".join(tags),
        },
        no_graph=True,  # We'll create custom edges
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
        term_id = store_entry(
            "knowledge",
            term["definition"],
            metadata={
                "term": term["term"],
                "pattern": term["pattern"],
                "source": source,
                "tags": ",".join(tags),
            },
            no_graph=True,
        )
        result["stored_ids"].append(term_id)

        # Create edge: doc defines_term term
        if engine:
            engine.add_edge(doc_id, term_id, "defines_term")
            result["edges_created"].append(f"{doc_id} --defines_term--> {term_id}")

    # 3. Store instructions as 'pattern' entries
    for inst in instructions:
        inst_id = store_entry(
            "pattern",
            inst["content"],
            metadata={
                "title": inst["title"],
                "has_code": str(inst["has_code"]),
                "has_steps": str(inst["has_steps"]),
                "source": source,
                "tags": ",".join(tags),
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
                "language": cmd["language"],
                "source": source,
                "tags": ",".join(tags),
            },
            no_graph=True,
        )
        result["stored_ids"].append(cmd_id)

        if engine:
            engine.add_edge(doc_id, cmd_id, "has_command")
            result["edges_created"].append(f"{doc_id} --has_command--> {cmd_id}")

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
        description="Document Intelligence for ZCode Memory System",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python doc_intelligence.py ingest README.md
    python doc_intelligence.py ingest --stdin < doc.md
    python doc_intelligence.py extract doc.md
    python doc_intelligence.py batch ./docs/
        """
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # ingest
    ingest_p = subparsers.add_parser("ingest", help="Ingest a markdown document")
    ingest_p.add_argument("file", nargs="?", help="Markdown file to ingest")
    ingest_p.add_argument("--stdin", action="store_true", help="Read from stdin")
    ingest_p.add_argument("--source", "-s", default="", help="Source tag (e.g. 'wiki', 'readme')")
    ingest_p.add_argument("--no-graph", action="store_true", help="Skip graph edge creation")

    # extract (preview)
    extract_p = subparsers.add_parser("extract", help="Preview extraction without storing")
    extract_p.add_argument("file", help="Markdown file to analyze")

    # batch
    batch_p = subparsers.add_parser("batch", help="Ingest all .md files in directory")
    batch_p.add_argument("directory", help="Directory to scan")
    batch_p.add_argument("--source", "-s", default="", help="Source tag for all files")
    batch_p.add_argument("--no-graph", action="store_true", help="Skip graph edge creation")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    # Change CWD to tools directory so imports work
    tools_dir = Path(__file__).parent
    if tools_dir != Path.cwd():
        os.chdir(tools_dir)
        sys.path.insert(0, str(tools_dir))

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

        print(f"Ingesting: {source}")
        print("=" * 50)

        result = ingest_document(content, source=source, no_graph=args.no_graph)

        print(f"\nDocument: {result['title']}")
        print(f"Sections: {result['sections']}")
        print(f"Terms extracted: {result['terms']}")
        print(f"Instructions: {result['instructions']}")
        print(f"Commands: {result['commands']}")
        print(f"Tags: {', '.join(result['tags'])}")
        print(f"Entries stored: {len(result['stored_ids'])}")
        print(f"Graph edges: {len(result['edges_created'])}")

        if result['terms'] > 0:
            print(f"\nTop terms:")
            for t in (result.get('terms_detail') or [])[:5]:
                print(f"  - {t['term']}: {t['definition'][:60]}...")

        if result['commands'] > 0:
            print(f"\nCommands found:")
            for c in (result.get('commands_detail') or [])[:5]:
                print(f"  $ {c}")

    elif args.command == "extract":
        path = Path(args.file)
        if not path.exists():
            print(f"ERROR: File not found: {path}")
            sys.exit(1)

        content = path.read_text(encoding="utf-8")
        result = ingest_document(content, source=str(path), dry_run=True)

        print(f"Dry-run extraction: {result['title']}")
        print("=" * 50)
        print(f"Sections: {result['sections']}")
        print(f"Terms: {result['terms']}")
        print(f"Instructions: {result['instructions']}")
        print(f"Commands: {result['commands']}")
        print(f"Tags: {', '.join(result['tags'])}")

        if result.get('terms_detail'):
            print(f"\nExtracted terms:")
            for t in result['terms_detail']:
                print(f"  [{t['pattern']}] {t['term']}: {t['definition'][:80]}...")

        if result.get('instructions_detail'):
            print(f"\nInstructions:")
            for i in result['instructions_detail']:
                code_flag = " [code]" if i['has_code'] else ""
                print(f"  - {i['title']}{code_flag}")

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

        print(f"Found {len(md_files)} markdown files")

        total = {"entries": 0, "edges": 0, "terms": 0, "commands": 0}
        for i, path in enumerate(md_files, 1):
            print(f"\n[{i}/{len(md_files)}] {path.name}...")
            try:
                content = path.read_text(encoding="utf-8")
                result = ingest_document(content, source=str(path), no_graph=args.no_graph)
                total["entries"] += len(result["stored_ids"])
                total["edges"] += len(result["edges_created"])
                total["terms"] += result["terms"]
                total["commands"] += result["commands"]
                print(f"  Terms: {result['terms']}, Instructions: {result['instructions']}, Commands: {result['commands']}")
            except Exception as e:
                print(f"  ERROR: {e}")

        print(f"\n{'=' * 50}")
        print(f"Batch complete!")
        print(f"Files: {len(md_files)}")
        print(f"Total entries: {total['entries']}")
        print(f"Total edges: {total['edges']}")
        print(f"Total terms: {total['terms']}")
        print(f"Total commands: {total['commands']}")


if __name__ == "__main__":
    main()
