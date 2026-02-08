# Support Ticket Triage System — Complete V1 Specification

## Project Overview

Build an intelligent support ticket triage system for ConductorOne's Technical Support Engineering team. The system uses Claude Code's Agent Teams feature (experimental, Opus 4.6) to automatically investigate support tickets by coordinating specialist agents that research across code, Linear, Slack, Pylon, and Notion.

**Owner:** Jacob Aguon, Technical Support Engineer at ConductorOne
**Stack:** Claude Code Agent Teams + local React UI + SQLite + MCP integrations
**Repo constraint:** ~/C1/ is READ-ONLY — never modify, only read

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────┐
│                   Local React UI (localhost)             │
│  ┌──────────┐ ┌──────────────────────────────────────┐  │
│  │ Ticket   │ │ Main Panel                           │  │
│  │ Sidebar  │ │ ┌─────────────┬────────────────────┐ │  │
│  │          │ │ │ Ticket Info │ Document Preview    │ │  │
│  │ ● 8314 ⏸│ │ │ Agent Status│ (live markdown)     │ │  │
│  │ ● 8307 🔄│ │ │ Checkpoint  │                     │ │  │
│  │ ● 8299 ✅│ │ │ Actions     │                     │ │  │
│  │ ○ 8292 📋│ │ └─────────────┴────────────────────┘ │  │
│  └──────────┘ └──────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ WebSocket
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Orchestration Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐  │
│  │ Agent Teams │  │ Single Agent│  │ Queue Manager  │  │
│  │ (primary)   │  │ (fallback)  │  │ (concurrency)  │  │
│  └─────────────┘  └─────────────┘  └────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ MCP
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
     ┌─────────┐   ┌─────────┐   ┌──────────┐
     │ Pylon   │   │ Linear  │   │ Slack    │
     │ Notion  │   │ ~/C1/   │   │ SQLite   │
     └─────────┘   └─────────┘   └──────────┘
