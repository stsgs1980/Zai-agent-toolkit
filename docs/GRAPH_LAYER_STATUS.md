# Graph Layer — Current Status & Implementation Plan

> Last updated: 2026-05-18
> Status: ALL 5 PHASES COMPLETE (code), dashboard integration pending (Windows)

---

## 1. What Exists on Windows (`C:\Users\stsgr\.zcode\`)

### 1.1 Storage Layer

| Component | Path | Status | Details |
|-----------|------|--------|---------|
| ChromaDB | `memory/chromadb/` | Has data | `chroma.sqlite3` + 2 collections (UUIDs) |
| SQLite (Prisma) | `memory/memory.db` | Schema defined | Used by memory-dashboard |
| Graph | `memory/graph.json` | Auto-created | Edge list (NetworkX) |
| Sessions | `memory/sessions/` | Exists | Session logs |
| Knowledge | `memory/knowledge/` | Exists | Knowledge base |
| Project Index | `memory/project-index/` | Exists | Project catalog |

### 1.2 Python Tools

| File | Path | Graph support |
|------|------|---------------|
| `graph_engine.py` | `tools/graph_engine.py` | Full: CRUD, traversal, viz, server, export |
| `memory_cli.py` | `tools/memory_cli.py` | 12 graph subcommands + auto same_session |
| `folder_indexer.py` | `tools/folder_indexer.py` | --graph, analyze-imports, analyze-deps, graph-scan |

### 1.3 Python Packages (installed)

| Package | Version | Purpose | Used? |
|---------|---------|---------|-------|
| **NetworkX** | 3.6.1 | Graph engine (nodes, edges, traversal) | Yes (graph_engine.py) |
| **pyvis** | (dependency) | Interactive HTML graph visualization | Yes (graph_engine.py) |
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
| `api/memory/related/route.ts` | Related entries via ZAI LLM (SLOW) |
| `api/memory/semantic/route.ts` | Semantic search via ZAI LLM (SLOW) |

**Dashboard integration files ready** at `dashboard-integration/` (need to be copied + Prisma migration run):

| Integration File | Purpose |
|-----------------|---------|
| `api/memory/graph/route.ts` | Graph API: read/add/delete edges |
| `api/memory/graph/vis/route.ts` | Serve Pyvis HTML visualization |
| `api/memory/related-graph/route.ts` | Instant structural relationships (replaces LLM) |
| `components/GraphViewer.tsx` | Interactive force-graph component |
| `components/GraphStats.tsx` | Stats panel (nodes, edges, density) |
| `lib/graph-client.ts` | Typed API client for graph calls |
| `prisma/schema-addition.prisma` | MemoryEdge model for Prisma |
| `install.ps1` | Auto-installer script |

### 1.5 Current Status (Updated 2026-05-18)

| Component | Status | Details |
|-----------|--------|---------|
| `tools/graph_engine.py` | ✅ DONE (1228 lines) | NetworkX wrapper: CRUD, traversal, viz, server, export, ChromaDB enrichment |
| `tools/memory_cli.py` graph subcommand | ✅ DONE (803 lines) | 12 subcommands, auto same_session edge |
| `tools/folder_indexer.py` | ✅ DONE (809 lines) | --graph, analyze-imports, analyze-deps, graph-scan |
| `graph.json` (data) | ✅ Created on first use | `~/.zcode/memory/graph.json` |
| NetworkX usage | ✅ Active | Imported and called in graph_engine.py |
| `dashboard-integration/` | ✅ Code ready | 9 files, need copy to memory-dashboard + Prisma migrate |
| Dashboard graph viewer | ⏳ Pending install | Run `install.ps1` on Windows |

**Tested on Windows:** Phase 1 + Phase 2 commands working (2026-05-18).

### 1.6 Dashboard: "Poor Man's Graph" via LLM

**CRITICAL FINDING:** The dashboard's `related` and `semantic` routes do NOT use structural graph or vector search. They send ALL entries as text to the ZAI LLM and ask it to rank similarity.

