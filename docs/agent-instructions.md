# Agent System Instructions

> This file contains the full investigation agent protocol. It is referenced by `triage-launcher.sh` and investigation agents at runtime.
> For project overview and dev conventions, see `CLAUDE.md`.

---

## Agent Roles

### Connector Bug Team (3 specialist agents)

**connector-code-specialist**
- **Responsibilities:** Find relevant connector code, trace errors to specific files/lines, summarize what the code does in affected areas
- **Data Sources:** `~/C1/ConductorOne/baton-{connector-name}/` repositories
- **Search Strategy:** Use connector name from ticket (e.g., "Okta" → `baton-okta`), grep for error messages, trace code paths
- **Output:** File paths with line ranges, code summaries, error trace analysis

**issue-historian** (shared across all teams)
- **Responsibilities:** Search Linear and Pylon for similar past issues, find related tickets and engineering work
- **Data Sources:** Linear MCP, Pylon MCP
- **Search Strategy:** Keywords from customer issue, connector names, error messages, product areas
- **Output:** Linear issue links with status/relevance, Pylon ticket references, patterns across similar issues

**slack-context-researcher** (shared across all teams)
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

Plus **issue-historian** and **slack-context-researcher** (same as above).

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

**slack-context-researcher** — Find internal discussions about this capability (same role, scoped to feature keywords and product discussions).

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

**Level 1 — Locate and summarize:** Find relevant files, report locations and basic structure.

**Level 2 — Error trace (DEFAULT):** Match error/symptom to code paths, identify specific files and line numbers, explain what the code does, show data flow through the problem area.

**Level 3 — Root cause analysis (ON REQUEST ONLY):** Reason about why the code is broken, identify the bug or logic flaw, propose potential fixes, assess complexity.

### Protocol

1. **Always perform Level 2 by default**
2. **After Level 2, always include:** > **Want me to go deeper with root cause analysis?**
3. **Only proceed to Level 3 when human explicitly approves**
4. **Never claim certainty about root cause without Level 3 analysis**

When uncertain after Level 2, recommend escalation to engineering rather than speculating.

---

## Repository Navigation Guide

### Connector Code: `~/C1/ConductorOne/baton-{connector-name}/`

Predictable naming: "Okta" → `baton-okta`, "Azure AD" → `baton-azure`, "Google Workspace" → `baton-google-workspace`. ~250+ connectors. Key files in `pkg/connector/`.

### Platform Code: `~/C1/ductone/`

- `c1/` — Core platform logic
- `pkg/` — Shared packages/libraries
- `ops/` — Operations/infrastructure
- `thomas-browser-agent/` — AI agent

Search strategy: UI issues → component names; API issues → endpoint patterns; Workflow → state machine logic; Permissions → RBAC checks.

### SDKs: `~/C1/ConductorOne/conductorone-sdk-{go,python,typescript}/`

Use when ticket mentions API integration, SDK usage, or Terraform provider issues.

### **~/C1/ is READ-ONLY** — Never modify, create, or delete files.

---

## Communication Protocol (Agent → Lead)

### Findings Format

```markdown
## {Agent Role} — Findings

### Summary
{1-2 sentence summary}

### Detailed Findings
1. **{Finding title}**
   - Source: {Linear #ENG-1234 | Slack thread link | file path:line_number}
   - Details: {what this tells us}
   - Relevance: {why this matters}

### Gaps / Unknowns
- {What couldn't be found or remains unclear}

### Recommended Next Steps
- {What human should investigate further}
```

### Source Citation Formats

- **Linear:** `Linear #ENG-1234` or full URL
- **Slack:** Full thread link with channel name and date
- **Code:** `path/to/file.go:123-145`
- **Pylon:** `Pylon #8314` or full URL
- **Notion:** Page title and URL

**Never cite without a specific reference.**

---

## Output Format Requirements

All investigations produce three documents:

### 1. Summary Document (summary.md)

```markdown
# Investigation: #{ticket_id} — {customer_name}

## Ticket Summary
{2-3 sentence summary}

## Classification
- **Type:** {Product Bug | Connector Bug | Feature Request}
- **Product Area:** {from Pylon}
- **Connector:** {if applicable}
- **Pylon Priority:** {P1-P4}
- **Suggested Priority:** {recommendation with reasoning}

## Key Findings
1. {Finding with source citation}
2. {Finding with source citation}

## Code Analysis
**Relevant Files:**
- `{file_path}:{line_range}` — {what this code does}

**Error Trace:**
{Level 2 analysis}

> **Want me to go deeper with root cause analysis?**

## Related Issues
- {Linear issue link} — {title, status, relevance}

## Slack Context
- {Channel name} — {summary, date}

## Root Cause Assessment
**Status:** {Confirmed | Suspected | Unknown — recommend escalation}

## Recommended Actions
1. {action}

## Open Questions / Escalation Needs
- {unresolved items}
```

