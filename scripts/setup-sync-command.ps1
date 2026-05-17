# Setup sync-toolkit command
# Run this script ONCE to enable 'sync-toolkit' command in PowerShell

$profilePath = $PROFILE
$functionCode = @'

# === Zai-agent-toolkit sync command ===
function sync-toolkit {
    Set-Location C:\Users\stsgr\.zcode\Zai-agent-toolkit
    git pull
    Write-Host "Toolkit updated!" -ForegroundColor Green
}

function goto-toolkit {
    Set-Location C:\Users\stsgr\.zcode\Zai-agent-toolkit
}

function list-skills {
    Get-ChildItem C:\Users\stsgr\.zcode\Zai-agent-toolkit\skills -Directory | Select-Object Name
}
# === End toolkit commands ===

'@

# Check if already configured
if (Test-Path $profilePath) {
    $profileContent = Get-Content $profilePath -Raw
    if ($profileContent -match "sync-toolkit") {
        Write-Host "Already configured! Command 'sync-toolkit' is ready." -ForegroundColor Yellow
        exit 0
    }
}

# Create profile directory if not exists
$profileDir = Split-Path $profilePath -Parent
if (-not (Test-Path $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
}

# Append function to profile
Add-Content -Path $profilePath -Value $functionCode

Write-Host "Done! Commands available:" -ForegroundColor Green
Write-Host "  sync-toolkit  - Update toolkit from GitHub" -ForegroundColor Cyan
Write-Host "  goto-toolkit  - Navigate to toolkit folder" -ForegroundColor Cyan
Write-Host "  list-skills   - Show all skills" -ForegroundColor Cyan
Write-Host ""
Write-Host "Restart PowerShell to apply changes." -ForegroundColor Yellow
