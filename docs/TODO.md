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

### ОПАСНОСТИ
1. **Два репозитория**: `Zai-agent-toolkit` (старый, черновик) и `Zai-agent-toolkit_v` (каноничный).
   Submodule должен указывать на `_v`, иначе аудит потерян.
2. **Старый репозиторий удалится** — значит все существующие submodule ссылки
   (если уже есть) умрут. Надо предусмотреть миграцию URL.
3. **50+ проектов** — цифра непроверенная. Реально ли 50?
4. **Конфликт с sync-контуром**: если проект переходит на submodule, то
   `sync-toolkit.ps1` в корне проекта уже неактуален (теперь обновление через `git submodule update`).
5. **Windows vs Linux**: submodule на Windows требует `git submodule update --init --recursive`
   при каждом клоне. В CI на Linux — то же самое. Надо убедиться что все dev-окружения поняли.
6. **Замкнутый круг**: если сам toolkit управляется через submodule,
   то для его обновления нужен цикл: push в toolkit → submodule update в проекте.
   `sync-toolkit` придётся переписать.

### Замечания по шагам

| # | Задача | Статус | Замечание |
|---|--------|--------|-----------|
| 1 | Проверить gh auth status (GitHub CLI) | Pending | OK |
| 2 | Получить список всех репозиториев через GitHub API | Pending | `find-toolkit-repos.ps1` уже существует, фикс P2.4.3 |
| 3 | Найти репозитории с Zai-agent-toolkit | Pending | Искать оба имени: старый и `_v` |
| 4 | Создать скрипт конвертации copy -> submodule | Pending | Скрипт должен менять URL на `_v`, чистить старую копию |
| 5 | Тестировать на 1-2 репозиториях | Pending | Взять не-критичные проекты |
| 6 | Запустить массовую конвертацию | Pending | Только после теста |
| 7 | Создать команду `update-all-toolkits` | Pending | Учесть что после submodule это `git submodule update --remote` |

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

## 3. CI/CD Fixes (OUTDATED — аудит всё починил)

### Было
Validation script показывал 39 issues.

| Категория | Описание | Статус |
|-----------|----------|--------|
| STD-ID consistency | 6 issues | [x] Fixed (P1) |
| Stack Signature | 29 issues | [x] Fixed (P8, P5.2) |
| Skill References | 2 issues | [x] Fixed (P2.5.6) |

Сейчас `validate_compatibility.py` проходит ALL CHECKS PASSED.
Секция оставлена для истории, можно удалить при следующем рефакторинге.

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
| 5 | Добавить графовый слой (NetworkX + edges.json) | Pending |

### Memory Graph Layer (PROPOSED)

ChromaDB — векторная, не графовая. Для связей между записями предлагается надстройка.

#### Архитектура

```
ChromaDB                         edges.json (или memory/graph.json)
  {id, vector, metadata}           [{from, to, type, weight}, ...]
       |                                    |
       +--- memory_cli.py ---+--- NetworkX --+
                                  |
                            обход графа:
                            shortest_path()
                            ancestors()
                            subgraph()
```

#### Что даёт

| Сейчас (только векторы) | С графами |
|---|---|
| "Найди похожее на X" | "Найди всё, что связано с X" |
| Плоский semantic search | Цепочки: сессия → задача → фикс → коммит |
| Нет связей между записями | Edge: `depends_on`, `follow_up`, `fixed_by`, `implements` |

#### Новые команды `memory_cli.py`

| Команда | Назначение |
|---------|-----------|
| `memory graph add-edge --from X --to Y --type depends_on` | Добавить ребро |
| `memory graph query-path --from X --to Y` | Кратчайший путь между нодами |
| `memory graph subgraph --tag memory` | Подграф по тегу |
| `memory graph viz [--output graph.png]` | Визуализация (matplotlib или .dot) |
| `memory graph stats` | Статистика: ноды, рёбра, связность |

#### Технические риски

| Риск | Опасность | Решение |
|------|-----------|---------|
| edges.json рассинхронится с ChromaDB | Ребро указывает на несуществующий node_id | `graph validate` — проверка целостности |
| edges.json разрастётся | 50К+ рёбер — тормоза при загрузке | Разбить по файлам (edges-sessions.json, edges-code.json) |
| NetworkX в памяти при больших графах | Ограничение RAM | Lazy loading подграфов |
| Ручное редактирование edges.json | Ошибки в JSON, битые ссылки | Валидация перед загрузкой |

