import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import fs from "fs";

// ── Python bridge helper ───────────────────────────────────

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

// ── Types ───────────────────────────────────────────────────

interface MemoryEntry {
  id: string;
  type: string;
  tags: string[];
  source: string;
  verification_status: string;
  content: string;
  raw: string;
}

interface ExportEntry {
  id: string;
  content: string;
  metadata: {
    created_at?: string;
    source?: string;
    type?: string;
    tags?: string;
    [key: string]: string | undefined;
  };
}

// ── GET: List entries by type ───────────────────────────────
// ?type=knowledge&limit=50

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "knowledge";
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    // Use export command for reliable JSON output
    const output = await runPython("memory_cli.py", ["export", type]);
    const data = JSON.parse(output) as { type: string; count: number; entries: ExportEntry[] };

    const entries: MemoryEntry[] = (data.entries || [])
      .slice(0, limit)
      .map((e) => ({
        id: e.id,
        type: e.metadata?.type || type,
        tags: e.metadata?.tags ? e.metadata.tags.split(",").filter(Boolean) : [],
        source: e.metadata?.source || "",
        verification_status: e.metadata?.verification_status || "unverified",
        content: e.content || "",
        raw: e.content || "",
      }));

    return NextResponse.json({ entries, count: entries.length, total: data.count });
  } catch (err) {
    console.error("[entries/route.ts] GET error:", err);
    return NextResponse.json(
      { error: "Failed to list entries", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
