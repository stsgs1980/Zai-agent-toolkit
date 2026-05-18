# @stsgs/prompting

> Complete prompting library for AI-assisted development — techniques, frameworks, scoring, benchmarking, orchestration, resilience patterns, and behavioral instructions.

## Installation

```bash
# From GitHub
npm install https://github.com/stsgs1980/prompting-v0.0.git

# Or via git clone
git clone https://github.com/stsgs1980/prompting-v0.0.git
cd prompting-v0.0
npm install
npm run build
```

## Quick Start

```typescript
import {
  scorePrompt,
  matchIntent,
  withRetry,
  getInstructionContent,
} from '@stsgs/prompting'

// Score a prompt (6 dimensions, S/A/B/C/D/F grade)
const result = scorePrompt('Create a REST API for user authentication with JWT tokens')
console.log(result.overall)    // 'B'
console.log(result.numeric)    // 68
console.log(result.dimensions) // [{ name: 'Specificity', score: 85, grade: 'A', feedback: '...' }, ...]

// Match user intent
const intent = matchIntent('Build a login form with email validation')
console.log(intent.intent)       // 'code-generation'
console.log(intent.confidence)   // 72
console.log(intent.template)     // recommended prompt template

// Get behavioral instruction for LLM context injection
const rules = getInstructionContent('git-workflow-rules')
console.log(rules) // full markdown text, 1736 chars

// Retry with exponential backoff
const data = await withRetry(
  () => fetch('https://api.example.com/data').then(r => r.json()),
  { maxAttempts: 3, baseDelay: 1000 }
)
```

---

## Modules

### 1. Core (`core/`)

Types, techniques, frameworks, and system prompt builder.

#### Techniques — 20 prompting patterns

```typescript
import { getTechniques, getTechniquesForFormat, getTechniquesByDifficulty } from '@stsgs/prompting'

const all = getTechniques()                       // 20 items
const forJson = getTechniquesForFormat('json')     // techniques suited for JSON output
const beginner = getTechniquesByDifficulty('beginner') // easy to use
```

Available categories: `clarity`, `reasoning`, `constraint`, `role-play`, `formatting`, `meta`, `chain-of-thought`

#### Frameworks — 11 prompt engineering frameworks

```typescript
import { getFrameworks, buildFromFramework, getFrameworksByComplexity } from '@stsgs/prompting'

const all = getFrameworks()                        // 11 frameworks
const simple = getFrameworksByComplexity('simple')  // easy frameworks

// Build a prompt using CREATE framework
const prompt = buildFromFramework('create', {
  context: 'user authentication',
  requirements: ['JWT', 'refresh tokens', 'password hashing'],
})
```

Available: CREATE, TRACE, RISEC, RTF, CARE, SPARK, PREP, STAR, CHAT, CODE, AIDA

#### System Prompt Architect — 5-layer builder

```typescript
import {
  buildSystemPrompt,
  buildSystemPromptCustom,
  buildMinimalSystemPrompt,
  composeBlocks,
} from '@stsgs/prompting'

// Full 5-layer system prompt
const systemPrompt = buildSystemPrompt({
  role: 'Senior React Developer',
  domain: 'Frontend Development',
  audience: 'Junior developers',
  tone: 'professional',
  language: 'English',
  constraints: ['Use TypeScript', 'Follow accessibility guidelines'],
  outputFormat: 'code',
})

// Minimal (identity + output format only)
const minimal = buildMinimalSystemPrompt('Code Reviewer', 'markdown')
```

5 layers: `identity`, `context`, `constraints`, `output`, `behavior`

---

### 2. Templates (`templates/`)

Intent matching, agent roles, and flow templates.

#### Intent Matching — 12 intent types

```typescript
import { matchIntent, getIntentTypes } from '@stsgs/prompting'

const result = matchIntent('Explain how React hooks work')
// { intent: 'explanation', confidence: 78, keywords: ['explain', 'how'], template: '...' }
```

Available intents: `layout-advice`, `component-query`, `code-generation`, `code-review`, `debugging`, `explanation`, `translation`, `summarization`, `data-analysis`, `creative-writing`, `refactoring`, `testing`

#### Agent Roles — 12 predefined roles

```typescript
import { getAgentRoles, getBestAgentForIntent, getRoleSystemPrompt } from '@stsgs/prompting'

const best = getBestAgentForIntent('code-review')          // best role for this intent
const systemPrompt = getRoleSystemPrompt('code-reviewer')   // full system prompt
```

#### Flow Templates — 8 conversation flows

```typescript
import { getFlowTemplates, getFlowStepPrompt, shouldContinueFlow } from '@stsgs/prompting'

const stepPrompt = getFlowStepPrompt('iterative-development', 0, { task: 'Build auth API' })
const canContinue = shouldContinueFlow('iterative-development', 2, 1)
```

---

