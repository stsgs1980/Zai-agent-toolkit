# Skill ID Registry

## ID Format

`ZAI-<DOMAIN>-<NUMBER>`

### Toolkit Domains

These domains contain skills that belong to the Zai-agent-toolkit repository:

| Domain | Code | Description |
|--------|------|-------------|
| META | META | Meta-skills for toolkit management |
| MEM | MEM | Memory system (ChromaDB storage and retrieval) |
| FS | FS | Filesystem tools (indexing, scanning) |
| DEV | DEV | Development tools and patterns |
| SESSION | SESSION | Session management (logging, context) |
| ARCH | ARCH | Architecture and diagrams |
| QA | QA | Quality assurance and testing |
| REQ | REQ | Requirements and planning |
| STS | STS | Personal skills (user signature: _sts) |

---

## Toolkit Skills (Assigned IDs)

### META Domain

| ID | Skill | Version | Author | Status | Compatibility |
|----|-------|---------|--------|--------|---------------|
| ZAI-META-001 | skill-id-system | 1.0 | STS | Active | both |
| ZAI-META-002 | skill-creator | 1.1 | STS | Active | both |

### MEM Domain

| ID | Skill | Version | Author | Status | Compatibility |
|----|-------|---------|--------|--------|---------------|
| ZAI-MEM-001 | memory-store | 1.0 | STS | Active | both |
| ZAI-MEM-002 | memory-query | 1.0 | STS | Active | both |
| ZAI-MEM-003 | memory-delete | 1.0 | STS | Active | both |
| ZAI-MEM-004 | memory-export | 1.0 | STS | Active | both |

### FS Domain

| ID | Skill | Version | Author | Status | Compatibility |
|----|-------|---------|--------|--------|---------------|
| ZAI-FS-001 | folder-indexer | 1.0 | STS | Active | both |

### DEV Domain

| ID | Skill | Version | Author | Status | Compatibility |
|----|-------|---------|--------|--------|---------------|
| ZAI-DEV-001 | project-clone | 1.0 | STS | Active | sandbox |
| ZAI-DEV-002 | commit-work | 1.0 | STS | Active | both |
| ZAI-DEV-003 | database-schema-designer | 1.0 | STS | Active | both |

### SESSION Domain

| ID | Skill | Version | Author | Status | Compatibility |
|----|-------|---------|--------|--------|---------------|
| ZAI-SESSION-001 | session-log | 1.1 | STS | Active | both |
| ZAI-SESSION-002 | context-consolidation | 1.0 | STS | Active | both |

### ARCH Domain

| ID | Skill | Version | Author | Status | Compatibility |
|----|-------|---------|--------|--------|---------------|
| ZAI-ARCH-001 | mermaid-diagrams | 1.0 | STS | Active | both |
| ZAI-ARCH-002 | anti-monolith | 1.0 | STS | Active | both |

### QA Domain

| ID | Skill | Version | Author | Status | Compatibility |
|----|-------|---------|--------|--------|---------------|
| ZAI-QA-001 | qa-test-planner | 1.0 | STS | Active | both |

### REQ Domain

| ID | Skill | Version | Author | Status | Compatibility |
|----|-------|---------|--------|--------|---------------|
| ZAI-REQ-001 | requirements-clarity | 1.0 | STS | Active | both |

### STS Domain (Personal)

| ID | Skill | Version | Author | Status | Compatibility |
|----|-------|---------|--------|--------|---------------|
| ZAI-STS-001 | prompt-engineering_sts | 1.1 | STS | Active | both |
| ZAI-STS-002 | sync-toolkit_sts | 1.0 | STS | Active | sandbox |
| ZAI-STS-003 | performance-code-generator_sts | 1.0 | STS | Active | sandbox |
| ZAI-STS-004 | frontend-styling-expert_sts | 1.0 | STS | Active | both |
| ZAI-STS-005 | phi-layout_sts | 3.0 | STS | Active | both |
| ZAI-STS-006 | zai-ui-composer_sts | 1.1.2 | STS | Active | sandbox |
| ZAI-STS-007 | workflow-discipline_sts | 1.0 | STS | Active | both |

---

## System Skills (Z.ai Sandbox)

These skills are provided by the Z.ai platform. They live in `/home/z/my-project/skills/` and cannot be modified by the toolkit. They do NOT receive ZAI- prefix IDs.

| Name | Category | Notes |
|------|----------|-------|
| fullstack-dev | Development | Next.js 16 development |
| visual-design-foundations | Design | Design tokens, typography |
| phi-layout (golden-grid) | Design | Grid layouts (toolkit twin: phi-layout_sts) |
| zai-ui-composer | Design | UI composition (toolkit twin: zai-ui-composer_sts) |
| frontend-styling-expert | Design | CSS/styling (toolkit twin: frontend-styling-expert_sts) |
| performance-code-generator | Development | Code optimization (toolkit twin: performance-code-generator_sts) |
| ui-ux-pro-max | Design | Advanced UI/UX patterns |
| anti-monolith | Architecture | Modular architecture enforcement |
| c4-architecture | Architecture | C4 model diagrams with Mermaid |
| git-checkpoint | Git | WIP commits and recovery tags |
| git-safe-ops | Git | Backup + recover for risky ops |
| git-safety | Git | Deadlock prevention rules |
| sanitize-validate | Security | Input sanitization and validation |
| api-retry | API | Retry logic with exponential backoff |
| health-check | API | API health monitoring |
| fallback | API | Fallback provider strategy |
| dev-watchdog | Development | Dev server keepalive |
| z-ai-web-dev-sdk | SDK | Z.ai SDK for chat, images, search |
| doc-gen | Documents | PDF, DOCX, XLSX generation |
| session-handoff | Session | Context handoff between sessions |
| session-resume | Session | Session recovery after restart |
| skill-creator | Meta | Skill creation (system version) |
| skill-judge | Meta | Skill quality evaluation |
| skill-vetter | Meta | Skill security vetting |
| charts | Visualization | Chart and diagram creation |
| image-generation | AI | Text-to-image generation |
| web-search | AI | Web search integration |
| web-reader | AI | Web page content extraction |
| VLM | AI | Vision-language model |
| ASR | AI | Speech-to-text |
| LLM | AI | Chat completions |
| agent-browser | Browser | Headless browser automation |

---

## Reserved IDs

Next available IDs by domain:

| Domain | Next ID |
|--------|---------|
| META | ZAI-META-003 |
| MEM | ZAI-MEM-005 |
| FS | ZAI-FS-002 |
| DEV | ZAI-DEV-004 |
| SESSION | ZAI-SESSION-003 |
| ARCH | ZAI-ARCH-002 |
| QA | ZAI-QA-002 |
| REQ | ZAI-REQ-002 |
| STS | ZAI-STS-008 |

---

Last Updated: 2026-05-18

---
Built with: Z.ai Agent Toolkit
