import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import fs from "fs";

// ── Python bridge ──────────────────────────────────────────

function getToolPath(tool: string): string {
  const home = process.env.USERPROFILE || process.env.HOME || "";
  const toolkitPath = process.env.ZAI_TOOLKIT_PATH || path.join(home, ".zcode", "Zai-agent-toolkit");
  const userToolsPath = path.join(home, ".zcode", "tools");

  const userTool = path.join(userToolsPath, tool);
  const toolkitTool = path.join(toolkitPath, "tools", tool);

  if (fs.existsSync(userTool)) return userTool;
  if (fs.existsSync(toolkitTool)) return toolkitTool;
  return toolkitTool;
}

function runPython(tool: string, args: string[]): Promise<string> {
  const toolPath = getToolPath(tool);
  return new Promise((resolve, reject) => {
    execFile("python", [toolPath, ...args], {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000,
      windowsHide: true,
    }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(stderr || err.message));
        return;
      }
      resolve(stdout);
    });
  });
}

// ── Parse session_summary.py list output ───────────────────
// Format:
//
// Experience Entries (3)
// ============================================================
//
// [?~] experience_20260518_185842
//     1 good / 1 bad | chromadb,python,networkx,typescript
//     # Memory System: Debugging ChromaDB + Graph Integration
//     ...

interface ExperienceEntry {
  id: string;
  title: string;
  experience_type: string;
  verification_status: string;
  good_count: number;
  bad_count: number;
  source_type: string;
  preview: string;
  tags: string[];
}

function parseExperienceList(output: string): { entries: ExperienceEntry[]; count: number } {
  const entries: ExperienceEntry[] = [];
  let current: Partial<ExperienceEntry> | null = null;
  let previewLines: string[] = [];

  for (const line of output.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip header lines
    if (trimmed.startsWith("Experience Entries") || trimmed.startsWith("===")) continue;

    // Entry header: [V~] experience_20260518_185842
    // Status codes: V~ = verified, ?~ = unverified, X~ = conflict
    const headerMatch = trimmed.match(/^\[([V?X])~\]\s+(\S+)/);
    if (headerMatch) {
      // Flush previous entry
      if (current && current.id) {
        entries.push({
          id: current.id,
          title: current.title || "",
          experience_type: current.experience_type || "mixed",
          verification_status: current.verification_status || "unverified",
          good_count: current.good_count || 0,
          bad_count: current.bad_count || 0,
          source_type: current.source_type || "",
          preview: previewLines.join(" ").slice(0, 200),
          tags: current.tags || [],
        });
      }

      const statusCode = headerMatch[1];
      const statusMap: Record<string, string> = { V: "verified", "?": "unverified", X: "conflict" };
      current = {
        id: headerMatch[2],
        verification_status: statusMap[statusCode] || "unverified",
      };
      previewLines = [];
      continue;
    }

    // Good/bad count line: "7 good / 10 bad | chromadb,python,networkx"
    const countMatch = trimmed.match(/^(\d+)\s+good\s*\/\s*(\d+)\s+bad\s*\|?\s*(.*)/);
    if (countMatch && current) {
      current.good_count = parseInt(countMatch[1]);
      current.bad_count = parseInt(countMatch[2]);
      if (countMatch[3]) {
        current.tags = countMatch[3].split(",").filter(Boolean).map(t => t.trim());
      }
      continue;
    }

    // Preview lines (content)
    if (current && current.id) {
      previewLines.push(trimmed);
    }
  }

  // Flush last entry
  if (current && current.id) {
    entries.push({
      id: current.id,
      title: current.title || "",
      experience_type: current.experience_type || "mixed",
      verification_status: current.verification_status || "unverified",
      good_count: current.good_count || 0,
      bad_count: current.bad_count || 0,
      source_type: current.source_type || "",
      preview: previewLines.join(" ").slice(0, 200),
      tags: current.tags || [],
    });
  }

  return { entries, count: entries.length };
}

// ── GET: List experiences ───────────────────────────────────
// ?action=list  (default)
// ?action=query&q=search+query

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "list";
    const query = searchParams.get("q") || "";

    if (action === "query" && query) {
      const output = await runPython("session_summary.py", ["query", query]);
      const entries = parseExperienceList(output).entries;
      return NextResponse.json({ entries, count: entries.length, query });
    }

    // Default: list all
    const output = await runPython("session_summary.py", ["list"]);
    const result = parseExperienceList(output);
    return NextResponse.json({ entries: result.entries, count: result.count });
  } catch (err) {
    console.error("[experience/route.ts] GET error:", err);
    return NextResponse.json(
      { error: "Failed to list experiences", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// ── POST: Create experience or verify ──────────────────────
// Body: { action: "manual" | "verify", ... }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body as { action?: string };

    if (action === "verify") {
      const { id, status } = body as { id?: string; status?: string };
      if (!id || !status) {
        return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
      }

      const output = await runPython("session_summary.py", ["verify", id, "--status", status]);
      return NextResponse.json({ message: "Verification updated", output });
    }

    if (action === "manual") {
      const { title, good, bad, why } = body as {
        title?: string; good?: string; bad?: string; why?: string;
      };

      if (!title) {
        return NextResponse.json({ error: "Missing title" }, { status: 400 });
      }

      const args = ["manual",
        "--title", title,
        "--good", good || "",
        "--bad", bad || "",
        "--why", why || "",
      ];

      const output = await runPython("session_summary.py", args);
      return NextResponse.json({ message: "Experience created", output });
    }

    return NextResponse.json({ error: "Unknown action. Use: manual, verify" }, { status: 400 });
  } catch (err) {
    console.error("[experience/route.ts] POST error:", err);
    return NextResponse.json(
      { error: "Failed to process experience", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
