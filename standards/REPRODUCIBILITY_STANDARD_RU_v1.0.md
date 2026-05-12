# Стандарт: Reproducibility v1.0

> ID: STD-ENV-001
> Version: 1.0
> Level: **[C] Critical**

**`git clone` + `bun install` + `bun run dev` = работающее приложение.**
Всегда. Везде. На любой машине. Без исключений.

---

## Уровни

```
L1 -- Environment     Файлы, пути, зависимости, окружение
L2 -- Code           Исходный код, БД, API, безопасность
L3 -- Delivery       CI, Docker, сборка, деплой
L4 -- Process        Аудит, тесты, чеклист, работа с репо
```

#### L1 -- Environment

**`.env.example` -- обязательный.** Содержит все переменные с безопасными дефолтами. Секреты -- плейсхолдерами. `.env` -- в gitignore.

**Пути -- только относительные.** Запрещены: `/home/`, `/Users/`, `http://localhost:` в коде.

```typescript
// ЗАПРЕЩЕНО
fetch('http://localhost:3000/api/documents')

// ОБЯЗАТЕЛЬНО
fetch('/api/documents')
```

Для кросс-портовых сервисов -- только `XTransformPort`:

```typescript
// ЗАПРЕЩЕНО
fetch('http://localhost:3003/api/chat')

// ОБЯЗАТЕЛЬНО
fetch('/api/chat?XTransformPort=3003')
```

**Runtime-валидация окружения.** Критичные переменные проверяются при старте. Missing vars -- warning, не crash.

**Бинарные файлы -- вне git.** В git попадает только исходный код и конфигурация. Нет `.db`, `.sqlite`, изображений в upload/, бэкапов, логов, build-артефактов.

#### L2 -- Code

**База данных: относительный путь через `path.resolve()`:**

```typescript
const dbPath = resolve(process.cwd(), rawUrl.replace(/^file:/, ''))
if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
```

**База данных: безопасные права:** `0o755` для директорий, `0o644` для файлов.

**SQLite: нет `mode: 'insensitive'`** -- SQLite не поддерживает case-insensitive в Prisma. Использовать `contains`.

**Error handling: не утечь внутренние ошибки.** API-роуты никогда не отдают Prisma error messages клиенту:

```typescript
// ЗАПРЕЩЕНО -- утечка internal details
catch (error) {
  const msg = error instanceof Error ? error.message : 'Failed'
  return NextResponse.json({ error: msg }, { status: 500 })
}

// ОБЯЗАТЕЛЬНО -- generic message + log
catch (error) {
  console.error('Error creating document:', error)
  return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
}
```

**Anti-fragility: изоляция ошибок.** Не-критичные операции (бэкап, AI-анализ) не ломают основную. Критичные операции (save, delete) ДОЛЖНЫ показывать ошибку пользователю через toast.

**Тёмная тема: обязательна.** Использовать только CSS-переменные: `bg-primary`, `text-foreground`, `bg-muted`, `text-muted-foreground`.

**Цветовая палитра:** по умолчанию `stone`, `slate`, `neutral`, `green`, `emerald`. `indigo` / `blue` -- только если явно запрошено.

**Зависимости:** никаких мёртвых пакетов. Каждый пакет в `dependencies` ДОЛЖЕН использоваться в `src/`.

**UI-компоненты:** `src/components/ui/` -- библиотека shadcn/ui, исключается из проверки на мёртвые файлы. Каждый кастомный файл в `src/components/codex/` ДОЛЖЕН импортироваться в `src/`.

#### L3 -- Delivery

**Default branch:** `main`. Lockfile закоммичен (`bun.lock`). Semantic Versioning в `package.json`.

**CI pipeline (рекомендуется):** `.github/workflows/ci.yml` -- lint, type-check, тесты при каждом push/PR.

**Dockerfile (рекомендуется):** production-образ на базе `node:20-alpine`, многоступенчатая сборка, Bun runtime. Не содержит `.env`, `.db`, бэкапов.

#### L4 -- Process

**Чеклист перед каждым коммитом:**

- [ ] `bun run lint` -- 0 ошибок
- [ ] Нет абсолютных путей в коде
- [ ] Нет `console.log` (только `console.error` в catch)
- [ ] Нет неиспользуемых пакетов / файлов
- [ ] API error handling -- generic messages
- [ ] Бинарные файлы не в git

**Чеклист перед релизом:**

- [ ] Всё из чеклиста коммита
- [ ] `.env.example` существует со всеми переменными
- [ ] `bun install && bun run dev` на чистом клоне -- работает
- [ ] Тёмная тема работает
- [ ] Все API-роуты возвращают корректные статусы
- [ ] Тесты (при наличии) -- проходят без ошибок

**Worklog:** файл `worklog.md` в корне, добавлять (не перезаписывать).

