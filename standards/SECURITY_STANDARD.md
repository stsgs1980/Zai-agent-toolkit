# Security Standard v1.0

**Standard ID:** STD-SEC-001
**Version:** 1.0
**Status:** Active
**Applies to:** All projects handling user data, authentication, or external APIs

---

## 1. OWASP Top 10 Compliance

### 1.1 Quick Reference

| # | Risk | Mitigation | Status |
|---|------|------------|--------|
| A01 | Broken Access Control | RBAC, principle of least privilege | Required |
| A02 | Cryptographic Failures | TLS, encrypted storage, key rotation | Required |
| A03 | Injection | Parameterized queries, input validation | Required |
| A04 | Insecure Design | Threat modeling, security patterns | Required |
| A05 | Security Misconfiguration | Hardening, security headers | Required |
| A06 | Vulnerable Components | Dependency scanning, updates | Required |
| A07 | Authentication Failures | MFA, session management | Required |
| A08 | Software/Data Integrity | Code signing, CI/CD security | Required |
| A09 | Logging/Monitoring Failures | Audit logs, alerting | Required |
| A10 | SSRF | Allow-lists, network segmentation | Required |

---

## 2. Secrets Management

### 2.1 Never Store Secrets in Code

```typescript
// [FAIL] NEVER DO THIS
const API_KEY = "sk-live-abc123xyz";
const DB_PASSWORD = "admin123";
const JWT_SECRET = "my-secret-key";

// [OK] Use environment variables
const API_KEY = process.env.API_KEY;
const DB_PASSWORD = process.env.DATABASE_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;

// [OK] Validate secrets at startup
function validateSecrets() {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'API_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required secrets: ${missing.join(', ')}`);
  }

  // Validate secret strength
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
}
```

### 2.2 .env File Handling

```bash
# .env.example (committed to repo)
DATABASE_URL=postgresql://user:password@localhost:5432/db
JWT_SECRET=your-secret-key-here
API_KEY=your-api-key-here

# .env (NEVER commit)
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

### 2.3 Secret Rotation Schedule

| Secret Type | Rotation Frequency | Procedure |
|-------------|-------------------|-----------|
| API Keys | Every 90 days | Generate new, deploy, revoke old |
| Database Passwords | Every 90 days | Update in vault, rotate connections |
| JWT Secret | Every 180 days | Grace period with multi-secret validation |
| Encryption Keys | Every 365 days | Re-encrypt data with new key |
| SSH Keys | Every 365 days | Replace on all servers |

### 2.4 Secrets in CI/CD

```yaml
# GitHub Actions - Use secrets, never hardcode
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
        run: |
          # Secrets are masked in logs automatically
          npm run deploy
```

---

## 3. Authentication

### 3.1 Password Requirements

```typescript
const passwordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: true,
  maxLength: 128,           // Prevent DoS
  blockedPatterns: [
    'password',
    '123456',
    'qwerty',
  ],
};

function validatePassword(password: string): ValidationResult {
  if (password.length < passwordPolicy.minLength) {
    return { valid: false, error: 'Password too short' };
  }

  if (password.length > passwordPolicy.maxLength) {
    return { valid: false, error: 'Password too long' };
  }

  for (const pattern of passwordPolicy.blockedPatterns) {
    if (password.toLowerCase().includes(pattern)) {
      return { valid: false, error: 'Password contains blocked pattern' };
    }
  }

  // Check against breached passwords database
  if (await isBreachedPassword(password)) {
    return { valid: false, error: 'Password found in data breach' };
  }

  return { valid: true };
}
```

### 3.2 Password Hashing

```typescript
import bcrypt from 'bcrypt';

const HASH_ROUNDS = 12; // Adjust based on hardware

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, HASH_ROUNDS);
}

async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// [OK] Use constant-time comparison for tokens
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

### 3.3 Session Management

```typescript
// Session configuration
const sessionConfig = {
  name: 'sessionId',           // Not 'connect.sid'
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,            // No JS access
    secure: true,              // HTTPS only
    sameSite: 'strict',        // CSRF protection
    maxAge: 15 * 60 * 1000,    // 15 minutes
    domain: '.example.com',    // Restrict domain
    path: '/',
  },
};

// Regenerate session on authentication
async function login(req: Request, user: User) {
  await req.session.regenerate();
  req.session.userId = user.id;
  req.session.createdAt = Date.now();
  req.session.ip = req.ip;
  req.session.userAgent = req.get('user-agent');
}
```

### 3.4 JWT Best Practices

```typescript
import jwt from 'jsonwebtoken';

