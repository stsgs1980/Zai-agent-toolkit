# ============================================================
# Dashboard Integration — Install Script (v2)
# ============================================================
#
# Run this script from your memory-dashboard project root:
#
#   cd C:\Users\stsgr\.zcode\memory-dashboard
#   & "C:\Users\stsgr\.zcode\Zai-agent-toolkit\dashboard-integration\install.ps1"
#
# ============================================================

$ErrorActionPreference = "Stop"

# --- Configuration ---

# Where this script lives (the dashboard-integration folder)
$IntegrationDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Where the memory-dashboard project is (current working directory)
$DashboardDir = Get-Location

# Path to graph.json
$HomeDir = $env:USERPROFILE
$GraphJsonPath = Join-Path $HomeDir ".zcode\memory\graph.json"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Memory Dashboard — Full Integration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Integration dir: $IntegrationDir" -ForegroundColor Gray
Write-Host "Dashboard dir:   $DashboardDir" -ForegroundColor Gray
Write-Host "graph.json:      $GraphJsonPath" -ForegroundColor Gray
Write-Host ""

# --- Step 1: Verify we are in a Next.js project ---

Write-Host "[1/8] Checking project structure..." -ForegroundColor Yellow

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

Write-Host "[2/8] Detecting project layout..." -ForegroundColor Yellow

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

# --- Step 3: Copy API routes ---

Write-Host "[3/8] Copying API routes..." -ForegroundColor Yellow

$apiMappings = @(
    # Graph (existing)
    @{
        Src = Join-Path $IntegrationDir "api\memory\graph\route.ts"
        Dst = Join-Path $BaseDir "app\api\memory\graph\route.ts"
    },
    @{
        Src = Join-Path $IntegrationDir "api\memory\graph\vis\route.ts"
        Dst = Join-Path $BaseDir "app\api\memory\graph\vis\route.ts"
    },
    @{
        Src = Join-Path $IntegrationDir "api\memory\related-graph\route.ts"
        Dst = Join-Path $BaseDir "app\api\memory\related-graph\route.ts"
    },
    @{
        Src = Join-Path $IntegrationDir "api\memory\doc-intelligence\route.ts"
        Dst = Join-Path $BaseDir "app\api\memory\doc-intelligence\route.ts"
    },
    # New: Entries, Search, Experience, Stats
    @{
        Src = Join-Path $IntegrationDir "api\memory\entries\route.ts"
        Dst = Join-Path $BaseDir "app\api\memory\entries\route.ts"
    },
    @{
        Src = Join-Path $IntegrationDir "api\memory\search\route.ts"
        Dst = Join-Path $BaseDir "app\api\memory\search\route.ts"
    },
    @{
        Src = Join-Path $IntegrationDir "api\memory\experience\route.ts"
        Dst = Join-Path $BaseDir "app\api\memory\experience\route.ts"
    },
    @{
        Src = Join-Path $IntegrationDir "api\memory\stats\route.ts"
        Dst = Join-Path $BaseDir "app\api\memory\stats\route.ts"
    }
)

$copiedApi = 0
foreach ($mapping in $apiMappings) {
    $src = $mapping.Src
    $dst = $mapping.Dst

    if (-not (Test-Path $src)) {
        Write-Host "  SKIP: Source not found: $src" -ForegroundColor DarkGray
        continue
    }

    $dstDir = Split-Path -Parent $dst
    if (-not (Test-Path $dstDir)) {
        New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
        Write-Host "  Created: $dstDir" -ForegroundColor DarkGray
    }

    Copy-Item -Path $src -Destination $dst -Force
    Write-Host "  Copied: $(Split-Path -Leaf $dst)" -ForegroundColor Green
    $copiedApi++
}
Write-Host "  Total API routes copied: $copiedApi" -ForegroundColor Cyan

# --- Step 4: Copy components ---

Write-Host "[4/8] Copying components..." -ForegroundColor Yellow

