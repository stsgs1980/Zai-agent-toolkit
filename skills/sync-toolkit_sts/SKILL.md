---
name: sync-toolkit_sts
compatibility: sandbox
description: >
  Sync Z.ai Agent Toolkit between server and Windows. Use when user says:
  "sync toolkit", "update toolkit", "obnovit skills", "sync locally",
  "push to windows", "obnovi lokalno", "sinkhroniziruy", "sync".
  Triggers: sync toolkit, update toolkit, obnovit, lokalno, sinkhronizatsiya.
id: ZAI-STS-002
version: 1.0
trigger: sync toolkit, update toolkit, obnovit, lokalno, sinkhronizatsiya
---

# Skill: Sync Toolkit v1.0

> ID: ZAI-STS-002
> Version: 1.0
> Last Updated: 2026-05

Sync toolkit between Z.ai server and Windows PC.

---

## When to Use

Activate when user says:
- "sync toolkit"
- "update toolkit"
- "obnovit skills"
- "sync locally"
- "push to windows"
- "obnovi lokalno"
- "sinkhroniziruy"

---

## Quick Commands

### Simple Triggers

| User Says | Action |
|-----------|--------|
| "sync" | Full sync: push + tell user to pull |
| "push toolkit" | Push to GitHub only |
| "pull toolkit" | Instructions for Windows pull |

---

## Sync Workflow

### Step 1: Check Status

```bash
cd /home/z/my-project/Zai-agent-toolkit
git status
```

### Step 2: Commit and Push (if changes)

```bash
git add .
git commit -m "Update toolkit"
git push
```

### Step 3: Tell User

After push, tell user:

```bash
[OK] Pushed to GitHub

On Windows run:
  sync-toolkit

Or manually:
  cd C:\Users\stsgr\.zcode\Zai-agent-toolkit
  git pull
```

---

## Windows Side

### Quick Command

User has shortcut: `sync-toolkit`

This runs: `C:\Users\stsgr\.zcode\Zai-agent-toolkit\sync-toolkit.ps1`

### Manual Command

```powershell
cd C:\Users\stsgr\.zcode\Zai-agent-toolkit
git pull
```

---

## Full Sync Script

The sync-toolkit.ps1 script:

```powershell
# sync-toolkit.ps1
Write-Host "Syncing Z.ai Agent Toolkit..." -ForegroundColor Green

Set-Location "$env:USERPROFILE\.zcode\Zai-agent-toolkit"

Write-Host "Pulling updates..." -ForegroundColor Cyan
git pull origin main

Write-Host ""
Write-Host "[OK] Toolkit synced!" -ForegroundColor Green
Write-Host "Version: $(Get-Content VERSION -ErrorAction SilentlyContinue)" -ForegroundColor Gray
```

---

## Checklist

- [ ] Checked for uncommitted changes
- [ ] Committed changes (if any)
- [ ] Pushed to GitHub
- [ ] Told user to run sync-toolkit on Windows
- [ ] Verified sync complete

---

Built with: Z.ai Agent Toolkit
