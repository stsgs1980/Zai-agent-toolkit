# Dashboard Integration — Memory Dashboard (v3)

Full-featured **Memory Dashboard** for your Zai-agent-toolkit memory system.
Next.js 15 + Prisma + SQLite + shadcn/ui + Python tools bridge.

---

## What Each File Does

| File | What it does | Where to copy it |
|------|-------------|-----------------|
| **API Routes** | | |
| `api/memory/graph/route.ts` | API: list/add/delete graph edges | `app/api/memory/graph/route.ts` |
| `api/memory/graph/vis/route.ts` | API: serve Pyvis visualization HTML | `app/api/memory/graph/vis/route.ts` |
| `api/memory/related-graph/route.ts` | API: fast related entries (replaces LLM) | `app/api/memory/related-graph/route.ts` |
| `api/memory/doc-intelligence/route.ts` | API: AI document extraction (z-ai-web-dev-sdk) | `app/api/memory/doc-intelligence/route.ts` |
| `api/memory/entries/route.ts` | API: list entries by type (shared bridge + cache) | `app/api/memory/entries/route.ts` |
| `api/memory/search/route.ts` | API: semantic search (shared bridge) | `app/api/memory/search/route.ts` |
| `api/memory/experience/route.ts` | API: experience CRUD + verify (shared bridge + cache) | `app/api/memory/experience/route.ts` |
| `api/memory/stats/route.ts` | API: dashboard stats aggregation (shared bridge + cache) | `app/api/memory/stats/route.ts` |
| **Shared Bridge** | | |
| `lib/memory/bridge.ts` | Shared Python bridge: dual-path script lookup, execFile with proper env | `lib/memory/bridge.ts` |
| `lib/memory/cache.ts` | TTL cache: singleton, getOrFetch(), auto-expire, invalidation | `lib/memory/cache.ts` |
| `lib/memory/preload.ts` | Cache warmer: HTTP calls to localhost on server start | `lib/memory/preload.ts` |
| `instrumentation.ts` | Next.js hook: auto-runs preload on server start (15.5+) | `instrumentation.ts` (project root) |
| **Components** | | |
| `components/MemoryDashboard.tsx` | Main layout: header + tab navigation + footer | `components/MemoryDashboard.tsx` |
| `components/DashboardHome.tsx` | Home tab: stats overview (entries, graph, experience) | `components/DashboardHome.tsx` |
| `components/MemoryBrowser.tsx` | Memory tab: browse entries by type + semantic search | `components/MemoryBrowser.tsx` |
| `components/GraphViewer.tsx` | Graph tab: interactive force-directed graph (canvas) | `components/GraphViewer.tsx` |
| `components/GraphStats.tsx` | Graph tab: stats strip (nodes, edges, density) | `components/GraphStats.tsx` |
| `components/DocIntelligenceView.tsx` | Intelligence tab: AI document extraction UI | `components/DocIntelligenceView.tsx` |
| `components/ExperienceView.tsx` | Experience tab: good/bad/verify experience browser | `components/ExperienceView.tsx` |
| **Lib** | | |
| `lib/graph-client.ts` | TypeScript: all API client functions | `lib/graph-client.ts` |
| `lib/types.ts` | TypeScript: shared type definitions | `lib/types.ts` |
| `lib/constants.ts` | TypeScript: shared constants | `lib/constants.ts` |
| **Schema** | | |
| `prisma/schema-addition.prisma` | Adds MemoryEdge table to Prisma schema | Merge into `prisma/schema.prisma` |
| **Install** | | |
| `install.ps1` | PowerShell: auto-copy files + Prisma migrate + verify preload | Run from memory-dashboard root |

---

## Dashboard Tabs

