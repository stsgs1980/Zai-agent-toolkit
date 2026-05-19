---
name: session-experience
version: 1.0
compatibility: both
description: "Auto-save session experience to ChromaDB. Activates when a session ends, a significant milestone is reached, or the user asks to save/remember experience. Extracts what worked, what failed, and root causes from conversation context, then stores as 'experience' entries with verification_status lifecycle (unverified -> verified/conflict). Uses session_summary.py under the hood. Triggers: session ending, 'save experience', 'remember this', 'запомни', 'сохранить опыт', autosave timer, milestone reached, context getting full."
id: ZAI-SESSION-003
author: STS
trigger: save experience, remember this, session summary, autosave, session end, запомни, сохранить опыт, опыт сессии, what worked, what failed, lessons learned, from-worklog, session wrap-up
license: MIT
---

# Skill: Session Experience v1.0

> ID: ZAI-SESSION-003
> Version: 1.0
> Last Updated: 2026-05

This skill captures session experience automatically — what worked, what failed, and why — and stores it as searchable entries in ChromaDB. It ensures that hard-won knowledge from debugging, architecture decisions, and problem-solving is never lost between sessions.

---

## AUTO-ACTIVATION RULES

**This skill MUST activate automatically when ANY of these conditions are detected:**

| Condition | Trigger | Priority |
|-----------|---------|----------|
| Session is ending | User says goodbye, "на этом пока", "до завтра", or agent detects wrap-up | [C] Must save |
| Autosave timer fires | Every 30 minutes (configurable) | [W] Should save |
| Major milestone reached | Feature completed, bug fixed, deployment done | [W] Should save |
| Context window filling | Agent warns about context limits | [C] Must save |
| User explicitly asks | "save experience", "запомни", "remember this" | [C] Must save |
| Error pattern repeated | Same error 3+ times in session | [I] Suggest save |

**Auto-trigger phrases (agent should recognize these patterns in ANY context):**
- User: "на этом всё", "до завтра", "заканчиваем", "save and quit"
- Agent detects: 5+ tool calls on same problem, repeated errors, breakthrough moment
- Timer: 30-minute autosave interval
- Context warning: "context is getting full"

---

## How It Works

### Architecture

```
Conversation Context
        |
        v
  [Agent extracts experience]
        |
        v
  session_summary.py CLI
        |
        v
  ChromaDB 'experience' collection
        |
        v
  Memory Dashboard (Experience tab)
```

### Two Modes

**Mode 1: Manual** — Agent crafts the experience from conversation context
```bash
python tools/session_summary.py manual \
  --title "Title of experience" \
  --good "What worked line 1|What worked line 2" \
  --bad "What failed line 1|What failed line 2" \
  --why "Root cause analysis" \
  --tech "python,nextjs,chromadb" \
  --verdict mixed_with_pivots
```

**Mode 2: From Worklog** — Parse structured worklog into experience
```bash
python tools/session_summary.py from-worklog /path/to/worklog.md
```

### Verification Lifecycle

Every experience entry goes through a verification lifecycle:

```
unverified ──> verified     (confirmed by human or subsequent session)
          ──> conflict      (contradicted by later experience)
```

- **unverified**: Just recorded, not yet confirmed. Default state.
- **verified**: Confirmed accurate by repeat observation or human review.
- **conflict**: Later experience contradicts this entry. Needs review.

---

## When to Use This Skill

**MUST apply this skill when:**
- Session is wrapping up (user says goodbye or agent detects end)
- Autosave timer fires (every 30 min)
- User explicitly asks to save/remember experience
- Context window is getting full (save before losing data)
- Major bug was solved after multiple attempts
- Architecture decision was made with trade-offs

**DO NOT use for:**
- Trivial operations (file read, simple queries)
- Every single tool call (batch into one experience per topic)
- When user is in the middle of active debugging (wait for resolution)

---

## Step-by-Step: Saving Experience

### Step 1: Identify Save-Worthy Moments

Scan the conversation for these patterns:

```text
SAVE-WORTHY:
- Bug that took 3+ attempts to fix
- Architecture decision with trade-offs
- Tool/framework behavior that was surprising
- Error that had non-obvious root cause
- Pattern that worked unexpectedly well
- Mistake that wasted significant time

SKIP:
- Routine operations
- Simple lookups
- Straightforward implementations
- Things already in documentation
```

### Step 2: Extract What Worked / What Failed

From conversation context, identify:

```text
WHAT WORKED (good):
  - Specific approach that solved the problem
  - Tool or technique that was effective
  - Pattern that prevented bugs
  - Short-cut that saved time

WHAT FAILED (bad):
  - Approach that didn't work and why
  - Assumption that was wrong
  - Tool misuse or misunderstanding
  - Anti-pattern that caused problems

ROOT CAUSE (why):
  - Why the failure happened
  - What the underlying issue was
  - How to avoid it next time
```

### Step 3: Store via CLI

