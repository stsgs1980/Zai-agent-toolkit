---
name: memory-store
id: ZAI-MEM-001
version: 1.0
compatibility: both
description: "Store information in the ZCode memory system (ChromaDB) for semantic search. Use when you need to save sessions, knowledge, patterns, project structures, or templates for future reference."
trigger: store memory, save to memory, remember this, memorize
---


# Skill: Memory Store v1.0


> ID: ZAI-MEM-001
> Version: 1.0
> Last Updated: 2026-05

Store information in the ZCode memory system (ChromaDB).

## Purpose

Save sessions, knowledge, patterns, project structures, and templates
for future reference and semantic search.

## Usage

```bash
python ~/.zcode/tools/memory_cli.py store <type> "<content>" [--metadata '{"key": "value"}']
```

## Entry Types

| Type | Description |
|------|-------------|
| session | Session logs and progress |
| knowledge | Extracted knowledge and insights |
| pattern | Code patterns and solutions |
| project | Project structure and architecture |
| template | Reusable templates and snippets |

## Examples

### Store Session

```bash
python ~/.zcode/tools/memory_cli.py store session "Completed authentication refactor. Moved from JWT to session-based auth. Key files: auth.ts, session.ts"
```

### Store Knowledge

```bash
python ~/.zcode/tools/memory_cli.py store knowledge "React useCallback prevents unnecessary re-renders when passing functions to child components" --metadata '{"category": "react", "tags": ["performance", "hooks"]}'
```

### Store Pattern

```bash
python ~/.zcode/tools/memory_cli.py store pattern "Error handling pattern: try-catch with custom error class and centralized error logger" --metadata '{"language": "typescript"}'
```

### Store Project Structure

```bash
python ~/.zcode/tools/memory_cli.py store project "E-commerce app: Next.js 14, Prisma, PostgreSQL. Structure: /app (routes), /components (UI), /lib (utils), /prisma (schema)"
```

## Metadata

Optional JSON metadata can include:
- category: Grouping category
- tags: Array of tags
- language: Programming language
- project: Project name
- priority: Importance level

## Output

Returns entry ID for future reference:
```text
Stored: session_20240115_143022
Type: session
Content preview: Completed authentication refactor...
```

## Integration

Use after:
- Completing significant work
- Learning new patterns
- Setting up project structure
- Creating reusable solutions

## Related Skills

- memory-query (ZAI-MEM-002): Search stored entries
- session-log (ZAI-SESSION-001): Log session progress

---
Built with: Z.ai Agent Toolkit
