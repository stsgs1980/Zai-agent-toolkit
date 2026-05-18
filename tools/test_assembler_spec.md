# Instruction Assembler + MD Skill Assembler (Enhanced)

Роль
Ты - senior full-stack разработчик, специализирующийся на Next.js 16, TypeScript, Radix UI, Prompt Engineering и создании современных AI-инструментов с продвинутым UX.

## Ключевые требования пользователя

### 1. Продвинутый Layout

Текущая проблема: Стандартный layout не устраивает
Решение: Многооконный интерфейс с кастомизацией

Layout варианты:

```
┌─────────────────────────────────────────────────────────────────┐
│  Header: Logo + Search + Command Palette + Settings + Profile   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┬──────────────────────────┬─────────────────┐  │
│  │             │                          │                 │  │
│  │  Explorer   │     Editor Area          │  Preview/Docs  │  │
│  │             │                          │                 │  │
│  │  [Skills]   │  ┌────────────────────┐  │  ┌───────────┐  │  │
│  │  [Modules]  │  │                    │  │  │           │  │  │
│  │  [History]  │  │  Rich Text Editor  │  │  │  Rendered  │  │  │
│  │             │  │  with AI Assist    │  │  │  Output   │  │  │
│  │  Tree View  │  │                    │  │  │           │  │  │
│  │             │  │  ┌────────────────┤  │  └───────────┘  │  │
│  │  - skills/  │  │  │ AI Chat/Review│  │                 │  │
│  │    - fe/    │  │  │ (bottom pane) │  │  ┌───────────┐  │  │
│  │    - be/    │  │  └────────────────┤  │  │ Metrics & │  │  │
│  │  - modules/ │  └────────────────────┘  │  │ Insights  │  │  │
│  │    - roles/ │                          │  └───────────┘  │  │
│  │             │                          │                 │  │
│  └─────────────┴──────────────────────────┴─────────────────┘  │
│                                                                  │
│  Footer: Status bar with document info, AI analysis, errors     │
└─────────────────────────────────────────────────────────────────┘
```

Альтернативные layout'ы:

- Focus Mode: Одна центральная панель, остальные collapsible
- Split View: Два редактора side-by-side для сравнения
- Presentation: Full-screen preview с minimal controls
- Custom: Пользователь может перетаскивать панели (dockable)

### 2. Продвинутый редактор скиллов/инструкций

Требования:

- Выбор части/блоков скилла
- Inline редактирование
- Chunk-based редактирование
- WYSIWYG с preview

Функционал редактора:

```typescript
interface SkillEditor {
  // Выбор блоков для включения
  selectBlocks(skillId: string, blockIds: string[]): void;

  // Inline редактирование
  editInline(blockId: string, content: string): void;

  // Chunk операции
  splitBlock(blockId: string, position: number): void;
  mergeBlocks(blockId1: string, blockId2: string): void;
  reorderBlocks(blockIds: string[]): void;

  // AI Assist
  improveBlock(blockId: string): Promise<string>;
  expandBlock(blockId: string): Promise<string>;
  summarizeBlock(blockId: string): Promise<string>;

  // Визуальный редактор
  toggleVisualMode(): void;
}
```

Компоненты редактора:

**BlockSelector** - Выбор отдельных секций скилла

- Чекбоксы рядом с каждым заголовком
- Мультиселект с shift/ctrl
- Выбор по диапазону

**InlineEditor** - Редактирование на месте

- ContentEditable или Monaco Editor
- Синтаксис highlighting для Markdown
- Auto-save каждые N секунд

**ChunkEditor** - Работа с кусками

- Drag & drop для реордеринга
- Split/Merge кнопки
- Duplicate/Delete операции

**VisualEditor** - WYSIWYG режим

- Что видишь, то получишь
- Toolbar с форматированием
- Таблицы, списки, код блоки

### 3. AI-оценка и рекомендации

Метрики качества:

