---
name: sanitize-validate
description: >
  Input sanitization, validation, and security hardening for user-facing applications.
  Use this skill when the user works with user input, form data, API request handling,
  database queries, authentication fields, file uploads, or any data that comes from
  external sources. Also activate when the user mentions XSS, SQL injection, CSRF,
  input cleaning, data validation, form security, or OWASP-related topics. Even if
  the user just says "secure this endpoint" or "check my form handler" or "sanitize
  this field" -- trigger this skill. The core principle: never trust external data.
---

# Sanitize & Validate -- Input Security

## Core Principle

**Never trust external data.** Any data entering the system from outside (user input,
API requests, URL parameters, file uploads, cookies, headers) must pass a three-stage
pipeline before reaching the database, being rendered on a page, or transmitted
to another system.

Stage order matters:

```
1. VALIDATE  (Check)       -- on ORIGINAL user input
2. SANITIZE  (Clean)       -- normalize validated data
3. ESCAPE    (Encode)      -- context-specific encoding for output
```

Each stage solves its own problem. Skipping any creates a vulnerability.

---

## Fundamental: Allow-list over Deny-list

In all aspects of sanitization and validation: **always use allow-list** (whitelist),
not deny-list (blacklist).

- **Allow-list**: "allow ONLY letters, digits, underscore" -> new dangerous characters
  are automatically rejected
- **Deny-list**: "block `<script>` and `onerror`" -> attacker finds a vector not in
  your list (e.g., `onmouseover`, `javascript:`, SVG injection)

This applies to everything: allowed HTML tags, file types, URL protocols, characters
in username, SQL operators (parameterized queries are inherently an allow-list).

---

## Stage 1: Validate

Validation works with **original** user input and REJECTS invalid data, returning
detailed errors. This is the only stage where users get feedback.

Why validation BEFORE sanitization? If user entered `" user@mail.com "`, validation
should report: "Email must not contain spaces". If you `.trim()` first, the user
never learns about the problem and is confused why their input was "fixed" silently.

### Validation returns detailed errors, not true/false

Modern libraries return structured error objects for user-friendly messages:

```typescript
const emailSchema = z.string().email("Invalid email format");
const result = emailSchema.safeParse("not-an-email");
if (!result.success) {
  // result.error.issues = [{ path: ["email"], message: "Invalid email format" }]
}
```

### Validation Checklist by Field Type

| Field Type | Validation Rules |
|------------|-----------------|
| Email | Valid format, length <= 254 chars |
| Password | Min 8 chars, mixed case + digit + special |
| Phone | Valid regional pattern, digits only after formatting removal |
| Name | Letters and spaces (consider unicode names) |
| Age/Number | Integer, min/max range |
| URL | Valid format, http/https only (allow-list!) |
| Date | Valid date, not in future for birthdate |
| Text/Comment | Max length, not empty after trim |
| File upload | Allow-list MIME types, max size, safe filename |
| ID/UUID | Valid format, exists in DB |

### Common Validation Mistakes

**MISTAKE 1: Using `typeof` for type checking in TypeScript**

```typescript
// BROKEN -- types erased at compile time
function handle(input: string) { /* input could be anything */ }

// CORRECT -- runtime validation
const result = z.string().safeParse(rawInput);
```

**MISTAKE 2: No length check** -- attacker sends 10 MB string in "username" field.
Always set `maxLength`.

**MISTAKE 3: Unicode homoglyphs** -- Cyrillic "a" (U+0430) looks like Latin "a"
(U+0061), bypassing username filters. **NFKC normalization does NOT convert**
Cyrillic to Latin -- they are different code points. What NFKC does: expands
ligatures (`fi` -> `f`+`i`), normalizes diacritic sequences, removes invisible
characters (zero-width space).

**Solution**: NFKC + allow-list of permitted characters:

```python
import unicodedata
import re

def safe_username(username: str) -> str:
    # Expand ligatures, remove invisible chars
    normalized = unicodedata.normalize('NFKC', username)
    # Allow-list: only letters, digits, dot, underscore, hyphen
    return re.sub(r'[^a-zA-Z0-9_.-]', '', normalized)
```

---

## Stage 2: Sanitize

Sanitization transforms validated data into safe, normalized form. It does NOT
reject input -- it fixes it. This happens AFTER successful validation.

### What Sanitization Does

