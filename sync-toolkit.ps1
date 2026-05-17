# sync-toolkit.ps1
# Quick sync command for Z.ai Agent Toolkit
# Usage: sync-toolkit

Write-Host "Syncing Z.ai Agent Toolkit..." -ForegroundColor Green

$toolkitPath = "$env:USERPROFILE\.zcode\Zai-agent-toolkit"

if (-not (Test-Path $toolkitPath)) {
    Write-Host "[FAIL] Toolkit not found at $toolkitPath" -ForegroundColor Red
    exit 1
}

Set-Location $toolkitPath

Write-Host "Pulling updates..." -ForegroundColor Cyan
git pull origin main

if ($LASTEXITCODE -eq 0) {
    $version = Get-Content "VERSION" -ErrorAction SilentlyContinue
    Write-Host ""
    Write-Host "[OK] Toolkit synced!" -ForegroundColor Green
    if ($version) {
        Write-Host "Version: $version" -ForegroundColor Gray
    }
} else {
    Write-Host "[FAIL] Sync failed" -ForegroundColor Red
}
