@echo off
REM ==================================================
REM Z.ai Agent Toolkit - Update Script (cmd wrapper)
REM Calls PowerShell update-toolkit.ps1 with -NoPause
REM For interactive mode: run scripts\update-toolkit.ps1
REM ==================================================

powershell -ExecutionPolicy Bypass -File "%~dp0scripts\update-toolkit.ps1" -NoPause
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Update failed. Check your internet connection.
    pause
    exit /b 1
)
