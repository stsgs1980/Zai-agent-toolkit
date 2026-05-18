# Graph Layer — Current Status & Implementation Plan

> Last updated: 2026-05-18
> Status: P3 — NOT STARTED (code), PARTIAL (dashboard)

---

## 1. What Exists on Windows (`C:\Users\stsgr\.zcode\`)

### 1.1 Storage Layer

| Component | Path | Status | Details |
|-----------|------|--------|---------|
| ChromaDB | `memory/chromadb/` | Has data | `chroma.sqlite3` + 2 collections (UUIDs) |
| SQLite (Prisma) | `memory/memory.db` | Schema defined | Used by memory-dashboard |
| Sessions | `memory/sessions/` | Exists | Session logs |
| Knowledge | `memory/knowledge/` | Exists | Knowledge base |
| Project Index | `memory/project-index/` | Exists | Project catalog |

### 1.2 Python Tools

| File | Path | Graph support |
|------|------|---------------|
| `memory_cli.py` | `tools/memory_cli.py` | None — only init/store/query/list/delete/export |
| `folder_indexer.py` | `tools/folder_indexer.py` | None — filesystem indexing only |

### 1.3 Python Packages (installed)

| Package | Version | Purpose | Used? |
|---------|---------|---------|-------|
| **NetworkX** | 3.6.1 | Graph engine (nodes, edges, traversal) | No |
| **pyvis** | (dependency) | Interactive HTML graph visualization | No |
| **ChromaDB** | installed | Vector search | Yes (memory_cli.py) |

### 1.4 Memory Dashboard (Next.js)

**Location:** `memory-dashboard/`
**Stack:** Next.js 15 + Prisma + SQLite + shadcn/ui + z-ai-web-dev-sdk + Tailwind 4
**Build:** Compiled (`.next/` exists)

| API Route | Purpose |
|-----------|---------|
| `api/memories/route.ts` | List all memories |
| `api/memory/route.ts` | CRUD single memory |
| `api/memory/backup/route.ts` | Backup |
| `api/memory/import/route.ts` | Import |
| `api/memory/related/route.ts` | Related entries via ZAI LLM prompt (AI-based, NOT graph) |
| `api/memory/semantic/route.ts` | Semantic search via ZAI LLM prompt (AI-based, NOT ChromaDB) |

**Prisma Schema:**

```prisma
model MemoryEntry {
  id        String   @id
  type      String
  content   String
  metadata  String   @default("{}")
  embedding String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model MemoryCollection {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  count       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model MemoryBackup {
  id        String   @id @default(cuid())
  name      String
  data      String
  size      Int      @default(0)
  createdAt DateTime @default(now())
}
```

### 1.5 Current Status (Updated 2026-05-18)

| Component | Status | Details |
|-----------|--------|---------|
| `tools/graph_engine.py` | ✅ DONE | NetworkX wrapper, all traversal/CRUD/viz |
| `tools/memory_cli.py` graph subcommand | ✅ DONE | 10 subcommands, auto same_session edge |
| `graph.json` (data) | ✅ Created on first use | `~/.zcode/memory/graph.json` |
| NetworkX usage | ✅ Active | Imported and called in graph_engine.py |
| `MemoryEdge` model in Prisma | ❌ Pending (Phase 4) | No edge/table schema in dashboard DB |
| Dashboard graph viewer | ❌ Pending (Phase 4) | No graph component in dashboard |

**Tested on Windows:** All Phase 1 + Phase 2 commands working (2026-05-18).

### 1.6 Dashboard: "Poor Man's Graph" via LLM

**CRITICAL FINDING:** The dashboard's `related` and `semantic` routes do NOT use structural graph or vector search. They send ALL entries as text to the ZAI LLM and ask it to rank similarity.

| Route | Method | How it works | Problems |
|-------|--------|-------------|----------|
| `related/route.ts` | ZAI chat completions | Sends entry + 20 candidates to LLM, asks for JSON with scores | Slow, expensive, no persistent edges, limited to 20 candidates |
| `semantic/route.ts` | ZAI chat completions | Sends query + 50 entries to LLM, asks for ranking | Slow, expensive, no caching, limited to 50 entries |
| `db.ts` | Prisma + SQLite | Standard singleton client | No graph models, no edge table |

**Why this is a problem:**
- Every query = API call (costs tokens, 1-3 sec latency)
- Cannot traverse chains (session -> task -> fix -> commit)
- Relationships are NOT stored — recalculated every time
- Scales poorly: 1000+ entries = oversized prompts
- No structural edges (imports, parent_dir, depends_on)

**What Graph Layer replaces/enhances:**
- `related` route → query edges.json (instant, free, structural)
- `semantic` route → ChromaDB vector search + graph traversal
- LLM fallback → only for complex reasoning, not basic lookups

---

## 2. Architecture (Planned)

### 2.1 Three-Layer Model

```text
Layer 1: Meta-index (folder_indexer.py — JSON cache)
  All files: path, size, date, type, hash, tags
  Estimated: 2-3 MB for 20K files

Layer 2: Vectors (ChromaDB)
  ~8K text files embedded (chunks of 500-1000 tokens)
  Estimated: 40-60 MB

Layer 3: Graph (edges.json + NetworkX)  <-- THIS IS WHAT WE BUILD
  Nodes = ChromaDB entries + file metadata
  Edges = relationships between nodes
  Estimated: 3-5 MB for 20K nodes
```

### 2.2 Graph Layer Components

