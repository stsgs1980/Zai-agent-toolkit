import { execFile } from "child_process";
import path from "path";
import fs from "fs";

// ── Resolve script path ────────────────────────────────────
// Search order: .zcode/tools/ first, then .zcode/Zai-agent-toolkit/tools/
// This matches the inline logic that all 4 API routes currently use.

function getToolPath(tool: string): string {
  const home = process.env.USERPROFILE || process.env.HOME || "";
  const userToolsPath = path.join(home, ".zcode", "tools");
  const toolkitPath = process.env.ZAI_TOOLKIT_PATH || path.join(home, ".zcode", "Zai-agent-toolkit");
  const toolkitToolsPath = path.join(toolkitPath, "tools");

  const userTool = path.join(userToolsPath, tool);
  const toolkitTool = path.join(toolkitToolsPath, tool);

  if (fs.existsSync(userTool)) return userTool;
  if (fs.existsSync(toolkitTool)) return toolkitTool;
  return toolkitTool; // fallback — will fail with clear error
}

// ── Bridge result ──────────────────────────────────────────

export interface BridgeResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

// ── Execute Python tool ────────────────────────────────────

const PYTHON = process.env.ZAI_PYTHON || "python";

/**
 * Execute a Python tool from the toolkit.
 * All API routes use this bridge to call memory_cli.py, session_summary.py, etc.
 *
 * Compatible with the inline runPython() that routes currently use:
 * - Dual-path script lookup (.zcode/tools → .zcode/Zai-agent-toolkit/tools)
 * - maxBuffer 10MB (ChromaDB exports can be large)
 * - windowsHide: true (no console popup on Windows)
 * - PYTHONIOENCODING: utf-8 (critical for Russian/Unicode text)
 */
export function execPython(
  script: string,
  args: string[],
  timeout = 30000
): Promise<BridgeResult> {
  const toolPath = getToolPath(script);

  return new Promise((resolve, reject) => {
    execFile(PYTHON, [toolPath, ...args], {
      maxBuffer: 10 * 1024 * 1024,
      timeout,
      windowsHide: true,
      encoding: "utf-8",
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    }, (error, stdout, stderr) => {
      if (error) {
        reject({
          stdout: stdout || "",
          stderr: stderr || error.message,
          exitCode: error.code ?? 1,
        });
        return;
      }
      resolve({
        stdout: stdout || "",
        stderr: stderr || "",
        exitCode: 0,
      });
    });
  });
}

/**
 * Convenience wrapper: returns just stdout as string.
 * Drop-in replacement for the inline runPython() in API routes.
 */
export async function runPython(script: string, args: string[], timeout?: number): Promise<string> {
  const result = await execPython(script, args, timeout);
  return result.stdout;
}