| Tab | What it shows | API calls |
|-----|--------------|-----------|
| **Dashboard** | Stats overview: entry counts by type, graph nodes/edges, experience verification status | `/api/memory/stats` |
| **Memory** | Browse entries by type (knowledge, pattern, command, etc.) + semantic search | `/api/memory/entries`, `/api/memory/search` |
| **Graph** | Interactive force-directed graph + stats | `/api/memory/graph` |
| **Intelligence** | AI-powered document extraction (paste .md, extract terms/instructions/commands) | `/api/memory/doc-intelligence` |
| **Experience** | Good/bad experience entries, create new, verify, search | `/api/memory/experience` |

---

## Architecture

```
Browser
  |
  v
MemoryDashboard.tsx (tab navigation)
  |-- DashboardHome.tsx  ----->  /api/memory/stats       ---> bridge + cache (memory_cli.py + graph.json)
  |-- MemoryBrowser.tsx  ----->  /api/memory/entries      ---> bridge + cache (memory_cli.py export)
  |                       \--->  /api/memory/search       ---> bridge (memory_cli.py query, NOT cached)
  |-- GraphViewer.tsx    ----->  /api/memory/graph        ---> graph.json (direct read)
  |-- GraphStats.tsx     ----->  /api/memory/graph/stats  ---> graph.json (direct read)
  |-- DocIntelligenceView -->   /api/memory/doc-intelligence ---> z-ai-web-dev-sdk (LLM)
  |-- ExperienceView.tsx  ----->  /api/memory/experience   ---> bridge + cache (session_summary.py)

Shared layer:
  lib/memory/bridge.ts  -> execPython() / runPython() — dual-path lookup, 10MB buffer, UTF-8
  lib/memory/cache.ts   -> MemoryCache singleton — TTL 60s, getOrFetch(), invalidate()
  lib/memory/preload.ts -> HTTP cache warmer on server start
  instrumentation.ts    -> Next.js auto-hook, calls preload after server ready

Python tools (write data):
  - memory_cli.py     -> ChromaDB + graph.json
  - graph_engine.py   -> graph.json (NetworkX)
  - session_summary.py -> ChromaDB (experience entries)
  - doc_intelligence.py -> ChromaDB (extracted knowledge)
  - folder_indexer.py  -> ChromaDB + graph.json
```

**Key idea:** Python tools *write* data. Next.js API routes *read* data.
API routes bridge to Python via shared `lib/memory/bridge.ts` (replaces duplicated inline code).
Graph reads `graph.json` directly (fast, no Python needed).

---

## Preload (Cache Warming)

### The Problem

Python + ChromaDB import takes **3.1 seconds** on cold start. Every API route that calls `memory_cli.py` pays this penalty on the first request after server restart. The stats endpoint calls Python 8 times in parallel — first request takes **6+ seconds**.

### The Solution

`instrumentation.ts` + `lib/memory/preload.ts` automatically warm the TTL cache when the Next.js server starts. After preload, all cached endpoints respond in **~55ms** instead of 6 seconds.

### How It Works

```
Server starts
  |
  v
instrumentation.ts: register()
  |-- Imports lib/memory/preload.ts
  |-- Calls preloadMemoryCache()
  |     |
  |     v
  |   Waits 2s for server to be ready
  |     |
  |     v
  |   HTTP fetch to localhost:
  |     /api/memory/entries?type=knowledge  -> bridge + cache
  |     /api/memory/entries?type=session    -> bridge + cache
  |     /api/memory/entries?type=project    -> bridge + cache
  |     /api/memory/stats                   -> bridge + cache
  |     (experience type NOT preloaded — memory_cli.py export doesn't support it yet)
  |
  v
Server ready — all subsequent requests hit cache (~55ms)
```

### What Gets Cached

| Endpoint | Cached? | TTL | Cache Key |
|----------|---------|-----|-----------|
| `GET /api/memory/entries?type=X` | Yes | 60s | `entries:X` |
| `GET /api/memory/stats` | Yes | 60s | `stats` |
| `GET /api/memory/experience?action=list` | Yes | 60s | `experience:list` |
| `GET /api/memory/search?q=...` | No | — | Queries are dynamic |
| `POST /api/memory/entries` | Invalidates | — | Clears `entries:X` |
| `POST /api/memory/experience` | Invalidates | — | Clears `experience:list` |