```text
C:\Users\stsgr\.zcode\memory\
  +-- graph.json              <-- Edge list (single file for now)
  +-- chromadb\               <-- Existing vector DB
  +-- memory.db               <-- Existing SQLite (Prisma)

C:\Users\stsgr\.zcode\tools\
  +-- memory_cli.py           <-- ADD: graph subcommands
  +-- folder_indexer.py       <-- Existing
  +-- graph_engine.py         <-- NEW: NetworkX wrapper module
```

### 2.3 Edge Types

| Edge Type | Meaning | Direction | Example |
|-----------|---------|-----------|---------|
| `parent_dir` | File is in directory | file -> dir | `src/main.rs` -> `src/` |
| `imports` | Code dependency | importer -> imported | `main.rs` -> `lib/auth.rs` |
| `same_session` | Created in same session | bidirectional | session_20260518 -> entry_1 |
| `depends_on` | Task dependency | task -> prerequisite | "fix auth" -> "add tests" |
| `follow_up` | Sequential relation | earlier -> later | entry_1 -> entry_2 |
| `fixed_by` | Bug fix chain | bug -> fix | "crash on X" -> "patch Y" |
| `implements` | Implementation link | code -> requirement | `auth.ts` -> "REQ-001" |
| `related_to` | Generic relation | bidirectional | any -> any |

### 2.4 graph.json Format

```json
{
  "version": 1,
  "created_at": "2026-05-18T12:00:00",
  "edges": [
    {
      "from": "session_20260518_120000",
      "to": "knowledge_20260518_121000",
      "type": "same_session",
      "weight": 1.0,
      "metadata": {}
    },
    {
      "from": "src/main.rs",
      "to": "src/lib/auth.rs",
      "type": "imports",
      "weight": 0.8,
      "metadata": { "line": 5 }
    }
  ]
}
```

---

## 3. New `memory_cli.py` Commands

| Command | Purpose |
|---------|---------|
| `memory graph add-edge --from X --to Y --type depends_on` | Add edge |
| `memory graph remove-edge --from X --to Y --type depends_on` | Remove edge |
| `memory graph query-path --from X --to Y` | Shortest path |
| `memory graph neighbors X` | All nodes connected to X |
| `memory graph subgraph --tag memory` | Subgraph by tag |
| `memory graph viz [--output graph.html]` | Visualization (pyvis = interactive HTML) |
| `memory graph stats` | Statistics: nodes, edges, connectivity |
| `memory graph validate` | Integrity check: edges -> existing nodes |

---

## 4. Implementation Order

### Phase 1: Core Engine (graph_engine.py)

```python
# New file: tools/graph_engine.py
# Responsibilities:
#   - Load/save graph.json
#   - Build NetworkX DiGraph in memory
#   - CRUD operations on edges
#   - Traversal: shortest_path, neighbors, subgraph
#   - Validation: orphan edges, missing nodes
#   - Statistics: node count, edge count, density, components
```

### Phase 2: CLI Integration (memory_cli.py)

- Add `graph` subcommand with all sub-subcommands
- Integrate graph_engine.py as module
- Auto-create graph.json on first `graph` command if missing
- Sync: when storing new entry, optionally add edges

### Phase 3: Visualization

- `memory graph viz` -> pyvis interactive HTML
- `memory graph viz --output graph.png` -> matplotlib static image
- Open HTML in default browser

### Phase 4: Dashboard Integration

- Add `MemoryEdge` model to Prisma schema
- API route: `api/memory/graph/route.ts` -> read edges.json
- API route: `api/memory/graph/vis/route.ts` -> serve pyvis HTML
- Dashboard component: interactive graph viewer

### Phase 5: Auto-edge Creation

- `folder_indexer.py` creates `parent_dir` edges during indexing
- `memory_cli.py store` creates `same_session` edges
- Import analysis for `imports` edges (language-specific)

---

## 5. Technical Risks & Mitigations

| Risk | Danger | Mitigation |
|------|--------|------------|
| edges.json out of sync with ChromaDB | Orphan edges to deleted nodes | `graph validate` command |
| edges.json grows large | Slow loading (50K+ edges) | Split by type (edges-sessions.json, etc.) |
| NetworkX RAM for large graphs | OOM on 20K+ nodes | Lazy loading of subgraphs |
| Manual JSON editing | Broken structure | Validate before load |
| Two databases (ChromaDB + SQLite) | Data inconsistency | graph.json is the single source of truth for edges |

---

## 6. Dependency Chain (DO NOT REORDER)

```
Phase 1 (graph_engine.py)     <- MUST be first, no dependencies
    |
Phase 2 (CLI integration)     <- Depends on Phase 1
    |
Phase 3 (Visualization)       <- Depends on Phase 1
    |
Phase 4 (Dashboard)           <- Depends on Phase 1 + Phase 2
    |
Phase 5 (Auto-edges)          <- Depends on Phase 1 + Phase 2
```

Phases 3, 4, 5 can be done in parallel after Phase 2 is complete.

---

## 7. Files to Create/Modify

### New Files (in toolkit repo)

| File | Purpose |
|------|---------|
| `tools/graph_engine.py` | NetworkX wrapper: load/save/traverse/validate |
| `tools/graph_schema.json` | JSON schema for edges.json validation |

### Modified Files

| File | Change |
|------|--------|
| `tools/memory_cli.py` | Add `graph` subcommand with 8 sub-subcommands |
| `tools/folder_indexer.py` | Add `--graph` flag to create parent_dir edges |
| `docs/TODO.md` | Update Section 4 status |

### New Files (on Windows, not in repo)

| File | Purpose |
|------|---------|
| `~/.zcode/memory/graph.json` | Edge data (runtime, created automatically) |

---

Built with: Z.ai Agent Toolkit
