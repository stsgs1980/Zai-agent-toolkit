import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

// ── Paths ──────────────────────────────────────────────────

function getHomeDir(): string {
  return process.env.USERPROFILE || process.env.HOME || "";
}

function getVizDir(): string {
  return path.join(getHomeDir(), ".zcode", "memory", "viz");
}

function getVizHtmlPath(): string {
  return path.join(getVizDir(), "graph.html");
}

function getToolsDir(): string {
  const home = getHomeDir();

  // Try to find the toolkit via environment variable
  if (process.env.ZAI_TOOLKIT_PATH) {
    return path.join(process.env.ZAI_TOOLKIT_PATH, "tools");
  }

  // Primary location: ~/.zcode/tools/ (where tools are copied for use)
  const zcodeToolsPath = path.join(home, ".zcode", "tools");
  if (fs.existsSync(path.join(zcodeToolsPath, "memory_cli.py"))) {
    return zcodeToolsPath;
  }

  // Fallback: ~/.zcode/Zai-agent-toolkit/tools/ (the git clone)
  const zcodeToolkitPath = path.join(home, ".zcode", "Zai-agent-toolkit", "tools");
  if (fs.existsSync(path.join(zcodeToolkitPath, "memory_cli.py"))) {
    return zcodeToolkitPath;
  }

  // Return primary path even if it doesn't exist yet (error will be clear)
  return zcodeToolsPath;
}

// ── GET: Serve or generate Pyvis HTML ──────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRegenerate = searchParams.get("regenerate") === "true";
    const filterType = searchParams.get("filter_type") || "";
    const focusNode = searchParams.get("focus") || "";

    const vizHtmlPath = getVizHtmlPath();

    // If HTML exists and we are not forcing regeneration, serve it directly
    if (!forceRegenerate && fs.existsSync(vizHtmlPath)) {
      const html = fs.readFileSync(vizHtmlPath, "utf-8");
      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    }

    // Try to generate the HTML by calling the Python CLI
    try {
      const toolsDir = getToolsDir();
      const cliPath = path.join(toolsDir, "memory_cli.py");

      if (!fs.existsSync(cliPath)) {
        return NextResponse.json(
          {
            error: "Python CLI not found",
            details:
              "Could not find tools/memory_cli.py. " +
              "Set ZAI_TOOLKIT_PATH environment variable or copy tools to ~/.zcode/tools/. " +
              "Or run manually: python tools/memory_cli.py graph viz --format html --no-enrich",
            searchedPath: cliPath,
          },
          { status: 503 }
        );
      }

      // Build the command arguments
      const args = [
        cliPath,
        "graph",
        "viz",
        "--format",
        "html",
        "--no-enrich",
        "--output",
        vizHtmlPath,
      ];

      if (filterType) {
        args.push("--filter-type", filterType);
      }
      if (focusNode) {
        args.push("--focus", focusNode);
      }

      // Ensure viz directory exists
      const vizDir = getVizDir();
      if (!fs.existsSync(vizDir)) {
        fs.mkdirSync(vizDir, { recursive: true });
      }

      const { stderr } = await execFileAsync("python", args, {
        timeout: 30000,
        windowsHide: true,
        encoding: "utf-8",
        env: { ...process.env, PYTHONIOENCODING: "utf-8" },
      });

      if (stderr && !stderr.includes("WARNING")) {
        console.warn("[graph/vis/route.ts] Python stderr:", stderr);
      }

      // Check if the file was generated
      if (fs.existsSync(vizHtmlPath)) {
        const html = fs.readFileSync(vizHtmlPath, "utf-8");
        return new NextResponse(html, {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-cache",
          },
        });
      }

      return NextResponse.json(
        {
          error: "Visualization generation failed",
          details: "Python ran but no HTML file was created",
        },
        { status: 500 }
      );
    } catch (pythonErr) {
      console.error("[graph/vis/route.ts] Python execution error:", pythonErr);
      return NextResponse.json(
        {
          error: "Failed to generate visualization",
          details:
            pythonErr instanceof Error ? pythonErr.message : String(pythonErr),
          hint: "Make sure Python and pyvis are installed. Run: pip install networkx pyvis",
        },
        { status: 503 }
      );
    }
  } catch (err) {
    console.error("[graph/vis/route.ts] GET error:", err);
    return NextResponse.json(
      {
        error: "Unexpected error",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
