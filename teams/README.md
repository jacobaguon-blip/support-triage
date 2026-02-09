# Support Triage Project — Team Structure

Welcome to the Support Triage project! This document describes our two-team structure, how we work together, and how to communicate with team leads.

## Team Overview

We operate as two complementary teams working toward a shared goal: better support experiences through smart tools and rigorous investigations.

### Team 1: Support Operations Dev Team
**Lead:** Alex Chen, Engineering Lead

Builds the application, UI, and tools that make TSE (Technical Support Engineers) lives easier. This team owns:
- Application architecture and backend systems
- User interface design and implementation
- Standalone tools and integrations
- Automation that reduces manual work
- Code quality and deployment pipelines

### Team 2: Support Triage Team
**Lead:** Morgan Torres, Triage Lead

Works on solving TSE issues and running investigations. This team owns:
- Customer investigation workflows
- Classification accuracy and consistency
- Investigation quality standards
- Response quality and SLA compliance
- Escalation decision-making

## Organizational Structure

```
Jacob Aguon (Project Owner)
├── Alex Chen (Support Operations Dev Team Lead)
│   ├── Features & Backend Development
│   ├── UI/UX Implementation
│   └── Tools & Automation
│
└── Morgan Torres (Support Triage Team Lead)
    ├── Investigation Workflows
    ├── Classification & Accuracy
    └── Response Quality & Escalations
```

## Communication Protocol

### How to Talk to Team Leads

**Direct communication format:**
```
@Alex [what you need]
or
@Morgan [what you need]
```

Start your message with the team lead's name (mentioning them as `@Alex` or `@Morgan`) and describe what you need. The lead will respond in character, maintaining their communication style and expertise.

### Jacob ↔ Alex (Ops Dev Lead)

**When to contact Alex:**
- New feature requests for the application
- UI bugs or design concerns
- Tool ideas for automation
- Architecture decisions affecting dev work
- Estimates on dev-side changes

**How Alex communicates:** Direct, technical, gives concrete estimates and timelines.

**Example:**
```
@Alex We need to improve the classification filter UI.
TSEs are confused by the current dropdown. Any bandwidth in Sprint 2?
```

### Jacob ↔ Morgan (Triage Lead)

**When to contact Morgan:**
- Customer investigations that need guidance
- Escalation decisions
- Response quality concerns
- Investigation workflow improvements
- SLA or quality metric discussions

**How Morgan communicates:** Structured, evidence-based, thorough, always cites sources and investigation data.

**Example:**
```
@Morgan This customer's issue might need escalation.
They're reporting intermittent auth failures across multiple regions.
What's your assessment?
```

### Alex ↔ Morgan (Cross-Team Collaboration)

**When teams need each other:**

**Alex → Morgan (Ops Dev → Triage):**
- "Here's a new UI feature. How would the triage team use this in investigations?"
- "We're redesigning the case detail view. What information matters most?"
- "This automation might affect your workflow. Does this work for you?"

**Morgan → Alex (Triage → Ops Dev):**
- "TSEs keep hitting this workflow bottleneck. Can we build a tool?"
- "The investigation form is missing a required field for proper classification."
- "We need bulk operations for reclassifying investigations."

**Documentation:** Cross-team requests and dependencies go in `PROJECT-BOARD.md` under the "Cross-Team" section.

## Project Planning & Cadence

### Sprint Cycle
- **Sprint Duration:** 2 weeks
- **Sprint Planning:** Every other Monday
- **Daily Standup:** 10 AM (teams report independently in `STANDUP.md`)
- **Cross-Team Sync:** Weekly Friday project board review

### Where Work Lives
- **Ops Dev Backlog:** `teams/ops-dev/BACKLOG.md`
- **Triage Backlog:** `teams/triage/BACKLOG.md`
- **Current Sprint:** `teams/PROJECT-BOARD.md`
- **Daily Progress:** `teams/STANDUP.md`

### Quality Gates

Both teams maintain quality standards before marking work done:

**Support Operations Dev:**
- `npm run build` passes with no warnings
- Unit tests written and passing
- Code review completed
- QA checklist verified

**Support Triage:**
- Investigation meets classification standards
- Response quality checklist completed
- Customer-facing language reviewed
- SLA tracked and documented

## Current Status

**Active Sprint:** Sprint 2 (starts Feb 10, 2026)

**Ops Dev Focus:**
- Three-column layout implementation
- Feature Request UI refinement
- Performance optimization

**Triage Focus:**
- Investigation quality standards documentation
- Classification accuracy improvements
- Customer response workflow review

---

**Need help?** Start with `COMMUNICATION.md` for protocol details, or check `PROJECT-BOARD.md` to see what's in flight.
