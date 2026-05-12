# Стандарт обработки ошибок v1.0

**ID стандарта:** STD-ERR-001
**Версия:** 1.0
**Статус:** Активен
**Применяется к:** Всем проектам с кодом

---

## 1. Классификация ошибок

### 1.1 Иерархия типов ошибок

```
Error
├── ApplicationError (База для всех ошибок приложения)
│   ├── ValidationError
│   │   ├── SchemaValidationError
│   │   └── BusinessRuleViolationError
│   ├── AuthenticationError
│   │   ├── InvalidCredentialsError
│   │   ├── TokenExpiredError
│   │   └── SessionExpiredError
│   ├── AuthorizationError
│   │   ├── PermissionDeniedError
│   │   └── RoleNotFoundError
│   ├── NotFoundError
│   │   ├── ResourceNotFoundError
│   │   └── RouteNotFoundError
│   ├── ConflictError
│   │   ├── DuplicateEntryError
│   │   └── VersionMismatchError
│   ├── RateLimitError
│   ├── ExternalServiceError
│   │   ├── DatabaseError
│   │   ├── CacheError
│   │   └── ThirdPartyAPIError
│   └── InternalError
└── SystemError (Неожиданные, невосстановимые)
```

### 1.2 Категории ошибок

| Категория | HTTP статус | Восстановимо | Сообщение пользователю |
|-----------|-------------|--------------|----------------------|
| Validation | 400 | Да | Показать ошибки конкретных полей |
| Authentication | 401 | Да | Запросить логин |
| Authorization | 403 | Нет | Показать сообщение о правах |
| Not Found | 404 | Нет | Показать сообщение "не найдено" |
| Conflict | 409 | Да | Запросить разрешение |
| Rate Limit | 429 | Да | Показать время повторной попытки |
| Server Error | 500 | Нет | Общая ошибка, логировать детали |
| Service Unavailable | 503 | Да | Показать опцию повторной попытки |

---

## 2. Структура объекта ошибки

### 2.1 Стандартный интерфейс ошибки

```typescript
// types/errors.ts
interface ApplicationError {
  // Идентификация
  id: string;           // Уникальный ID ошибки для отслеживания
  code: string;         // Машинно-читаемый код (напр., 'USER_NOT_FOUND')
  name: string;         // Имя класса ошибки

  // Контекст
  message: string;      // Дружелюбное сообщение для пользователя
  details?: unknown;    // Дополнительный контекст

  // Отладка
  stack?: string;       // Стек-трейс (только dev)
  cause?: Error;        // Исходная ошибка (для обёртки)

  // HTTP
  statusCode: number;   // HTTP статус-код

  // Метаданные
  timestamp: string;    // ISO 8601
  path?: string;        // Путь запроса
  requestId?: string;   // ID корреляции запроса

  // Восстановление
  recoverable: boolean;
  retryAfter?: number;  // Секунды до повторной попытки
  helpUrl?: string;     // Ссылка на документацию
}
```

### 2.2 Реализация ошибки

```typescript
// lib/errors/base.ts
export class ApplicationError extends Error {
  public readonly id: string;
  public readonly code: string;
  public readonly statusCode: number;
  public readonly timestamp: string;
  public readonly recoverable: boolean;
  public readonly details?: unknown;
  public readonly cause?: Error;

  constructor({
    code,
    message,
    statusCode = 500,
    recoverable = false,
    details,
    cause,
  }: ErrorConfig) {
    super(message);
    this.name = this.constructor.name;
    this.id = generateErrorId();
    this.code = code;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
    this.recoverable = recoverable;
    this.details = details;
    this.cause = cause;

    // Сохранить правильный стек-трейс
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): ApplicationErrorJSON {
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      recoverable: this.recoverable,
      ...(process.env.NODE_ENV === 'development' && {
        stack: this.stack,
        cause: this.cause?.message,
      }),
    };
  }
}
```

### 2.3 Специфичные классы ошибок

