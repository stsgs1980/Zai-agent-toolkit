# TODO: Zai-agent-toolkit

> Last updated: 2026-05-18

---

## 1. Toolkit Git Submodule Conversion (PLANNED)

### Problem

- 50+ projects use Zai-agent-toolkit as a copy
- Updating the toolkit requires manual action in each project
- No automatic synchronization

### Solution

Convert toolkit connections to git submodules pointing to `Zai-agent-toolkit` (canonical repository).

### Risks

1. **Single repository**: `Zai-agent-toolkit` is the canonical repository on GitHub.
   All internal references now consistently use this name.
2. **50+ projects** -- this number is unverified. Is it really 50?
3. **Conflict with sync pipeline**: if a project switches to submodules,
   then `sync-toolkit.ps1` in the project root is no longer relevant
   (now update via `git submodule update`).
4. **Windows vs Linux**: submodules on Windows require `git submodule update --init --recursive`
   on every clone. Same in CI on Linux. All dev environments must be informed.
5. **Circular dependency**: if the toolkit itself is managed via submodule,
   then updating it requires a cycle: push to toolkit -> submodule update in project.
   `sync-toolkit` will need to be rewritten.

### Steps

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Check `gh auth status` (GitHub CLI) | Pending | OK |
| 2 | Get list of all repositories via GitHub API | Pending | `find-toolkit-repos.ps1` exists, fix in P2.4.3 |
| 3 | Find repositories with Zai-agent-toolkit | Pending | Search by name |
| 4 | Create copy -> submodule conversion script | Pending | Script must set URL to canonical repo, clean old copy |
| 5 | Test on 1-2 repositories | Pending | Pick non-critical projects |
| 6 | Run mass conversion | Pending | Only after testing |
| 7 | Create `update-all-toolkits` command | Pending | After submodules this is `git submodule update --remote` |

### Result

After conversion:

```powershell
# One command updates the toolkit in all projects:
update-all-toolkits
```

### Requirements

- GitHub Personal Access Token (gh CLI)
- Write access to repositories

---

## 2. Skills ID Assignment (COMPLETED)

### Done

| # | Task | Status |
|---|------|--------|
| 1 | Create skill-id-system (ZAI-META-001) | Done |
| 2 | Create skill-creator (ZAI-META-002) | Done |
| 3 | Assign IDs to all skills | Done |
| 4 | Add compatibility tag | Done |

### Current Skills Registry

| ID | Name | Compatibility |
|-----|------|---------------|
| ZAI-MEM-001 | memory-store | both |
| ZAI-MEM-002 | memory-query | both |
| ZAI-MEM-003 | memory-delete | both |
| ZAI-MEM-004 | memory-export | both |
| ZAI-FS-001 | folder-indexer | both |
| ZAI-META-001 | skill-id-system | both |
| ZAI-META-002 | skill-creator | both |
| ZAI-SESSION-001 | session-log | both |
| ZAI-SESSION-002 | context-consolidation | both |
| ZAI-DEV-001 | project-clone | sandbox |
| ZAI-DEV-002 | commit-work | both |
| ZAI-DEV-003 | database-schema-designer | both |
| ZAI-ARCH-001 | mermaid-diagrams | both |
| ZAI-REQ-001 | requirements-clarity | both |
| ZAI-QA-001 | qa-test-planner | both |
| ZAI-STS-001 | prompt-engineering_sts | both |
| ZAI-STS-002 | sync-toolkit_sts | sandbox |
| ZAI-STS-003 | performance-code-generator_sts | sandbox |
| ZAI-STS-004 | frontend-styling-expert_sts | both |
| ZAI-STS-005 | phi-layout_sts | both |
| ZAI-STS-006 | zai-ui-composer_sts | sandbox |

---

## 3. CI/CD Fixes (RESOLVED)

All 39 CI/CD issues from initial validation have been fixed. Section retained for historical reference.

| Category | Description | Status |
|-----------|----------|--------|
| STD-ID consistency | 6 issues | Fixed |
| Stack Signature | 29 issues | Fixed |
| Skill References | 2 issues | Fixed |

---

## 4. Memory System (IN PROGRESS)

### Created

| Component | ID | Status |
|-----------|-----|--------|
| memory-store | ZAI-MEM-001 | Done |
| memory-query | ZAI-MEM-002 | Done |
| memory-delete | ZAI-MEM-003 | Done |
| memory-export | ZAI-MEM-004 | Done |
| folder-indexer | ZAI-FS-001 | Done |
| memory_cli.py | - | Done |
| folder_indexer.py | - | Done |

### Pending

| # | Task | Status |
|---|------|--------|
| 1 | Index real document folders | Pending |
| 2 | Populate memory with knowledge via ADE | Pending |
| 3 | Web interface for browsing memory | Pending |
| 4 | Integration with ZCodeProject projects | Pending |
| 5 | Add graph layer (NetworkX + edges.json) | Done (All 5 phases) |

