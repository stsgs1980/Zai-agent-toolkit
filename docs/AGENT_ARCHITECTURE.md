# Agent Architecture: Z.ai Agent Toolkit

> Реестр, протоколы, конфигурация, связка с системой
> Версия: v1 (PROPOSED)

---

## 1. Общая архитектура

```mermaid
graph TB
    subgraph Orchestrator["ОРКЕСТРАТОР (main agent)"]
        O[Agent Core]
        OW[Worklog]
        OM[Memory: ChromaDB + Graph]
    end

    subgraph Registry["РЕЕСТР АГЕНТОВ"]
        FA[fullstack-dev]
        CR[code-reviewer]
        MK[memory-keeper]
        SA[sync-agent]
        QA[qa-agent]
    end

    subgraph Skills["НАВЫКИ (skills/)"]
        S5[phi-layout_sts]
        S6[zai-ui-composer_sts]
        S7[session-log]
        S8[memory-store]
        S9[prompt-engineering_sts]
    end

    subgraph System["СИСТЕМНЫЕ КОМПОНЕНТЫ"]
        CI[CI/CD: GitHub Actions]
        MEM[Memory: ChromaDB + folder_indexer + graph.json]
        SYNC[Sync: Windows <-> GitHub <-> Sandbox]
        DOCS[Standards + Instructions]
    end

    O -->|Task() call| FA
    O -->|Task() call| CR
    O -->|Task() call| MK
    O -->|Task() call| SA
    O -->|Task() call| QA

    FA --> S5
    FA --> S6
    MK --> S7
    MK --> S8
    CR --> S9

    FA --> OW
    CR --> OW
    MK --> OW
    QA --> OW

    MK --> MEM
    SA --> SYNC
    CI -->|validates| DOCS
    FA -->|follows| DOCS
    CR -->|follows| DOCS
```

---

## 2. Реестр агентов (Registry)

### 2.1 Формат AGENT.md

Каждый агент — директория в `agents/` с файлом `AGENT.md`:

```yaml
---
role: fullstack-dev
id: ZAI-AGT-001
version: 1.0
compatibility: sandbox
parent: orchestrator
skills:
  - frontend-styling-expert_sts
  - phi-layout_sts
  - database-schema-designer
handoff: worklog+artifacts
lifecycle: on-demand
trigger: feature, bugfix, refactor
---
```

### 2.2 Таблица агентов

| ID | Роль | parent | Skills | Триггер |
|----|------|--------|--------|---------|
| ZAI-AGT-001 | `fullstack-dev` | orchestrator | frontend-styling, phi-layout, database-schema, zai-ui-composer | feature, bugfix |
| ZAI-AGT-002 | `code-reviewer` | orchestrator | prompt-engineering_sts, mermaid-diagrams | review, refactor |
| ZAI-AGT-003 | `memory-keeper` | orchestrator | memory-store, memory-query, session-log, folder-indexer | session-end, periodic |
| ZAI-AGT-004 | `sync-agent` | orchestrator | sync-toolkit_sts | sync-toolkit, push, pull |
| ZAI-AGT-005 | `qa-agent` | orchestrator | qa-test-planner, performance-code-generator_sts | test, deploy |

### 2.3 Иерархия агентов

```mermaid
graph TB
    subgraph Master["ГЛАВНЫЙ"]
        ORC[Orchestrator\nZAI-AGT-000]
    end

    subgraph DevCycle["ЦИКЛ РАЗРАБОТКИ"]
        FD[fullstack-dev\nZAI-AGT-001]
        CR[code-reviewer\nZAI-AGT-002]
        QA[qa-agent\nZAI-AGT-005]
    end

    subgraph Infrastructure["ИНФРАСТРУКТУРА"]
        MK[memory-keeper\nZAI-AGT-003]
        SA[sync-agent\nZAI-AGT-004]
    end

    ORC -->|Task: feature| FD
    ORC -->|Task: review| CR
    ORC -->|Task: test| QA
    ORC -->|Task: index| MK
    ORC -->|Task: sync| SA

    FD -->|handoff| CR
    CR -->|handoff| QA
    QA -->|done| ORC

    MK -.->|logging| FD
    MK -.->|logging| CR
    MK -.->|logging| QA
```

---

## 3. Протоколы общения (Protocols)

### 3.1 Task() — вызов суб-агента

Уже есть в `templates/TASK_TEMPLATE.md`:

```javascript
Task({
  description: "Implement auth feature",
  prompt: `
Task ID: **AUTH-001**

## WORKLOG
1. Read /home/z/my-project/worklog.md
2. After work add entry (DO NOT overwrite!)