### 3. Evaluation (`evaluation/`)

Prompt quality assessment and comparison.

#### Scoring — 6 dimensions, S/A/B/C/D/F

```typescript
import { scorePrompt, quickScore, estimateTokens, getScoreDimensions } from '@stsgs/prompting'

// Full scoring
const result = scorePrompt('Your prompt text here')
console.log(result.overall)     // Grade: 'A'
console.log(result.numeric)     // Score: 85
console.log(result.dimensions)  // 6 dimensions with per-dim grade + feedback
console.log(result.suggestions) // improvement suggestions

// Quick score (0-100, no breakdown)
const score = quickScore('Your prompt')

// Token estimation (~1.3 tokens/word)
const tokens = estimateTokens('Your prompt text here')
```

Dimensions: Specificity (25%), Clarity (20%), Context (15%), Completeness (15%), Constraint Control (15%), Actionability (10%)

Grades: S (95+), A (80+), B (65+), C (50+), D (35+), F (<35)

#### Blind Comparison

```typescript
import { blindCompare, rankPrompts, findWeakestLink } from '@stsgs/prompting'

const comparison = blindCompare(promptA, promptB)
console.log(comparison.winner)  // 'a' | 'b' | 'tie'
console.log(comparison.reason)  // human-readable explanation

const ranked = rankPrompts([p1, p2, p3, p4])    // sorted by score
const weakest = findWeakestLink([p1, p2, p3])     // weakest prompt
```

#### Benchmark — CORE-EEAT 40 checks

```typescript
import { runBenchmark, quickBenchmark, getChecksByCategory } from '@stsgs/prompting'

const bench = runBenchmark('Create a login form with validation')
console.log(bench.passed)  // 25/40
console.log(bench.score)   // 62.5
console.log(bench.grade)   // 'C'

const quick = quickBenchmark('Create a login form')  // score + grade only
const clarity = getChecksByCategory('clarity')        // filter by category
```

Categories: clarity, specificity, context, structure, robustness, safety, style, completeness

---

### 4. Agents (`agents/`)

Cognitive formulas, orchestration patterns, and resilience utilities.

#### Cognitive Formulas — 20 reasoning patterns

```typescript
import { getCognitiveFormulas, getFormulasByCategory, applyFormula } from '@stsgs/prompting'

const all = getCognitiveFormulas()
const bias = getFormulasByCategory('bias-mitigation')
const enhanced = applyFormula('relevance', { topic: 'auth', context: 'React' })
```

Categories: bias-mitigation, reasoning-enhancement, creativity-boost, precision-focus, perspective-taking, memory-augmentation, self-critique, decomposition

#### Orchestration Patterns — 12 multi-agent topologies

```typescript
import { getOrchestrationPatterns, getPatternsByTopology, renderPatternSteps } from '@stsgs/prompting'

const all = getOrchestrationPatterns()
const parallel = getPatternsByTopology('parallel')
const steps = renderPatternSteps('fan-out-review', 'Build auth API')
```

Topologies: sequential, parallel, hierarchical, mesh, round-robin

#### Resilience — 8 utility functions

```typescript
import {
  withRetry,
  CircuitBreaker,
  withTimeout,
  withResilience,
  debounce,
  throttle,
  fallback,
  bulkhead,
} from '@stsgs/prompting'

// Retry with exponential backoff
const result = await withRetry(
  () => callLLM(prompt),
  { maxAttempts: 3, baseDelay: 1000, maxDelay: 30000 }
)

// Circuit breaker
const breaker = new CircuitBreaker({ failureThreshold: 5, recoveryTimeout: 30000 })
const result = await breaker.execute(() => callLLM(prompt))

// Combined: retry + timeout + circuit breaker
const result = await withResilience(
  () => callLLM(prompt),
  { retry: { maxAttempts: 3 }, circuit: { failureThreshold: 5 }, timeout: 30000 }
)

// Debounce (for live-preview / auto-save)
const debouncedSave = debounce((text: string) => saveDraft(text), 500)

// Throttle (rate-limited API calls)
const throttledCall = throttle(() => fetch('/api/check'), 1000)

// Fallback (primary -> secondary)
const data = await fallback(
  () => fetchPrimary(prompt),
  () => fetchSecondary(prompt),
  (err) => err.message.includes('502')
)

// Bulkhead (limit concurrent requests)
const limit3 = bulkhead(3)
const data = await limit3(() => fetch('/api/process'))
```

---

### 5. Instructions (`instructions.ts`)

Behavioral rules and architectural standards for AI agents.

