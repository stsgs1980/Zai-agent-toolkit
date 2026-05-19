/**
 * Preload: warms the TTL cache on server startup by calling API endpoints.
 *
 * WHY: Python + chromadb import = 3.1s cold start. First API call pays this penalty.
 * Preload triggers these calls after server ready, so all subsequent requests hit cache.
 *
 * HOW: HTTP fetch to localhost endpoints (not direct Python calls — child_process
 * is not available in Next.js instrumentation.ts).
 *
 * Result: 6032ms cold -> ~55ms cached after preload.
 */

const PRELOAD_PORT = process.env.PORT || "3000";
const PRELOAD_DELAY = 2000; // wait for server to be ready

const PRELOAD_TASKS = [
  { path: "/api/memory/entries?type=knowledge", name: "entries:knowledge" },
  { path: "/api/memory/entries?type=session", name: "entries:session" },
  { path: "/api/memory/entries?type=project", name: "entries:project" },
  { path: "/api/memory/stats", name: "stats" },
  // NOTE: "experience" type is NOT preloaded because memory_cli.py export
  // does not support it yet. Add when export command adds experience support.
];

let preloaded = false;

export async function preloadMemoryCache(): Promise<void> {
  if (preloaded) return;
  preloaded = true;

  // Wait for server to start accepting connections
  await new Promise((resolve) => setTimeout(resolve, PRELOAD_DELAY));

  const baseUrl = `http://127.0.0.1:${PRELOAD_PORT}`;

  const results = await Promise.allSettled(
    PRELOAD_TASKS.map(async (task) => {
      const resp = await fetch(`${baseUrl}${task.path}`);
      if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
      return task.name;
    })
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  console.log(`[preload] Cache warmed: ${succeeded} ok, ${failed} failed`);

  if (failed > 0) {
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.warn(`[preload] Failed: ${PRELOAD_TASKS[i].name} — ${r.reason}`);
      }
    });
  }
}
