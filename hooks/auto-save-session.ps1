# Auto-save session to memory
# ZCode ADE Hook
#
# Usage:
#   ./auto-save-session.ps1 -Summary "Description of what was done"
#   ./auto-save-session.ps1 -Summary "Fixed memory CLI bug" -Tags "bugfix,memory"

param(
    [Parameter(Mandatory=$true)]
    [string]$Summary,
    
    [string]$Tags = "",
    [string]$Project = ""
)

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$sessionId = "session_$timestamp"

# Build content
$content = $Summary

# Build metadata
$metadata = "type=session"
if ($Tags) { $metadata += ",tags=$Tags" }
if ($Project) { $metadata += ",project=$Project" }

# Store in memory
$result = & python "$env:USERPROFILE\.zcode\Zai-agent-toolkit\tools\memory_cli.py" store session "$content" --metadata $metadata 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Session saved: $sessionId" -ForegroundColor Green
    Write-Host "Summary: $Summary" -ForegroundColor Cyan
} else {
    Write-Host "Error saving session: $result" -ForegroundColor Red
    exit 1
}
