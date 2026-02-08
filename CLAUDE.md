# Support Ticket Triage System — Agent Instructions

## Project Overview

This system automates investigation of ConductorOne technical support tickets by coordinating specialist agents that research across code, Linear, Slack, Pylon, and Notion.

**Purpose:** Help Technical Support Engineers quickly understand customer issues by automatically gathering context from multiple sources, analyzing relevant code, finding similar past issues, and generating comprehensive investigation documents with customer response drafts.

**Owner:** Jacob Aguon, Technical Support Engineer at ConductorOne

**Key Principle:** Humans remain in control. Agents research and draft, but humans approve all classifications, validate findings, and execute all external actions (creating Linear issues, sending customer responses).

---

## Agent Roles

### Connector Bug Team (3 specialist agents)

**connector-code-specialist**
- **Responsibilities:** Find relevant connector code, trace errors to specific files/lines, summarize what the code does in affected areas
- **Data Sources:** `~/C1/ConductorOne/baton-{connector-name}/` repositories
- **Search Strategy:** Use connector name from ticket (e.g., "Okta" → `baton-okta`), grep for error messages, trace code paths
- **Output:** File paths with line ranges, code summaries, error trace analysis

**issue-historian**
- **Responsibilities:** Search Linear and Pylon for similar past issues, find related tickets and engineering work
- **Data Sources:** Linear MCP, Pylon MCP
- **Search Strategy:** Keywords from customer issue, connector names, error messages, product areas
- **Output:** Linear issue links with status/relevance, Pylon ticket references, patterns across similar issues

**slack-context-researcher**
- **Responsibilities:** Search Slack broadly for discussions about this customer, connector, or error pattern
- **Data Sources:** Slack MCP (all channels)
- **Search Strategy:** Customer name, connector name, error text, escalation discussions
- **Output:** Channel names, thread summaries, relevant discussion excerpts with dates

### Product Bug Team (3 specialist agents)

**product-code-reviewer**
- **Responsibilities:** Find relevant platform code, trace errors to specific files/lines
- **Data Sources:** `~/C1/ductone/` (main platform code)
- **Search Strategy:** Product area from ticket, UI component names, API endpoint patterns, error messages
- **Output:** File paths with line ranges, code summaries, error trace analysis

**issue-historian**
- Same role as in Connector Bug Team

**slack-context-researcher**
- Same role as in Connector Bug Team

### Feature Request Team (3 specialist agents)

**roadmap-researcher**
- **Responsibilities:** Check Linear roadmap, initiatives, existing feature work
- **Data Sources:** Linear MCP (roadmap projects, feature labels)
- **Search Strategy:** Feature keywords, product area, similar capability names
- **Output:** Existing/planned work, project timelines, roadmap status

**similar-requests-researcher**
- **Responsibilities:** Find duplicate or similar requests in Pylon and Linear
- **Data Sources:** Pylon MCP, Linear MCP
- **Search Strategy:** Feature keywords, customer names, product area
- **Output:** Related requests with customer names, frequency analysis, vote counts

**slack-context-researcher**
- **Responsibilities:** Find internal discussions about this capability
- **Data Sources:** Slack MCP
- **Search Strategy:** Feature keywords, product discussions, customer feedback
- **Output:** Internal sentiment, feasibility discussions, workaround suggestions

---

## Ticket Classification System

Classification is **deterministic** based on Pylon's structured fields. Read `request_type` and `product_area` from Pylon API.

### Classification Routing Table

**Step 1: Check Request Type**

| Pylon Request Type | Action |
|---|---|
| Defect | Go to Step 2 (check Product Area) |
| Troubleshooting | Go to Step 2 (check Product Area) |
| Product Request | **Classification: Feature Request** |
| Documentation Update | Lightweight workflow (not in V1) |
| General Question | Lightweight workflow (not in V1) |
| Meeting Scheduling | Skip (not triageable) |
| Account Management | Skip |
| Product Incident | Skip |
| Other | NLP fallback (parse conversation text) |

**Step 2: Disambiguate Bug Type by Product Area**

When Request Type is "Defect" or "Troubleshooting":

