# Communication Protocol

**Support Triage Project**
**Effective:** Feb 10, 2026

This document explains how to communicate with team leads, how they communicate with each other, and the standards we use for sharing information across the project.

---

## Direct Communication with Team Leads

### Format

To talk to a team lead, use this format:

```
@Alex [describe what you need]
or
@Morgan [describe what you need]
```

Start your message with an @ mention of the lead's first name, then describe your situation, question, or request. The lead will respond in character, using their communication style and expertise.

### Response Time Expectations

| Lead | Response Time | Hours |
|------|---------------|-------|
| Alex Chen (Ops Dev) | Same day | < 8 hours |
| Morgan Torres (Triage) | Same day | < 8 hours |
| Emergency/Blocker | Immediate | 30 minutes |

---

## Communication Paths

### Jacob → Alex (Ops Dev Lead)

**Use this channel when:**
- You have a feature request or idea for the application
- You want to report a UI bug or design issue
- You need a technical estimate for dev work
- You want to discuss architecture decisions
- You're curious about technical feasibility

**How to describe what you need:**
- Be specific about the problem or desired outcome
- Include relevant context (who it affects, why it matters)
- Share any constraints (timeline, budget, technical limitations)
- Link to relevant work items if they exist

**Example:**
```
@Alex We need to improve how TSEs filter cases by customer.
Right now they have to use three separate dropdowns. Is there a
better way? Also, how long would it take to implement something better?
```

**What to expect:**
- Direct technical feedback
- Clear estimate ("3 days", "1 week")
- Explanation of approach and trade-offs
- Questions if Alex needs more context

---

### Jacob → Morgan (Triage Lead)

**Use this channel when:**
- You have questions about customer investigations
- You need to make an escalation decision
- You're concerned about response quality
- You want to improve investigation workflows
- You need SLA or quality metrics

**How to describe what you need:**
- Explain the customer situation or issue
- Share relevant context (logs, error messages, customer feedback)
- Include what you've already tried or checked
- State what decision or action you're seeking

**Example:**
```
@Morgan We have a customer reporting intermittent authentication failures
across multiple regions. Our logs show failures only between 2-6 AM UTC.
Known infrastructure issues? Or should we escalate to the auth team?
```

**What to expect:**
- Evidence-based analysis
- Clear recommendation with reasoning
- Questions to clarify context
- Suggestion of next steps

---

### Alex → Morgan (Ops Dev Needs Triage Input)

**Use this channel when:**
- You're building a UI feature that affects investigation workflow
- You want to understand how Triage team will use a new tool
- You need feedback on user experience before shipping
- You've discovered a workflow issue during development
- You want to validate that a feature solves the right problem

**How to ask for input:**
- Share a prototype, mockup, or description of the feature
- Explain what you're trying to solve
- Ask specific questions (Is this workflow right? Are we missing something?)
- Provide a deadline if you need feedback quickly

**Example:**
```
@Morgan We just built a bulk case reclassification tool.
Investigators select multiple cases, pick a new category, and apply it.
Does this match how you'd want to do bulk operations? Any issues?
```

**What to expect:**
- Practical feedback from someone who uses investigation tools daily
- UX suggestions based on actual workflow
- Possible requests for additional features
- Timeline for when Triage team can test

---

### Morgan → Alex (Triage Needs Ops Dev)

**Use this channel when:**
- Your investigation workflow has friction that code could fix
- You need a tool to reduce manual work
- You discover a bug affecting investigation efficiency
- You want to request a feature based on customer or investigator feedback
- You see an opportunity for automation

**How to make your request:**
- Describe the workflow problem clearly
- Explain the impact (time saved, quality improved, etc.)
- Share how often this comes up or how many cases it affects
- Be open to Alex's suggestions on implementation approach

**Example:**
```
@Alex Our investigators spend 30 minutes daily reassigning cases manually.
Could we build a bulk reassign tool? Select cases, pick new assignee, apply?
Estimating this saves the team ~4 hours per week.
```

**What to expect:**
- Honest estimate of effort required
- Questions about requirements and scope
- Suggestions for implementation approach
- Timeline for when this could ship

---

## Cross-Team Collaboration Process

### How Work Gets Shared Between Teams

**Step 1: One team identifies a need**
- Alex discovers that Triage needs a bulk operations tool
- Morgan finds that UI design is affecting investigation speed
- Need is documented with context and urgency

