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

// ── Parse query results ────────────────────────────────────

interface SearchResult {
  id: string;
  type: string;
  content: string;
  distance: number;
  tags: string[];
  source: string;
  verification_status: string;
}

function parseQueryOutput(output: string): SearchResult[] {
  const results: SearchResult[] = [];
  let currentId = "";

  for (const line of output.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Result header: "1. [type] id (distance: 0.XXX)"
    const headerMatch = trimmed.match(/^\d+\.\s+\[(\w+)\]\s+(\S+)\s+\(distance:\s*([\d.]+)\)/);
    if (headerMatch) {
      currentId = headerMatch[2];
      results.push({
        id: headerMatch[2],
        type: headerMatch[1],
        content: "",
        distance: parseFloat(headerMatch[3]),
        tags: [],
        source: "",
        verification_status: "unverified",
      });
      continue;
    }

    // Tags line: "  tags: tag1, tag2"
    const tagsMatch = trimmed.match(/^tags:\s*(.*)/);
    if (tagsMatch && results.length > 0) {
      results[results.length - 1].tags = tagsMatch[1].split(",").filter(Boolean).map(t => t.trim());
      continue;
    }

    // Source line
    const sourceMatch = trimmed.match(/^source:\s*(.*)/);
    if (sourceMatch && results.length > 0) {
      results[results.length - 1].source = sourceMatch[1].trim();
      continue;
    }

    // Content line
    if (results.length > 0 && currentId && !trimmed.startsWith("---")) {
      results[results.length - 1].content += (results[results.length - 1].content ? "\n" : "") + trimmed;
    }
  }

  return results;
}

// ── GET: Semantic search ────────────────────────────────────
// ?q=search+query&type=knowledge&limit=10

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "";
    const limit = searchParams.get("limit") || "10";

    if (!query.trim()) {
      return NextResponse.json(
        { error: "Missing query parameter: q" },
        { status: 400 }
      );
    }

    const args = ["query", query, "--limit", limit];
    if (type) {
      args.push("--type", type);
    }

    const output = await runPython("memory_cli.py", args);
    const results = parseQueryOutput(output);

    return NextResponse.json({ results, count: results.length, query });
  } catch (err) {
    console.error("[search/route.ts] GET error:", err);
    return NextResponse.json(
      { error: "Search failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
