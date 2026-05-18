# Changelog

All notable changes to Zai-agent-toolkit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [2.0.2] - 2026-05-18

### Changed — Cross-References Format Unification

Unified cross-references format across all 19 standards. Every standard now has a `## Cross-References` section with a two-column table (`| Standard | Relationship |`), making the link map visible at a glance without scanning the entire document.

- **STD-FE-001** (Frontend Standard): added Cross-References section (5 links)
- **STD-ARCH-001** (Implementation Order): added Cross-References section (17 links)
- **STD-DOC-002** (Markdown Standard): added Cross-References section (1 link to STD-DOC-003)
- **STD-AGENT-001** (Subagent Standard): replaced inline Section 7.1 table with formal Cross-References section (9 links)
- **STD-AGENT-002** (Orchestration Standard): replaced inline Section 9 table with formal Cross-References section (6 links)
- **STD-DOC-004** (README Template): added Cross-References section (1 link)
- **STD-META-001** (Standard ID System): added Cross-References section (2 links)
- **STD-DOC-003** (Unicode Policy): added Cross-References section (1 link to STD-DOC-002)
- **STD-ENV-002** (Z.ai Integration Standard): added Cross-References section (1 link to STD-ENV-001)

---

## [2.0.1] - 2026-05-18

### Fixed — Post-Validation Corrections

Post-v2.0.0 validation revealed 5 version consistency issues and 1 documentation gap:

- **STD-META-001** (Standard ID System): Title and header version `v1.0` -> `v1.1` (registry already had v1.1)
- **STD-ARCH-001** (Implementation Order): Registry entry version `2.1` -> `2.2` (file header already said v2.2)
- **STD-A11Y-001** (WCAG Standard): Title `v1.0` -> `v1.1` (header already said v1.1)
- **STD-TEST-001** (Testing Standard): Title `v1.0` -> `v1.1` (header already said v1.1)
- **STD-DOC-005** (Code Examples Guide): Title `v1.0` -> `v1.1` (header already said v1.1)
- **K-15 phantom**: Corrected contradiction count from 15 to 14 in Unreleased changelog (K-15 was a cross-reference pattern, not a conflict)

---

## [2.0.0] - 2026-05-18

### Major Restructuring: Architecture Refactoring

This release restructures the entire toolkit architecture based on a comprehensive audit that identified 3 critical problems: monolithic standards, missing subagent governance, and orphan standards with no cross-references.

### Added — Phase 2: Subagent Layer (NEW)

- **STD-AGENT-001** (Subagent Standard v1.0): Defines subagent types, contract, lifecycle, constraints, context handoff, and anti-patterns. Fills the critical gap of no governance for Z.ai sandbox subagents.
  - Subagent type registry: Explore, Plan, full-stack-developer, general-purpose
  - Input/output/failure contracts
  - Lifecycle phases: SPAWN -> INITIALIZE -> EXECUTE -> REPORT -> COMPLETE
  - Constraints: recursion depth = 1, file scope, timeouts, network access
  - WORKLOG-based context handoff protocol
  - Memory System integration (ZAI-MEM-001 through ZAI-MEM-004)
- **STD-AGENT-002** (Orchestration Standard v1.0): Defines multi-agent coordination, task dependencies, state management, git coordination, and error propagation.
  - Orchestration patterns: Sequential Pipeline, Parallel Fan-Out, Map-Reduce, Retry with Fallback
  - Task dependency management with circular dependency prevention
  - State machine: PENDING -> IN_PROGRESS -> COMPLETED/BLOCKED/FAILED/CANCELLED
  - Git coordination: commit points, parallel safety, conflict prevention
  - Error escalation ladder: self-recovery -> fallback -> user intervention
  - Workflow templates: standard development, audit/restructuring, multi-file refactoring
- **agents/ directory** with 3 templates:
  - `agents/templates/task-prompt-template.md`: STD-AGENT-001 compliant prompt templates for all 4 subagent types
  - `agents/templates/context-handoff-template.md`: Structured handoff for multi-session work
  - `agents/templates/subagent-result-template.md`: Standardized result reporting format
- **AGENT domain** added to STD-META-001 Reserved Domains table

### Changed — Phase 1: Monolith Splitting

- **STD-GIT-001** (GitHub Core Standard): v1.5 -> v2.0
  - Extracted all sandbox-specific content (sections 10.1-10.11, 800 lines) to STD-GIT-002
  - Core retains: commit format, branch naming, forbidden operations, backup, push policy, versioning, branch protection, .gitignore, GitHub-specific rules
  - Added Cross-References section (Section 10)