```

---

## Ticket Classification System

### Primary Classification: Pylon Field-Based Routing

Classification is deterministic based on Pylon's structured fields, NOT NLP. Read `request_type` + `product_area` fields from the Pylon API.

**Request Type → Classification Mapping:**

| Pylon Request Type | System Classification | Action |
|---|---|---|
| Defect | Product Bug OR Connector Bug | Use Product Area to disambiguate |
| Troubleshooting | Product Bug OR Connector Bug | Use Product Area to disambiguate |
| Product Request | Feature Request | Direct mapping |
| Documentation Update | Lightweight workflow | Simplified investigation |
| General Question | Lightweight workflow | Answer or redirect |
| Meeting Scheduling | Skip | Not triageable |
| Account Management | Skip | "Do not Use" in Pylon |
| Product Incident | Skip | "Do not use" in Pylon |
| Other | NLP fallback | Parse conversation text for classification |

**Product Area → Bug Type Disambiguation:**

When Request Type is Defect or Troubleshooting:

| Product Area | Routes To |
|---|---|
| Connectors | Connector Bug Team |
| Platform / UI | Product Bug Team |
| Access Profiles | Product Bug Team |
| Access Requests | Product Bug Team |
| Access Reviews | Product Bug Team |
| API / Terraform | Product Bug Team (API focus) |
| Automations | Product Bug Team |
| Notifications | Product Bug Team |
| Policies | Product Bug Team |
| RBAC | Product Bug Team |
| Thomas - AI Agent | Product Bug Team (AI focus) |
| External Ticketing | Check conversation text — could be either |
| Other | NLP fallback |

**NLP Fallback:** Only used when request_type is "Other" or fields are empty. Parse the customer conversation text for keywords:
- Connector names (Okta, Azure, Salesforce, etc.) → Connector Bug
- UI/platform terms (dashboard, workflow, permissions, policy) → Product Bug
- Request language ("Can we...", "Is it possible...", "Would love...") → Feature Request

### Multi-Issue Tickets

If a single ticket contains multiple distinct requests:
- Label as Issue A, Issue B, etc.
- Each issue gets its own classification
- Each issue spawns its own agent team
- Output document has separate sections per issue
- Customer response addresses all issues in one reply
- Linear issue drafts are separate per issue

### Three Classifications

1. **Product Bug** — UI issues, core platform functionality, API errors, workflow breakages, permissions problems. Anything wrong with ConductorOne's own platform.
2. **Connector Bug** — Issues with specific connector integrations (Okta, Azure AD, Salesforce, etc.), sync failures, external API errors, provisioning problems. The connector layer between C1 and third-party systems.
3. **Feature Request** — Customer asks for new capabilities. "Can we…", "Is it possible…", "We need support for…" — net-new functionality that doesn't exist yet.

---

## Agent Team Compositions

### Connector Bug Team (3 agents + lead)

| Role | Responsibilities | Data Sources |
|---|---|---|
| **connector-code-specialist** | Find relevant connector code, trace error to specific files/lines, summarize what the code does in that area | ~/C1/ConductorOne/baton-{connector-name}/ |
| **issue-historian** | Search Linear and Pylon for similar past issues, find related tickets and engineering work | Linear MCP, Pylon MCP |
| **slack-context-researcher** | Search Slack broadly for discussions about this customer, connector, or error pattern | Slack MCP |

### Product Bug Team (3 agents + lead)

| Role | Responsibilities | Data Sources |
|---|---|---|
| **product-code-reviewer** | Find relevant platform code, trace error to specific files/lines | ~/C1/ductone/ |
| **issue-historian** | Search Linear and Pylon for similar past issues | Linear MCP, Pylon MCP |
| **slack-context-researcher** | Search Slack broadly for related discussions | Slack MCP |

### Feature Request Team (3 agents + lead)

| Role | Responsibilities | Data Sources |
|---|---|---|
| **roadmap-researcher** | Check Linear roadmap, initiatives, existing feature work | Linear MCP |
| **similar-requests-researcher** | Find duplicate or similar requests in Pylon and Linear | Pylon MCP, Linear MCP |
| **slack-context-researcher** | Find internal discussions about this capability | Slack MCP |

---

## Code Repository Structure

**Connectors:** `~/C1/ConductorOne/baton-{connector-name}/`
- ~250+ connectors, each in its own repo
- Predictable naming: ticket mentions "Okta" → look in `baton-okta`
- Examples: baton-okta, baton-azure, baton-salesforce, baton-google-workspace

**Platform/Core:** `~/C1/ductone/`
- Main platform code
- Key subdirectories: c1, pkg, ops, thomas-browser-agent

**SDK/API:** `~/C1/ConductorOne/conductorone-sdk-go/`, `conductorone-sdk-python/`, `conductorone-sdk-typescript/`

### Code Review Depth Levels

- **Level 1 — Locate and summarize:** Find relevant files, report locations
- **Level 2 — Error trace (DEFAULT):** Match error/symptom to code paths, identify specific files and lines, explain what the code does in that area
- **Level 3 — Root cause analysis (ON REQUEST ONLY):** Reason about why the code is broken, propose fixes

**Behavior:** Always perform Level 2. After presenting Level 2 findings, always prompt: "Want me to go deeper with root cause analysis?" Only proceed to Level 3 when the human approves. This is a per-investigation toggle that may be changed to "always Level 3" in the future.

---

## Human-in-the-Middle Checkpoint System

### Mandatory Checkpoints (all 4 required by default)

**Checkpoint 1: Post-Classification Review**
- Trigger: After ticket is fetched and classified
- Shows: Ticket info, classification result, reasoning
- Quick actions: `✓ Confirm` · `↩ Reclassify as...` (dropdown) · `✂ Split into multiple issues` · `✕ Abort`
- Freeform text field always available

**Checkpoint 2: Post-Context-Gathering Review**
- Trigger: After agents complete initial parallel research (Phase 1)
- Shows: Summary of what each agent found, gaps identified
- Quick actions: `✓ Continue investigation` · `🔍 Search deeper in...` (Slack, Linear, Code) · `➡ Redirect focus to...` · `+ Add context` · `✕ Abort`
- Freeform text field always available

**Checkpoint 3: Investigation Validation**
- Trigger: After investigation is complete and document is generated
- Shows: Full investigation document
- Human action: Review findings, perform manual UI reproduction steps
- Quick actions: `✓ Findings look correct` · `✏ Corrections needed` · `🔬 Go to Level 3 analysis` · `↩ Re-investigate` · `✕ Abort`
- Freeform text field always available

**Checkpoint 4: Re-Validation / Solution Check**
- Trigger: After any revisions from Checkpoint 3
- Shows: Revised document, customer response draft
- Human action: Confirm this solves the customer's issue
- Quick actions: `✓ This solves the customer issue` · `✏ Revise response` · `⬆ Escalate to engineering` · `📋 Create Linear issue draft` · `✕ Abort`
- Freeform text field always available

### Checkpoint Configuration

- **All checkpoints are config-driven** — defined in settings, not hardcoded
- **Each checkpoint has:** name, trigger condition, enabled/disabled toggle
- **Global default:** mandatory (waits indefinitely)
- **Per-ticket toggle:** auto-proceed after 10 minutes (for lower-priority tickets)
- **Auto-proceed shows countdown timer** in the UI
- **Toggle can be flipped at any point** during an investigation
- **Future:** ability to add custom checkpoints via settings pane

### Abort = Pause with Resume

When abort is triggered:
- All agent work stops immediately
- Everything gathered so far is saved to investigation directory
- Investigation status set to `paused`
- Snapshot file captures: current phase, checkpoint position, all findings, agent context, last instructions

Resume options:
- `▶ Continue from where we stopped` — picks up at same checkpoint
- `↩ Back up one checkpoint` — re-runs last phase with new instructions
- `🔄 Restart with new classification` — starts over but retains previous findings as reference
- `📎 Merge into another ticket` — if discovered to be a duplicate

---

## Execution Modes

### Primary: Agent Teams (multi-agent parallel)

Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in settings.json

3 specialist agents + 1 lead agent per team. Agents run in parallel where possible, with sequential dependencies between phases.

### Fallback: Single Agent (sequential)

One Claude Code instance runs the same workflow sequentially:
- Same checkpoints, same output format, same investigation steps
- Just one agent doing them in order instead of 3 in parallel
- Slower but functional
- Auto-detected: if Agent Teams unavailable or erroring, falls back automatically and notifies user

### Per-Ticket Mode Selection

User can force single-agent mode per ticket from the UI. Useful for simple tickets that don't need a full team.

---

## Concurrency Management

- **Max active investigations: 3** (configurable in UI settings)
- **Queue system:** Tickets beyond the concurrency limit are queued and auto-start when a slot opens
- **Typical state across 10 tickets:**
  - 3 actively running agents
  - 4 paused at checkpoints (waiting for human input)
  - 2 queued (ready to start when slot opens)
  - 1 complete (ready for final review)

---

## Priority / Severity Handling

- **Read existing Pylon priority** (P1-P4) as starting point
- **Suggest only** — system recommends priority changes based on findings (e.g., "This affects 3 other customers, recommend P3 → P2")
- **Never auto-assign or change** priority
- **No behavioral differences** based on priority in V1 — every ticket gets same investigation depth
- **Future:** integrate Notion severity definitions page for more accurate suggestions

---

## Slack Search Strategy

- **V1: Broad search** — agents search all of Slack with keywords from ticket (customer name, connector name, error message)
- **No channel filtering initially**
- **Output notes which channels produced hits** for each investigation
- **Over time:** build frequency map of high-value channels from investigation history
- **Per-ticket override:** at checkpoints, human can direct agents to search specific channels

---

## Data Storage

### Dual Storage: SQLite + Files

**SQLite Database:** `~/support-triage/triage.db`

```sql
CREATE TABLE investigations (
    id INTEGER PRIMARY KEY,              -- Pylon ticket number
    customer_name TEXT,
    classification TEXT,                  -- product_bug | connector_bug | feature_request
    connector_name TEXT,                  -- nullable
    product_area TEXT,
    priority TEXT,                        -- P1-P4 from Pylon
    suggested_priority TEXT,              -- system recommendation
    status TEXT,                          -- queued | running | paused | waiting | complete | escalated
    current_checkpoint TEXT,
    auto_proceed INTEGER DEFAULT 0,       -- boolean
    agent_mode TEXT DEFAULT 'team',        -- team | single
    created_at DATETIME,
    updated_at DATETIME,
    resolved_at DATETIME,
    resolution_type TEXT,                 -- solved | escalated | duplicate | wontfix
    output_path TEXT,                     -- link to investigation files
    linear_issue_id TEXT,                 -- nullable, if created
    notion_page_id TEXT,                  -- nullable, if pushed
    tags TEXT,                            -- JSON array
    snapshot TEXT                         -- JSON, for pause/resume state
);
```

**Files:** `~/support-triage/investigations/{ticket-id}/`
- `summary.md` — main investigation document
- `customer-response.md` — draft customer reply
- `linear-draft.md` — structured Linear issue draft
- `agent-transcript.txt` — raw agent output log
- `metrics.json` — timing, agents used, sources cited
- `snapshot.json` — pause/resume state

---

## Output Document Template (summary.md)

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
1. {Finding with source citation — Linear #ENG-1234, Slack thread link, file path:line}
2. {Finding with source citation}
3. {Finding with source citation}

## Code Analysis
**Relevant Files:**
- `{file_path}:{line_range}` — {what this code does}
- `{file_path}:{line_range}` — {what this code does}

**Error Trace:**
{Level 2 analysis — how the symptom maps to code paths}

> **Want me to go deeper with root cause analysis?** [Level 3 prompt]

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

---

## Linear Issue Draft

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

---

## Customer Response Draft

{Friendly-professional tone. Light subheadings for readability, no heavy headers. Conversational flow with bullets where helpful.}
```