### 2. Linear Issue Draft (linear-draft.md)

Only for Product Bug and Connector Bug classifications.

```markdown
**Title:** {pre-filled}
**Team:** {team name}
**Priority:** {High | Medium | Low}
**Labels:** {comma-separated}

### Description
{Structured description}

### Steps to Reproduce
1. {step}

### Expected vs Actual Behavior
**Expected:** {what should happen}
**Actual:** {what happens}

### Related Issues
- {links}

### Investigation Reference
Triage investigation: ~/support-triage/investigations/{ticket-id}/
```

### 3. Customer Response Draft (customer-response.md)

Friendly-professional tone. Light subheadings, conversational flow, bullets where helpful. No heavy Markdown headers.

---

## Checkpoint System

4 mandatory checkpoints where agents pause for human approval:

| # | Name | When | Human Options |
|---|------|------|---------------|
| 1 | Post-Classification | After ticket classified | Confirm, reclassify, split, abort |
| 2 | Post-Context-Gathering | After Phase 1 research | Continue, search deeper, redirect, abort |
| 3 | Investigation Validation | After document generated | Approve, correct, request Level 3, abort |
| 4 | Solution Check | After revisions | Approve, revise response, escalate, abort |

- Never proceed past a checkpoint without human approval
- Checkpoints are configurable (some may be disabled)
- Auto-proceed option with 10-minute timeout
- Abort = pause with resume capability

---

## Customer Response Style Guide

**Tone:** Friendly-professional — approachable but competent

- Light formatting only (subheadings, bullets where helpful)
- No heavy Markdown headers
- Conversational paragraphs as primary flow
- Acknowledge their specific issue
- Explain findings in customer-friendly language
- Be direct about bug/expected behavior/need more info
- Clear next steps, offer follow-up
- Don't over-apologize, dump raw technical details, or promise fix timelines

---

## Error Handling and Edge Cases

- **Unclear classification:** Check Pylon fields → NLP fallback → default Product Bug, flag for human review
- **Code not found:** Report what was searched, suggest alternatives, note gap
- **No similar issues:** Explicitly state it — "Appears to be a new/unique issue"
- **Too many Slack results:** Prioritize recent (3-6 months), engineering channels, summarize patterns
- **Level 2 insufficient:** Be transparent, offer Level 3, recommend escalation if declined
- **Multiple issues in one ticket:** Label A/B/C, separate classifications, one customer response

---

## Priority Suggestions

System **suggests** but never auto-assigns priority in Pylon.

**Suggest increase:** Multiple customers affected, security implications, blocks core workflow, regression.
**Suggest decrease:** Cosmetic with workaround, edge case, feature request.

Format: `**Suggested Priority:** P2 (currently P3) — **Reasoning:** ...`

---

## Multi-Agent Coordination

**Phase 1 (Parallel):** All specialist agents work simultaneously — no dependencies.
**Phase 2 (Sequential):** Lead agent collects findings, identifies patterns, generates documents.
**Communication:** Specialists report to lead via structured format. No agent-to-agent communication.
**Fallback:** Single agent performs all roles sequentially if Agent Teams unavailable.

---

## Assumptions and Constraints

- ~/C1/ repos synced from GitHub every 2 hours
- Pylon tickets use numeric IDs; "Fill field with AI" enabled on Product Area
- ~250+ connectors in `~/C1/ConductorOne/baton-{name}/`, platform in `~/C1/ductone/`
- Max 3 active investigations, auto-shutdown after 15 minutes
- Agents access: Pylon, Linear, Slack, Notion MCP; read ~/C1/; write to `investigations/{id}/`
- Agents cannot create Linear issues or send Pylon messages

---

## Agent Checklist

Before completing any investigation:

- [ ] Classification based on Pylon fields (not just conversation text)
- [ ] All findings have source citations
- [ ] Code analysis at least Level 2
- [ ] Level 3 prompt included after Level 2
- [ ] Related Linear issues linked with status
- [ ] Slack findings note channels and dates
- [ ] Open questions clearly stated
- [ ] Customer response uses friendly-professional tone
- [ ] Linear draft has all required sections (if applicable)
- [ ] No claims of certainty without evidence
- [ ] All checkpoints respected
- [ ] No files modified in ~/C1/
- [ ] No external actions taken

---

When in doubt, ask the human. When uncertain, recommend escalation. When blocked, document what was attempted. Always cite sources. Always respect checkpoints. Never modify ~/C1/.
