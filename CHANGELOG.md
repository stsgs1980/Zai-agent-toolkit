# Changelog

All notable changes to Zai-agent-toolkit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added
- Memory System with ChromaDB integration
  - `memory-store` (ZAI-MEM-001): Store entries in vector DB
  - `memory-query` (ZAI-MEM-002): Semantic search
  - `memory-delete` (ZAI-MEM-003): Delete entries
  - `memory-export` (ZAI-MEM-004): Export to JSON
  - `memory_cli.py`: CLI tool for memory operations
- `folder-indexer` (ZAI-FS-001): Create searchable indexes for folders
  - `folder_indexer.py`: CLI tool for folder indexing
- `auto-save-session.ps1`: Hook for automatic session logging
- `compatibility` tag in all skills (ade/sandbox/both)

### Changed
- Renamed `projects/` to `project-index/` in memory structure
- Updated TODO.md with current tasks

### Removed
- Obsolete skills moved from toolkit (see commit history)

---

## [2026-05-17] - Memory System Release

### Architecture

```
C:\Users\stsgr\.zcode\
├── memory\
│   ├── chromadb\          <- Vector database
│   ├── project-index\     <- Project metadata
│   ├── sessions\          <- Session logs
│   └── knowledge\         <- Knowledge base
├── tools\
│   ├── memory_cli.py
│   └── folder_indexer.py
├── skills\                <- Symlink to toolkit
├── hooks\
└── Zai-agent-toolkit\
```

### Skills Summary

| ID | Name | Compatibility |
|-----|------|---------------|
| ZAI-MEM-001 | memory-store | both |
| ZAI-MEM-002 | memory-query | both |
| ZAI-MEM-003 | memory-delete | both |
| ZAI-MEM-004 | memory-export | both |
| ZAI-FS-001 | folder-indexer | both |
| ZAI-META-001 | skill-id-system | both |
| ZAI-META-002 | skill-creator | both |
| ZAI-SESSION-002 | session-log | both |
| ZAI-SESSION-003 | context-consolidation | both |
| ZAI-DEV-003 | project-clone | sandbox |
| ZAI-DEV-004 | commit-work | both |
| ZAI-DEV-005 | database-schema-designer | both |
| ZAI-ARCH-002 | mermaid-diagrams | both |
| ZAI-REQ-001 | requirements-clarity | both |
| ZAI-QA-001 | qa-test-planner | both |
| ZAI-STS-001 | prompt-engineering_sts | both |
| ZAI-STS-002 | sync-toolkit_sts | sandbox |
| ZAI-STS-003 | performance-code-generator_sts | sandbox |
| ZAI-STS-004 | frontend-styling-expert_sts | both |
| ZAI-STS-005 | phi-layout_sts | both |
| ZAI-STS-006 | zai-ui-composer_sts | sandbox |

---

## Template for new entries

```markdown
## [YYYY-MM-DD] - Release Name

### Added
- New features

### Changed
- Changes to existing features

### Fixed
- Bug fixes

### Removed
- Removed features
```
