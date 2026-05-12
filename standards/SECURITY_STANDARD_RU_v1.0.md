# Стандарт безопасности v1.0

**ID стандарта:** STD-SEC-001
**Версия:** 1.0
**Статус:** Активен
**Применяется к:** Всем проектам с пользовательскими данными, аутентификацией или внешними API

---

## 1. Соответствие OWASP Top 10

### 1.1 Краткий справочник

| # | Риск | Митигация | Статус |
|---|------|-----------|--------|
| A01 | Broken Access Control | RBAC, принцип минимальных привилегий | Обязательно |
| A02 | Cryptographic Failures | TLS, шифрование хранилища, ротация ключей | Обязательно |
| A03 | Injection | Параметризованные запросы, валидация ввода | Обязательно |
| A04 | Insecure Design | Моделирование угроз, паттерны безопасности | Обязательно |
| A05 | Security Misconfiguration | Харденинг, заголовки безопасности | Обязательно |
| A06 | Vulnerable Components | Сканирование зависимостей, обновления | Обязательно |
| A07 | Authentication Failures | MFA, управление сессиями | Обязательно |
| A08 | Software/Data Integrity | Подписание кода, безопасность CI/CD | Обязательно |
| A09 | Logging/Monitoring Failures | Аудит-логи, алертинг | Обязательно |
| A10 | SSRF | Allow-списки, сегментация сети | Обязательно |

---

## 2. Управление секретами

### 2.1 Никогда не храните секреты в коде

```typescript
// ❌ НИКОГДА НЕ ДЕЛАЙТЕ ТАК
const API_KEY = "sk-live-abc123xyz";
const DB_PASSWORD = "admin123";
const JWT_SECRET = "my-secret-key";

// ✅ Используйте переменные окружения
const API_KEY = process.env.API_KEY;
const DB_PASSWORD = process.env.DATABASE_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;

// ✅ Валидируйте секреты при старте
function validateSecrets() {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'API_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Отсутствуют обязательные секреты: ${missing.join(', ')}`);
  }

  // Проверить сложность секрета
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET должен быть минимум 32 символа');
  }
}
```

### 2.2 Обработка .env файлов

```bash
# .env.example (коммитится в репозиторий)
DATABASE_URL=postgresql://user:password@localhost:5432/db
JWT_SECRET=your-secret-key-here
API_KEY=your-api-key-here

# .env (НИКОГДА не коммитить)
DATABASE_URL=postgresql://prod_user:real_password@prod-host:5432/prod_db
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
API_KEY=sk-live-real-key
```

```gitignore
# .gitignore
.env
.env.local
.env.*.local
*.pem
*.key
credentials.json
```

### 2.3 График ротации секретов

| Тип секрета | Частота ротации | Процедура |
|-------------|-----------------|-----------|
| API Keys | Каждые 90 дней | Сгенерировать новый, задеплоить, отозвать старый |
| Пароли БД | Каждые 90 дней | Обновить в vault, ротировать соединения |
| JWT Secret | Каждые 180 дней | Льготный период с multi-secret валидацией |
| Ключи шифрования | Каждые 365 дней | Перешифровать данные новым ключом |
| SSH Keys | Каждые 365 дней | Заменить на всех серверах |

### 2.4 Секреты в CI/CD

```yaml
# GitHub Actions - Использовать secrets, никогда не хардкодить
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
        run: |
          # Секреты автоматически маскируются в логах
          npm run deploy
```

---

## 3. Аутентификация

### 3.1 Требования к паролям

```typescript
const passwordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: true,
  maxLength: 128,           // Защита от DoS
  blockedPatterns: [
    'password',
    '123456',
    'qwerty',
  ],
};

function validatePassword(password: string): ValidationResult {
  if (password.length < passwordPolicy.minLength) {
    return { valid: false, error: 'Пароль слишком короткий' };
  }

  if (password.length > passwordPolicy.maxLength) {
    return { valid: false, error: 'Пароль слишком длинный' };
  }

  for (const pattern of passwordPolicy.blockedPatterns) {
    if (password.toLowerCase().includes(pattern)) {
      return { valid: false, error: 'Пароль содержит запрещённый паттерн' };
    }
  }

  // Проверка по базе утекших паролей
  if (await isBreachedPassword(password)) {
    return { valid: false, error: 'Пароль найден в базе утечек' };
  }

  return { valid: true };
}
```

### 3.2 Хеширование паролей

```typescript
import bcrypt from 'bcrypt';

const HASH_ROUNDS = 12; // Настраивать под железо

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, HASH_ROUNDS);
}

async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ✅ Использовать сравнение с постоянным временем для токенов
import { timingSafeEqual } from 'crypto';

function secureCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');

  if (bufA.length !== bufB.length) {
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}
```

### 3.3 Управление сессиями

```typescript
// Конфигурация сессии
const sessionConfig = {
  name: 'sessionId',           // Не 'connect.sid'
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,            // Без доступа JS
    secure: true,              // Только HTTPS
    sameSite: 'strict',        // Защита от CSRF
    maxAge: 15 * 60 * 1000,    // 15 минут
    domain: '.example.com',    // Ограничить домен
    path: '/',
  },
};

// Регенерировать сессию при аутентификации
async function login(req: Request, user: User) {
  await req.session.regenerate();
  req.session.userId = user.id;
  req.session.createdAt = Date.now();
  req.session.ip = req.ip;
  req.session.userAgent = req.get('user-agent');
}
```

### 3.4 Best Practices JWT

```typescript
import jwt from 'jsonwebtoken';

interface TokenPayload {
  sub: string;        // User ID
  iat: number;        // Выдан в
  exp: number;        // Истекает
  jti: string;        // Уникальный ID токена (для отзыва)
  type: 'access' | 'refresh';
}

// Access token: короткоживущий
const ACCESS_TOKEN_TTL = '15m';

// Refresh token: долгоживущий, хранится безопасно
const REFRESH_TOKEN_TTL = '7d';

function generateAccessToken(user: User): string {
  return jwt.sign(
    {
      sub: user.id,
      type: 'access',
      jti: crypto.randomUUID(),
    },
    process.env.JWT_SECRET,
    {
      expiresIn: ACCESS_TOKEN_TTL,
      issuer: 'your-app',
      audience: 'your-app-users',
    }
  );
}

// Blacklist токенов для отзыва
const tokenBlacklist = new Redis();

async function revokeToken(jti: string): Promise<void> {
  await tokenBlacklist.set(`revoked:${jti}`, '1', 'EX', 86400 * 7);
}

async function isTokenRevoked(jti: string): Promise<boolean> {
  return tokenBlacklist.exists(`revoked:${jti}`);
}
```

### 3.5 Многофакторная аутентификация (MFA)

```typescript
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

// Настройка MFA
async function setupMFA(userId: string): Promise<MFASecret> {
  const secret = speakeasy.generateSecret({
    name: `YourApp (${userId})`,
    length: 20,
  });

  // Хранить секрет зашифрованным
  await storeEncryptedSecret(userId, secret.base32);

  const qrUrl = await qrcode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    qrCode: qrUrl,
  };
}

// Верификация MFA кода
function verifyMFA(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1, // Допустить 1 шаг дрейфа
  });
}
```

---

## 4. Авторизация

### 4.1 Ролевое управление доступом (RBAC)

```typescript
// Определить роли и разрешения
const ROLES = {
  ADMIN: {
    permissions: ['*'], // Все разрешения
  },
  MANAGER: {
    permissions: [
      'users:read',
      'users:write',
      'reports:read',
      'reports:write',
    ],
  },
  USER: {
    permissions: [
      'profile:read',
      'profile:write',
    ],
  },
};

// Проверка разрешения
function hasPermission(
  userRole: string,
  permission: string
): boolean {
  const role = ROLES[userRole];
  if (!role) return false;

  if (role.permissions.includes('*')) return true;
  return role.permissions.includes(permission);
}

// Middleware
function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!hasPermission(req.user.role, permission)) {
      throw new AuthorizationError(`Нет разрешения: ${permission}`);
    }
    next();
  };
}

// Использование
app.delete('/api/users/:id',
  requireAuth,
  requirePermission('users:delete'),
  deleteUser
);
```

### 4.2 Авторизация на уровне ресурса

```typescript
// Всегда проверять владение ресурсом
async function getDocument(req: Request, res: Response) {
  const document = await db.documents.find(req.params.id);

  if (!document) {
    throw new NotFoundError('Документ');
  }

  // Проверить владение или разрешение
  const canAccess =
    document.ownerId === req.user.id ||
    hasPermission(req.user.role, 'documents:read_all');

  if (!canAccess) {
    throw new AuthorizationError('Нет доступа к этому документу');
  }

  return document;
}
```

### 4.3 Принцип минимальных привилегий

```typescript
// ✅ Хорошо: Минимальные права для сервисных аккаунтов
const dbUser = {
  role: 'app_user',
  permissions: ['SELECT', 'INSERT', 'UPDATE'],
  tables: ['users', 'documents'], // Только нужные таблицы
};

// ❌ Плохо: Избыточные права
const dbUser = {
  role: 'superuser', // Слишком много доступа
};

// API токены с конкретными scope
const apiToken = {
  scopes: ['read:users', 'write:documents'],
  expiresAt: Date.now() + 3600000, // 1 час
};
```

---

## 5. Валидация и санитизация ввода

### 5.1 Схема валидации

```typescript
import { z } from 'zod';

