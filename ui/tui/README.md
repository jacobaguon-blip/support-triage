# Support Triage Session Manager - Terminal UI

A terminal-based session manager for Claude Code support workflows, featuring tmux orchestration, multi-agent investigations, and checkpoint approval.

## Features

✅ **Terminal UI** - Blessed.js-based TUI with ConductorOne colors
✅ **Multi-Agent Investigations** - 4 specialized agents (Slack, Linear, Pylon, Codebase)
✅ **tmux Integration** - Automatic session creation and pane management
✅ **Checkpoint Approval** - Human-in-the-loop decision points
✅ **Real-Time Status** - Live updates with status indicators (🟢🟡🔴🔵○)
✅ **Summary & Response** - Auto-aggregate findings and draft customer responses
✅ **Search** - Find investigations by ticket, customer, or keywords
✅ **Light/Dark Theme** - Toggle with D key

## Installation

```bash
cd ~/support-triage/ui
npm install
```

## Usage

### Start the TUI

```bash
cd ~/support-triage/ui
npm run tui
```

Or directly:

```bash
node tui/app.js
```

### Prerequisites

1. **tmux** must be installed:
   ```bash
   # macOS
   brew install tmux

   # Linux
   sudo apt-get install tmux
   ```

2. **Express API server** must be running (for database access):
   ```bash
   cd ~/support-triage/ui
   node server.js
   ```
   Server runs on port 3001.

3. **SQLite database** must exist at `~/support-triage/triage.db`

## Keyboard Shortcuts

### Navigation
- `j` or `↓` - Move down in session list
- `k` or `↑` - Move up in session list
- `1-4` - Jump to agent tabs (Slack, Linear, Pylon, Codebase)
- `5` - Jump to Summary tab
- `6` - Jump to Response tab
- `Tab` - Cycle through tabs
- `h` or `←` - Previous tab
- `l` or `→` - Next tab

### Actions
- `n` - Create new session
- `s` - Search investigations
- `d` - Toggle dark/light theme (requires restart)
- `?` - Show help
- `q` - Quit
- `Ctrl+C` - Force quit

### Checkpoint Approval
When an agent reaches a checkpoint (🔵 status):
- `a` - Approve
- `r` - Reject
- `f` - Add feedback (then Tab to edit text)
- `Tab` - Edit feedback text
- `Enter` - Submit response
- `Esc` - Cancel

### Search Modal
- Type to search
- `Enter` - Perform search or open selected
- `↑/↓` or `j/k` - Navigate results
- `Tab` - Return to search input
- `Esc` - Close search

## Layout

```
┌─ Support Triage Session Manager ──────────────────────────────────┐
│ ┌─ Sessions ──┬─ [Slack 🟡] [Linear 🟢] [Pylon ○] [Code ○] [...] ┐
│ │             │                                                   │ │
│ │ 8484        │  Agent Output (real-time)                         │ │
│ │ ● acme.com  │  ────────────────────────────────────────────────│ │
│ │ troubleshoot│  12:34 Slack Agent: Searching #support-eng...    │ │
│ │ 🟢 [4/4]    │  12:35 [Tool: slack_get_channel_history] ✓       │ │
│ │             │  12:35 Found 3 threads mentioning auth issues    │ │
│ │ 9121        │  12:36 Ready for checkpoint approval 🔵           │ │
│ │ ● beta.com  │                                                   │ │
│ │ feature req │  Tab 5 (Summary): Aggregated findings            │ │
│ │ 🟡 [2/3]    │  Tab 6 (Response): Customer-facing draft         │ │
│ │             │                                                   │ │
│ │ [Press N]   │                                                   │ │
│ └─────────────┴───────────────────────────────────────────────────┘ │
│ s:search n:new d:theme ?:help q:quit                           │
└────────────────────────────────────────────────────────────────────┘
```

## New Session Flow

### 1. Press `N` → Enter Ticket Info

Modal prompts for:
- **Ticket #** (optional - leave blank for ad-hoc research)
- **Customer name** (optional)

Press Enter to continue, Esc to cancel.

### 2. Ticket Summary (if ticket # provided)

Displays Pylon ticket details:
- Customer, priority, created date
- Title and description
- Thread message count

Press Enter to continue, Esc to cancel.

