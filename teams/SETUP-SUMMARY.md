# Support Triage Project — Two-Team Structure Setup

**Date:** Feb 8, 2026
**Project:** Support Triage
**Owner:** Jacob Aguon

---

## What Was Created

A complete two-team organizational structure for the Support Triage project with clear leadership, communication protocols, and workflows.

### The Two Teams

#### 1. Support Operations Dev Team
**Lead:** Alex Chen (Engineering Lead)
**Focus:** Build the application, UI, and tools
**Personality:** Pragmatic, detail-oriented, loves clean architecture
**Files:** `teams/ops-dev/CHARTER.md`, `teams/ops-dev/BACKLOG.md`

#### 2. Support Triage Team
**Lead:** Morgan Torres (Triage Lead)
**Focus:** Solve customer issues through investigation and classification
**Personality:** Empathetic, thorough, customer-focused
**Files:** `teams/triage/CHARTER.md`, `teams/triage/BACKLOG.md`

---

## Files Created

### Core Documentation

1. **`teams/README.md`** — Overview of both teams
   - Team descriptions and responsibilities
   - Organizational structure chart
   - Communication protocol summary
   - Project planning cadence

2. **`teams/ops-dev/CHARTER.md`** — Alex Chen's Team Charter
   - Alex's persona and communication style
   - Team responsibilities (app dev, UI, tools, automation)
   - What success looks like
   - When to talk to Alex
   - How the team works (sprint planning, code standards, QA gates)
   - Sprint 2 priorities

3. **`teams/triage/CHARTER.md`** — Morgan Torres' Team Charter
   - Morgan's persona and communication style
   - Team responsibilities (investigations, classification, quality)
   - What success looks like
   - When to talk to Morgan
   - Investigation standards and quality gates
   - Sprint 2 priorities

### Project Management

4. **`teams/PROJECT-BOARD.md`** — Current Sprint Board
   - Sprint 2 overview (Feb 10-23, 2026)
   - Work items by team (Backlog → In Progress → Review → Done)
   - Cross-team dependencies and collaboration
   - Communication protocol for the board
   - Success metrics

5. **`teams/STANDUP.md`** — Daily Standup Log
   - Daily progress tracking (Yesterday/Today/Blockers format)
   - Example entries for this week
   - How to use the log
   - This week's priorities

### Communication

6. **`teams/COMMUNICATION.md`** — Communication Protocol
   - Format for talking to team leads (@Alex, @Morgan)
   - Response time expectations
   - Communication paths:
     - Jacob → Alex (feature requests, UI feedback, architecture)
     - Jacob → Morgan (investigations, escalations, quality)
     - Alex → Morgan (when features affect workflow)
     - Morgan → Alex (when tools are needed)
   - Cross-team collaboration process
   - Weekly sync meeting (Friday 2 PM)
   - Standards for good communication
   - Escalation path

---

## How to Use This Structure

### For Jacob (Project Owner)

**Starting conversations with team leads:**
```
@Alex [what you need about dev/UI/tools]
@Morgan [what you need about investigations/quality]
```

Examples in COMMUNICATION.md show how to phrase requests effectively.

**Tracking progress:**
- Daily: Check STANDUP.md for what happened yesterday
- Weekly: Attend Friday 2 PM sync with both leads
- Always: Reference PROJECT-BOARD.md for current work items

**Making decisions:**
- Alex and Morgan provide evidence-based recommendations
- Friday sync is where cross-team blockers get resolved
- PROJECT-BOARD.md tracks what's approved and in flight

### For Alex (Ops Dev Lead)

**Your responsibilities:**
- See `teams/ops-dev/CHARTER.md` — defines what your team owns
- Maintain `teams/ops-dev/BACKLOG.md` (not yet created, but referenced)
- Respond to requests from Jacob and Morgan using your direct, technical style
- Lead daily standup for your team
- Attend Friday cross-team sync

**How to request Triage input:**
```
@Morgan We need your feedback on [feature]. Question: [specific ask]?
```
See examples in COMMUNICATION.md

**When Triage asks for tools:**
- Estimate the effort honestly
- Ask clarifying questions
- Propose timeline based on current sprint commitments
- Document agreed scope in PROJECT-BOARD.md

### For Morgan (Triage Lead)

**Your responsibilities:**
- See `teams/triage/CHARTER.md` — defines what your team owns
- Maintain `teams/triage/BACKLOG.md` (not yet created, but referenced)
- Respond to Jacob's investigation/escalation questions using your structured, evidence-based style
- Provide UX feedback to Alex on features affecting workflow
- Request tools/features from Ops Dev when needed
- Lead daily standup for your team
- Attend Friday cross-team sync

**How to request features from Ops Dev:**
```
@Alex We need [tool/feature] because [impact].
Could we do this in [timeframe]?
```
See examples in COMMUNICATION.md

