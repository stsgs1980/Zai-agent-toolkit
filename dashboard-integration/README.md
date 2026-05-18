# Dashboard Integration — Memory Dashboard (v2)

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
| `api/memory/entries/route.ts` | API: list entries by type (Python bridge) | `app/api/memory/entries/route.ts` |
| `api/memory/search/route.ts` | API: semantic search (Python bridge) | `app/api/memory/search/route.ts` |
| `api/memory/experience/route.ts` | API: experience CRUD + verify (Python bridge) | `app/api/memory/experience/route.ts` |
| `api/memory/stats/route.ts` | API: dashboard stats aggregation | `app/api/memory/stats/route.ts` |
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
| **Schema** | | |
| `prisma/schema-addition.prisma` | Adds MemoryEdge table to Prisma schema | Merge into `prisma/schema.prisma` |
| **Install** | | |
| `install.ps1` | PowerShell: auto-copy files + Prisma migrate | Run from memory-dashboard root |

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
  |-- DashboardHome.tsx  ----->  /api/memory/stats       ---> Python bridge (memory_cli.py + graph.json)
  |-- MemoryBrowser.tsx  ----->  /api/memory/entries      ---> Python bridge (memory_cli.py list)
  |                       \--->  /api/memory/search       ---> Python bridge (memory_cli.py query)
  |-- GraphViewer.tsx    ----->  /api/memory/graph        ---> graph.json (direct read)
  |-- GraphStats.tsx     ----->  /api/memory/graph/stats  ---> graph.json (direct read)
  |-- DocIntelligenceView -->   /api/memory/doc-intelligence ---> z-ai-web-dev-sdk (LLM)
  |-- ExperienceView.tsx  ----->  /api/memory/experience   ---> Python bridge (session_summary.py)

Python tools (write data):
  - memory_cli.py     -> ChromaDB + graph.json
  - graph_engine.py   -> graph.json (NetworkX)
  - session_summary.py -> ChromaDB (experience entries)
  - doc_intelligence.py -> ChromaDB (extracted knowledge)
  - folder_indexer.py  -> ChromaDB + graph.json
```

**Key idea:** Python tools *write* data. Next.js API routes *read* data.
API routes bridge to Python via `execFile()` for entries/search/experience.
Graph and stats read `graph.json` directly (fast, no Python needed).

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

The script will:
1. Detect if your project uses `src/` layout (auto-adjusts paths)
2. Copy all 8 API routes
3. Copy all 7 components
4. Copy lib/graph-client.ts
5. Add MemoryEdge model to Prisma schema
6. Run `npx prisma db push`
7. Update page.tsx to use MemoryDashboard
8. Verify graph.json exists and Python dependencies are installed

### Step 4: Start the dashboard

```bash
npm run dev
```

Open `http://localhost:3000` — you should see the Memory Dashboard with 5 tabs.

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

---

Built with: Z.ai Agent Toolkit + Python + Next.js
