# Standard: Security Extended v1.0 (EN)

> ID: STD-SEC-002
> Version: 1.0
> Level: **[C] Critical**
> Last Updated: 2026-05
> Related: STD-SEC-001, STD-ERR-001

---

## 1. Introduction

This standard covers extended security requirements for production and user-facing applications. For core security requirements (secrets management, input validation, headers, dependency auditing) that apply to ALL projects including sandbox prototypes, see **STD-SEC-001**.

**When to apply this standard:** When the project handles real user data, is deployed to production, or serves external users. See the Decision Matrix in Section 9 for guidance.

---

## 2. Authentication

### 2.1 Password Requirements

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

### 2.2 Password Hashing

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

### 2.3 Session Management

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

### 2.4 JWT Best Practices

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

### 2.5 Multi-Factor Authentication (MFA)

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

## 3. Authorization

### 3.1 Role-Based Access Control (RBAC)

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

### 3.2 Resource-Level Authorization

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

### 3.3 Principle of Least Privilege

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

## 4. CSRF Protection

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

## 5. Rate Limiting & DDoS Protection

### 5.1 Rate Limiting

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

### 5.2 Slow Down Suspicious Requests

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

## 6. Security Event Logging & Log Format

### 6.1 Security Events to Log

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

### 6.2 Log Format

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

---

## 7. Secure Deployment

### 7.1 Pre-Deployment Checklist

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

### 7.2 Environment Configuration

```typescript
// Environment-specific security
const securityConfig = {
  development: {
    https: false,
    cors: { origin: '*' },  // Dev only — restrict in production
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

## 8. Incident Response

### 8.1 Response Phases

```text
1. DETECT -> Identify the incident
2. CONTAIN -> Limit the damage
3. ERADICATE -> Remove the threat
4. RECOVER -> Restore services
5. LEARN -> Post-mortem and improve
```

### 8.2 Immediate Actions

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

## 9. Extended Scope & Decision Matrix

### 9.1 Extended Scope (Required for production / user-facing projects)

These sections apply when the project handles real user data, is deployed to production, or serves external users:

| Section | Topic | When Required |
|---------|-------|---------------|
| 2.1-2.5 | Authentication (MFA, JWT, Sessions) | When users log in |
| 3.1-3.3 | Authorization (RBAC, Resource-Level) | When roles exist |
| 4 | CSRF Protection | When forms submit state-changing requests |
| 5.1-5.2 | Rate Limiting & DDoS Protection | When exposed to internet |
| 6.1-6.2 | Security Event Logging & Audit | When compliance required |
| 7.1-7.2 | Secure Deployment Configuration | When deploying to production |
| 8.1-8.2 | Incident Response | When serving real users |
| 10 | Compliance (GDPR, SOC 2) | When handling personal data |

### 9.2 Decision Matrix

```text
Is this project in Z.ai sandbox (prototype/MVP)?
  |
  +-- YES --> Apply Core only (STD-SEC-001)
  |           Focus on: .env, Zod validation, no leaked errors
  |
  +-- NO --> Is it user-facing / production?
              |
              +-- YES --> Apply Core + Extended
              |           Full security standard required
              |
              +-- NO --> Internal tool?
                          |
                          +-- YES --> Apply Core (STD-SEC-001)
                                      Add RBAC if multi-user
```

---

## 10. Compliance Checklist

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

## 11. References

- OWASP Top 10: https://owasp.org/Top10/
- OWASP Cheat Sheet Series: https://cheatsheetseries.owasp.org/
- NIST Cybersecurity Framework: https://www.nist.gov/cyberframework
- CWE Top 25: https://cwe.mitre.org/top25/
- Security Headers: https://securityheaders.com/

---

## Cross-References

| Standard | Relationship |
|----------|-------------|
| STD-SEC-001 | Core security (secrets, validation, headers, dependencies) |
| STD-ERR-001 | Error handling patterns (this standard focuses on security-specific errors) |
| STD-A11Y-001 | Accessibility intersects with security (Captcha alternatives, timeout warnings) |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-05 | Extracted from STD-SEC-001 v1.1. Contains authentication, authorization, rate limiting, monitoring, deployment, incident response, and compliance requirements for production applications. |

---

Built with: Next.js 16 + TypeScript + Tailwind CSS