### No Config Needed

In Next.js 15.5+, `instrumentation.ts` is auto-detected. No changes to `next.config.ts` required. The file goes in the project root (or `src/` if using src layout) alongside `page.tsx`.

### Verify Preload Is Working

After `npm run dev`, look in the server console for:
```
[preload] Cache warmed: 4 ok, 0 failed
```
If you see failures, check the troubleshooting section below.

---

## Install Steps

### Step 1: Copy the Python tools

Make sure all 4 Python tools are in `~/.zcode/tools/`:

```powershell
Copy-Item "$env:USERPROFILE\.zcode\Zai-agent-toolkit\tools\graph_engine.py" "$env:USERPROFILE\.zcode\tools\" -Force
Copy-Item "$env:USERPROFILE\.zcode\Zai-agent-toolkit\tools\memory_cli.py" "$env:USERPROFILE\.zcode\tools\" -Force
Copy-Item "$env:USERPROFILE\.zcode\Zai-agent-toolkit\tools\folder_indexer.py" "$env:USERPROFILE\.zcode\tools\" -Force
Copy-Item "$env:USERPROFILE\.zcode\Zai-agent-toolkit\tools\session_summary.py" "$env:USERPROFILE\.zcode\tools\" -Force
```

### Step 2: Install Python dependencies

```powershell
pip install networkx pyvis matplotlib chromadb
```

### Step 3: Run the install script

Open PowerShell in your memory-dashboard folder and run:

```powershell
cd C:\Users\stsgr\.zcode\memory-dashboard
& "$env:USERPROFILE\.zcode\Zai-agent-toolkit\dashboard-integration\install.ps1"
```

The script (v3) will:
1. Detect if your project uses `src/` layout (auto-adjusts paths)
2. Copy all 8 API routes
3. Copy all 15 components
4. Copy lib files including `lib/memory/` (bridge, cache, preload)
5. Copy `instrumentation.ts` to project root
6. Add MemoryEdge model to Prisma schema and run `npx prisma db push`
7. Update page.tsx to use MemoryDashboard
8. Verify graph.json exists and Python dependencies are installed
9. Verify all 4 preload infrastructure files are in place

### Step 4: Start the dashboard

```bash
npm run dev
```

Open `http://localhost:3000` — you should see the Memory Dashboard with 5 tabs. Check the server console for `[preload] Cache warmed: 4 ok, 0 failed`.

---

## Troubleshooting

| Problem | Solution |
|---------|---------|
| `graph.json not found` error | Run `python ~/.zcode/tools/memory_cli.py graph stats` to create it |
| Prisma migration fails | Make sure you added both the MemoryEdge model AND the relation fields to MemoryEntry |
| GraphViewer shows blank | Check browser console for errors. Make sure `shadcn/ui` is installed (Card, Button, Badge) |
| Entries/Experience tabs empty | Run `python memory_cli.py list knowledge --limit 10` to check if data exists |
| Python bridge errors | Check that tools are in `~/.zcode/tools/` or set `ZAI_TOOLKIT_PATH` env var |
| `session_summary.py not found` | Copy it from `Zai-agent-toolkit/tools/` to `~/.zcode/tools/` |
| Search returns nothing | Make sure ChromaDB has data: `python memory_cli.py query "test"` |
| Stats page shows zeros | Run the Python tools once to populate ChromaDB + graph.json |
| `[preload] 4 ok, 1 failed` | The "experience" type fails because `memory_cli.py export` doesn't support it yet. This is expected. |
| First API call is slow (6s) | Preload may not have run. Check that `instrumentation.ts` exists in project root. |
| Cache seems stale | Cache TTL is 60s. Wait or restart server. POST requests invalidate related cache. |
| `instrumentation.ts not found` | Make sure you ran the latest `install.ps1` (v3). It copies instrumentation.ts automatically. |

---

Built with: Z.ai Agent Toolkit + Python + Next.js
