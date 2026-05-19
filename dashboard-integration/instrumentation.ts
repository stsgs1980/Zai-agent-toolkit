/**
 * Next.js Instrumentation Hook
 *
 * WHY: Python + chromadb import = 3.1s cold start. Without preload,
 * the first API request after server start pays this penalty.
 * This hook runs preload once when the server starts, warming the TTL cache
 * so all subsequent requests hit cache (55ms instead of 6s).
 *
 * HOW: Calls preloadMemoryCache() which does HTTP fetch to localhost endpoints.
 * Those endpoints use bridge+cache internally, so cache gets populated.
 *
 * In Next.js 15.5+ this file is auto-detected — no config changes needed.
 */

export async function register() {
  // Only run on server (not during build)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { preloadMemoryCache } = await import("./lib/memory/preload");
    preloadMemoryCache().catch((err) => {
      console.error("[instrumentation] Preload failed:", err);
    });
  }
}