### Рекомендация: единое пространство на 10-20К файлов

#### Принцип

Не все файлы одинаково полезны. Классификация на входе:

```
все 20K файлов
  ├─ текст (md, py, ts, json, yml, txt, cfg, log)  → ChromaDB + граф
  ├─ документы (pdf, docx, xlsx, pptx)              → мета + теги (опционально OCR)
  ├─ медиа (png, jpg, svg, mp3, mp4)                → мета + теги (опционально caption)
  ├─ бинарники (exe, dll, bin, pdb, ico)            → только мета (путь, размер, дата)
  └─ мусор (node_modules, .git, __pycache__, cache)  → исключить маской
```

#### Три слоя хранения

| Слой | Технология | Что хранит | Оценка размера на 20K |
|------|-----------|-----------|----------------------|
| **Мета-индекс** | folder_indexer.py (JSON кэш) | Все 20K: путь, размер, дата, тип, хеш, теги | 2-3 MB |
| **Векторы** | ChromaDB | ~8K текстовых файлов (чанками по 500-1000 токенов) | 40-60 MB |
| **Граф** | edges.json + NetworkX | 20K nodes + рёбра: parent_dir, imports, same_session | 3-5 MB |

#### Что эмбеддим, что нет

| Тип файлов | Расширения | Эмбеддинг | Мета-индекс | Граф |
|------------|-----------|-----------|-------------|------|
| Исходники | .py, .ts, .js, .rs, .go, .java, .c, .h | Да, пофайлово | Да | Да |
| Доки | .md, .txt, .rst, .pdf (текст) | Да, пофайлово (PDF с парсингом) | Да | Да |
| Конфиги | .json, .yml, .yaml, .toml, .ini, .cfg, .env | Да, целиком | Да | Да |
| Логи | .log, .out, .err | Нет (мусор) | Да (только путь) | Нет |
| Картинки | .png, .jpg, .svg, .webp, .ico | Нет | Да (+ размеры) | Опционально |
| Документы | .pdf, .docx, .xlsx | Опционально (OCR) | Да | Да |
| Бинарники | .exe, .dll, .so, .bin, .pdb, .min.js | Нет | Да | Нет |
| node_modules | — | Исключить | Исключить | Исключить |
| .git | — | Исключить | Исключить | Исключить |

#### Как фильтровать на входе

Правила для `folder_indexer.py` (маски исключения):

```python
EXCLUDE_DIRS = ['node_modules', '.git', '__pycache__', '.venv', 'dist', 'build', 'cache']
EXCLUDE_EXTS = ['.exe', '.dll', '.so', '.bin', '.pdb', '.pyc', '.min.js', '.map']
EMBED_EXTS   = ['.md', '.txt', '.py', '.ts', '.js', '.rs', '.go', '.java',
                '.c', '.h', '.json', '.yml', '.yaml', '.toml', '.ini', '.cfg',
                '.env', '.rst', '.csv']
META_ONLY_EXTS = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif', '.ico',
                  '.pdf', '.docx', '.xlsx', '.pptx', '.mp3', '.mp4',
                  '.zip', '.tar', '.gz', '.7z']
```

#### Команды `memory_cli.py` для работы с 20K файлов

```bash
# Первичный проход — просканировать 20K, разложить по слоям
memory scan C:\Users\stsgr\projects --full-scan

# Инкрементальное обновление (только изменённые с даты X)
memory scan C:\Users\stsgr\projects --incremental --since 2026-05-01

# Поиск по всем слоям сразу
memory search "кэширование токенов"                    # ChromaDB semantic
memory search --ext .env                                # мета-индекс
memory search --tag project:myapp --type config         # мета + теги

# Навигация по графу
memory graph path "src/main.rs" "src/lib/auth.rs"       # путь импортов
memory graph files-in "src/features/"                   # все файлы папки
memory graph related "docker-compose.yml"               # связанные по тегу

# Статистика
memory graph stats                                      # ноды, рёбра, топ-типы
memory scan stats                                       # сколько всего, по типам
```

#### Производительность

| Операция | Ожидание | Комментарий |
|----------|----------|-------------|
| Первичный scan 20K файлов | 2-10 мин | Зависит от диска (SSD быстрее) |
| Эмбеддинг ~8K текстовых | 5-15 мин | Однократно, можно фоном |
| Инкрементальный scan | 1-5 сек | Только diff по дате/хешу |
| Semantic search | 200-500ms | ChromaDB, 8K документов |
| Графовый запрос (путь, соседи) | <50ms | NetworkX в памяти |
| Граф визуализация (500+ nodes) | 1-3 сек | matplotlib |