## CONTEXT
- Feature: JWT authentication
- Files: src/auth/*.ts, src/middleware.ts
- Depends on: DB schema task (DB-001)

## TASK
Implement login/logout/register endpoints
  `,
  subagent_type: "fullstack-developer"
});
```

### 3.2 Handoff — передача результатов

```mermaid
sequenceDiagram
    participant O as Orchestrator
    participant FD as fullstack-dev
    participant CR as code-reviewer
    participant MK as memory-keeper

    O->>FD: Task("Реализовать фичу X")
    activate FD
    FD-->>FD: Работает
    FD->>O: Done + result
    deactivate FD

    O->>CR: Task("Проверить фичу X")
    activate CR
    CR-->>CR: Review
    CR->>O: Issues found
    deactivate CR

    O->>FD: Task("Исправить issues")
    activate FD
    FD-->>FD: Fixes
    FD->>O: Done + updated
    deactivate FD

    par Параллельно
        MK-->>MK: Логирует сессию
        MK-->>MK: Индексирует новые файлы
    end
```

### 3.3 Протокол артефактов

Что передаётся между агентами:

```json
{
  "task_id": "AUTH-001",
  "status": "completed",
  "artifacts": {
    "files_created": ["src/auth/login.ts", "src/auth/register.ts"],
    "files_modified": ["src/middleware.ts"],
    "test_coverage": 85,
    "decisions": [
      "JWT with RS256, 15min access + 7d refresh",
      "bcrypt for password hashing"
    ],
    "worklog_entry": "---\nTask ID: AUTH-001\n..."
  },
  "handoff_to": "code-reviewer"
}
```

### 3.4 Протокол ошибок

```mermaid
flowchart LR
    A[Agent fails] --> B{Error type?}
    B -->|Retryable| C[Retry 3x]
    B -->|Fatal| D[Report to orchestrator]
    B -->|Timeout| E[Kill + restart]

    C -->|success| F[Continue]
    C -->|all failed| D

    D --> G{Can proceed?}
    G -->|yes| H[Skip + log]
    G -->|no| I[Abort task chain]

    E --> J[Fresh start]
    J -->|success| F
    J -->|fail again| D
```

---

## 4. Конфигурация (Configuration)

### 4.1 opencode.json

```json
{
  "$schema": "https://opencode.ai/config.json",
  "skills": {
    "paths": ["skills"]
  },
  "agents": {
    "paths": ["agents"],
    "default": "orchestrator",
    "lifecycle": {
      "max_idle_minutes": 30,
      "max_retries": 3,
      "timeout_seconds": 300
    }
  },
  "memory": {
    "chromadb_path": "~/.zcode/memory/chromadb",
    "graph_path": "~/.zcode/memory/graph.json",
    "auto_index": true
  }
}
```

### 4.2 Структура agents/

```text
agents/
  AGENTS.md                  <- Реестр (этот документ)
  orchestrator/
    AGENT.md                 <- Инструкция оркестратора
  fullstack-dev/
    AGENT.md
    rules/
      react-patterns.md      <- Доп. правила для этого агента
  code-reviewer/
    AGENT.md
  memory-keeper/
    AGENT.md
  sync-agent/
    AGENT.md
  qa-agent/
    AGENT.md
```

### 4.3 Пример AGENT.md (fullstack-dev)

```markdown
---
role: fullstack-dev
id: ZAI-AGT-001
version: 1.0
compatibility: sandbox
parent: orchestrator
skills:
  - frontend-styling-expert_sts
  - phi-layout_sts
  - database-schema-designer
  - zai-ui-composer_sts
  - mermaid-diagrams
handoff: worklog+artifacts
lifecycle: on-demand
trigger: feature, bugfix, refactor
---

# Agent: Fullstack Developer v1.0

> ID: ZAI-AGT-001
> Skills: frontend-styling, phi-layout, database-schema, zai-ui-composer, mermaid
> Handoff: worklog.md + artifacts.json

...

## Workflow

1. Read worklog.md for context
2. Implement according to standards/
3. After work: update worklog.md, return artifacts
```

---

## 5. Связка с системой (Integration)

### 5.1 CI/CD

```mermaid
flowchart TB
    subgraph GitHub["GITHUB ACTIONS"]
        PUSH[git push to _v]
        CI[ci.yml: validate]
        DEPLOY[deploy: update submodules?]
    end

    subgraph Agents["АГЕНТЫ"]
        SA[sync-agent]
        MK[memory-keeper]
    end

    subgraph Windows["WINDOWS"]
        SYNC[sync-toolkit.ps1]
        ZC[ZCode Desktop]
    end

    PUSH --> CI
    CI -->|pass| DEPLOY
    DEPLOY -->|webhook| SA
    SA -->|trigger| SYNC
    SYNC --> ZC
    ZC -->|loads| MK
    MK -->|index| Memory
```

### 5.2 Память + агенты

```mermaid
flowchart LR
    subgraph AgentsLayer["АГЕНТЫ"]
        FD[fullstack-dev]
        CR[code-reviewer]
        QA[qa-agent]
    end

    subgraph MemoryLayer["ПАМЯТЬ"]
        CHROM[ChromaDB\nсемантический поиск]
        GRAPH[graph.json\nсвязи между нодами]
        INDEX[folder_indexer\nмета-индекс файлов]
    end

    subgraph Storage["ХРАНИЛИЩЕ"]
        FILES[Файловая система\n10-20K файлов]
    end

    FD -->|read/write| FILES
    FD -->|search| CHROM
    FD -->|navigate| GRAPH

    CR -->|search| CHROM
    CR -->|find related| GRAPH

    QA -->|search examples| CHROM

    INDEX -->|scan| FILES
    INDEX -->|update| CHROM
    INDEX -->|rebuild| GRAPH
```

### 5.3 Жизненный цикл сессии

```mermaid
flowchart TB
    START[Новая сессия] --> ONBOARD[onboarding-protocol]
    ONBOARD --> CHECK[Check git state + worklog]
    CHECK --> RESUME{session-log exists?}

    RESUME -->|yes| LOAD[Load context from memory]
    RESUME -->|no| FRESH[Fresh start]

    LOAD --> PLAN[Write plan in worklog]
    FRESH --> PLAN

    PLAN --> EXECUTE{Task size?}
    EXECUTE -->|1-3 steps| DO[Do it directly]
    EXECUTE -->|4-10 steps| SUBAGENT[Call sub-agent]
    EXECUTE -->|10+ steps| CHAIN[Chain multiple agents]

    DO --> LOG[session-log snapshot]
    SUBAGENT --> LOG
    CHAIN --> LOG

    LOG --> END{More tasks?}
    END -->|yes| PLAN
    END -->|no| HANDOFF[session-handoff]
```

### 5.4 Матрица агент → навык → стандарт

| Агент | Использует навыки | Подчиняется стандартам |
|-------|------------------|----------------------|
| `fullstack-dev` | frontend-styling, phi-layout, database-schema, zai-ui-composer, mermaid | FRONTEND_STANDARD, MARKDOWN_STANDARD, GITHUB_STANDARD, TESTING_STANDARD |
| `code-reviewer` | prompt-engineering_sts, mermaid-diagrams | FRONTEND_STANDARD, ERROR_HANDLING, SECURITY_STANDARD |
| `memory-keeper` | memory-store, memory-query, session-log, folder-indexer | REPRODUCIBILITY, ZAI_INTEGRATION |
| `sync-agent` | sync-toolkit_sts | GITHUB_STANDARD |
| `qa-agent` | qa-test-planner, performance-code-generator_sts | TESTING_STANDARD, ERROR_HANDLING |

---

## 6. Что нужно сделать для реализации

| # | Задача | Зависит от |
|---|--------|-----------|
| 1 | Создать `agents/` директорию + AGENTS.md | — |
| 2 | Написать AGENT.md для каждого агента (5 шт) | п.1 |
| 3 | Обновить `opencode.json` — добавить `agents.paths` | п.1 |
| 4 | Обновить `templates/TASK_TEMPLATE.md` — добавить chain-шаблоны | — |
| 5 | Доработать `AGENT_RULES.md` — добавить Section про sub-agents | — |
| 6 | Протокол артефактов: создать `templates/ARTIFACTS_TEMPLATE.md` | — |
| 7 | Интегрировать с памятью: агенты пишут в ChromaDB + graph.json | Memory System |
| 8 | CI: добавить валидацию `agents/AGENT.md` frontmatter | CI/CD |
| 9 | Документация в `standards/AGENT_STANDARD.md` | все пункты |

---

## 7. Замечания и размышления (Issues & Proposals)

### 7.1 Нет рантайма для автономных агентов

**Проблема:** Task() — это разовый вызов, а не цикл агента.
Для автономности нужен event loop: `while (tasks_pending) { work(); checkpoint(); sleep(5min) }`.

**Предложение:** Не делать сейчас. Для toolkit'а достаточно on-demand вызовов
через Task(). Полноценный agent runtime — это уровень платформы (ZCode Desktop),
а не toolkit'а.

### 7.2 Нет изоляции между агентами

**Проблема:** Все агенты работают в одной filesystem. Code-reviewer может
перезаписать файлы fullstack-dev'а. Нет прав, нет профилей.

**Предложение:** Изоляция через git-ветки. Каждый агент работает в своей feature-ветке.
Orchestrator сливает через PR. Это уже покрыто GITHUB_STANDARD'ом.
Отдельный sandbox для каждого агента — избыточно для текущих задач.

### 7.3 AGENT.md дублирует SKILL.md

**Проблема:** По сути AGENT.md = SKILL.md + поле `parent` + `handoff`.
Можно было не плодить `agents/`, а добавить флаг `type: agent` в SKILL.md.

**Предложение:** Пока оставить как есть (agents/ + AGENT.md).
В будущем, если формат устаканится — добавить `type: [skill|agent]` в YAML
и объединить. Миграция тривиальна: прочитать AGENT.md как SKILL.md.

### 7.4 5 агентов — многовато для старта

**Проблема:** Из 5 агентов реально нужны 2-3:
- `fullstack-dev` — пишет код
- `code-reviewer` — проверяет (можно совместить с QA)
- `memory-keeper` — индексирует, логирует

`sync-agent` — это скрипт, не агент.
`qa-agent` — можно объединить с code-reviewer.

**Предложение:** Начать с 3:
- ZAI-AGT-001 `fullstack-dev` — разработка
- ZAI-AGT-002 `code-reviewer+qa` — ревью + тесты
- ZAI-AGT-003 `memory-keeper` — индексация + логи

Остальное — когда будет реальная потребность (YAGNI).

### 7.5 Sequence diagram показывает только успешный сценарий

**Проблема:** В разделе 3.2 Handoff нарисован happy path.
Нет отката: что если fullstack-dev вернул ошибку? Code-reviewer упал с NPE?
Кто компенсирует?

**Предложение:** Добавить протокол отката:

```text
Agent fail → Orchestrator: 3 retries → escalate to user
Chain fail → Rollback: git reset --hard HEAD~1
Memory fail → Skip, log warning, continue
```

Это не в mermaid, а в plain-text протокол. Mermaid для error flow уже есть (3.4).

### 7.6 Нет PNG и PlantUML в docs/diagrams/

**Проблема:** Все существующие схемы в `docs/diagrams/` имеют PNG + PlantUML source.
В AGENT_ARCHITECTURE.md — только mermaid-блоки. При офлайн-чтении не видны.

**Предложение:** После утверждения схем — экспортировать PNG в `docs/diagrams/`
(номера 08-13) и/или продублировать в PlantUML.

### 7.7 YAML frontmatter в блоке кода, а не настоящий

**Проблема:** В разделе 2.1 YAML показан внутри ` ```yaml ` code block.
Настоящий frontmatter должен быть в начале AGENT.md как `---\nkey: value\n---`.

**Предложение:** В AGENT.md файлах — настоящий frontmatter.
В документации — показывать в code block (как сейчас), но с пометкой,
что в реальном файле это frontmatter.

### 7.8 Протокол артефактов — JSON без схемы

**Проблема:** В разделе 3.3 показан пример JSON, но нет JSON Schema
для валидации. При реальной передаче между агентами поля могут разъехаться.

**Предложение:** Создать `templates/artifact-schema.json` с JSON Schema.
В `templates/ARTIFACTS_TEMPLATE.md` — описание полей и примеры.

### 7.9 Матрица навыков не проверена

**Проблема:** В разделе 5.4 указано, что `fullstack-dev` использует
`database-schema-designer`. Но этот скилл — про БД, не про фронтенд.
Возможно, агент не должен иметь доступа ко всем перечисленным навыкам сразу.

**Предложение:** Пересмотреть матрицу при создании реальных AGENT.md.
Навыки назначать по принципу минимальной необходимости (PoLA).

---

## 8. Резюме

| Аспект | Оценка | Статус |
|--------|--------|--------|
| Реестр и ID | 8/10 | Хорошо, можно стартовать |
| Протоколы (Task, handoff, artifacts) | 7/10 | Есть, но без схемы |
| Sequence diagram | 5/10 | Только happy path |
| Изоляция | 4/10 | Завязано на git, не на песочницу |
| Рантайм | 3/10 | Нет event loop'a |
| PNG/PlantUML | 2/10 | Нет экспорта |
| YAML как должен быть | 6/10 | Понятно, но не настоящий |

**Итого:** документ готов для обсуждения, но не для реализации.
Перед созданием `agents/` нужно решить вопросы 7.3 (дубль SKILL.md),
7.4 (количество агентов), 7.8 (схема артефактов).

---

*Dokument sozdan: 2026-05-18*

---

Built with: Python + PowerShell + Markdown
