import { NextRequest, NextResponse } from "next/server";
import { runPython } from "@/lib/memory/bridge";
import { MemoryCache } from "@/lib/memory/cache";

const cache = MemoryCache.getInstance();

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
    const cacheKey = `entries:${type}`;

    const data = await cache.getOrFetch(cacheKey, async () => {
      try {
        const output = await runPython("memory_cli.py", ["export", type]);
        return JSON.parse(output) as { type: string; count: number; entries: ExportEntry[] };
      } catch (pyErr) {
        // Python CLI may not support this type (e.g. 'command' in older versions)
        // Return empty result instead of crashing
        console.warn(`[entries] Python export failed for type '${type}', returning empty`);
        return { type, count: 0, entries: [] as ExportEntry[] };
      }
    });

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

// ── POST: Create a new entry ──────────────────────────────
// Body: { type: "knowledge", content: "...", tags?: "tag1,tag2", source?: "..." }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, content, tags, source } = body as {
      type?: string;
      content?: string;
      tags?: string;
      source?: string;
    };

    if (!type || !content) {
      return NextResponse.json(
        { error: "Missing required fields: type and content" },
        { status: 400 }
      );
    }

    const validTypes = ["knowledge", "pattern", "command", "project", "session", "template", "experience"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Valid: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const args = ["store", type, content];

    // Add metadata if provided
    const metadata: string[] = [];
    if (tags) metadata.push(`tags=${tags}`);
    if (source) metadata.push(`source=${source}`);
    if (metadata.length > 0) {
      args.push("--metadata", metadata.join(","));
    }

    const output = await runPython("memory_cli.py", args);

    // Parse the output to get the new entry ID
    // memory_cli.py store outputs something like: "Stored: knowledge_20260518_123456"
    const idMatch = output.match(/Stored:\s*(\S+)/i);
    const newId = idMatch ? idMatch[1] : "";

    // If store failed (old CLI version), report clearly
    if (!newId && output.includes("invalid choice")) {
      return NextResponse.json(
        { error: `Type '${type}' not supported by installed memory_cli.py. Run install.ps1 to update.`, rawOutput: output },
        { status: 400 }
      );
    }

    // Invalidate cache for this type so next GET reflects the new entry
    cache.invalidate(`entries:${type}`);

    return NextResponse.json({
      message: "Entry created",
      id: newId,
      type,
      content,
      output: output.trim(),
    });
  } catch (err) {
    console.error("[entries/route.ts] POST error:", err);
    return NextResponse.json(
      { error: "Failed to create entry", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
