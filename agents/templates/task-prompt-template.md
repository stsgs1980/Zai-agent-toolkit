# Task Prompt Template for Subagents

> Standard: STD-AGENT-001 compliant
> Usage: Copy and fill in for each subagent invocation

---

## Template: Explore

```javascript
Task({
  description: "<3-5 word description>",
  prompt: `
## WORKLOG - MANDATORY

Task ID: **<ID>**

1. Read /home/z/my-project/worklog.md before starting
2. After work, append entry using template below (DO NOT overwrite!)

---
Task ID: <ID>
Agent: Explore
Task: <description>

Work Log:
- <action 1>
- <action 2>

Stage Summary:
- Findings: <results>
- Status: completed
---

## TASK

<Clear, self-contained task description. Include all necessary context
since you have NO access to the conversation history.>

## OUTPUT FORMAT

Return a structured report with:
1. Files found (absolute paths)
2. Key findings (bullet points)
3. Relevant code snippets (with file paths and line numbers)
4. Recommendations (if any)
`,
  subagent_type: "Explore"
});
```

---

## Template: Plan

```javascript
Task({
  description: "<3-5 word description>",
  prompt: `
## WORKLOG - MANDATORY

Task ID: **<ID>**

1. Read /home/z/my-project/worklog.md before starting
2. After work, append entry using template below (DO NOT overwrite!)

---
Task ID: <ID>
Agent: Plan
Task: <description>

Work Log:
- <action 1>
- <action 2>

Stage Summary:
- Plan: <summary>
- Critical files: <list>
- Trade-offs: <decisions>
- Status: completed
---

## TASK

<Clear, self-contained task description. Include:
- What needs to be designed/planned
- Any constraints or requirements
- Files/directories to analyze
- Expected output format>

## OUTPUT FORMAT

Return a step-by-step implementation plan with:
1. Overview (1-2 paragraphs)
2. Steps (numbered, with files affected)
3. Dependencies between steps
4. Risk assessment for each step
5. Estimated effort per step
`,
  subagent_type: "Plan"
});
```

---

## Template: full-stack-developer

```javascript
Task({
  description: "<3-5 word description>",
  prompt: `
## WORKLOG - MANDATORY

Task ID: **<ID>**

1. Read /home/z/my-project/worklog.md before starting
2. After work, append entry using template below (DO NOT overwrite!)

---
Task ID: <ID>
Agent: full-stack-developer
Task: <description>

Work Log:
- <action 1>
- <action 2>

Stage Summary:
- Files created: <list>
- Files modified: <list>
- Key decisions: <decisions>
- Status: completed
---

## TASK

<Clear, self-contained task description. Include:
- What to build/implement
- Which files to create or modify
- Technical requirements and constraints
- Expected behavior>

## STANDARDS COMPLIANCE

Follow these standards (available in /home/z/my-project/Zai-agent-toolkit_v/standards/):
- STD-DOC-003: No emoji/Unicode in code or output
- STD-ENV-001: No hardcoded personal paths, use .env.example
- STD-FE-001: Frontend component patterns
- STD-GIT-001: Conventional commit format

## IMPORTANT

- You MUST call Complete(project_type="web_dev", summary="...") when done
- Commit + push after each logical unit of work
- Use absolute paths: /home/z/my-project/
`,
  subagent_type: "full-stack-developer"
});
```

---

## Template: general-purpose

```javascript
Task({
  description: "<3-5 word description>",
  prompt: `
## WORKLOG - MANDATORY

Task ID: **<ID>**

1. Read /home/z/my-project/worklog.md before starting
2. After work, append entry using template below (DO NOT overwrite!)

---
Task ID: <ID>
Agent: general-purpose
Task: <description>

Work Log:
- <action 1>
- <action 2>

Stage Summary:
- Result: <summary>
- Files: <list if applicable>
- Status: completed
---

## TASK

<Clear, self-contained task description. Include all necessary context
since you have NO access to the conversation history.>

## OUTPUT FORMAT

Return a structured result with:
1. Summary (what was accomplished)
2. Key findings or outputs
3. Any errors or blockers encountered
4. Recommendations for next steps
`,
  subagent_type: "general-purpose"
});
```

---

Built with: Next.js 16 + TypeScript + Tailwind CSS