```typescript
// lib/errors/index.ts
export class ValidationError extends ApplicationError {
  constructor(message: string, details?: FieldError[]) {
    super({
      code: 'VALIDATION_ERROR',
      message,
      statusCode: 400,
      recoverable: true,
      details,
    });
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string, identifier?: string | number) {
    super({
      code: 'NOT_FOUND',
      message: `${resource} не найден`,
      statusCode: 404,
      recoverable: false,
      details: { resource, identifier },
    });
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message = 'Требуется аутентификация') {
    super({
      code: 'AUTHENTICATION_ERROR',
      message,
      statusCode: 401,
      recoverable: true,
    });
  }
}

export class RateLimitError extends ApplicationError {
  constructor(retryAfter: number) {
    super({
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Слишком много запросов. Попробуйте позже.',
      statusCode: 429,
      recoverable: true,
      retryAfter,
    });
  }
}

export class ExternalServiceError extends ApplicationError {
  constructor(service: string, cause?: Error) {
    super({
      code: 'EXTERNAL_SERVICE_ERROR',
      message: `Сервис ${service} временно недоступен`,
      statusCode: 503,
      recoverable: true,
      details: { service },
      cause,
    });
  }
}
```

---

## 3. Паттерны try-catch

### 3.1 Базовый паттерн

```typescript
// ✅ Хорошо: Специфичная обработка ошибок
async function getUser(id: string): Promise<User> {
  try {
    const user = await db.users.find(id);
    if (!user) {
      throw new NotFoundError('Пользователь', id);
    }
    return user;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error; // Перебросить известные ошибки
    }
    if (error instanceof DatabaseError) {
      throw new ExternalServiceError('База данных', error);
    }
    throw new InternalError('Не удалось получить пользователя', error);
  }
}

// ❌ Плохо: Глушение ошибок
async function getUser(id: string) {
  try {
    return await db.users.find(id);
  } catch (e) {
    console.error(e);
    return null; // Потеря информации!
  }
}
```

### 3.2 Обёртка ошибок

```typescript
// Обёртывать внешние ошибки с контекстом
async function processPayment(order: Order): Promise<PaymentResult> {
  try {
    return await stripe.charges.create({
      amount: order.total,
      currency: 'usd',
    });
  } catch (error) {
    if (error instanceof StripeCardError) {
      throw new ValidationError('Платёж отклонён', {
        field: 'card',
        message: error.message,
      });
    }

    if (error instanceof StripeAPIError) {
      throw new ExternalServiceError('Stripe', error);
    }

    throw new InternalError('Ошибка обработки платежа', {
      orderId: order.id,
      cause: error,
    });
  }
}
```

### 3.3 Паттерн Result (Альтернатива)

```typescript
// Для операций, где ожидается неудача
type Result<T, E = Error> = Success<T> | Failure<E>;

interface Success<T> {
  ok: true;
  value: T;
}

interface Failure<E> {
  ok: false;
  error: E;
}

function success<T>(value: T): Success<T> {
  return { ok: true, value };
}

function failure<E>(error: E): Failure<E> {
  return { ok: false, error };
}

// Использование
function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return failure('Деление на ноль');
  }
  return success(a / b);
}

// Обработка
const result = divide(10, 2);
if (result.ok) {
  console.log(result.value); // 5
} else {
  console.error(result.error);
}
```

---

## 4. Стандарты логирования

### 4.1 Уровни логов

| Уровень | Когда использовать | Содержит |
|---------|-------------------|----------|
| DEBUG | Детали разработки | Стек-трейсы, переменные |
| INFO | Бизнес-события | Действия пользователей, изменения состояния |
| WARN | Восстановимые проблемы | Деградация сервиса, фоллбэки |
| ERROR | Сбои, требующие внимания | Полный контекст ошибки |
| FATAL | Невосстановимые | Состояние системы, немедленные действия |

### 4.2 Структурированное логирование

```typescript
// lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: ['req.headers.authorization', 'req.body.password'],
});

// Использование
logger.info({
  event: 'user_created',
  userId: user.id,
  email: user.email,
  source: 'registration',
}, 'Учётная запись пользователя создана');

logger.error({
  event: 'payment_failed',
  orderId: order.id,
  error: {
    code: error.code,
    message: error.message,
    stack: error.stack,
  },
}, 'Ошибка обработки платежа');
```

### 4.3 Обогащение контекста ошибки

```typescript
// middleware/error-logger.ts
export function errorLogger(error: Error, req: Request, res: Response, next: NextFunction) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: {
      id: error instanceof ApplicationError ? error.id : generateErrorId(),
      code: error instanceof ApplicationError ? error.code : 'UNKNOWN_ERROR',
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      headers: sanitizeHeaders(req.headers),
      ip: req.ip,
      userAgent: req.get('user-agent'),
    },
    user: req.user ? { id: req.user.id, role: req.user.role } : null,
    environment: process.env.NODE_ENV,
  };

  logger.error(errorLog, 'Ошибка запроса');

  next(error);
}
```

