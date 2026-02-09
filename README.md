# Support Ticket Triage System

An intelligent support ticket investigation system for ConductorOne's Technical Support Engineering team. Uses Claude Code to automatically investigate support tickets by coordinating specialist agents that research across code, Linear, Slack, and Pylon.

## Quick Start

### Prerequisites
- Node.js 18+
- Claude Code CLI installed
- MCP servers configured: Pylon, Linear, Slack
- Access to ~/C1/ repositories (read-only)

### Install Dependencies

```bash
cd ui && npm install
```

### Start the App (Manual)

```bash
cd ui
node server.js &    # Express API on port 3001
npm run dev          # Vite dev server on port 3000
```

Then open `http://localhost:3000`.

### Start the App (pm2 — Recommended)

pm2 keeps both services running in the background and auto-restarts them on reboot.

```bash
# One-time setup
npm install -g pm2

# Start both services
cd support-triage
pm2 start ecosystem.config.js

# Useful commands
pm2 status          # Check if services are running
pm2 logs            # Tail logs from both services
pm2 restart all     # Restart both
pm2 stop all        # Stop both

# Auto-start on reboot
pm2 startup         # Generates a system command — run what it prints
pm2 save            # Saves current process list for auto-start
```

The `ecosystem.config.js` in the project root configures both the API server (port 3001) and the Vite dev server (port 3000).

### Start a CLI Investigation

```bash
./triage-launcher.sh 8314              # New investigation
./triage-launcher.sh 8314 --resume     # Resume paused investigation
./triage-launcher.sh 8314 --single     # Force single-agent mode
```

## Project Structure

```
~/support-triage/
├── CLAUDE.md                      # Agent instructions (READ THIS FIRST)
├── BACKUP-AND-RECOVERY.md        # Disaster recovery procedures
├── PROJECT-PLAN.md               # Sprint planning and roadmap
├── ecosystem.config.js           # pm2 service configuration
├── triage.db                      # SQLite database (runtime data)
├── settings.json                  # Configuration
├── orchestration.md               # Master orchestration guide
├── single-agent-mode.md          # Fallback execution guide
├── triage-launcher.sh            # CLI launcher script
│
├── ui/                           # React + Express application
│   ├── server.js                 # Express API (port 3001)
│   ├── package.json
│   └── src/
│       ├── App.jsx               # Main app with navigation
│       ├── components/
│       │   ├── AdminPortal.jsx   # Admin dashboard, feature board, project status
│       │   ├── FeatureRequests.jsx # Feature request CRUD
│       │   ├── InvestigationDetail.jsx
│       │   ├── SettingsPane.jsx
│       │   └── TicketSidebar.jsx
│       ├── services/
│       │   └── sqlite.js         # API client for backend
│       └── styles/               # CSS (C1 design system)
│
├── teams/                        # Two-team structure
│   ├── README.md                 # Team overview and org chart
│   ├── ops-dev/CHARTER.md       # Alex Chen — Ops Dev Lead
│   ├── triage/CHARTER.md        # Morgan Torres — Triage Lead
│   ├── PROJECT-BOARD.md         # Shared kanban board
│   ├── STANDUP.md               # Daily standup log
│   └── COMMUNICATION.md         # Communication protocol
│
├── qa/                           # QA reference
│   ├── STANDARDS.md
│   ├── TEST-PLAN-TEMPLATE.md
│   ├── UI-TESTING-GUIDE.md
│   └── API-TESTING-GUIDE.md
│
├── features/                     # Feature request docs
│   ├── BACKLOG.md
│   └── TEMPLATE.md
│
├── team-templates/               # Agent team configurations
│   ├── connector-bug.json
│   ├── product-bug.json
│   └── feature-request.json
│
├── templates/                    # Output document templates
│   ├── summary-template.md
│   ├── linear-draft-template.md
│   └── customer-response-template.md
│
└── investigations/               # Investigation outputs
    └── {ticket-id}/
        ├── summary.md
        ├── customer-response.md
        ├── linear-draft.md
        ├── agent-transcript.txt
        ├── metrics.json
        └── snapshot.json
```

## How It Works

### 1. Classification (Phase 0)
- Fetch ticket from Pylon
- Read `request_type` and `product_area` fields
- Apply classification routing table
- Result: **Connector Bug** | **Product Bug** | **Feature Request**

### 2. Context Gathering (Phase 1)
Three specialist agents research in parallel:
- **Code specialist**: Find relevant code, trace errors to files/lines
- **Issue historian**: Search Linear and Pylon for similar issues
- **Slack researcher**: Search Slack for related discussions