**Формула чистого репозитория:**

```
clone + install + dev = работает
```

Всё что нарушает эту формулу -- баг.

---

### Правило 3. Deduplication-First

Все create-эндпоинты **обязаны** проверять существование записи перед созданием.

**Алгоритм (два уровня):**
1. Точное совпадение: `findFirst({ where: { name: { equals: value } } })`
2. Case-insensitive fallback (для SQLite): `findFirst({ where: { name: { equals: value.toLowerCase() } } })`

**Если найдено** -- вернуть существующую запись (HTTP 200), не создавать дубликат.

**Применяется ко всем сущностям:** Category, Tag, Term, Document (по title)

---

### Правило 4. Auto-Backup Policy

Каждая пишущая мутация (POST, PATCH, DELETE) вызывает `autoBackup()`.

- Место: `db/backups/custom_YYYY-MM-DD_HH-MM.db`
- Хранится: последние 10 бэкапов, старые удаляются автоматически
- Ошибка бэкапа **никогда** не прерывает основную операцию

**Где:** `src/lib/backup.ts` -- `autoBackup()`

---

### Правило 5. SQLite Safety (connection_limit=1)

PrismaClient использует `connection_limit=1&pool_timeout=0` для избежания ошибок P2025 (database locked).

**Где:** `src/lib/db.ts` -- `datasourceUrl: file:${dbPath}?connection_limit=1&pool_timeout=0`

---

### Правило 6. AI Prompt Language Standard

Все AI system-промпты написаны **на русском языке** (кроме промпта извлечения инструкций -- на английском по No-Unicode Policy).

| Задача | Temperature |
|---|---|
| Извлечение инструкций / терминов / семантический поиск | 0.1--0.2 (максимальная детерминированность) |
| Анализ документов / заметок / категорий | 0.3 (баланс креативности и точности) |

**Формат ответа:** все AI-эндпоинты требуют `ТОЛЬКО валидный JSON, без markdown-форматирования`.

---

### Правило 7. Counter Synchronization

Все счётчики в sidebar синхронизированы с реальным состоянием БД + localStorage.

- `fetchGlobalCounters()` вызывается при init и после каждой мутации
- Instructions counter = `(BUILTIN_COUNT - hiddenTemplates) + dbInstructionsTotal`
- Documents counter = `data.allTotal` (из API)
- Notes counter = `notesData.length` (из API)
- Terms counter = `data.total` (из API)
- При удалении -- немедленный `refreshAll()`

---

### Правило 8. Safe Delete Policy

Удаление любой сущности требует **явного подтверждения** через AlertDialog. Все 7 сущностей. Без исключений.

---

### Правило 9. localStorage Persistence

Данные, не хранимые в БД, сохраняются в localStorage с ключами `wiki-codex:*`:

- `wiki-codex:hidden-templates` -- массив ID скрытых встроенных инструкций
- `wiki-codex:sidebar-collapsed` -- состояние sidebar
- `wiki-codex:theme` -- выбранная тема

---

### Правило 10. JSON-Only AI Responses

Все AI-эндпоинты используют **parsing-защиту**: strip markdown fences, regex-экстракция JSON.
Если JSON не распознан -- fallback-значение, ошибка не пробрасывается наверх.

---

### Правило 11. Push Policy

**Пушить после каждого значимого изменения** -- не копить полуфабрикаты в локальной ветке.

| Ситуация | Действие |
|---|---|
| Завершён фича или фикс | Пушить сразу |
| Конец рабочей сессии | Пушить даже если есть незавершённые изменения |
| CI красный | Пушить можно, но исправить в ближайшее время |
| Экспериментальная ветка | Пушить сразу (в отдельной ветке), не сливать в main без проверки |
| Токен протух | Обновить токен, обновить remote URL, пушить |

**Минимум:** 1 push в конце каждой сессии. Локальные изменения без пуша = потеря при сбросе среды Z.ai.

**Формула:**

```
работа -> commit -> push -> спокойствие
```

## Удаление

| Сущность | Где | Как |
|---|---|---|
| Заметка | Список + Редактор | Кнопка Trash2 + AlertDialog подтверждение |
| Извлечённая инструкция | Список | Кнопка Trash2 + AlertDialog подтверждение |
| Встроенная инструкция | Список | Кнопка Trash2 + AlertDialog (localStorage, персистенция) |
| Документ | Просмотр | Кнопка Trash2 + AlertDialog подтверждение |
| Категория | Sidebar | Кнопка Trash2 (hover) + AlertDialog подтверждение |
| Тег | Sidebar | Кнопка X (hover) + AlertDialog подтверждение |
| Термин | Словарь | Кнопка Trash2 (hover) + AlertDialog, массовое выделение + удаление |
