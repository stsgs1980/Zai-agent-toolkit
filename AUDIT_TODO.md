# AUDIT TODO: Zai-agent-toolkit v1.9.5

> Created: 2026-05-17
> Source: Full deep audit (4 parallel checks, ~140 issues)
> Base version: 1.9.5

---

## Legend

| Status | Meaning |
|--------|---------|
| [ ] | Pending |
| [~] | In Progress |
| [x] | Done |
| [-] | Skipped or not applicable |

---

## PHASE 1: ID Registries & AGENT_RULES (CRITICAL)

> Wrong IDs cause agent misbehavior. Must fix first.

### 1.1 Update skill-id-registry.md

- [x] 1.1.1 Add all 12 missing skills to registry (MEM-001..004, FS-001, SESSION-002..003, ARCH-002, QA-001, REQ-001, DEV-004..005)
- [x] 1.1.2 Remove phantom entries (ZAI-SEC-001 sanitize-validate, ZAI-DEV-002 anti-monolith) or mark as "planned"
- [x] 1.1.3 Fix ZAI-STS-006 status: "(available)" -> "Active"
- [x] 1.1.4 Add MEM, FS, SESSION, ARCH, QA, REQ domains to domain list

### 1.2 Fix AGENT_RULES.md Section 7 (Skill Table)