### 3. Synthesis (Phase 2)
Lead agent generates:
- Investigation summary with findings
- Linear issue draft (for bugs)
- Customer response draft

### 4. Four Checkpoints
Human reviews and approves at each checkpoint:
1. **Post-Classification** — Confirm classification
2. **Post-Context-Gathering** — Review initial findings
3. **Investigation Validation** — Validate complete investigation
4. **Solution Check** — Approve final outputs

## Key Features

**Human-in-the-Middle Checkpoints**
- 4 mandatory approval points
- Quick action buttons at each checkpoint
- Optional auto-proceed with 10-minute timeout

**Two Agent Modes**
- **Team Mode**: 3 specialist agents run in parallel (faster)
- **Single-Agent Mode**: One agent does all roles sequentially (fallback)

**Three Classification Types**
- **Connector Bug**: Issues with specific integrations (Okta, Azure, etc.)
- **Product Bug**: Platform issues (UI, API, workflows, permissions)
- **Feature Request**: New capabilities requested by customers

**Code Review Depths**
- **Level 2 (default)**: Error trace to specific files/lines
- **Level 3 (on request)**: Root cause analysis with fix proposals

**Safety Guardrails**
- ~/C1/ is read-only (never modified)
- Agents only draft Linear issues (human clicks "Create")
- Agents only draft customer responses (human sends via Pylon)
- All findings cite sources (Linear #, Slack links, file:line)

## Configuration

### Enable Agent Teams (Optional)

In `~/.claude/settings.json` or project `.claude/settings.json`:
```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

### Adjust Settings

Edit `~/support-triage/settings.json`:
- Enable/disable checkpoints
- Adjust concurrency limit (default: 3 active investigations)
- Set default agent mode (team vs single)
- Configure auto-proceed timeout
- Set code review default depth

## Database Schema

SQLite database at `~/support-triage/triage.db`:

```sql
CREATE TABLE investigations (
    id INTEGER PRIMARY KEY,              -- Pylon ticket number
    customer_name TEXT,
    classification TEXT,                  -- product_bug | connector_bug | feature_request
    connector_name TEXT,
    product_area TEXT,
    priority TEXT,                        -- P1-P4 from Pylon
    suggested_priority TEXT,
    status TEXT,                          -- queued | running | paused | waiting | complete
    current_checkpoint TEXT,
    auto_proceed INTEGER DEFAULT 0,
    agent_mode TEXT DEFAULT 'team',
    created_at DATETIME,
    updated_at DATETIME,
    resolved_at DATETIME,
    resolution_type TEXT,                 -- solved | escalated | duplicate
    output_path TEXT,
    linear_issue_id TEXT,
    notion_page_id TEXT,
    tags TEXT,
    snapshot TEXT
);
```

## Investigation Outputs

Each investigation creates:
- **summary.md** — Complete findings with code analysis, related issues, Slack context
- **linear-draft.md** — Structured Linear issue (for bugs)
- **customer-response.md** — Friendly-professional customer reply
- **agent-transcript.txt** — Raw agent output log
- **metrics.json** — Timing data, sources cited
- **snapshot.json** — Pause/resume state

## Classification Routing

### Request Type → Classification
| Pylon Request Type | Routes To |
|---|---|
| Defect | Check Product Area → Bug type |
| Troubleshooting | Check Product Area → Bug type |
| Product Request | Feature Request |
| Other | NLP fallback |

### Product Area → Bug Type
| Product Area | Classification |
|---|---|
| Connectors | Connector Bug |
| Platform / UI | Product Bug |
| Access Profiles | Product Bug |
| Access Requests | Product Bug |
| API / Terraform | Product Bug |
| Thomas - AI Agent | Product Bug |
| Other | NLP fallback |

## Workflows by Classification

### Connector Bug
1. **connector-code-specialist**: Search `~/C1/ConductorOne/baton-{name}/`
2. **issue-historian**: Search Linear/Pylon for similar connector issues
3. **slack-context-researcher**: Search Slack for connector discussions
4. Generate: summary + Linear draft + customer response

### Product Bug
1. **product-code-reviewer**: Search `~/C1/ductone/`
2. **issue-historian**: Search Linear/Pylon for similar platform issues
3. **slack-context-researcher**: Search Slack for product discussions
4. Generate: summary + Linear draft + customer response

### Feature Request
1. **roadmap-researcher**: Check Linear roadmap and planned features
2. **similar-requests-researcher**: Find duplicate requests in Pylon/Linear
3. **slack-context-researcher**: Find internal feature discussions
4. Generate: summary + customer response (no Linear draft unless escalation needed)

## Repository Locations

**Connectors:** `~/C1/ConductorOne/baton-{connector-name}/`
- ~250+ connectors
- Naming: "Okta" → `baton-okta`, "Azure" → `baton-azure`

**Platform:** `~/C1/ductone/`
- Core logic in `c1/`
- Shared packages in `pkg/`
- AI agent in `thomas-browser-agent/`

**SDKs:** `~/C1/ConductorOne/conductorone-sdk-{go|python|typescript}/`

## Checkpoint Quick Actions

### Checkpoint 1: Post-Classification
- ✓ Confirm
- ↩ Reclassify as...
- ✂ Split into multiple issues
- ✕ Abort

### Checkpoint 2: Post-Context-Gathering
- ✓ Continue investigation
- 🔍 Search deeper in...
- ➡ Redirect focus to...
- + Add context
- ✕ Abort

### Checkpoint 3: Investigation Validation
- ✓ Findings look correct
- ✏ Corrections needed
- 🔬 Go to Level 3 analysis
- ↩ Re-investigate
- ✕ Abort

### Checkpoint 4: Solution Check
- ✓ This solves the customer issue
- ✏ Revise response
- ⬆ Escalate to engineering
- 📋 Create Linear issue draft
- ✕ Abort

## Abort = Pause with Resume

When abort is triggered:
- All agent work stops
- Everything saved to investigation directory
- Status set to `paused`
- Snapshot captures current state

Resume options:
- Continue from where stopped
- Back up one checkpoint
- Restart with new classification
- Merge into another ticket

## Customer Response Style

**Tone:** Friendly-professional

**Structure:**
- Light formatting (subheadings, bullets where helpful)
- Conversational paragraphs as primary flow
- No heavy Markdown headers

**Content:**
- Acknowledge specific issue
- Explain findings in customer-friendly language
- Be direct about bug/expected behavior/need more info
- Provide clear next steps
- Offer follow-up

**Learning:** System learns from human edits to improve future drafts

## Manual Operations

Agents draft, humans execute:
- **Linear issues**: Review draft, click "Create in Linear" button
- **Customer responses**: Proofread draft, send via Pylon manually
- **Notion pages**: Review content, click "Push to Notion" button
- **Priority changes**: Review suggestion, update Pylon manually

## Development Phases

### Phase 1 — Foundation ✅
- [x] CLAUDE.md agent instructions
- [x] SQLite schema and directory structure
- [x] Output document templates
- [x] Connector bug team template

### Phase 2 — Orchestration ✅
- [x] Master triage orchestration guide
- [x] Single-agent fallback mode
- [x] Launcher script
- [x] Remaining team templates (product bug, feature request)

### Phase 3 — Local UI ✅
- [x] React 18 + Vite 5 app scaffold
- [x] Ticket sidebar with compact cards and draggable resize
- [x] Investigation detail view with conversation stepper
- [x] Settings pane (agent mode, polling, response style)
- [x] C1 design system (indigo brand, Inter font, responsive)
- [x] Express API backend with SQLite
- [x] Feature request CRUD system
- [x] Admin Portal (dashboard, feature board, project status)
- [x] Two-team structure (Ops Dev + Triage)
- [x] QA reference documentation
- [x] pm2 service configuration

### Phase 4 — In Progress
- [ ] Three-column layout redesign (P2, in progress)
- [ ] Investigation lifecycle: done state and toggle (P1)
- [ ] Classification accuracy audit (P1)
- [ ] Automated metrics from Pylon/Linear (P2)
- [ ] Pylon webhook integration (P2)
- [ ] Direct Pylon response send (P3)

### Phase 5 — Calibration
- [ ] Test with 5 real connector bug tickets
- [ ] Test with 3 product bug tickets
- [ ] Test with 3 feature request tickets
- [ ] Seed style guide from first 10 customer responses

## Important Constraints

- **~/C1/ is READ-ONLY** — Never modify anything in C1 repos
- **Humans approve all external actions** — Linear creation, Pylon messages, Notion pushes
- **Always cite sources** — Linear #, Slack links, file:line references
- **Respect all checkpoints** — Stop and wait for human approval
- **When uncertain, recommend escalation** — Never claim false certainty

## Getting Help

- Read `CLAUDE.md` for complete agent instructions
- Read `orchestration.md` for full workflow details
- Read `single-agent-mode.md` for fallback execution
- Check `settings.json` for configuration options

## Version

**V2.0.0** — UI app live with Admin Portal, feature request system, two-team structure, pm2 service support

---

Built with Claude Code for ConductorOne Technical Support Engineering