```typescript
interface DocumentAnalysis {
  // Количественные метрики
  metrics: {
    length: number;              // Длина в токенах
    readabilityScore: number;    // 0-100
    coverageScore: number;       // Покрытие задачи
    relevanceScore: number;      // Релевантность
    complexityScore: number;     // Сложность
  };

  // AI-оценка
  aiAssessment: {
    overallQuality: number;      // 0-100
    strengths: string[];         // Сильные стороны
    weaknesses: string[];        // Слабые стороны
    suggestions: Suggestion[];   // Рекомендации
  };

  // Обоснование выбора
  justification: {
    selectedSkills: SkillJustification[];
    selectedModules: ModuleJustification[];
    alternativeOptions: AlternativeOption[];
  };

  // Conflict Detection
  conflicts: Conflict[];
  warnings: Warning[];
  info: Info[];
}

interface Suggestion {
  type: 'improvement' | 'addition' | 'removal' | 'restructure';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reasoning: string;             // Почему это рекомендуют
  impact: string;                // Что это улучшит
  example?: string;              // Пример применения
  estimatedEffort: string;       // Оценка усилий
}

interface SkillJustification {
  skillId: string;
  skillName: string;
  relevanceScore: number;        // 0-100
  matchReasons: string[];        // Почему подходит
  missingAspects: string[];      // Что не покрывает
  overlapsWith: string[];        // Дублируется с
  confidence: number;            // Уверенность выбора
}

interface Conflict {
  id: string;
  type: 'contradiction' | 'reundancy' | 'gap' | 'inconsistency';
  severity: 'error' | 'warning' | 'info';
  description: string;
  affectedItems: string[];       // Какие скиллы/модули
  suggestedResolution: string;
  autoFixAvailable: boolean;
}
```

AI-функции:

```typescript
// Анализ документа
async function analyzeDocument(
  assembledDocument: string,
  originalTask: string,
  selectedItems: SelectableItem[]
): Promise<DocumentAnalysis>;

// Генерация рекомендаций
async function generateRecommendations(
  document: string,
  analysis: DocumentAnalysis
): Promise<Suggestion[]>;

// Объяснение выбора
async function explainSelection(
  item: SelectableItem,
  task: string
): Promise<string>;

// Auto-fix конфликтов
async function fixConflict(
  conflictId: string
): Promise<FixResult>;
```

Визуализация анализа:

- Радары/спайдеры для метрик
- Цветовая кодировка (зеленый/желтый/красный)
- Progress bars для scores
- Expandable секции для деталей
- Actionable кнопки на рекомендациях ("Apply", "Dismiss", "Snooze")

### 4. Дополнительные функции

#### A. Интерактивность

- Drag & Drop везде (скиллы, блоки, панели)
- Live Search с мгновенной фильтрацией
- Keyboard Shortcuts (Cmd+K для command palette)
- Context Menu (правый клик)
- Tooltips с подробной информацией
- Micro-interactions (hover, click, loading)
- Real-time Collaboration (будущее)

#### B. История и версии

```typescript
interface DocumentVersion {
  id: string;
  timestamp: Date;
  author: string;
  description: string;
  changes: Change[];
  metrics: DocumentMetrics;
  tags: string[];
}

interface Change {
  type: 'add' | 'remove' | 'modify' | 'reorder';
  itemId: string;
  itemName: string;
  before?: string;
  after?: string;
}

// Функции
function createVersion(description: string): void;
function restoreVersion(versionId: string): void;
function compareVersions(v1: string, v2: string): Diff;
function getVersionHistory(): DocumentVersion[];
```

Визуализация истории:

- Timeline view
- Diff view (side-by-side или unified)
- Rollback кнопка
- Branching (будущее)

#### C. Интеграции

- GitHub/GitLab - сохранение версий
- Notion/Obsidian - экспорт документов
- OpenAI/Anthropic - AI-оценка
- Slack/Discord - уведомления
- Zapier - automation
- Webhooks - кастомные интеграции

#### D. Power User Features

- Command Palette (Cmd+K)
- Snippet Manager - быстрые вставки
- Macro Recorder - запись действий
- Custom Keybindings
- Themes - dark/light/custom
- Workspace Profiles - преднастройки
- CLI Integration - работа из терминала

## Обновленная архитектура

### Новые компоненты

