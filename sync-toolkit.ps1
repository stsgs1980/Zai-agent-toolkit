# sync-toolkit.ps1
# Thin wrapper around scripts/update-toolkit.ps1 (non-interactive mode)
# Usage: sync-toolkit
#
# For interactive mode with pause prompts, run:
#   scripts\update-toolkit.ps1

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
& "$scriptDir\scripts\update-toolkit.ps1" -NoPause
