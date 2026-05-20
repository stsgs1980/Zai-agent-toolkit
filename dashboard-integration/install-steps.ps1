# ============================================================
# Install Steps module — Steps 1-10
# Dot-sourced by install.ps1 — shares caller scope
# Uses $script:BaseDir, $script:packageJson, $script:Mode
# Reads $IntegrationDir, $DashboardDir, $HomeDir, $GraphJsonPath
# ============================================================

function Step-VerifyProject {
    Write-Host "[1/10] Checking project structure..." -ForegroundColor Yellow
    $script:packageJson = Join-Path $DashboardDir "package.json"
    if (-not (Test-Path $script:packageJson)) {
        Write-Host "  ERROR: No package.json found in current directory." -ForegroundColor Red
        Write-Host "  Make sure you run this script from the memory-dashboard root." -ForegroundColor Red
        exit 1
    }
    $prismaDir = Join-Path $DashboardDir "prisma"
    if (-not (Test-Path $prismaDir)) {
        Write-Host "  ERROR: No prisma/ directory found." -ForegroundColor Red
        exit 1
    }
    Write-Host "  OK: Found package.json and prisma/" -ForegroundColor Green
}

function Step-DetectLayout {
    Write-Host "[2/10] Detecting project layout..." -ForegroundColor Yellow
    $SrcDir = Join-Path $DashboardDir "src"
    if (Test-Path $SrcDir) {
        $script:BaseDir = $SrcDir
        Write-Host "  Detected: src/ layout" -ForegroundColor Green
    } else {
        $script:BaseDir = $DashboardDir
        Write-Host "  Detected: flat layout" -ForegroundColor Green
    }
    Write-Host "  Base dir: $script:BaseDir" -ForegroundColor Gray
}

function Step-CopyApiRoutes {
    Write-Host "[3/10] Copying API routes..." -ForegroundColor Yellow
    $apiMappings = @(
        @{ Src = Join-Path $IntegrationDir "api\memory\graph\route.ts";           Dst = Join-Path $script:BaseDir "app\api\memory\graph\route.ts" },
        @{ Src = Join-Path $IntegrationDir "api\memory\graph\vis\route.ts";       Dst = Join-Path $script:BaseDir "app\api\memory\graph\vis\route.ts" },
        @{ Src = Join-Path $IntegrationDir "api\memory\related-graph\route.ts";   Dst = Join-Path $script:BaseDir "app\api\memory\related-graph\route.ts" },
        @{ Src = Join-Path $IntegrationDir "api\memory\doc-intelligence\route.ts"; Dst = Join-Path $script:BaseDir "app\api\memory\doc-intelligence\route.ts" },
        @{ Src = Join-Path $IntegrationDir "api\memory\entries\route.ts";         Dst = Join-Path $script:BaseDir "app\api\memory\entries\route.ts" },
        @{ Src = Join-Path $IntegrationDir "api\memory\search\route.ts";          Dst = Join-Path $script:BaseDir "app\api\memory\search\route.ts" },
        @{ Src = Join-Path $IntegrationDir "api\memory\experience\route.ts";      Dst = Join-Path $script:BaseDir "app\api\memory\experience\route.ts" },
        @{ Src = Join-Path $IntegrationDir "api\memory\experience\extract\route.ts"; Dst = Join-Path $script:BaseDir "app\api\memory\experience\extract\route.ts" },
        @{ Src = Join-Path $IntegrationDir "api\memory\stats\route.ts";           Dst = Join-Path $script:BaseDir "app\api\memory\stats\route.ts" },
        @{ Src = Join-Path $IntegrationDir "api\memory\commands\route.ts";        Dst = Join-Path $script:BaseDir "app\api\memory\commands\route.ts" }
    )
    foreach ($mapping in $apiMappings) {
        Safe-Copy -Src $mapping.Src -Dst $mapping.Dst
    }
}

