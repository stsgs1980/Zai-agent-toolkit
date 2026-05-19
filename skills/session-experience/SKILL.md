---
name: session-experience
version: 3.0
compatibility: both
description: "Extract and store session EXPERIENCE (not logs!) to ChromaDB. Experience = what worked + what failed + root cause. good/bad = WHAT happened. why = root cause (no duplication). All three mandatory. Max 1024 chars per field. [NO SAVE] override supported. Verified experience gets search score boost. Triggers: session end, autosave, explicit user request TO agent (not casual chat)."
id: ZAI-SESSION-003
author: STS
trigger: save experience, remember this, session end, запомни, сохранить опыт, what worked, what failed, lessons learned, autosave, experience not log
license: MIT
---

# Session Experience v3.0

> ID: ZAI-SESSION-003
> Version: 3.0

This skill extracts lessons from sessions and stores them in ChromaDB. A LOG tells what happened. An EXPERIENCE tells what was learned and how to act differently next time.

## The Most Important Rule

**No lesson = no entry.** If you cannot fill all three fields (good, bad, why) with specific actionable content, do not save. A vague entry is worse than no entry because it pollutes search results.

## LOG vs EXPERIENCE

A LOG describes events. An EXPERIENCE extracts lessons.

```
LOG:  "Python падал на кириллице"                  = описание проблемы
EXP:  "PYTHONIOENCODING=utf-8 fixes it on Windows"  = извлечённый урок

LOG:  "Replace команда не сработала 3 раза"          = хронология
EXP:  "PS -replace ломает hex с /, нужен Set-Content" = причина+решение

LOG:  "Потратили 2 часа на дебаг"                    = факт о времени
EXP:  "Проверять encoding ПЕРВЫМ делом на Windows"   = правило на будущее
```

## Mandatory Fields (v3.0 — no duplication)

good/bad = **WHAT** happened (facts only). why = **WHY** it happened (root cause). Do NOT put WHY inside good/bad — it belongs in why only.

| Field | Required | Contains | Max length | Good example | Bad example |
|-------|----------|----------|------------|--------------|-------------|
| **good** | YES | WHAT worked (facts only) | 1024 chars | `Set-Content с полной заменой файла работает надёжно` | `PYTHONIOENCODING=utf-8 fixes encoding because Windows defaults to CP1251` |
| **bad** | YES | WHAT failed (facts only) | 1024 chars | `PowerShell -replace не матчит hex-коды с / (#0ea5e915, /10, /30)` | `Не сработало because of regex` |
| **why** | YES | Root cause ONLY (no symptoms!) | 1024 chars | `PS regex engine + Set-Content перекодируют файл ломая Unicode; Windows defaults to CP1251` | `Хз` |

**Rule: good/bad say WHAT. why says WHY. No duplication.**

If why is just a restatement of bad — dig deeper. Ask "why did THAT happen?" until you hit the root cause.

**Reject the entry if any field is empty, contains "?", "не знаю", or just restates the problem without insight.**

## Field Length Limit

Maximum **1024 characters per field**. If a field exceeds this, split into multiple experience entries with different aspects. This ensures ChromaDB embeddings stay within token limits (~512-2048 tokens).

## [NO SAVE] Override

If the user explicitly says not to save:

```
User: "не сохраняй, это была разовая костыльная правка"
Agent: [EXPERIENCE] Skipped as requested (user override)
```

Do not save. Do not ask again. Respect the override.

## Verdict Examples (all four types)

### mostly_succeeded (approach worked with minor issues)
```
Title: PowerShell -replace ломает CSS hex-opacity
Good: Set-Content с полной заменой файла работает надёжно
Bad: PowerShell -replace не матчит hex-коды с / (#0ea5e915, /10, /30)
Why: PS regex engine перекодирует файл при записи
Tech: powershell,css,encoding
Verdict: mostly_succeeded
```

### mostly_failed (approach failed, need different strategy)
```
Title: PowerShell -replace для batch-правок CSS
Good: Простой -replace работает для простых строк
Bad: -replace ломает Unicode и не матчит hex-opacity|Потребовалось 5+ итераций
Why: PS regex + Set-Content меняют кодировку; hex с / не экранируется
Tech: powershell,css,regex
Verdict: mostly_failed
```