```
src/
├── app/
│   ├── workspaces/                    # Workspace-based routing
│   │   └── [workspaceId]/
│   │       └── page.tsx               # Main workspace page
│   │
│   └── api/
│       ├── analysis/
│       │   └── v1/
│       │       └── route.ts          # AI analysis endpoint
│       ├── versions/
│       │   └── v1/
│       │       └── route.ts          # Version control API
│       └── integrations/
│           └── v1/
│               └── route.ts          # Integrations API
│
├── components/
│   ├── workspace/
│   │   ├── WorkspaceLayout.tsx       # Customizable layout
│   │   ├── PanelManager.tsx          # Panel drag/dock
│   │   ├── Explorer.tsx              # File/skill explorer
│   │   └── StatusBar.tsx             # Footer status bar
│   │
│   ├── editor/
│   │   ├── SkillEditor.tsx           # Main editor
│   │   ├── BlockSelector.tsx         # Select blocks
│   │   ├── InlineEditor.tsx          # Inline editing
│   │   ├── ChunkEditor.tsx           # Chunk operations
│   │   ├── VisualEditor.tsx          # WYSIWYG mode
│   │   └── AIAssistant.tsx           # AI assist panel
│   │
│   ├── analysis/
│   │   ├── DocumentAnalysis.tsx      # Main analysis panel
│   │   ├── MetricsDashboard.tsx      # Visual metrics
│   │   ├── SuggestionsPanel.tsx      # AI recommendations
│   │   ├── JustificationView.tsx     # Why items selected
│   │   └── ConflictResolver.tsx      # Fix conflicts
│   │
│   ├── history/
│   │   ├── VersionHistory.tsx        # Timeline view
│   │   ├── DiffViewer.tsx            # Compare versions
│   │   └── RollbackModal.tsx         # Restore version
│   │
│   ├── command-palette/
│   │   ├── CommandPalette.tsx        # Cmd+K palette
│   │   └── CommandRegistry.tsx       # Available commands
│   │
│   └── integrations/
│       ├── IntegrationManager.tsx    # Manage integrations
│       └── WebhookConfig.tsx         # Configure webhooks
│
└── lib/
    ├── editor/
    │   ├── block-manager.ts         # Block operations
    │   ├── chunk-operations.ts      # Split/merge
    │   └── ai-assist.ts             # AI helpers
    │
    ├── analysis/
    │   ├── document-analyzer.ts     # Analyze document
    │   ├── metrics-calculator.ts    # Compute metrics
    │   ├── conflict-detector.ts     # Find conflicts
    │   └── recommendation-engine.ts # Generate suggestions
    │
    ├── history/
    │   ├── version-manager.ts       # Version control
    │   ├── diff-generator.ts        # Generate diffs
    │   └── branch-manager.ts        # Branching
    │
    └── integrations/
        ├── github.ts                # GitHub integration
        ├── openai.ts                # OpenAI integration
        └── webhook-manager.ts       # Webhook system
```

## Детальная спецификация новых функций

### 1. Workspace Layout System

WorkspaceLayout.tsx:

```typescript
interface WorkspaceLayout {
  // Layout конфигурация
  layout: {
    type: 'three-panel' | 'focus' | 'split' | 'custom';
    panels: Panel[];
    activePanel: string;
    sizes: Record<string, number>;   // Ширина/высота панелей
  };

  // Управление панелями
  addPanel(panel: Panel): void;
  removePanel(panelId: string): void;
  resizePanel(panelId: string, size: number): void;
  movePanel(panelId: string, newPosition: Position): void;
  dockPanel(panelId: string, dockArea: DockArea): void;
  splitPanel(panelId: string, direction: 'horizontal' | 'vertical'): void;

  // Presets
  saveLayoutPreset(name: string): void;
  loadLayoutPreset(name: string): void;
  resetToDefault(): void;
}

interface Panel {
  id: string;
  type: 'explorer' | 'editor' | 'preview' | 'analysis' | 'chat';
  title: string;
  component: React.ComponentType;
  resizable: boolean;
  collapsible: boolean;
  closable: boolean;
}
```

Управление состоянием:

- Zustand для global state
- LocalStorage для персистентности
- Undo/redo для layout изменений

### 2. Block Selection System

BlockSelector.tsx:

```typescript
interface BlockSelector {
  // Дерево блоков скилла
  skillBlocks: SkillBlock[];

  // Выбор
  selectedBlocks: Set<string>;
  toggleBlock(blockId: string): void;
  selectRange(fromId: string, toId: string): void;
  selectAll(): void;
  deselectAll(): void;

  // Фильтрация
  filterByType(type: BlockType): void;
  filterByKeyword(keyword: string): void;
  filterByLength(min: number, max: number): void;

  // Preview
  previewBlock(blockId: string): string;
  previewSelected(): string;
}

interface SkillBlock {
  id: string;
  type: 'header' | 'content' | 'code' | 'list' | 'table';
  level: number;                    // Для header
  content: string;
  metadata: {
    length: number;
    tokens: number;
    keywords: string[];
  };
  selectable: boolean;
}
```

### 3. AI Analysis Engine

