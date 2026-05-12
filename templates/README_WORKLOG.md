# Worklog System - Complete Guide

> Save this folder and use it as a reference

---

## The Essence in One Paragraph

**Worklog** is a shared journal of agent work. Super Z (main agent) coordinates work and calls subagents. Subagents are **separate models with different instructions**, so they do NOT know about worklog automatically. To make them work with worklog, you need to **explicitly pass instructions in the prompt when calling Task()**.

---

## System Files

| File | Purpose |
|------|---------|
| worklog.md | Agent work journal (on server) |
| README_WORKLOG.md | This guide (main document) |
| TASK_TEMPLATE.md | Ready-to-use prompt templates |
| UNICODE_POLICY.md | Character usage standard |
| MARKDOWN_STANDARD.md | .md file formatting standard |
| README_TEMPLATE.md | README template |

---

## worklog.md Structure

```text
/home/z/my-project/worklog.md
|
+-- Header and description
+-- Task ID table
+-- Work history
    +-- Agent 1 entry
    +-- Agent 2 entry
    +-- ...
```

---

## Task ID System

| Pattern | Example | When to Use |
|---------|---------|-------------|
| N | 1, 2, 3 | Sequential tasks |
| N-x | 2-a, 2-b | Parallel tasks |
| N-x-y | 2-a-1 | Nested subtasks |

---

## THE MAIN RULE

```text
Super Z - KNOWS about worklog (from system instructions)

Subagents - DO NOT KNOW about worklog (different instructions)
            |
            v
Need to PASS in prompt when calling Task()
```

---

## How to Call a Subagent

### Copy this template:

```javascript
Task({
  description: "Brief description",
  prompt: `
## WORKLOG - MANDATORY

Your Task ID: **2-a**

1. BEFORE work: read /home/z/my-project/worklog.md
2. AFTER work: ADD entry to end of file (DO NOT overwrite!)

Entry format:
---
Task ID: 2-a
Agent: full-stack-developer
Task: <what was done>
Work Log:
- <action 1>
- <action 2>
Stage Summary:
- Files: <file list>
- Status: completed
---

## TASK

<Describe the task here>
`,
  subagent_type: "full-stack-developer"
});
```

---

## Worklog Entry Format

```markdown
---
Task ID: 2-a
Agent: full-stack-developer
Task: Create Users API

Work Log:
- Created file /app/api/users/route.ts
- Added Zod validation
- Wrote tests

Stage Summary:
- Files created: src/app/api/users/route.ts
- Files modified: src/lib/validators.ts
- Key decisions: REST API, JWT auth
- Status: completed
```

---

## Workflow Diagram

```text
1. Super Z creates TODO list and determines Task ID
   |
   v
2. Super Z calls subagent with prompt (including worklog rules)
   |
   v
3. Subagent:
   a) Reads worklog.md
   b) Performs task
   c) Adds entry to worklog.md
   |
   v
4. Super Z checks worklog and updates TODO list
```

---

## Checklist Before Calling Agent

- [ ] Task ID defined
- [ ] Prompt includes path to worklog.md
- [ ] Prompt includes "READ before work" instruction
- [ ] Prompt includes "ADD after work" instruction
- [ ] Prompt includes entry format
- [ ] Prompt includes "DO NOT overwrite"

---

## Quick Templates

### For full-stack-developer:

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

### For Explore:

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

## Frequently Asked Questions

**Q: Why doesn't the subagent write to worklog?**
A: You didn't pass instructions in the prompt. Subagents don't know about worklog automatically.

**Q: Where should worklog.md be?**
A: Only on the server: /home/z/my-project/worklog.md. Agents don't have access to your local machine.

**Q: How do I download worklog?**
A: After project completion, download the /home/z/my-project/ folder via the interface.

**Q: Can I use different IDs?**
A: Yes, but follow the system: 1, 2, 3 - sequential, 2-a, 2-b - parallel.

---

## What to Save

```text
worklog-system/
+-- README_WORKLOG.md     <- Main document (this)
+-- TASK_TEMPLATE.md      <- Prompt templates
+-- worklog.md            <- Journal structure example
+-- UNICODE_POLICY.md     <- Character standard
+-- MARKDOWN_STANDARD.md  <- .md formatting standard
+-- README_TEMPLATE.md    <- README template
```

---

Version: 2.1.1
Updated: 2025-01-09
Complies with: UNICODE_POLICY.md, MARKDOWN_STANDARD.md

---
Built with: Next.js 16 + TypeScript + Tailwind CSS
