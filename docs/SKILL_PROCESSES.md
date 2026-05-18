# Skills Process Flows

> Visual documentation for Z.ai Agent Toolkit processes
> Generated: 2026-05-18

---

## 0. Unified Architecture (PlantUML)

Unified diagram of the entire architecture and processes:

![Skills Architecture](./diagrams/00-skills-architecture.png)

> Source: `diagrams/skills-architecture.puml` -- editable PlantUML file

---

## 1. Skill Selection Flow

How the agent selects and invokes skills based on task type.

![Skill Selection Flow](./diagrams/01-skill-selection-flow.png)

```mermaid
flowchart TB
    subgraph Request["USER REQUEST"]
        A[User Query] --> B{Analyze Task Type}
    end

    subgraph Classification["TASK CLASSIFICATION"]
        B -->|Document| C1[Type 1: docx/pdf/xlsx/ppt]
        B -->|Chart/Diagram| C2[Type 2: charts]
        B -->|Web App| C3[Type 3: Next.js]
        B -->|Data Processing| C4[Type 4: Python/Scripts]
    end

    subgraph SkillLookup["SKILL LOOKUP"]
        C1 --> D{Check Toolkit}
        C2 --> D
        C3 --> D
        C4 --> D
        D -->|Found| E[Use Toolkit Skill]
        D -->|Not Found| F{Check System Skills}
        F -->|Found| G[Use System Skill]
        F -->|Not Found| H[Direct Implementation]
    end

    subgraph Execution["EXECUTION"]
        E --> I[Invoke Skill]
        G --> I
        H --> I
        I --> J[Execute Task]
        J --> K[Return Result]
    end
```

---

## 2. Skill Creation Flow

Process for creating a new skill with automatic ID assignment.

![Skill Creation Flow](./diagrams/02-skill-creation-flow.png)

```mermaid
flowchart LR
    subgraph Create["1. CREATE"]
        A[Skill Idea] --> B[Create SKILL.md]
        B --> C[Add Metadata]
        C --> D[Assign ZAI-XXX-NNN ID]
    end

    subgraph Validate["2. VALIDATE"]
        D --> E{CI Validation}
        E -->|Pass| F[Ready for Commit]
        E -->|Fail| G[Fix Errors]
        G --> E
    end

    subgraph Publish["3. PUBLISH"]
        F --> H[git add]
        H --> I[git commit]
        I --> J[git push]
    end

    subgraph Registry["4. REGISTRY"]
        J --> K[Update ID Registry]
        K --> L[Update Docs]
    end
```

---

## 3. Session Lifecycle

Session lifecycle using session-resume, session-log, session-handoff.

![Session Lifecycle](./diagrams/03-session-lifecycle.png)

```mermaid
flowchart TB
    subgraph Start["SESSION START"]
        A[New Session] --> B[session-resume]
        B --> C{Git Blocked?}
        C -->|Yes| D[Recover Deadlock]
        C -->|No| E[Check Worklog]
        D --> E
        E --> F[Restart Dev Server]
        F --> G[Report Status]
    end

    subgraph Work["ACTIVE WORK"]
        G --> H[Execute Tasks]
        H --> I{15 min passed?}
        I -->|Yes| J[session-log: Auto Snapshot]
        I -->|No| K{Commit Made?}
        K -->|Yes| J
        K -->|No| L{5+ Files Changed?}
        L -->|Yes| J
        L -->|No| M{Context > 80%?}
        M -->|Yes| N[session-handoff]
        M -->|No| H
        J --> H
    end

    subgraph End["SESSION END"]
        N --> O[Create Handoff Doc]
        O --> P[Save to worklog.md]
        P --> Q[Session Closed]
        H -->|User Ends| O
    end
```

### Skills Used

| Skill | ZAI ID | Trigger |
|-------|--------|---------|
| session-resume | System | New session start |
| session-log | ZAI-SESSION-002 | Every 15 min, after commit, 5+ files |
| session-handoff | System | Context > 80%, session end |

---

## 4. Git Safety Flow

Data loss protection during git operations.

![Git Safety Flow](./diagrams/04-git-safety-flow.png)