$componentMappings = @(
    # Graph (existing)
    @{
        Src = Join-Path $IntegrationDir "components\GraphViewer.tsx"
        Dst = Join-Path $BaseDir "components\GraphViewer.tsx"
    },
    @{
        Src = Join-Path $IntegrationDir "components\GraphStats.tsx"
        Dst = Join-Path $BaseDir "components\GraphStats.tsx"
    },
    @{
        Src = Join-Path $IntegrationDir "components\DocIntelligenceView.tsx"
        Dst = Join-Path $BaseDir "components\DocIntelligenceView.tsx"
    },
    # New: Dashboard, Browser, Experience
    @{
        Src = Join-Path $IntegrationDir "components\DashboardHome.tsx"
        Dst = Join-Path $BaseDir "components\DashboardHome.tsx"
    },
    @{
        Src = Join-Path $IntegrationDir "components\MemoryBrowser.tsx"
        Dst = Join-Path $BaseDir "components\MemoryBrowser.tsx"
    },
    @{
        Src = Join-Path $IntegrationDir "components\ExperienceView.tsx"
        Dst = Join-Path $BaseDir "components\ExperienceView.tsx"
    },
    @{
        Src = Join-Path $IntegrationDir "components\MemoryDashboard.tsx"
        Dst = Join-Path $BaseDir "components\MemoryDashboard.tsx"
    },
    # Graph sub-components
    @{
        Src = Join-Path $IntegrationDir "components\graph\colors.ts"
        Dst = Join-Path $BaseDir "components\graph\colors.ts"
    },
    @{
        Src = Join-Path $IntegrationDir "components\graph\NodeDetail.tsx"
        Dst = Join-Path $BaseDir "components\graph\NodeDetail.tsx"
    },
    @{
        Src = Join-Path $IntegrationDir "components\graph\EdgeFilter.tsx"
        Dst = Join-Path $BaseDir "components\graph\EdgeFilter.tsx"
    },
    @{
        Src = Join-Path $IntegrationDir "components\graph\useForceGraph.ts"
        Dst = Join-Path $BaseDir "components\graph\useForceGraph.ts"
    },
    # Doc Intelligence sub-components
    @{
        Src = Join-Path $IntegrationDir "components\doc-intelligence\types.ts"
        Dst = Join-Path $BaseDir "components\doc-intelligence\types.ts"
    },
    @{
        Src = Join-Path $IntegrationDir "components\doc-intelligence\InputArea.tsx"
        Dst = Join-Path $BaseDir "components\doc-intelligence\InputArea.tsx"
    },
    @{
        Src = Join-Path $IntegrationDir "components\doc-intelligence\ResultsPanel.tsx"
        Dst = Join-Path $BaseDir "components\doc-intelligence\ResultsPanel.tsx"
    },
    # UI primitives
    @{
        Src = Join-Path $IntegrationDir "components\ui\index.tsx"
        Dst = Join-Path $BaseDir "components\ui\index.tsx"
    }
)

$copiedComp = 0
foreach ($mapping in $componentMappings) {
    $src = $mapping.Src
    $dst = $mapping.Dst

    if (-not (Test-Path $src)) {
        Write-Host "  SKIP: Source not found: $src" -ForegroundColor DarkGray
        continue
    }

    $dstDir = Split-Path -Parent $dst
    if (-not (Test-Path $dstDir)) {
        New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
    }

    Copy-Item -Path $src -Destination $dst -Force
    Write-Host "  Copied: $(Split-Path -Leaf $dst)" -ForegroundColor Green
    $copiedComp++
}
Write-Host "  Total components copied: $copiedComp" -ForegroundColor Cyan

# --- Step 5: Copy lib ---

Write-Host "[5/8] Copying lib/ files..." -ForegroundColor Yellow

$libMappings = @(
    @{
        Src = Join-Path $IntegrationDir "lib\graph-client.ts"
        Dst = Join-Path $BaseDir "lib\graph-client.ts"
    },
    @{
        Src = Join-Path $IntegrationDir "lib\types.ts"
        Dst = Join-Path $BaseDir "lib\types.ts"
    },
    @{
        Src = Join-Path $IntegrationDir "lib\constants.ts"
        Dst = Join-Path $BaseDir "lib\constants.ts"
    }
)

$copiedLib = 0
foreach ($mapping in $libMappings) {
    $src = $mapping.Src
    $dst = $mapping.Dst

    if (-not (Test-Path $src)) {
        Write-Host "  SKIP: Source not found: $src" -ForegroundColor DarkGray
        continue
    }

    $dstDir = Split-Path -Parent $dst
    if (-not (Test-Path $dstDir)) {
        New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
    }

    Copy-Item -Path $src -Destination $dst -Force
    Write-Host "  Copied: $(Split-Path -Leaf $dst)" -ForegroundColor Green
    $copiedLib++
}
Write-Host "  Total lib files copied: $copiedLib" -ForegroundColor Cyan

# --- Step 6: Update Prisma schema ---

Write-Host "[6/8] Updating Prisma schema..." -ForegroundColor Yellow

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

# --- Step 7: Update page.tsx to use MemoryDashboard ---

Write-Host "[7/8] Updating page.tsx..." -ForegroundColor Yellow

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

# --- Step 8: Verify graph.json and Python deps ---

Write-Host "[8/8] Verifying graph.json and dependencies..." -ForegroundColor Yellow

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

# --- Done ---

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Installation complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Dashboard has 5 tabs:" -ForegroundColor Cyan
Write-Host "  Dashboard     - Stats overview (entries, graph, experience)" -ForegroundColor White
Write-Host "  Memory        - Browse & search ChromaDB entries" -ForegroundColor White
Write-Host "  Graph         - Interactive graph visualization" -ForegroundColor White
Write-Host "  Intelligence  - AI-powered document extraction" -ForegroundColor White
Write-Host "  Experience    - Good/bad experience browser" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Start dev:      npm run dev" -ForegroundColor White
Write-Host "  2. Open:           http://localhost:3000" -ForegroundColor White
Write-Host "  3. Test API:       http://localhost:3000/api/memory/stats" -ForegroundColor White
Write-Host ""
Write-Host "To populate memory with data:" -ForegroundColor Cyan
Write-Host "  python .zcode\tools\memory_cli.py graph stats" -ForegroundColor White
Write-Host "  python .zcode\tools\folder_indexer.py graph-scan C:\path\to\project" -ForegroundColor White
Write-Host "  python .zcode\tools\session_summary.py list" -ForegroundColor White
Write-Host ""
