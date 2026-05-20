---
name: session-experience
version: 4.0
compatibility: both
description: "Extract and store session EXPERIENCE (not logs!) to ChromaDB. AI-powered extraction via GLM-4.5 — paste session text, get individual lessons. 1 lesson = 1 ChromaDB record for precise semantic search and independent verification. Dashboard UI for browse, search, verify, and AI-extract workflows. Experience = what worked + what failed + root cause. good/bad = WHAT happened. why = root cause (no duplication). All three mandatory. Max 1024 chars per field. [NO SAVE] override supported. Verified experience gets search score boost. Triggers: session end, autosave, explicit user request TO agent (not casual chat)."
id: ZAI-SESSION-003
author: STS
trigger: save experience, remember this, session end, запомни, сохранить опыт, what worked, what failed, lessons learned, autosave, experience not log, extract experience, ingest experience
license: MIT
---

# Session Experience v4.0

> ID: ZAI-SESSION-003
> Version: 4.0

This skill extracts lessons from sessions and stores them in ChromaDB. A LOG tells what happened. An EXPERIENCE tells what was learned and how to act differently next time.

**v4.0 highlights:** AI-powered extraction via GLM-4.5, one lesson per ChromaDB record, and full Memory Dashboard UI integration.

## Hot Commands

| Phrase | Action |
|--------|--------|
| save experience | Extract and store lessons from the current session to ChromaDB |
| запомни | Save experience (Russian: "remember this") |
| lessons learned | Review and store what worked, what failed, and why |
| remember this | Store a specific insight or lesson for future sessions |
| save experience [NO SAVE] | Acknowledge but skip saving per user override |
| verify experience | Confirm or mark a stored experience as verified or conflicted |
| extract experience | AI-analyze session text and extract individual lessons |
| ingest experience | Store extracted experience entries to ChromaDB |

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

## AI Extraction (v4.0)

GLM-4.5 can analyze session text and extract individual experience entries automatically. This replaces manual keyword-scanning with intelligent understanding of what constitutes a real lesson.

### How it works

1. **Input:** Paste raw session text (conversation, worklog, or notes)
2. **AI Processing:** GLM-4.5 analyzes the text, identifies actionable lessons, and structures each one with good/bad/why/tech/verdict fields
3. **Review:** Extracted entries are presented for human review before ingestion
4. **Ingest:** Approved entries are stored as individual ChromaDB records

### API endpoint

```
POST /api/memory/experience/extract
Content-Type: application/json

{ "content": "Full session text to analyze..." }
```

**Response:**

```json
{
  "entries": [
    {
      "title": "PowerShell -replace ломает CSS hex-opacity",
      "good": "Set-Content с полной заменой файла работает надёжно",
      "bad": "PowerShell -replace не матчит hex-коды с /",
      "why": "PS regex engine перекодирует файл при записи",
      "tech": "powershell,css,encoding",
      "verdict": "mostly_succeeded"
    }
  ]
}
```

### Dashboard UI flow (AI Extract tab)

1. Open Memory Dashboard → **AI Extract** tab
2. Paste session text into the input area
3. Click **Extract** — GLM-4.5 analyzes the text
4. Review each extracted lesson (edit or remove as needed)
5. Click **Ingest** to store approved entries to ChromaDB
6. Each entry becomes an independently searchable and verifiable record

## 1 Lesson = 1 Record (v4.0)

Each experience is now stored as an **individual ChromaDB entry**, not one giant session report. This is the single most important architectural change in v4.0.

### Why this matters

- **Better semantic search:** A focused entry about "PowerShell encoding on Windows" matches queries about encoding precisely. A 2000-character session report dilutes relevance.
- **Better verification:** Each lesson can be independently verified or marked as conflicted without affecting other lessons from the same session.
- **Better relevance scoring:** ChromaDB embeddings represent a single concept, not a mixture of unrelated topics.
- **Better deduplication:** Identical lessons from different sessions can be detected and merged.

### v3.0 vs v4.0 comparison

| Aspect | v3.0 (one giant report) | v4.0 (1 lesson = 1 record) |
|--------|-------------------------|----------------------------|
| Storage | One ChromaDB entry per session | One ChromaDB entry per lesson |
| Search | Matches session topic, not specific lesson | Matches the exact lesson |
| Verification | Entire session is verified or not | Each lesson verified independently |
| Relevance | Diluted across mixed topics | Focused on a single insight |
| Deduplication | Hard to detect overlapping sessions | Easy to detect duplicate lessons |
| Typical entry | 3-5 lessons in one record | 1 lesson per record |

### Each entry is independently:

- **Searchable** — semantic queries match the specific lesson, not the whole session
- **Verifiable** — mark one lesson as verified without affecting others from the same session
- **Removable** — delete an outdated lesson without losing the rest of the session
- **Scoreable** — verified entries get a 20% relevance boost independently

## API Endpoints (v4.0)

All endpoints are relative to the application base URL. Use `XTransformPort` query parameter for cross-service requests as needed.

### List entries

```
GET /api/memory/experience
```

