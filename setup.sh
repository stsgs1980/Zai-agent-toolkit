#!/bin/bash
# Agent Toolkit Setup Script
# Run this script to set up agent-toolkit in any Next.js project.
# Usage: bash setup.sh [ghp_YOUR_PAT_HERE]
#        or: bash <(curl -L URL) [ghp_YOUR_PAT_HERE]

set -e

# === Configuration ===
GITHUB_USER="stsgs1980"
REPO="agent-toolkit"
TOOLKIT_VERSION="v1.5.0"
TMP_DIR="/tmp/agent-toolkit-setup"

# === Functions ===
info()  { echo "[INFO]  $1"; }
ok()    { echo "[OK]    $1"; }
warn()  { echo "[WARN]  $1"; }
fail()  { echo "[FAIL]  $1"; exit 1; }

# === Check prerequisites ===
command -v git >/dev/null 2>&1 || fail "git is not installed"
command -v curl >/dev/null 2>&1 || fail "curl is not installed"

# === Determine auth method ===
if [ -n "$1" ] && echo "$1" | grep -q "^ghp_"; then
  AUTH="$1"
  AUTH_TYPE="PAT"
else
  AUTH=""
  AUTH_TYPE="public"
fi

# === Clone toolkit ===
info "Cloning agent-toolkit $TOOLKIT_VERSION ($AUTH_TYPE)..."
rm -rf "$TMP_DIR"

if [ -n "$AUTH" ]; then
  git clone "https://${AUTH}@github.com/${GITHUB_USER}/${REPO}.git" "$TMP_DIR" 2>/dev/null || {
    info "PAT clone failed, trying public..."
    git clone "https://github.com/${GITHUB_USER}/${REPO}.git" "$TMP_DIR" 2>/dev/null || {
      fail "Cannot clone. Use: bash setup.sh ghp_YOUR_PAT_HERE"
    }
  }
else
  git clone "https://github.com/${GITHUB_USER}/${REPO}.git" "$TMP_DIR" 2>/dev/null || {
    info "Public clone failed. GitHub may require PAT."
    info "Try: bash setup.sh ghp_YOUR_PAT_HERE"
    fail "Clone failed. Provide PAT as argument."
  }
fi

ok "Cloned to $TMP_DIR"

# === Verify clone ===
[ -d "$TMP_DIR/skills" ] || fail "Invalid clone: skills/ not found"
[ -d "$TMP_DIR/instructions" ] || fail "Invalid clone: instructions/ not found"
[ -f "$TMP_DIR/AGENT_RULES.md" ] || fail "Invalid clone: AGENT_RULES.md not found in root"
[ -f "$TMP_DIR/PROJECT_CONFIG.md" ] || fail "Invalid clone: PROJECT_CONFIG.md not found in root"

# === Copy core files (root) ===
info "Copying core files..."

[ -f "AGENT_RULES.md" ] && warn "AGENT_RULES.md exists, backing up..." && cp AGENT_RULES.md AGENT_RULES.md.bak
cp "$TMP_DIR/AGENT_RULES.md" ./AGENT_RULES.md

[ -f "PROJECT_CONFIG.md" ] && warn "PROJECT_CONFIG.md exists, backing up..." && cp PROJECT_CONFIG.md PROJECT_CONFIG.md.bak
cp "$TMP_DIR/PROJECT_CONFIG.md" ./PROJECT_CONFIG.md

# === Copy skills ===
info "Copying skills..."
cp -r "$TMP_DIR/skills/" ./skills/

# === Copy instructions ===
info "Copying instructions..."
mkdir -p instructions
cp -r "$TMP_DIR/instructions/"* ./instructions/

# === Copy standards ===
info "Copying standards..."
mkdir -p standards
cp -r "$TMP_DIR/standards/"* ./standards/

# === Copy templates (Group A) ===
info "Copying templates..."
mkdir -p templates
cp -r "$TMP_DIR/templates/"* ./templates/

# === Deploy worklog to project root ===
info "Deploying worklog..."
[ -f "worklog.md" ] || cp "$TMP_DIR/templates/WORKLOG.md" ./worklog.md
[ -f "TASK_TEMPLATE.md" ] || cp "$TMP_DIR/templates/TASK_TEMPLATE.md" ./TASK_TEMPLATE.md
[ -f "README_WORKLOG.md" ] || cp "$TMP_DIR/templates/README_WORKLOG.md" ./README_WORKLOG.md

# === Cleanup ===
rm -rf "$TMP_DIR"

# === Verify ===
info "Verifying installation..."
FILES_OK=true
for f in AGENT_RULES.md PROJECT_CONFIG.md instructions/ skills/ standards/ templates/; do
  if [ -e "$f" ]; then
    ok "$f"
  else
    warn "$f -- MISSING"
    FILES_OK=false
  fi
done

[ -f "worklog.md" ] && ok "worklog.md (deployed to root)"
[ -f "TASK_TEMPLATE.md" ] && ok "TASK_TEMPLATE.md (deployed to root)"

# === Done ===
echo ""
echo "==============================="
echo "  Agent Toolkit $TOOLKIT_VERSION installed!"
echo "==============================="
echo ""
echo "Installed:"
echo "  - AGENT_RULES.md       (agent behavioral rules)"
echo "  - PROJECT_CONFIG.md    (edit this for your stack!)"
echo "  - standards/           (Group B: governance)"
echo "  - templates/           (Group A: operational)"
echo "  - instructions/        (5 detailed rules)"
echo "  - skills/              (git-safe-ops, dev-watchdog)"
echo "  - worklog.md           (deployed to root)"
echo "  - TASK_TEMPLATE.md     (deployed to root)"
echo ""
echo "Next steps:"
echo "  1. Edit PROJECT_CONFIG.md -- set your stack, server, paths"
echo "  2. Add AGENT_RULES.md content to your agent's instructions"
echo "  3. git add -A && git commit -m 'setup: add agent-toolkit $TOOLKIT_VERSION'"
echo "  4. On next chat, agent will auto-onboard"
echo ""