| Operation | Input | Output |
|-----------|-------|--------|
| Trim whitespace | `"  ivan@mail.com "` | `"ivan@mail.com"` |
| Case normalization | `"Ivan@Mail.COM"` | `"ivan@mail.com"` |
| Remove HTML tags | `"<b>Hello</b>"` | `"Hello"` |
| Remove control chars | `"text\x00null"` | `"textnull"` |
| NFKC unicode normalization | `fi` ligature -> `f`+`i`, zero-width removed | Normalized form |

### Common Sanitization Mistakes

**MISTAKE 1: Regex for HTML**

```javascript
// BROKEN -- regex does not parse HTML
value.replace(/<[^>]*>?/gm, '')
// Breaks on: "a < b && b > c" -- removes part of text
```

Use a library: DOMPurify (JS), nh3 (Python).

**MISTAKE 2: Client-side only** -- attacker bypasses via curl/Postman.
Sanitization and validation MUST be on the server.

**MISTAKE 3: Buffer and binary data** -- DOMPurify does not work with Buffer,
and regex `[^\x00-\x7F]` kills UTF-8. For files: check magic bytes (file signature),
not Content-Type from header. Re-encode via sharp (images) or equivalents.

### Recommended Libraries

| Language | Library | Purpose |
|----------|---------|---------|
| JS (browser) | **DOMPurify** | HTML sanitization, allow-list tags/attrs |
| JS (Node.js) | **sanitize-html** | Server-side HTML sanitization |
| JS/TS | **Zod** | Schema validation + type coercion |
| JS/TS | **Valibot** | Lightweight Zod alternative |
| JS/TS | **escape-html** | HTML entity escaping |
| Python | **nh3** | Fast HTML sanitization |
| Python | **pydantic** | Validation + type coercion |
| Python | **marshmallow** | Validation + serialization |

---

## Stage 3: Escape (Context-specific Encoding)

Even after sanitization and validation, data must be encoded for the output context.
This is the last line of defense.

### HTML: body and attributes are different contexts

Escaping for **HTML body** (`<`, `>`, `&`) is insufficient for **attributes**.

```html
<!-- VULNERABLE -- even after html.escape() -->
<input value="{{ user_input }}">
<!-- Attack: " onclick="alert(1)" -- closes quote and injects handler -->
```

**Solution**: escape `&`, `<`, `>`, `"`, `'` (all five), plus space and tab in
attributes. Or use `.textContent` in DOM instead of concatenating with innerHTML.

```javascript
// CORRECT -- .textContent is safe by default
document.getElementById('msg').textContent = userInput;

// If innerHTML is unavoidable -- sanitize via DOMPurify with allow-list
const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: ['b', 'i', 'a'] });
```

### SQL -- Always Parameterized Queries

```javascript
// CORRECT
db.query('SELECT * FROM users WHERE email = $1', [email]);
// WRONG -- SQL injection
db.query(`SELECT * FROM users WHERE email = '${email}'`);
```

### URL -- encodeURIComponent / quote

```javascript
const safe = encodeURIComponent(userInput);
```

```python
from urllib.parse import quote
safe = quote(user_input)
```

---

## Additional Attack Vectors

These threats relate to input handling but go beyond classic sanitize-validate.
Check for them during code review.

### Path Traversal (arbitrary file read)

User injects `../../etc/passwd` into file path:

```javascript
// VULNERABLE
const path = `/uploads/${req.body.filename}`;
fs.readFile(path);

// SAFE -- generate filename on server (uuid)
const safeName = `${uuid.v4()}.jpg`;
const path = `/uploads/${safeName}`;
```

Never use the original filename from user in filesystem paths.

### SSRF (Server-Side Request Forgery)

User passes URL, and server requests internal resources:

```javascript
// VULNERABLE -- attacker passes http://169.254.169.254/metadata (AWS metadata)
const data = await fetch(req.body.url);

// SAFE -- allow-list domains + block private IPs
const ALLOWED_DOMAINS = ['api.example.com', 'cdn.example.com'];
const parsed = new URL(req.body.url);
if (!ALLOWED_DOMAINS.includes(parsed.hostname)) throw new Error('Blocked');
```

### Open Redirect

User substitutes redirect URL: `?redirect=https://evil.com`