Returns all experience entries (paginated).

**Response:**

```json
{
  "entries": [
    {
      "id": "EXP-005",
      "title": "PowerShell -replace ломает CSS hex-opacity",
      "good": "Set-Content с полной заменой файла работает надёжно",
      "bad": "PowerShell -replace не матчит hex-коды с /",
      "why": "PS regex engine перекодирует файл при записи",
      "tech": "powershell,css,encoding",
      "verdict": "mostly_succeeded",
      "status": "unverified"
    }
  ]
}
```

### Search entries

```
GET /api/memory/experience?action=query&q=encoding+windows
```

Performs semantic search across all experience entries.

**Parameters:**
- `action` — must be `query`
- `q` — search query (semantic, not keyword-only)

**Response:** Same format as list, sorted by relevance. Verified entries receive a 20% relevance boost.

### Store individual entry

```
POST /api/memory/experience
Content-Type: application/json

{
  "action": "store",
  "title": "PowerShell -replace ломает CSS hex-opacity",
  "good": "Set-Content с полной заменой файла работает надёжно",
  "bad": "PowerShell -replace не матчит hex-коды с /",
  "why": "PS regex engine перекодирует файл при записи",
  "tech": "powershell,css,encoding",
  "verdict": "mostly_succeeded"
}
```

Creates a single ChromaDB entry. One lesson = one record.

### Manual entry

```
POST /api/memory/experience
Content-Type: application/json

{
  "action": "manual",
  "title": "Краткий заголовок",
  "good": "Что сработало",
  "bad": "Что НЕ сработало",
  "why": "Причина"
}
```

Manual entry from Dashboard UI or CLI. Tech and verdict are optional (defaults: `general` and `inconclusive`).

### Verify entry

```
POST /api/memory/experience
Content-Type: application/json

{
  "action": "verify",
  "id": "EXP-005",
  "status": "verified"
}
```

Set verification status: `verified` or `conflict`.

### AI extraction

```
POST /api/memory/experience/extract
Content-Type: application/json

{
  "content": "Full session text to analyze..."
}
```

GLM-4.5 analyzes the text and returns structured experience entries. See [AI Extraction (v4.0)](#ai-extraction-v40) for details.

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

### Using AI extraction (recommended, v4.0):

```
POST /api/memory/experience/extract
{ "content": "Paste session text here..." }
```

AI extracts individual lessons. Review and ingest via Dashboard or API.

### Using Dashboard UI (v4.0):

1. Open Memory Dashboard
2. **Browse tab** — search, verify, or add manual entries
3. **AI Extract tab** — paste text → extract → review → ingest

### Using API (v4.0):

```
POST /api/memory/experience
{
  "action": "store",
  "title": "Краткий заголовок",
  "good": "Что сработало",
  "bad": "Что НЕ сработало",
  "why": "Причина",
  "tech": "python,nextjs",
  "verdict": "mostly_succeeded"
}
```

### Using alias (CLI, still supported):

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

### Via API (v4.0):

```
POST /api/memory/experience
{ "action": "verify", "id": "EXP-005", "status": "verified" }
```

### Via CLI (still supported):

```bash
python tools/session_summary.py verify EXP-005 --status verified
```

### Via Dashboard (v4.0):

Browse tab → select entry → click **Verify** or **Mark Conflict**

## Dashboard Integration (v4.0)

The Memory Dashboard provides a full UI for managing experience entries:

### Browse tab

- **Search:** Semantic search across all entries using ChromaDB embeddings
- **Verify:** Mark entries as verified or conflicted with one click
- **Manual entry:** Add a new experience directly from the UI without CLI or API

### AI Extract tab

1. Paste session text into the input area
2. Click **Extract** — sends to `/api/memory/experience/extract`
3. GLM-4.5 analyzes and returns structured lessons
4. Review each lesson: edit fields, remove irrelevant entries
5. Click **Ingest** — approved entries stored as individual ChromaDB records via `/api/memory/experience` with `action: "store"`

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
Store: ChromaDB 'experience' collection (1 lesson = 1 record)

v4.0 additions:
  AI Extraction: POST /api/memory/experience/extract { content }
  Dashboard: Browse (search/verify/manual) + AI Extract (paste → extract → ingest)
  1 Lesson = 1 Record: better search, better verification, better relevance
  API: GET/POST /api/memory/experience (list, query, store, manual, verify)

Alias: exp --title "..." --good "..." --bad "..." --why "..." --tech "..."
```

## Communication

- `[EXPERIENCE] Saved: "Title" (good/bad/why filled, unverified)`
- `[EXPERIENCE] Rejected: no lesson extracted (just a log)`
- `[EXPERIENCE] Skipped: user override [NO SAVE]`
- `[EXPERIENCE] Should we save? You solved X after Y attempts`
- `[AUTOSAVE] 30 min elapsed. Scanning for lessons...`
- `[EXPERIENCE] AI Extracted: 3 lessons from session text`
- `[EXPERIENCE] Ingested: "Title" → EXP-012 (1 lesson = 1 record)`