```bash
# On Windows (from project root):
python C:\Users\stsgr\.zcode\tools\session_summary.py manual ^
  --title "Short descriptive title" ^
  --good "Approach X worked because Y|Pattern Z prevented bug W" ^
  --bad "Approach A failed because B|Assumption C was wrong" ^
  --why "Root cause was D, not E as initially assumed" ^
  --tech "python,nextjs,powershell" ^
  --verdict mixed_with_pivots

# On Linux/Mac:
python tools/session_summary.py manual \
  --title "Short descriptive title" \
  --good "Approach X worked because Y|Pattern Z prevented bug W" \
  --bad "Approach A failed because B|Assumption C was wrong" \
  --why "Root cause was D, not E as initially assumed" \
  --tech "python,nextjs,powershell" \
  --verdict mixed_with_pivots
```

### Step 4: Verify Entry

After storing, the entry appears in the Memory Dashboard Experience tab as `unverified`. To verify:

```bash
# Via CLI:
python tools/session_summary.py verify EXP-005 --status verified

# Via Dashboard:
# Click "Verify" button on the Experience tab
```

---

## Good Experience Examples

### Example 1: Encoding Bug (verified pattern)

```
Title: Windows CP1251 ломает кириллицу при передаче Python-Node.js
Good: PYTHONIOENCODING=utf-8 env var fixes encoding|Always set encoding explicitly on Windows
Bad: Default Windows encoding is CP1251|execFile inherits system encoding
Why: Python on Windows defaults to system locale, not UTF-8
Tech: python,nodejs,windows,powershell
Verdict: mostly_succeeded
```

### Example 2: PowerShell Escaping (verified pattern)

```
Title: PowerShell экранирование двойных кавычек ломает execFile
Good: Single-quoted strings in PowerShell preserve literal content|Use -replace for string manipulation
Bad: Double quotes get interpreted by PowerShell before passing to Python|Backtick escaping is unreliable
Why: PowerShell string interpolation happens before child process receives args
Tech: powershell,cli,escaping
Verdict: mostly_succeeded
```

### Example 3: ChromaDB Path Confusion (unverified)

```
Title: ChromaDB data split across two directories
Good: PersistentClient path is configurable via env var|Check actual collection names to verify data location
Bad: Different tools default to different ChromaDB paths|sync_index.py and memory_bridge.py used different paths
Why: No single source of truth for CHROMA_PATH across tools
Tech: chromadb,python,path-resolution
Verdict: mixed_with_pivots
```

---

## Integration with Memory Dashboard

Experience entries appear in the **Experience** tab of the Memory Dashboard:

- **Cards** show: title, good/bad counts, verification status, tags
- **Verify button** toggles status: unverified -> verified
- **Search** works semantically across all experience entries
- **Tags** are auto-generated from technologies + verdict

The dashboard reads from ChromaDB via the `memory_bridge.py` Python bridge, which queries the `experience` collection.

---

## Autosave Configuration

In `$PROFILE` (PowerShell):

```powershell
# Timer that fires every 30 minutes
$script:sessionTimer = $null

function Start-SessionTimer {
    $interval = New-TimeSpan -Minutes 30
    $script:sessionTimer = [System.Timers.Timer]::new($interval.TotalMilliseconds)
    $script:sessionTimer.AutoReset = $true
    $script:sessionTimer.Add_Elapsed({
        Write-Host "`n[AUTOSAVE] Session timer fired. Consider saving experience." -ForegroundColor Yellow
    })
    $script:sessionTimer.Start()
}

function Stop-SessionTimer {
    if ($script:sessionTimer) {
        $script:sessionTimer.Stop()
        $script:sessionTimer.Dispose()
        $script:sessionTimer = $null
    }
}
```

---

## Companion Skills

| Companion Skill | When to Use | What It Covers |
|----------------|-------------|----------------|
| **anti-monolith** | When experience involves refactoring patterns | File decomposition, layer separation |
| **fullstack-dev** | When experience involves Next.js or API patterns | Backend, frontend, database patterns |
| **git-safety** | When experience involves git deadlocks or conflicts | Git safety, recovery patterns |

---

## Quick Reference Card

```text
TRIGGER: Session end, autosave timer, explicit request, context full
TOOL:    python tools/session_summary.py manual --title "..." --good "..." --bad "..." --why "..." --tech "..."
PATHS:   Windows: C:\Users\stsgr\.zcode\tools\session_summary.py
         Linux:   tools/session_summary.py
STATUS:  unverified -> verified (confirmed) / conflict (contradicted)
STORE:   ChromaDB 'experience' collection
VIEW:    Memory Dashboard -> Experience tab

GOOD EXPERIENCE = Specific + Actionable + Root Cause
BAD EXPERIENCE  = Vague + No lesson + No context

SEPARATOR for multi-line good/bad: | (pipe character)
VERDICTS: mostly_succeeded, mostly_failed, mixed_with_pivots, inconclusive
```

---

## Communication Style

This skill communicates concisely:
- Announce saves: `[EXPERIENCE] Saved: "Title" (3 good, 2 bad, unverified)`
- Suggest saves: `[EXPERIENCE] Should we save this? You solved X after Y attempts`
- Timer fires: `[AUTOSAVE] 30 minutes elapsed. Consider saving experience.`
- Use severity: [C] Must save (session ending), [W] Should save (milestone), [I] Consider (pattern noticed)

---

## Related Standards

- **STD-AGENT-001** (Subagent Standard): Context handoff includes experience
- **STD-ERR-001** (Error Handling Standard): Error patterns feed into experience
- **STD-ENV-002** (Z.ai Integration Standard): ChromaDB path configuration

---

Built with: Z.ai Agent Toolkit
