# ============================================================
# Dashboard Integration — Install Script
# ============================================================
#
# Run this script from your memory-dashboard project root:
#
#   cd C:\Users\stsgr\.zcode\memory-dashboard
#   & "C:\path\to\Zai-agent-toolkit\dashboard-integration\install.ps1"
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

Write-Host "[1/6] Checking project structure..." -ForegroundColor Yellow

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

# --- Step 2: Copy API routes ---

Write-Host "[2/6] Copying API routes..." -ForegroundColor Yellow

$apiMappings = @(
    @{
        Src = Join-Path $IntegrationDir "api\memory\graph\route.ts"
        Dst = Join-Path $DashboardDir "app\api\memory\graph\route.ts"
    },
    @{
        Src = Join-Path $IntegrationDir "api\memory\graph\vis\route.ts"
        Dst = Join-Path $DashboardDir "app\api\memory\graph\vis\route.ts"
    },
    @{
        Src = Join-Path $IntegrationDir "api\memory\related-graph\route.ts"
        Dst = Join-Path $DashboardDir "app\api\memory\related-graph\route.ts"
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

# --- Step 3: Copy components ---

Write-Host "[3/6] Copying components..." -ForegroundColor Yellow

$componentMappings = @(
    @{
        Src = Join-Path $IntegrationDir "components\GraphViewer.tsx"
        Dst = Join-Path $DashboardDir "components\GraphViewer.tsx"
    },
    @{
        Src = Join-Path $IntegrationDir "components\GraphStats.tsx"
        Dst = Join-Path $DashboardDir "components\GraphStats.tsx"
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

# --- Step 4: Copy lib ---

Write-Host "[4/6] Copying lib/graph-client.ts..." -ForegroundColor Yellow

$libMapping = @{
    Src = Join-Path $IntegrationDir "lib\graph-client.ts"
    Dst = Join-Path $DashboardDir "lib\graph-client.ts"
}

if (Test-Path $libMapping.Src) {
    $dstDir = Split-Path -Parent $libMapping.Dst
    if (-not (Test-Path $dstDir)) {
        New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
    }
    Copy-Item -Path $libMapping.Src -Destination $libMapping.Dst -Force
    Write-Host "  Copied: graph-client.ts" -ForegroundColor Green
} else {
    Write-Host "  SKIP: Source not found" -ForegroundColor DarkGray
}

# --- Step 5: Update Prisma schema ---

Write-Host "[5/6] Updating Prisma schema..." -ForegroundColor Yellow

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

        # Find the MemoryEntry model and add fields before the closing brace
        $pattern = '(?s)(model MemoryEntry \{.*?)(\})'
        if ($schemaContent -match $pattern) {
            $before = $Matches[1]
            $relationFields = "`n`n  // Graph layer relations`n  fromEdges MemoryEdge[] @relation(""FromEdges"")`n  toEdges   MemoryEdge[] @relation(""ToEdges"")`n"
            $newContent = $schemaContent -replace [regex]::Escape($before + $Matches[2]), ($before + $relationFields + $Matches[2])
            Set-Content -Path $schemaPath -Value $newContent -NoNewline
            Write-Host "  Added graph relations to MemoryEntry" -ForegroundColor Green
        } else {
            Write-Host "  WARN: Could not find MemoryEntry model" -ForegroundColor Yellow
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

# --- Step 6: Verify graph.json ---

Write-Host "[6/6] Verifying graph.json..." -ForegroundColor Yellow

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

# --- Done ---

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Installation complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Install d3:     npm install d3 @types/d3" -ForegroundColor White
Write-Host "  2. Start dev:      npm run dev" -ForegroundColor White
Write-Host "  3. Test API:       http://localhost:3000/api/memory/graph" -ForegroundColor White
Write-Host "  4. Test vis:       http://localhost:3000/api/memory/graph/vis" -ForegroundColor White
Write-Host ""
Write-Host "If you need to regenerate the Pyvis HTML, run:" -ForegroundColor Cyan
Write-Host "  python tools/memory_cli.py graph viz --format html --no-enrich" -ForegroundColor White
Write-Host ""