```typescript
import {
  getAllInstructions,
  getInstructionMeta,
  getInstruction,
  getInstructionContent,
  getInstructionsByCategory,
  searchInstructions,
  getInstructionIds,
  getAllInstructionContent,
} from '@stsgs/prompting'

// Single instruction content (for LLM system prompt injection)
const gitRules = getInstructionContent('git-workflow-rules')
const langRule = getInstructionContent('language-rule')

// All instructions concatenated (12K chars)
const allRules = getAllInstructionContent()

// Search by keyword
const results = searchInstructions('sandbox')
// ['diagnostic-disclosure', 'git-workflow-rules', 'sandbox-rules']

// Filter by category
const behavioral = getInstructionsByCategory('instructions') // 6 entries
const architectural = getInstructionsByCategory('ai-rules')   // 4 entries
```

#### Available Instructions

| ID | Title | Category | Description |
|----|-------|----------|-------------|
| `diagnostic-disclosure` | Diagnostic Disclosure Rule | instructions | 5-step verification before declaring data loss |
| `git-workflow-rules` | Git Workflow Rules | instructions | 7 git rules for sandbox environments |
| `language-rule` | Language Rule | instructions | Always match user's language |
| `onboarding-protocol` | Onboarding Protocol | instructions | 6-step startup checklist for new sessions |
| `sandbox-rules` | Sandbox Rules | instructions | Z.ai filesystem, shell lifecycle, recovery |
| `writing-plans` | Writing Plans | instructions | Plan before coding for 4+ step tasks |
| `ai-rules-core` | AI Rules (Core) | ai-rules | 6-layer architecture, 7 anti-monolith rules |
| `ai-rules-enforcement` | ESLint Enforcement | ai-rules | eslint-plugin-stsgs configuration |
| `ai-rules-library` | Library Rules | ai-rules | Component quality checklist, collections |
| `ai-rules-project` | Project Rules Template | ai-rules | Project-specific rules template |

---

## Full API Reference

### Types (27 exported)

```typescript
import type {
  PromptContext, PromptTone, OutputFormat, PromptBlock, SystemPromptLayer,
  PromptTechnique, TechniqueCategory, PromptFramework, FrameworkStep,
  IntentType, IntentMatch, AgentRole,
  FlowStep, FlowValidation, FlowTemplate,
  Grade, PromptScore, ScoreDimension, BlindCompareResult, BenchmarkResult, BenchmarkCheck,
  CognitiveFormula, CognitiveCategory,
  OrchestrationPattern, OrchestrationStep,
  RetryConfig, CircuitState, ResilienceResult,
  InstructionCategory, InstructionMeta, InstructionEntry,
} from '@stsgs/prompting'
```

### Functions (60+ exported)

| Function | Returns | Description |
|----------|---------|-------------|
| `scorePrompt(prompt)` | `PromptScore` | Full 6-dimension scoring |
| `quickScore(prompt)` | `number` | Quick 0-100 score |
| `estimateTokens(text)` | `number` | Token count estimate |
| `matchIntent(prompt)` | `IntentMatch` | Classify user intent |
| `getTechniques()` | `PromptTechnique[]` | All 20 techniques |
| `getFrameworks()` | `PromptFramework[]` | All 11 frameworks |
| `buildSystemPrompt(ctx)` | `string` | 5-layer system prompt |
| `buildFromFramework(id, vars)` | `string` | Prompt from framework |
| `runBenchmark(prompt)` | `BenchmarkResult` | 40-check quality audit |
| `blindCompare(a, b)` | `BlindCompareResult` | Compare two prompts |
| `getCognitiveFormulas()` | `CognitiveFormula[]` | All 20 formulas |
| `getOrchestrationPatterns()` | `OrchestrationPattern[]` | All 12 patterns |
| `withRetry(fn, config)` | `ResilienceResult<T>` | Retry with backoff |
| `CircuitBreaker` | `class` | Circuit breaker pattern |
| `debounce(fn, ms)` | `function` | Debounce utility |
| `throttle(fn, ms)` | `function` | Throttle utility |
| `fallback(primary, secondary)` | `Promise<T>` | Failover pattern |
| `bulkhead(n)` | `function` | Concurrency limiter |
| `getInstructionContent(id)` | `string` | Instruction text by ID |
| `getAllInstructionContent()` | `string` | All instructions (12K chars) |
| `searchInstructions(query)` | `InstructionEntry[]` | Search by keyword |

## Stats

| Metric | Value |
|--------|-------|
| Source files | 15 |
| Source lines | 4304 |
| Exported types | 27 |
| Exported functions | 60+ |
| Techniques | 20 |
| Frameworks | 11 |
| Intent types | 12 |
| Agent roles | 12 |
| Flow templates | 8 |
| Benchmark checks | 40 |
| Cognitive formulas | 20 |
| Orchestration patterns | 12 |
| Resilience utilities | 8 |
| Instructions | 10 |
| Total instruction content | 12136 chars |

## Source Repository

This package is part of the [UI-Kit](https://github.com/stsgs1980/UI-Kit) monorepo. Source files live at `src/lib/prompting/`.

## License

MIT