- [x] 1.2.1 Fix ZAI-SESSION-002: session-resume -> session-log
- [x] 1.2.2 Fix ZAI-QA-002: sanitize-validate -> ZAI-SEC-001 (or remove if skill doesn't exist)
- [x] 1.2.3 Fix ZAI-ARCH-003: database-schema-designer -> ZAI-DEV-005
- [x] 1.2.4 Fix ZAI-GIT-003: commit-work -> ZAI-DEV-004
- [x] 1.2.5 Remove 12 phantom skills with no directory (or mark as "planned/system")
- [x] 1.2.6 Add all 10+ missing toolkit skills to the table

### 1.3 Fix AGENT_RULES.md Section 8 (Instructions Table)

- [x] 1.3.1 Add missing zai-sdk-guidelines.md

### 1.4 Fix AGENT_RULES.md Section Numbering

- [x] 1.4.1 Fix duplicate "## 1." (Onboarding Protocol vs Language Rule)
- [x] 1.4.2 Add number to "## Z.ai SDK Integration" (between 8 and 9)
- [x] 1.4.3 Renumber all sections sequentially

### 1.5 Fix STANDARD_ID_SYSTEM.md

- [x] 1.5.1 Update STD-GIT-001 version: 1.1 -> 1.5
- [x] 1.5.2 Remove STD-DOC-001 (RU Markdown Standard) or mark as removed
- [x] 1.5.3 Add STD-ENV-002 (ZAI_INTEGRATION_STANDARD) to registry section 4
- [x] 1.5.4 Fix CODE_EXAMPLES_GUIDE ID in registry if needed (STD-DOC-005)

### 1.6 Fix cross-document ID conflicts

- [x] 1.6.1 IMPLEMENTATION_ORDER.md:29 - STD-DOC-001 -> STD-DOC-002 for MARKDOWN_STANDARD
- [x] 1.6.2 README.md:186 - STD-DOC-006 -> STD-DOC-005 for CODE_EXAMPLES_GUIDE
- [x] 1.6.3 SKILL_ID_GUIDE.md: ZAI-USER-XXX references -> ZAI-STS-XXX
- [x] 1.6.4 TUTORIAL.md:306 - fix ZAI-SESSION-002 = session-resume -> session-log
- [x] 1.6.5 memory-store/SKILL.md:89 - ZAI-OPS-003 -> ZAI-SESSION-002

---

## PHASE 2: Broken Scripts & Paths (CRITICAL)

### 2.1 Fix hook paths

- [x] 2.1.1 auto-save-session.ps1:28 - add missing "Zai-agent-toolkit" to path
- [x] 2.1.2 session-functions.ps1:44,46,67 - add missing "Zai-agent-toolkit" to path

### 2.2 Fix hardcoded user paths

- [x] 2.2.1 setup-sync-command.ps1:9,15,19 - replace `C:\Users\stsgr\` with `$env:USERPROFILE\`

### 2.3 Fix memory_cli.py

- [x] 2.3.1 Add missing `export` subcommand
- [x] 2.3.2 Create requirements.txt for chromadb dependency

### 2.4 Fix script logic bugs

- [x] 2.4.1 update-toolkit.ps1:33 - fix "up to date" detection (use `git pull --dry-run` or parse `## main...origin/main`)
- [x] 2.4.2 update-toolkit.bat:13 - add directory existence check before cd
- [x] 2.4.3 find-toolkit-repos.ps1:20-29 - fix duplicate matching logic

### 2.5 Fix Python issues

- [x] 2.5.1 folder_indexer.py:58 - bare `except:` -> `except (OSError, PermissionError):`
- [x] 2.5.2 memory_cli.py:164,240 - `except Exception` -> more specific exceptions
- [x] 2.5.3 memory_cli.py - remove unused imports (List, Any)
- [x] 2.5.4 folder_indexer.py - remove unused import (Any)
- [x] 2.5.5 validate_compatibility.py:213 - call check_severity_levels() or remove dead code
- [x] 2.5.6 validate_compatibility.py - fix docstring (--toolkit-dir vs positional arg)

### 2.6 Fix setup.sh

- [x] 2.6.1 Line 12: TOOLKIT_VERSION="v1.5.0" -> read from VERSION file dynamically
- [x] 2.6.2 Line 4,39: PAT security - suggest env var instead of CLI arg

---

## PHASE 3: Version Consistency (HIGH)

- [x] 3.1 PROJECT_CONFIG.md:6 - v1.5.0 -> v1.9.5
- [x] 3.2 setup.sh:12 - v1.5.0 -> dynamic from VERSION
- [x] 3.3 GITHUB_STANDARD.md - fix title v1.0 to match header v1.5
- [x] 3.4 README.md:260 - fix GITHUB_STANDARD version v1.2 -> v1.5
- [x] 3.5 STANDARD_ID_SYSTEM.md:75 - fix GITHUB_STANDARD version 1.1 -> 1.5
- [x] 3.6 MARKDOWN_STANDARD.md:267 - badge example v1.5.0 -> v1.9.5
- [x] 3.7 docs/diagrams/skills-architecture.puml:8 - v1.1 -> v1.9.5

---

## PHASE 4: Skill Header Format (HIGH)

> Required format: `# Skill: Name vX.Y` + `> ID:` + `> Version:` + `> Last Updated:`

### 4.1 Fix SKILL.md headers (15 files)

- [x] 4.1.1 commit-work/SKILL.md
- [x] 4.1.2 context-consolidation/SKILL.md
- [x] 4.1.3 database-schema-designer/SKILL.md
- [x] 4.1.4 folder-indexer/SKILL.md
- [x] 4.1.5 frontend-styling-expert_sts/SKILL.md
- [x] 4.1.6 memory-delete/SKILL.md
- [x] 4.1.7 memory-export/SKILL.md
- [x] 4.1.8 memory-query/SKILL.md
- [x] 4.1.9 memory-store/SKILL.md
- [x] 4.1.10 mermaid-diagrams/SKILL.md
- [x] 4.1.11 performance-code-generator_sts/SKILL.md
- [x] 4.1.12 phi-layout_sts/SKILL.md
- [x] 4.1.13 qa-test-planner/SKILL.md
- [x] 4.1.14 requirements-clarity/SKILL.md
- [x] 4.1.15 session-log/SKILL.md

### 4.2 Add missing YAML `trigger` field (9 files)

- [x] 4.2.1 commit-work/SKILL.md
- [x] 4.2.2 context-consolidation/SKILL.md
- [x] 4.2.3 database-schema-designer/SKILL.md
- [x] 4.2.4 folder-indexer/SKILL.md
- [x] 4.2.5 memory-delete/SKILL.md
- [x] 4.2.6 memory-export/SKILL.md
- [x] 4.2.7 memory-query/SKILL.md
- [x] 4.2.8 memory-store/SKILL.md
- [x] 4.2.9 mermaid-diagrams/SKILL.md

### 4.3 Add missing footer (10 files)

- [x] 4.3.1 commit-work/SKILL.md
- [x] 4.3.2 database-schema-designer/SKILL.md
- [x] 4.3.3 folder-indexer/SKILL.md
- [x] 4.3.4 memory-delete/SKILL.md
- [x] 4.3.5 memory-export/SKILL.md
- [x] 4.3.6 memory-query/SKILL.md
- [x] 4.3.7 memory-store/SKILL.md
- [x] 4.3.8 mermaid-diagrams/SKILL.md
- [x] 4.3.9 performance-code-generator_sts/SKILL.md
- [x] 4.3.10 qa-test-planner/SKILL.md
- [x] 4.3.11 requirements-clarity/SKILL.md

---

## PHASE 5: Standard Header Format (HIGH)

### 5.1 Fix 3 standards with wrong header format

- [x] 5.1.1 ERROR_HANDLING_STANDARD.md - `**Standard ID:**` -> `> ID:`, add `> Level:`, add `(EN)`, add `> Last Updated:`
- [x] 5.1.2 SECURITY_STANDARD.md - same fixes
- [x] 5.1.3 TESTING_STANDARD.md - same fixes

### 5.2 Add missing stack signatures (5 files)

- [x] 5.2.1 CODE_EXAMPLES_GUIDE.md
- [x] 5.2.2 REPRODUCIBILITY-STANDARD.md
- [x] 5.2.3 ERROR_HANDLING_STANDARD.md (replace italic attribution)
- [x] 5.2.4 SECURITY_STANDARD.md (replace italic attribution)
- [x] 5.2.5 TESTING_STANDARD.md (replace italic attribution)

### 5.3 Fix structural issues

- [x] 5.3.1 REPRODUCIBILITY-STANDARD.md:130 - fix Rule numbering (Rule 3 -> Rule 1)
- [x] 5.3.2 SECURITY_STANDARD.md - fix missing section 12
- [x] 5.3.3 ZAI_INTEGRATION_STANDARD.md:6 - typo SANDBAX_RULES -> SANDBOX_RULES
- [x] 5.3.4 WCAG_2.1_AA_STANDARD.md:6 - `> Reference:` -> `> Related:`
- [x] 5.3.5 GITHUB_STANDARD.md:6 - `> Reference:` -> `> Related:`

---

## PHASE 6: Unicode Violations (MEDIUM)

> Characters: -> (U+2192), bullet (U+2022), box-drawing (U+251C, U+2514, U+2502, U+2500)

### 6.1 Decide: add -> to whitelist or replace everywhere

- [x] 6.1.1 Decision needed: add U+2192 (right arrow) to UNICODE_POLICY whitelist, or replace all with ->

### 6.2 Replace box-drawing characters everywhere

- [x] 6.2.1 TESTING_STANDARD.md:14-29 - pyramid diagram
- [x] 6.2.2 TESTING_STANDARD.md:224-232 - E2E scenarios box
- [x] 6.2.3 TESTING_STANDARD.md:472-488 - stack tree
- [x] 6.2.4 ERROR_HANDLING_STANDARD.md:14-40 - error hierarchy
- [x] 6.2.5 SKILL_PROCESSES.md:339-349 - directory tree
- [x] 6.2.6 SKILL_PROCESSES.md:373-385 - directory tree
- [x] 6.2.7 CHANGELOG.md:39-49 - directory tree
- [x] 6.2.8 TODO.md:130-140 - directory tree
- [x] 6.2.9 COMMANDS_LOG.md:42-43 - directory tree
- [x] 6.2.10 TUTORIAL.md:158-164 - directory tree
- [x] 6.2.11 skill-creator/SKILL.md:296-304 - file tree

### 6.3 Replace -> arrows (if decision = replace)

- [x] 6.3.1 database-schema-designer/SKILL.md:67,145
- [x] 6.3.2 SECURITY_STANDARD.md:805-810
- [x] 6.3.3 TESTING_STANDARD.md:227-231
- [x] 6.3.4 SKILL_PROCESSES.md:342-344
- [x] 6.3.5 requirements-clarity/SKILL.md:179
- [x] 6.3.6 skill-id-system/SKILL.md:158-160
- [x] 6.3.7 INSTALL.md:225-227
- [x] 6.3.8 mermaid-diagrams/references/sequence-diagrams.md:361

### 6.4 Replace -> bullets

- [x] 6.4.1 qa-test-planner/SKILL.md:67-79 - 9 instances of ->

### 6.5 Update CI regex to cover missing ranges

- [x] 6.5.1 Add U+2192 to emoji check regex in ci.yml and validate.yml
- [x] 6.5.2 Add U+2022 to emoji check regex
- [x] 6.5.3 Add U+2500-U+257F (box drawing) to emoji check regex

---

## PHASE 7: Empty Code Blocks (MEDIUM)

> Rule: all code blocks must have language tag (text, bash, etc.)

### 7.1 Standards (~18 blocks)

- [x] 7.1.1 GITHUB_STANDARD.md - 7 blocks (lines 455,508,559,757,779,848,1141)
- [x] 7.1.2 TESTING_STANDARD.md - 4 blocks (lines 14,91,224,472)
- [x] 7.1.3 REPRODUCIBILITY-STANDARD.md - 2 blocks (lines 16,121)
- [x] 7.1.4 SECURITY_STANDARD.md - 2 blocks (lines 76,638) -- wait, 76 has gitignore, check
- [x] 7.1.5 STANDARD_ID_SYSTEM.md - 2 blocks (lines 27,207)
- [x] 7.1.6 ERROR_HANDLING_STANDARD.md - 1 block (line 14)

### 7.2 Instructions (~12 blocks)

- [x] 7.2.1 onboarding-protocol.md - 9 blocks
- [x] 7.2.2 writing-plans.md - 2 blocks
- [x] 7.2.3 git-workflow-rules.md - 1 block

### 7.3 Docs (~18 blocks)

- [x] 7.3.1 TUTORIAL.md - 9 blocks
- [x] 7.3.2 SKILL_ID_GUIDE.md - 4 blocks
- [x] 7.3.3 SKILL_PROCESSES.md - 2 blocks
- [x] 7.3.4 COMMANDS_LOG.md - 2 blocks
- [x] 7.3.5 TODO.md - 1 block

### 7.4 Other files (~3 blocks)

- [x] 7.4.1 PROJECT_CONFIG.md - 1 block
- [x] 7.4.2 CHANGELOG.md - 1 block
- [x] 7.4.3 INSTALL.md - 1 block

### 7.5 Skills (~20+ blocks)

- [x] 7.5.1 qa-test-planner/SKILL.md - ~17 blocks
- [x] 7.5.2 database-schema-designer/SKILL.md - multiple blocks
- [x] 7.5.3 requirements-clarity/SKILL.md - 6 blocks

---

## PHASE 8: Missing Stack Signatures (MEDIUM)

### 8.1 Instructions (5 files)

- [x] 8.1.1 zai-sdk-guidelines.md
- [x] 8.1.2 language-rule.md
- [x] 8.1.3 diagnostic-disclosure.md
- [x] 8.1.4 sandbox-rules.md
- [x] 8.1.5 git-workflow-rules.md

### 8.2 Docs (3 files)

- [x] 8.2.1 COMMANDS_LOG.md
- [x] 8.2.2 SKILL_PROCESSES.md
- [x] 8.2.3 TODO.md

### 8.3 Root files (2 files)

- [x] 8.3.1 CHANGELOG.md
- [x] 8.3.2 INSTALL.md

---

## PHASE 9: README & Documentation Sync (MEDIUM)

### 9.1 README.md fixes

- [x] 9.1.1 Repository Structure: remove 12 non-existent skill directories
- [x] 9.1.2 Repository Structure: add 8 missing actual skills
- [x] 9.1.3 Instructions list: add sandbox-rules.md and zai-sdk-guidelines.md
- [x] 9.1.4 Standards table: verify all 14 match

### 9.2 CHANGELOG.md

- [x] 9.2.1 Add entries for v1.0.0 through v1.9.4 (or reference README changelog)
- [x] 9.2.2 Document v1.9.5 properly

### 9.3 Outdated docs

- [x] 9.3.1 COMMANDS_LOG.md:194-204 - remove stale "awaiting ID" section
- [x] 9.3.2 SKILL_PROCESSES.md - sync skill list with actual

---

## PHASE 10: CI/CD Gaps (LOW)

- [x] 10.1 ci.yml - add sandbox-rules.md and zai-sdk-guidelines.md to file structure check
- [x] 10.2 validate.yml - add sandbox-rules.md and zai-sdk-guidelines.md to file structure check
- [x] 10.3 Evaluate merging ci.yml and validate.yml (redundant checks)
- [x] 10.4 FRONTEND_STANDARD.md - fix `*` list markers to `-` (lines 13-15, 93-94, 97-98)

---

## PROGRESS TRACKER

| Phase | Category | Total | Done | In Progress | Remaining |
|-------|----------|-------|------|-------------|-----------|
| 1 | ID Registries & AGENT_RULES | 17 | 17 | 0 | 0 |
| 2 | Broken Scripts & Paths | 18 | 18 | 0 | 0 |
| 3 | Version Consistency | 7 | 7 | 0 | 0 |
| 4 | Skill Header Format | 15 | 15 | 0 | 0 |
| 5 | Standard Header Format | 12 | 12 | 0 | 0 |
| 6 | Unicode Violations | 18 | 18 | 0 | 0 |
| 7 | Empty Code Blocks | 51 | 51 | 0 | 0 |
| 8 | Missing Stack Signatures | 10 | 10 | 0 | 0 |
| 9 | README & Doc Sync | 7 | 7 | 0 | 0 |
| 10 | CI/CD & Misc | 4 | 4 | 0 | 0 |
| **TOTAL** | | **~179** | **~179** | **0** | **0** |

---

*Audit performed: 2026-05-17*
*Audit tool: ZCode Agent (4 parallel deep checks)*