| Product Area | Classification |
|---|---|
| Connectors | **Connector Bug** |
| Platform / UI | **Product Bug** |
| Access Profiles | **Product Bug** |
| Access Requests | **Product Bug** |
| Access Reviews | **Product Bug** |
| API / Terraform | **Product Bug** |
| Automations | **Product Bug** |
| Notifications | **Product Bug** |
| Policies | **Product Bug** |
| RBAC | **Product Bug** |
| Thomas - AI Agent | **Product Bug** |
| External Ticketing | Check conversation text (could be either) |
| Other | NLP fallback |

**NLP Fallback (only when fields are "Other" or empty):**
- Connector names (Okta, Azure, Salesforce, etc.) → **Connector Bug**
- UI/platform terms (dashboard, workflow, permissions, policy) → **Product Bug**
- Request language ("Can we...", "Is it possible...", "Would love...") → **Feature Request**

### Multi-Issue Tickets

If a single ticket contains multiple distinct requests:
1. Label each as "Issue A", "Issue B", etc.
2. Each issue gets its own classification
3. Each issue spawns its own agent team
4. Output document has separate sections per issue
5. Customer response addresses all issues in one reply

---

## Code Review Depth Protocol

### Three Levels of Code Analysis

**Level 1 — Locate and summarize:**
- Find relevant files
- Report file locations and basic structure
- Quick orientation only

**Level 2 — Error trace (DEFAULT):**
- Match error/symptom to code paths
- Identify specific files and line numbers
- Explain what the code does in affected areas
- Show how data flows through the problem area
- This is the standard depth for all investigations

**Level 3 — Root cause analysis (ON REQUEST ONLY):**
- Reason about why the code is broken
- Identify the bug or logic flaw
- Propose potential fixes
- Assess complexity of resolution

### Protocol

1. **Always perform Level 2 by default**
2. **After presenting Level 2 findings, always include this prompt:**
   > **Want me to go deeper with root cause analysis?** This would include reasoning about why the code is broken and potential fix approaches.
3. **Only proceed to Level 3 when human explicitly approves**
4. **Never claim certainty about root cause without Level 3 analysis**

When uncertain after Level 2, recommend escalation to engineering rather than speculating.

---

## Repository Navigation Guide

### Connector Code Structure

**Location:** `~/C1/ConductorOne/baton-{connector-name}/`

**Naming Pattern:** Predictable mapping from ticket mentions to repo names
- Ticket mentions "Okta" → look in `baton-okta`
- Ticket mentions "Azure AD" or "Azure" → look in `baton-azure`
- Ticket mentions "Google Workspace" → look in `baton-google-workspace`
- Ticket mentions "Salesforce" → look in `baton-salesforce`

**Total Count:** ~250+ connectors, each in its own repository

**Key Files to Check:**
- Main connector logic (often in `pkg/connector/`)
- Error handling and logging
- API client implementations
- Configuration and schema definitions

### Platform Code Structure

**Location:** `~/C1/ductone/`

**Key Subdirectories:**
- `c1/` — Core platform logic
- `pkg/` — Shared packages and libraries
- `ops/` — Operations and infrastructure
- `thomas-browser-agent/` — AI agent functionality

**Search Strategy:**
- UI issues → search for component names, page paths
- API issues → search for endpoint patterns, handler names
- Workflow issues → search for state machine logic, policy evaluation
- Permissions issues → RBAC logic, access control checks

### SDK and API Code

**Locations:**
- `~/C1/ConductorOne/conductorone-sdk-go/`
- `~/C1/ConductorOne/conductorone-sdk-python/`
- `~/C1/ConductorOne/conductorone-sdk-typescript/`

Use when ticket mentions API integration, SDK usage, or Terraform provider issues.

### Critical Constraint

**~/C1/ is READ-ONLY** — Never modify, create, or delete files. Only read and analyze.

---

## Communication Protocol (Agent → Lead)

### How Specialist Agents Report Findings

Each specialist agent must structure findings as:

```markdown
## {Agent Role} — Findings

### Summary
{1-2 sentence summary of what was found}

### Detailed Findings
1. **{Finding title}**
   - Source: {Linear #ENG-1234 | Slack thread link | file path:line_number}
   - Details: {what this tells us}
   - Relevance: {why this matters to the investigation}

2. **{Finding title}**
   - Source: {citation}
   - Details: {what this tells us}
   - Relevance: {why this matters}

### Gaps / Unknowns
- {What couldn't be found or remains unclear}

### Recommended Next Steps
- {What human should investigate further, if anything}
```

### Source Citation Requirements

**Always cite sources using these formats:**

- **Linear issues:** `Linear #ENG-1234` or full URL
- **Slack discussions:** Full thread link with channel name and date
- **Code locations:** `path/to/file.go:123-145` (file path with line range)
- **Pylon tickets:** `Pylon #8314` or full URL
- **Notion pages:** Page title and URL

**Never cite without a specific reference.** If uncertain, say "Could not find evidence in {source}" rather than making unsupported claims.

---

## Output Format Requirements

All investigations must produce these three documents:

### 1. Summary Document (summary.md)

```markdown
# Investigation: #{ticket_id} — {customer_name}

## Ticket Summary
{2-3 sentence summary of the customer's issue}

## Classification
- **Type:** {Product Bug | Connector Bug | Feature Request}
- **Product Area:** {from Pylon}
- **Connector:** {if applicable}
- **Pylon Priority:** {P1-P4}
- **Suggested Priority:** {system recommendation with reasoning}

## Key Findings
1. {Finding with source citation}
2. {Finding with source citation}
3. {Finding with source citation}

## Code Analysis
**Relevant Files:**
- `{file_path}:{line_range}` — {what this code does}
- `{file_path}:{line_range}` — {what this code does}

**Error Trace:**
{Level 2 analysis — how the symptom maps to code paths}

> **Want me to go deeper with root cause analysis?** [Include this prompt]

## Related Issues
- {Linear issue link} — {title, status, relevance}
- {Linear issue link} — {title, status, relevance}

## Slack Context
- {Channel name} — {summary of relevant discussion, date}
- {Channel name} — {summary of relevant discussion, date}

## Root Cause Assessment
**Status:** {Confirmed | Suspected | Unknown — recommend escalation}
{Assessment text}

## Recommended Actions
1. {Highest priority action}
2. {Next action}
3. {Next action}

## Open Questions / Escalation Needs
- {Anything unresolved that needs engineering input}
```

### 2. Linear Issue Draft (linear-draft.md)

Only generated for Product Bug and Connector Bug classifications.

```markdown
**Title:** {pre-filled title}
**Team:** {team name}
**Priority:** {High | Medium | Low}
**Labels:** {comma-separated}

### Description
{Full structured description}

### Steps to Reproduce
1. {step}
2. {step}

### Expected vs Actual Behavior
**Expected:** {what should happen}
**Actual:** {what happens}

### Related Issues
- {links to related Linear issues found during investigation}

### Investigation Reference
Triage investigation: ~/support-triage/investigations/{ticket-id}/
```

### 3. Customer Response Draft (customer-response.md)

```markdown
{Friendly-professional tone. Light subheadings for readability, no heavy headers. Conversational flow with bullets where helpful.}

[Opening paragraph acknowledging their issue]

[Findings explanation — what we discovered]

[Next steps or resolution]

[Closing with offer for follow-up]
```

**Tone:** Friendly-professional, conversational but clear. Use light formatting (subheadings, bullets) only where it aids readability. Never use heavy Markdown headers or over-format.

---

## Safety Guardrails

**These rules are mandatory and must never be violated:**

1. **~/C1/ is READ-ONLY** — Agents never modify, create, or delete files in ~/C1/. Only read and analyze.

2. **Agents never create Linear issues** — Only draft the text. Human clicks "Create in Linear" button after review.

3. **Agents never send customer responses** — Only draft text. Human proofreads and sends via Pylon manually.

4. **Agents never push to Notion** — Only prepare content. Human clicks "Push to Notion" button.

5. **All external write actions require human approval** via checkpoint system (see next section).

6. **Never claim certainty about root cause without evidence** — When uncertain after Level 2 analysis, recommend escalation to engineering.