### Memory Graph Layer (COMPLETE — All 5 Phases Done)

ChromaDB is vector-based, not graph-based. For connections between records, a graph overlay has been implemented.

**Completed:**
- `tools/graph_engine.py` — NetworkX wrapper (load/save, CRUD edges, traversal, validation, visualization, server, export)
- `memory_cli.py graph` — 12 CLI subcommands (add-edge, remove-edge, query-path, neighbors, subgraph, viz, serve, export, stats, validate, search, merge)
- Auto same_session edge on store
- Phase 3: Enhanced viz — filter by edge type, focus on node, ChromaDB enrichment, viz server with auto-refresh, JSON export
- Phase 4: Dashboard integration code — `dashboard-integration/` with 9 files (API routes, React components, Prisma schema, install script)
- Phase 5: Auto-edges — `folder_indexer.py --graph`, `analyze-imports`, `analyze-deps`, `graph-scan`
- Tested on Windows 2026-05-18

**Remaining (install on Windows):**
- Run `dashboard-integration/install.ps1` to copy files + Prisma migrate
- Run `folder_indexer.py graph-scan` on project folders to populate graph
- Add GraphViewer component to dashboard pages

#### Architecture

```text
ChromaDB                         edges.json (or memory/graph.json)
  {id, vector, metadata}           [{from, to, type, weight}, ...]
       |                                    |
       +--- memory_cli.py ---+--- NetworkX --+
                                  |
                            graph traversal:
                            shortest_path()
                            ancestors()
                            subgraph()
```

#### Capabilities

| Current (vectors only) | With graphs |
|---|---|
| "Find similar to X" | "Find everything connected to X" |
| Flat semantic search | Chains: session -> task -> fix -> commit |
| No connections between records | Edge: `depends_on`, `follow_up`, `fixed_by`, `implements` |

#### New `memory_cli.py` Commands

| Command | Purpose |
|---------|-----------|
| `memory graph add-edge --from X --to Y --type depends_on` | Add edge |
| `memory graph query-path --from X --to Y` | Shortest path between nodes |
| `memory graph subgraph --tag memory` | Subgraph by tag |
| `memory graph viz [--output graph.png]` | Visualization (matplotlib or .dot) |
| `memory graph stats` | Statistics: nodes, edges, connectivity |

#### Technical Risks

| Risk | Danger | Solution |
|------|-----------|---------|
| edges.json gets out of sync with ChromaDB | Edge points to non-existent node_id | `graph validate` -- integrity check |
| edges.json grows large | 50K+ edges -- slow loading | Split by files (edges-sessions.json, edges-code.json) |
| NetworkX in memory for large graphs | RAM limitation | Lazy loading of subgraphs |
| Manual editing of edges.json | JSON errors, broken references | Validate before loading |

### Recommendation: unified space for 10-20K files

#### Principle

Not all files are equally useful. Input classification:

```text
all 20K files
  +-- text (md, py, ts, json, yml, txt, cfg, log)  -> ChromaDB + graph
  +-- documents (pdf, docx, xlsx, pptx)              -> meta + tags (optional OCR)
  +-- media (png, jpg, svg, mp3, mp4)                -> meta + tags (optional caption)
  +-- binaries (exe, dll, bin, pdb, ico)            -> meta only (path, size, date)
  +-- junk (node_modules, .git, __pycache__, cache)  -> exclude by mask
```

#### Three Storage Layers

| Layer | Technology | What It Stores | Estimated Size for 20K |
|------|-----------|-----------|----------------------|
| **Meta-index** | folder_indexer.py (JSON cache) | All 20K: path, size, date, type, hash, tags | 2-3 MB |
| **Vectors** | ChromaDB | ~8K text files (chunks of 500-1000 tokens) | 40-60 MB |
| **Graph** | edges.json + NetworkX | 20K nodes + edges: parent_dir, imports, same_session | 3-5 MB |

#### What Gets Embedded, What Does Not

| File Type | Extensions | Embedding | Meta-index | Graph |
|------------|-----------|-----------|-------------|------|
| Source code | .py, .ts, .js, .rs, .go, .java, .c, .h | Yes, per file | Yes | Yes |
| Docs | .md, .txt, .rst, .pdf (text) | Yes, per file (PDF with parsing) | Yes | Yes |
| Configs | .json, .yml, .yaml, .toml, .ini, .cfg, .env | Yes, whole file | Yes | Yes |
| Logs | .log, .out, .err | No (junk) | Yes (path only) | No |
| Images | .png, .jpg, .svg, .webp, .ico | No | Yes (+ dimensions) | Optional |
| Documents | .pdf, .docx, .xlsx | Optional (OCR) | Yes | Yes |
| Binaries | .exe, .dll, .so, .bin, .pdb, .min.js | No | Yes | No |
| node_modules | -- | Exclude | Exclude | Exclude |
| .git | -- | Exclude | Exclude | Exclude |

