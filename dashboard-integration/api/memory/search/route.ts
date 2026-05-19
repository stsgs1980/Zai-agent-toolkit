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
      encoding: "utf-8",
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
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

interface SearchResult {
  id: string;
  type: string;
  content: string;
  distance: number;
  tags: string[];
  source: string;
  verification_status: string;
}

// ── Parse query output ────────────────────────────────────
// Format from memory_cli.py query:
//
// [KNOWLEDGE]
//
//   ID: knowledge_20260518_182151
//   Distance: 1.1582
//   Created: 2026-05-18T18:21:51.548825
//   Content: A numerical representation of text in high-dimensional space.

function parseQueryOutput(output: string): SearchResult[] {
  const results: SearchResult[] = [];
  let current: Partial<SearchResult> | null = null;
  let contentLines: string[] = [];

  for (const line of output.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Type section header: [KNOWLEDGE], [PATTERN], etc.
    const typeMatch = trimmed.match(/^\[(\w+)\]$/);
    if (typeMatch) {
      // Flush previous entry
      if (current && current.id) {
        results.push({
          id: current.id,
          type: current.type || "unknown",
          content: contentLines.join("\n").trim(),
          distance: current.distance || 0,
          tags: current.tags || [],
          source: current.source || "",
          verification_status: current.verification_status || "unverified",
        });
      }
      current = { type: typeMatch[1].toLowerCase() };
      contentLines = [];
      continue;
    }

    // ID line
    const idMatch = trimmed.match(/^ID:\s+(\S+)/);
    if (idMatch && current) {
      current.id = idMatch[1];
      continue;
    }

    // Distance line
    const distMatch = trimmed.match(/^Distance:\s+([\d.]+)/);
    if (distMatch && current) {
      current.distance = parseFloat(distMatch[1]);
      continue;
    }

    // Created line
    const createdMatch = trimmed.match(/^Created:\s+(.+)/);
    if (createdMatch && current) {
      // skip, not needed in results
      continue;
    }

    // Source line (if present in metadata)
    const sourceMatch = trimmed.match(/^Source:\s+(.+)/);
    if (sourceMatch && current) {
      current.source = sourceMatch[1].trim();
      continue;
    }

    // Tags line (if present)
    const tagsMatch = trimmed.match(/^Tags:\s+(.+)/);
    if (tagsMatch && current) {
      current.tags = tagsMatch[1].split(",").filter(Boolean).map(t => t.trim());
      continue;
    }

    // Content line (starts with "Content:" or is a continuation)
    if (trimmed.startsWith("Content:")) {
      const contentText = trimmed.slice(8).trim();
      contentLines = [contentText];
      continue;
    }

    // Continuation of content (indented lines or lines that aren't key-value)
    if (current && current.id && !trimmed.startsWith("---")) {
      // Skip if it looks like a key-value header we don't recognize
      if (!trimmed.match(/^[A-Z][a-z]+:/)) {
        contentLines.push(trimmed);
      }
    }
  }

  // Flush last entry
  if (current && current.id) {
    results.push({
      id: current.id,
      type: current.type || "unknown",
      content: contentLines.join("\n").trim(),
      distance: current.distance || 0,
      tags: current.tags || [],
      source: current.source || "",
      verification_status: current.verification_status || "unverified",
    });
  }

  return results;
}

// ── GET: Semantic search ────────────────────────────────────
// ?q=search+query&type=knowledge&limit=10

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = searchParams.get("limit") || "10";

    if (!query.trim()) {
      return NextResponse.json(
        { error: "Missing query parameter: q" },
        { status: 400 }
      );
    }

    const args = ["query", query, "--limit", limit];

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
