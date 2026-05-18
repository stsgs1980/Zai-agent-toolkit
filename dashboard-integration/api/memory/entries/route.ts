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

// ── Parse memory_cli.py list output ────────────────────────

interface MemoryEntry {
  id: string;
  type: string;
  tags: string[];
  source: string;
  verification_status: string;
  raw: string;
}

function parseListOutput(output: string): { entries: MemoryEntry[]; count: number } {
  const entries: MemoryEntry[] = [];
  const lines = output.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Try format: [type] id | tags: ... | source: ... | status: ...
    const match = trimmed.match(/^\[(\w+)\]\s+(\S+)\s*\|.*tags:\s*([^|]*)\|.*source:\s*([^|]*)\|.*status:\s*(\S+)/);
    if (match) {
      entries.push({
        id: match[2],
        type: match[1],
        tags: match[3].trim().split(",").filter(Boolean).map(t => t.trim()),
        source: match[4].trim(),
        verification_status: match[5].trim(),
        raw: trimmed,
      });
    }
  }

  return { entries, count: entries.length };
}

// ── GET: List entries by type ───────────────────────────────
// ?type=knowledge&limit=20

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "knowledge";
    const limit = searchParams.get("limit") || "50";

    const output = await runPython("memory_cli.py", ["list", type, "--limit", limit]);
    const result = parseListOutput(output);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[entries/route.ts] GET error:", err);
    return NextResponse.json(
      { error: "Failed to list entries", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
