# TODO: Zai-agent-toolkit

> Последнее обновление: 2026-05-17

---

## 1. Конвертация toolkit в git submodule (PLANNED)

### Проблема
- 50+ проектов используют Zai-agent-toolkit как копию
- Обновление toolkit требует ручного действия в каждом проекте
- Нет автоматической синхронизации

### Решение
Переделать подключение toolkit на git submodule.

### Шаги

| # | Задача | Статус |
|---|--------|--------|
| 1 | Проверить gh auth status (GitHub CLI) | Pending |
| 2 | Получить список всех репозиториев через GitHub API | Pending |
| 3 | Найти репозитории с Zai-agent-toolkit | Pending |
| 4 | Создать скрипт конвертации copy -> submodule | Pending |
| 5 | Тестировать на 1-2 репозиториях | Pending |
| 6 | Запустить массовую конвертацию | Pending |
| 7 | Создать команду `update-all-toolkits` | Pending |

### Результат
После конвертации:
```powershell
# Одна команда обновляет toolkit во всех проектах:
update-all-toolkits
```

### Требования
- GitHub Personal Access Token (gh CLI)
- Доступ к репозиториям на запись

---

## 2. Ревизия skills (IN PROGRESS)

### Проблема
- Многие skills без ID
- Реестр требует синхронизации с файлами

### Статус

| # | Задача | Статус |
|---|--------|--------|
| 1 | Создать skill-id-system (ZAI-META-001) | Done |
| 2 | Создать skill-creator (ZAI-META-002) | Done |
| 3 | Назначить ID prompt-engineering_sts (ZAI-STS-001) | Done |
| 4 | Назначить ID sync-toolkit_sts (ZAI-STS-002) | Done |
| 5 | Назначить ID anti-monolith (ZAI-DEV-002) | Done |
| 6 | Назначить ID остальным skills | Pending |
| 7 | Найти/создать недостающие skills пользователя | Pending |

### Skills без ID (ожидают назначения)

| Skill | Domain | Статус |
|-------|--------|--------|
| git-safe-ops | GIT | Pending |
| git-checkpoint | GIT | Pending |
| commit-work | GIT | Pending |
| git-safety | GIT | Pending |
| z-ai-web-dev-sdk | SDK | Pending |
| api-retry | SDK | Pending |
| fallback | SDK | Pending |
| health-check | HEALTH | Pending |
| c4-architecture | ARCH | Pending |
| mermaid-diagrams | ARCH | Pending |
| database-schema-designer | ARCH | Pending |
| qa-test-planner | QA | Pending |
| sanitize-validate | SEC | Pending |
| session-handoff | SESSION | Pending |
| session-resume | SESSION | Pending |
| requirements-clarity | REQ | Pending |
| doc-gen | DOC | Pending |
| dev-watchdog | DEV | Pending |
| project-clone | DEV | Pending |

### Skills пользователя (созданы в toolkit)

| Skill | ID | Статус |
|-------|-----|--------|
| prompt-engineering_sts | ZAI-STS-001 | Active |
| sync-toolkit_sts | ZAI-STS-002 | Active |
| performance-code-generator_sts | ZAI-STS-003 | Active |
| frontend-styling-expert_sts | ZAI-STS-004 | Active |

---

## 3. CI/CD Fixes (PLANNED)

### Проблема
Validation script показывает 39 issues.

| Категория | Описание |
|-----------|----------|
| STD-ID consistency | 6 issues |
| Stack Signature | 29 issues |
| Skill References | 2 issues |

### Решение
Отдельная задача по рефакторингу toolkit.

---

*Документ создан 2026-05-17*
