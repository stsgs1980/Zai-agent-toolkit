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
- **Standards audit and restructuring (2026-05-18):**
  - STD-ENV-001 (Reproducibility Standard): v1.0 -> v1.1 -> v2.0
    - K-01 fix: replaced categorical absolute path ban with nuanced "no hardcoded personal paths" rule, added environment-constant path categories and Z.ai sandbox exception table (v1.1)
    - Major restructuring (v2.0): removed foreign domains (dark theme, color palette, anti-fragility, dedup, push policy, deletion UI), kept only rules where violation breaks "clone + install + dev = works", added Cross-References section (bibliography-style index)
  - STD-FE-001 (Frontend Standard): v1.3 -> v1.4 -> v1.5
    - Relocated from STD-ENV-001: dark theme (11.1), color palette (11.2), anti-fragility/error isolation (11.3), deletion UI patterns (11.4)
    - K-06/K-07: replaced duplicated error handling and Zod validation with cross-references to STD-ERR-001 and STD-SEC-001
    - K-08: added autoBackup() specification (non-blocking, /tmp/, timestamp format, 24h retention)
    - K-09: added custom theme preset validation rule
  - STD-SEC-001 (Security Standard): v1.0 -> v1.1
    - K-03: lockfile now mentions bun.lock alongside package-lock.json
    - K-04: missing secrets now warn (not crash), aligned with STD-ENV-001
    - K-05: added SQLite note for Z.ai sandbox projects
    - K-11: removed localhost URL from CORS dev config
    - K-14: fixed section numbering (§12-§14 reordered)
  - STD-GIT-001 (GitHub Standard):
    - K-13: added emergency exception note for git reset --hard in deadlock recovery
  - STD-ARCH-001 (Implementation Order):
    - K-02/K-10: Step 3 updated — "Remove hardcoded personal paths" instead of "Remove absolute paths", dark theme moved to Step 3a note
  - K-12: Unified Stack Signatures across all standards (replaced "Z.ai Agent Toolkit" with project default)
  - STD-ENV-002 (Z.ai Integration Standard): v1.0 -> v1.1
    - Updated section 3.1 to cross-reference STD-ENV-001 v1.1 path rules
  - STD-META-001 (Standard ID System): registry updated
    - STD-ENV-001 version bumped to v2.0
    - STD-ENV-002 version bumped to v1.1
    - STD-FE-001 version bumped to v1.5
    - STD-SEC-001 version bumped to v1.1
  - 15 inter-standard contradictions identified (K-01 through K-15)

### Removed
- Agent-Toolkit-ZCode repository (deprecated, merged into Zai-agent-toolkit)
- Obsolete skills moved from toolkit (see commit history)
- Duplicated rules removed from STD-ENV-001 (now in their proper domain-specific standards)

---

## [2026-05-17] - Memory System Release

### Architecture

```text
C:\Users\stsgr\.zcode\
+-- memory\
|   +-- chromadb\          <- Vector database
|   +-- project-index\     <- Project metadata
|   +-- sessions\          <- Session logs
|   +-- knowledge\         <- Knowledge base
+-- tools\
|   +-- memory_cli.py
|   +-- folder_indexer.py
+-- skills\                <- Symlink to toolkit
+-- hooks\
+-- Zai-agent-toolkit\
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

## [1.9.4] - 2026-05-16

### Changed
- Removed emoji from all skills (UNICODE_POLICY compliance)
- Added INSTALL.md for Vercel/ZCode Desktop setup
- Upgraded CI to Node.js 24

## [1.9.3] - 2026-05-15

### Added
- 7 new skills: session-handoff, requirements-clarity, commit-work, mermaid-diagrams, c4-architecture, qa-test-planner, database-schema-designer

## [1.9.2] - 2026-05-14

### Changed
- Renamed repository to Zai-agent-toolkit
- Updated all internal references

## [1.9.1] - 2026-05-13

### Added
- Read-Only Usage rule (Section 0) to AGENT_RULES.md
- Agents must never commit changes to zai-agent-toolkit after cloning

## [1.9.0] - 2026-05-12

### Added
- z-ai-web-dev-sdk skill for AI SDK integration
- ZAI_INTEGRATION_STANDARD to v1.1 with SDK usage rules
- Z.ai SDK Integration section to AGENT_RULES

## [1.8.3] - 2026-05-11

### Changed
- Unified file naming: removed language suffixes and versions from filenames
- Updated all workflows
- Added deadlock prevention rules to GITHUB_STANDARD

## [1.8.2] - 2026-05-10

### Changed
- Split into two repositories: agent-toolkit (EN) + agent-toolkit-ru (RU)
- Removed emoji from all standards

## [1.8.1] - 2026-05-09

### Added
- Full Russian localization: all 13 standards now have EN/RU versions (26 total files)
- Complete parity between languages
- Unified naming convention: all files renamed to NAME_STANDARD_XX_vX.X.md format

## [1.7.0] - 2026-05-08

### Added
- Full English localization: IMPLEMENTATION_ORDER_EN, STANDARD_ID_SYSTEM_EN, CODE_EXAMPLES_GUIDE_EN
- Updated all registries

## [1.6.0] - 2026-05-07

### Added
- 3 critical standards: TESTING_STANDARD, ERROR_HANDLING_STANDARD, SECURITY_STANDARD

## [1.5.3] - 2026-05-06

### Added
- sanitize-validate skill for input security (XSS, SQL injection, CSRF, validation, sanitization)

## [1.5.2] - 2026-05-05

### Changed
- GITHUB_STANDARD v1.1: Checkpoint System (WIP, Recovery Tags)
- git-checkpoint skill for systematic versioning

## [1.5.1] - 2026-05-04

### Changed
- MARKDOWN_STANDARD v2.1.5: added Badges section with shields.io rules
- Version sync across docs

## [1.5.0] - 2026-05-03

### Added
- 4 new standards (Code Examples, Frontend, GitHub, WCAG)
- Standard ID System
- anti-monolith skill

## [1.4.2] - 2026-05-02

### Changed
- Re-added assets (logo, banner, favicon) as real PNG
- Banner in README header

## [1.4.1] - 2026-05-01

### Added
- Readiness Checklist section to README

## [1.4.0] - 2026-04-30

### Changed
- Unified toolkit: AGENT_RULES rewritten, PROJECT_CONFIG.md added
- README overhauled
- No-Unicode levels synced [C]+[W]+[I]
- REPRODUCIBILITY classified as Group B

## [1.3.0] - 2026-04-29

### Added
- Logos (assets/), worklog system
- Implementation Order (6-step sequence)
- Parameterized stack signature
- AI-chat in No-Unicode Policy
- `(ref)` exception for code blocks

## [1.2.1] - 2026-04-28

### Changed
- Updated standards to v2.1 (typographics allowed in text, EN standard added)

## [1.2.0] - 2026-04-27

### Added
- writing-plans instruction (plan before code for tasks > 3 steps)

## [1.1.0] - 2026-04-26

### Added
- Development workflows (feature, bug-fix, refactor) + E2E templates

## [1.0.0] - 2026-04-25

### Added
- Initial release from Web-Aesthetic-Showcase project

---
Built with: Python + PowerShell + Markdown
