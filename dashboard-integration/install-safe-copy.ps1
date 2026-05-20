# ============================================================
# Safe-Copy module — conflict-aware file copy with modes
# Dot-sourced by install.ps1 — shares caller scope
# ============================================================

$script:conflictCount = 0
$script:copiedCount   = 0
$script:skippedCount  = 0
$script:newCount      = 0

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
        if ($script:Mode -eq "diff") {
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

    $srcContent = Get-Content -Path $Src -ErrorAction SilentlyContinue
    $dstContent = Get-Content -Path $Dst -ErrorAction SilentlyContinue
    $srcLines = if ($srcContent) { $srcContent.Count } else { 0 }
    $dstLines = if ($dstContent) { $dstContent.Count } else { 0 }

    Write-Host ""
    Write-Host "  +-- CONFLICT: $fileName" -ForegroundColor Red
    Write-Host "  |  Source (git repo): $srcLines lines" -ForegroundColor Yellow
    Write-Host "  |  Destination (WIN): $dstLines lines" -ForegroundColor Yellow
    Write-Host "  |  Content differs -- local changes will be LOST if overwritten" -ForegroundColor Red

    # Show first 5 differing lines
    $maxLines = [Math]::Max($srcLines, $dstLines)
    $diffShown = 0
    for ($i = 0; $i -lt $maxLines -and $diffShown -lt 5; $i++) {
        $s = if ($i -lt $srcLines) { $srcContent[$i] } else { "" }
        $d = if ($i -lt $dstLines) { $dstContent[$i] } else { "" }
        if ($s -ne $d) {
            Write-Host "  |  Line $($i+1): repo=[$s] win=[$d]" -ForegroundColor DarkYellow
            $diffShown++
        }
    }
    Write-Host "  +--" -ForegroundColor Red

    # Handle based on mode
    switch ($script:Mode) {
        "diff" {
            Write-Host "  [CONFLICT] $fileName (diff mode -- not copied)" -ForegroundColor Red
            return
        }
        "skip" {
            Write-Host "  [SKIP] $fileName (skip mode -- preserved local)" -ForegroundColor Yellow
            $script:skippedCount++
            return
        }
        "overwrite" {
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
                        $script:Mode = "overwrite"
                        Copy-Item -Path $Src -Destination $Dst -Force
                        Write-Host "  [OVERWRITE] $fileName (mode -> overwrite all)" -ForegroundColor Red
                        $script:copiedCount++
                        $answered = $true
                    }
                    "K" {
                        $script:Mode = "skip"
                        Write-Host "  [SKIP] $fileName (mode -> skip all)" -ForegroundColor Yellow
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
