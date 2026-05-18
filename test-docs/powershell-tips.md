# PowerShell Tips for Windows Developers

## Prisma CLI

**Prisma** - ORM for Node.js that generates type-safe database clients from schema definitions

**Migration** - Process of transforming database schema from one state to another

## How to Setup Prisma

1. Install Prisma CLI: `npm install prisma --save-dev`
2. Initialize: `npx prisma init`
3. Edit `prisma/schema.prisma` with your models
4. Push schema to DB: `npx prisma db push`
5. Generate client: `npx prisma generate`

## Useful Commands

```bash
npx prisma db push        # Apply schema without migration
npx prisma studio         # Open visual DB browser
npx prisma generate       # Regenerate Prisma Client
git log --oneline -20     # Show last 20 commits
npm run dev               # Start Next.js dev server
```

## Encoding Tips

Always use `encoding: "utf-8"` in Node.js `execFile` calls on Windows.
Without it, Cyrillic text appears as `???????` mojibake.

**PYTHONIOENCODING** - Environment variable that forces Python to use UTF-8 for stdin/stdout/stderr

## PowerShell Quirks

- Use single quotes for strings with special characters: `'@relation("FromEdges")'`
- Double quotes with `\"` cause ParserError
- `[regex]::Matches()` is safer than `Select-String` for complex patterns
