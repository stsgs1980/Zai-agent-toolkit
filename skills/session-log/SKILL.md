---
name: session-log
version: 1.0
compatibility: both
description: "Auto-log session activity to ChromaDB. Logs what was done, what tools were used, what files were changed, what errors occurred. Always active — every session gets a log entry. This is NOT experience (lessons learned), this is a factual record of activity. Triggers: session end, autosave timer, 'лог', 'log session', 'что делали', context full. Use this skill whenever a session is ending, wrapping up, or periodically to save progress."
id: ZAI-SESSION-001
author: STS
trigger: session log, лог сессии, что делали, log activity, autosave, session end, wrap-up, до завтра, на этом пока
license: MIT
---

# Session Log v1.0

> ID: ZAI-SESSION-001
> Version: 1.0

This skill logs session activity — what was done, what changed, what errors happened. It always saves, even if there's nothing to "learn". A session without lessons still has value as a record.

## LOG vs EXPERIENCE

This skill logs facts. The session-experience skill extracts lessons. They are different:

```
LOG:  "Редактировали HotCommandsView.tsx, добавили колонку Command"
EXP:  "PS -replace ломает hex-opacity, используй Set-Content"

LOG:  "ChromaDB путь исправлен с chroma_data на memory/chromadb"
EXP:  "Проверять PersistentClient path перед работой с ChromaDB"

LOG:  "3 часа потратили на glassmorphism"
EXP:  (может не быть — если нет урока)
```

**Log = what happened. Experience = what was learned. Log always saves. Experience only when there's a lesson.**

## What to Log

Every log entry captures:

| Field | What it contains | Example |
|-------|-----------------|---------|
| **title** | Short summary of session focus | "Dashboard: HotCommands + glassmorphism removal" |
| **tasks** | What was attempted | "Added Command column to Skills table\|Removed glassmorphism from all components\|Fixed session-experience skill v2.0" |
| **errors** | What went wrong | "PowerShell -replace failed on hex-opacity codes\|Next.js cache not updating\|.next folder needed manual deletion" |
| **files** | Files modified | "HotCommandsView.tsx\|MemoryDashboard.tsx\|MemoryBrowser.tsx\|SKILL.md" |
| **duration** | Approximate time spent | "3h" |
| **result** | Overall outcome | partial, completed, blocked, abandoned |

## Auto-Activation

This skill ALWAYS activates on session end or timer. No conditions — just save.

| Condition | Priority |
|-----------|----------|
| Session ending ("до завтра", goodbye) | [C] Must |
| Context filling | [C] Must |
| User asks ("лог", "log session") | [C] Must |
| Autosave timer (30 min) | [W] Should |
| After major milestone | [I] Consider |

## How to Save

```bash
# Windows:
python C:\Users\stsgr\.zcode\tools\session_summary.py log ^
  --title "Краткое описание фокуса сессии" ^
  --tasks "Задача 1|Задача 2|Задача 3" ^
  --errors "Ошибка 1|Ошибка 2" ^
  --files "file1.tsx|file2.py|file3.md" ^
  --duration "3h" ^
  --result partial

# Linux:
python tools/session_summary.py log \
  --title "Short session focus" \
  --tasks "Task 1|Task 2|Task 3" \
  --errors "Error 1|Error 2" \
  --files "file1.tsx|file2.py" \
  --duration "3h" \
  --result partial
```

## Log Entry Examples

### Example 1: Productive session

```
Title: Dashboard: HotCommands + glassmorphism removal
Tasks: Added Command column to Skills table|Removed glassmorphism from 6 components|Rewrote session-experience v2.0
Errors: PowerShell -replace failed on hex-opacity codes 3 times|Next.js .next cache required manual deletion
Files: HotCommandsView.tsx|MemoryDashboard.tsx|MemoryBrowser.tsx|ResultsPanel.tsx|InputArea.tsx|SKILL.md
Duration: 4h
Result: partial (commands done, styling cleanup ongoing)
```

### Example 2: Debugging session

```
Title: ChromaDB path mismatch debugging
Tasks: Found sync_index.py and memory_bridge.py use different paths|Fixed bridge path to memory/chromadb|Verified 13 collections now accessible
Errors: Bridge returned empty results for project_index|ChromaDB data was in ~/.zcode/memory/chromadb not ~/.zcode/chroma_data
Files: memory_bridge.py
Duration: 1h
Result: completed
```

### Example 3: Blocked session (like today)

```
Title: Glassmorphism removal — repeated failures
Tasks: Attempted to remove glassmorphism from all components|Tried PowerShell -replace (failed multiple times)|Used Set-Content for full file replacement (worked)
Errors: -replace regex didn't match hex-opacity patterns|Multiple -replace passes needed for each opacity variant|Next.js cache required .next deletion every time
Files: HotCommandsView.tsx|MemoryDashboard.tsx|MemoryBrowser.tsx|DashboardHome.tsx|ExperienceView.tsx|DocIntelligenceView.tsx|InputArea.tsx|ResultsPanel.tsx|ui/index.tsx
Duration: 3h
Result: partial (glassmorphism removed, but took far too long due to tooling issues)
```

## Result Values

- **completed** — All tasks done
- **partial** — Some done, some not
- **blocked** — Could not proceed
- **abandoned** — Gave up

## Quick Reference

```
LOG = facts about what happened (always save)
EXPERIENCE = lessons learned (save only when there's a lesson)

Every session gets a log. Not every session gets experience.

Separator: | (pipe)
Results: completed, partial, blocked, abandoned
Store: ChromaDB 'session' collection
Tool: python tools/session_summary.py log --title "..." --tasks "..." --errors "..." --files "..." --duration "..." --result partial
```

## Communication

- `[LOG] Saved: "Dashboard work" (5 tasks, 3 errors, partial)`
- `[LOG] Autosave: saving session progress...`
- `[LOG] Session ending — logging activity before close`
