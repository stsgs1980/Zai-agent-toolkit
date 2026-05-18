# Standard: Markdown Formatting v2.2 (EN)

> ID: STD-DOC-002
> Version: 2.2.0
> Level: **[W] Warning**
> Related: No-Unicode Policy v2.1 (STD-DOC-003) — character rules delegated to this standard

---

## 1. Introduction and Goals

This standard establishes rules for Markdown documentation formatting to ensure visual consistency and professional product quality.

**Goals:**

- Ensure visual consistency of documentation
- Maintain professional product quality
- Guarantee control through design system
- Eliminate uncontrolled visual artifacts

---

## 2. Scope

| Level | Context | Action on violation |
|-------|---------|---------------------|
| **[W] Warning** | README.md, CHANGELOG.md, docs/, project documentation | Comment in review, request to fix |

**See also:**
- **No-Unicode Policy v2.1** — for UI components [C], production code [C], AI-communication [W], prototypes [I]

---

## 3. Prohibited Elements

Character prohibitions are defined in **No-Unicode Policy v2.1** (STD-DOC-003) sections 4-5. Level **[W] Warning** applies to documentation files.

**Summary (authoritative rules in STD-DOC-003):**

| Category | Level | Note |
|----------|-------|------|
| Emoji | [C] | No exceptions |
| Unicode icons | [C] | Use text tags |
| Table pseudographics | [W] | Use Markdown syntax |
| Typographics in headings/code | [W] | Allowed in plain text only (see scope below) |

**Prohibition scope (for Typographics in .md files):**

- Headings and subheadings
- Tables (except reference tables - see below)
- Inline code and code blocks (comments, strings)
- File and folder names

**`(ref)` exception for reference tables and code blocks:** If the purpose of a table cell or a code block line is to identify a specific character (to show what is prohibited or allowed), the character may be included with a `(ref)` marker. This does not violate the spirit of the standard: the character is used as the object of description, not as formatting. Without the actual symbol, the example loses clarity: "Incorrect: `—` (ref) in heading" is demonstrative; "Incorrect: em dash in heading" is blind.

---

## 4. Allowed Elements

### 4.1. Text Rules

Allowed character sets are defined in **STD-DOC-003 section 6.1**. For .md files at level [W]:

- All characters from the STD-DOC-003 basic set are allowed
- **Typographic symbols** (em dash, en dash, degree, copyright, plus-minus) are allowed in **plain text only** — prohibited in headings, tables, code blocks, and file names (see Section 3)

### 4.2. ASCII Diagrams

The whitelist for technical diagrams in documentation is defined in **STD-DOC-003 section 6.2**. Level [I] applies within code blocks; level [W] applies in plain text documentation.

### 4.3. Markdown Syntax

| Element | Syntax |
|---------|--------|
| Headings | `#`, `##`, `###` |
| Bold | `**text**` |
| Italic | `*text*` |
| Inline code | `` `code` `` |
| Code block | ` ```language ` |
| Blockquote | `>` |
| Unordered List | `-` (strictly) |
| Ordered List | `1.` |
| Link | `[text](url)` |
| Image | `![alt](url)` |

### 4.4. Text Tags for Statuses

Use text labels instead of Unicode symbols:

| Correct | Incorrect |
|---------|-----------|
| `[OK]` | [v] (ref) |
| `[FAIL]` | [x] (ref) |
| `[DONE]` | [OK] (ref) |
| `[TODO]` |  (ref) |
| `[WARNING]` | [WARN] (ref) |
| `[INFO]` | ℹ (ref) |

---

## 5. Formatting Rules

### 5.1. Headings

- Use `#` for H1, `##` for H2, etc.
- Do not use closing `#` symbols
- Only one H1 per document
- Do not use typographic symbols (like em dash) in headings

```text
Correct:      # Heading
Incorrect:    # Heading #
Incorrect:    # Heading — (ref) Subtitle
```

The `—` (ref) symbol in the example above is a demonstration of the prohibited character; the `(ref)` marker indicates reference usage.

### 5.2. Lists

**Unordered:**

- Always use `-` as the single marker for unordered lists.
- Do not mix with `*` or `+`.

```text
Correct:      - Item 1
Incorrect:    * Item 1
Incorrect:    -> Item 1
```

**Ordered:**

```text
1. First item
2. Second item
```

### 5.3. Text Emphasis

| Format | Syntax |
|--------|--------|
| Bold | `**text**` |
| Italic | `*text*` |
| Strikethrough | `~~text~~` |

### 5.4. Code Formatting

**Inline code** (within text):

```markdown
Use the `processFile()` function for processing.
```

**Code block** (with language specified):

````markdown
```typescript
const config = {
  encoding: 'utf-8',
  strict: true
};
```
````

