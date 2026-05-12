# Standard: README Template v2.1

> ID: STD-DOC-004
> Version: 2.1
> Level: **[W] Warning**
> Related: Markdown Standard (STD-DOC-001, STD-DOC-002)

This template defines the mandatory structure for all project README files.

## Mandatory Sections

Every README.md must contain the following sections in order:

| # | Section | Required | Description |
|---|---------|----------|-------------|
| 1 | Title + Description | Yes | Project name and brief description |
| 2 | Badges | Optional | Technology badges (SVG only) |
| 3 | Features | Yes | Key capabilities |
| 4 | Tech Stack | Yes | Technologies used |
| 5 | Getting Started | Yes | Installation and run instructions |
| 6 | Configuration | Optional | Environment variables, settings |
| 7 | Project Structure | Optional | Directory layout |
| 8 | API Reference | Optional | Endpoints, methods |
| 9 | Scripts | Optional | NPM/Bun commands |
| 10 | Development Rules | Optional | Code style, technology constraints |
| 11 | Agent Rules | Conditional | Required if `AGENT_RULES.md` exists in project root |
| 12 | Stack Signature | Yes | Mandatory footer |

## Template

````markdown
# Project Name

Brief description of the project (1-2 sentences).

![Badge](https://img.shields.io/badge/Tech-Version-color?style=flat-square)

## Features

- Feature 1 - description
- Feature 2 - description
- Feature 3 - description

## Tech Stack

- **Framework** - description
- **Language** - description
- **Database** - description
- **Other** - description

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Other requirements

### Installation

```bash
# Install dependencies
bun install

# Configure environment
cp .env.example .env

# Setup database
bun run db:push

# Run development server
bun run dev
```

## Project Structure

- `src/app/` - Application routes
- `src/components/` - UI components
- `src/lib/` - Utilities
- `prisma/` - Database schema

## Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Development server |
| `bun run build` | Production build |
| `bun run lint` | Lint check |

## Configuration

### Environment Variables

See `.env.example`:

```env
DATABASE_URL="file:./db/dev.db"
```

## Development Rules

### Required Technologies
- Technology 1
- Technology 2

### Code Style
- Rule 1
- Rule 2

## Agent Rules (Mandatory)

Any AI agent working on this project MUST read and follow `AGENT_RULES.md`
before performing any operations.

See `AGENT_RULES.md` for full details.
See `instructions/` for complete rule descriptions.
See `skills/` for automated tooling.

---
Built with: Next.js 16 + TypeScript + Tailwind CSS
````

Note: The stack signature above is the default for Next.js projects. Replace with the actual project stack if using a different technology. Format: `Built with: <Framework> + <Language> + <Styling>` (see MARKDOWN_STANDARD v2.1, section 7).

## Checklist

Before submitting, verify:

- [ ] No emoji in title or sections
- [ ] No ASCII arrows as list markers (use `-` for unordered lists)
- [ ] No em dash in headings or code (use hyphen `-`)
- [ ] No pseudo-graphics for tree structures
- [ ] Stack Signature present at end
- [ ] All mandatory sections included
- [ ] Agent Rules section present if AGENT_RULES.md exists
- [ ] Code blocks have language specified

## Example Compliance

### Correct

```text
## Features
- Fast build - uses Turbopack
- Type safe — full TypeScript
```

Note: hyphen `-` is used as a separator in technical descriptions. Em dash `—` is allowed in plain text within list items per MARKDOWN_STANDARD, but prohibited in headings and code blocks.

### Incorrect

```text
## Features
- Fast build -> uses Turbopack
## Features — Core
```

Note: `->` as a separator in list items violates the list marker rule. Em dash `—` in a heading is prohibited.

---
Built with: Next.js 16 + TypeScript + Tailwind CSS
