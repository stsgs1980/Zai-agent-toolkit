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

# === Memory functions ===
function Save-Session {
    <#
    .SYNOPSIS
    Save current session to ZCode memory
    
    .EXAMPLE
    Save-Session "Fixed memory CLI metadata parsing"
    Save-Session "Added folder indexer" -Tags "feature,tools" -Project "zai-toolkit"
    #>
    param(
        [Parameter(Mandatory=$true, Position=0)]
        [string]$Summary,
        
        [string]$Tags = "",
        [string]$Project = ""
    )
    
    & "$env:USERPROFILE\.zcode\Zai-agent-toolkit\hooks\auto-save-session.ps1" -Summary $Summary -Tags $Tags -Project $Project
}

function Get-Memory {
    <#
    .SYNOPSIS
    Query ZCode memory
    
    .EXAMPLE
    Get-Memory "skills"
    Get-Memory "index" -Type knowledge
    #>
    param(
        [Parameter(Mandatory=$true, Position=0)]
        [string]$Query,
        
        [ValidateSet("session", "knowledge", "pattern", "project", "template", "command", "experience")]
        [string]$Type,
        
        [int]$Limit = 5
    )
    
    if ($Type) {
        & python "$env:USERPROFILE\.zcode\Zai-agent-toolkit\tools\memory_cli.py" query $Query --type $Type --limit $Limit
    } else {
        & python "$env:USERPROFILE\.zcode\Zai-agent-toolkit\tools\memory_cli.py" query $Query --limit $Limit
    }
}

function List-Memory {
    <#
    .SYNOPSIS
    List memory entries
    
    .EXAMPLE
    List-Memory knowledge
    List-Memory session -Limit 20
    #>
    param(
        [Parameter(Mandatory=$true, Position=0)]
        [ValidateSet("session", "knowledge", "pattern", "project", "template", "command", "experience")]
        [string]$Type,
        
        [int]$Limit = 10
    )
    
    & python "$env:USERPROFILE\.zcode\Zai-agent-toolkit\tools\memory_cli.py" list $Type --limit $Limit
}

# Aliases (gm -> gmem, потому что gm занят Get-Member)
Set-Alias -Name ss -Value Save-Session
Set-Alias -Name gmem -Value Get-Memory
Set-Alias -Name lm -Value List-Memory

Write-Host "Memory functions loaded: Save-Session (ss), Get-Memory (gmem), List-Memory (lm)" -ForegroundColor DarkGray
