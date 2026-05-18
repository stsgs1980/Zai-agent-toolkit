# Zai-agent-toolkit Command Reference

> Last updated: 2026-05-18
> Purpose: Quick reference for toolkit commands

---

## 1. Synchronization

### Windows (ZCode Desktop)

```powershell
# Method 1: Quick command (after alias setup)
sync-toolkit

# Method 2: Run script directly
.\sync-toolkit.ps1

# Method 3: Manual git pull
cd $env:USERPROFILE\.zcode\Zai-agent-toolkit_v
git pull
```

### Linux (Z.ai sandbox)

```bash
# Push changes to GitHub
git add .
git commit -m "description of changes"
git push origin main
```

---

## 2. Skills -- Core Commands

### Creating a skill with ID

```text
skills/
+-- my-skill_sts/           # _sts - user signature
    +-- SKILL.md            # ID: ZAI-STS-XXX
```

### Skill ID Assignment

Format: `ZAI-<DOMAIN>-<NUMBER>`

| Domain | Code | Example |
|--------|------|---------|
| Personal (STS) | STS | ZAI-STS-001 |
| Architecture | ARCH | ZAI-ARCH-001 |
| Git | GIT | ZAI-GIT-001 |
| Development | DEV | ZAI-DEV-001 |
| Meta-systems | META | ZAI-META-001 |

### Skills Registry

File: `skills/skill-id-system/SKILL.md` -> Registry section

---

## 3. Paths and Locations

### Windows

```text
$env:USERPROFILE\.zcode\Zai-agent-toolkit_v\     # Toolkit repository
$env:USERPROFILE\.zcode\skills\                   # Symbolic link -> toolkit/skills
```

### Linux (Z.ai)

```text
/home/z/my-project/Zai-agent-toolkit_v/           # Toolkit (repository clone)
/home/z/my-project/skills/                        # Skills in sandbox
```

---

## 4. Typical Workflow

### Creating a new skill

1. Create folder: `skills/new-skill_sts/`
2. Create file: `SKILL.md` with content
3. Add ID to header: `# Skill Name [ZAI-STS-XXX]`
4. Update registry in `skill-id-system/SKILL.md`
5. Push: `git add . && git commit -m "add new-skill_sts" && git push`

### Updating skills on Windows

1. On Linux: `git push` changes
2. On Windows: `sync-toolkit` or `git pull`
3. Restart ZCode Desktop (if needed)

---

## 5. Git Cheat Sheet

```bash
# Check status
git status

# Stage all changes
git add .

# Commit
git commit -m "message"

# Push
git push origin main

# Pull changes
git pull origin main

# Recent commit history
git log --oneline -10
```

---

## 6. Windows Command Setup (one-time)

### Automatic setup

```powershell
# Run once in PowerShell:
cd $env:USERPROFILE\.zcode\Zai-agent-toolkit_v
.\scripts\setup-sync-command.ps1

# Restart PowerShell
```

After that, commands work everywhere:

| Command | Action |
|---------|--------|
| `sync-toolkit` | Update toolkit from GitHub |
| `goto-toolkit` | Navigate to toolkit folder |
| `list-skills` | Show all skills |

### Manual setup (if needed)

Add to PowerShell profile (`notepad $PROFILE`):

```powershell
function sync-toolkit {
    Set-Location $env:USERPROFILE\.zcode\Zai-agent-toolkit_v
    git pull
    Write-Host "Toolkit updated!" -ForegroundColor Green
}
```

---

## 7. Toolkit Documentation

| File | Purpose |
|------|---------|
| `docs/TUTORIAL.md` | Full toolkit tutorial |
| `docs/SKILL_ID_GUIDE.md` | ID system reference |
| `docs/COMMANDS_LOG.md` | This command reference |
| `skills/skill-id-system/SKILL.md` | Registry of all skills |
| `skills/skill-creator/SKILL.md` | Instructions for creating skills |

---

## 8. Quick Reference

| Action | Command |
|--------|---------|
| Update skills on Windows | `sync-toolkit` |
| Push changes | `git add . && git commit -m "msg" && git push` |
| List skills | `ls skills/` (Linux) or `list-skills` (Win) |
| Find skill by ID | `grep -r "ZAI-STS" skills/` |
| Open PowerShell profile | `notepad $PROFILE` |

---

## 9. Assigned ID Registry

### Skills with IDs (assigned)

| ID | Skill | Description |
|----|-------|-------------|
| ZAI-META-001 | skill-id-system | ID system for skills |
| ZAI-META-002 | skill-creator | Create and optimize skills |
| ZAI-DEV-002 | anti-monolith | System skill (Z.ai sandbox) -- not in toolkit |
| ZAI-STS-001 | prompt-engineering_sts | Prompt engineering techniques |
| ZAI-STS-002 | sync-toolkit_sts | Toolkit synchronization |

---

Built with: Python + PowerShell + Markdown