---

## 5. Ответы API с ошибками

### 5.1 Стандартный формат ответа

```typescript
// Успешный ответ
{
  "success": true,
  "data": { ... }
}

// Ответ с ошибкой
{
  "success": false,
  "error": {
    "id": "err_abc123",
    "code": "VALIDATION_ERROR",
    "message": "Неверные входные данные",
    "details": [
      {
        "field": "email",
        "message": "Неверный формат email"
      },
      {
        "field": "password",
        "message": "Пароль должен содержать минимум 8 символов"
      }
    ],
    "recoverable": true,
    "retryAfter": null,
    "helpUrl": "https://docs.example.com/errors/validation"
  }
}
```

### 5.2 Middleware обработки ошибок

```typescript
// middleware/error-handler.ts
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Обработка известных ошибок приложения
  if (error instanceof ApplicationError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.toJSON(),
    });
  }

  // Обработка известных внешних ошибок
  if (error instanceof ZodError) {
    const validationError = new ValidationError(
      'Неверные входные данные',
      error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }))
    );
    return res.status(400).json({
      success: false,
      error: validationError.toJSON(),
    });
  }

  // Обработка неожиданных ошибок
  logger.fatal({
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    request: {
      method: req.method,
      path: req.path,
    },
  }, 'Необработанная ошибка');

  // Не утекать внутренние детали
  return res.status(500).json({
    success: false,
    error: {
      id: generateErrorId(),
      code: 'INTERNAL_ERROR',
      message: 'Произошла непредвиденная ошибка',
      recoverable: false,
    },
  });
}
```

---

## 6. Обработка ошибок на Frontend

### 6.1 Error Boundaries (React)

```tsx
// components/ErrorBoundary.tsx
interface Props {
  fallback: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error({
      error: error.message,
      stack: errorInfo.componentStack,
    }, 'React error boundary перехватил ошибку');

    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Использование
<ErrorBoundary fallback={<ErrorPage onRetry={() => window.location.reload()} />}>
  <App />
</ErrorBoundary>
```

### 6.2 Обработка API-ошибок

```typescript
// lib/api/client.ts
class APIClient {
  async request<T>(config: RequestConfig): Promise<T> {
    try {
      const response = await fetch(config.url, {
        method: config.method,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        body: config.body ? JSON.stringify(config.body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new APIError(data.error);
      }

      return data.data;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }

      if (error instanceof TypeError) {
        // Сетевая ошибка
        throw new NetworkError('Не удалось подключиться к серверу');
      }

      throw new UnknownError('Произошла непредвиденная ошибка');
    }
  }
}

// Использование с React Query
const { data, error, isError } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => apiClient.request({ url: `/users/${userId}` }),
  retry: (failureCount, error) => {
    if (error instanceof AuthenticationError) return false;
    if (error instanceof NotFoundError) return false;
    return failureCount < 3;
  },
});
```

### 6.3 Сообщения для пользователей

```typescript
// lib/errors/messages.ts
const errorMessages: Record<string, string> = {
  VALIDATION_ERROR: 'Проверьте введённые данные и попробуйте снова.',
  AUTHENTICATION_ERROR: 'Пожалуйста, войдите в систему.',
  PERMISSION_DENIED: 'У вас нет прав для выполнения этого действия.',
  NOT_FOUND: 'Запрашиваемый ресурс не найден.',
  RATE_LIMIT_EXCEEDED: 'Слишком много запросов. Подождите немного.',
  EXTERNAL_SERVICE_ERROR: 'Сервис временно недоступен. Попробуйте позже.',
  INTERNAL_ERROR: 'Что-то пошло не так. Наша команда уведомлена.',
};

export function getUserMessage(error: ApplicationError): string {
  return errorMessages[error.code] ?? errorMessages.INTERNAL_ERROR;
}
```

---

## 7. Стратегии восстановления

### 7.1 Логика повторных попыток