#### Риски 20K файлов

| Риск | Вероятность | Решение |
|------|------------|---------|
| Дубликаты файлов (копии проектов) | Высокая | Хешировать содержимое (SHA256), группировать дубли |
| Огромные файлы (логи БД на 100MB) | Средняя | Пропускать файлы >10MB для эмбеддинга |
| node_modules не везде отфильтрован | Средняя | Маски + ручная проверка топ-10 больших папок |
| ChromaDB разрастётся (много чанков) | Низкая | 8K файлов × 3 чанка = 24K векторов — ChromaDB держит 1M+ |
| Пути длиннее 255 символов (Windows) | Средняя | folder_indexer должен обрабатывать `\\?\` префикс |

### Done

| # | Задача | Статус |
|---|--------|--------|
| 6 | Переименовать projects/ в project-index/ | Done |

### Архитектура

```text
C:\Users\stsgr\.zcode\
+-- memory\
|   +-- chromadb\          <- Векторная база
|   +-- project-index\     <- Каталог проектов
|   +-- sessions\          <- Логи сессий
|   +-- knowledge\         <- Knowledge base
|   +-- graph.json         <- Edge-лист (рёбра между нодами)
+-- tools\
|   +-- memory_cli.py
|   +-- folder_indexer.py
+-- skills\                <- Symlink к toolkit
+-- hooks\
+-- Zai-agent-toolkit\
```

---

---

## 5. Sync Toolkit контур — замечания и косяки (TODO)

### 5.1 Хардкод в SKILL.md (пропущен в аудите P2)

Файл: `skills/sync-toolkit_sts/SKILL.md`

| Строка | Было (хардкод) | Должно стать |
|--------|----------------|--------------|
| 77 | `cd C:\Users\stsgr\.zcode\Zai-agent-toolkit` | `cd $env:USERPROFILE\.zcode\Zai-agent-toolkit` |
| 89 | `C:\Users\stsgr\.zcode\Zai-agent-toolkit\sync-toolkit.ps1` | `$env:USERPROFILE\.zcode\Zai-agent-toolkit\sync-toolkit.ps1` |
| 94 | `cd C:\Users\stsgr\.zcode\Zai-agent-toolkit` | `cd $env:USERPROFILE\.zcode\Zai-agent-toolkit` |

Также поменять везде URL `Zai-agent-toolkit` → `Zai-agent-toolkit_v` (после удаления старого репо).

### 5.2 Два механизма синка — конфликт

| Механизм | Где лежит | Результат |
|----------|-----------|-----------|
| `sync-toolkit.ps1` | корень репозитория | Standalone скрипт |
| `setup-sync-command.ps1` → функция `sync-toolkit` | `$PROFILE` | PS функция |

В PowerShell функция из `$PROFILE` имеет приоритет над `.ps1` файлом.

**Решение:** оставить один механизм. Либо standalone `.ps1` + добавить его в PATH,
либо profile-функцию. Второй — чище (не надо править PATH).

### 5.3 Три скрипта делают одно и то же

| Файл | Что делает |
|------|-----------|
| `sync-toolkit.ps1` (корень) | `cd ~/.zcode/Zai-agent-toolkit && git pull` |
| `scripts/update-toolkit.ps1` | То же + проверка up-to-date + `pause` |
| `scripts/update-toolkit.bat` | То же + `pause` (для cmd) |

**Решение:** 
- `update-toolkit.ps1` — расширить до полноценного (проверки, up-to-date, ошибки).
- `sync-toolkit.ps1` — сделать алиасом или тонкой обёрткой над update-toolkit.ps1.
- `.bat` — оставить для совместимости, но внутри вызывать PS скрипт.

### 5.4 URL старого репозитория во всех скриптах

После удаления `Zai-agent-toolkit` (старого), все ссылки должны указывать на `Zai-agent-toolkit_v`:

| Файл | Строка |
|------|--------|
| `INSTALL.md` | `git clone https://github.com/stsgs1980/Zai-agent-toolkit.git` |
| `README.md` | `git clone https://github.com/stsgs1980/Zai-agent-toolkit.git` |
| `scripts/update-toolkit.ps1` | help text |
| `scripts/update-toolkit.bat` | help text |
| `setup.sh` | URL clone |
| `skills/sync-toolkit_sts/SKILL.md` | инструкции |