### mixed_with_pivots (failed first, pivoted to new approach, partial success)
```
Title: Glassmorphism removal — 3 подхода
Good: Set-Content полная замена файла (3-й подход) сработал
Bad: -replace не матчил hex-opacity (1-й подход)|batch foreach пропустил файлы (2-й подход)
Why: Каждый подход имел слепые зоны; полная замена единственный надёжный метод
Tech: powershell,css,nextjs
Verdict: mixed_with_pivots
```

### inconclusive (not enough data to judge)
```
Title: API cache — первый тест
Good: Повторный запрос <5мс
Bad: Первый запрос 4+ секунды
Why: Python cold start; нужен тест после перезапуска сервера
Tech: nextjs,python,chromadb
Verdict: inconclusive
```

## REJECT these (not lessons, just logs):

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
```

## Extraction Rules

When scanning a conversation for experience:

1. **Look for patterns worth saving:**
   - Same error 3+ times = lesson about wrong approach
   - Breakthrough after long deadlock = lesson about what worked
   - Non-obvious tool behavior = lesson about the tool
   - Time wasted on wrong assumption = lesson about verification

2. **For each lesson, fill all fields:**
   - good: WHAT worked (facts, no "because")
   - bad: WHAT failed (facts, no "because")
   - why: Root cause — the underlying reason, not the symptom
   - tech: Comma-separated technologies
   - verdict: mostly_succeeded | mostly_failed | mixed_with_pivots | inconclusive

3. **Do NOT save if:**
   - good is empty or "?"
   - bad is empty or "?"
   - why is empty, "?", or "не знаю"
   - It is just a chronology of events
   - There is no specific lesson for future sessions
   - User said [NO SAVE]

## Auto-Activation (v3.0 — context-aware)

Triggers only when user is addressing the agent, not casual chat:

| Condition | Trigger | Priority |
|-----------|---------|----------|
| Session ending | "до завтра, агент", "на этом пока, запомни" | [C] Must |
| Context filling | Agent warns about context limits | [C] Must |
| User asks agent | "запомни", "save experience", "сохранить опыт" | [C] Must |
| Autosave timer | Every 30 min | [W] Should |
| Major milestone | Bug fixed, feature done | [W] Should |
| Repeated errors | Same error 3+ times | [I] Suggest |

**False positive prevention:** "до завтра" in casual chat (not to agent) does NOT trigger. Only triggers when user is clearly wrapping up a work session with the agent.

## How to Save

### Using alias (recommended):

```bash
# Add to PowerShell profile:
function exp { python $env:USERPROFILE\.zcode\Zai-agent-toolkit\tools\session_summary.py manual @args }

# Then use short command:
exp --title "Краткий заголовок" --good "Что сработало" --bad "Что НЕ сработало" --why "Причина" --tech "python,nextjs" --verdict mostly_succeeded
```

### Full command (no alias):

```bash
# Windows:
python $env:USERPROFILE\.zcode\Zai-agent-toolkit\tools\session_summary.py manual --title "Заголовок" --good "Что сработало" --bad "Что НЕ сработало" --why "Причина" --tech "python,nextjs" --verdict mostly_succeeded

# Linux:
python tools/session_summary.py manual --title "Title" --good "What worked" --bad "What failed" --why "Root cause" --tech "python,nextjs" --verdict mostly_succeeded
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

**Score boost:** When searching experience, verified entries receive a 20% relevance boost over unverified. This incentivizes verification and ensures confirmed lessons surface first.

```bash
python tools/session_summary.py verify EXP-005 --status verified
```

## Quick Reference

```
EXPERIENCE = lesson for future sessions, NOT chronology
MANDATORY: good + bad + why (all three!)
NO LESSON = NO ENTRY
MAX 1024 chars per field — split if longer
good/bad = WHAT | why = WHY (no duplication)
[NO SAVE] = user override, respect it
Verified = 20% search boost

Verdicts: mostly_succeeded, mostly_failed, mixed_with_pivots, inconclusive
Store: ChromaDB 'experience' collection
Alias: exp --title "..." --good "..." --bad "..." --why "..." --tech "..."
```

## Communication

- `[EXPERIENCE] Saved: "Title" (2 good, 1 bad, unverified)`
- `[EXPERIENCE] Rejected: no lesson extracted (just a log)`
- `[EXPERIENCE] Skipped: user override [NO SAVE]`
- `[EXPERIENCE] Should we save? You solved X after Y attempts`
- `[AUTOSAVE] 30 min elapsed. Scanning for lessons...`
