# ============================================================
# Dashboard Integration — Install Script (v4 — Safe-Copy)
# ============================================================
#
# Run this script from your memory-dashboard project root:
#
#   cd C:\Users\stsgr\.zcode\memory-dashboard
#   . "C:\Users\stsgr\.zcode\Zai-agent-toolkit\dashboard-integration\install.ps1"
#
# v4: Safe-Copy enforcement — reads destination before writing,
#     reports diffs, prompts on conflict. Never silently overwrites.
#
# ============================================================

# param() MUST be first executable statement in PowerShell script
param(
    [ValidateSet("ask", "overwrite", "skip", "diff")]
    [string]$Mode = "ask"
)

$ErrorActionPreference = "Stop"

# --- Configuration ---
$IntegrationDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DashboardDir   = Get-Location
$HomeDir        = $env:USERPROFILE
$GraphJsonPath  = Join-Path $HomeDir ".zcode\memory\graph.json"

# Promote param to script scope so Safe-Copy can persist mode changes
$script:Mode = $Mode

# --- Dot-source modules ---
. "$IntegrationDir\install-safe-copy.ps1"
. "$IntegrationDir\install-steps.ps1"

# --- Banner ---
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Memory Dashboard -- Full Integration" -ForegroundColor Cyan
Write-Host "  Install Script v4 (Safe-Copy)" -ForegroundColor Cyan
Write-Host "  Sidebar + Split Panel Layout" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Integration dir: $IntegrationDir" -ForegroundColor Gray
Write-Host "Dashboard dir:   $DashboardDir" -ForegroundColor Gray
Write-Host "graph.json:      $GraphJsonPath" -ForegroundColor Gray
Write-Host "Mode:            $Mode" -ForegroundColor $(if ($Mode -eq "overwrite") { "Red" } else { "Cyan" })
Write-Host ""

# --- Run steps ---
Step-VerifyProject
Step-DetectLayout
Step-CopyApiRoutes
Step-CopyComponents
Step-CopyLib
Step-CopyInstrumentation
Step-UpdatePrisma
Step-UpdatePage
Step-VerifyDeps
Step-VerifyPreload

# --- Summary ---
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Installation complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Safe-Copy Report:" -ForegroundColor Cyan
Write-Host "  New files:      $script:newCount" -ForegroundColor Green
Write-Host "  Overwritten:    $script:copiedCount" -ForegroundColor $(if ($script:copiedCount -gt 0) { "Red" } else { "Green" })
Write-Host "  Skipped (diff): $script:skippedCount" -ForegroundColor Yellow
Write-Host "  Conflicts:      $script:conflictCount" -ForegroundColor $(if ($script:conflictCount -gt 0) { "Red" } else { "Green" })
if ($script:conflictCount -gt 0) {
    Write-Host "  Backups saved:  .install-backup\ in project root" -ForegroundColor Magenta
}
Write-Host ""
Write-Host "Layout: Sidebar (categories) + Split Panel (list + detail)" -ForegroundColor Cyan
Write-Host "  Memory categories: Knowledge, Patterns, Commands, Projects, Sessions, Templates, Experience" -ForegroundColor White
Write-Host "  Tool views:        Graph, Skills, Doc Intel" -ForegroundColor White
Write-Host ""
Write-Host "Modes for next run:" -ForegroundColor Cyan
Write-Host "  -Mode diff       Show conflicts only (dry run)" -ForegroundColor Gray
Write-Host "  -Mode ask        Ask on each conflict (default)" -ForegroundColor Gray
Write-Host "  -Mode skip       Keep local, only add new files" -ForegroundColor Gray
Write-Host "  -Mode overwrite  Overwrite all (with backup)" -ForegroundColor Gray
Write-Host ""
