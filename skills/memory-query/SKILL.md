---
name: memory-query
id: ZAI-MEM-002
version: 1.0
compatibility: both
description: "Search the ZCode memory system using semantic search. Use when you need to find relevant sessions, knowledge, patterns, or templates from previous work."
trigger: query memory, search memory, find in memory, recall, remember
---


# Skill: Memory Query v1.0


> ID: ZAI-MEM-002
> Version: 1.0
> Last Updated: 2026-05

Search the ZCode memory system using semantic search.

## Purpose

Find relevant sessions, knowledge, patterns, and templates
from previous work using natural language queries.

## Usage

```bash
python ~/.zcode/tools/memory_cli.py query "<query>" [--type <type>] [--limit N]
```

## Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| query | Natural language search query | Required |
| --type | Filter by entry type | All types |
| --limit | Maximum results per type | 5 |

## Entry Types

- session
- knowledge
- pattern
- project
- template

## Examples

### Basic Search

```bash
python ~/.zcode/tools/memory_cli.py query "react hooks optimization"
```

### Filter by Type

```bash
python ~/.zcode/tools/memory_cli.py query "authentication" --type knowledge
```

### Increase Results

```bash
python ~/.zcode/tools/memory_cli.py query "error handling" --limit 10
```

## Output

```text
Search results for: 'react hooks optimization'
==================================================

[KNOWLEDGE]

  ID: knowledge_20240110_091522
  Distance: 0.1234
  Created: 2024-01-10T09:15:22
  Content: React useCallback prevents unnecessary re-renders...

[PATTERN]

  ID: pattern_20240108_141200
  Distance: 0.1567
  Created: 2024-01-08T14:12:00
  Content: Custom hook for data fetching with caching...
```

## Distance Score

Lower distance = better match:
- 0.0 - 0.1: Excellent match
- 0.1 - 0.3: Good match
- 0.3 - 0.5: Relevant
- 0.5+: Less relevant

## Use Cases

1. **Before starting similar work**
   - Check if pattern/solution already exists

2. **Recalling context**
   - Find previous sessions on topic

3. **Learning from past**
   - Discover stored knowledge

4. **Project reference**
   - Find project structure details

## Related Skills

- memory-store (ZAI-MEM-001): Store new entries
- context-consolidation (ZAI-SESSION-002): Consolidate session context

---
Built with: Z.ai Agent Toolkit
