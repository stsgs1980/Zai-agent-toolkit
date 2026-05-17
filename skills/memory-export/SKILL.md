---
name: memory-export
id: ZAI-MEM-004
version: 1.0
compatibility: both
description: "Export entries from ZCode memory system to JSON. Use when you need to backup memory or transfer knowledge between systems."
---

# Memory Export Skill

Export entries from the ZCode memory system (ChromaDB) to JSON.

## Usage

```bash
python ~/.zcode/tools/memory_cli.py export [--type <type>] [--output <file>]
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| --type | Optional. Export only specific type |
| --output | Optional. Save to file |

## Entry Types

- session
- knowledge
- pattern
- project
- template

## Examples

```bash
# Export all entries to file
python ~/.zcode/tools/memory_cli.py export --output backup.json

# Export only knowledge
python ~/.zcode/tools/memory_cli.py export --type knowledge --output knowledge.json

# Print all to console
python ~/.zcode/tools/memory_cli.py export
```

## Output Format

```json
{
  "session": {
    "ids": [...],
    "documents": [...],
    "metadatas": [...]
  },
  "knowledge": {
    "ids": [...],
    "documents": [...],
    "metadatas": [...]
  }
}
```

## Use Cases

- Backup memory before major changes
- Transfer knowledge to another machine
- Analyze stored information
- Create snapshots

## Related Skills

- memory-store (ZAI-MEM-001): Store entries
- memory-query (ZAI-MEM-002): Search entries
- memory-delete (ZAI-MEM-003): Delete entries
