<p align="center">
  <img src="assets/logo-banner.png" alt="Agent Toolkit" width="800">
</p>

# Agent Toolkit

[![Version: 1.8.2](https://img.shields.io/badge/Version-1.8.2-blue.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status: Pre-release](https://img.shields.io/badge/Status-Pre--release-orange.svg)]()

**Стандарты + Скиллы + Правила** для AI-разработки

> Версия toolkit: **v1.8.2** | Язык: **Русский**

---

## Что это такое

Agent Toolkit -- автономный набор управленческих документов, операционных шаблонов и поведенческих инструкций, обеспечивающих согласованную, чистую и воспроизводимую работу AI-агентов в проектах.

Решает три проблемы:

1. **Несогласованность** -- разные агенты форматируют код и документацию по-разному
2. **Unicode-загрязнение** -- эмодзи и Unicode-символы попадают в исходный код и документацию
3. **Воспроизводимость** -- проекты ломаются при клонировании из-за хардкод путей и отсутствующих env-переменных

---

## Быстрый старт

### Вариант A: Полный toolkit (рекомендуется)

```bash
# Клонировать toolkit
git clone https://github.com/stsgs1980/agent-toolkit.git

# Скопировать русские стандарты и шаблоны в проект
cp -r agent-toolkit/standards/*_RU_*.md your-project/standards/
cp -r agent-toolkit/templates/          your-project/templates/
cp -r agent-toolkit/instructions/       your-project/instructions/
cp agent-toolkit/AGENT_RULES.md         your-project/
cp agent-toolkit/PROJECT_CONFIG.md      your-project/

# Отредактировать PROJECT_CONFIG.md под стек
```

### Вариант B: Только стандарты

```bash
git clone https://github.com/stsgs1980/agent-toolkit.git
cp agent-toolkit/standards/*_RU_*.md your-project/standards/
```

### Вариант C: Один документ

Скачать нужный стандарт из директории `standards/`.

---

## Порядок внедрения

**Не применяйте стандарты в случайном порядке.** Существует обязательная 6-шаговая последовательность.

Каждый шаг строится на предыдущем. Нарушение порядка ведёт к переделкам.

```text
Шаг 1: Принять стандарты (Группа B)     Прочитать, понять, определить стек
         |
         v
Шаг 2: Развернуть Worklog (Группа A)   Скопировать шаблоны, проверить по B
         |
         v
Шаг 3: REPRODUCIBILITY                  Настроить env, БД, пути
         |                              Записать в WORKLOG
         v
Шаг 4: Unicode Policy [C]            ESLint-правило + очистка UI-кода
         |                              Записать в WORKLOG
         v
Шаг 5: MARKDOWN_STANDARD [W]            Очистка .md файлов (включая Группу A)
         |                              Записать в WORKLOG
         v
Шаг 6: README_TEMPLATE                  Собрать README по шаблону
                                        Записать в WORKLOG
```

Подробности: см. `standards/IMPLEMENTATION_ORDER_RU_v2.1.md`

---

## Структура репозитория

```text
agent-toolkit/
  AGENT_RULES.md              Поведенческие правила для AI-агентов
  PROJECT_CONFIG.md           Настройки проекта (стек, сервер, пути)
  README_EN.md                Английская версия
  README_RU.md                Этот файл (русская версия)

  assets/                     Визуальные ресурсы
    logo.png                  Основной логотип (1024x1024)
    logo-banner.png           Баннер для README (1344x768)
    favicon.png               Иконка браузера (64x64)

  standards/                  Группа B: Управленческие документы (применять первыми)
    MARKDOWN_STANDARD_RU_v2.1.md    Форматирование Markdown v2.1.5
    UNICODE_POLICY_RU_v2.1.md       Запрет Unicode/эмодзи v2.1.3
    README_TEMPLATE_RU_v2.1.md      Обязательная структура README v2.1
    REPRODUCIBILITY_STANDARD_RU_v1.0.md Clone + install + dev = работает
    IMPLEMENTATION_ORDER_RU_v2.1.md Порядок внедрения v2.1
    STANDARD_ID_SYSTEM_RU_v1.0.md   Реестр ID стандартов v1.0
    CODE_EXAMPLES_GUIDE_RU_v1.0.md  Форматирование примеров кода v1.0
    FRONTEND_STANDARD_RU_v1.3.md    Frontend-разработка v1.3
    GITHUB_STANDARD_RU_v1.1.md      Операции Git/GitHub v1.1
    WCAG_STANDARD_RU_v1.0.md        Доступность WCAG 2.1 AA v1.0
    TESTING_STANDARD_RU_v1.0.md     Unit, интеграционные, E2E тесты v1.0
    ERROR_HANDLING_STANDARD_RU_v1.0.md Обработка ошибок v1.0
    SECURITY_STANDARD_RU_v1.0.md    Безопасность, OWASP v1.0

  templates/                  Группа A: Операционные шаблоны (разворачивать после B)
    WORKLOG.md                Журнал работы агента v2.1.1
    TASK_TEMPLATE.md          Шаблоны промптов для суб-агентов v2.1.1
    README_WORKLOG.md         Руководство по системе Worklog v2.1.1

  instructions/               Подробные поведенческие инструкции
    onboarding-protocol.md    Что делать при входе в проект
    git-workflow-rules.md     Безопасные git-операции в sandbox
    language-rule.md          Всегда соответствовать языку пользователя
    diagnostic-disclosure.md  Не утверждать о потере данных без проверки
    writing-plans.md          Планировать перед кодом

  skills/                     Автоматизированные скиллы агента
    git-safe-ops/             Безопасные push/pull/rebase
    git-checkpoint/           Систематические чекпоинты во время работы
    sanitize-validate/        Санитизация ввода, валидация, безопасность
    dev-watchdog/             Управление dev-сервером
    health-check/             Диагностика состояния системы
    fallback/                 Graceful degradation
    api-retry/                Повтор API-запросов с backoff
    anti-monolith/            Enforcement архитектуры React/Next.js
```

---

## Классификация документов

### Группа B -- Управленческие (стандарты)

Определяют правила. Читаются и принимаются, не изменяются под проект.

| ID | Документ | Версия | Уровень | Область |
|----|----------|--------|---------|---------|
| STD-DOC-001 | `MARKDOWN_STANDARD_RU_v2.1.md` | v2.1.5 | [W] | README, документация проекта |
| STD-DOC-003 | `UNICODE_POLICY_RU_v2.1.md` | v2.1.3 | [C]+[W]+[I] | UI-код [C], AI-чат + доки [W], прототипы [I] |
| STD-DOC-004 | `README_TEMPLATE_RU_v2.1.md` | v2.1 | [W] | Обязательная структура README |
| STD-DOC-005 | `CODE_EXAMPLES_GUIDE_RU_v1.0.md` | v1.0 | [W] | Примеры кода в документации |
| STD-ENV-001 | `REPRODUCIBILITY_STANDARD_RU_v1.0.md` | v1.0 | [C] | Окружение, пути, БД |
| STD-ARCH-001 | `IMPLEMENTATION_ORDER_RU_v2.1.md` | v2.1 | [W] | 6-шаговая последовательность внедрения |
| STD-META-001 | `STANDARD_ID_SYSTEM_RU_v1.0.md` | v1.0 | [W] | Реестр ID стандартов и правила |
| STD-FE-001 | `FRONTEND_STANDARD_RU_v1.3.md` | v1.3 | [C] | Frontend-разработка на React/Next.js |
| STD-GIT-001 | `GITHUB_STANDARD_RU_v1.1.md` | v1.1 | [C] | Git-операции, формат коммитов, ветвление |
| STD-A11Y-001 | `WCAG_STANDARD_RU_v1.0.md` | v1.0 | [C] | Соответствие доступности UI |
| STD-TEST-001 | `TESTING_STANDARD_RU_v1.0.md` | v1.0 | [C] | Unit, интеграционные, E2E тесты |
| STD-ERR-001 | `ERROR_HANDLING_STANDARD_RU_v1.0.md` | v1.0 | [C] | Обработка ошибок, логирование, восстановление |
| STD-SEC-001 | `SECURITY_STANDARD_RU_v1.0.md` | v1.0 | [C] | Аутентификация, секреты, OWASP |

### Группа A -- Операционные (шаблоны)

Разворачиваются в проект. ПОДЧИНЯЮТСЯ стандартам Группы B.

| Документ | Версия | Назначение |
|----------|--------|------------|
| `WORKLOG.md` | v2.1.1 | Журнал работы агента (живой файл) |
| `TASK_TEMPLATE.md` | v2.1.1 | Шаблоны промптов для суб-агентов |
| `README_WORKLOG.md` | v2.1.1 | Руководство по системе Worklog |

### Инфраструктура

| Документ | Назначение |
|----------|------------|
| `AGENT_RULES.md` | Поведенческие правила (универсальные) |
| `PROJECT_CONFIG.md` | Настройки проекта (на каждый проект) |
| `instructions/*.md` | Подробные поведенческие инструкции |

---

## Краткое описание ключевых правил

### Unicode Policy

- Без эмодзи и Unicode-графики в исходном коде, UI-тексте или ответах AI-чата
- Исключение `(ref)`: идентификационные символы в таблицах и блоках кода
- Типографские символы (тире, копирайт, градус) разрешены в plain text
- Сообщения пользователя в чате НЕ регулируются
- Уровни: [C] для кода/UI, [W] для AI-чата и документации

### MARKDOWN_STANDARD

- ASCII + кириллица + типографские символы в тексте
- Без Unicode в заголовках, коде или таблицах (кроме `(ref)`)
- 4 обратных кавычки для вложенных блоков кода
- Языковые теги обязательны для всех блоков кода
- Тире `-` для неупорядоченных списков (не `*` или `+`)
- Сигнатура стека: `Built with: <технологии проекта>`

### REPRODUCIBILITY

- `.env.example` обязателен со всеми переменными
- Только относительные пути (без `/home/`, `http://localhost:`)
- `connection_limit=1` для SQLite
- `clone + install + dev = работает`

---

## Версионирование toolkit

| Компонент | ID | Версия |
|-----------|----|--------|
| **Toolkit** | -- | **v1.8.2** |
| MARKDOWN_STANDARD | STD-DOC-001 | v2.1.5 |
| UNICODE_POLICY | STD-DOC-003 | v2.1.3 |
| README_TEMPLATE | STD-DOC-004 | v2.1 |
| CODE_EXAMPLES_GUIDE | STD-DOC-005 | v1.0 |
| REPRODUCIBILITY_STANDARD | STD-ENV-001 | v1.0 |
| IMPLEMENTATION_ORDER | STD-ARCH-001 | v2.1 |
| STANDARD_ID_SYSTEM | STD-META-001 | v1.0 |
| FRONTEND_STANDARD | STD-FE-001 | v1.3 |
| GITHUB_STANDARD | STD-GIT-001 | v1.1 |
| WCAG_STANDARD | STD-A11Y-001 | v1.0 |
| TESTING_STANDARD | STD-TEST-001 | v1.0 |
| ERROR_HANDLING_STANDARD | STD-ERR-001 | v1.0 |
| SECURITY_STANDARD | STD-SEC-001 | v1.0 |
| WORKLOG / TASK_TEMPLATE / README_WORKLOG | -- | v2.1.1 |

При обновлении отдельных стандартов обновите версию toolkit в `AGENT_RULES.md` и `README_RU.md`.

---

## Конфигурация

После копирования toolkit в проект отредактируйте **`PROJECT_CONFIG.md`**:

1. Установите сигнатуру стека (например, `Built with: React + Python + PostgreSQL`)
2. Установите команду dev-сервера и порт
3. Установите пути проекта

`AGENT_RULES.md` ссылается на `PROJECT_CONFIG.md` для всех зависимых от проекта настроек, поэтому сами правила агента изменять не нужно.

---

## Чеклист готовности

Что вы получаете после импорта toolkit и что требует ручной настройки.

### Работает из коробки

Когда `AGENT_RULES.md` подключён как инструкции агента / системный промпт:

- **Поведенческие правила** -- работа с файлами, форматирование, No-Unicode, воспроизводимость -- всё определено
- **Ссылки на стандарты** -- агент знает о MARKDOWN_STANDARD, No-Unicode Policy, REPRODUCIBILITY и где их найти
- **Протокол онбординга** -- агент читает нужные файлы при старте сессии
- **Классификация документов** -- иерархия Группа A / Группа B понятна
- **Безопасность git** -- бэкап перед переписыванием, force-push вместо rebase, лестница панической диагностики

### Требует однократной настройки на проект

| Действие | Время | Детали |
|----------|-------|--------|
| Отредактировать `PROJECT_CONFIG.md` | 2-3 мин | Сигнатура стека, команда dev-сервера, пути проекта |
| Скопировать `WORKLOG.md` в корень проекта | 10 сек | `cp templates/WORKLOG.md your-project/worklog.md` |
| Скопировать `TASK_TEMPLATE.md` в корень проекта | 10 сек | `cp templates/TASK_TEMPLATE.md your-project/` |

### Известные ограничения

| Проблема | Влияние | Приоритет |
|----------|---------|-----------|
| `setup.sh` ещё не протестирован с текущей структурой файлов | Шаблоны копируются вручную | Средний |

---

## Лицензия

Этот toolkit предоставляется as-is для использования в workflow AI-разработки.

---

## Changelog

| Версия | Изменения |
|--------|-----------|
| **v1.8.2** | Разделение README на EN/RU версии; удалены эмодзи из всех стандартов |
| **v1.8.1** | Полная русская локализация: все 13 стандартов теперь имеют EN/RU версии (26 файлов); полный паритет между языками |
| **v1.8.1** | Унификация именования: все файлы переименованы в формат NAME_STANDARD_XX_vX.X.md; все ссылки обновлены |
| **v1.7.0** | Полная английская локализация: IMPLEMENTATION_ORDER_EN, STANDARD_ID_SYSTEM_EN, CODE_EXAMPLES_GUIDE_EN; обновлены все реестры |
| **v1.6.0** | Добавлены 3 критических стандарта: TESTING_STANDARD, ERROR_HANDLING_STANDARD, SECURITY_STANDARD |
| **v1.5.3** | Добавлен скилл sanitize-validate для безопасности ввода (XSS, SQL injection, CSRF, валидация, санитизация) |
| **v1.5.2** | GITHUB_STANDARD v1.1: Checkpoint System (WIP, Recovery Tags); скилл git-checkpoint для систематического версионирования |
| **v1.5.1** | MARKDOWN_STANDARD v2.1.5: добавлена секция Badges с правилами shields.io; синхронизация версий в документах |
| **v1.5.0** | Добавлены 4 новых стандарта (Code Examples, Frontend, GitHub, WCAG), Standard ID System, скилл anti-monolith |
| **v1.4.2** | Повторно добавлены assets (logo, banner, favicon) как реальные PNG; баннер в заголовке README |
| **v1.4.1** | Добавлена секция Readiness Checklist в README |
| **v1.4.0** | Унифицированный toolkit: AGENT_RULES переписан, добавлен PROJECT_CONFIG.md, README переработан, синхронизированы уровни No-Unicode [C]+[W]+[I], REPRODUCIBILITY классифицирован как Группа B |
| v1.3.0 | Добавлены логотипы (assets/), система worklog, Implementation Order (6-шаговая последовательность), параметризованная сигнатура стека, AI-чат в No-Unicode Policy, исключение `(ref)` для блоков кода |
| v1.2.1 | Обновлены стандарты до v2.1 (типографика разрешена в тексте, добавлен EN стандарт) |
| v1.2.0 | Добавлена инструкция writing-plans (планировать перед кодом для задач > 3 шагов) |
| v1.1.0 | Добавлены workflow разработки (feature, bug-fix, refactor) + E2E шаблоны |
| v1.0.0 | Начальный релиз из проекта Web-Aesthetic-Showcase |

---

Built with: Next.js 16 + TypeScript + Tailwind CSS