**Step 2: Request goes into PROJECT-BOARD.md**
- Create item under "Cross-Team Dependencies"
- Explain the need, proposed solution, and priority
- Include timeline and impact

**Step 3: Team leads discuss in their sync**
- Friday 2 PM: Both leads review PROJECT-BOARD.md together
- Discuss feasibility, priority, and scope
- Decide on approach and start date

**Step 4: Item moves to sprint planning**
- If approved, goes into appropriate team's sprint
- Added to BACKLOG.md when ready to work
- Tracked in PROJECT-BOARD.md "In Progress" section

**Step 5: Regular progress updates**
- Daily standup updates in STANDUP.md
- Testing and feedback as items are built
- Adjusted scope if needed

**Step 6: Completion and deployment**
- Team marks item "Done" when quality gates pass
- May be deployed immediately or batched with other changes
- Lessons learned documented

### Weekly Cross-Team Sync

**When:** Every Friday at 2 PM
**Who:** Alex Chen, Morgan Torres, Jacob Aguon
**Duration:** 30-45 minutes
**Agenda:**
1. Review PROJECT-BOARD.md cross-team section (10 min)
2. Discuss blockers or dependencies (10 min)
3. Test feedback on in-progress features (15 min)
4. Plan next week's collaboration (10 min)

**Output:**
- Updated PROJECT-BOARD.md with new priorities
- Confirmed blockers and resolution plan
- Scheduled testing or reviews for upcoming week

---

## Communication Standards

### What Makes Good Communication

**Clear Intent**
- State what you need upfront
- Don't make the other person guess
- Use the @ mention format consistently

**Relevant Context**
- Share enough background to understand the problem
- Link to docs, data, or examples if helpful
- Mention constraints or deadlines

**Actionable Requests**
- Ask for something specific (estimate, feedback, decision)
- Give a timeline if urgent
- Be open to pushback or alternative approaches

**Professional Tone**
- Respectful of each other's expertise
- Acknowledge trade-offs and constraints
- Assume good intent

### What to Avoid

**Vague Requests**
```
❌ @Alex "Can we make the UI faster?"
✅ @Alex "Users are clicking 'Save' on investigations and waiting 3+ seconds for response. Can we diagnose and fix the latency?"
```

**Missing Context**
```
❌ @Morgan "This case needs escalation."
✅ @Morgan "Customer reports their API is returning 500 errors consistently since our deploy. This is blocking production traffic. Should we escalate to platform team?"
```

**No Timeline**
```
❌ @Alex "We need bulk classification soon."
✅ @Alex "We need bulk classification by Feb 17 to complete our accuracy audit. Possible?"
```

---

## Documenting Decisions

### When to Document

After a significant decision or agreement:
- Technical architecture decision → Document in relevant CHARTER.md
- Tool request → Update PROJECT-BOARD.md cross-team section
- Process change → Update this COMMUNICATION.md or relevant SOP
- Investigation insight → Document in STANDARDS.md

### Where to Document

| Decision Type | Location |
|---------------|----------|
| Dev architecture/approach | `teams/ops-dev/CHARTER.md` or backlog notes |
| Investigation process/standard | `teams/triage/STANDARDS.md` or playbooks |
| Cross-team collaboration | `PROJECT-BOARD.md` cross-team section |
| Communication protocol update | This file (COMMUNICATION.md) |
| Process changes | Relevant team CHARTER.md |
| Sprint status | `STANDUP.md` and `PROJECT-BOARD.md` |

---

## Escalation Path

**If something is blocked and needs immediate attention:**

1. **Same-team blocker:** Talk to your team lead directly
   ```
   @Alex This is blocking our Feature Request UI work. Can we discuss options?
   ```

2. **Cross-team blocker:** Mention both leads
   ```
   @Alex @Morgan We need to align on Feature Request form field requirements
   to unblock both teams. Can we sync today?
   ```

3. **Critical/urgent:** Tag Jacob
   ```
   @Jacob The three-column layout work is blocked waiting on design feedback.
   Morgan, can you prioritize this review?
   ```

**Response SLA for escalations:**
- Same day response required
- If both leads can't resolve, Jacob makes the call
- Document resolution in PROJECT-BOARD.md

---

## Communication Channels

### For What

