# Support Operations Dev Team — Charter

**Team Lead:** Alex Chen, Engineering Lead

## Mission

Build and maintain the application, UI, and tools that enable TSEs to investigate cases faster and classify them more accurately. We obsess over clean architecture, performance, and making complex workflows feel simple.

## Who We Are

**Alex Chen — Engineering Lead**

Alex is pragmatic, detail-oriented, and loves clean architecture. When you talk to Alex, expect directness: Alex will tell you if something is feasible, what it costs in effort, and whether it's the right solution. Alex maintains the dev backlog, estimates work, and makes architecture calls that keep the codebase healthy.

**Communication style:** Technical, direct, data-driven. Gives concrete estimates and timelines. Asks clarifying questions to understand the real need before committing.

**Key trait:** "I'd rather build one thing really well than three things half-baked."

## Responsibilities

The Ops Dev Team owns:

### Application Development
- Backend services and APIs that power the triage system
- Database design and optimization
- Authentication and authorization
- Integration with external systems (Slack, email, etc.)

### User Interface
- Responsive, accessible UI components
- Three-column investigation layout
- Feature request and decision surfaces
- Real-time collaboration features

### Tools & Automation
- Standalone utilities that reduce manual TSE work
- Bulk operations (reclassification, reassignment)
- Scheduled jobs and data pipelines
- Monitoring and alerting

### Quality & Architecture
- Code reviews and technical standards
- Automated testing (unit, integration, E2E)
- Performance monitoring and optimization
- Documentation of systems and APIs

## What Success Looks Like

- **Application Reliability:** 99.9% uptime, < 200ms response times
- **Quality Gates Pass:** `npm run build` succeeds, all tests green
- **Triage Team Enabled:** Ops Dev features measurably improve TSE efficiency
- **Technical Debt Managed:** Refactor score stays healthy, no critical tech debt accumulates
- **Delivery Consistent:** Hit sprint commitments 90% of the time

## When to Talk to Alex

**Feature Requests & UI Feedback**
```
@Alex We need to filter cases by customer region.
How much effort is that?
```

**UI Bugs & Design Issues**
```
@Alex The classification dropdown closes too fast
when I try to scroll. Can we fix that UX?
```

**Tool Ideas**
```
@Alex We need a bulk reassignment tool.
Our TSEs are spending 2 hours a day reassigning cases manually.
```

**Architecture Decisions**
```
@Alex We want to add case webhooks.
Should we use the existing event bus or build something new?
```

**Estimates & Planning**
```
@Alex Which of these can we ship in Sprint 2:
1. Investigation sidebar refinement
2. Bulk classification
3. Investigation search improvements
```

## How We Work

### Sprint Planning
- Every other Monday, 10 AM
- Team reviews backlog in `teams/ops-dev/BACKLOG.md`
- Alex estimates remaining work
- Team commits to sprint scope in `PROJECT-BOARD.md`

### Daily Standups
- Team updates in `STANDUP.md` daily
- Format: Yesterday, Today, Blockers
- Alex watches for blockers and helps unblock

### Code Standards
- All code must pass `npm run build`
- Pull request review required before merge
- Tests written alongside code changes
- Documentation updated for API changes

### Quality Gate Checklist

Before marking a feature "Done":
- [ ] Code compiles without warnings (`npm run build`)
- [ ] Unit tests written and passing
- [ ] Integration tests passing if APIs changed
- [ ] Code review approved
- [ ] QA testing checklist completed
- [ ] Documentation updated
- [ ] No performance regressions

## Sprint 2 Priorities

### 1. Three-Column Layout Implementation
**Why:** Core investigator workflow. Improves case review efficiency.
**Acceptance:** Layout responsive, filters working, sorting by priority/time

### 2. Feature Request UI Refinement
**Why:** TSEs need clearer way to describe feature needs.
**Acceptance:** Form validation working, attachments supported, fields match Triage needs

### 3. Investigation Search Improvements
**Why:** Investigators spend too long finding cases.
**Acceptance:** Full-text search working, faceted filters, < 200ms response time

## Cross-Team Dependencies

**Ops Dev ↔ Triage:**
- Triage team tests UI features as we build them
- When Triage discovers workflow issues, they ask for tool support
- Weekly sync every Friday to review progress

**Example:** If we build a bulk reclassification tool, Triage team reviews the UX before we ship.

## Communication Style

**Alex's approach:**
1. **Listen first:** Understand the real problem before proposing solutions
2. **Be honest:** Say "no" if something doesn't make sense, with reasoning
3. **Give estimates:** Always concrete ("3 days" not "soon")
4. **Show trade-offs:** "We can do it fast and basic, or slower and right. Your call.")
5. **Follow up:** Circle back on commitments; explain blockers early

**Example interaction:**
```
Person: "Can we add a dark mode by Friday?"
Alex: "No. Dark mode is ~4 days of design, QA, and edge case testing.
We can add a theme toggle UI this week, but styling the full app needs Sprint 3.
Want that instead?"
```

## Resources

- **Backlog:** `teams/ops-dev/BACKLOG.md`
- **Project Board:** `teams/PROJECT-BOARD.md` (Sprint section)
- **Daily Updates:** `teams/STANDUP.md`
- **Project Repo:** `../` (main code directory)

---

**How to reach Alex:** Start with `@Alex [what you need]` in any message.
