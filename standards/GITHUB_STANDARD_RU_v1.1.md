# Стандарт: GitHub v1.0

> ID: STD-GIT-001
> Версия: 1.1
> Уровень: **[C] Критический**
> Ссылка: https://www.conventionalcommits.org/

---

## 1. Формат коммитов

### 1.1 Conventional Commits (Обязательно)

Все сообщения коммитов ДОЛЖНЫ следовать [Conventional Commits v1.0](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[опциональное тело]

[опциональный футер]
```

### 1.2 Типы

| Тип | Назначение | Пример |
|-----|------------|--------|
| `feat` | Новая функциональность | `feat(button): add size="lg" variant` |
| `fix` | Исправление бага | `fix(tabs): correct aria-selected on rerender` |
| `refactor` | Реструктуризация кода, без изменения поведения | `refactor(tokens): move contrast utils to separate file` |
| `docs` | Только документация | `docs(standards): add WCAG 2.1 AA compliance` |
| `style` | Форматирование, пробелы, без изменения логики | `style(card): fix indentation` |
| `test` | Добавление или обновление тестов | `test(button): add keyboard navigation tests` |
| `chore` | Сборка, инструментарий, CI, зависимости | `chore(deps): update react to 19.1` |
| `perf` | Улучшение производительности | `perf(grid): memoize layout calculations` |
| `ci` | Конфигурация CI/CD | `ci: add accessibility audit step` |
| `build` | Изменения системы сборки | `build(tsup): add minification` |

### 1.3 Области (Scopes)

Scope = слой или пакет, затрагиваемый изменением:

```
tokens, ui, sections, features, hooks, providers, cli, eslint-plugin,
browser, create-app, theme, layout, a11y, docs, standards
```

### 1.4 Правила

- Описание в **повелительном наклонении**: "add feature" НЕ "added feature"
- Описание на **английском** всегда (согласно Language Rule)
- Без точки в конце
- Первая буква строчная
- Максимум 72 символа в первой строке
- Тело: объяснить ПОЧЕМУ, не ЧТО (diff показывает ЧТО)

**Примеры:**

```bash
# Хорошо
feat(sections): add hero-section with 3 variants
fix(theme): correct contrast ratio for muted-foreground on Zinc
refactor(docs): consolidate standards into docs/standards/

# Плохо
update stuff
fixed bug
Added new component
feat: add feature.  # без точки
feat(ui): This component does X and Y and Z...  # слишком длинно
```

---

## 2. Именование веток

### 2.1 Формат

```
<type>/<ticket>-<short-description>
```

| Тип | Назначение | Пример |
|-----|------------|--------|
| `feat/` | Новая функциональность | `feat/wcag-contrast-audit` |
| `fix/` | Исправление бага | `fix/tabs-keyboard-nav` |
| `refactor/` | Реструктуризация кода | `refactor/docs-consolidation` |
| `docs/` | Документация | `docs/github-standard` |
| `chore/` | Инструментарий, CI | `chore/update-deps` |
| `release/` | Подготовка релиза | `release/v1.2.0` |

### 2.2 Правила

- Нижний регистр, только дефисы (без подчёркиваний, без camelCase)
- Максимум 50 символов
- Краткое описание: 2-4 слова
- Без номера тикета = использовать описательное имя

---

## 3. Запрещённые операции

### 3.1 КРИТИЧНО: Никогда не делайте этого

| Операция | Почему запрещено | Альтернатива |
|----------|------------------|--------------|
| `git pull --rebase` | Блокирует sandbox Z.ai при конфликте | `git push --force-with-lease` |
| `git push --force` | Перезаписывает remote без защиты | `git push --force-with-lease` |
| `git pull` после смены remote URL | Создаёт ненужные конфликты | `git push --force-with-lease` |
| `git reset --hard` без бэкапа | Потеря данных | Сначала бэкап (см. Раздел 4) |
| Прямой push в `main` для экспериментов | Без review, без отката | Используйте ветку + PR/merge |
| Коммит секретов/токенов | Утечка безопасности | Используйте `.env.example` + `.gitignore` |
| `git add .` для частичных изменений | Добавляет несвязанные файлы | `git add -p` или явные пути |
| Amend опубликованных коммитов | Перезаписывает общую историю | Новый коммит вместо этого |

### 3.2 ПРЕДУПРЕЖДЕНИЕ: Избегайте без веской причины

| Операция | Риск | Когда допустимо |
|----------|------|-----------------|
| `git merge` (vs rebase) | Запутанная история | Только для release-веток |
| `git rebase -i` на общей ветке | Перезаписывает чужие коммиты | Только на своей ветке |
| `git cherry-pick` | Дублирование коммитов | Только хотфиксы |
| Force push в feature-ветку | Сбой работы команды | Только solo-работа |

---

## 4. Бэкап перед перезаписью

ПЕРЕД любой операцией, переписывающей историю (rebase, merge, pull, reset --hard):

```bash
# Шаг 1: Stash незакоммиченной работы
git stash push -m "pre-op-backup"

# Шаг 2: Копировать пакеты (самый ценный код)
cp -r packages/ /tmp/stsgs-backup/

# Шаг 3: Сохранить ссылку на git log
git log --oneline -20 > /tmp/git-log-backup.txt
```

### 4.1 Восстановление из блокировки git

Если предыдущая сессия оставила git в заблокированном состоянии:

```bash
rm -rf .git/rebase-merge .git/rebase-apply
git reset --hard HEAD
```

### 4.2 Диагностика без паники

Прежде чем говорить пользователю о потере данных, проверьте ВСЕ 5 путей:

1. `ls packages/ui/src/` — существуют ли файлы?
2. `ls .git/rebase-merge/` — приостановлен ли rebase?
3. `git reflog` — есть ли ссылки на коммиты?
4. `ls /tmp/stsgs-backup-*/` — были ли созданы бэкапы?
5. `git fsck --lost-found` — есть ли dangling objects?

НИКОГДА не говорите "безвозвратно потеряно", пока не проверены все 5 пунктов.

---

## 5. Политика push

### 5.1 Частота push

Push после каждого значимого изменения. Не накапливайте недоделанную работу локально.

| Ситуация | Действие |
|----------|----------|
| Фича или фикс завершён | Push немедленно |
| Конец рабочей сессии | Push даже если есть незавершённые изменения |
| CI красный | Push OK, но исправьте скоро |
| Экспериментальная ветка | Push немедленно (в отдельной ветке), не мёрджите без review |
| Токен истёк | Обновите токен, обновите remote URL, push |

**Минимум:** 1 push в конце каждой сессии.

**Формула:**

```
work -> commit -> push -> спокойствие
```

### 5.2 Система чекпоинтов

НЕ ждите конца сессии. Создавайте чекпоинты во время работы систематически.

| Тип чекпоинта | Когда | Формат коммита |
|---------------|-------|----------------|
| **WIP** | Каждые 15-20 мин во время активной работы | `chore(wip): checkpoint -- <task-id> in progress` |
| **Milestone** | Логическая единица завершена | `feat(ui): add button component` |
| **Pre-risk** | Перед рискованной операцией (refactor, delete) | `chore: checkpoint before <operation>` |
| **Session End** | Конец сессии | `chore: session checkpoint` |

**Правила WIP-чекпоинтов:**

- Даже незавершённая работа коммитится
- Префикс `chore(wip):` для сигнала "work in progress"
- Push сразу после коммита
- Логирование в worklog.md

**Пример рабочего процесса:**

```bash
# После 15-20 мин работы
git add -A
git commit -m "chore(wip): checkpoint -- task 2-a in progress"
git push --force-with-lease origin main

# Продолжить работу...
```

### 5.3 Recovery-теги

Перед операциями, которые могут потребовать отката:

```bash
# Создать точку восстановления
git tag checkpoint-<task-id>-before-<operation>
git push origin checkpoint-<task-id>-before-<operation>

# Пример
git tag checkpoint-2a-before-refactor
git push origin checkpoint-2a-before-refactor

# Выполнить рискованную операцию...

# Если что-то пошло не так, откат
git reset --hard checkpoint-2a-before-refactor
git push --force-with-lease origin main
```

**Соглашение об именовании тегов:**

```
checkpoint-<task-id>-before-<operation>
checkpoint-<task-id>-after-<operation>  (опционально, для верификации)
```

### 5.4 Правила force push

| Команда | Статус | Причина |
|---------|--------|---------|
| `git push --force-with-lease origin main` | ПРАВИЛЬНО | Безопасный force push с проверкой remote |
| `git push --force origin main` | ИЗБЕГАТЬ | Без проверки безопасности, перезаписывает молча |
| `git push --force-with-lease origin <branch>` | OK | Force push feature-ветки после rebase |

---

## 6. Версионирование и теги

### 6.1 Семантическое версионирование

Все релизы ДОЛЖНЫ следовать [SemVer 2.0](https://semver.org/):

```
MAJOR.MINOR.PATCH
```

| Изменение | Инкремент | Пример |
|-----------|-----------|--------|
| Breaking API change | MAJOR | 1.x.x -> 2.0.0 |
| Новая функциональность (backward compatible) | MINOR | 1.2.x -> 1.3.0 |
| Исправление бага (backward compatible) | PATCH | 1.2.3 -> 1.2.4 |

### 6.2 Тегирование

```bash
# Аннотированный тег (обязательно)
git tag -a v1.2.0 -m "feat: add hero-section with 3 variants"

# Push тега
git push origin v1.2.0
```

Правила:
- Теги ДОЛЖНЫ быть аннотированными (`-a`), не lightweight
- Формат тега: `v` + semver (например, `v1.2.0`)
- Без pre-release-тегов без согласования команды

### 6.3 Changelog

Каждый релиз ДОЛЖЕН обновлять `CHANGELOG.md`:

```markdown
## [1.2.0] - 2025-01-15

### Added
- hero-section with 3 variants

### Fixed
- Contrast ratio for muted-foreground on Zinc theme

### Changed
- Consolidated docs into docs/ directory
```

---

## 7. Защита веток

### 7.1 Ветка main

- Без прямых push (используйте PR или merge из feature-ветки)
- CI должен пройти перед merge
- Минимум 1 review (при росте команды)
- Squash merge предпочтителен (чистая история)

### 7.2 Feature-ветки

- Автоудаление после merge
- Префикс с типом (feat/, fix/, refactor/)
- Одна фича на ветку — без смешанных изменений

### 7.3 Release-ветки

- `release/vX.Y.Z` для подготовки релиза
- Только багфиксы и документация на release-ветках
- Merge обратно в main после релиза

---

## 8. Требования к .gitignore

Эти файлы ДОЛЖНЫ быть в `.gitignore`:

```gitignore
# Секреты
.env
.env.local
.env.*.local

# Зависимости
node_modules/

# Сборка
dist/
.next/
.turbo/

# База данных
*.db
*.db-journal

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Логи
*.log
dev.log

# Загрузки (пользовательский контент, не код)
upload/
```

### 8.1 Обязательно в репозитории

Эти файлы ДОЛЖНЫ быть закоммичены:

```text
.env.example        # Безопасные значения по умолчанию, без реальных секретов
.eslintrc.*         # Конфигурация линтера
.prettierrc         # Конфигурация форматирования
```

---

## 9. Специфика GitHub

### 9.1 Настройки репозитория

| Настройка | Значение | Причина |
|-----------|----------|---------|
| Ветка по умолчанию | `main` | Стандартное соглашение |
| Allow force push | Отключено на `main` | Предотвращение перезаписи истории |
| Allow deletion | Отключено на `main` | Предотвращение случайного удаления |
| Issues | Включено | Отслеживание багов и фич |
| Wiki | Отключено | Используйте docs/ вместо этого |
| Discussions | Включено | Вопросы сообщества |

### 9.2 Лейблы issues

| Лейбл | Цвет | Назначение |
|-------|------|------------|
| `bug` | Красный | Что-то сломано |
| `feature` | Зелёный | Новая функциональность |
| `a11y` | Синий | Доступность |
| `breaking` | Оранжевый | Breaking change |
| `docs` | Серый | Документация |
| `good first issue` | Светло-зелёный | Онбординг |
| `wontfix` | Тёмно-серый | Не исправляем |

### 9.3 Чек-лист PR

Каждый PR ДОЛЖЕН пройти этот чек-лист:

- [ ] Формат Conventional commit
- [ ] Нет секретов в diff
- [ ] CI проходит
- [ ] CHANGELOG.md обновлён (для пользовательских изменений)
- [ ] Документация обновлена (если поведение изменилось)
- [ ] WCAG чек-лист пройден (если UI изменился)
- [ ] Нет новых типов `any`
- [ ] Barrel-экспорты обновлены (если новый модуль)

---

## 10. Правила git в sandbox Z.ai

Sandbox Z.ai имеет специфические ограничения:

- **Общая файловая система**: Все чат-сессии разделяют одну файловую систему
- **Смертность процессов**: Фоновые процессы умирают при завершении чата
- **Нет межчатового разделения процессов**: Нельзя управлять процессами из других чатов
- **Локальные изменения = риск потери данных**: Всегда push перед завершением сессии

### 10.1 Чек-лист начала сессии

```bash
# Проверить, не заблокирован ли git
ls .git/rebase-merge/ 2>/dev/null && echo "REBASE BLOCKED"
git status

# Если заблокирован, восстановить
rm -rf .git/rebase-merge .git/rebase-apply
git reset --hard HEAD
```

### 10.2 Чек-лист конца сессии

```bash
# Закоммитить всё
git add -A
git commit -m "chore: session checkpoint"

# Push всегда
git push --force-with-lease origin main
```

---

## 11. Логируйте всё

После каждой git-опрации логируйте в `worklog.md`:

```markdown
### Git Operation: <operation>
- **Before**: <hash>
- **After**: <hash>
- **Result**: success / failed / conflicted
- **Details**: <что произошло>
```

---

## 12. История версий

| Версия | Дата | Изменения |
|--------|------|-----------|
| 1.0 | 2025-01 | Начальная версия: Conventional Commits, ветвление, запрещённые операции, правила бэкапа |
| 1.1 | 2025-05 | Добавлена система чекпоинтов (WIP, Milestone, Pre-risk, Recovery Tags); систематическое версионирование во время работы |

---

Built with: Git + Conventional Commits + SemVer 2.0 + GitHub