function Step-CopyComponents {
    Write-Host "[4/10] Copying components..." -ForegroundColor Yellow
    $componentMappings = @(
        # Main layout (sidebar + split panel)
        @{ Src = Join-Path $IntegrationDir "components\MemoryDashboard.tsx";  Dst = Join-Path $script:BaseDir "components\MemoryDashboard.tsx" },
        @{ Src = Join-Path $IntegrationDir "components\useDashboard.ts";      Dst = Join-Path $script:BaseDir "components\useDashboard.ts" },
        @{ Src = Join-Path $IntegrationDir "components\DashboardToolbar.tsx"; Dst = Join-Path $script:BaseDir "components\DashboardToolbar.tsx" },
        @{ Src = Join-Path $IntegrationDir "components\Sidebar.tsx";          Dst = Join-Path $script:BaseDir "components\Sidebar.tsx" },
        @{ Src = Join-Path $IntegrationDir "components\SidebarParts.tsx";     Dst = Join-Path $script:BaseDir "components\SidebarParts.tsx" },
        @{ Src = Join-Path $IntegrationDir "components\ItemList.tsx";         Dst = Join-Path $script:BaseDir "components\ItemList.tsx" },
        @{ Src = Join-Path $IntegrationDir "components\ItemDetail.tsx";       Dst = Join-Path $script:BaseDir "components\ItemDetail.tsx" },
        @{ Src = Join-Path $IntegrationDir "components\NewEntryDialog.tsx";   Dst = Join-Path $script:BaseDir "components\NewEntryDialog.tsx" },
        # Tool views (full-width in main area)
        @{ Src = Join-Path $IntegrationDir "components\GraphViewer.tsx";      Dst = Join-Path $script:BaseDir "components\GraphViewer.tsx" },
        @{ Src = Join-Path $IntegrationDir "components\GraphStats.tsx";       Dst = Join-Path $script:BaseDir "components\GraphStats.tsx" },
        @{ Src = Join-Path $IntegrationDir "components\HotCommandsView.tsx";  Dst = Join-Path $script:BaseDir "components\HotCommandsView.tsx" },
        @{ Src = Join-Path $IntegrationDir "components\DocIntelligenceView.tsx"; Dst = Join-Path $script:BaseDir "components\DocIntelligenceView.tsx" },
        # Legacy (kept for reference, not imported by default)
        @{ Src = Join-Path $IntegrationDir "components\DashboardHome.tsx";    Dst = Join-Path $script:BaseDir "components\DashboardHome.tsx" },
        @{ Src = Join-Path $IntegrationDir "components\MemoryBrowser.tsx";    Dst = Join-Path $script:BaseDir "components\MemoryBrowser.tsx" },
        # Experience (decomposed into modules)
        @{ Src = Join-Path $IntegrationDir "components\ExperienceView.tsx";   Dst = Join-Path $script:BaseDir "components\ExperienceView.tsx" },
        @{ Src = Join-Path $IntegrationDir "components\ExperienceBrowse.tsx"; Dst = Join-Path $script:BaseDir "components\ExperienceBrowse.tsx" },
        @{ Src = Join-Path $IntegrationDir "components\ExperienceExtract.tsx"; Dst = Join-Path $script:BaseDir "components\ExperienceExtract.tsx" },
        @{ Src = Join-Path $IntegrationDir "components\ExperienceEntryCard.tsx"; Dst = Join-Path $script:BaseDir "components\ExperienceEntryCard.tsx" },
        @{ Src = Join-Path $IntegrationDir "components\ExperienceNewForm.tsx"; Dst = Join-Path $script:BaseDir "components\ExperienceNewForm.tsx" },
        @{ Src = Join-Path $IntegrationDir "components\ExtractTerminalInput.tsx"; Dst = Join-Path $script:BaseDir "components\ExtractTerminalInput.tsx" },
        @{ Src = Join-Path $IntegrationDir "components\ExtractedEntryCard.tsx"; Dst = Join-Path $script:BaseDir "components\ExtractedEntryCard.tsx" },
        # Graph sub-components
        @{ Src = Join-Path $IntegrationDir "components\graph\colors.ts";      Dst = Join-Path $script:BaseDir "components\graph\colors.ts" },
        @{ Src = Join-Path $IntegrationDir "components\graph\NodeDetail.tsx"; Dst = Join-Path $script:BaseDir "components\graph\NodeDetail.tsx" },
        @{ Src = Join-Path $IntegrationDir "components\graph\EdgeFilter.tsx"; Dst = Join-Path $script:BaseDir "components\graph\EdgeFilter.tsx" },
        @{ Src = Join-Path $IntegrationDir "components\graph\useForceGraph.ts"; Dst = Join-Path $script:BaseDir "components\graph\useForceGraph.ts" },
        # Doc Intelligence sub-components
        @{ Src = Join-Path $IntegrationDir "components\doc-intelligence\types.ts";      Dst = Join-Path $script:BaseDir "components\doc-intelligence\types.ts" },
        @{ Src = Join-Path $IntegrationDir "components\doc-intelligence\InputArea.tsx"; Dst = Join-Path $script:BaseDir "components\doc-intelligence\InputArea.tsx" },
        @{ Src = Join-Path $IntegrationDir "components\doc-intelligence\ResultsPanel.tsx"; Dst = Join-Path $script:BaseDir "components\doc-intelligence\ResultsPanel.tsx" },
        # UI primitives
        @{ Src = Join-Path $IntegrationDir "components\ui\index.tsx";        Dst = Join-Path $script:BaseDir "components\ui\index.tsx" }
    )
    foreach ($mapping in $componentMappings) {
        Safe-Copy -Src $mapping.Src -Dst $mapping.Dst
    }
}

