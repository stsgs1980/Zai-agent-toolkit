# Writing Plans

## Instruction for AI Agent Behavior

---

## Rule: Plan Before You Code

For any task that requires more than 3 steps, write a plan BEFORE writing code.

The plan must be written into `worklog.md` as a structured checklist.
This forces clear thinking, prevents rework, and creates a traceable record.

---

## When to Plan

| Task Size | Action |
|-----------|--------|
| 1-3 steps (fix a typo, change a color) | Just do it, log after |
| 4-10 steps (add a component, refactor a module) | Write a brief plan in worklog |
| 10+ steps (new feature, multi-file change) | Write a detailed plan, show user before starting |

## When NOT to Plan

- User explicitly says "just do it" or "skip planning"
- The fix is obvious and trivial (1-2 lines)
- Cron/watchdog tasks (server restart, health check)
- Onboarding steps (these follow a fixed protocol)

---

## Plan Format

Write the plan at the top of your work session in `worklog.md`:

```yaml
---
Task ID: <id>
Agent: <agent name>
Task: <description>

Plan:
1. [step description]
2. [step description]
3. [step description]

Work Log:
- [actual work done, step by step]

Stage Summary:
- [results]
```

### Plan Checklist

A good plan answers:

- [ ] What files will be created or modified?
- [ ] What is the order of operations?
- [ ] Are there dependencies between steps?
- [ ] What could go wrong and how to handle it?
- [ ] Is there a rollback strategy?

---

## Plan Review

For tasks with 10+ steps, present the plan to the user before starting:

```text
Plan for: [task name]
1. ...
2. ...
3. ...

Should I proceed?
```

Wait for user confirmation before executing. This prevents wasted effort
when the user's intent differs from your interpretation.

For tasks with 4-9 steps, write the plan in worklog and start executing.
No need to ask for confirmation unless you are unsure about the approach.

---

## Common Mistakes

| Mistake | Why It's Bad | Fix |
|---------|-------------|-----|
| Start coding immediately on a complex task | You discover dependencies mid-way and have to restructure | Write 5-line plan first |
| Write a 50-line plan for a simple task | Wastes context window and time | Scale plan to task complexity |
| Plan but don't record it in worklog | Next session has no idea what was planned | Always write plans in worklog |
| Ignore the plan after writing it | Plan becomes useless decoration | Follow the plan step by step |
| Never revise the plan | New information may invalidate the plan | Update plan in worklog when reality changes |

---

## Relationship to Workflows

This instruction complements the workflow templates:

| Workflow | Planning Stage |
|----------|---------------|
| feature-development | Brainstorm + Plan phases (mandatory) |
| bug-fix | Diagnose phase (identify fix before coding) |
| refactor | Analyze + Plan phases (mandatory) |

When using a workflow template, its planning phase takes precedence.
This instruction applies to tasks that don't use a specific workflow.

---

Built with: Next.js 16 + TypeScript + Tailwind CSS
