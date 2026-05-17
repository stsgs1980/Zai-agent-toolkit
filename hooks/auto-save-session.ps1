# Auto-save session to memory
# ZCode ADE Hook
#
# Usage: Call this script when a session ends to save summary to memory
# Example: ./auto-save-session.ps1 -SessionId "abc123" -Summary "Completed feature X"

param(
    [string]$SessionId = "unknown",
    [string]$Summary = "Session completed"
)

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$content = "Session $SessionId completed at $timestamp. Summary: $Summary"

# Store in memory
python "$env:USERPROFILE\.zcode\tools\memory_cli.py" store session "$content"

Write-Host "Session saved to memory"
