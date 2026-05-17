@echo off
REM ==================================================
REM Z.ai Agent Toolkit - Update Script
REM Run this to get latest skills/instructions/standards
REM ==================================================

echo.
echo ================================================
echo   Z.ai Agent Toolkit Updater
echo ================================================
echo.

if not exist "%USERPROFILE%\.zcode\Zai-agent-toolkit" (
    echo [ERROR] Toolkit not found at %USERPROFILE%\.zcode\Zai-agent-toolkit
    echo Please install first: git clone https://github.com/stsgs1980/Zai-agent-toolkit.git
    pause
    exit /b 1
)
cd /d "%USERPROFILE%\.zcode\Zai-agent-toolkit"

echo Current version:
type VERSION 2>nul || echo (unknown)
echo.

echo Checking for updates...
git fetch origin

git status | findstr /C:"Your branch is up to date" >nul
if %errorlevel% equ 0 (
    echo [OK] Already up to date!
    echo.
    echo No updates needed. Press any key to exit.
    pause >nul
    exit /b 0
)

echo.
echo Updates available! Pulling...
echo.

git pull origin main

if %errorlevel% equ 0 (
    echo.
    echo ================================================
    echo   [SUCCESS] Toolkit updated!
    echo ================================================
    echo.
    echo New version:
    type VERSION 2>nul || echo (check git log)
    echo.
    echo Restart ZCode Desktop to use new skills.
) else (
    echo.
    echo [ERROR] Update failed. Check your internet connection.
)

echo.
echo Press any key to exit...
pause >nul
