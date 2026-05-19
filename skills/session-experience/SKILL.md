---
name: session-experience
version: 2.0
compatibility: both
description: "Extract and store session EXPERIENCE (not logs!) to ChromaDB. Experience = what worked + what failed + WHY + how to avoid next time. A LOG describes what happened. Experience extracts the lesson. All three fields (good, bad, why) are MANDATORY and must contain specific actionable insights, not vague descriptions. Rejects entries without lessons learned. Triggers: session end, autosave timer, 'запомни', 'save experience', 'remember this', 'сохранить опыт', context getting full, milestone reached, repeated errors."
id: ZAI-SESSION-003
author: STS
trigger: save experience, remember this, session end, запомни, сохранить опыт, what worked, what failed, lessons learned, autosave, experience not log
license: MIT
---

# Session Experience v2.0

> ID: ZAI-SESSION-003
> Version: 2.0

This skill extracts lessons from sessions and stores them in ChromaDB. The key distinction: a LOG tells what happened. An EXPERIENCE tells what was learned and how to act differently next time.

## The Most Important Rule

**No lesson = no entry.** If you cannot fill all three fields (good, bad, why) with specific actionable content, do not save. A vague entry is worse than no entry because it pollutes search results.

## LOG vs EXPERIENCE

A LOG describes events. An EXPERIENCE extracts lessons. Understand the difference because saving logs as experience is the most common mistake.

```
LOG:  "Python падал на кириллице"                  = описание проблемы
EXP:  "PYTHONIOENCODING=utf-8 fixes it on Windows"  = извлечённый урок

LOG:  "Replace команда не сработала 3 раза"          = хронология
EXP:  "PS -replace ломает hex с /, нужен Set-Content" = причина+решение

LOG:  "Потратили 2 часа на дебаг"                    = факт о времени
EXP:  "Проверять encoding ПЕРВЫМ делом на Windows"   = правило на будущее

LOG:  "Дашборд не обновился"                          = симптом
EXP:  "Next.js кэш .next не инвалидируется, нужен Remove-Item + Ctrl+Shift+R" = решение
```

## Mandatory Fields

Every entry must have all three fields filled with specific content:

| Field | Required | What it contains | Good example | Bad example |
|-------|----------|-----------------|--------------|-------------|
| **good** | YES | What worked + WHY it worked | `PYTHONIOENCODING=utf-8 env var fixes encoding` | `Перезапустил` |
| **bad** | YES | What failed + WHY it failed | `Default Windows encoding is CP1251 not UTF-8` | `Не сработало` |
| **why** | YES | Root cause (not symptom!) | `Python inherits system locale on Windows` | `Хз` |

**Reject the entry if any field is empty, contains "?", "не знаю", or just restates the problem without insight.**

## Good vs Bad Entries

### SAVE these (real lessons):

```
Title: PowerShell -replace ломает CSS hex-opacity
Good: Set-Content с полной заменой файла надёжнее чем -replace|Одной командой Set-Content -Value @'...'@ -Encoding UTF8
Bad: PowerShell -replace не матчит hex-коды с / (#0ea5e915, /10, /30)|Regex в PS меняет кодировку файла
Why: PS regex engine + Set-Content перекодируют файл ломая Unicode
Tech: powershell,css,encoding
Verdict: mostly_succeeded
```

```
Title: Next.js кэш не обновляет компоненты
Good: Remove-Item -Recurse -Force .next перед npm run dev|Ctrl+Shift+R в браузере для жёсткого обновления
Bad: Файловая замена без очистки .next = старый код|Next.js кэширует скомпилированные модули
Why: Next.js не инвалидирует кэш при замене файлов напрямую
Tech: nextjs,cache,dev
Verdict: mostly_succeeded
```

```
Title: ChromaDB два пути — данные потеряны
Good: Проверять коллекции через python -c "import chromadb; print(chromadb.PersistentClient(path=...).list_collections())" перед работой
Bad: sync_index.py и memory_bridge.py использовали разные пути к ChromaDB|Нет единого CHROMA_PATH
Why: Каждый инструмент хардкодил свой путь без конфига
Tech: chromadb,python,path
Verdict: mixed_with_pivots
```

### REJECT these (not lessons, just logs):

