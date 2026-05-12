# Стандарт: Frontend-разработка v1.3 (RU)

> ID: STD-FE-001
> Version: 1.3
> Level: **[C] Critical**
> Last Updated: 2025-01
> Related: anti-monolith skill (skills/anti-monolith/SKILL.md)

## 1. Область действия

Данный стандарт обязателен для разработки всех пользовательских интерфейсов на базе **экосистемы React**.

**Охват:**
*   **Фреймворки:** Next.js (App Router / Pages Router), Remix, Vite, Pure React.
*   **Язык:** TypeScript (Strict Mode).
*   **Рантаймы и инструменты:** Правила не зависят от пакетных менеджеров (npm, yarn, pnpm, bun) и рантаймов (Node.js, Bun), если они поддерживают целевой фреймворк.

---

## 2. Метрики сложности кода

Эти лимиты — жёсткие пороги. Код, превышающий лимиты, не должен быть влит без документированного исключения.

### 2.1. Ограничения размера

| Единица | Рекомендуется | Жёсткий лимит | Действие при превышении |
|---------|---------------|---------------|------------------------|
| **Функция-компонент** | 100 строк | 200 строк | Вынести подкомпоненты |
| **Файл (модуль)** | 150 строк | 250 строк | Разбить на несколько файлов |
| **Страница / Route** | 40 строк | 40 строк | Только Composition Roots |
| **Кастомный хук** | 50 строк | 100 строк | Разбить на меньшие хуки |
| **Баррель index.ts** | 30 строк | 50 строк | Сгруппировать в суб-баррели |

**Как считать:** Строки кода без учёта пустых строк и комментариев.

**Документирование исключения:** Когда компонент достигает 150+ строк, но не может быть разумно разбит, задокументируйте причину:

```typescript
// [ANTI-MONOLITH EXCEPTION] Этот компонент содержит 170 строк, потому что
// рендерит 12 условных колонок в таблице данных. Вынос каждой колонки в
// отдельный компонент фрагментировал бы API таблицы. Пересмотреть, если сложность вырастет.
function DataTable({ columns, data, sortConfig, filters }: DataTableProps) {
```

**Авто-флаг в CI:** Любой компонент, превышающий жёсткий лимит (200 строк), триггерит автоматический комментарий в PR с просьбой о декомпозиции.

### 2.2. Управление состоянием

**Правило:** Один React-компонент (Client Component) ДОЛЖЕН содержать **не более 3 хуков `useState`**.

**Путь эскалации:**

| Количество useState | Действие |
|---------------------|----------|
| 1-3 | Нормально, оставить в компоненте |
| 4-6 | Вынести в кастомный хук ИЛИ использовать `useReducer` |
| 7+ | Обязательный вынос в кастомный хук |

**Пример — ПЛОХО:**

```typescript
function Dashboard() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [favorites, setFavorites] = useState([])
  const [selected, setSelected] = useState(null)
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState('grid')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  // 8 useState — НАРУШЕНИЕ
}
```

**Пример — ХОРОШО:**

```typescript
function Dashboard() {
  const filters = useDashboardFilters()    // query, category, sortBy, viewMode
  const { items, isLoading, error } = useDashboardData(filters)
  const { favorites, toggleFavorite } = useFavorites()
  const [selected, setSelected] = useState(null)  // только локальное UI-состояние
}
```

---

## 3. Архитектурные ограничения

### 3.1. Изоляция данных

**Принцип:** Строгое разделение между Smart (Container) и Dumb (Presentational) компонентами.

**Запреты:**
*   Прямые API-вызовы (`fetch`, `axios`, `trpc`) внутри Client Components ЗАПРЕЩЕНЫ.
*   Прямой доступ к глобальным хранилищам (Zustand, Redux, Context) в листовых UI-компонентах не рекомендуется.

**Реализация в Next.js:**
*   Server Components: Загрузка данных разрешена и рекомендуется.
*   Client Components: Данные приходят через props или кастомные хуки.