### 3. Select Skill

Choose from 5 skills:
1. **Troubleshoot** - Full investigation (4 agents)
2. **Feature Request / Bug Validation** - Check duplicates (3 agents)
3. **Knowledge Base Article** - Gather info (3 agents)
4. **Research / Investigate** - General research (3 agents)
5. **Ad-hoc Single Agent** - Quick question (1 agent)

Press 1-5 to select, or use arrow keys and Enter.

### 4. Agents Launch

TUI automatically:
- Creates tmux session named `triage-{ticket}`
- Splits into N panes (based on skill)
- Labels panes with agent names
- Generates and displays agent prompts
- Starts polling for status updates (every 3 seconds)

**Note:** Auto-launch of Claude Code agents is not yet implemented. Panes will show agent prompts. You can manually launch Claude Code in each pane if desired.

## Status Indicators

| Icon | Status | Meaning |
|------|--------|---------|
| 🟢 | Completed | Agent finished successfully |
| 🟡 | Running | Agent actively working |
| 🔴 | Error | Agent encountered error |
| 🔵 | Checkpoint | Agent needs human approval |
| ○ | Pending | Agent not started yet |

## Agent Roles

### Slack Agent (💬)
- Searches Slack workspace for discussions
- Focuses on #support-eng, #engineering, #product
- Looks for error mentions, customer complaints, engineering insights
- Time range: Last 3-6 months

### Linear Agent (📋)
- Searches Linear for related issues, features, roadmap items
- Checks for duplicates, similar bugs, planned features
- Identifies what's already fixed, planned, or new

### Pylon Agent (🎫)
- Fetches full ticket details from Pylon
- Reads entire thread (all messages)
- Extracts customer impact, timeline, severity
- Suggests priority changes if needed

### Codebase Agent (💻)
- Searches `/C1/ConductorOne/` and `/C1/ductone/` repos
- Finds error traces, related functions, config files
- Identifies files and line numbers involved
- Performs Level 2 analysis (error trace, not root cause)

## Agent Output Files

Each investigation creates a directory:
```
~/support-triage/investigations/{ticket}/investigation-1/
├── .slack-prompt.txt          # Agent prompt (hidden)
├── .linear-prompt.txt
├── .pylon-prompt.txt
├── .codebase-prompt.txt
├── slack-findings.md          # Agent output
├── linear-findings.md
├── pylon-findings.md
├── codebase-findings.md
├── summary.md                 # Aggregated summary
└── customer-response.md       # Customer-facing draft
```

## Checkpoints

Agents output checkpoint markers when they need human approval:

```
CHECKPOINT: <question>
```

When detected:
1. Agent status changes to 🔵
2. Modal appears with agent's question
3. User selects: Approve (A), Reject (R), or Feedback (F)
4. Response is sent back to agent via tmux

Examples:
- "Found 3 Slack threads. Should I summarize them?"
- "Code analysis complete. Go deeper with root cause analysis?"
- "No similar Linear issues found. Should I broaden search?"

## Summary Tab (Tab 5)

Aggregates findings from all agents into a structured summary:

```markdown
# Investigation Summary for Ticket 8484

**Generated:** 2026-02-11 10:30:00

---

## Slack Agent Findings
[Slack findings content]

---

## Linear Agent Findings
[Linear findings content]

---

## Pylon Agent Findings
[Pylon findings content]

---

## Codebase Agent Findings
[Codebase findings content]

---

## Next Steps
1. Review findings above
2. Switch to Response tab
3. Edit and send customer response
```

## Response Tab (Tab 6)

Shows customer-facing response draft:

```markdown
Hi there,

Thank you for reaching out. We've investigated your issue and here's what we found:

**What we discovered:**
We reviewed the relevant code and identified the areas related to your issue.

**Next steps:**
- [ ] Review detailed findings
- [ ] Create Linear issue if needed
- [ ] Provide updated timeline

Please let us know if you have any questions!

Best regards,
Technical Support Team
```

**Note:** Editing (press `i`) is not yet implemented. For now, open the file directly:
```bash
open ~/support-triage/investigations/{ticket}/investigation-1/customer-response.md
```

## Search