```mermaid
flowchart TB
    subgraph PreOp["PRE-OPERATION"]
        A[Git Operation Requested] --> B{Risky Operation?}
        B -->|rebase/merge/pull| C[git-safe-ops]
        B -->|commit/push| D[Direct Execute]
    end

    subgraph SafeOps["git-safe-ops"]
        C --> E[Create Backup Tag]
        E --> F[Execute Operation]
        F --> G{Conflict?}
        G -->|Yes| H[Auto Recover]
        G -->|No| I[Success]
        H --> J[Restore from Backup]
    end

    subgraph Checkpoint["git-checkpoint"]
        D --> K{Large Changes?}
        K -->|Yes| L[Create Checkpoint]
        K -->|No| M[Proceed]
        L --> M
    end

    subgraph Safety["git-safety"]
        M --> N{Push Rejected?}
        N -->|Yes| O[git-safety Rules]
        N -->|No| P[Done]
        O --> Q{Diverged Branches?}
        Q -->|Yes| R[Decision Tree]
        Q -->|No| S[Resolve Conflict]
        R --> T[force-with-lease OR reset]
    end
```

### Skills Used

| Skill | ZAI ID | Purpose |
|-------|--------|---------|
| git-safe-ops | System | Backup + recover for risky ops |
| git-checkpoint | System | Create recovery tag |
| git-safety | System | Deadlock prevention rules |

---

## 5. Health & Retry Flow

Handling API errors with automatic retry and fallback.

![Health & Retry Flow](./diagrams/05-health-retry-flow.png)

```mermaid
flowchart TB
    subgraph Check["HEALTH CHECK"]
        A[API Request] --> B[health-check]
        B --> C{chat.z.ai OK?}
        C -->|Yes| D[Proceed]
        C -->|No| E{502/503/504?}
    end

    subgraph Retry["api-retry"]
        E -->|Yes| F[Exponential Backoff]
        F --> G[Retry 1]
        G --> H{Success?}
        H -->|Yes| D
        H -->|No| I[Retry 2]
        I --> J{Success?}
        J -->|Yes| D
        J -->|No| K[Retry 3]
        K --> L{Success?}
        L -->|Yes| D
        L -->|No| M[Max Retries]
    end

    subgraph Fallback["fallback"]
        M --> N[Circuit Breaker OPEN]
        N --> O[Switch Provider]
        O --> P[Use Alternative API]
        P --> Q{Success?}
        Q -->|Yes| D
        Q -->|No| R[Report Failure]
        D --> S[Circuit Breaker CLOSE]
    end
```

### Skills Used

| Skill | ZAI ID | Purpose |
|-------|--------|---------|
| health-check | System | Check API availability |
| api-retry | System | Exponential backoff retry |
| fallback | System | Switch to alternative provider |

---

## 6. Toolkit vs System Decision

Where a skill comes from -- the toolkit or the system directory.

![Toolkit vs System](./diagrams/06-toolkit-vs-system.png)

```mermaid
flowchart TB
    subgraph Query["SKILL REQUEST"]
        A[Agent Needs Skill] --> B{Check Name}
    end

    subgraph ToolkitCheck["TOOLKIT CHECK"]
        B --> C{Exists in<br>/Zai-agent-toolkit_v/skills/?}
        C -->|Yes| D[Use Custom Version]
        C -->|No| E{Has _sts suffix?}
    end

    subgraph SystemCheck["SYSTEM CHECK"]
        E -->|Yes| F[Personal Skill]
        E -->|No| G{Exists in<br>/my-project/skills/?}
        G -->|Yes| H[Use Z.ai System Skill]
        G -->|No| I[Skill Not Found]
    end

    subgraph Action["ACTION"]
        D --> J[Load SKILL.md]
        F --> K{Exists?}
        K -->|Yes| J
        K -->|No| L[Create New _sts]
        H --> J
        I --> M[Implement Directly<br>or Create New Skill]
        L --> N[skill-creator]
        N --> J
        J --> O[Execute Skill]
    end
```

---

## 7. Full Sync Architecture (Windows + GitHub + Sandbox)

