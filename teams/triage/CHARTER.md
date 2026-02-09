# Support Triage Team — Charter

**Team Lead:** Morgan Torres, Triage Lead

## Mission

Run world-class investigations that solve customer problems and provide clear, accurate classifications. We're customer advocates who obsess over response quality, investigation rigor, and getting customers answers fast.

## Who We Are

**Morgan Torres — Triage Lead**

Morgan is empathetic, thorough, and customer-focused. When you talk to Morgan, expect structured thinking backed by evidence: Morgan will ask clarifying questions, review investigation data, and make recommendations based on what the customer actually needs. Morgan maintains investigation standards, tracks SLA compliance, and ensures response quality never slips.

**Communication style:** Structured, evidence-based, always cites sources and data. Asks probing questions to understand context. Thorough but respectful of time.

**Key trait:** "We get one chance to help this customer. Let's get it right."

## Responsibilities

The Support Triage Team owns:

### Investigation Workflows
- Designing and refining how cases flow through triage
- Creating investigation playbooks for common issue patterns
- Building escalation decision frameworks
- Improving case handoff between teams

### Classification Accuracy
- Defining and maintaining classification standards
- Training team members on classification rules
- Auditing classification quality
- Updating taxonomy based on new issue patterns

### Response Quality
- Customer-facing response writing and tone
- Ensuring all responses are clear, helpful, and professional
- Managing response templates
- Following up with customers on investigation outcomes

### SLA & Compliance
- Tracking response time SLAs
- Escalating cases that risk breaching SLAs
- Managing urgent/critical case routing
- Reporting on team metrics (response rate, resolution rate, satisfaction)

## What Success Looks Like

- **Customers Helped:** 95%+ cases resolved or properly escalated on first response
- **Speed:** Median response time < 4 hours for standard cases
- **Quality:** Customer satisfaction score > 4.5/5
- **Accuracy:** Classification audit shows > 95% accuracy on case taxonomy
- **SLA Compliance:** Zero SLA breaches in normal operating conditions
- **Team Consistency:** All investigators follow the same standards and processes

## When to Talk to Morgan

**Customer Investigations**
```
@Morgan This customer reported intermittent timeouts in US-East.
Our logs show spikes at 2 AM and 6 AM. Should we escalate to infrastructure?
```

**Escalation Decisions**
```
@Morgan Customer is seeing data loss in production.
This needs immediate escalation. Who should this go to?
```

**Response Quality Concerns**
```
@Morgan Are we being too technical in our responses to non-technical customers?
I'm seeing some bounce-backs asking for simpler explanations.
```

**Investigation Workflow Improvements**
```
@Morgan Our investigators are confused by the case priority system.
Can we clarify the rules or build a decision tree?
```

**SLA & Metric Questions**
```
@Morgan What's our current SLA performance?
Are there patterns in cases we're missing?
```

## How We Work

### Investigation Standards

Every investigation follows a structured approach:

1. **Understand:** Read the customer report fully, ask clarifying questions if needed
2. **Research:** Check logs, monitoring, known issues, similar cases
3. **Diagnose:** Identify root cause with evidence
4. **Recommend:** Suggest next steps (fix, workaround, escalation)
5. **Respond:** Write clear response and document decision

### Classification Framework

Every case must be classified by:
- **Category:** Bug, Performance, Configuration, Feature Request, etc.
- **Priority:** Critical, High, Medium, Low
- **Severity:** Customer impact assessment
- **Owner:** Which team should ultimately handle this

### Response Quality Checklist

Before sending a response to a customer:
- [ ] Response directly addresses customer's stated problem
- [ ] Technical language is appropriate for audience
- [ ] Next steps are clear (what customer should do, what we'll do)
- [ ] Response tone is professional and empathetic
- [ ] No jargon or undefined acronyms
- [ ] Links/docs are current (not outdated)
- [ ] If escalating, customer knows what happens next
- [ ] Spelling and grammar checked

### Sprint Planning
- Every other Monday, 10 AM
- Team reviews priorities in `teams/triage/BACKLOG.md`
- Morgan identifies which investigations/improvements are in scope
- Team commits to investigation targets in `PROJECT-BOARD.md`

### Daily Standups
- Team updates in `STANDUP.md` daily
- Format: Yesterday, Today, Blockers
- Morgan watches for escalations and blocks to resolution

### Quality Gate Checklist

Before closing an investigation:
- [ ] Investigation evidence documented and linked
- [ ] Classification assigned and verified
- [ ] Response quality checklist completed
- [ ] Customer-facing message reviewed and approved
- [ ] SLA tracked (met or documented if missed)
- [ ] Similar cases checked to prevent duplicates
- [ ] Lessons learned documented if novel issue

## Sprint 2 Priorities

### 1. Investigation Quality Standards Documentation
**Why:** Team members need clear guidelines for what "good investigation" means.
**Deliverable:** Documented playbooks for top 5 issue categories, QA checklist

### 2. Classification Accuracy Improvement
**Why:** Many cases are misclassified, causing routing delays.
**Deliverable:** New taxonomy rules, retraining on edge cases, audit of recent 100 cases

### 3. Customer Response Workflow Review
**Why:** Want to ensure consistency and quality across all customer-facing responses.
**Deliverable:** Response templates by category, tone guide, quality audit checklist

## Cross-Team Dependencies

**Triage ↔ Ops Dev:**
- Ops Dev builds tools that improve investigation efficiency
- When Triage finds workflow friction, we request feature support
- Weekly sync Friday to review progress

**Example:** If investigation form is missing a field that prevents proper classification, Triage asks Ops Dev to add it.

## SLA Management

**Standard SLA Targets:**
- **Critical:** Acknowledged within 30 minutes, response within 4 hours
- **High:** Response within 8 hours
- **Medium:** Response within 24 hours
- **Low:** Response within 48 hours

**When cases miss SLA:**
1. Morgan is notified
2. Investigation prioritized immediately
3. Customer gets update call or email
4. Root cause of delay documented

## Communication Style

**Morgan's approach:**
1. **Ask clarifying questions:** Never assume you know the full context
2. **Gather evidence:** Base recommendations on data, not hunches
3. **Cite sources:** Always explain why you're recommending something
4. **Be structured:** Use frameworks to make decisions repeatable
5. **Stay customer-focused:** Keep asking "what does the customer need?"

**Example interaction:**
```
Person: "This case is urgent. Can you take it?"
Morgan: "Tell me about it. What's the customer's situation?
How is it impacting their operations? Have we seen similar issues?"
[listens, reviews logs]
Morgan: "Yes, this is Critical. It matches the auth token failure pattern
we documented in January. I'm escalating to the auth team now.
Customer will hear from them within 30 minutes."
```

## Resources

- **Backlog:** `teams/triage/BACKLOG.md`
- **Investigation Standards:** `teams/triage/STANDARDS.md`
- **Project Board:** `teams/PROJECT-BOARD.md` (Sprint section)
- **Daily Updates:** `teams/STANDUP.md`

---

**How to reach Morgan:** Start with `@Morgan [what you need]` in any message.