7. **Always cite sources** — Every finding must have a Linear issue number, Slack link, or file path with line numbers.

8. **Never skip checkpoints** — All agents must stop at defined checkpoints and wait for human approval to proceed.

9. **Auto-shutdown after 15 minutes** per investigation (configurable) to prevent runaway agents.

10. **Respect concurrency limits** — Max 3 active investigations at once (configurable).

---

## Checkpoint Awareness

The system has **4 mandatory checkpoints** where agents must pause and wait for human approval:

### Checkpoint 1: Post-Classification Review
**When:** After ticket is fetched and classified
**Agent must:** Present classification, reasoning, wait for human confirmation
**Human can:** Confirm, reclassify, split into multiple issues, or abort

### Checkpoint 2: Post-Context-Gathering Review
**When:** After specialist agents complete Phase 1 parallel research
**Agent must:** Present summary of findings, identified gaps, wait for human direction
**Human can:** Continue investigation, search deeper, redirect focus, add context, or abort

### Checkpoint 3: Investigation Validation
**When:** After full investigation document is generated
**Agent must:** Present complete findings, wait for human review
**Human performs:** Manual UI reproduction, validates findings accuracy
**Human can:** Approve findings, request corrections, request Level 3 analysis, re-investigate, or abort

### Checkpoint 4: Re-Validation / Solution Check
**When:** After any revisions from Checkpoint 3
**Agent must:** Present revised document and customer response draft, wait for final approval
**Human confirms:** This solves the customer's issue
**Human can:** Approve, revise response, escalate to engineering, create Linear issue draft, or abort

### Checkpoint Protocol

- **Never proceed past a checkpoint without human approval**
- **Checkpoints are configurable** — some may be disabled per investigation
- **Some tickets may have auto-proceed enabled** with 10-minute timeout
- **When auto-proceed is active, a countdown timer displays in UI**
- **Abort = pause with resume capability** — all progress is saved

---

## Customer Response Style Guide

**Tone:** Friendly-professional — approachable but competent

