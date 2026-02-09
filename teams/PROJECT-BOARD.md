# Support Triage Project — Current Sprint Board

**Sprint:** Sprint 2
**Duration:** Feb 10 - Feb 23, 2026
**Last Updated:** Feb 8, 2026

---

## Sprint Overview

### Ops Dev Focus (Alex Chen)
- Three-column layout implementation
- Feature Request UI refinement and validation
- Investigation search improvements (full-text, faceting)

### Triage Focus (Morgan Torres)
- Investigation quality standards documentation
- Classification accuracy audit and retraining
- Customer response workflow review and templates

### Cross-Team Priorities
- Weekly sync every Friday at 2 PM
- Triage team tests UI features as they ship
- Ops Dev prioritizes tools blocking Triage workflow

---

## Work Items by Team

### BACKLOG — Not Yet Started

#### Support Operations Dev
- [ ] Mobile responsiveness for three-column layout
- [ ] Dark mode theme toggle (Sprint 3 candidate)
- [ ] Keyboard navigation improvements
- [ ] API documentation for triage webhooks
- [ ] Performance testing and optimization for large case lists

#### Support Triage
- [ ] Severity classification guide (decision tree format)
- [ ] Investigation playbook for database performance issues
- [ ] Customer tone guide and response templates
- [ ] SLA breach escalation procedure documentation
- [ ] Root cause analysis template for investigations

---

## IN PROGRESS — Currently Being Worked

### Support Operations Dev

#### Three-Column Layout Implementation
**Owner:** Alex Chen
**Status:** In Development
**Current Work:**
- Layout container and responsive grid done
- Column sizing logic in progress
- Filter panel component next
- Target completion: Feb 17

**Dependencies:**
- Triage team review of layout UX once initial version ready
- Performance testing before deployment

**Blockers:** None

---

#### Feature Request UI Refinement
**Owner:** Alex Chen
**Status:** In Design Review
**Current Work:**
- Form fields mapped to Triage requirements
- Attachment upload mechanism prototyped
- Form validation rules implemented
- Need Triage feedback on required vs. optional fields

**Dependencies:**
- Morgan's input on what information is essential for classification

**Blockers:** Awaiting Triage team input on field requirements

---

#### Investigation Search Improvements
**Owner:** Alex Chen
**Status:** Backlog (Ready to Start)
**Scope:**
- Full-text search across case titles and descriptions
- Faceted filters (category, priority, status)
- Performance target: < 200ms query time for 10k cases

**Start Date:** Feb 17 (after Feature Request UI ships)

---

### Support Triage

#### Investigation Quality Standards Documentation
**Owner:** Morgan Torres
**Status:** In Progress
**Current Work:**
- Authentication failures playbook: DONE
- Database performance playbook: IN PROGRESS
- API errors playbook: QUEUED
- QA checklist for quality audits: DRAFT

**Target Completion:** Feb 16

**Dependencies:** Needs Ops Dev to confirm feature availability before finalizing workflows

**Blockers:** None

---

#### Classification Accuracy Improvement
**Owner:** Morgan Torres
**Status:** In Progress
**Current Work:**
- Audit 100 recent cases against current taxonomy: IN PROGRESS (50 done)
- Identify misclassification patterns: PENDING
- Retraining session planning: PLANNED for Feb 19

**Target Completion:** Feb 20

**Blockers:** None

---

#### Customer Response Workflow Review
**Owner:** Morgan Torres
**Status:** Backlog (Ready to Start)
**Scope:**
- Response templates for 5 common issue categories
- Tone guide (technical vs. non-technical audiences)
- Quality audit checklist for response review
- New investigators training guide

**Start Date:** Feb 17 (after Classification Accuracy Audit)

---

## REVIEW — Ready for QA/Approval

*None currently*

---

## DONE — Completed This Sprint

*Sprint just started; completed items will appear here*

---

## Cross-Team Dependencies & Collaboration

### Ops Dev → Triage (Asking for Input)

#### Feature Request Form — Morgan, we need your input
**Status:** BLOCKED ON TRIAGE INPUT
**What we built:** Form with title, description, attachment, priority fields
**What we need:**
- Is priority selection essential? Should it be required or optional?
- Are there other fields investigators need to properly classify feature requests?
- What tone/instructions should we use for this form?

**Morgan's Response Target:** Feb 9
**Impact if delayed:** Feature Request UI misses Sprint 2 window

---

#### Three-Column Layout UX Review — Morgan, please test
**Status:** READY FOR TESTING
**What we're asking:**
- Does the layout work for your investigation workflow?
- Is column sizing okay? Can you adjust widths easily?
- Are there any UX issues we missed?

**Testing Target:** Feb 16
**Timeline:** Needs feedback by Feb 17 to incorporate changes

---

### Triage → Ops Dev (Requesting Features/Tools)

#### Bulk Case Reclassification Tool
**Status:** PLANNED
**Requested by:** Morgan Torres
**Why needed:** Triage team needs to fix misclassified cases from recent audit
**Scope:**
- Select multiple cases
- Apply new classification to all at once
- Log change reason
- Estimated effort: 2 days

**Priority:** High (depends on Classification Accuracy work)
**Proposed Timeline:** Start Feb 17 if Feature Request UI ships on time

---

#### Investigation Form Enhancement — Missing field
**Status:** PENDING REVIEW
**Requested by:** Morgan Torres
**Why needed:** Current form doesn't capture investigation method (logs review, customer interview, testing, etc.)
**Impact:** Can't properly classify investigation thoroughness
**Scope:** Add dropdown to investigation form, store in database
**Estimated effort:** 1 day
**Priority:** Medium
**Proposed Timeline:** Sprint 3

---

## Communication Protocol for This Board

**How to Add Items:**
1. Describe what you need clearly (owner, priority, timeline)
2. Alex or Morgan will respond in their communication style
3. Discussion happens in comments below the item
4. Once agreed, item moves to appropriate section

**Friday Sync Meeting (2 PM):**
- Both leads review this board together
- New cross-team requests discussed
- Blockers identified
- Next week priorities confirmed

**Status Updates:**
- Daily standup captures progress (see `STANDUP.md`)
- This board updated end of day Friday
- Urgent blockers escalated immediately (don't wait for Friday)

---

## Metrics & Success Criteria

### For Sprint 2

| Metric | Target | Current |
|--------|--------|---------|
| Ops Dev Story Points Committed | 21 | 21 |
| Ops Dev Velocity (% committed delivered) | 90% | TBD |
| Triage Investigations Completed | 45 | TBD |
| Triage SLA Compliance | 98% | TBD |
| Customer Satisfaction | 4.5+ | TBD |
| Cross-Team Sync Attendance | 100% | TBD |

---

## Next Steps

**This Week (Feb 10-14):**
- Sprint planning: Confirm scope and assignments
- Ops Dev: Continue three-column layout
- Triage: Complete first two investigation playbooks
- Cross-team: Morgan reviews Feature Request form design

**Next Week (Feb 17-21):**
- Ops Dev: Ship Feature Request UI, start Investigation Search
- Triage: Finish Classification Accuracy audit, begin Response Workflow review
- Cross-team: Full UX testing of three-column layout by Triage team

**End of Sprint (Feb 23):**
- Retro meeting (what went well, what to improve)
- Planning Sprint 3
- Deployment of Sprint 2 features to production

---

**Last sync:** First sprint sync will be Friday, Feb 14 at 2 PM
**Board owner:** Jacob Aguon
**Lead contacts:** Alex Chen (Ops Dev), Morgan Torres (Triage)