```typescript
// lib/retry.ts
interface RetryConfig {
  maxAttempts: number;
  delay: number;        // Базовая задержка в мс
  maxDelay: number;     // Максимальная задержка в мс
  backoff: 'linear' | 'exponential';
  retryIf: (error: Error) => boolean;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!config.retryIf(error)) {
        throw error;
      }

      if (attempt === config.maxAttempts) {
        throw error;
      }

      const delay = config.backoff === 'exponential'
        ? Math.min(config.delay * Math.pow(2, attempt - 1), config.maxDelay)
        : config.delay * attempt;

      await sleep(delay);
    }
  }

  throw lastError;
}

// Использование
const result = await withRetry(
  () => fetchExternalAPI(),
  {
    maxAttempts: 3,
    delay: 1000,
    maxDelay: 10000,
    backoff: 'exponential',
    retryIf: (error) => error instanceof ExternalServiceError,
  }
);
```

### 7.2 Circuit Breaker

```typescript
// lib/circuit-breaker.ts
enum State { CLOSED, OPEN, HALF_OPEN }

class CircuitBreaker {
  private state = State.CLOSED;
  private failures = 0;
  private lastFailureTime: number;

  constructor(
    private threshold: number,
    private timeout: number,
    private halfOpenRequests: number = 1
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === State.OPEN) {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = State.HALF_OPEN;
      } else {
        throw new CircuitOpenError('Circuit breaker открыт');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = State.CLOSED;
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = State.OPEN;
    }
  }
}
```

### 7.3 Механизмы фоллбэка

```typescript
// lib/fallback.ts
async function getUser(id: string): Promise<User> {
  try {
    // Основной источник
    return await database.getUser(id);
  } catch (error) {
    logger.warn({ error, userId: id }, 'Ошибка получения из БД, пробуем кэш');

    try {
      // Фоллбэк: кэш
      const cached = await cache.get(`user:${id}`);
      if (cached) return cached;
    } catch (cacheError) {
      logger.error({ cacheError }, 'Ошибка фоллбэка кэша');
    }

    // Финальный фоллбэк: устаревшие данные или дефолт
    throw new ExternalServiceError('Сервис пользователей');
  }
}
```

---

## 8. Мониторинг и алертинг

### 8.1 Метрики ошибок

```typescript
// Ключевые метрики для отслеживания
const errorMetrics = {
  // Счётчики
  errors_total: counter,           // Всего ошибок по кодам
  errors_by_endpoint: counter,     // Ошибки по API эндпоинтам
  errors_by_service: counter,      // Ошибки по сервисам

  // Частота
  error_rate: gauge,               // Ошибок в минуту
  error_rate_p95: histogram,       // 95-й перцентиль времени ответа при ошибках

  // Восстановление
  retry_success_rate: gauge,       // Успешные повторные попытки
  circuit_breaker_opens: counter,  // Активации circuit breaker
};
```

### 8.2 Правила алертинга

```yaml
# alerts/errors.yml
groups:
  - name: error-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(errors_total[5m]) > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Обнаружена высокая частота ошибок"

      - alert: CriticalError
        expr: increase(errors_total{code="INTERNAL_ERROR"}[1h]) > 5
        labels:
          severity: critical
        annotations:
          summary: "Обнаружены критические внутренние ошибки"

      - alert: CircuitBreakerOpen
        expr: increase(circuit_breaker_opens[5m]) > 0
        labels:
          severity: warning
        annotations:
          summary: "Circuit breaker открыт для {{ $labels.service }}"
```

---

## 9. Чек-лист

### Перед деплоем

- [ ] Все async-функции имеют try-catch
- [ ] Ошибки правильно классифицированы
- [ ] Нет чувствительных данных в сообщениях об ошибках
- [ ] Логирование настроено корректно
- [ ] Ответы с ошибками согласованы
- [ ] Frontend имеет error boundaries
- [ ] Логика повторных попыток для внешних вызовов
- [ ] Circuit breakers настроены для критичных сервисов
- [ ] Алерты настроены
- [ ] Документация ошибок актуальна

### Code Review

- [ ] Нет заглушённых ошибок
- [ ] Нет console.log в production-коде
- [ ] Контекст ошибки достаточен для отладки
- [ ] Сообщения пользователям полезны
- [ ] Стратегии восстановления уместны

---

## Ссылки

- OWASP Error Handling: https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html
- Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices#1-error-handling-practices
- Circuit Breaker Pattern: https://martinfowler.com/bliki/CircuitBreaker.html

---

*Стандарт STD-ERR-001 v1.0 — Часть agent-toolkit*