---

## Customer Response Style Guide

- **Tone:** Friendly-professional
- **Structure:** Light formatting — subheadings for readability only, no heavy headers. Conversational paragraphs with bullets where helpful
- **"Always include" list:** Empty at launch — built through feedback loop
- **"Never do" list:** Empty at launch — built through feedback loop
- **Feedback mechanism:** After proofreading a draft, UI prompts "What did you change?" or shows diff. Over time this builds an automatic style guide
- **Style rules stored in config, editable in UI settings pane**

---

## Local React UI Specification

### Layout: Sidebar + Main Panel (Option B)

**Ticket List Sidebar (always visible):**
- All open investigations listed with: ticket number, customer name, status icon, priority
- Status icons: 📋 Queued, 🔄 Running, ⏸ Waiting (checkpoint), ✅ Complete, ⏸ Paused (aborted)
- Auto-proceed tickets show countdown timer
- One-click switching between tickets
- [+ New Ticket] button at bottom

**Main Panel (3 sub-panels):**

Left column:
- Ticket info (customer, description, classification, priority)
- Agent status (which agents running, current task, for team mode)
- Agent mode indicator (Team / Single)
- Checkpoint action panel (contextual quick actions + freeform text)

Right column:
- Live markdown document preview (updates as agents report findings)
- Tabs: Summary | Customer Response | Linear Draft

