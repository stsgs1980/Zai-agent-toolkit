# Z.ai Agent Toolkit - Update Script (PowerShell)
# Run this to get latest skills/instructions/standards

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Z.ai Agent Toolkit Updater" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$toolkitPath = "$env:USERPROFILE\.zcode\Zai-agent-toolkit"

if (-not (Test-Path $toolkitPath)) {
    Write-Host "[ERROR] Toolkit not found at $toolkitPath" -ForegroundColor Red
    Write-Host "Please install first: git clone https://github.com/stsgs1980/Zai-agent-toolkit.git" -ForegroundColor Yellow
    pause
    exit 1
}

Set-Location $toolkitPath

Write-Host "Current location: $toolkitPath" -ForegroundColor Gray
Write-Host ""

# Show current commit
Write-Host "Current version:" -ForegroundColor White
git log -1 --oneline
Write-Host ""

Write-Host "Checking for updates..." -ForegroundColor Yellow
git fetch origin

$status = git status --porcelain -b
if ($status -match "up to date") {
    Write-Host "[OK] Already up to date!" -ForegroundColor Green
    Write-Host ""
    pause
    exit 0
}

Write-Host ""
Write-Host "Updates available! Pulling..." -ForegroundColor Yellow
Write-Host ""

git pull origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "  [SUCCESS] Toolkit updated!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "New version:" -ForegroundColor White
    git log -1 --oneline
    Write-Host ""
    Write-Host "Restart ZCode Desktop to use new skills." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "[ERROR] Update failed. Check your internet connection." -ForegroundColor Red
}

Write-Host ""
pause
