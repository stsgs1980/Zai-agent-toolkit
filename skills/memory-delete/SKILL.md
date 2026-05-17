---
name: memory-delete
id: ZAI-MEM-003
version: 1.0
compatibility: both
description: "Delete entries from ZCode memory system. Use when you need to remove outdated or incorrect entries from the knowledge base."
---

# Memory Delete Skill

Delete entries from the ZCode memory system (ChromaDB).

## Usage

```bash
python ~/.zcode/tools/memory_cli.py delete <entry_id> [--type <type>]
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| entry_id | ID of entry to delete (e.g., knowledge_20260517_152407) |
| --type | Optional. Filter by type |

## Entry Types

- session
- knowledge
- pattern
- project
- template

## Examples

```bash
# Delete specific entry
python ~/.zcode/tools/memory_cli.py delete knowledge_20260517_152407

# Delete from specific collection
python ~/.zcode/tools/memory_cli.py delete session_20260517_150613 --type session
```

## Warning

Deletion is permanent. Use with caution.

## Related Skills

- memory-store (ZAI-MEM-001): Store entries
- memory-query (ZAI-MEM-002): Search entries
- memory-export (ZAI-MEM-004): Export entries
