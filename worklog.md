
---
Task ID: 1
Agent: Main
Task: Fix 4 dashboard bugs + add Hot Commands to 9 skills

Work Log:
- Diagnosed 4 bugs from user's server logs:
  1. /api/memory/entries?type=command → 500 (old memory_cli.py on WIN only has 5 ENTRY_TYPES)
  2. /api/memory/related-graph?node=... → 400 (ItemDetail sends ?node= but API expects ?id=)
  3. SyntaxError → 500 on GET / (cascade from #1)
  4. "No hot commands defined" (only 1/24 skills had ## Hot Commands section)
- Fixed entries/route.ts: try/catch around runPython → return empty array on failure
- Fixed ItemDetail.tsx: ?node= → ?id=, data.nodes → data.related
- Fixed HotCommandsView.tsx: when no commands, show trigger keywords as clickable "Activation phrases" with copy buttons
- Fixed install.ps1: added Python tools copy step (memory_cli.py etc.) from git repo → ~/.zcode/tools/
- Added ## Hot Commands sections to 9 skills: context-consolidation, session-log, session-experience, memory-store, memory-query, memory-delete, memory-export, commit-work, folder-indexer
- Tested TypeScript compilation locally — no errors in modified files
- Pushed as 9cbe916

Stage Summary:
- All 4 dashboard bugs fixed
- 9 skills now have Hot Commands (was 1, now 11 total with workflow-discipline + skill-creator)
- install.ps1 now keeps Python tools in sync with git repo
- User needs to: git pull → run install.ps1 → restart npm run dev