document-analyzer.ts:

```typescript
class DocumentAnalyzer {
  // Основной анализ
  async analyze(
    document: string,
    task: string,
    context: AnalysisContext
  ): Promise<DocumentAnalysis> {

    // 1. Количественные метрики
    const metrics = await this.calculateMetrics(document);

    // 2. AI-оценка (через OpenAI/Anthropic)
    const aiAssessment = await this.getAIAssessment(document, task);

    // 3. Обоснование выбора
    const justification = await this.generateJustification(
      context.selectedItems,
      task
    );

    // 4. Conflict detection
    const conflicts = await this.detectConflicts(document);

    return { metrics, aiAssessment, justification, conflicts };
  }
}
```

### 4. Version History System

version-manager.ts:

```typescript
class VersionManager {
  private versions: DocumentVersion[] = [];
  private currentBranch: string = 'main';

  // Создать версию
  async createVersion(
    workspaceId: string,
    description: string,
    author: string
  ): Promise<DocumentVersion> {
    const currentState = await this.getCurrentState(workspaceId);

    const version: DocumentVersion = {
      id: this.generateId(),
      timestamp: new Date(),
      author,
      description,
      changes: await this.detectChanges(currentState, this.getPreviousState()),
      metrics: await this.analyzer.calculateMetrics(currentState.document),
      tags: await this.generateTags(currentState)
    };

    this.versions.push(version);
    await this.saveToDatabase(version);

    return version;
  }

  // Сравнить версии
  async compareVersions(v1Id: string, v2Id: string): Promise<Diff> {
    const v1 = await this.getVersion(v1Id);
    const v2 = await this.getVersion(v2Id);

    return {
      document: this.diffText(v1.document, v2.document),
      selectedItems: this.diffArrays(v1.selectedItems, v2.selectedItems),
      metrics: this.diffMetrics(v1.metrics, v2.metrics)
    };
  }

  // Откатиться
  async restoreVersion(
    workspaceId: string,
    versionId: string
  ): Promise<void> {
    const version = await this.getVersion(versionId);

    await this.restoreDocument(workspaceId, version.document);
    await this.restoreSelection(workspaceId, version.selectedItems);
    await this.restoreMetrics(workspaceId, version.metrics);

    // Создать новую версию "Restored from v{versionId}"
    await this.createVersion(
      workspaceId,
      `Restored from ${versionId}`,
      'System'
    );
  }
}
```

### 5. Command Palette

CommandPalette.tsx:

```typescript
interface Command {
  id: string;
  label: string;
  description: string;
  icon: string;                      // Lucide icon name
  shortcut: string;                  // e.g., "Cmd+Shift+S"
  category: 'file' | 'edit' | 'view' | 'tools' | 'help';
  action: () => void | Promise<void>;
  when?: () => boolean;              // Условие видимости
}

// Команды
const commands: Command[] = [
  {
    id: 'new-workspace',
    label: 'New Workspace',
    description: 'Create a new workspace',
    icon: 'Plus',
    shortcut: 'Cmd+N',
    category: 'file',
    action: () => createWorkspace()
  },
  {
    id: 'save-version',
    label: 'Save Version',
    description: 'Create a version snapshot',
    icon: 'Save',
    shortcut: 'Cmd+Shift+S',
    category: 'file',
    action: () => saveVersion()
  },
  {
    id: 'find-skills',
    label: 'Find Skills',
    description: 'Search for skills by keyword',
    icon: 'Search',
    shortcut: 'Cmd+Shift+F',
    category: 'edit',
    action: () => openSearch()
  },
  {
    id: 'analyze-document',
    label: 'Analyze Document',
    description: 'Run AI analysis on current document',
    icon: 'Sparkles',
    shortcut: 'Cmd+Shift+A',
    category: 'tools',
    action: () => analyzeDocument()
  },
  {
    id: 'toggle-explorer',
    label: 'Toggle Explorer',
    description: 'Show/hide explorer panel',
    icon: 'Sidebar',
    shortcut: 'Cmd+B',
    category: 'view',
    action: () => togglePanel('explorer')
  },
  {
    id: 'focus-mode',
    label: 'Focus Mode',
    description: 'Enter distraction-free mode',
    icon: 'Maximize',
    shortcut: 'Cmd+Shift+F',
    category: 'view',
    action: () => enableFocusMode()
  },
  {
    id: 'ai-assist',
    label: 'AI Assistant',
    description: 'Open AI assistant panel',
    icon: 'Bot',
    shortcut: 'Cmd+I',
    category: 'tools',
    action: () => openAIAssistant()
  },
  {
    id: 'conflict-resolver',
    label: 'Conflict Resolver',
    description: 'Check and fix conflicts',
    icon: 'AlertTriangle',
    shortcut: 'Cmd+Shift+C',
    category: 'tools',
    action: () => openConflictResolver()
  }
];
```