function Step-CopyLib {
    Write-Host "[5/10] Copying lib/ files..." -ForegroundColor Yellow
    $libMappings = @(
        @{ Src = Join-Path $IntegrationDir "lib\graph-client.ts";  Dst = Join-Path $script:BaseDir "lib\graph-client.ts" },
        @{ Src = Join-Path $IntegrationDir "lib\types.ts";         Dst = Join-Path $script:BaseDir "lib\types.ts" },
        @{ Src = Join-Path $IntegrationDir "lib\constants.tsx";    Dst = Join-Path $script:BaseDir "lib\constants.tsx" },
        @{ Src = Join-Path $IntegrationDir "lib\ai-bridge.ts";     Dst = Join-Path $script:BaseDir "lib\ai-bridge.ts" },
        @{ Src = Join-Path $IntegrationDir "lib\memory\bridge.ts"; Dst = Join-Path $script:BaseDir "lib\memory\bridge.ts" },
        @{ Src = Join-Path $IntegrationDir "lib\memory\cache.ts";  Dst = Join-Path $script:BaseDir "lib\memory\cache.ts" },
        @{ Src = Join-Path $IntegrationDir "lib\memory\preload.ts"; Dst = Join-Path $script:BaseDir "lib\memory\preload.ts" }
    )
    foreach ($mapping in $libMappings) {
        Safe-Copy -Src $mapping.Src -Dst $mapping.Dst
    }
}

function Step-CopyInstrumentation {
    Write-Host "[6/10] Copying instrumentation.ts..." -ForegroundColor Yellow
    $instrSrc = Join-Path $IntegrationDir "instrumentation.ts"
    $instrDst = Join-Path $script:BaseDir "instrumentation.ts"
    if (Test-Path $instrSrc) {
        Safe-Copy -Src $instrSrc -Dst $instrDst
    } else {
        Write-Host "  SKIP: instrumentation.ts not found in integration dir" -ForegroundColor DarkGray
    }
}

function Step-UpdatePrisma {
    Write-Host "[7/10] Updating Prisma schema..." -ForegroundColor Yellow
    # Placeholder — Prisma schema update handled manually or via prisma migrate
}

function Step-UpdatePage {
    Write-Host "[8/10] Updating page.tsx..." -ForegroundColor Yellow
    $pagePath = Join-Path $script:BaseDir "app\page.tsx"
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
}

