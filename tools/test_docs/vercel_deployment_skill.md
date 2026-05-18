# Vercel Deployment Skill

Универсальный Skill для деплоя любых Next.js приложений на Vercel с автоматическими обновлениями.

## Описание

Этот skill помогает деплоить любое Next.js приложение на Vercel с CI/CD. Он полностью универсален и подходит для проектов:

- С БД (PostgreSQL, MySQL, MongoDB)
- Без БД (статические сайты)
- С environment variables
- Без environment variables
- С custom domain
- Без custom domain
- Используемых bun, npm, yarn, pnpm

## Когда использовать

GLM Code/GLM.ai будет автоматически использовать этот skill, когда вы упоминаете:

- "deploy to Vercel"
- "production deployment"
- "auto-updating website"
- "continuous deployment"
- "CI/CD for Next.js"
- "connect GitHub to production"
- "setup preview environments"
- "publish my Next.js app"

## Структура

```
skills/vercel-deployment/
├── SKILL.md          # Основные инструкции для GLM
└── README.md         # Этот файл - документация
```

## Быстрый старт для пользователя

### Использование в GLM Code/GLM.ai:

1. Skill уже интегрирован в систему
2. Просто спросите: "Помоги задеплоить мой Next.js проект на Vercel"
3. GLM автоматически:
   - Проанализирует ваш проект
   - Проверит готовность к деплою
   - Создаст инструкции, адаптированные под ваш проект
   - Учитает ваши технологии (БД, package manager и т.д.)

### Что нужно иметь:

- GitHub аккаунт (бесплатный)
- Next.js проект локально
- Git настроен

### Пример запроса:

```
У меня есть Next.js проект в папке /home/user/my-app. 
Я использую npm и PostgreSQL. 
Помоги мне задеплоить его на Vercel с автообновлением.
```

## Что делает этот Skill

### 1. Анализ проекта
- Проверяет `.gitignore`
- Убеждается, что build работает локально
- Проверяет наличие зависимостей

### 2. Создание GitHub репозитория
- Инструкции по созданию репозитория
- Подключение локального репозитория
- Первичный push

### 3. Деплой на Vercel
- Два варианта: CLI или Dashboard
- Автоопределение настроек Next.js
- Настройка build command и install command для разных package managers

### 4. Environment Variables
- Инструкции по добавлению секретов
- Безопасность (никогда не коммитить .env файлы)

### 5. База данных (опционально)
- Vercel Postgres (рекомендуется)
- Supabase (бесплатный вариант)
- Neon Serverless Postgres
- MongoDB Atlas
- Предупреждения про SQLite на production

### 6. Custom Domain (опционально)
- Настройка DNS записей
- Связывание домена с Vercel

### 7. Автообновления (CI/CD)
- GitHub Integration
- Preview deployments для PR
- Branch protection

### 8. Мониторинг и отладка
- Build logs
- Function logs
- Analytics
- Common issues and solutions

### 9. Rollback
- Простой откат к предыдущему деплою
- Git revert

## Преимущества универсального подхода

### По сравнению с VERCEL_DEPLOYMENT.md из проекта:

| Характеристика | VERCEL_DEPLOYMENT.md | Этот Skill |
|---------------|------------------------|------------|
| Универсальность | Только для конкретного проекта | Любой Next.js проект |
| База данных | Только SQLite/Postgres | Любая БД или без БД |
| Package Manager | Только bun | bun, npm, yarn, pnpm |
| Адаптивность | Фиксированные шаги | Опциональные разделы |
| Описание | Статичное | Pushy для лучшего триггера |

## Технические детали

### Размер и сложность:
- SKILL.md: ~450 строк (в пределах рекомендации <500)
- Читаемость: Высокая, с четкой структурой
- Уровень: Подходит для новичков и экспертов

### Подход к написанию:
- Объяснение "почему", а не просто "что"
- Императивная форма инструкций
- Примеры кода для каждого шага

## API Endpoints (для интеграции)

```typescript
POST /api/v1/deploy/create
GET /api/v1/deploy/status?id={deploymentId}
POST /api/v1/deploy/rollback
GET /api/v1/project/list
POST /api/v1/project/connect-repo
```

## Примеры кода

```typescript
export async function deployToVercel(projectPath: string): Promise<DeploymentResult> {
  const config = await analyzeProject(projectPath);
  const result = await vercel.deploy(config);
  return result;
}

export function getDeploymentStatus(deploymentId: string): Promise<Status> {
  return vercel.status(deploymentId);
}

export async function rollbackDeployment(deploymentId: string): Promise<RollbackResult> {
  const prev = await getPreviousDeployment(deploymentId);
  return vercel.promote(prev.id);
}

class VercelClient {
  constructor(private apiKey: string) {}
  
  async listProjects(): Promise<Project[]> {
    return this.fetch('/api/v1/project/list');
  }
}
```