// Схема регистрации пользователя
const UserRegistrationSchema = z.object({
  email: z.string()
    .email()
    .max(255)
    .transform(email => email.toLowerCase().trim()),

  password: z.string()
    .min(12)
    .max(128)
    .regex(/[A-Z]/, 'Должен содержать заглавную букву')
    .regex(/[a-z]/, 'Должен содержать строчную букву')
    .regex(/[0-9]/, 'Должен содержать цифру')
    .regex(/[^A-Za-z0-9]/, 'Должен содержать спецсимвол'),

  name: z.string()
    .min(1)
    .max(100)
    .regex(/^[\p{L}\s'-]+$/u, 'Недопустимые символы')
    .transform(name => name.trim()),
});

// Валидировать и распарсить
function validateUserRegistration(data: unknown) {
  return UserRegistrationSchema.safeParse(data);
}
```

### 5.2 Защита от SQL-инъекций

```typescript
// ❌ НИКОГДА: Конкатенация строк
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ Параметризованные запросы
const query = 'SELECT * FROM users WHERE id = $1';
const result = await db.query(query, [userId]);

// ✅ ORM с автоматическим экранированием
const user = await prisma.user.findFirst({
  where: { id: userId },
});
```

### 5.3 Защита от XSS

```typescript
import DOMPurify from 'dompurify';

// Санитизация HTML-ввода
function sanitizeHTML(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href'],
  });
}

// Кодирование вывода
import { escape } from 'html-escaper';

function renderUserContent(content: string): string {
  return escape(content); // & < > " '
}
```

### 5.4 Защита от CSRF

```typescript
import csurf from 'csurf';

const csrfProtection = csurf({ cookie: true });

// Применять к маршрутам, меняющим состояние
app.post('/api/users', csrfProtection, createUser);

// Предоставить токен фронтенду
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Frontend: Включить в запросы
fetch('/api/users', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify(data),
});
```

---

## 6. Заголовки безопасности

### 6.1 Обязательные заголовки

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.example.com'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'same-origin' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  originAgentCluster: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
}));
```

### 6.2 Дополнительные заголовки

```typescript
// Кастомные заголовки безопасности
app.use((req, res, next) => {
  // Защита от кликджекинга
  res.setHeader('X-Frame-Options', 'DENY');

  // Защита от MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // XSS защита
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Политика referrer
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Политика разрешений
  res.setHeader('Permissions-Policy', [
    'geolocation=()',
    'camera=()',
    'microphone=()',
    'payment=()',
  ].join(', '));

  next();
});
```

---

## 7. Rate Limiting и защита от DDoS

### 7.1 Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// Общий rate limit API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100,                  // 100 запросов на окно
  message: 'Слишком много запросов, попробуйте позже',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || req.user?.id,
});

// Строгие лимиты для аутентификации
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 5,                    // 5 попыток в час
  message: 'Слишком много попыток входа, аккаунт временно заблокирован',
  skipSuccessfulRequests: true,
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

### 7.2 Замедление подозрительных запросов

```typescript
import slowDown from 'express-slow-down';

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,    // Разрешить 50 запросов на полной скорости
  delayMs: 500,      // Добавить 500мс задержки на запрос после
  maxDelayMs: 20000, // Кап на 20 секунд
});

app.use('/api/', speedLimiter);
```

---

## 8. Безопасные зависимости

### 8.1 Аудит зависимостей

```json
// package.json scripts
{
  "scripts": {
    "audit": "npm audit",
    "audit:fix": "npm audit fix",
    "outdated": "npm outdated"
  }
}
```

```yaml
# GitHub Actions - Автоматический аудит безопасности
name: Security Audit
on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=moderate
      - uses: dependabot/fetch-metadata@v1
      # Авто-merge обновлений безопасности
```

### 8.2 Политики зависимостей

| Политика | Требование |
|----------|------------|
| Уязвимости безопасности | Ни одной с CVSS > 7 |
| Лицензия | Только из allow-списка |
| Возраст | Предпочитать стабильные, поддерживаемые пакеты |
| Загрузки | Предпочитать пакеты со значимым использованием |
| Lock File | Всегда коммитить package-lock.json |

---

## 9. Логирование и мониторинг

### 9.1 События безопасности для логирования