interface TokenPayload {
  sub: string;        // User ID
  iat: number;        // Issued at
  exp: number;        // Expiration
  jti: string;        // Unique token ID (for revocation)
  type: 'access' | 'refresh';
}

// Access token: short-lived
const ACCESS_TOKEN_TTL = '15m';

// Refresh token: longer-lived, stored securely
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

// Token blacklist for revocation
const tokenBlacklist = new Redis();

async function revokeToken(jti: string): Promise<void> {
  await tokenBlacklist.set(`revoked:${jti}`, '1', 'EX', 86400 * 7);
}

async function isTokenRevoked(jti: string): Promise<boolean> {
  return tokenBlacklist.exists(`revoked:${jti}`);
}
```

### 3.5 Multi-Factor Authentication (MFA)

```typescript
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

// Setup MFA
async function setupMFA(userId: string): Promise<MFASecret> {
  const secret = speakeasy.generateSecret({
    name: `YourApp (${userId})`,
    length: 20,
  });

  // Store secret encrypted
  await storeEncryptedSecret(userId, secret.base32);

  const qrUrl = await qrcode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    qrCode: qrUrl,
  };
}

// Verify MFA code
function verifyMFA(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1, // Allow 1 step drift
  });
}
```

---

## 4. Authorization

### 4.1 Role-Based Access Control (RBAC)

```typescript
// Define roles and permissions
const ROLES = {
  ADMIN: {
    permissions: ['*'], // All permissions
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

// Permission check
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
      throw new AuthorizationError(`Missing permission: ${permission}`);
    }
    next();
  };
}

// Usage
app.delete('/api/users/:id',
  requireAuth,
  requirePermission('users:delete'),
  deleteUser
);
```

### 4.2 Resource-Level Authorization

```typescript
// Always check resource ownership
async function getDocument(req: Request, res: Response) {
  const document = await db.documents.find(req.params.id);

  if (!document) {
    throw new NotFoundError('Document');
  }

  // Check ownership or permission
  const canAccess =
    document.ownerId === req.user.id ||
    hasPermission(req.user.role, 'documents:read_all');

  if (!canAccess) {
    throw new AuthorizationError('Cannot access this document');
  }

  return document;
}
```

### 4.3 Principle of Least Privilege

```typescript
// [OK] Good: Minimal permissions for service accounts
const dbUser = {
  role: 'app_user',
  permissions: ['SELECT', 'INSERT', 'UPDATE'],
  tables: ['users', 'documents'], // Only needed tables
};

// [FAIL] Bad: Over-privileged
const dbUser = {
  role: 'superuser', // Too much access
};

// API tokens with specific scopes
const apiToken = {
  scopes: ['read:users', 'write:documents'],
  expiresAt: Date.now() + 3600000, // 1 hour
};
```

---

## 5. Input Validation & Sanitization

### 5.1 Validation Schema

```typescript
import { z } from 'zod';

// User registration schema
const UserRegistrationSchema = z.object({
  email: z.string()
    .email()
    .max(255)
    .transform(email => email.toLowerCase().trim()),

  password: z.string()
    .min(12)
    .max(128)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain symbol'),

  name: z.string()
    .min(1)
    .max(100)
    .regex(/^[\p{L}\s'-]+$/u, 'Invalid characters')
    .transform(name => name.trim()),
});

// Validate and parse
function validateUserRegistration(data: unknown) {
  return UserRegistrationSchema.safeParse(data);
}
```

### 5.2 SQL Injection Prevention

```typescript
// [FAIL] NEVER: String concatenation
const query = `SELECT * FROM users WHERE id = ${userId}`;

// [OK] Parameterized queries
const query = 'SELECT * FROM users WHERE id = $1';
const result = await db.query(query, [userId]);

// [OK] ORM with automatic escaping
const user = await prisma.user.findFirst({
  where: { id: userId },
});
```

### 5.3 XSS Prevention

```typescript
import DOMPurify from 'dompurify';

// Sanitize HTML input
function sanitizeHTML(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href'],
  });
}

// Output encoding
import { escape } from 'html-escaper';

function renderUserContent(content: string): string {
  return escape(content); // & < > " '
}
```

### 5.4 CSRF Protection

```typescript
import csurf from 'csurf';

const csrfProtection = csurf({ cookie: true });

// Apply to state-changing routes
app.post('/api/users', csrfProtection, createUser);

// Provide token to frontend
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Frontend: Include in requests
fetch('/api/users', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify(data),
});
```

---

## 6. Security Headers

### 6.1 Required Headers

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

### 6.2 Additional Headers

```typescript
// Custom security headers
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
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

## 7. Rate Limiting & DDoS Protection

### 7.1 Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || req.user?.id,
});