```javascript
// VULNERABLE
res.redirect(req.query.redirect);

// SAFE -- allow-list or relative paths only
if (req.query.redirect.startsWith('/')) {
  res.redirect(req.query.redirect);
}
```

### Mass Assignment

User sends extra fields that should not be editable:

```json
// Request: { "username": "ivan", "role": "admin" }
// If controller does: Object.assign(user, req.body) -- user becomes admin
```

**Solution**: explicit field allow-list -- Zod schema, Pydantic model, NestJS DTO
with `whitelist: true`, or `_.pick(req.body, ['username', 'email'])`.

---

## Code Review Checklist

When reviewing any request handler, ask these questions:

### Validation
- [ ] Is there a schema (Zod/Pydantic/class-validator) that rejects invalid input
  BEFORE business logic?
- [ ] Do I apply `trim()` / `toLowerCase()` AFTER format validation?

### SQL
- [ ] Do ALL DB queries use parameterization (`$1`, `%s`, `?`)?
  No string templates with user input?

### HTML
- [ ] Do I use `.textContent` instead of `.innerHTML`?
- [ ] If `.innerHTML` is unavoidable -- do I run through DOMPurify/nh3 with
  an allow-list of tags?
- [ ] Do I escape HTML attributes (`"`, `'`, spaces) -- not just body?

### Files
- [ ] Do I check file **content** (magic bytes), not just Content-Type?
- [ ] Do I re-encode images (sharp/pillow) instead of direct save?
- [ ] Do I generate filename on server (uuid), not use original?

### Shell / CLI
- [ ] Is there `exec()`, `spawn()`, `os.system()` with user input?
  If yes -- this is almost always an **RCE vulnerability**. Use spawn with
  argument array without shell: `execFile(cmd, [arg1, arg2])`.

### Logging
- [ ] **Am I logging sensitive data?** Passwords, tokens, credit card numbers
  must not appear in logs -- even after sanitization. Mask: `***REDACTED***`.
- [ ] **Do I mask tokens in URLs?** Tokens and API keys often passed in query:

```javascript
// BAD -- token in logs
console.log(`Request to ${req.url}`); // /api/user?token=secret123

// GOOD -- mask before logging
function maskUrl(url) {
  const parsed = new URL(url);
  ['token', 'api_key', 'secret', 'password'].forEach(p => {
    if (parsed.searchParams.has(p)) parsed.searchParams.set(p, '***REDACTED***');
  });
  return parsed.toString();
}
```

---

## Framework Quick Reference

| Framework | HTML Sanitization | Validation | Escaping |
|-----------|-------------------|------------|----------|
| React | Auto in JSX | Zod + useForm | Auto (except `dangerouslySetInnerHTML`) |
| Next.js | Same as React | Zod in server actions | `next/image`, auto for text |
| Vue | `v-html` UNSAFE | VeeValidate + Zod | Auto in `{{ }}` |
| Express | `helmet` middleware | Zod in handler | Template engine |
| NestJS | Pipes + DTO | `class-validator` | Template engine |
| FastAPI | Pydantic (auto) | Pydantic `Field()` | Jinja2 auto |
| Django | Auto in templates | Forms + Model | Auto (except `|safe`) |

---

## Quick Summary (for reference)

```
SECURITY HARDENING CHECKLIST -- Input Processing

VALIDATION:  schema (Zod/Pydantic) with allow-list fields
VALIDATION:  maxLength check for strings
SANITIZE:    after validation, not before
SANITIZE:    HTML via DOMPurify/nh3 (allow-list tags)
SQL:         parameterized queries (no interpolation)
HTML:        .textContent over .innerHTML where possible
HTML:        for attributes escape " and ' (not just < >)
FILE:        check magic bytes (not Content-Type)
FILE:        re-encode images (sharp/pillow)
FILE:        generate name on server (uuid)
PATH:        never use user input for fs.readFile
URL:         allow-list domains for fetch() from user
REDIRECT:    relative paths only / allow-list domains
SHELL:       no exec/spawn with user input
LOGS:        mask tokens and passwords (including URL params)
```

---

## What This Skill Does NOT Cover

- Authentication/authorization frameworks (OAuth, JWT, Passport)
- Full OWASP Top 10 coverage (needs separate security audit)
- Infrastructure security (HTTPS, CORS -- use `helmet` / `cors`)
- Penetration testing
- Mobile API and GraphQL-specific vulnerabilities (depth limiting, alias brute force)