Press `S` to search investigations:
- Type ticket number, customer name, or keywords
- Press Enter to search
- Use arrow keys to navigate results
- Press Enter to open selected investigation
- Press Esc to close

Searches:
- Ticket numbers (exact or partial match)
- Customer names (case-insensitive)
- Classifications (product_bug, connector_bug, feature_request)

## Themes

Toggle between light and dark mode with `D` key.

**Light mode:**
- White background (#FFFFFF)
- ConductorOne blue (#4169E1)
- Professional and clean

**Dark mode:**
- Dark background (#1A1D2E)
- Adjusted colors for readability
- Easier on eyes in low light

Theme preference saved to `~/.support-triage-theme.json`.

**Note:** Theme change requires restart to take full effect.

## Troubleshooting

### TUI won't start
- Check if tmux is installed: `which tmux`
- Check if Express server is running on port 3001
- Check if database exists: `ls ~/support-triage/triage.db`

### Sessions not loading
- Verify Express server is running: `curl http://localhost:3001/api/investigations`
- Check database permissions
- Check TUI logs (if any errors are shown)

### tmux sessions not created
- Verify tmux is in PATH: `which tmux`
- Check tmux version: `tmux -V` (needs 2.0+)
- Try creating a session manually: `tmux new -s test`

### Agent status not updating
- Verify investigation directory exists: `ls ~/support-triage/investigations/{ticket}/investigation-1/`
- Check if tmux session exists: `tmux ls | grep triage`
- Check if tmux panes are responsive: `tmux attach -t triage-{ticket}`

### Checkpoint modal not appearing
- Verify agent output contains `CHECKPOINT:` marker
- Check status indicator shows 🔵
- Try selecting the session and waiting a few seconds

## tmux Commands

View all triage sessions:
```bash
tmux ls | grep triage
```

Attach to a session:
```bash
tmux attach -t triage-8484
```

Detach from session:
```
Ctrl+B, then D
```

Kill a session:
```bash
tmux kill-session -t triage-8484
```

## Development

### File Structure
```
tui/
├── app.js                      # Main TUI application
├── theme.js                    # Theme management
├── db-adapter.js               # Database API client
├── orchestrator.js             # tmux spawning logic
├── aggregator.js               # Findings aggregation
├── components/
│   ├── session-list.js         # Left sidebar
│   ├── agent-tabs.js           # Top tabs
│   ├── session-view.js         # Main content area
│   ├── status-bar.js           # Bottom status bar
│   ├── new-session-modal.js    # Ticket input
│   ├── ticket-summary-modal.js # Pylon summary
│   ├── skill-selector-modal.js # Skill selection
│   ├── checkpoint-modal.js     # Checkpoint approval
│   └── search-modal.js         # Search UI
├── QA-REPORT.md                # QA status
└── README.md                   # This file
```

### Running Tests

No automated tests yet. Manual QA checklist in `QA-REPORT.md`.

### Adding New Features

1. Check existing component structure
2. Add new component to `components/`
3. Import and integrate in `app.js`
4. Update `QA-REPORT.md` with test plan
5. Update this README with usage instructions

## Known Issues

1. **Agent auto-launch not implemented** - Agents show prompts but don't auto-start Claude Code
2. **Pylon API integration mock** - Ticket summary uses placeholder data
3. **Response editing not implemented** - Press `i` key does nothing (edit file directly for now)
4. **Theme change requires restart** - Can't hot-reload theme

## Roadmap

### Phase 3 (Future)
- [ ] Auto-launch Claude Code agents
- [ ] Pylon API integration (real ticket data)
- [ ] Response editing in TUI (press `i`)
- [ ] Multiple concurrent investigations (already structured, needs testing)
- [ ] Investigation reruns (investigation-2, investigation-3)
- [ ] Export transcripts (PDF/Markdown)
- [ ] Session archiving (press `d`)
- [ ] Agent restart on failure (press `x`)

### Phase 4 (Polish)
- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance optimization
- [ ] Keyboard shortcut customization
- [ ] Color theme customization
- [ ] Terminal resize handling

## Support

Questions or issues? Check:
1. `QA-REPORT.md` for known issues
2. `~/support-triage/ui/tui/app.js` source code
3. tmux logs: `tmux list-sessions`

---

Built with ❤️ using Blessed.js and tmux.
