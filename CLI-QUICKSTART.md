# Support Triage CLI - Quick Start

## Phase 1 Complete ✅

The CLI foundation is now working! You can use command-line tools to manage investigations without the TUI.

## Installation

```bash
cd ~/support-triage
npm install
chmod +x bin/triage
```

## Available Commands

### List all investigations

```bash
./bin/triage list

# Filter by status
./bin/triage list --status running
./bin/triage list --status waiting

# JSON output
./bin/triage list --json
```

**Example output:**
```
ID      Customer            Status      Checkpoint                         Created
────────────────────────────────────────────────────────────────────────────────────────
5555    DoorDash            waiting     checkpoint_1_post_classification   just now
8484    Unknown             waiting     checkpoint_1_post_classification   just now
3099    Tide7610            waiting     checkpoint_1_post_classification   just now

Total: 13 investigation(s)
```

### Check investigation status

```bash
./bin/triage status 5555

# JSON output
./bin/triage status 5555 --json
```

**Example output:**
```
Investigation #5555
──────────────────────────────────────────────────
Customer: DoorDash
Classification: connector_bug
Connector: okta
Product Area: Connectors
Priority: P3
Status: waiting
Checkpoint: checkpoint_1_post_classification
Created: 2026-02-11 22:54:00

Next steps:
──────────────────────────────────────────────────
Approve checkpoint:
  triage approve 5555 checkpoint_1_post_classification

Watch logs:
  triage logs 5555 -f
```

### View logs

```bash
# View main investigation log
./bin/triage logs 5555

# View last 100 lines
./bin/triage logs 5555 --tail 100

# Follow logs in real-time (like tail -f)
./bin/triage logs 5555 -f

# View specific agent log
./bin/triage logs 5555 --agent slack
./bin/triage logs 5555 --agent linear -f
```

### Create new investigation

```bash
./bin/triage create \
  --ticket 9999 \
  --skill troubleshoot \
  --customer "Test Customer" \
  --context "Testing the new CLI"
```

**What happens:**
1. Creates investigation in database
2. Runs Phase 0 (classification) via Express API
3. Waits at Checkpoint 1
4. Shows next steps

### Approve checkpoint

```bash
./bin/triage approve 5555 checkpoint_1_post_classification

# With feedback
./bin/triage approve 5555 checkpoint_1_post_classification \
  --feedback "Looks good, proceed"
```

## Testing the CLI

### Terminal 1: Start the server
```bash
cd ~/support-triage/ui
node server.js
```

### Terminal 2: Create investigation
```bash
cd ~/support-triage
./bin/triage create --ticket 6666 --skill troubleshoot
```

### Terminal 3: Watch logs
```bash
cd ~/support-triage
./bin/triage logs 6666 -f
```

### Terminal 4: Check status
```bash
cd ~/support-triage
watch -n 2 './bin/triage status 6666'
```

## Log Files

All logs are JSON Lines format in `~/support-triage/logs/`:

- `{id}-main.jsonl` - Main investigation log
- `{id}-agent-slack.jsonl` - Slack agent log
- `{id}-agent-linear.jsonl` - Linear agent log
- `{id}-agent-pylon.jsonl` - Pylon agent log
- `{id}-agent-codebase.jsonl` - Codebase agent log

Each line is valid JSON:
```json
{"ts":"2026-02-11T23:00:00.000Z","level":"info","msg":"Investigation created","id":5555}
{"ts":"2026-02-11T23:00:05.456Z","level":"info","msg":"Fetching ticket from Pylon","ticket_id":5555}
{"ts":"2026-02-11T23:00:10.000Z","level":"info","msg":"Classification complete","classification":"connector_bug"}
```

You can process with `jq`:
```bash
# Pretty print
cat ~/support-triage/logs/5555-main.jsonl | jq '.'

# Filter by level
cat ~/support-triage/logs/5555-main.jsonl | jq 'select(.level == "error")'

# Extract timestamps and messages
cat ~/support-triage/logs/5555-main.jsonl | jq -r '"\(.ts) \(.msg)"'
```

## What's Next

### Phase 2: Agent Orchestration (In Progress)
- [ ] Refactor orchestrator to spawn agents as background processes (not tmux)
- [ ] Pipe agent stdout/stderr to log files
- [ ] Track agent PIDs in database
- [ ] Implement agent lifecycle (start, stop, restart)
- [ ] Test with `triage approve` → agents start automatically

### Phase 3: TUI Simplification
- [ ] Simplify TUI to call CLI commands
- [ ] Read logs for real-time display
- [ ] Remove tmux dependencies from TUI
- [ ] Fix session switching bug

## Architecture

```
User
  ↓
CLI (bin/triage)
  ↓
Core Services (lib/core/)
  ├── logger.js       - Structured logging
  ├── database.js     - SQLite wrapper
  └── orchestrator.js - Agent spawning (Phase 2)
  ↓
Express API (ui/server.js)
  ↓
Database + Log Files
```

## Benefits So Far

✅ **Observable** - Can tail any log file to see what's happening
✅ **Debuggable** - CLI commands work independently, easy to test
✅ **Scriptable** - Can automate from bash scripts
✅ **Documented** - All state in database and structured logs

## Troubleshooting

**Command not found?**
```bash
chmod +x ~/support-triage/bin/triage
```

**Module warnings?**
These are harmless - the CLI still works. We'll fix them later.

**No such table: agents?**
```bash
cd ~/support-triage
sqlite3 triage.db < migrations/006-add-agents-table.sql
```

**Express server not running?**
```bash
cd ~/support-triage/ui
node server.js
```