// Stricter limits for authentication
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,                    // 5 attempts per hour
  message: 'Too many login attempts, account temporarily locked',
  skipSuccessfulRequests: true,
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

### 7.2 Slow Down Suspicious Requests

```typescript
import slowDown from 'express-slow-down';

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,    // Allow 50 requests at full speed
  delayMs: 500,      // Add 500ms delay per request after
  maxDelayMs: 20000, // Cap at 20 seconds
});

app.use('/api/', speedLimiter);
```

---

## 8. Secure Dependencies

### 8.1 Dependency Auditing

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
# GitHub Actions - Automated security audit
name: Security Audit
on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=moderate
      - uses: dependabot/fetch-metadata@v1
      # Auto-merge security updates
```

### 8.2 Dependency Policies

| Policy | Requirement |
|--------|-------------|
| Security Vulnerabilities | None with CVSS > 7 |
| License | Allow-list only |
| Age | Prefer stable, maintained packages |
| Downloads | Prefer packages with significant usage |
| Lock File | Always commit package-lock.json |

---

## 9. Logging & Monitoring

### 9.1 Security Events to Log

```typescript
// Events requiring audit logging
const SECURITY_EVENTS = {
  // Authentication
  'auth.login.success': { userId, ip, userAgent },
  'auth.login.failure': { email, ip, reason },
  'auth.logout': { userId, ip },
  'auth.mfa.enabled': { userId },
  'auth.mfa.disabled': { userId },
  'auth.password.changed': { userId },
  'auth.password.reset': { userId, email },

  // Authorization
  'auth.access.denied': { userId, resource, action },
  'auth.role.changed': { userId, oldRole, newRole },

  // Data access
  'data.export': { userId, resource, records },
  'data.delete': { userId, resource, recordId },

  // Admin
  'admin.user.created': { adminId, newUserId },
  'admin.user.deleted': { adminId, deletedUserId },
  'admin.config.changed': { adminId, key },

  // Security
  'security.rate_limited': { ip, endpoint },
  'security.injection_attempt': { ip, payload },
  'security.suspicious_activity': { userId, type },
};
```

### 9.2 Log Format

```typescript
// Security log entry
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

### 9.3 Sensitive Data Handling

```typescript
// Never log sensitive data
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

## 10. Secure Deployment

### 10.1 Pre-Deployment Checklist

- [ ] All secrets in environment variables
- [ ] Security headers configured
- [ ] HTTPS enforced
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Authentication required where needed
- [ ] Authorization checked per resource
- [ ] No sensitive data in logs
- [ ] Dependencies audited
- [ ] CSP configured
- [ ] Error messages don't leak info
- [ ] Database connections encrypted
- [ ] Backups encrypted

### 10.2 Environment Configuration

```typescript
// Environment-specific security
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

## 11. Incident Response

### 11.1 Response Phases

```
1. DETECT → Identify the incident
2. CONTAIN → Limit the damage
3. ERADICATE → Remove the threat
4. RECOVER → Restore services
5. LEARN → Post-mortem and improve
```

### 11.2 Immediate Actions

```markdown
## Security Incident Checklist

### Immediate (0-1 hour)
- [ ] Confirm the incident
- [ ] Notify security team
- [ ] Preserve evidence (logs, screenshots)
- [ ] Assess scope and impact
- [ ] Contain if active attack

### Short-term (1-24 hours)
- [ ] Document timeline
- [ ] Identify affected users/systems
- [ ] Patch vulnerability
- [ ] Reset compromised credentials
- [ ] Notify affected users if required

### Long-term (1-7 days)
- [ ] Complete post-mortem
- [ ] Update security procedures
- [ ] Implement additional controls
- [ ] Schedule security training
```

---

## 12. Compliance Checklist

### GDPR Requirements

- [ ] Data encryption at rest
- [ ] Data encryption in transit
- [ ] Right to erasure capability
- [ ] Data portability
- [ ] Privacy policy
- [ ] Cookie consent
- [ ] Data retention policy

### SOC 2 Requirements

- [ ] Access controls documented
- [ ] Change management process
- [ ] Incident response plan
- [ ] Vulnerability scanning
- [ ] Background checks for employees
- [ ] Security training

---

## References

- OWASP Top 10: https://owasp.org/Top10/
- OWASP Cheat Sheet Series: https://cheatsheetseries.owasp.org/
- NIST Cybersecurity Framework: https://www.nist.gov/cyberframework
- CWE Top 25: https://cwe.mitre.org/top25/
- Security Headers: https://securityheaders.com/

---

*Standard STD-SEC-001 v1.0 — Part of agent-toolkit*