#### Input Filtering Rules

Rules for `folder_indexer.py` (exclusion masks):

```python
EXCLUDE_DIRS = ['node_modules', '.git', '__pycache__', '.venv', 'dist', 'build', 'cache']
EXCLUDE_EXTS = ['.exe', '.dll', '.so', '.bin', '.pdb', '.pyc', '.min.js', '.map']
EMBED_EXTS   = ['.md', '.txt', '.py', '.ts', '.js', '.rs', '.go', '.java',
                '.c', '.h', '.json', '.yml', '.yaml', '.toml', '.ini', '.cfg',
                '.env', '.rst', '.csv']
META_ONLY_EXTS = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif', '.ico',
                  '.pdf', '.docx', '.xlsx', '.pptx', '.mp3', '.mp4',
                  '.zip', '.tar', '.gz', '.7z']
```

#### `memory_cli.py` Commands for 20K Files

```bash
# Initial scan -- index 20K, distribute across layers
memory scan C:\Users\stsgr\projects --full-scan

# Incremental update (only changed since date X)
memory scan C:\Users\stsgr\projects --incremental --since 2026-05-01

# Search across all layers
memory search "token caching"                    # ChromaDB semantic
memory search --ext .env                                # meta-index
memory search --tag project:myapp --type config         # meta + tags

# Graph navigation
memory graph path "src/main.rs" "src/lib/auth.rs"       # import path
memory graph files-in "src/features/"                   # all files in folder
memory graph related "docker-compose.yml"               # connected by tag

# Statistics
memory graph stats                                      # nodes, edges, top types
memory scan stats                                       # total count, by type
```

#### Performance

| Operation | Expected | Comment |
|----------|----------|-------------|
| Initial scan 20K files | 2-10 min | Depends on disk (SSD faster) |
| Embedding ~8K text files | 5-15 min | One-time, can run in background |
| Incremental scan | 1-5 sec | Only diff by date/hash |
| Semantic search | 200-500ms | ChromaDB, 8K documents |
| Graph query (path, neighbors) | <50ms | NetworkX in memory |
| Graph visualization (500+ nodes) | 1-3 sec | matplotlib |

#### 20K Files Risks

