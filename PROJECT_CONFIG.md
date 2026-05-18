# Project Configuration

> Project-specific settings for the current project.
> This file is NOT part of the toolkit standards -- it is created per project.
>
> Toolkit version: v2.0.4

---

## Stack Signature

```text
Built with: Python + PowerShell + Markdown
```

> Format defined by: `MARKDOWN_STANDARD v2.1`
> Default value defined by: `README_TEMPLATE.md`
> Replace with your actual stack if different.

---

## Dev Server

| Setting | Value |
|---------|-------|
| Command | `npx next dev -p 3000` |
| Health check | `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000` |
| Host | `127.0.0.1` (NOT `localhost`) |
| Startup wait | 6 seconds (Turbopack compile time) |
| Output redirect | `</dev/null >/tmp/zdev.log 2>&1 &` |

### Error Handling

| Response | Action |
|----------|--------|
| 200 | Server running, proceed |
| 000 | Server down, restart with `dev-watchdog` skill |
| 500 | Server error, check logs, fix error, then restart |

---

## Project Paths

| Path | Purpose |
|------|---------|
| `src/app/` | Next.js App Router entry points and routes |
| `instructions/` | Agent behavioral instructions |
| `skills/` | Automated agent skills |
| `standards/` | Governance documents (Group B) |

---

## Component Library

- Use **shadcn/ui** components, do not build from scratch
- TypeScript throughout with strict typing

---

## Environment Variables

All environment variables must be documented in `.env.example`
per `REPRODUCIBILITY-STANDARD`.

---

## Notes

- This file is the single source of truth for project-specific configuration
- When switching to a different stack, update only this file
- AGENT_RULES.md references this file for all project-dependent settings