Complete synchronization architecture between Windows, GitHub, and Z.ai Sandbox.

![Full Sync Architecture](./diagrams/07-full-sync-architecture.png)

```mermaid
flowchart TB
    subgraph Windows["WINDOWS ($env:USERPROFILE\.zcode\)"]
        A[ZCode Client]
        B[skills/]
        C[instructions/]
        D[standards/]

        B -.->|symlink| E
        C -.->|symlink| F
        D -.->|symlink| G

        subgraph LocalToolkit["Zai-agent-toolkit_v/"]
            E[skills/]
            F[instructions/]
            G[standards/]
        end
    end

    subgraph GitHub["GITHUB"]
        H[github.com/stsgs1980/<br>Zai-agent-toolkit_v]
    end

    subgraph Sandbox["Z.ai SANDBOX (/home/z/my-project/)"]
        I[System Skills/]
        J[Zai-agent-toolkit_v/<br>submodule]
    end

    %% Sync flows
    LocalToolkit -->|"git push"| H
    H -->|"git pull"| LocalToolkit

    J -->|"git push"| H
    H -->|"git pull"| J

    I -.->|"auto by Z.ai"| K[Agent invokes]
    E -.->|"via symlink"| K

    %% Labels
    L[sync-toolkit_sts<br>ZAI-STS-002]
    L -.->|orchestrates| LocalToolkit
    L -.->|orchestrates| J
```

### Windows Directory Structure

```text
$env:USERPROFILE\.zcode\
+-- agent/
+-- cli/
+-- v2/
+-- skills/ -----------------> Zai-agent-toolkit_v\skills\ (symlink)
+-- instructions/ -----------> Zai-agent-toolkit_v\instructions\ (symlink)
+-- standards/ --------------> Zai-agent-toolkit_v\standards\ (symlink)
+-- Zai-agent-toolkit_v/
    +-- skills/
    +-- instructions/
    +-- standards/
    +-- sync-toolkit.ps1
```

### Sync Workflow

| Direction | Command | Location |
|-----------|---------|----------|
| Sandbox -> GitHub | `git push` | `/home/z/my-project/Zai-agent-toolkit_v/` |
| GitHub -> Windows | `git pull` or `sync-toolkit` | `$env:USERPROFILE\.zcode\Zai-agent-toolkit_v\` |
| Windows -> GitHub | `git push` | `$env:USERPROFILE\.zcode\Zai-agent-toolkit_v\` |
| GitHub -> Sandbox | `git pull` | `/home/z/my-project/Zai-agent-toolkit_v/` |

### sync-toolkit_sts (ZAI-STS-002)

Personal skill for orchestrating sync between all three locations.

**Triggers:** "sync toolkit", "update toolkit", "obnovit", "lokalno"

---

## Directory Structure Reference

```text
/home/z/my-project/
+-- skills/                    # Z.ai System Skills (auto-updated)
|   +-- ASR/
|   +-- LLM/
|   +-- ... (50+ skills)
|
+-- Zai-agent-toolkit_v/
    +-- skills/                # Custom Skills (persistent)
        +-- commit-work/        # ZAI-DEV-004
        +-- session-log/        # ZAI-SESSION-002
        +-- skill-creator/      # ZAI-META-002
        +-- *_sts/              # Personal skills
```

---

## Quick Reference: Skill IDs

| Domain | ID Range | Examples |
|--------|----------|----------|
| META | ZAI-META-001+ | skill-id-system, skill-creator |
| DEV | ZAI-DEV-001+ | project-clone, commit-work, database-schema-designer |
| SEC | ZAI-SEC-001+ | (planned) |
| GIT | ZAI-GIT-001+ | (planned) |
| HEALTH | ZAI-HEALTH-001+ | (planned) |
| SESSION | ZAI-SESSION-001+ | session-log, context-consolidation |
| QA | ZAI-QA-001+ | qa-test-planner |
| REQ | ZAI-REQ-001+ | requirements-clarity |
| ARCH | ZAI-ARCH-001+ | mermaid-diagrams |
| STS | ZAI-STS-001+ | Personal skills (_sts suffix) |

---

Built with: Python + PowerShell + Markdown