### Buttons and Actions

- **Copy button** next to Linear draft for clipboard copy
- **"Create in Linear" button** — creates issue via Linear MCP after human review (human-in-the-middle approved)
- **"Push to Notion" button** — creates page in dedicated Notion DB
- **Link to Pylon ticket** — clickable ticket number opens Pylon directly
- **Agent mode toggle** — switch between Team and Single agent per ticket
- **Auto-proceed toggle** — per ticket, with 10-minute countdown

### Settings Pane

- Checkpoint configuration (enable/disable/add checkpoints)
- Concurrency limit (default: 3 active investigations)
- Default agent mode (team vs single)
- Customer response style rules (always include / never do lists)
- Slack channel priority list (built over time)

### Investigation History View

- Searchable, filterable list of past completed investigations
- Powered by SQLite queries
- Filter by: classification, connector, customer, date range, resolution type
- Click to view full investigation document

---

## Workflow: Complete Execution Flow

```
[Human] Enters ticket ID in UI (e.g., 8314)
  │
  ▼
[System] Creates investigation directory + SQLite record
[System] Fetches ticket from Pylon via MCP
[System] Reads request_type + product_area fields
[System] Applies classification routing table
  │
  ▼
★ CHECKPOINT 1: Post-Classification Review
  [System waits for human approval]
  Human: Confirm, reclassify, split, or abort
  │
  ▼
[System] Spawns appropriate agent team (or single agent)
[Agents] Phase 1 — Parallel context gathering:
  Agent A: Code review (Level 2)
  Agent B: Linear + Pylon history search
  Agent C: Slack broad search
  │
  ▼
★ CHECKPOINT 2: Post-Context-Gathering Review
  [System waits for human approval]
  Human: Continue, redirect, add context, or abort
  │
  ▼
[Lead Agent] Phase 2 — Synthesis:
  Combines all findings
  Generates investigation document
  Drafts Linear issue (if bug)
  Drafts customer response
  │
  ▼
★ CHECKPOINT 3: Investigation Validation
  [System waits for human approval]
  Human: Reviews findings, does manual UI repro
  Human: Approve, request corrections, request Level 3, or abort
  │
  ▼
[Lead Agent] Applies corrections if needed
  │
  ▼
★ CHECKPOINT 4: Re-Validation / Solution Check
  [System waits for human approval]
  Human: Confirms this solves customer issue
  Human: Approve, revise, escalate, or abort
  │
  ▼
[Human] Reviews final output:
  - Proofreads customer response
  - Reviews Linear draft → clicks "Create in Linear" if approved
  - Optionally clicks "Push to Notion"
  - Sends customer response via Pylon (manually)
  │
  ▼
[System] Updates investigation status to "complete"
[System] Records resolution type and timestamps
```

