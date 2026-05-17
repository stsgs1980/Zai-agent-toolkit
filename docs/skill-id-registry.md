# Skill ID Registry

## ID Format

`ZAI-<DOMAIN>-<NUMBER>`

### Domains

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
| SEC | SEC | Security-related skills |
| STS | STS | Personal skills (user signature: _sts) |
| GIT | GIT | Git operations and safety |
| SDK | SDK | SDK integrations |
| HEALTH | HEALTH | Health monitoring and fallbacks |
| DOC | DOC | Documentation generation |

---

## Assigned IDs

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
| ZAI-DEV-002 | anti-monolith | 1.0 | STS | Planned | both |
| ZAI-DEV-003 | project-clone | 1.0 | STS | Active | sandbox |
| ZAI-DEV-004 | commit-work | 1.0 | STS | Active | both |
| ZAI-DEV-005 | database-schema-designer | 1.0 | STS | Active | both |

### SESSION Domain

| ID | Skill | Version | Author | Status | Compatibility |
|----|-------|---------|--------|--------|---------------|
| ZAI-SESSION-002 | session-log | 1.1 | STS | Active | both |
| ZAI-SESSION-003 | context-consolidation | 1.0 | STS | Active | both |

### ARCH Domain

| ID | Skill | Version | Author | Status | Compatibility |
|----|-------|---------|--------|--------|---------------|
| ZAI-ARCH-002 | mermaid-diagrams | 1.0 | STS | Active | both |

### QA Domain

| ID | Skill | Version | Author | Status | Compatibility |
|----|-------|---------|--------|--------|---------------|
| ZAI-QA-001 | qa-test-planner | 1.0 | STS | Active | both |

### REQ Domain

| ID | Skill | Version | Author | Status | Compatibility |
|----|-------|---------|--------|--------|---------------|
| ZAI-REQ-001 | requirements-clarity | 1.0 | STS | Active | both |

### SEC Domain

| ID | Skill | Version | Author | Status | Compatibility |
|----|-------|---------|--------|--------|---------------|
| ZAI-SEC-001 | sanitize-validate | 1.0 | STS | Planned | both |

### STS Domain (Personal)

| ID | Skill | Version | Author | Status | Compatibility |
|----|-------|---------|--------|--------|---------------|
| ZAI-STS-001 | prompt-engineering_sts | 1.0 | STS | Active | both |
| ZAI-STS-002 | sync-toolkit_sts | 1.0 | STS | Active | sandbox |
| ZAI-STS-003 | performance-code-generator_sts | 1.0 | STS | Active | sandbox |
| ZAI-STS-004 | frontend-styling-expert_sts | 1.0 | STS | Active | both |
| ZAI-STS-005 | phi-layout_sts | 3.0 | STS | Active | both |
| ZAI-STS-006 | zai-ui-composer_sts | 1.1.2 | STS | Active | sandbox |

---

## System Skills (Z.ai)

These skills are provided by Z.ai sandbox and cannot be modified:

| Name | Location | Notes |
|------|----------|-------|
| fullstack-dev | /home/z/my-project/skills/fullstack-dev/ | Next.js 16 development |
| visual-design-foundations | /home/z/my-project/skills/visual-design-foundations/ | Design tokens, typography |
| phi-layout (golden-grid) | /home/z/my-project/skills/phi-layout/ | Grid layouts (our version: phi-layout_sts) |
| zai-ui-composer | /home/z/my-project/skills/zai-ui-composer/ | UI composition (our version: zai-ui-composer_sts) |

---

## Reserved IDs

Next available IDs by domain:

| Domain | Next ID |
|--------|---------|
| META | ZAI-META-003 |
| MEM | ZAI-MEM-005 |
| FS | ZAI-FS-002 |
| DEV | ZAI-DEV-006 |
| SESSION | ZAI-SESSION-004 |
| ARCH | ZAI-ARCH-003 |
| QA | ZAI-QA-002 |
| REQ | ZAI-REQ-002 |
| SEC | ZAI-SEC-002 |
| STS | ZAI-STS-007 |
| GIT | ZAI-GIT-001 |
| SDK | ZAI-SDK-001 |
| HEALTH | ZAI-HEALTH-001 |
| DOC | ZAI-DOC-001 |

---

Last Updated: 2026-05-17

---
Built with: Z.ai Agent Toolkit
