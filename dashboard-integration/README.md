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
| `components/GraphViewer.tsx` | React: interactive force-graph component | `components/GraphViewer.tsx` |
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

### Step 1: Copy the files

**Option A — Run the install script (easiest):**

Open PowerShell in your memory-dashboard folder and run:

```powershell
# Replace with the actual path to this folder
& "C:\path\to\Zai-agent-toolkit\dashboard-integration\install.ps1"
```

**Option B — Copy manually:**

1. Open two File Explorer windows:
   - Left: this `dashboard-integration/` folder
   - Right: your `memory-dashboard/` folder

2. Copy each file to the matching location:
   ```
   prisma/schema-addition.prisma   --> merge INTO prisma/schema.prisma
   api/memory/graph/route.ts       --> app/api/memory/graph/route.ts
   api/memory/graph/vis/route.ts   --> app/api/memory/graph/vis/route.ts
   api/memory/related-graph/route.ts --> app/api/memory/related-graph/route.ts
   components/GraphViewer.tsx      --> components/GraphViewer.tsx
   components/GraphStats.tsx       --> components/GraphStats.tsx
   lib/graph-client.ts             --> lib/graph-client.ts
   ```

### Step 2: Update your Prisma schema

Open `prisma/schema.prisma` in your memory-dashboard project.

**Add the MemoryEdge model** — copy everything from
`prisma/schema-addition.prisma` and paste it at the bottom of your schema file.

**Add relation fields to MemoryEntry** — find your existing `MemoryEntry`
model and add these two lines at the bottom (before the closing `}`):

```prisma
  fromEdges MemoryEdge[] @relation("FromEdges")
  toEdges   MemoryEdge[] @relation("ToEdges")
```

Your MemoryEntry model should look like this when you are done:

```prisma
model MemoryEntry {
  id        String   @id
  type      String
  content   String
  metadata  String   @default("{}")
  embedding String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // --- Graph layer relations (NEW) ---
  fromEdges MemoryEdge[] @relation("FromEdges")
  toEdges   MemoryEdge[] @relation("ToEdges")
}
```

### Step 3: Run the Prisma migration

In your memory-dashboard folder, open a terminal and run:

```bash
npx prisma db push
```

This creates the `memory_edges` table in your SQLite database. You should see
output like: `Your database is now in sync with your Prisma schema.`

If you prefer a named migration instead:

```bash
npx prisma migrate dev --name add-memory-edges
```

### Step 4: Install the extra npm package

The GraphViewer component uses D3 for rendering:

```bash
npm install d3 @types/d3
```

### Step 5: Verify the graph.json file exists

The dashboard reads from this file:

```
C:\Users\stsgr\.zcode\memory\graph.json
```

If you have never used the graph commands before, create it by running:

```bash
python tools/memory_cli.py graph stats
```

This will create an empty graph.json automatically. Or just create it manually:

```json
{
  "version": 1,
  "created_at": "",
  "edges": [],
  "isolated_nodes": []
}
```

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

---

## Troubleshooting

| Problem | Solution |
|---------|---------|
| `graph.json not found` error | Run `python tools/memory_cli.py graph stats` to create it |
| Prisma migration fails | Make sure you added both the MemoryEdge model AND the relation fields to MemoryEntry |
| GraphViewer shows blank | Check browser console for errors. Make sure `npm install d3 @types/d3` was run |
| Pyvis HTML shows 404 | Run `python tools/memory_cli.py graph viz --format html --no-enrich` once to generate the file |
| `related-graph` falls back to LLM | This is normal if no edges exist for that node yet. Add edges with `memory graph add-edge` |

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

Built with: Z.ai Agent Toolkit v2.0.4