## Обновленный UI/UX дизайн

### Color Scheme

```typescript
const colors = {
  // Status colors
  success: 'text-green-500 bg-green-500/10',
  warning: 'text-yellow-500 bg-yellow-500/10',
  error: 'text-red-500 bg-red-500/10',
  info: 'text-blue-500 bg-blue-500/10',

  // Score colors
  excellent: 'text-green-500',
  good: 'text-lime-500',
  fair: 'text-yellow-500',
  poor: 'text-orange-500',
  bad: 'text-red-500',

  // Panel backgrounds
  panel: 'bg-card/50 backdrop-blur-md',
  panelActive: 'bg-card/80 backdrop-blur-lg',
  panelBorder: 'border-border/50',
};
```

### Анимации

```typescript
// Panel transitions
const panelAnimations = {
  open: {
    scale: [0.95, 1],
    opacity: [0, 1],
    transition: { duration: 0.2, ease: 'easeOut' }
  },
  close: {
    scale: [1, 0.95],
    opacity: [1, 0],
    transition: { duration: 0.15, ease: 'easeIn' }
  }
};

// Micro-interactions
const hoverEffect = {
  scale: 1.02,
  transition: { duration: 0.1 }
};

// Loading states
const loadingSpinner = {
  rotate: 360,
  transition: {
    repeat: Infinity,
    duration: 1,
    ease: 'linear'
  }
};
```

## API Endpoints

### Analysis API

```
POST /api/analysis/v1/analyze
{
  "document": string,
  "task": string,
  "selectedItems": SelectableItem[]
}
→ DocumentAnalysis

POST /api/analysis/v1/recommendations
{
  "document": string,
  "analysis": DocumentAnalysis
}
→ Suggestion[]

POST /api/analysis/v1/fix-conflict
{
  "conflictId": string,
  "autoFix": boolean
}
→ FixResult
```

### Version History API

```
POST /api/versions/v1/create
{
  "workspaceId": string,
  "description": string,
  "author": string
}
→ DocumentVersion

GET /api/versions/v1/history?workspaceId={id}
→ DocumentVersion[]

POST /api/versions/v1/restore
{
  "workspaceId": string,
  "versionId": string
}
→ void

GET /api/versions/v1/compare?v1={id1}&v2={id2}
→ Diff
```

### Integrations API

```
GET /api/integrations/v1/list
→ Integration[]

POST /api/integrations/v1/connect
{
  "type": "github" | "openai" | "webhook",
  "config": Record<string, any>
}
→ Integration

DELETE /api/integrations/v1/{integrationId}
→ void
```

## План реализации

### Phase 1: Foundation (Setup)

- Инициализация Next.js 16 проекта
- Установка зависимостей: @monaco-editor/react, zustand, date-fns, lodash
- Настройка shadcn/ui компонентов
- Создание структуры директорий

### Phase 2: Workspace Layout System

- WorkspaceLayout компонент
- PanelManager с drag & drop
- Layout presets
- Persistence в localStorage
- Команды для управления панелями

### Phase 3: Enhanced Editor

- SkillEditor с block selection
- InlineEditor (Monaco)
- ChunkEditor (split/merge/reorder)
- VisualEditor (WYSIWYG)
- AI Assistant panel

### Phase 4: AI Analysis Engine

- document-analyzer.ts
- metrics-calculator.ts
- conflict-detector.ts
- recommendation-engine.ts
- API endpoints для анализа
- UI компоненты для визуализации

### Phase 5: Version History

- version-manager.ts
- diff-generator.ts
- VersionHistory UI (timeline)
- DiffViewer UI
- Rollback функционал

### Phase 6: Command Palette

- CommandRegistry
- CommandPalette UI
- Keyboard shortcuts
- Command execution

### Phase 7: Integrations

- IntegrationManager UI
- GitHub integration
- OpenAI integration
- Webhook system

### Phase 8: Polish & Testing

- Unit тесты
- Integration тесты
- E2E тесты (Playwright)
- Performance оптимизация
- Документация