---

## Safety Guardrails

1. **~/C1/ is READ-ONLY** — agents never modify, create, or delete files in ~/C1/
2. **Agents never create Linear issues** — only draft text. Human clicks "Create in Linear" button
3. **Agents never send customer responses** — only draft text. Human proofreads and sends via Pylon
4. **Agents never push to Notion** — only prepare content. Human clicks "Push to Notion" button
5. **All external write actions require human approval** via checkpoint system
6. **Max 3 agents per team** (configurable)
7. **Auto-shutdown after 15 minutes** per investigation (configurable)
8. **Concurrency limit: 3 active investigations** (configurable)
9. **When uncertain, recommend escalation** — never claim certainty about root cause without evidence
10. **Always cite sources** — Linear issue numbers, Slack message links, file paths with line numbers

---

## Project Directory Structure

```
~/support-triage/
├── CLAUDE.md                           # Agent instructions and context
├── triage.db                           # SQLite database
├── settings.json                       # All configurable settings
├── team-templates/
│   ├── connector-bug.json
│   ├── product-bug.json
│   └── feature-request.json
├── investigations/
│   └── {ticket-id}/
│       ├── summary.md
│       ├── customer-response.md
│       ├── linear-draft.md
│       ├── agent-transcript.txt
│       ├── metrics.json
│       └── snapshot.json
├── ui/                                 # Local React application
│   ├── package.json
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── TicketSidebar.jsx
│   │   │   ├── InvestigationDetail.jsx
│   │   │   ├── CheckpointPanel.jsx
│   │   │   ├── DocumentPreview.jsx
│   │   │   ├── SettingsPane.jsx
│   │   │   └── HistoryView.jsx
│   │   └── services/
│   │       ├── websocket.js
│   │       ├── sqlite.js
│   │       └── mcp-bridge.js
│   └── ...
├── triage-launcher.sh                  # CLI launcher script
└── style-guide.json                    # Customer response style rules (grows via feedback)
```

---

## Enable Agent Teams