```
REJECT: Title: "Python падал на кириллице"
  Good: ?    Bad: ?    Why: ?
  Reason: Пустые поля = лог без урока

REJECT: Title: "Дашборд не обновился"
  Good: "Перезапустил"   Bad: "Не обновился"   Why: "Не знаю"
  Reason: Нет конкретики, нет причины, нет урока

REJECT: Title: "Session 2026-05-19 summary"
  Good: "Сделали дашборд"   Bad: "Много ошибок"   Why: "Сложно"
  Reason: Слишком общо, невозможно действовать на основе этого

REJECT: Title: "Replace не сработал 3 раза"
  Good: "Потом сработал"   Bad: "Не сработал"   Why: "Хз"
  Reason: Описание процесса, не извлечённый урок
```

## Extraction Rules

When scanning a conversation for experience:

1. **Look for patterns worth saving:**
   - Same error 3+ times = lesson about wrong approach
   - Breakthrough after long deadlock = lesson about what worked
   - Non-obvious tool behavior = lesson about the tool
   - Time wasted on wrong assumption = lesson about verification

2. **For each lesson, fill all fields:**
   - good: Specific solution + why it works (separate points with |)
   - bad: Specific failure + why it happened (separate points with |)
   - why: Root cause — the underlying reason, not the symptom
   - tech: Comma-separated technologies
   - verdict: mostly_succeeded | mostly_failed | mixed_with_pivots | inconclusive

3. **Do NOT save if:**
   - good is empty or "?"
   - bad is empty or "?"
   - why is empty, "?", or "не знаю"
   - It is just a chronology of events
   - There is no specific lesson for future sessions

## Auto-Activation

| Condition | Trigger | Priority |
|-----------|---------|----------|
| Session ending | "до завтра", "на этом пока", goodbye | [C] Must |
| Context filling | Agent warns about context limits | [C] Must |
| User asks | "запомни", "save experience", "сохранить опыт" | [C] Must |
| Autosave timer | Every 30 min | [W] Should |
| Major milestone | Bug fixed, feature done | [W] Should |
| Repeated errors | Same error 3+ times | [I] Suggest |

## How to Save

### Manual (agent extracts from conversation):

```bash
# Windows:
python C:\Users\stsgr\.zcode\tools\session_summary.py manual ^
  --title "Краткий описательный заголовок" ^
  --good "Что сработало + почему|Второе решение" ^
  --bad "Что НЕ сработало + почему|Вторая ошибка" ^
  --why "Корневая причина" ^
  --tech "python,nextjs,powershell" ^
  --verdict mostly_succeeded

# Linux:
python tools/session_summary.py manual \
  --title "Short title" \
  --good "What worked + why|Second point" \
  --bad "What failed + why|Second point" \
  --why "Root cause" \
  --tech "python,nextjs" \
  --verdict mostly_succeeded
```

### From Worklog:

```bash
python tools/session_summary.py from-worklog /path/to/worklog.md
```

## Verification Lifecycle

```
unverified -> verified     (confirmed by repeat or human)
unverified -> conflict     (contradicted by later experience)
```

```bash
python tools/session_summary.py verify EXP-005 --status verified
```

## Quick Reference

```
EXPERIENCE = lesson for future sessions, NOT chronology
MANDATORY: good + bad + why (all three!)
NO LESSON = NO ENTRY

GOOD: "Solution X works because Y"        = specific + reason
BAD:  "Doesn't work"                      = no lesson = log

GOOD: "Root cause: Z, not W"              = cause found
BAD:  "Don't know why"                    = no analysis = trash

Separator: | (pipe)
Verdicts: mostly_succeeded, mostly_failed, mixed_with_pivots, inconclusive
Store: ChromaDB 'experience' collection
Tool: python tools/session_summary.py manual --title "..." --good "..." --bad "..." --why "..." --tech "..."
```

## Communication

- `[EXPERIENCE] Saved: "Title" (2 good, 1 bad, unverified)`
- `[EXPERIENCE] Rejected: no lesson extracted (just a log)`
- `[EXPERIENCE] Should we save? You solved X after Y attempts`
- `[AUTOSAVE] 30 min elapsed. Scanning for lessons...`