| Communication Type | Channel | Format |
|--------------------|---------|--------|
| Daily progress | `STANDUP.md` | Async log entry |
| Work item updates | `PROJECT-BOARD.md` | Kanban board edit |
| Feature discussion | @ mention | Chat message |
| Decision documentation | Relevant doc | Updated file |
| Weekly sync | Meeting | 2 PM Friday |
| Urgent blocker | @ mention (with escalation) | Chat message + PROJECT-BOARD.md |

### Response Expectations

**Async (log-based):**
- STANDUP.md entries reviewed daily EOD
- PROJECT-BOARD.md updates checked daily

**Direct messages (@mention):**
- Target response: same business day (< 8 hours)
- For urgent blockers: 30 minutes

**Meetings:**
- Friday sync: fixed time, both leads attend
- Ad-hoc: scheduled as needed if something needs discussion

---

## Examples of Good Cross-Team Communication

### Example 1: Feature Feedback

```
@Morgan We're redesigning the investigation detail view.
Currently shows: Title, Description, Status, Assignee.

Should we also show:
- Investigation method (logs/testing/interview)?
- SLA deadline?
- Related cases?
- Customer history?

Any of these critical for your workflow?
```

**Morgan's response (structured, evidence-based):**
```
Good questions. Here's what matters most:

CRITICAL: Investigation method (tells us about investigation thoroughness)
HIGH: Related cases (helps us spot patterns)
MEDIUM: Customer history (context, but can look separately)
NICE: SLA deadline (we know it from the system)

Investigation method is new - currently we track it in notes only.
If you add a field, that would improve our classification accuracy.
Can we make it a required field for the form?
```

---

### Example 2: Tool Request

```
@Alex Our investigators manually reassign cases about 50 times per day.
Each reassignment takes 2-3 minutes (click, select assignee, save).
Estimated 4 hours lost productivity daily across the team.

Could we build a bulk reassign tool? Select multiple cases, pick new assignee, apply all at once.
Estimated benefit: 3-4 hours saved per day.
Sprint 2 timeline work for you?
```

**Alex's response (direct, with estimate):**

```
Yes, doable. Rough estimate: 3-4 days of dev work.

Questions:
- Do you need history/audit of who reassigned what?
- Should investigators confirm the bulk action before applying?
- Any assignments that should be prohibited (can't assign to self, etc.)?

If we scope this to "select cases, pick assignee, confirm and apply"
that's 2-3 days. Adding audit history makes it 4-5 days.
Want to start Sprint 3 or can we squeeze into Sprint 2 if Feature Request ships early?
```

---

### Example 3: Escalation with Context

```
@Morgan We have a customer reporting data loss in their database after
using our API to batch import records. They're in production and this is
blocking their operations. Our logs show the API call succeeded, but they're
saying data didn't arrive.

This feels like it could be:
- An API bug on our side
- A customer implementation issue
- A race condition in their code

Should we escalate to the platform team immediately, or should we dig deeper first?
```

**Morgan's response (decision framework):**

```
Given the "data loss in production" claim, escalate to platform team immediately.

Reasoning:
1. If it's a real API bug, customers are at risk - needs fast response
2. Platform team has database access we don't - can check transactions
3. Customer is in active incident - needs attention from specialists

How to escalate: File critical incident ticket. Include:
- API call details (timestamp, payload)
- Customer account ID
- Expected vs actual data

You follow up with customer to confirm it wasn't user error, but platform team takes it from here.
Want me to draft the incident description?
```

---

## Questions About This Protocol

**Q: What if I need feedback but can't @mention the lead?**
A: Update PROJECT-BOARD.md with your request under "Cross-Team Dependencies." Alex and Morgan review daily and will respond.

**Q: What if both Alex and Morgan need to be involved?**
A: @ mention both: `@Alex @Morgan We need to align on...` and they'll coordinate.

**Q: How do I know if something is urgent enough to escalate to Jacob?**
A: If it's blocking multiple teams or blocking current sprint work, it's worth escalating.

**Q: Can we add synchronous meetings if needed?**
A: Yes. Request in PROJECT-BOARD.md cross-team section or @ mention both leads to schedule.

---

**Last updated:** Feb 8, 2026
**Maintained by:** Jacob Aguon
**Questions?** Check COMMUNICATION.md or ask @Alex or @Morgan
