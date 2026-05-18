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

interface ExperienceEntry {
  id: string;
  title: string;
  experience_type: string;
  verification_status: string;
  good_count: number;
  bad_count: number;
  source_type: string;
  preview: string;
}

function parseExperienceList(output: string): ExperienceEntry[] {
  const entries: ExperienceEntry[] = [];
  const lines = output.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Format: [type] id | GOOD:N | BAD:N | status: X | source: Y
    const match = trimmed.match(/^\[([^\]]+)\]\s+(\S+)\s*\|.*GOOD:(\d+).*BAD:(\d+).*status:\s*(\S+)/);
    if (match) {
      entries.push({
        id: match[2],
        title: "",
        experience_type: match[1],
        verification_status: match[5],
        good_count: parseInt(match[3]),
        bad_count: parseInt(match[4]),
        source_type: "",
        preview: trimmed,
      });
    }
  }

  return entries;
}

// ── GET: List experiences ───────────────────────────────────
// ?action=list  (default)
// ?action=query&q=search+query
// ?action=verify&id=XXX&status=verified

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "list";
    const query = searchParams.get("q") || "";

    if (action === "query" && query) {
      const output = await runPython("session_summary.py", ["query", query]);
      const entries = parseExperienceList(output);
      return NextResponse.json({ entries, count: entries.length, query });
    }

    // Default: list all
    const output = await runPython("session_summary.py", ["list"]);
    const entries = parseExperienceList(output);
    return NextResponse.json({ entries, count: entries.length });
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
