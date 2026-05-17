# Installation Guide

## Overview

Z.ai Agent Toolkit is a **local reference** for AI agents (ZCode Desktop, Claude, etc.). It should NOT be deployed to production or committed to your project repository.

---

## Quick Install

### For ZCode Desktop 2.0

```bash
# 1. Clone toolkit to a global location
mkdir -p ~/.zcode
cd ~/.zcode
git clone https://github.com/stsgs1980/Zai-agent-toolkit.git

# 2. Create symlinks (ZCode Desktop reads from these paths)
ln -s ~/.zcode/Zai-agent-toolkit/skills ~/.zcode/skills
ln -s ~/.zcode/Zai-agent-toolkit/instructions ~/.zcode/instructions
ln -s ~/.zcode/Zai-agent-toolkit/standards ~/.zcode/standards

# 3. Verify
ls -la ~/.zcode/skills
```

### Update

```bash
cd ~/.zcode/Zai-agent-toolkit && git pull origin main
```

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
| `zai-agent-toolkit/` | Documentation, 478+ MB, not code |
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

### Why?

1. Toolkit is **documentation and standards** — not executable code
2. Vercel does not need these files
3. Including toolkit bloats your repository (478+ MB)
4. Git submodules cause Vercel deployment failures

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

## For Other AI Tools

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "agent-toolkit": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-filesystem", "/path/to/Zai-agent-toolkit"]
    }
  }
}
```

### Cursor / VS Code

Copy `AGENT_RULES.md` content to your `.cursorrules` or `.vscode/settings.json`.

---

## Directory Structure After Install

```
~/.zcode/
  Zai-agent-toolkit/     ← Git repository (git pull here)
    skills/
    instructions/
    standards/
    AGENT_RULES.md

  skills → ./Zai-agent-toolkit/skills        ← Symlink
  instructions → ./Zai-agent-toolkit/instructions  ← Symlink
  standards → ./Zai-agent-toolkit/standards  ← Symlink
```

---

## Troubleshooting

### Symlinks not working on Windows

Use Administrator PowerShell:

```powershell
# Enable Developer Mode first (Settings > Update & Security > Developers)
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.zcode\skills" -Target "$env:USERPROFILE\.zcode\Zai-agent-toolkit\skills"
```

### ZCode Desktop not seeing skills

1. Check paths: `ls -la ~/.zcode/skills`
2. Restart ZCode Desktop
3. Check ZCode settings for custom skill paths

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
| Local dev | `~/.zcode/Zai-agent-toolkit/` | NO |
| GitHub repo | Not included | NO (in .gitignore) |
| Vercel deploy | Not included | NO |
| ZCode Desktop | Reads from `~/.zcode/skills` | N/A |

**Toolkit is for local AI agent use only. It never goes to production.**
