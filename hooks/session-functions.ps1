# Add to PowerShell profile for easy session management
# Run: Add-Content $PROFILE (Get-Content session-functions.ps1)

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
    
    & "$env:USERPROFILE\.zcode\Zai-agent-toolkit_v\hooks\auto-save-session.ps1" -Summary $Summary -Tags $Tags -Project $Project
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
        
        [ValidateSet("session", "knowledge", "pattern", "project", "template")]
        [string]$Type,
        
        [int]$Limit = 5
    )
    
    if ($Type) {
        & python "$env:USERPROFILE\.zcode\Zai-agent-toolkit_v\tools\memory_cli.py" query $Query --type $Type --limit $Limit
    } else {
        & python "$env:USERPROFILE\.zcode\Zai-agent-toolkit_v\tools\memory_cli.py" query $Query --limit $Limit
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
        [ValidateSet("session", "knowledge", "pattern", "project", "template")]
        [string]$Type,
        
        [int]$Limit = 10
    )
    
    & python "$env:USERPROFILE\.zcode\Zai-agent-toolkit_v\tools\memory_cli.py" list $Type --limit $Limit
}

# Aliases
Set-Alias -Name ss -Value Save-Session -Force
Set-Alias -Name qm -Value Get-Memory -Force   # Query Memory (gm is reserved)
Set-Alias -Name lm -Value List-Memory -Force

Write-Host "Memory functions loaded: Save-Session (ss), Get-Memory (qm), List-Memory (lm)" -ForegroundColor DarkGray