- **STD-GIT-002** (GitHub Sandbox Safety Standard): NEW v1.0
  - Contains: sandbox constraints, session management, deadlock prevention, deadlock recovery, network failure recovery (8 scenarios), sandbox safety rules (middleware deadlock, absolute prohibitions, pre-command checklist, remote ahead decision tree, rebase recovery, stash safety, detached HEAD, git hooks, GPG signing), post-deadlock clone recovery
- **STD-SEC-001** (Security Core Standard): v1.1 -> v2.0
  - Extracted extended content (auth, RBAC, rate limiting, monitoring, deployment, incident response, compliance, 622 lines) to STD-SEC-002
  - Core retains: OWASP top 10, secrets management, input validation/sanitization, security headers, dependency auditing, sensitive data handling, quick core checklist
  - Added Cross-References section
- **STD-SEC-002** (Security Extended Standard): NEW v1.0
  - Contains: authentication (passwords, hashing, sessions, JWT, MFA), authorization (RBAC, resource-level, least privilege), CSRF protection, rate limiting, security event logging, secure deployment, incident response, compliance (GDPR, SOC 2), decision matrix
- **STD-ERR-001** (Error Handling Core Standard): v1.0 -> v2.0
  - Extracted recovery content (retry, circuit breaker, fallback, monitoring, 323 lines) to STD-ERR-002
  - Core retains: error classification, object structure, try-catch patterns, logging, API error responses, frontend error handling
  - Added Cross-References section and checklist
- **STD-ERR-002** (Error Recovery Standard): NEW v1.0
  - Contains: retry logic with exponential backoff, circuit breaker pattern, fallback mechanisms, monitoring and alerting, orchestration integration, recovery decision matrix

### Changed — Phase 3: Orphan Resolution

- **STD-DOC-005** (Code Examples Guide): v1.0 -> v1.1
  - Added Related standards header (STD-DOC-002, STD-A11Y-001, STD-SEC-001)
  - Added Cross-References section: links to Markdown formatting, Unicode Policy, accessibility, security
- **STD-TEST-001** (Testing Standard): v1.0 -> v1.1
  - Added Related standards header (STD-ERR-001, STD-SEC-001, STD-ENV-001, STD-ERR-002)
  - Added Cross-References section: links to error handling, recovery testing, security testing, reproducibility, sandbox constraints
- **STD-A11Y-001** (WCAG Accessibility Standard): v1.0 -> v1.1
  - Added Related standards header (STD-FE-001, STD-TEST-001)
  - Added Cross-References section: links to frontend standard, testing, code examples

### Changed — Infrastructure Updates

- **STD-META-001** (Standard ID System): v1.0 -> v1.1
  - Added AGENT domain to Reserved Domains table
  - Added Section 4.10: Agents (STD-AGENT-001, STD-AGENT-002)
  - Updated all version numbers in registry
- **STD-ARCH-001** (Implementation Order): v2.1 -> v2.2
  - Added 5 new standards to catalog table (STD-GIT-002, STD-ERR-002, STD-SEC-002, STD-AGENT-001, STD-AGENT-002)
  - Updated scope descriptions for split standards
- **VERSION**: 1.9.5 -> 2.0.0 (major version bump for architecture restructuring)
- **README.md**: Updated structure, standards table, version references

### Summary Statistics

| Metric | Before | After |
|--------|--------|-------|
| Standards count | 14 | 19 |
| Largest standard | 1183 lines (STD-GIT-001) | 800 lines (STD-GIT-002) |
| Standards > 200 lines | 12/14 | 12/19 |
| Orphan standards | 1 (STD-DOC-005) | 0 |
| Agent governance | None | 2 standards + 3 templates |
| Cross-referenced standards | 8/14 | 19/19 |

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
  - STD-DOC-002 (Markdown Standard): v2.1.5 -> v2.2.0
    - Deduplication with STD-DOC-003: removed 7 duplicated elements (prohibited elements table, allowed characters, ASCII diagram whitelist, icon library, brand logos, sanitization regex, unconditionally allowed characters). Replaced with cross-references to STD-DOC-003 sections.
    - Kept .md-specific rules: typographics scope, (ref) exception, SVG insertion in Markdown, badges, stack signature, formatting rules, text tags
  - STD-META-001 (Standard ID System): registry updated
    - STD-ENV-001 version bumped to v2.0
    - STD-ENV-002 version bumped to v1.1
    - STD-FE-001 version bumped to v1.5
    - STD-SEC-001 version bumped to v1.1
  - 14 inter-standard contradictions identified and resolved (K-01 through K-14). Originally counted as 15, but K-15 was reclassified as non-contradictory upon deeper analysis (cross-reference pattern, not a conflict).

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