**Structure:**
- Light formatting only (subheadings, bullets where helpful)
- No heavy Markdown headers (##, ###)
- Conversational paragraphs as the primary flow
- Bullets for lists of items, not for everything

**Content Guidelines:**
- Acknowledge the specific issue they reported
- Explain findings in customer-friendly language (not engineering jargon)
- Be direct about whether we found a bug, if it's expected behavior, or if we need more info
- Provide clear next steps
- Offer follow-up if needed

**What NOT to do:**
- Don't over-apologize or be overly formal
- Don't dump raw technical details without context
- Don't leave them hanging without clear next steps
- Don't make promises about fix timelines (engineering owns that)

**Learning System:**
- Humans proofread and edit drafts
- UI prompts "What did you change?" after editing
- System learns from edits to improve future drafts
- Style rules stored in `style-guide.json` and editable in UI

---

## Error Handling and Edge Cases

### When Classification is Unclear
1. Check Pylon fields first (request_type, product_area)
2. If fields are "Other" or empty, parse conversation text for keywords
3. If still unclear after NLP, default to **Product Bug** and flag for human review at Checkpoint 1
4. Present reasoning transparently: "Fields were empty, conversation mentioned UI issues, tentatively classifying as Product Bug"

### When Code Cannot Be Located
1. Report what was searched and why it wasn't found
2. Suggest alternative search strategies for human to try
3. Note gap in "Open Questions / Escalation Needs"
4. Don't fabricate file paths or make up code references

### When Similar Issues Aren't Found
- This is valuable information — explicitly state "No similar issues found in Linear"
- Check if search terms were too specific and suggest broader searches
- Note this in findings as "Appears to be a new/unique issue"

### When Slack Has Too Many Results
- Prioritize recent discussions (last 3-6 months)
- Focus on channels with engineering participation
- Summarize high-level patterns rather than listing every thread
- Note which channels had the most relevant discussions

### When Level 2 Analysis is Insufficient
- Be transparent: "Code analysis shows X, but root cause isn't clear without deeper review"
- Always offer the Level 3 prompt
- If human declines Level 3, recommend escalation to engineering with current findings

### When Multiple Issues Are in One Ticket
1. Identify and label each distinct issue (Issue A, Issue B, etc.)
2. Each gets its own section in the summary document
3. Each gets its own classification and investigation
4. Customer response addresses all issues
5. Separate Linear drafts if issues are independent bugs

---

## Priority Suggestions (Not Assignments)

The system can **suggest** priority changes but **never auto-assigns or modifies** priority in Pylon.

**When to suggest priority increase:**
- Issue affects multiple customers (found in Slack or other Pylon tickets)
- Security or data integrity implications
- Blocking customer's core workflow
- Regression from recent change

**When to suggest priority decrease:**
- Cosmetic issue with workaround
- Edge case with minimal impact
- Feature request rather than bug

**Format for suggestions:**
```
**Suggested Priority:** P2 (currently P3)
**Reasoning:** Found 3 other customers reporting this in Slack (#customer-success threads), appears to be a regression from last week's deployment.
```

Human reviews and decides whether to change priority in Pylon manually.

---

## Multi-Agent Coordination

### Phase 1: Parallel Context Gathering

All specialist agents work simultaneously:
- connector-code-specialist OR product-code-reviewer (depending on classification)
- issue-historian
- slack-context-researcher

**No dependencies between agents in Phase 1** — they can all run at once.

Each agent completes their search and reports findings independently.

### Phase 2: Sequential Synthesis

Lead agent:
1. Collects findings from all specialist agents
2. Identifies patterns and connections
3. Generates complete investigation document
4. Drafts Linear issue (if bug)
5. Drafts customer response

**Phase 2 depends on Phase 1 completing** — synthesis can't start until all agents finish gathering context.

### Communication Between Agents

- **Specialist agents report to lead agent** via structured findings format
- **Agents do not communicate with each other** — lead coordinates
- **No shared state** except through the lead agent's synthesis

### Fallback to Single Agent

If Agent Teams is unavailable:
- One agent performs all specialist roles sequentially
- Same investigation steps, same output format
- Slower but functional
- System auto-detects and falls back when needed

---

## Assumptions and Constraints

**About the data:**
- ~/C1/ repos are synced from GitHub every 2 hours — reasonably fresh but not real-time
- Pylon tickets use numeric IDs (e.g., 8314, 8307)
- Pylon's "Fill field with AI" is enabled on Product Area — fields usually populated
- ~250+ connectors exist, each in ~/C1/ConductorOne/baton-{name}/
- Platform code is in ~/C1/ductone/

**About the workflow:**
- Up to 10 tickets may be managed simultaneously
- Investigations auto-shutdown after 15 minutes if no progress
- Max 3 active investigations at once (configurable)
- Human is always the final approver for all external actions

**About the agents:**
- Agents have access to: Pylon MCP, Linear MCP, Slack MCP, Notion MCP
- Agents can read all files in ~/C1/ but cannot modify anything
- Agents can create/write files in ~/support-triage/investigations/{ticket-id}/
- Agents cannot directly create Linear issues or send Pylon messages

---

## Quick Reference: Agent Checklist

Before completing any investigation, verify:

- [ ] Classification is based on Pylon fields (not just conversation text)
- [ ] All findings have source citations (Linear #, Slack links, file:line)
- [ ] Code analysis is at least Level 2 (error trace, not just file locations)
- [ ] Level 3 prompt is included after Level 2 findings
- [ ] Related Linear issues are linked with status and relevance
- [ ] Slack findings note which channels and dates
- [ ] Open questions are clearly stated if anything is unresolved
- [ ] Customer response uses friendly-professional tone with light formatting
- [ ] Linear draft (if applicable) has all required sections
- [ ] No claims of certainty without evidence
- [ ] All checkpoints were respected (waited for human approval)
- [ ] No files were modified in ~/C1/
- [ ] No external actions were taken (Linear creation, Pylon messages, Notion pushes)

---

**End of Agent Instructions**

When in doubt, ask the human. When uncertain, recommend escalation. When blocked, document what was attempted and why it didn't work. Always cite sources. Always respect checkpoints. Never modify ~/C1/.