---

## 6. Пропущенное в аудите (Missed Items)

### 6.1 extract_severity_levels() — не удалена, не подключена

`AUDIT_TODO.md` п.2.5.5: *"validate_compatibility.py:213 - call check_severity_levels() or remove dead code"* — помечен [x] Done,
но функция `extract_severity_levels()` всё ещё определена (строка 65) и нигде не вызывается.

**Варианты:**
1. Удалить функцию (если severity check не нужен)
2. Реализовать `check_severity_levels()` на её основе и подключить в `main()`

### 6.2 Документация — смесь русского и английского

`docs/TODO.md` и `docs/SKILL_PROCESSES.md` — English заголовки, русский body.
Нарушение `instructions/language-rule.md`.

Можно либо перевести всё на один язык, либо явно промаркировать mixed-статус.

### 6.3 anti-monolith — фантомный скилл

`skills/anti-monolith/` — не существует, но упоминается в 11 файлах toolkit'а.

#### Где упоминается

| Файл | Статус | Что делать |
|------|--------|-----------|
| `AGENT_RULES.md` 8.2 (System Skills) | Ок — это sandbox built-in | Не трогать |
| `standards/skill-id-registry.md` | `ZAI-DEV-002 \| Planned` | Оставить как Planned, но пометить "system only" |
| `skills/skill-id-system/SKILL.md` | `ZAI-DEV-002 \| anti-monolith \| 1.0 \| Active` | Поменять статус на Planned |
| `skills/zai-ui-composer_sts/SKILL.md` | Complementary reference | Поменять на "system skill (Z.ai sandbox)" |
| `standards/FRONTEND_STANDARD.md` | Changelog: merged anti-monolith patterns | Ок — это история |
| `standards/IMPLEMENTATION_ORDER.md` | "Use anti-monolith skill" | Заменить на ссылку на FRONTEND_STANDARD |
| `docs/SKILL_ID_GUIDE.md` | Как существующий | Поменять на "system skill (Z.ai sandbox)" |
| `docs/TUTORIAL.md` | Дважды как существующий | Поменять на "system skill (Z.ai sandbox)" |
| `docs/COMMANDS_LOG.md` | ZAI-DEV-002 как existing | Поменять статус |
| `CHANGELOG.md` | v1.5.0 добавлен | Ок — это история |

#### Анализ

| Аспект | Оценка |
|--------|--------|
| Концепция (декомпозиция монолитов) | Полезна |
| Нужен ли отдельный SKILL.md в toolkit | Нет — всё покрыто FRONTEND_STANDARD.md (150-line limit, FSD-слои, разделение ответственности) |
| Оставить ID ZAI-DEV-002 | Да, зарезервировать как Planned |
| Сколько файлов править | 6 (skill-id-registry, skill-id-system, zai-ui-composer, IMPLEMENTATION_ORDER, SKILL_ID_GUIDE, TUTORIAL, COMMANDS_LOG) |

---

## 7. Итого по приоритетам

| Приоритет | Задача | Зависит от |
|-----------|--------|------------|
| P0 | Починить хардкод в SKILL.md sync-toolkit | — |
| P1 | Разобрать дубликаты sync-скриптов | P0 |
| P1 | Обновить URL с `Zai-agent-toolkit` на `_v` | удаление старого репо |
| P2 | Решить судьбу `extract_severity_levels()` | — |
| P2 | Переписать план submodule под `_v` | P1 (URL) |
| P2 | Почистить 7 файлов с упоминаниями anti-monolith (плановый статус или system-only) | — |
| P3 | Реализовать графовый слой в memory_cli.py | — |
| P3 | Индексация реальных папок + наполнение memory | графовый слой опционально |
| P3 | Web-интерфейс для памяти | графовый слой |
| P3 | Создать `docs/AGENT_ARCHITECTURE.md` | [x] Done |
| P3 | Создать `agents/` директорию + AGENT.md для 5 агентов | AGENT_ARCHITECTURE.md |
| P3 | Обновить `opencode.json` — добавить `agents.paths` | agents/ |
| P3 | Доработать `templates/TASK_TEMPLATE.md` — chain-шаблоны | — |
| P3 | Доработать `AGENT_RULES.md` — Section про sub-agents | — |
| P4 | Смесь языков в docs/TODO.md, SKILL_PROCESSES.md | — |

---

*Dokument obnovlen: 2026-05-18*

---

Built with: Python + PowerShell + Markdown
