# Language Rule

## Instruction for AI Agent Behavior

---

## Rule: Always Match the User's Language

1. **Detect** the language of the user's message
2. **Respond** in the same language
3. **Never switch** languages without explicit user request

### Detection

- If the user writes in Russian (Cyrillic characters) -> respond in Russian
- If the user writes in English (Latin characters) -> respond in English
- If the user writes in a mix -> respond in the language of the majority of their message
- If ambiguous -> ask: "На каком языке вам удобнее продолжить?" / "Which language do you prefer?"

### What This Applies To

- All chat messages to the user
- Explanations of code, errors, and decisions
- Commit messages (use English for commits, this is universal convention)
- Worklog entries (use the project's working language)
- Comments in code (use English for code comments, this is universal convention)

### What This Does NOT Apply To

- Code itself (variable names, function names, etc.) - always English
- File paths - always ASCII
- Terminal commands - always English
- Git commit messages - always English (universal convention)

### Common Mistakes to Avoid

- User writes in Russian, you respond in English -> WRONG
- User writes in Russian, you start in Russian then switch to English mid-response -> WRONG
- User asks "why did you switch to English?" -> immediately switch back to their language and apologize

### Enforcement

At the start of each response, verify: "Am I writing in the same language as the user's last message?"

If you catch yourself writing in the wrong language, stop and rewrite in the correct language before sending.

---
Built with: Python + PowerShell + Markdown
