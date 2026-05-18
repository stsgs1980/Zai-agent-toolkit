# Dashboard Integration — Graph Layer

This folder contains everything you need to add the **graph layer** to your
memory-dashboard (Next.js 15 + Prisma + SQLite + shadcn/ui).

The graph layer lets you see **how your memories are connected** — instead of
calling a slow, expensive AI every time you want "related" entries, it reads
pre-built edges from a JSON file. Instant and free.

---

## What Each File Does

| File | What it does | Where to copy it |
|------|-------------|-----------------|
| `prisma/schema-addition.prisma` | Adds the `MemoryEdge` database table | Merge into `prisma/schema.prisma` |
| `api/memory/graph/route.ts` | API: list/add/delete graph edges | `app/api/memory/graph/route.ts` |
| `api/memory/graph/vis/route.ts` | API: serve Pyvis visualization HTML | `app/api/memory/graph/vis/route.ts` |
| `api/memory/related-graph/route.ts` | API: fast related entries (replaces LLM) | `app/api/memory/related-graph/route.ts` |
| `components/GraphViewer.tsx` | React: interactive force-graph (canvas) | `components/GraphViewer.tsx` |
| `components/GraphStats.tsx` | React: stats panel (nodes, edges, density) | `components/GraphStats.tsx` |
| `lib/graph-client.ts` | TypeScript: helper functions for API calls | `lib/graph-client.ts` |
| `install.ps1` | PowerShell: auto-copy files + run migration | Run from memory-dashboard root |

---

## How the Pieces Fit Together

```
Your browser
  |
  v
GraphViewer.tsx  ----fetch---->  /api/memory/graph        ---> graph.json (on disk)
GraphStats.tsx   ----fetch---->  /api/memory/graph/stats  ---> graph.json (on disk)
                                /api/memory/graph/vis     ---> graph.html (pyvis)
                                /api/memory/related-graph ---> graph.json (fast!)
                                                              OR LLM (slow fallback)

graph.json is created by the Python tools:
  tools/graph_engine.py  -- the engine (NetworkX)
  tools/memory_cli.py    -- the CLI (graph add-edge, graph viz, etc.)
```

**Key idea:** The Python tools *write* graph.json. The Next.js dashboard
*reads* graph.json. They share the same file, so they stay in sync.

---

## Install Steps (Do These In Order)

### Step 1: Copy the Python tools

Make sure all 3 Python tools are in `~/.zcode/tools/`:

```powershell
Copy-Item "$env:USERPROFILE\.zcode\Zai-agent-toolkit\tools\graph_engine.py" "$env:USERPROFILE\.zcode\tools\graph_engine.py" -Force
Copy-Item "$env:USERPROFILE\.zcode\Zai-agent-toolkit\tools\memory_cli.py" "$env:USERPROFILE\.zcode\tools\memory_cli.py" -Force
Copy-Item "$env:USERPROFILE\.zcode\Zai-agent-toolkit\tools\folder_indexer.py" "$env:USERPROFILE\.zcode\tools\folder_indexer.py" -Force
```

### Step 2: Install Python dependencies

```powershell
pip install networkx pyvis matplotlib
```

### Step 3: Run the install script

Open PowerShell in your memory-dashboard folder and run:

```powershell
cd C:\Users\stsgr\.zcode\memory-dashboard
& "$env:USERPROFILE\.zcode\Zai-agent-toolkit\dashboard-integration\install.ps1"
```

The script will:
1. Detect if your project uses `src/` layout (auto-adjusts paths)
2. Copy API routes, components, and lib files
3. Add the MemoryEdge model to your Prisma schema
4. Run `npx prisma db push`
5. Verify graph.json exists
6. Check Python dependencies

**Option B — Copy manually:**

If you prefer manual installation, copy each file to the matching location.
Note: if your project uses `src/` directory, prepend `src/` to all paths below:

```
prisma/schema-addition.prisma   --> merge INTO prisma/schema.prisma
api/memory/graph/route.ts       --> src/app/api/memory/graph/route.ts
api/memory/graph/vis/route.ts   --> src/app/api/memory/graph/vis/route.ts
api/memory/related-graph/route.ts --> src/app/api/memory/related-graph/route.ts
components/GraphViewer.tsx      --> src/components/GraphViewer.tsx
components/GraphStats.tsx       --> src/components/GraphStats.tsx
lib/graph-client.ts             --> src/lib/graph-client.ts
```

### Step 4: Update your Prisma schema (if doing manual install)

Open `prisma/schema.prisma` in your memory-dashboard project.

**Add the MemoryEdge model** — copy everything from
`prisma/schema-addition.prisma` and paste it at the bottom of your schema file.

**Add relation fields to MemoryEntry** — find your existing `MemoryEntry`
model and add these two lines at the bottom (before the closing `}`):

```prisma
  fromEdges MemoryEdge[] @relation("FromEdges")
  toEdges   MemoryEdge[] @relation("ToEdges")
```

Then run the migration:

```bash
npx prisma db push
```

### Step 5: Verify the graph.json file exists

The dashboard reads from this file:

```
C:\Users\stsgr\.zcode\memory\graph.json
```

If you have never used the graph commands before, create it by running:

```bash
python ~/.zcode/tools/memory_cli.py graph stats
```

This will create an empty graph.json automatically.

### Step 6: Test the graph API

Start your dashboard dev server:

```bash
npm run dev
```

Then open these URLs in your browser:

| URL | What you should see |
|-----|-------------------|
| `http://localhost:3000/api/memory/graph` | JSON with stats and edges |
| `http://localhost:3000/api/memory/graph?node=some_id` | Edges for a specific node |
| `http://localhost:3000/api/memory/graph?type=same_session` | Filtered edges |
| `http://localhost:3000/api/memory/graph/vis` | Pyvis HTML visualization |

### Step 7: Add the GraphViewer to a page

In any page component, import and use:

```tsx
import { GraphViewer } from "@/components/GraphViewer";
import { GraphStats } from "@/components/GraphStats";

export default function GraphPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Memory Graph</h1>
      <GraphStats />
      <GraphViewer />
    </div>
  );
}
```

The GraphViewer uses a custom canvas-based force-directed layout (no extra
npm dependencies needed — it does not use D3 or vis-network on the client side).

---

## Troubleshooting

| Problem | Solution |
|---------|---------|
| `graph.json not found` error | Run `python ~/.zcode/tools/memory_cli.py graph stats` to create it |
| Prisma migration fails | Make sure you added both the MemoryEdge model AND the relation fields to MemoryEntry |
| GraphViewer shows blank | Check browser console for errors. Make sure `shadcn/ui` is installed (Card, Button, Badge) |
| Pyvis HTML shows 404 | Run `python ~/.zcode/tools/memory_cli.py graph viz --format html --no-enrich` once to generate the file |
| `related-graph` falls back to LLM | This is normal if no edges exist for that node yet. Add edges with `memory graph add-edge` |
| Files went to wrong directory | The install script auto-detects `src/` layout. If it guessed wrong, move files manually |
| Python CLI not found | Make sure tools are copied to `~/.zcode/tools/` or set `ZAI_TOOLKIT_PATH` env var |

---

## How Python and Next.js Work Together

```
Python side (writes graph.json):
  - You run: python memory_cli.py graph add-edge --from A --to B --type same_session
  - graph_engine.py saves the edge to graph.json

Next.js side (reads graph.json):
  - Dashboard calls /api/memory/graph
  - route.ts reads graph.json from disk
  - Returns edges as JSON to the browser

They never call each other directly. They share the same file.
```

This is simple and reliable. The only thing to watch out for: if Python is
writing to graph.json at the exact same moment Next.js is reading it, you
might get a brief read error. The code handles this with a retry.

---

Built with: Z.ai Agent Toolkit
