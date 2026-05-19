# ============================================================
# Dashboard Integration — Install Script (v4 — Safe-Copy)
# ============================================================
#
# Run this script from your memory-dashboard project root:
#
#   cd C:\Users\stsgr\.zcode\memory-dashboard
#   & "C:\Users\stsgr\.zcode\Zai-agent-toolkit\dashboard-integration\install.ps1"
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

# Where this script lives (the dashboard-integration folder)
$IntegrationDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Where the memory-dashboard project is (current working directory)
$DashboardDir = Get-Location

# Path to graph.json
$HomeDir = $env:USERPROFILE
$GraphJsonPath = Join-Path $HomeDir ".zcode\memory\graph.json"

# --- Safe-Copy function (ENFORCEMENT MECHANISM) ---
# This function replaces all raw Copy-Item calls.
# It physically cannot overwrite a file without first comparing.

$script:conflictCount = 0
$script:copiedCount = 0
$script:skippedCount = 0
$script:newCount = 0

function Safe-Copy {
    param(
        [Parameter(Mandatory)][string]$Src,
        [Parameter(Mandatory)][string]$Dst
    )

    # Source must exist
    if (-not (Test-Path $Src)) {
        Write-Host "  SKIP: Source not found: $Src" -ForegroundColor DarkGray
        return
    }

    # Create destination directory if needed
    $dstDir = Split-Path -Parent $Dst
    if (-not (Test-Path $dstDir)) {
        New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
        Write-Host "  Created dir: $dstDir" -ForegroundColor DarkGray
    }

    $fileName = Split-Path -Leaf $Dst

    # NEW file — destination doesn't exist — safe to create
    if (-not (Test-Path $Dst)) {
        if ($Mode -eq "diff") {
            Write-Host "  [NEW] $fileName (would create)" -ForegroundColor Blue
        } else {
            Copy-Item -Path $Src -Destination $Dst -Force
            Write-Host "  [NEW] $fileName" -ForegroundColor Green
        }
        $script:newCount++
        return
    }

    # Destination EXISTS — compare content
    $srcHash = (Get-FileHash -Path $Src -Algorithm SHA256).Hash
    $dstHash = (Get-FileHash -Path $Dst -Algorithm SHA256).Hash

    # Files are identical — skip
    if ($srcHash -eq $dstHash) {
        Write-Host "  [SAME] $fileName" -ForegroundColor DarkGray
        return
    }

    # Files DIFFER — conflict!
    $script:conflictCount++

    # Count line differences
    $srcContent = Get-Content -Path $Src -ErrorAction SilentlyContinue
    $dstContent = Get-Content -Path $Dst -ErrorAction SilentlyContinue
    $srcLines = if ($srcContent) { $srcContent.Count } else { 0 }
    $dstLines = if ($dstContent) { $dstContent.Count } else { 0 }

    Write-Host ""
    Write-Host "  ┌─ CONFLICT: $fileName" -ForegroundColor Red
    Write-Host "  │  Source (git repo): $srcLines lines" -ForegroundColor Yellow
    Write-Host "  │  Destination (WIN): $dstLines lines" -ForegroundColor Yellow
    Write-Host "  │  Content differs — local changes will be LOST if overwritten" -ForegroundColor Red

    # Show first 5 differing lines
    $maxLines = [Math]::Max($srcLines, $dstLines)
    $diffShown = 0
    for ($i = 0; $i -lt $maxLines -and $diffShown -lt 5; $i++) {
        $s = if ($i -lt $srcLines) { $srcContent[$i] } else { "" }
        $d = if ($i -lt $dstLines) { $dstContent[$i] } else { "" }
        if ($s -ne $d) {
            Write-Host "  │  Line $($i+1): repo=[$s] win=[$d]" -ForegroundColor DarkYellow
            $diffShown++
        }
    }
    Write-Host "  └─" -ForegroundColor Red

    # Handle based on mode
    switch ($Mode) {
        "diff" {
            Write-Host "  [CONFLICT] $fileName (diff mode — not copied)" -ForegroundColor Red
            return
        }
        "skip" {
            Write-Host "  [SKIP] $fileName (skip mode — preserved local)" -ForegroundColor Yellow
            $script:skippedCount++
            return
        }
        "overwrite" {
            # Backup before overwriting
            $backupDir = Join-Path $DashboardDir ".install-backup"
            if (-not (Test-Path $backupDir)) {
                New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
            }
            $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
            $backupName = "$fileName.$timestamp.bak"
            Copy-Item -Path $Dst -Destination (Join-Path $backupDir $backupName) -Force
            Write-Host "  [BACKUP] Saved local version to .install-backup\$backupName" -ForegroundColor Magenta

            Copy-Item -Path $Src -Destination $Dst -Force
            Write-Host "  [OVERWRITE] $fileName (overwrite mode)" -ForegroundColor Red
            $script:copiedCount++
            return
        }
        "ask" {
            # Backup first
            $backupDir = Join-Path $DashboardDir ".install-backup"
            if (-not (Test-Path $backupDir)) {
                New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
            }
            $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
            $backupName = "$fileName.$timestamp.bak"
            Copy-Item -Path $Dst -Destination (Join-Path $backupDir $backupName) -Force
            Write-Host "  [BACKUP] Saved local version to .install-backup\$backupName" -ForegroundColor Magenta

            Write-Host ""
            Write-Host "  Choose action for $fileName :" -ForegroundColor Cyan
            Write-Host "    [O] Overwrite (replace with git version, backup saved)" -ForegroundColor White
            Write-Host "    [S] Skip (keep local version)" -ForegroundColor White
            Write-Host "    [A] Overwrite ALL remaining conflicts" -ForegroundColor White
            Write-Host "    [K] Skip ALL remaining conflicts" -ForegroundColor White
            Write-Host "    [D] Show full diff" -ForegroundColor White
            Write-Host ""

            $answered = $false
            while (-not $answered) {
                $choice = Read-Host "  Your choice [O/S/A/K/D]"
                switch ($choice.ToUpper()) {
                    "O" {
                        Copy-Item -Path $Src -Destination $Dst -Force
                        Write-Host "  [OVERWRITE] $fileName" -ForegroundColor Red
                        $script:copiedCount++
                        $answered = $true
                    }
                    "S" {
                        Write-Host "  [SKIP] $fileName (kept local)" -ForegroundColor Yellow
                        $script:skippedCount++
                        $answered = $true
                    }
                    "A" {
                        $Mode = "overwrite"
                        Copy-Item -Path $Src -Destination $Dst -Force
                        Write-Host "  [OVERWRITE] $filename (mode → overwrite all)" -ForegroundColor Red
                        $script:copiedCount++
                        $answered = $true
                    }
                    "K" {
                        $Mode = "skip"
                        Write-Host "  [SKIP] $filename (mode → skip all)" -ForegroundColor Yellow
                        $script:skippedCount++
                        $answered = $true
                    }
                    "D" {
                        Write-Host ""
                        Write-Host "  === FULL DIFF: $fileName ===" -ForegroundColor Cyan
                        Write-Host "  --- git (source) ---" -ForegroundColor Yellow
                        $srcContent | Select-Object -First 30 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
                        if ($srcLines -gt 30) { Write-Host "  ... ($srcLines lines total)" -ForegroundColor DarkGray }
                        Write-Host "  +++ local (WIN) +++" -ForegroundColor Yellow
                        $dstContent | Select-Object -First 30 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
                        if ($dstLines -gt 30) { Write-Host "  ... ($dstLines lines total)" -ForegroundColor DarkGray }
                        Write-Host "  === END DIFF ===" -ForegroundColor Cyan
                        Write-Host ""
                    }
                    default {
                        Write-Host "  Invalid choice. Use O/S/A/K/D" -ForegroundColor Red
                    }
                }
            }
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Memory Dashboard — Full Integration" -ForegroundColor Cyan
Write-Host "  Install Script v4 (Safe-Copy)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Integration dir: $IntegrationDir" -ForegroundColor Gray
Write-Host "Dashboard dir:   $DashboardDir" -ForegroundColor Gray
Write-Host "graph.json:      $GraphJsonPath" -ForegroundColor Gray
Write-Host "Mode:            $Mode" -ForegroundColor $(if ($Mode -eq "overwrite") { "Red" } else { "Cyan" })
Write-Host ""

# --- Step 1: Verify we are in a Next.js project ---

Write-Host "[1/10] Checking project structure..." -ForegroundColor Yellow

$packageJson = Join-Path $DashboardDir "package.json"
if (-not (Test-Path $packageJson)) {
    Write-Host "  ERROR: No package.json found in current directory." -ForegroundColor Red
    Write-Host "  Make sure you run this script from the memory-dashboard root." -ForegroundColor Red
    exit 1
}

$prismaDir = Join-Path $DashboardDir "prisma"
if (-not (Test-Path $prismaDir)) {
    Write-Host "  ERROR: No prisma/ directory found." -ForegroundColor Red
    Write-Host "  This script expects a Prisma project." -ForegroundColor Red
    exit 1
}

Write-Host "  OK: Found package.json and prisma/" -ForegroundColor Green

# --- Step 2: Detect src/ layout ---

Write-Host "[2/10] Detecting project layout..." -ForegroundColor Yellow

# Some Next.js projects use src/ directory, others put app/ at root
$SrcDir = Join-Path $DashboardDir "src"
if (Test-Path $SrcDir) {
    $BaseDir = $SrcDir
    Write-Host "  Detected: src/ layout (app/ and components/ under src/)" -ForegroundColor Green
} else {
    $BaseDir = $DashboardDir
    Write-Host "  Detected: flat layout (app/ and components/ at root)" -ForegroundColor Green
}

Write-Host "  Base dir for app/components/lib: $BaseDir" -ForegroundColor Gray

# --- Step 3: Copy API routes (Safe-Copy) ---

Write-Host "[3/10] Copying API routes..." -ForegroundColor Yellow

$apiMappings = @(
    @{ Src = Join-Path $IntegrationDir "api\memory\graph\route.ts";           Dst = Join-Path $BaseDir "app\api\memory\graph\route.ts" }
    @{ Src = Join-Path $IntegrationDir "api\memory\graph\vis\route.ts";       Dst = Join-Path $BaseDir "app\api\memory\graph\vis\route.ts" }
    @{ Src = Join-Path $IntegrationDir "api\memory\related-graph\route.ts";   Dst = Join-Path $BaseDir "app\api\memory\related-graph\route.ts" }
    @{ Src = Join-Path $IntegrationDir "api\memory\doc-intelligence\route.ts";Dst = Join-Path $BaseDir "app\api\memory\doc-intelligence\route.ts" }
    @{ Src = Join-Path $IntegrationDir "api\memory\entries\route.ts";         Dst = Join-Path $BaseDir "app\api\memory\entries\route.ts" }
    @{ Src = Join-Path $IntegrationDir "api\memory\search\route.ts";          Dst = Join-Path $BaseDir "app\api\memory\search\route.ts" }
    @{ Src = Join-Path $IntegrationDir "api\memory\experience\route.ts";      Dst = Join-Path $BaseDir "app\api\memory\experience\route.ts" }
    @{ Src = Join-Path $IntegrationDir "api\memory\stats\route.ts";           Dst = Join-Path $BaseDir "app\api\memory\stats\route.ts" }
    @{ Src = Join-Path $IntegrationDir "api\memory\commands\route.ts";        Dst = Join-Path $BaseDir "app\api\memory\commands\route.ts" }
)

foreach ($mapping in $apiMappings) {
    Safe-Copy -Src $mapping.Src -Dst $mapping.Dst
}

# --- Step 4: Copy components (Safe-Copy) ---

Write-Host "[4/10] Copying components..." -ForegroundColor Yellow

$componentMappings = @(
    @{ Src = Join-Path $IntegrationDir "components\GraphViewer.tsx";          Dst = Join-Path $BaseDir "components\GraphViewer.tsx" }
    @{ Src = Join-Path $IntegrationDir "components\GraphStats.tsx";           Dst = Join-Path $BaseDir "components\GraphStats.tsx" }
    @{ Src = Join-Path $IntegrationDir "components\DocIntelligenceView.tsx";   Dst = Join-Path $BaseDir "components\DocIntelligenceView.tsx" }
    @{ Src = Join-Path $IntegrationDir "components\DashboardHome.tsx";        Dst = Join-Path $BaseDir "components\DashboardHome.tsx" }
    @{ Src = Join-Path $IntegrationDir "components\MemoryBrowser.tsx";        Dst = Join-Path $BaseDir "components\MemoryBrowser.tsx" }
    @{ Src = Join-Path $IntegrationDir "components\ExperienceView.tsx";       Dst = Join-Path $BaseDir "components\ExperienceView.tsx" }
    @{ Src = Join-Path $IntegrationDir "components\MemoryDashboard.tsx";      Dst = Join-Path $BaseDir "components\MemoryDashboard.tsx" }
    @{ Src = Join-Path $IntegrationDir "components\HotCommandsView.tsx";      Dst = Join-Path $BaseDir "components\HotCommandsView.tsx" }
    @{ Src = Join-Path $IntegrationDir "components\graph\colors.ts";          Dst = Join-Path $BaseDir "components\graph\colors.ts" }
    @{ Src = Join-Path $IntegrationDir "components\graph\NodeDetail.tsx";     Dst = Join-Path $BaseDir "components\graph\NodeDetail.tsx" }
    @{ Src = Join-Path $IntegrationDir "components\graph\EdgeFilter.tsx";     Dst = Join-Path $BaseDir "components\graph\EdgeFilter.tsx" }
    @{ Src = Join-Path $IntegrationDir "components\graph\useForceGraph.ts";   Dst = Join-Path $BaseDir "components\graph\useForceGraph.ts" }
    @{ Src = Join-Path $IntegrationDir "components\doc-intelligence\types.ts"; Dst = Join-Path $BaseDir "components\doc-intelligence\types.ts" }
    @{ Src = Join-Path $IntegrationDir "components\doc-intelligence\InputArea.tsx"; Dst = Join-Path $BaseDir "components\doc-intelligence\InputArea.tsx" }
    @{ Src = Join-Path $IntegrationDir "components\doc-intelligence\ResultsPanel.tsx"; Dst = Join-Path $BaseDir "components\doc-intelligence\ResultsPanel.tsx" }
    @{ Src = Join-Path $IntegrationDir "components\ui\index.tsx";             Dst = Join-Path $BaseDir "components\ui\index.tsx" }
)

foreach ($mapping in $componentMappings) {
    Safe-Copy -Src $mapping.Src -Dst $mapping.Dst
}

# --- Step 5: Copy lib (Safe-Copy) ---

Write-Host "[5/10] Copying lib/ files..." -ForegroundColor Yellow

$libMappings = @(
    @{ Src = Join-Path $IntegrationDir "lib\graph-client.ts";  Dst = Join-Path $BaseDir "lib\graph-client.ts" }
    @{ Src = Join-Path $IntegrationDir "lib\types.ts";         Dst = Join-Path $BaseDir "lib\types.ts" }
    @{ Src = Join-Path $IntegrationDir "lib\constants.ts";     Dst = Join-Path $BaseDir "lib\constants.ts" }
    @{ Src = Join-Path $IntegrationDir "lib\memory\bridge.ts"; Dst = Join-Path $BaseDir "lib\memory\bridge.ts" }
    @{ Src = Join-Path $IntegrationDir "lib\memory\cache.ts";  Dst = Join-Path $BaseDir "lib\memory\cache.ts" }
    @{ Src = Join-Path $IntegrationDir "lib\memory\preload.ts";Dst = Join-Path $BaseDir "lib\memory\preload.ts" }
)

foreach ($mapping in $libMappings) {
    Safe-Copy -Src $mapping.Src -Dst $mapping.Dst
}

# --- Step 6: Copy instrumentation.ts (Safe-Copy) ---

Write-Host "[6/10] Copying instrumentation.ts..." -ForegroundColor Yellow

$instrSrc = Join-Path $IntegrationDir "instrumentation.ts"
$instrDst = Join-Path $BaseDir "instrumentation.ts"

if (Test-Path $instrSrc) {
    Safe-Copy -Src $instrSrc -Dst $instrDst
} else {
    Write-Host "  SKIP: instrumentation.ts not found in integration dir" -ForegroundColor DarkGray
}

# --- Step 7: Update Prisma schema ---

Write-Host "[7/10] Updating Prisma schema..." -ForegroundColor Yellow

$schemaPath = Join-Path $DashboardDir "prisma\schema.prisma"
$schemaAddition = Join-Path $IntegrationDir "prisma\schema-addition.prisma"

if (Test-Path $schemaPath) {
    $schemaContent = Get-Content -Path $schemaPath -Raw

    # Check if MemoryEdge model already exists
    if ($schemaContent -match "model MemoryEdge") {
        Write-Host "  SKIP: MemoryEdge model already in schema" -ForegroundColor DarkGray
    } else {
        # Extract the MemoryEdge model from schema-addition.prisma
        $additionContent = Get-Content -Path $schemaAddition -Raw

        # Find the MemoryEdge model block
        $pattern = '(?s)(model MemoryEdge \{.*?\})'
        if ($additionContent -match $pattern) {
            $memoryEdgeBlock = $Matches[0]

            # Append to schema
            $schemaContent = $schemaContent.TrimEnd() + "`n`n// Graph Layer - MemoryEdge model`n$memoryEdgeBlock"
            Set-Content -Path $schemaPath -Value $schemaContent -NoNewline
            Write-Host "  Added MemoryEdge model to schema" -ForegroundColor Green
        } else {
            Write-Host "  WARN: Could not extract MemoryEdge model from addition file" -ForegroundColor Yellow
            Write-Host "  Please add it manually from: $schemaAddition" -ForegroundColor Yellow
        }
    }

    # Check if MemoryEntry has fromEdges/toEdges
    if ($schemaContent -match "fromEdges\s+MemoryEdge") {
        Write-Host "  SKIP: MemoryEntry already has graph relations" -ForegroundColor DarkGray
    } else {
        # Add relation fields to MemoryEntry
        $schemaContent = Get-Content -Path $schemaPath -Raw

        # Find the MemoryEntry model and add fields before the LAST closing brace
        $lines = $schemaContent -split "`n"
        $inModel = $false
        $braceDepth = 0
        $insertIndex = -1

        for ($i = 0; $i -lt $lines.Count; $i++) {
            if ($lines[$i] -match '^\s*model MemoryEntry\s*\{') {
                $inModel = $true
                $braceDepth = 1
                continue
            }
            if ($inModel) {
                $noStrings = $lines[$i] -replace '"[^"]*"', ''
                $opens = ([regex]::Matches($noStrings, '\{')).Count
                $closes = ([regex]::Matches($noStrings, '\}')).Count
                $braceDepth += $opens - $closes
                if ($braceDepth -le 0) {
                    $insertIndex = $i
                    break
                }
            }
        }

        if ($insertIndex -ge 0) {
            $relationLines = @(
                '',
                '  // Graph layer relations',
                '  fromEdges MemoryEdge[] @relation("FromEdges")',
                '  toEdges   MemoryEdge[] @relation("ToEdges")'
            )
            $newLines = $lines[0..($insertIndex-1)] + $relationLines + $lines[$insertIndex..($lines.Count-1)]
            $newContent = $newLines -join "`n"
            Set-Content -Path $schemaPath -Value $newContent -NoNewline
            Write-Host "  Added graph relations to MemoryEntry" -ForegroundColor Green
        } else {
            Write-Host "  WARN: Could not find MemoryEntry model closing brace" -ForegroundColor Yellow
            Write-Host "  Please add fromEdges/toEdges manually" -ForegroundColor Yellow
        }
    }

    # Run Prisma migration
    Write-Host "  Running: npx prisma db push..." -ForegroundColor Gray
    try {
        Push-Location $DashboardDir
        npx prisma db push 2>&1 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
        Pop-Location
        Write-Host "  Prisma migration done" -ForegroundColor Green
    } catch {
        Pop-Location
        Write-Host "  WARN: Prisma db push failed. Run manually: npx prisma db push" -ForegroundColor Yellow
        Write-Host "  Error: $_" -ForegroundColor DarkGray
    }
} else {
    Write-Host "  ERROR: prisma/schema.prisma not found at $schemaPath" -ForegroundColor Red
}

# --- Step 8: Update page.tsx to use MemoryDashboard ---

Write-Host "[8/10] Updating page.tsx..." -ForegroundColor Yellow

$pagePath = Join-Path $BaseDir "app\page.tsx"

if (Test-Path $pagePath) {
    $pageContent = Get-Content -Path $pagePath -Raw

    if ($pageContent -match "import \{ MemoryDashboard \} from '@/components/MemoryDashboard'") {
        Write-Host "  SKIP: page.tsx already uses MemoryDashboard" -ForegroundColor DarkGray
    } else {
        $newPageContent = @"
'use client'

import { MemoryDashboard } from '@/components/MemoryDashboard'

export default function Home() {
  return <MemoryDashboard />
}
"@
        Set-Content -Path $pagePath -Value $newPageContent -NoNewline
        Write-Host "  Updated: page.tsx -> uses MemoryDashboard" -ForegroundColor Green
    }
} else {
    Write-Host "  WARN: page.tsx not found at $pagePath" -ForegroundColor Yellow
}

# --- Step 9: Verify graph.json and Python deps ---

Write-Host "[9/10] Verifying graph.json and dependencies..." -ForegroundColor Yellow

if (Test-Path $GraphJsonPath) {
    Write-Host "  OK: graph.json exists at $GraphJsonPath" -ForegroundColor Green
} else {
    Write-Host "  WARN: graph.json not found at $GraphJsonPath" -ForegroundColor Yellow
    Write-Host "  Creating empty graph.json..." -ForegroundColor Gray

    $graphDir = Split-Path -Parent $GraphJsonPath
    if (-not (Test-Path $graphDir)) {
        New-Item -ItemType Directory -Path $graphDir -Force | Out-Null
    }

    $emptyGraph = @{
        version = 1
        created_at = ""
        edges = @()
        isolated_nodes = @()
    } | ConvertTo-Json -Depth 3

    Set-Content -Path $GraphJsonPath -Value $emptyGraph
    Write-Host "  Created empty graph.json" -ForegroundColor Green
}

# Check Python dependencies
$pythonCheck = python -c "import networkx; import pyvis; import chromadb; print('OK')" 2>&1
if ($pythonCheck -match "OK") {
    Write-Host "  OK: Python packages (networkx, pyvis, chromadb) available" -ForegroundColor Green
} else {
    Write-Host "  WARN: Missing Python packages. Run: pip install networkx pyvis matplotlib chromadb" -ForegroundColor Yellow
}

# Check that tools are in .zcode/tools/
$zcodeToolsDir = Join-Path $HomeDir ".zcode\tools"
$requiredTools = @("graph_engine.py", "memory_cli.py", "folder_indexer.py", "session_summary.py")
$missingTools = @()
foreach ($tool in $requiredTools) {
    if (-not (Test-Path (Join-Path $zcodeToolsDir $tool))) {
        $missingTools += $tool
    }
}
if ($missingTools.Count -gt 0) {
    Write-Host "  WARN: Missing tools in .zcode\tools\: $($missingTools -join ', ')" -ForegroundColor Yellow
    Write-Host "  Copy from Zai-agent-toolkit\tools\:" -ForegroundColor Gray
    foreach ($tool in $missingTools) {
        Write-Host "    Copy-Item `"`$env:USERPROFILE\.zcode\Zai-agent-toolkit\tools\$tool`" `"`$env:USERPROFILE\.zcode\tools\$tool`" -Force" -ForegroundColor White
    }
} else {
    Write-Host "  OK: All 4 Python tools found in .zcode\tools\" -ForegroundColor Green
}

# --- Step 10: Verify preload infrastructure ---

Write-Host "[10/10] Verifying preload infrastructure..." -ForegroundColor Yellow

$bridgePath = Join-Path $BaseDir "lib\memory\bridge.ts"
$cachePath = Join-Path $BaseDir "lib\memory\cache.ts"
$preloadPath = Join-Path $BaseDir "lib\memory\preload.ts"
$instrPath = Join-Path $BaseDir "instrumentation.ts"

$preloadOk = $true
foreach ($f in @($bridgePath, $cachePath, $preloadPath, $instrPath)) {
    if (Test-Path $f) {
        Write-Host "  OK: $(Split-Path -Leaf $f)" -ForegroundColor Green
    } else {
        Write-Host "  MISSING: $f" -ForegroundColor Red
        $preloadOk = $false
    }
}

if ($preloadOk) {
    Write-Host "  Preload infrastructure: OK" -ForegroundColor Green
} else {
    Write-Host "  WARN: Some preload files missing. Dashboard will work but first API call will be slow." -ForegroundColor Yellow
}

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
Write-Host "Dashboard tabs: Dashboard | Memory | Graph | Intelligence" -ForegroundColor Cyan
Write-Host ""
Write-Host "Modes for next run:" -ForegroundColor Cyan
Write-Host "  & `"...install.ps1`" -Mode diff       # Show conflicts only (dry run)" -ForegroundColor Gray
Write-Host "  & `"...install.ps1`" -Mode ask        # Ask on each conflict (default)" -ForegroundColor Gray
Write-Host "  & `"...install.ps1`" -Mode skip       # Keep local, only add new files" -ForegroundColor Gray
Write-Host "  & `"...install.ps1`" -Mode overwrite  # Overwrite all (with backup)" -ForegroundColor Gray
Write-Host ""