function Step-VerifyDeps {
    Write-Host "[9/10] Verifying graph.json and dependencies..." -ForegroundColor Yellow

    if (Test-Path $GraphJsonPath) {
        Write-Host "  OK: graph.json exists" -ForegroundColor Green
    } else {
        Write-Host "  WARN: graph.json not found. Creating empty..." -ForegroundColor Yellow
        $graphDir = Split-Path -Parent $GraphJsonPath
        if (-not (Test-Path $graphDir)) { New-Item -ItemType Directory -Path $graphDir -Force | Out-Null }
        $emptyGraph = @{ version = 1; created_at = ""; edges = @(); isolated_nodes = @() } | ConvertTo-Json -Depth 3
        Set-Content -Path $GraphJsonPath -Value $emptyGraph
        Write-Host "  Created empty graph.json" -ForegroundColor Green
    }

    $pythonCheck = python -c "import networkx; import pyvis; import chromadb; print('OK')" 2>&1
    if ($pythonCheck -match "OK") {
        Write-Host "  OK: Python packages available" -ForegroundColor Green
    } else {
        Write-Host "  WARN: Missing Python packages. Run: pip install networkx pyvis matplotlib chromadb" -ForegroundColor Yellow
    }

    $zcodeToolsDir = Join-Path $HomeDir ".zcode\tools"
    if (-not (Test-Path $zcodeToolsDir)) { New-Item -ItemType Directory -Path $zcodeToolsDir -Force | Out-Null }

    $toolkitToolsDir = Join-Path $IntegrationDir "..\tools"
    $pythonTools = @("graph_engine.py", "memory_cli.py", "folder_indexer.py", "session_summary.py")
    foreach ($tool in $pythonTools) {
        $srcTool = Join-Path $toolkitToolsDir $tool
        $dstTool = Join-Path $zcodeToolsDir $tool
        if (Test-Path $srcTool) {
            Safe-Copy -Src $srcTool -Dst $dstTool
        } else {
            $altSrc = Join-Path $HomeDir ".zcode\Zai-agent-toolkit\tools\$tool"
            if (Test-Path $altSrc) {
                Safe-Copy -Src $altSrc -Dst $dstTool
            } else {
                Write-Host "  WARN: $tool not found in any source" -ForegroundColor Yellow
            }
        }
    }

    # Ensure all 7 ChromaDB collections exist
    Write-Host "  Ensuring all 7 ChromaDB collections exist..." -ForegroundColor Gray
    $initResult = python (Join-Path $zcodeToolsDir "memory_cli.py") init 2>&1
    if ($initResult -match "ERROR") {
        Write-Host "  WARN: DB init failed -- $initResult" -ForegroundColor Yellow
    } else {
        Write-Host "  OK: All collections verified" -ForegroundColor Green
    }
}

function Step-VerifyPreload {
    Write-Host "[10/10] Verifying preload infrastructure..." -ForegroundColor Yellow

    $bridgePath  = Join-Path $script:BaseDir "lib\memory\bridge.ts"
    $cachePath   = Join-Path $script:BaseDir "lib\memory\cache.ts"
    $preloadPath = Join-Path $script:BaseDir "lib\memory\preload.ts"
    $instrPath   = Join-Path $script:BaseDir "instrumentation.ts"

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

    # Ensure z-ai-web-dev-sdk is installed
    Write-Host ""
    Write-Host "  Checking z-ai-web-dev-sdk..." -ForegroundColor Gray
    $pkgJson = Get-Content -Path $script:packageJson -Raw | ConvertFrom-Json
    $sdkInstalled = $false
    if ($pkgJson.dependencies.'z-ai-web-dev-sdk') {
        $sdkInstalled = $true
    }
    if (-not $sdkInstalled -and ($pkgJson.devDependencies.'z-ai-web-dev-sdk')) {
        $sdkInstalled = $true
    }

    if ($sdkInstalled) {
        Write-Host "  OK: z-ai-web-dev-sdk found in package.json" -ForegroundColor Green
    } else {
        Write-Host "  Installing z-ai-web-dev-sdk (required for Doc Intel AI extraction)..." -ForegroundColor Yellow
        Push-Location $DashboardDir
        npm install z-ai-web-dev-sdk 2>&1 | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
        Pop-Location
        Write-Host "  Done: z-ai-web-dev-sdk installed" -ForegroundColor Green
    }
}