| Risk | Probability | Solution |
|------|------------|---------|
| Duplicate files (project copies) | High | Hash content (SHA256), group duplicates |
| Huge files (100MB DB logs) | Medium | Skip files >10MB for embedding |
| node_modules not fully filtered | Medium | Masks + manual check of top-10 large folders |
| ChromaDB bloat (too many chunks) | Low | 8K files x 3 chunks = 24K vectors -- ChromaDB handles 1M+ |
| Paths longer than 255 chars (Windows) | Medium | folder_indexer must handle `\\?\` prefix |

### Done

| # | Task | Status |
|---|------|--------|
| 6 | Rename projects/ to project-index/ | Done |

### Architecture

```text
C:\Users\stsgr\.zcode\
+-- memory\
|   +-- chromadb\          <- Vector database
|   +-- project-index\     <- Project catalog
|   +-- sessions\          <- Session logs
|   +-- knowledge\         <- Knowledge base
|   +-- graph.json         <- Edge list (edges between nodes)
+-- tools\
|   +-- memory_cli.py
|   +-- folder_indexer.py
+-- skills\                <- Symlink to toolkit
+-- hooks\
+-- Zai-agent-toolkit\
```

---

## 5. Sync Toolkit Pipeline -- Notes and Issues (TODO)

### 5.1 Hardcoded Paths in SKILL.md (FIXED)

File: `skills/sync-toolkit_sts/SKILL.md`

| Line | Was (hardcoded) | Now |
|--------|----------------|--------------|
| 77 | `cd C:\Users\stsgr\.zcode\Zai-agent-toolkit` | `cd $env:USERPROFILE\.zcode\Zai-agent-toolkit` |
| 89 | `C:\Users\stsgr\.zcode\Zai-agent-toolkit\sync-toolkit.ps1` | `$env:USERPROFILE\.zcode\Zai-agent-toolkit\sync-toolkit.ps1` |
| 94 | `cd C:\Users\stsgr\.zcode\Zai-agent-toolkit` | `cd $env:USERPROFILE\.zcode\Zai-agent-toolkit` |

Hardcoded paths replaced with `$env:USERPROFILE` variables. All repo name references are `Zai-agent-toolkit` (matching the GitHub repository name).

### 5.2 Two Sync Mechanisms -- Resolved

| Mechanism | Location | Result |
|----------|-----------|-----------|
| `sync-toolkit.ps1` | repository root | Thin wrapper -> `scripts/update-toolkit.ps1 -NoPause` |
| `setup-sync-command.ps1` -> `sync-toolkit` function | `$PROFILE` | PS function |

PowerShell function from `$PROFILE` takes priority over `.ps1` file.
Both now delegate to the same `update-toolkit.ps1` script.

### 5.3 Three Scripts Deduplicated (FIXED)

| File | What It Does |
|------|-----------|
| `sync-toolkit.ps1` (root) | Thin wrapper -> `scripts/update-toolkit.ps1 -NoPause` |
| `scripts/update-toolkit.ps1` | Full-featured (version check, up-to-date, errors, `-NoPause` flag) |
| `scripts/update-toolkit.bat` | cmd wrapper -> calls `update-toolkit.ps1 -NoPause` |

### 5.4 Old Repository URL in All Scripts (FIXED)

All active references now point to `Zai-agent-toolkit`:

| File | Status |
|------|--------|
| `INSTALL.md` | Updated |
| `README.md` | Updated |
| `scripts/update-toolkit.ps1` | Updated |
| `scripts/update-toolkit.bat` | Updated |
| `setup.sh` | Updated |
| `skills/sync-toolkit_sts/SKILL.md` | Updated |
| `hooks/auto-save-session.ps1` | Updated |
| `hooks/session-functions.ps1` | Updated |
| `skills/skill-creator/SKILL.md` | Updated |
| `docs/SKILL_ID_GUIDE.md` | Updated |
| `docs/COMMANDS_LOG.md` | Updated |

---

## 6. Missed Audit Items (Resolved)

### 6.1 extract_severity_levels() -- Removed

Function was dead code: defined but never called. Removed from `validate_compatibility.py`.

### 6.2 Mixed Languages in Docs -- Fixed

`docs/TODO.md` and `docs/SKILL_PROCESSES.md` were a mix of English headings and Russian body text.
Translated to English (v2.0.5).

### 6.3 anti-monolith -- Phantom Skill (Resolved)

`skills/anti-monolith/` does not exist in the toolkit, but was referenced in 11 files.

#### Current Status

| File | Status |
|------|--------|
| `AGENT_RULES.md` Section 8.2 (System Skills) | OK -- this is a sandbox built-in |
| `docs/skill-id-registry.md` | Listed under System Skills (Z.ai Sandbox) section |
| `skills/skill-id-system/SKILL.md` | Listed under System Skills section |
| `skills/zai-ui-composer_sts/SKILL.md` | Marked as "System skill (Z.ai sandbox)" |
| `standards/FRONTEND_STANDARD.md` | Changelog: merged anti-monolith patterns (historical) |
| `standards/IMPLEMENTATION_ORDER.md` | Marked as "(system skill)" |
| `docs/SKILL_ID_GUIDE.md` | Marked as "System skill (Z.ai sandbox) -- not in toolkit" |
| `docs/TUTORIAL.md` | Marked as "System skill (Z.ai sandbox)" |
| `docs/COMMANDS_LOG.md` | Marked as "System skill (Z.ai sandbox) -- not in toolkit" |
| `CHANGELOG.md` | Historical (v1.5.0 added) |

---

## 7. Priority Summary

| Priority | Task | Depends On | Status |
|-----------|--------|------------|--------|
| P0 | Fix hardcoded paths in sync-toolkit SKILL.md | -- | Done |
| P1 | Deduplicate sync scripts | P0 | Done |
| P1 | Update URLs: ensure all references match GitHub repo name `Zai-agent-toolkit` | -- | Done |
| P2 | Resolve `extract_severity_levels()` | -- | Done |
| P2 | Rewrite submodule plan (single canonical repo) | P1 (URL) | Done |
| P2 | Clean 7 files with anti-monolith references | -- | Done |
| P3 | Implement graph layer in memory_cli.py | -- | Done (All 5 phases) |
| P3 | Index real folders + populate memory | graph layer optional | Done (folder_indexer.py graph-scan) |
| P3 | Web interface for memory | graph layer | Code ready (dashboard-integration/) |
| P3 | Create `docs/AGENT_ARCHITECTURE.md` | -- | Done |
| P3 | Create `agents/` directory + AGENT.md for 5 agents | AGENT_ARCHITECTURE.md | Pending |
| P3 | Update `opencode.json` -- add `agents.paths` | agents/ | Pending |
| P3 | Enhance `templates/TASK_TEMPLATE.md` -- chain templates | -- | Pending |
| P3 | Enhance `AGENT_RULES.md` -- Section on sub-agents | -- | Pending |
| P4 | Mixed languages in docs | -- | Done |

---

Built with: Python + PowerShell + Markdown