```typescript
// События, требующие аудит-логирования
const SECURITY_EVENTS = {
  // Аутентификация
  'auth.login.success': { userId, ip, userAgent },
  'auth.login.failure': { email, ip, reason },
  'auth.logout': { userId, ip },
  'auth.mfa.enabled': { userId },
  'auth.mfa.disabled': { userId },
  'auth.password.changed': { userId },
  'auth.password.reset': { userId, email },

  // Авторизация
  'auth.access.denied': { userId, resource, action },
  'auth.role.changed': { userId, oldRole, newRole },

  // Доступ к данным
  'data.export': { userId, resource, records },
  'data.delete': { userId, resource, recordId },

  // Админ
  'admin.user.created': { adminId, newUserId },
  'admin.user.deleted': { adminId, deletedUserId },
  'admin.config.changed': { adminId, key },

  // Безопасность
  'security.rate_limited': { ip, endpoint },
  'security.injection_attempt': { ip, payload },
  'security.suspicious_activity': { userId, type },
};
```

### 9.2 Формат логов

```typescript
// Запись лога безопасности
interface SecurityLog {
  timestamp: string;
  event: string;
  severity: 'info' | 'warning' | 'critical';
  actor: {
    userId?: string;
    ip: string;
    userAgent: string;
  };
  resource?: {
    type: string;
    id: string;
  };
  details: Record<string, unknown>;
  result: 'success' | 'failure';
  requestId: string;
}
```

### 9.3 Обработка чувствительных данных

```typescript
// Никогда не логировать чувствительные данные
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'apiKey',
  'creditCard',
  'ssn',
];

function sanitizeLog(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...data };

  for (const field of SENSITIVE_FIELDS) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}
```

---

## 10. Безопасный деплой

### 10.1 Чек-лист перед деплоем

- [ ] Все секреты в переменных окружения
- [ ] Заголовки безопасности настроены
- [ ] HTTPS принудительно
- [ ] Rate limiting включён
- [ ] Валидация ввода на всех эндпоинтах
- [ ] Аутентификация требуется где нужно
- [ ] Авторизация проверяется по ресурсу
- [ ] Нет чувствительных данных в логах
- [ ] Зависимости проверены
- [ ] CSP настроен
- [ ] Сообщения об ошибках не утекают
- [ ] Соединения с БД зашифрованы
- [ ] Бэкапы зашифрованы

### 10.2 Конфигурация окружения

```typescript
// Безопасность в зависимости от окружения
const securityConfig = {
  development: {
    https: false,
    cors: { origin: 'http://localhost:3000' },
    csp: { 'upgrade-insecure-requests': false },
  },

  staging: {
    https: true,
    cors: { origin: 'https://staging.example.com' },
    csp: { 'upgrade-insecure-requests': true },
  },

  production: {
    https: true,
    cors: { origin: 'https://example.com' },
    csp: { 'upgrade-insecure-requests': true },
    hsts: { maxAge: 31536000, includeSubDomains: true },
  },
};
```

---

## 11. Реагирование на инциденты

### 11.1 Фазы реагирования

```
1. DETECT -> Выявить инцидент
2. CONTAIN -> Ограничить ущерб
3. ERADICATE -> Устранить угрозу
4. RECOVER -> Восстановить сервисы
5. LEARN -> Пост-мортем и улучшения
```

### 11.2 Немедленные действия

```markdown
## Чек-лист инцидента безопасности

### Немедленно (0-1 час)
- [ ] Подтвердить инцидент
- [ ] Уведомить команду безопасности
- [ ] Сохранить доказательства (логи, скриншоты)
- [ ] Оценить масштаб и влияние
- [ ] Изолировать при активной атаке

### Краткосрочно (1-24 часа)
- [ ] Задокументировать таймлайн
- [ ] Идентифицировать затронутых пользователей/системы
- [ ] Исправить уязвимость
- [ ] Сбросить скомпрометированные учётные данные
- [ ] Уведомить затронутых пользователей если требуется

### Долгосрочно (1-7 дней)
- [ ] Завершить пост-мортем
- [ ] Обновить процедуры безопасности
- [ ] Внедрить дополнительные контроли
- [ ] Запланировать обучение по безопасности
```

---

## 12. Чек-лист соответствия

### Требования GDPR

- [ ] Шифрование данных в покое
- [ ] Шифрование данных при передаче
- [ ] Возможность права на удаление
- [ ] Переносимость данных
- [ ] Политика конфиденциальности
- [ ] Согласие на cookies
- [ ] Политика хранения данных

### Требования SOC 2

- [ ] Контроль доступа задокументирован
- [ ] Процесс управления изменениями
- [ ] План реагирования на инциденты
- [ ] Сканирование уязвимостей
- [ ] Проверка сотрудников
- [ ] Обучение безопасности

---

## Ссылки

- OWASP Top 10: https://owasp.org/Top10/
- OWASP Cheat Sheet Series: https://cheatsheetseries.owasp.org/
- NIST Cybersecurity Framework: https://www.nist.gov/cyberframework
- CWE Top 25: https://cwe.mitre.org/top25/
- Security Headers: https://securityheaders.com/

---

*Стандарт STD-SEC-001 v1.0 — Часть agent-toolkit*