| Route | Method | How it works | Problems |
|-------|--------|-------------|----------|
| `related/route.ts` | ZAI chat completions | Sends entry + 20 candidates to LLM | Slow, expensive, no persistent edges |
| `semantic/route.ts` | ZAI chat completions | Sends query + 50 entries to LLM | Slow, expensive, no caching |
| `related-graph/route.ts` (NEW) | Read graph.json | Query edges directly | Instant, free, structural |

**What Graph Layer replaces/enhances:**
- `related` route → `related-graph` route (instant, free, structural)
- `semantic` route → ChromaDB vector search + graph traversal
- LLM fallback → only for complex reasoning, not basic lookups

---

## 2. Architecture

### 2.1 Three-Layer Model

```text
Layer 1: Meta-index (folder_indexer.py — JSON cache)
  All files: path, size, date, type, hash, tags
  Estimated: 2-3 MB for 20K files

Layer 2: Vectors (ChromaDB)
  ~8K text files embedded (chunks of 500-1000 tokens)
  Estimated: 40-60 MB

Layer 3: Graph (graph.json + NetworkX)
  Nodes = ChromaDB entries + file metadata
  Edges = relationships between nodes
  Estimated: 3-5 MB for 20K nodes
```

### 2.2 Graph Layer Components

```text
C:\Users\stsgr\.zcode\memory\
  +-- graph.json              <-- Edge list (single file)
  +-- viz\graph.html          <-- Pyvis visualization (auto-generated)
  +-- chromadb\               <-- Existing vector DB
  +-- memory.db               <-- Existing SQLite (Prisma)

C:\Users\stsgr\.zcode\tools\
  +-- memory_cli.py           <-- 12 graph subcommands + auto edges
  +-- folder_indexer.py       <-- --graph, analyze-imports, analyze-deps, graph-scan
  +-- graph_engine.py         <-- NetworkX wrapper module
```

### 2.3 Edge Types (9 total)

| Edge Type | Meaning | Direction | Auto-created by |
|-----------|---------|-----------|-----------------|
| `parent_dir` | File is in directory | file -> dir | folder_indexer.py --graph |
| `imports` | Code dependency | importer -> imported | folder_indexer.py analyze-imports |
| `same_session` | Created in same session | bidirectional | memory_cli.py store |
| `depends_on` | Task/package dependency | dependent -> dependency | folder_indexer.py analyze-deps |
| `follow_up` | Sequential relation | earlier -> later | Manual |
| `fixed_by` | Bug fix chain | bug -> fix | Manual |
| `implements` | Implementation link | code -> requirement | Manual |
| `modifies` | Commit changes file | commit -> file | Manual |
| `related_to` | Generic relation | bidirectional | Manual |

### 2.4 graph.json Format

```json
{
  "version": 1,
  "created_at": "2026-05-18T12:00:00",
  "stats": {"nodes": 8, "edges": 7, "isolated": 0},
  "edges": [
    {
      "from": "session_20260518_120000",
      "to": "knowledge_20260518_121000",
      "type": "same_session",
      "weight": 1.0,
      "metadata": {}
    }
  ],
  "isolated_nodes": []
}
```

---

## 3. `memory_cli.py` Graph Commands (12)

| Command | Purpose |
|---------|---------|
| `memory graph add-edge --from X --to Y --type TYPE` | Add edge |
| `memory graph remove-edge --from X --to Y` | Remove edge |
| `memory graph query-path --from X --to Y` | Shortest path |
| `memory graph neighbors NODE` | All connected nodes |
| `memory graph subgraph --tag TAG` | Subgraph by tag |
| `memory graph viz [--format html\|png\|dot]` | Visualize |
| `memory graph viz --filter-type same_session,imports` | Filter by edge type |
| `memory graph viz --focus NODE --focus-depth 3` | Focus on neighborhood |
| `memory graph viz --open` | Open in browser |
| `memory graph serve [--port 8765]` | Live viz server with auto-refresh |
| `memory graph export [--output file.json]` | Export JSON for dashboard |
| `memory graph stats` | Statistics |
| `memory graph validate [--check-chroma]` | Integrity check |
| `memory graph search QUERY` | Search nodes |
| `memory graph merge --input FILE` | Merge from another graph.json |

---

## 4. Implementation Status

