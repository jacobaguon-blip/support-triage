# Claude Code Kick-Off Prompt — Support Triage System

Read the full specification in `support-triage-spec.md` before starting. That document contains every architectural decision, data model, UI layout, and workflow detail. This prompt tells you what to build and in what order.

## Phase 1 — Foundation (Start Here)

Build these in order. Do not skip ahead to later phases.

### Step 1a: CLAUDE.md

Create `~/support-triage/CLAUDE.md` — the instruction file that all agents will reference.

Include:
- Project overview and purpose
- Agent role definitions (connector-code-specialist, issue-historian, slack-context-researcher, product-code-reviewer, roadmap-researcher, similar-requests-researcher)
- Classification routing table (copy from spec — request_type × product_area → team)
- Code review depth protocol (Level 2 default, prompt for Level 3)
- Repository navigation guide (baton-{name} pattern for connectors, ~/C1/ductone/ for platform)
- Communication protocol (how agents report findings to lead)
- Output format requirements (cite all sources with Linear #, Slack links, file:line)
- Safety guardrails (~/C1/ read-only, never create Linear issues, never send customer messages)
- Customer response tone (friendly-professional, light formatting)
- Checkpoint awareness (agents must stop at defined checkpoints and wait)

### Step 1b: SQLite Schema + Directory Structure

Create the initialization script that:
- Creates `~/support-triage/` and all subdirectories per the spec
- Creates `~/support-triage/triage.db` with the investigations table schema from the spec
- Creates `~/support-triage/settings.json` with default configuration:
  - All 4 checkpoints enabled and mandatory
  - Concurrency limit: 3
  - Default agent mode: team
  - Auto-proceed timeout: 600 seconds (10 min)
  - Code review default depth: 2

### Step 1c: Output Document Template

Create `~/support-triage/templates/summary-template.md` — the markdown template from the spec that agents fill in during investigation. Include all sections: Ticket Summary, Classification, Key Findings, Code Analysis, Related Issues, Slack Context, Root Cause Assessment, Recommended Actions, Open Questions, Linear Issue Draft, Customer Response Draft.

### Step 1d: Connector Bug Team Template

Create `~/support-triage/team-templates/connector-bug.json`:
- 3 agents: connector-code-specialist, issue-historian, slack-context-researcher
- Task definitions with dependencies
- Phase 1 (parallel): all 3 agents gather context simultaneously
- Phase 2 (sequential): lead synthesizes findings
- Agent-specific search strategies and file paths
- Checkpoint trigger points

---

## Phase 2 — Orchestration (After Phase 1 is solid)

### Step 2a: Master Triage Prompt

Create the orchestration script/prompt that:
1. Accepts a Pylon ticket ID
2. Fetches ticket via Pylon MCP
3. Reads request_type and product_area fields
4. Applies the routing table for classification
5. Triggers Checkpoint 1 (waits for human)
6. Spawns the appropriate team template
7. Monitors agent progress
8. Triggers Checkpoints 2, 3, 4 at correct points
9. Generates final output documents
10. Updates SQLite record

### Step 2b: Single-Agent Fallback

Create a sequential mode that runs the same steps as the team but with one agent:
1. Code review
2. Linear/Pylon history search
3. Slack search
4. Synthesis and document generation

Same checkpoints, same output format. Activated automatically when Agent Teams is unavailable or manually per ticket.

### Step 2c: Launcher Script

Create `~/support-triage/triage-launcher.sh`:
- `./triage-launcher.sh 8314` — start new investigation
- `./triage-launcher.sh 8314 --resume` — resume paused investigation
- `./triage-launcher.sh 8314 --single` — force single-agent mode
- Creates investigation directory if needed
- Initializes SQLite record
- Launches Claude Code with appropriate context

### Step 2d: Remaining Team Templates

Create `~/support-triage/team-templates/product-bug.json` and `feature-request.json` following the same structure as connector-bug.json but with the appropriate agent roles from the spec.

---

## Phase 3 — Local UI (After orchestration works in terminal)

Build a React application in `~/support-triage/ui/` that runs on localhost.

### Layout: Sidebar + Main Panel

See the full UI specification in support-triage-spec.md. Key components:

1. **TicketSidebar** — always-visible list of all investigations with status icons, click to switch
2. **InvestigationDetail** — main view with ticket info, agent status, and document preview
3. **CheckpointPanel** — contextual quick action buttons + freeform text (button sets change per checkpoint)
4. **DocumentPreview** — live markdown rendering that updates as agents report
5. **SettingsPane** — checkpoint config, concurrency, agent mode defaults, style guide
6. **HistoryView** — searchable past investigations powered by SQLite

### Key UI Features
- WebSocket connection for real-time agent output
- "Create in Linear" button (calls Linear MCP)
- "Push to Notion" button (calls Notion MCP)
- Clickable Pylon ticket link
- Copy button for Linear draft
- Per-ticket auto-proceed toggle with countdown timer
- Per-ticket agent mode toggle (team/single)
- New ticket input
- Abort/Resume controls

---

## Important Constraints (always respect these)

- NEVER modify anything in ~/C1/ — read-only
- NEVER create Linear issues without human clicking the button
- NEVER send customer responses — only draft them
- All 4 checkpoints are mandatory stops unless auto-proceed is toggled per ticket
- Always cite sources in findings (Linear #, Slack links, file:line references)
- When uncertain about root cause, recommend escalation — never claim false certainty
- Connector code is at ~/C1/ConductorOne/baton-{name}/
- Platform code is at ~/C1/ductone/
- Pylon ticket IDs are plain numbers (e.g., 8314)
