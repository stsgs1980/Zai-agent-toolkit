# ============================================================
# Dashboard Integration — Install Script
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
Write-Host "  Graph Layer — Dashboard Integration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Integration dir: $IntegrationDir" -ForegroundColor Gray
Write-Host "Dashboard dir:   $DashboardDir" -ForegroundColor Gray
Write-Host "graph.json:      $GraphJsonPath" -ForegroundColor Gray
Write-Host ""

# --- Step 1: Verify we are in a Next.js project ---

Write-Host "[1/7] Checking project structure..." -ForegroundColor Yellow

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

Write-Host "[2/7] Detecting project layout..." -ForegroundColor Yellow

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

Write-Host "[3/7] Copying API routes..." -ForegroundColor Yellow

$apiMappings = @(
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
    }
)

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
}

# --- Step 4: Copy components ---

Write-Host "[4/7] Copying components..." -ForegroundColor Yellow

$componentMappings = @(
    @{
        Src = Join-Path $IntegrationDir "components\GraphViewer.tsx"
        Dst = Join-Path $BaseDir "components\GraphViewer.tsx"
    },
    @{
        Src = Join-Path $IntegrationDir "components\GraphStats.tsx"
        Dst = Join-Path $BaseDir "components\GraphStats.tsx"
    }
)

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
}

# --- Step 5: Copy lib ---

Write-Host "[5/7] Copying lib/graph-client.ts..." -ForegroundColor Yellow

$libDst = Join-Path $BaseDir "lib\graph-client.ts"

if (Test-Path (Join-Path $IntegrationDir "lib\graph-client.ts")) {
    $dstDir = Split-Path -Parent $libDst
    if (-not (Test-Path $dstDir)) {
        New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
    }
    Copy-Item -Path (Join-Path $IntegrationDir "lib\graph-client.ts") -Destination $libDst -Force
    Write-Host "  Copied: graph-client.ts -> $libDst" -ForegroundColor Green
} else {
    Write-Host "  SKIP: Source not found" -ForegroundColor DarkGray
}

# --- Step 6: Update Prisma schema ---

Write-Host "[6/7] Updating Prisma schema..." -ForegroundColor Yellow

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
        # NOTE: We use line-by-line parsing to avoid regex matching '}' inside @default("{}")
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
                # Count braces (but skip those inside quoted strings)
                $noStrings = $lines[$i] -replace '"[^"]*"', ''  # remove quoted strings
                $opens = ($noStrings | Select-String -Pattern '\{' -AllMatches).Matches.Count
                $closes = ($noStrings | Select-String -Pattern '\}' -AllMatches).Matches.Count
                $braceDepth += $opens - $closes
                if ($braceDepth -le 0) {
                    $insertIndex = $i
                    break
                }
            }
        }

        if ($insertIndex -ge 0) {
            $relationLines = @(
                "",
                "  // Graph layer relations",
                "  fromEdges MemoryEdge[] @relation(\"FromEdges\")",
                "  toEdges   MemoryEdge[] @relation(\"ToEdges\")"
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

# --- Step 7: Verify graph.json and Python deps ---

Write-Host "[7/7] Verifying graph.json and dependencies..." -ForegroundColor Yellow

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
$pythonCheck = python -c "import networkx; import pyvis; print('OK')" 2>&1
if ($pythonCheck -match "OK") {
    Write-Host "  OK: Python packages (networkx, pyvis) available" -ForegroundColor Green
} else {
    Write-Host "  WARN: Missing Python packages. Run: pip install networkx pyvis matplotlib" -ForegroundColor Yellow
}

# Check that tools are in .zcode/tools/
$zcodeToolsDir = Join-Path $HomeDir ".zcode\tools"
$requiredTools = @("graph_engine.py", "memory_cli.py", "folder_indexer.py")
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
    Write-Host "  OK: All 3 Python tools found in .zcode\tools\" -ForegroundColor Green
}

# --- Done ---

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Installation complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Start dev:      npm run dev" -ForegroundColor White
Write-Host "  2. Test API:       http://localhost:3000/api/memory/graph" -ForegroundColor White
Write-Host "  3. Test vis:       http://localhost:3000/api/memory/graph/vis" -ForegroundColor White
Write-Host "  4. Add GraphViewer to a page (see README.md Step 7)" -ForegroundColor White
Write-Host ""
Write-Host "To populate graph with real data:" -ForegroundColor Cyan
Write-Host "  python .zcode\tools\memory_cli.py graph stats" -ForegroundColor White
Write-Host "  python .zcode\tools\folder_indexer.py graph-scan C:\path\to\project" -ForegroundColor White
Write-Host ""