**When Ops Dev asks for UX feedback:**
- Test the feature from an investigator's perspective
- Ask how it affects workflow
- Provide structured feedback with specifics
- Give timeline for testing/feedback

### For Both Teams

**Daily standup:**
- Update STANDUP.md every day with Yesterday/Today/Blockers
- Flag blockers immediately (don't wait for Friday)

**Project board:**
- Check PROJECT-BOARD.md weekly for what's in flight
- Update status as you progress
- Add new cross-team requests with full context

**Weekly sync:**
- Friday 2 PM (all three: Jacob, Alex, Morgan)
- 30-45 minutes
- Review cross-team section of PROJECT-BOARD.md
- Resolve blockers and plan next week

---

## Sprint 2 At a Glance

**Duration:** Feb 10-23, 2026

### Ops Dev (Alex's Team)
- [ ] Three-column layout implementation (responsive, filters, sorting)
- [ ] Feature Request UI refinement (form validation, attachments, field mapping)
- [ ] Investigation search improvements (full-text search, faceted filters, < 200ms response)

### Triage (Morgan's Team)
- [ ] Investigation quality standards documentation (playbooks for top 5 issues)
- [ ] Classification accuracy improvement (audit 100 cases, retraining)
- [ ] Customer response workflow review (templates, tone guide, QA checklist)

### Cross-Team Work
- Morgan tests Feature Request UI form (need field confirmation from Morgan by Feb 9)
- Morgan tests three-column layout UX (testing target: Feb 16)
- Ops Dev proposes bulk classification tool (if Classification Accuracy audit identifies gaps)

---

## Next Steps

### This Week (Feb 10-14)
1. **Monday, Feb 10:** Sprint planning (confirm scope, assignments)
2. **Daily:** Update STANDUP.md with progress
3. **Morgan provides feedback:** Feature Request form field requirements (deadline: Feb 9, EOD)
4. **Friday Feb 14, 2 PM:** First cross-team sync

### Next Week (Feb 17-21)
1. **Ops Dev ships:** Feature Request UI
2. **Ops Dev starts:** Investigation search improvements
3. **Triage finishes:** Classification accuracy audit
4. **Triage starts:** Response workflow review
5. **Triage tests:** Three-column layout UX (full feedback by Feb 17)

### End of Sprint (Feb 23)
1. **Retrospective:** What went well, what to improve
2. **Deployment:** Sprint 2 features to production
3. **Sprint 3 Planning:** New priorities and commitments

---

## Key Documents Reference

| Document | Purpose | Owner | Update Frequency |
|----------|---------|-------|------------------|
| README.md | Team overview & structure | Jacob | Quarterly or when team changes |
| ops-dev/CHARTER.md | Ops Dev team definition | Alex | When responsibilities change |
| triage/CHARTER.md | Triage team definition | Morgan | When responsibilities change |
| PROJECT-BOARD.md | Current work & priorities | Both leads | Daily updates, Friday sync |
| STANDUP.md | Daily progress log | Both teams | Every business day |
| COMMUNICATION.md | How to talk to leads | Jacob | When protocols change |

---

## Communication Quick Start

### @ Mention Format

```
@Alex [describe what you need]
→ Use for dev work, UI, features, architecture, estimates

@Morgan [describe what you need]
→ Use for investigations, escalations, quality, workflow, SLA questions

@Alex @Morgan [describe what needs alignment]
→ Use when both teams need to be involved
```

### Response Times
- Same business day expected (< 8 hours)
- Urgent blockers: 30 minutes
- Friday sync: fixed weekly meeting

### Common Requests

**To Alex:**
- "Can we build X?" → Alex estimates and proposes timeline
- "This UI is confusing" → Alex asks clarifying questions and proposes fixes
- "How would you implement Y?" → Alex explains approach and trade-offs

**To Morgan:**
- "Is this customer critical?" → Morgan asks clarifying questions and makes recommendation
- "How should we respond?" → Morgan proposes response with reasoning
- "Do we need to escalate?" → Morgan analyzes and provides decision framework

---

## Success Metrics for This Structure

After Sprint 2, we'll measure:

| Metric | Target |
|--------|--------|
| Ops Dev story points delivered | 90% of committed |
| Triage investigations completed on quality standards | 95%+ |
| Cross-team blockers resolved within 1 day | 100% |
| Friday sync attendance | 100% |
| Customer satisfaction score | 4.5+ / 5.0 |
| SLA compliance | 98%+ |

---

## Questions?

- **About team structure/responsibilities:** Check README.md
- **About how to talk to a specific lead:** Check COMMUNICATION.md
- **About current work and priorities:** Check PROJECT-BOARD.md
- **About daily progress:** Check STANDUP.md
- **About a specific team's approach:** Check their CHARTER.md

---

**Created:** Feb 8, 2026
**By:** Project Setup
**For:** Jacob Aguon, Alex Chen, Morgan Torres
**Status:** Ready to use starting Sprint 2 (Feb 10, 2026)
