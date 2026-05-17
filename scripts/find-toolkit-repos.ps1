# Find all repos with Zai-agent-toolkit copy
# Run: ./find-toolkit-repos.ps1

$owner = "stsgs1980"
$toolkitNames = @("Zai-agent-toolkit", "agent-toolkit", "Agent-Toolkit-ZCode")

Write-Host "Getting all repositories for $owner..." -ForegroundColor Cyan

$repos = gh repo list $owner --limit 100 --json name --jq '.[].name'

$foundRepos = @()

foreach ($repo in $repos) {
    Write-Host "Checking $repo..." -ForegroundColor Gray
    
    try {
        $contents = gh api "repos/$owner/$repo/contents" 2>$null | ConvertFrom-Json
        
        foreach ($item in $contents) {
            if ($item.type -eq "dir") {
                foreach ($toolkitName in $toolkitNames) {
                    if ($item.name -like "*$toolkitName*" -or $item.name -like "*agent-toolkit*") {
                        $foundRepos += [PSCustomObject]@{
                            Repo = $repo
                            Path = $item.path
                            Type = "copy"
                        }
                        Write-Host "  FOUND: $($item.path)" -ForegroundColor Green
                    }
                }
            }
        }
    } catch {
        # Repo might be empty or have issues
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary: Found toolkit in $($foundRepos.Count) repositories" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

$foundRepos | Format-Table -AutoSize

# Save to file
$foundRepos | ConvertTo-Json | Out-File "$PSScriptRoot\toolkit-repos.json"
Write-Host "Saved to: toolkit-repos.json" -ForegroundColor Gray