```json
// ~/.claude/settings.json or project settings.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

---

## Build Phases

### Phase 1 — Foundation (build first)
1a. CLAUDE.md — agent roles, classification routing, code review levels, output templates, checkpoint protocols, customer tone
1b. SQLite schema + investigation directory structure initialization
1c. Output document template (markdown)
1d. Connector bug team template (most common ticket type, 3 agents)

### Phase 2 — Orchestration
2a. Master triage prompt — Pylon field routing → team spawn → 4 checkpoints → output
2b. Single-agent fallback mode — same workflow, sequential execution
2c. Launcher script — `./triage.sh 8314` with `--resume` and `--single` flags
2d. Remaining team templates — product bug + feature request

### Phase 3 — Local UI
3a. React app scaffold — sidebar + main panel layout, modular components
3b. Ticket list sidebar — status indicators, click to switch, concurrency display
3c. Investigation detail view — ticket info, agent status, checkpoint actions, document preview
3d. Settings pane — checkpoints config, concurrency limit, auto-proceed, style guide rules
3e. WebSocket bridge — real-time agent output → UI
3f. Notion push + Linear create buttons — MCP calls behind human approval

### Phase 4 — Calibration
4a. 5 real connector bug tickets — validate end-to-end, tune CLAUDE.md
4b. 3 product bug tickets — validate team template
4c. 3 feature request tickets — validate team template
4d. Style guide seeding — first 10 customer responses build feedback loop

### Phase 5 — Polish (V1.1)
5a. Kanban view option for sidebar
5b. Investigation history search with filters
5c. Channel frequency map from investigation data
5d. Metrics dashboard (time-to-triage, classification accuracy)

---

## V2 Backlog (not building now)

- Auto-link Linear issues back to Pylon tickets
- Add customer name/org to Linear issues
- Notion severity definitions integration for smarter priority suggestions
- Always-on Level 3 code analysis toggle
- Priority-based agent allocation (P1 gets more resources)
- Kanban board as alternative to sidebar list

---

## Decision Log — Door Classifications

| Decision | Type | Notes |
|---|---|---|
| Three ticket classifications | 🚪 Swinging | Can add/rename in config |
| Pylon field-based routing | 🚪 Swinging | Mapping table, easy to update |
| 4 mandatory checkpoints | 🚪 Swinging | Config-driven |
| Per-ticket auto-proceed toggle | 🚪 Swinging | UI toggle |
| Abort = pause with resume | 🚪➡️ Leans one-way | State persistence needs upfront design |
| SQLite + files dual storage | 🚪➡️ Leans one-way | Schema matters, but columns addable |
| Local React UI | 🚪 Swinging | Layout/components all changeable |
| UI layout (sidebar + main) | 🚪 Swinging | Modular, panel-swappable |
| Agent Teams orchestration | 🚪 Swinging | Fallback to single-agent eliminates lock-in |
| Markdown output format | 🚪 Swinging | Push to Notion as optional export |
| WebSocket bridge protocol | 🚪➡️ Leans one-way | Protocol harder to change |
| Customer response style | 🚪 Swinging | Built via feedback loop |
| Level 2 default code depth | 🚪 Swinging | Toggle to Level 3 anytime |
| Connector-agnostic agent design | 🚪 Swinging | Dynamic baton-{name} lookup |
| Broad Slack search | 🚪 Swinging | Channel priority list built over time |
| Concurrency limit of 3 | 🚪 Swinging | Adjustable in settings |
| Linear issues: draft only, human creates | 🚪 Swinging | "Create in Linear" button behind approval |
| Never auto-assign priority | 🚪 Swinging | Suggest only |

---

## MCP Servers Available

- **Pylon** — support ticket reading, customer conversation access
- **Linear** — issue tracking, search, creation (write only via human approval)
- **Slack** — team communications search
- **Notion** — documentation, investigation page creation (write only via human approval)

---

## Key Constraints

- ~/C1/ repos are synced from GitHub every 2 hours via automated script — always reasonably fresh
- Pylon tickets use numeric IDs (e.g., 8314)
- Pylon has "Fill field with AI" enabled on Product Area — fields usually populated
- ~250+ connectors in ~/C1/ConductorOne/, each as baton-{name}
- Platform code in ~/C1/ductone/
- Up to 10 tickets may be managed simultaneously
- Human is always the final approver for all external actions