### Phase 1: Core Engine (graph_engine.py) — ✅ DONE

- Load/save graph.json (atomic write)
- CRUD operations on edges
- Traversal: shortest_path, all_shortest_paths, neighbors, neighbors_by_type, subgraph, connected_component, ancestors, descendants
- Validation: self-loops, orphans, unknown types, ChromaDB cross-check
- Statistics: nodes, edges, density, type distribution, top connected nodes
- 9 edge types defined in EDGE_TYPES
- Demo mode (main())

### Phase 2: CLI Integration (memory_cli.py) — ✅ DONE

- 12 graph subcommands
- Auto same_session edge on `memory store`
- Auto edge from recent session if no session_id in metadata

### Phase 3: Visualization — ✅ DONE

- `graph viz --format html` → pyvis interactive HTML
- `graph viz --format png` → matplotlib static PNG
- `graph viz --format dot` → Graphviz DOT export
- `graph viz --filter-type same_session,imports` → filter by edge types
- `graph viz --focus NODE --focus-depth N` → ego graph visualization
- `graph viz --open` → auto-open in browser
- `graph serve --port 8765` → HTTP server with auto-refresh on graph.json changes
- `graph export` → JSON export for dashboard/API consumption
- Node grouping by ID prefix (session, task, bug, knowledge, commit, src, REQ)
- ChromaDB metadata enrichment in node tooltips
- Dark theme with color-coded edge types and node groups
- Stats panel in HTML with legends

### Phase 4: Dashboard Integration — ✅ Code Ready, ⏳ Install Pending

- `dashboard-integration/api/memory/graph/route.ts` — GET/POST/DELETE graph edges
- `dashboard-integration/api/memory/graph/vis/route.ts` — Serve Pyvis HTML
- `dashboard-integration/api/memory/related-graph/route.ts` — Fast structural relationships
- `dashboard-integration/components/GraphViewer.tsx` — Canvas force-directed graph
- `dashboard-integration/components/GraphStats.tsx` — Stats panel
- `dashboard-integration/lib/graph-client.ts` — Typed API client
- `dashboard-integration/prisma/schema-addition.prisma` — MemoryEdge model
- `dashboard-integration/install.ps1` — Auto-installer
- `dashboard-integration/README.md` — Beginner-friendly install guide

**To install on Windows:** Run `install.ps1` from memory-dashboard root

### Phase 5: Auto-edge Creation — ✅ DONE

- `folder_indexer.py scan --graph` → creates `parent_dir` edges
- `folder_indexer.py update --graph` → updates + creates parent_dir edges
- `folder_indexer.py analyze-imports PATH --graph` → creates `imports` edges (Python/JS/TS/Rust)
- `folder_indexer.py analyze-deps PATH --graph` → creates `depends_on` edges (package.json/requirements.txt/Cargo.toml)
- `folder_indexer.py graph-scan PATH` → combined: index + parent_dir + imports + deps
- Regex-based import parsing (no AST, no new dependencies)
- Graceful fallback when graph_engine unavailable

---

## 5. Technical Risks & Mitigations

| Risk | Danger | Mitigation |
|------|--------|------------|
| graph.json out of sync with ChromaDB | Orphan edges to deleted nodes | `graph validate --check-chroma` command |
| graph.json grows large | Slow loading (50K+ edges) | Split by type, lazy subgraph loading |
| NetworkX RAM for large graphs | OOM on 20K+ nodes | `_filter_subgraph()` with limit parameter |
| Manual JSON editing | Broken structure | Validate before load, atomic writes |
| Two databases (ChromaDB + SQLite) | Data inconsistency | graph.json is the single source of truth for edges |
| Race condition (Python writes, Next.js reads) | Corrupt read | Retry logic in API routes, atomic tmp+rename writes |

---

## 6. Next Steps

1. **Install dashboard integration** — Run `install.ps1` on Windows
2. **Run graph-scan** on project folders — Populate graph with real data
3. **Add GraphViewer to dashboard pages** — See README.md step 7
4. **Test related-graph vs related** — Compare speed and quality
5. **Cloudflare tunnel** — Real-time sandbox ↔ Windows when working

---

Built with: Z.ai Agent Toolkit
