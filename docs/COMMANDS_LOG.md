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
cd $env:USERPROFILE\.zcode\Zai-agent-toolkit
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
| Development | DEV | ZAI-DEV-001 |
| Meta-systems | META | ZAI-META-001 |
| Memory | MEM | ZAI-MEM-001 |
| Session | SESSION | ZAI-SESSION-001 |
| Filesystem | FS | ZAI-FS-001 |
| Quality | QA | ZAI-QA-001 |
| Requirements | REQ | ZAI-REQ-001 |

### Skills Registry

File: `docs/skill-id-registry.md` (canonical) or `skills/skill-id-system/SKILL.md` (summary)

---

## 3. Paths and Locations

### Windows

```text
$env:USERPROFILE\.zcode\Zai-agent-toolkit\     # Toolkit repository
$env:USERPROFILE\.zcode\skills\                   # Symbolic link -> toolkit/skills
```

### Linux (Z.ai)

```text
/home/z/my-project/Zai-agent-toolkit/           # Toolkit (repository clone)
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
cd $env:USERPROFILE\.zcode\Zai-agent-toolkit
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
    Set-Location $env:USERPROFILE\.zcode\Zai-agent-toolkit
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

### Toolkit Skills (with ZAI- IDs)

| ID | Skill | Description |
|----|-------|-------------|
| ZAI-META-001 | skill-id-system | ID system for skills |
| ZAI-META-002 | skill-creator | Create and optimize skills |
| ZAI-DEV-001 | project-clone | Smart project cloning |
| ZAI-DEV-002 | commit-work | Structured commit workflow |
| ZAI-DEV-001 | database-schema-designer | Database schema design |
| ZAI-SESSION-001 | session-log | Session knowledge capture |
| ZAI-SESSION-001 | context-consolidation | Context compression |
| ZAI-ARCH-001 | mermaid-diagrams | Mermaid diagram generation |
| ZAI-MEM-001 | memory-store | Store to ChromaDB |
| ZAI-MEM-002 | memory-query | Query ChromaDB |
| ZAI-MEM-003 | memory-delete | Delete from ChromaDB |
| ZAI-MEM-004 | memory-export | Export memory to JSON |
| ZAI-FS-001 | folder-indexer | Directory indexing |
| ZAI-QA-001 | qa-test-planner | QA test planning |
| ZAI-REQ-001 | requirements-clarity | Requirements analysis |
| ZAI-STS-001 | prompt-engineering_sts | Prompt engineering |
| ZAI-STS-002 | sync-toolkit_sts | Toolkit synchronization |
| ZAI-STS-003 | performance-code-generator_sts | Code optimization |
| ZAI-STS-004 | frontend-styling-expert_sts | CSS/styling specialist |
| ZAI-STS-005 | phi-layout_sts | Golden ratio layouts |
| ZAI-STS-006 | zai-ui-composer_sts | UI composition |

> Full registry with system skills: see `docs/skill-id-registry.md`

---

Built with: Python + PowerShell + Markdown