**Рекомендуется: TanStack Query**

```typescript
// Хук оборачивает useQuery — компонент видит только возвращаемое значение
function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(r => r.json()),
  })
}
```

### 3.2. Модульность и экспорты

**Требование:** Каждый модуль (папка) ДОЛЖЕН иметь Public API (Barrel Export) через `index.ts`.

**Предпочтительны явные экспорты:**

```typescript
// ПРЕДПОЧТИТЕЛЬНО — лучше для Fast Refresh, tree-shaking, поддержки IDE
export { Button } from './Button'
export { Card } from './Card'

// ИЗБЕГАТЬ в директориях с 10+ компонентами
export * from './ui'
```

**Запрет:** Глубокие импорты ЗАПРЕЩЕНЫ.

| Нарушение | Соответствие |
|-----------|--------------|
| `import { Button } from 'shared/ui/Button/Button'` | `import { Button } from 'shared/ui'` |

### 3.3. Разделение слоёв

**Методология:** Feature-Sliced Design (FSD) с различием sections/features.

```text
tokens/       <- Цвета, отступы, типографика (без React, без логики)
  ^
ui/           <- Button, Card, Input (чистая презентация, без состояния, без хуков)
  ^
sections/     <- HeroSection, NavigationSection (компонуют ui/, БЕЗ собственного состояния)
  ^
features/     <- FlowCanvas, AgentHierarchy (сложные, ИМЕЮТ собственное состояние)
  ^
hooks/        <- useTheme, useMediaQuery (stateful логика, без JSX)
  ^
providers/    <- ThemeProvider, ErrorBoundary (обёртки приложения)
```

**Различие sections/ vs features/:**

| | sections/ | features/ |
|---|-----------|-----------|
| **Собственное состояние** | Нет — только props | Да — useState, useReducer, hooks |
| **Вызывает хуки** | Нет | Да |
| **Назначение** | Композиция layout | Самодостаточные интерактивные блоки |
| **Пример** | HeroSection, FooterSection | FlowCanvas, SearchPanel |

**Если не уверены:** "Управляет ли этот компонент собственным состоянием?" Если да -> features/. Если только props -> sections/.

**Правила слоёв:**

| Слой | Может импортировать из |
|------|------------------------|
| `tokens` | Ничего из других слоёв |
| `ui` | Только из `tokens` |
| `sections` | Из `ui` и `tokens` — никогда hooks или state |
| `features` | Из `sections`, `ui`, `hooks`, `tokens` |
| `hooks` | Только из `tokens` (или внешних библиотек) |
| `providers` | Из `hooks`, `ui`, `tokens` |

**Никаких обратных импортов. Никогда.**

---

## 4. Динамические импорты

Если компонент превышает 200 строк ИЛИ импортирует тяжёлую зависимость (Three.js, Recharts, Monaco, D3), используйте динамический импорт:

```typescript
const FlowCanvas = dynamic(() => import('@/components/features/FlowCanvas'), {
  loading: () => <CanvasSkeleton />,
  ssr: false,
})
```

**Когда использовать:**

| Условие | Динамический импорт? |
|---------|---------------------|
| Компонент < 200 строк, нет тяжёлых зависимостей | Нет |
| Импортирует Three.js, D3, Recharts, Monaco | Да |
| Ниже сгиба (не виден при первой отрисовке) | Да |
| Используется в модальном окне/табе, открывающемся по клику | Да |
| Критичен для первой отрисовки (hero, навигация) | Нет |

---

## 5. Соглашение об именовании файлов

| Тип | Паттерн | Пример |
|-----|---------|--------|
| Компонент | PascalCase.tsx | `HeroSection.tsx` |
| Хук | camelCase.ts | `useTheme.ts` |
| Провайдер | PascalCase.tsx | `ThemeProvider.tsx` |
| Баррель | index.ts | `index.ts` |
| Типы | PascalCase.types.ts | `Button.types.ts` |
| Утилиты | camelCase.ts | `formatDate.ts` |

