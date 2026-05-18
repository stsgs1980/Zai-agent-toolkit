# Installation Guide

## Overview

Z.ai Agent Toolkit is a **local reference** for AI agents (ZCode Desktop, Claude, etc.). It should NOT be deployed to production or committed to your project repository.

---

## Windows Installation (Step by Step)

### Prerequisites

- ZCode Desktop installed (https://zcode.z.ai/)
- Git installed (https://git-scm.com/download/win)
- Developer Mode enabled in Windows

### Step 1: Enable Developer Mode

1. Press `Win + I` to open Windows Settings
2. Go to: `Update & Security` > `For developers`
3. Turn ON: `Developer Mode`

### Step 2: Open PowerShell

Press `Win + R`, type `powershell`, press Enter.

### Step 3: Navigate to ZCode folder

```powershell
cd $env:USERPROFILE\.zcode
```

### Step 4: Clone the toolkit

```powershell
git clone https://github.com/stsgs1980/Zai-agent-toolkit_v.git
```

Wait for download to complete.

### Step 5: Create symlinks

```powershell
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.zcode\skills" -Target "$env:USERPROFILE\.zcode\Zai-agent-toolkit_v\skills"
```

```powershell
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.zcode\instructions" -Target "$env:USERPROFILE\.zcode\Zai-agent-toolkit_v\instructions"
```

```powershell
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.zcode\standards" -Target "$env:USERPROFILE\.zcode\Zai-agent-toolkit_v\standards"
```

### Step 6: Verify

```powershell
dir $env:USERPROFILE\.zcode
```

You should see:
- `l---- skills -> ...Zai-agent-toolkit_v\skills`
- `l---- instructions -> ...Zai-agent-toolkit_v\instructions`
- `l---- standards -> ...Zai-agent-toolkit_v\standards`

### Step 7: Restart ZCode Desktop

Close and reopen ZCode Desktop application.

---

## How to Update (Windows)

### Option A: Easy Way - Use Update Script

1. Open PowerShell
2. Run:

```powershell
& "$env:USERPROFILE\.zcode\Zai-agent-toolkit_v\scripts\update-toolkit.ps1"
```

### Option B: Manual Way

```powershell
cd $env:USERPROFILE\.zcode\Zai-agent-toolkit_v
git pull origin main
```

---

## Mac / Linux Installation

```bash
# 1. Clone toolkit
mkdir -p ~/.zcode
cd ~/.zcode
git clone https://github.com/stsgs1980/Zai-agent-toolkit_v.git

# 2. Create symlinks
ln -s ~/.zcode/Zai-agent-toolkit_v/skills ~/.zcode/skills
ln -s ~/.zcode/Zai-agent-toolkit_v/instructions ~/.zcode/instructions
ln -s ~/.zcode/Zai-agent-toolkit_v/standards ~/.zcode/standards

# 3. Verify
ls -la ~/.zcode/skills
```

### Update (Mac / Linux)

```bash
cd ~/.zcode/Zai-agent-toolkit_v && git pull origin main
```

---

## Why This Setup is Safe

### ZCode Desktop Updates Are Safe

ZCode Desktop only manages these folders:
- `agent/` - agent configs
- `cli/` - CLI settings
- `v2/` - app version data

ZCode does NOT create or modify:
- `skills/`
- `instructions/`
- `standards/`

**Your symlinks are safe and will not be overwritten by ZCode updates.**

---

## For Vercel / Production

### Files That Should NOT Deploy to Vercel

Create `.vercelignore` in your project root:

```gitignore
# AI Agent Files (local development only)
.agent/
.zcode/
agent-ctx/
worklog.md
TASK_TEMPLATE.md
zai-agent-toolkit/

# Environment & Secrets
.env
.env.local
*.pem
*.key

# Database (use managed DB in production)
*.db
*.sqlite

# Development Scripts
keep-alive.sh
watchdog.sh
generate-*.js

# Logs
*.log

# IDE
.idea/
.vscode/
```

### Why These Files Are Excluded

| File/Folder | Reason |
|-------------|--------|
| `.agent/`, `.zcode/` | AI tool configs, not needed in production |
| `agent-ctx/` | Session context, not deployable |
| `worklog.md` | Agent journal, irrelevant in production |
| `zai-agent-toolkit/` | Documentation, not code |
| `*.db`, `*.sqlite` | Local database, use Vercel Postgres/Neon |
| `keep-alive.sh` | Dev server keepalive, not needed |
| `*.log` | Log files, use proper logging service |

### Do NOT commit toolkit

Add to your project's `.gitignore`:

```gitignore
# Z.ai Agent Toolkit — local reference only
zai-agent-toolkit/
.agent-toolkit/
```

### If you accidentally added as submodule

```bash
# Remove submodule completely
git submodule deinit -f zai-agent-toolkit
rm -rf .git/modules/zai-agent-toolkit
git rm -f zai-agent-toolkit

# Add to .gitignore
echo "zai-agent-toolkit/" >> .gitignore
```

---

## Directory Structure After Install

```bash
~/.zcode/
  agent/                 ← ZCode managed (safe)
  cli/                   ← ZCode managed (safe)
  v2/                    ← ZCode managed (safe)
  Zai-agent-toolkit_v/     ← Git repository (git pull here)
    skills/
    instructions/
    standards/
    scripts/
      update-toolkit.ps1 ← Windows update script
      update-toolkit.bat ← Windows update script (alternative)
    VERSION

  skills -> ./Zai-agent-toolkit_v/skills        ← Symlink (safe)
  instructions -> ./Zai-agent-toolkit_v/instructions  ← Symlink (safe)
  standards -> ./Zai-agent-toolkit_v/standards  ← Symlink (safe)
```

---

## Troubleshooting

### "A parameter cannot be found that matches parameter name 'la'"

You are using PowerShell, not bash. Use:
```powershell
dir $env:USERPROFILE\.zcode
```
instead of `ls -la ~/.zcode/`

### Symlinks show "l----" but ZCode does not see skills

1. Restart ZCode Desktop
2. Check ZCode settings for custom skill paths
3. Make sure Developer Mode is ON

### "New-Item: Administrator privilege required"

Run PowerShell as Administrator:
1. Right-click PowerShell icon
2. Select "Run as administrator"

### Vercel build fails with "submodule not found"

You have a git submodule. Remove it:

```bash
git submodule deinit -f zai-agent-toolkit
rm -rf .git/modules/zai-agent-toolkit
git rm -f zai-agent-toolkit
echo "zai-agent-toolkit/" >> .gitignore
git add .gitignore && git commit -m "fix: remove toolkit submodule"
```

---

## Summary

| Environment | Toolkit Location | Included in Git? |
|-------------|-----------------|------------------|
| Local dev | `~/.zcode/Zai-agent-toolkit_v/` | NO |
| GitHub repo | Not included | NO (in .gitignore) |
| Vercel deploy | Not included | NO |
| ZCode Desktop | Reads from `~/.zcode/skills` | N/A |

**Toolkit is for local AI agent use only. It never goes to production.**

---
Built with: Python + PowerShell + Markdown
