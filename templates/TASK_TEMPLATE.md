# Prompt Templates for Subagents

> Templates for calling subagents with worklog integration.
> Full guide: see `README_WORKLOG.md`

---

## Quick Start

Copy the needed template, replace `<ID>` and `<description>` with your values.

---

## Template: full-stack-developer

```javascript
Task({
  description: "<description>",
  prompt: `
## WORKLOG - MANDATORY

Task ID: **<ID>**

1. Read /home/z/my-project/worklog.md
2. After work add entry (DO NOT overwrite!)

---
Task ID: <ID>
Agent: full-stack-developer
Task: <description>
Work Log:
- <actions>
Stage Summary:
- Files: <list>
- Status: completed
---

## TASK
<task description>
`,
  subagent_type: "full-stack-developer"
});
```

---

## Template: Explore

```javascript
Task({
  description: "<description>",
  prompt: `
## WORKLOG - MANDATORY

Task ID: **<ID>**

1. Read /home/z/my-project/worklog.md
2. After work add entry (DO NOT overwrite!)

---
Task ID: <ID>
Agent: Explore
Task: <description>
Work Log:
- <actions>
Stage Summary:
- Findings: <results>
- Status: completed
---

## TASK
<task description>
`,
  subagent_type: "Explore"
});
```

---

## Template: general-purpose

```javascript
Task({
  description: "<description>",
  prompt: `
## WORKLOG - MANDATORY

Task ID: **<ID>**

1. Read /home/z/my-project/worklog.md
2. After work add entry (DO NOT overwrite!)

---
Task ID: <ID>
Agent: general-purpose
Task: <description>
Work Log:
- <actions>
Stage Summary:
- Result: <result>
- Status: completed
---

## TASK
<task description>
`,
  subagent_type: "general-purpose"
});
```

---

## Worklog Entry Format

````markdown
---
Task ID: <ID>
Agent: <agent type>
Task: <task description>

Work Log:
- <action 1>
- <action 2>

Stage Summary:
- Files created: <list>
- Files modified: <list>
- Key decisions: <decisions>
- Status: completed
---
````

---

For detailed worklog system description, checklists and FAQ: see `README_WORKLOG.md`

---
Built with: Next.js 16 + TypeScript + Tailwind CSS
