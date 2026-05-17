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

## 2. Skills ID Assignment (COMPLETED)

### Done

| # | Задача | Статус |
|---|--------|--------|
| 1 | Создать skill-id-system (ZAI-META-001) | Done |
| 2 | Создать skill-creator (ZAI-META-002) | Done |
| 3 | Назначить ID всем skills | Done |
| 4 | Добавить тег compatibility | Done |

### Current Skills Registry

| ID | Name | Compatibility |
|-----|------|---------------|
| ZAI-MEM-001 | memory-store | both |
| ZAI-MEM-002 | memory-query | both |
| ZAI-MEM-003 | memory-delete | both |
| ZAI-MEM-004 | memory-export | both |
| ZAI-FS-001 | folder-indexer | both |
| ZAI-META-001 | skill-id-system | both |
| ZAI-META-002 | skill-creator | both |
| ZAI-SESSION-002 | session-log | both |
| ZAI-SESSION-003 | context-consolidation | both |
| ZAI-DEV-003 | project-clone | sandbox |
| ZAI-DEV-004 | commit-work | both |
| ZAI-DEV-005 | database-schema-designer | both |
| ZAI-ARCH-002 | mermaid-diagrams | both |
| ZAI-REQ-001 | requirements-clarity | both |
| ZAI-QA-001 | qa-test-planner | both |
| ZAI-STS-001 | prompt-engineering_sts | both |
| ZAI-STS-002 | sync-toolkit_sts | sandbox |
| ZAI-STS-003 | performance-code-generator_sts | sandbox |
| ZAI-STS-004 | frontend-styling-expert_sts | both |
| ZAI-STS-005 | phi-layout_sts | both |
| ZAI-STS-006 | zai-ui-composer_sts | sandbox |

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

## 4. Memory System (IN PROGRESS)

### Создано

| Компонент | ID | Статус |
|-----------|-----|--------|
| memory-store | ZAI-MEM-001 | Done |
| memory-query | ZAI-MEM-002 | Done |
| memory-delete | ZAI-MEM-003 | Done |
| memory-export | ZAI-MEM-004 | Done |
| folder-indexer | ZAI-FS-001 | Done |
| memory_cli.py | - | Done |
| folder_indexer.py | - | Done |

### Pending

| # | Задача | Статус |
|---|--------|--------|
| 1 | Индексировать реальные папки с документами | Pending |
| 2 | Наполнить memory знаниями через ADE | Pending |
| 3 | Web-интерфейс для просмотра памяти | Pending |
| 4 | Интеграция с проектами в ZCodeProject | Pending |

### Done

| # | Задача | Статус |
|---|--------|--------|
| 5 | Переименовать projects/ в project-index/ | Done |

### Архитектура

```
C:\Users\stsgr\.zcode\
├── memory\
│   ├── chromadb\          <- Векторная база
│   ├── project-index\     <- Каталог проектов
│   ├── sessions\          <- Логи сессий
│   └── knowledge\         <- Knowledge base
├── tools\
│   ├── memory_cli.py
│   └── folder_indexer.py
├── skills\                <- Symlink к toolkit
├── hooks\
└── Zai-agent-toolkit\
```

---

*Dokument sozdan 2026-05-17*