**Unknown Languages Rule:**
If the exact programming language or format is not supported by the renderer or is unknown, always specify `text` or `bash` instead of leaving the block blank.

```text
Correct:      ```text
Incorrect:    ```text
```

**Rules:**

| Element | Format | Purpose |
|---------|--------|---------|
| Inline code | `` `code` `` | Functions, variables, commands within text |
| Code block | `` ```language `` | Multi-line code, examples, configs |

**Do NOT use custom colors:**

- Markdown does not natively support colors
- HTML tags like `<span style="color:red">` may be blocked on GitHub
- Syntax highlighting is applied automatically by the renderer
- Color is the responsibility of the theme (GitHub, VS Code), not the document

---

## 6. Visual Elements

### 6.1. Visual Elements in Markdown

Icon and graphic rules are defined in **STD-DOC-003 section 7**. For .md files:

- Any visual symbol = **SVG only** or **text alternative** (STD-DOC-003 section 7.1)
- SVG insertion uses standard Markdown image syntax. Raw `<svg>...</svg>` HTML tags are prohibited:

```markdown
![Icon description](./path/to/icon.svg)
```

### 6.2. Icon Library

See **STD-DOC-003 section 7.2** for icon library requirements. In documentation, use text descriptions instead of icons.

### 6.3. Brand Logos

See **STD-DOC-003 section 7.4** for brand logo requirements. When mentioning technologies in documentation, use official SVG via Markdown image syntax.

---

## 7. Badges

Badges are graphical indicators of project metadata (version, build status, license). Place them at the beginning of README.md after the heading.

### 7.1. Allowed Sources

| Source | Usage |
|--------|-------|
| shields.io | Recommended — generates PNG/SVG without emoji |
| custom SVG | Allowed if compliant with No-Unicode Policy |

### 7.2. Prohibited

- Emoji in badges (shields.io supports it, but do not use)
- External icons inside badges
- Badges with statuses that do not reflect reality

### 7.3. Typical Badges for npm Package

```markdown
[![npm version](https://img.shields.io/npm/v/zai-agent-toolkit.svg)](https://www.npmjs.com/package/zai-agent-toolkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```

### 7.4. Placeholders (for projects without CI)

If CI is not configured, use static badges:

```markdown
[![Status: Draft](https://img.shields.io/badge/Status-Draft-yellow.svg)]()
[![Version: 1.9.5](https://img.shields.io/badge/Version-1.9.5-blue.svg)]()
```

When CI is configured, replace with dynamic ones.

---

## 8. Stack Signature

Root documentation files must contain a stack signature at the end of the file.

**Scope:**
- `README.md` (root)
- `CHANGELOG.md` (root)
- *Optional for nested `docs/` files, but not required.*

**Format:**

```markdown
---
Built with: <project technologies>
```

The specific stack is determined by the project, not the standard. Example for Next.js projects:

```markdown
---
Built with: Next.js 16 + TypeScript + Tailwind CSS
```

For the default value in this stack, see `README_TEMPLATE.md`.

**Rules:**

- Placement: end of file
- Separator: three dashes `---`
- Content: letters, digits, `+` and `:` signs
- Graphics prohibited

---

## 9. Control and Enforcement

### 9.1. Level [W] Warning - Blocking Policy

| Stage | Action | Blocks merge? |
|-------|--------|---------------|
| Code Review | Comment requesting fix | **No** |
| CI Pipeline | Warning in logs | **No** |
| Repeated violation | Escalation to Tech Lead | **Possible** |

**Rule:** Level [W] does not block merge automatically. PR author can:

1. Fix violations and get approval
2. Justify exception in comments
3. Get approval with reviewer consensus

**Escalation:** On systematic violations (3+ PRs without fixes) — merge blocked until discussion with Tech Lead.

### 9.2. Mandatory Validation of All .md Files

**Rule:** Any created or added `.md` file in the project **must** pass validation and editing according to this standard.

| Action | When | Responsible |
|--------|------|-------------|
| Creating new .md | Before commit | Author |
| Adding external .md | Before merge | Reviewer |
| Copying .md from another project | Before commit | Author |

**Process:**

1. Validation by checklist (see section 11)
2. Fix violations
3. Add stack signature (if root file)
4. Review in Code Review

**Automation:**

```yaml
# .github/workflows/md-lint.yml
name: Markdown Lint
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install eslint-plugin-markdown
      - run: npx eslint --plugin markdown '**/*.md' --rule 'no-irregular-whitespace: error'
```

### 9.3. PR Rejection Criteria

PR **recommended for rejection** if it contains:

1. Emoji in documentation
2. Unicode graphics without text alternative
3. Missing stack signature in root technical documents (`README.md`, `CHANGELOG.md`)
4. Typographic symbols inside code blocks or headings

### 9.4. Linting - Application Stages

| Stage | When | Tool | Action |
|-------|------|------|--------|
| Pre-commit | Before commit | husky + lint-staged | Warning |
| CI | Push to branch | eslint-plugin-markdown | Warning in logs |
| Pre-merge | Before merge to main | GitHub Action | Report in PR |

**lint-staged configuration:**

```json
{
  "*.md": [
    "eslint --plugin markdown --rule 'no-irregular-whitespace: error'"
  ]
}
```

**Sanitization patterns are defined in STD-DOC-003:**

- Emoji removal: **STD-DOC-003 section 8.2**
- Final sanitization: **STD-DOC-003 section 8.3**

For .md files at level [W], typographic characters are preserved — use the [I] level pattern from STD-DOC-003.

---

## 10. Exceptions

### 10.1. Unconditionally Allowed

See **STD-DOC-003 section 11.1** for the complete list of unconditionally allowed characters. For .md files, typographic symbols are additionally allowed in plain text (level [W]).

### 10.2. Exceptions by Agreement

| Situation | Requirement |
|-----------|-------------|
| External requirements | Email campaigns - coordinate with marketing |
| Localization | Languages with non-ASCII characters |

---

## 11. ASCII Diagram Examples

ASCII diagrams are **allowed** in documentation (README, docs/).

### 11.1. Architecture Diagram Example

```text
+-------------------+
|    Component A    |
+---------+---------+
          |
          v
+-------------------+
|    Component B    |
+---------+---------+
          |
          +-----> Component C
```

### 11.2. Flow Diagram Example

```text
User Request --> API Gateway --> Auth Service
                                      |
                                      v
                                 Database
                                      |
                                      v
                               Response --> User
```

### 11.3. Sequence Diagram Example

```text
Client          Server          Database
  |                |               |
  +----request---->|               |
  |                +----query----->|
  |                |<---result-----+
  |<---response----+               |
```

---

## 12. Pre-merge Checklist

- [ ] No emoji or Unicode icons in documentation (STD-DOC-003 sections 4-5)
- [ ] No typographic symbols (em dash, copyright, etc.) in code blocks or headings
- [ ] Status indicators — text tags `[OK]`, `[FAIL]`
- [ ] Unordered lists use strictly `-` marker
- [ ] Unknown code blocks use `text` or `bash` fallback
- [ ] Stack signature present in root files
- [ ] Formatting matches standard
- [ ] Diagrams use whitelist characters

---

## 13. Version History

| Version | Date | Changes |
|--------|------|---------|
| 1.0 | 2024-Q4 | Initial version |
| 2.0 | 2025-01 | Level [W], link to No-Unicode Policy v2.0, ASCII diagram whitelist, [W] blocking policy, linting stages, code formatting rules |
| 2.1 | 2025-01 | Allowed typographics in plain text; fixed `-` as sole list marker; clarified SVG via `![]()`; limited Stack Signature to root files; added `text/bash` fallback rule; removed redundant `v` from CI regex |
| 2.1.1 | 2025-01 | Updated references from No-Unicode Policy v2.0 to v2.1; CI config updated with eslint-plugin-markdown; Unicode symbols in section 4.4 replaced with text descriptions (document must not violate its own standard); code blocks without language replaced with `text` |
| 2.1.2 | 2025-01 | Introduced `(ref)` exception for reference tables: characters in identifier cells allowed with marker; restored specific Unicode characters in prohibited/allowed element tables; `Incorrect` examples again show the actual prohibited character |
| 2.1.3 | 2025-01 | Extended `(ref)` exception to code blocks: identifier characters allowed with marker in code blocks too; `Incorrect` examples in code blocks now contain the actual symbol with `(ref)`; restored Unicode symbols in EN table 4.4 |
| 2.1.4 | 2025-01 | Stack signature parameterized: format `Built with: <technologies>`, specific stack is project responsibility; default value moved to README_TEMPLATE |
| 2.1.5 | 2025-05 | Added section 7 "Badges" with shields.io rules, placeholders for projects without CI; section numbering shifted |
| 2.2.0 | 2026-05 | Deduplication: removed 7 elements duplicated with STD-DOC-003 (prohibited elements table, allowed characters, ASCII diagram whitelist, icon library, brand logos, sanitization regex, unconditionally allowed). Replaced with cross-references. Kept .md-specific rules: typographics scope, (ref) exception, SVG insertion, badges, stack signature, formatting rules, text tags |

---

**Document complies with MARKDOWN_STANDARD v2.2 (level [W])**

---
Built with: Next.js 16 + TypeScript + Tailwind CSS