**Принцип co-location:** Хук, обслуживающий только одну фичу, живёт в той же директории, что и фича. Общие хуки идут в `hooks/`.

---

## 6. Обеспечение соблюдения

### 6.1. Конфигурация ESLint

```javascript
module.exports = {
  rules: {
    'max-lines': ['warn', { max: 250, skipBlankLines: true, skipComments: true }],
    'max-lines-per-function': ['warn', { max: 200, skipBlankLines: true, skipComments: true }],
    'react-hooks/exhaustive-deps': 'error',
  },
  overrides: [
    {
      files: ['**/components/**/*.tsx', '**/sections/**/*.tsx', '**/features/**/*.tsx'],
      rules: {
        'max-lines-per-function': ['error', { max: 150 }],
      },
    },
  ],
}
```

### 6.2. Обеспечение границ слоёв

```javascript
'boundaries/element-types': [
  'error',
  {
    default: 'allow',
    rules: [
      { from: 'ui', disallow: ['sections', 'features', 'hooks', 'providers'] },
      { from: 'sections', disallow: ['features', 'hooks', 'providers'] },
      { from: 'features', disallow: ['providers'] },
    ],
  },
]
```

### 6.3. Политика Code Review

Любое нарушение, не пойманное линтером — основание для **Request Changes**.

---

## 7. Стратегия рефакторинга

При обнаружении монолита (например, 1200-строчный `page.tsx`):

1. **Определить подкомпоненты** — Вынести функции, возвращающие JSX.
2. **Определить кластеры состояния** — Сгруппировать `useState`, вынести в хуки.
3. **Определить загрузку данных** — Перенести в хуки или Server Components.
4. **Классифицировать каждый** — sections/ (без состояния) или features/ (есть состояние).
5. **Добавить динамические импорты** — Для тяжёлых зависимостей.
6. **Создать баррель-экспорты** — Использовать явные экспорты.
7. **Проверить разделение слоёв** — Запустить проверку ESLint boundaries.
8. **Протестировать** — Убедиться в идентичном поведении.

**Результат:** 40-строчный `page.tsx`, компонующий тестируемые, переиспользуемые компоненты.

---

## 8. Чек-лист перед merge

- [ ] Файл меньше 250 строк (рекомендуется меньше 150)
- [ ] Ни один компонент не превышает 200 строк (рекомендуется меньше 150)
- [ ] Не более 3 `useState` на компонент (4+ -> кастомный хук)
- [ ] Нет прямых `fetch`/`axios` в Client Components
- [ ] У каждой директории с компонентами есть баррель `index.ts`
- [ ] Нет обратных импортов между слоями
- [ ] sections/ без состояния; features/ могут иметь состояние
- [ ] Тяжёлые компоненты используют динамические импорты
- [ ] Баррель-экспорты явные (не `export *`) для 10+ файлов
- [ ] Исключение задокументировано комментарием `[ANTI-MONOLITH EXCEPTION]`

---

## 9. Обработка исключений

Отклонения требуют:
1. Тикет Tech Debt (с тегом `tech-debt`)
2. Согласование с Tech Lead
3. Комментарий `[ANTI-MONOLITH EXCEPTION]` в коде

---

## 10. История версий

| Версия | Дата | Изменения |
|--------|------|-----------|
| 1.0 | 2023-10 | Первоначальная версия |
| 1.1 | 2023-10 | Добавлен лимит Page/Route (40 строк) |
| 1.2 | 2025-01 | Объединены паттерны anti-monolith, примеры, стратегия рефакторинга |
| 1.3 | 2025-01 | Добавлены Рекомендуемые/Жёсткие лимиты, различие sections/features, конфиг ESLint, правила динамических импортов, принцип co-location, формат документирования исключений |

---

Built with: Next.js 16 + TypeScript + Tailwind CSS
