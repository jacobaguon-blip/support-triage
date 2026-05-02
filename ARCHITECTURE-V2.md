# Support Triage Architecture V2 (CLI-First)

## Design Philosophy

**Everything is observable, debuggable, and scriptable.**

- Backend is CLI-driven with comprehensive logging
- TUI is a thin viewer/controller that calls CLI commands
- All state lives in database and log files
- Agents run as background processes (not tmux)
- Every action is logged with timestamps and context

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         User Layer                          │
│  ┌──────────────┐              ┌──────────────────────┐    │
│  │   Terminal   │              │    TUI (blessed)     │    │
│  │   (direct)   │              │  (thin controller)   │    │
│  └──────┬───────┘              └──────────┬───────────┘    │
│         │                                  │                │
│         └──────────────┬───────────────────┘                │
│                        │                                    │
└────────────────────────┼────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      CLI Layer (bin/triage)                 │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │ create   │ status   │ approve  │ logs     │ list     │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     Core Services Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Orchestrator │  │   Database   │  │    Logger    │     │
│  │ (spawn agents│  │   (SQLite)   │  │ (structured) │     │
│  │  as processes│  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     Agent Processes                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Slack   │  │  Linear  │  │  Pylon   │  │ Codebase │   │
│  │  Agent   │  │  Agent   │  │  Agent   │  │  Agent   │   │
│  │ (claude) │  │ (claude) │  │ (claude) │  │ (claude) │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │             │              │              │         │
│       └─────────────┴──────────────┴──────────────┘         │
│                     │                                       │
│                     ▼                                       │
│           ┌──────────────────┐                             │
│           │    Log Files     │                             │
│           │ (per agent)      │                             │
│           └──────────────────┘                             │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
~/support-triage/
├── bin/
│   └── triage                        # Main CLI entrypoint
├── lib/
│   ├── cli/
│   │   ├── commands/
│   │   │   ├── create.js            # triage create
│   │   │   ├── status.js            # triage status
│   │   │   ├── approve.js           # triage approve
│   │   │   ├── logs.js              # triage logs
│   │   │   └── list.js              # triage list
│   │   └── parser.js                # Argument parsing
│   ├── core/
│   │   ├── orchestrator.js          # Agent spawning (no tmux)
│   │   ├── database.js              # SQLite wrapper
│   │   ├── logger.js                # Structured logging
│   │   └── agent-manager.js         # Agent lifecycle
│   └── agents/
│       ├── templates.js             # Agent prompt templates
│       └── status-parser.js         # Parse agent output
├── logs/
│   ├── {id}-main.jsonl              # Investigation main log
│   ├── {id}-agent-slack.jsonl       # Slack agent log
│   ├── {id}-agent-linear.jsonl      # Linear agent log
│   ├── {id}-agent-pylon.jsonl       # Pylon agent log
│   └── {id}-agent-codebase.jsonl    # Codebase agent log
├── ui/
│   ├── tui/
│   │   └── app.js                   # Thin TUI (calls CLI)
│   └── server.js                    # Keep Express API
├── investigations/
│   └── {id}/
│       └── investigation-{run}/
│           ├── phase0.json          # Phase 0 data
│           ├── slack-findings.md
│           ├── linear-findings.md
│           ├── pylon-findings.md
│           ├── codebase-findings.md
│           ├── summary.md
│           └── customer-response.md
└── triage.db
```

## CLI Commands

### triage create

```bash
triage create --ticket 5555 --skill troubleshoot [--customer "DoorDash"] [--context "..."]

# Output:
Investigation #5555 created
Status: waiting (checkpoint_1_post_classification)
Log: ~/support-triage/logs/5555-main.jsonl

# Run Phase 0 (classification)
# Pause at Checkpoint 1
# Wait for approval
```

### triage status

```bash
triage status 5555

# Output:
Investigation #5555
Customer: DoorDash
Classification: connector_bug (Okta)
Status: waiting
Checkpoint: checkpoint_1_post_classification
Created: 2026-02-11 22:54:00

Agents:
  Phase 1: Not started (waiting for checkpoint approval)

Logs:
  Main: ~/support-triage/logs/5555-main.jsonl (127 lines)
```

### triage approve

```bash
triage approve 5555 checkpoint_1

# Output:
Checkpoint 1 approved for investigation #5555
Starting Phase 1 (Context Gathering)...
Spawning agents:
  - Slack Agent (PID 12345) → logs/5555-agent-slack.jsonl
  - Linear Agent (PID 12346) → logs/5555-agent-linear.jsonl
  - Pylon Agent (PID 12347) → logs/5555-agent-pylon.jsonl
  - Codebase Agent (PID 12348) → logs/5555-agent-codebase.jsonl

Watch progress:
  tail -f ~/support-triage/logs/5555-main.jsonl
```

### triage logs

```bash
# Follow main investigation log
triage logs 5555

# Follow specific agent log
triage logs 5555 --agent slack

# Show last N lines
triage logs 5555 --tail 50

# Output (structured JSON):
{"ts":"2026-02-11T23:00:15.123Z","level":"info","msg":"Phase 1 starting","agents":4}
{"ts":"2026-02-11T23:00:15.456Z","level":"info","msg":"Agent spawned","agent":"slack","pid":12345}
{"ts":"2026-02-11T23:00:20.789Z","level":"info","msg":"Agent progress","agent":"slack","status":"searching channels"}
```

### triage list

```bash
triage list [--status running|waiting|completed]

# Output:
ID     Customer    Status    Checkpoint                         Created
─────────────────────────────────────────────────────────────────────────
5555   DoorDash    running   checkpoint_2_post_context          2h ago
8484   acme.com    waiting   checkpoint_1_post_classification   5h ago
3089   Test        completed -                                  1d ago
```

## Logging System

### Main Investigation Log

```jsonl
{"ts":"2026-02-11T23:00:00.000Z","level":"info","msg":"Investigation created","id":5555,"ticket":"5555","skill":"troubleshoot"}
{"ts":"2026-02-11T23:00:00.123Z","level":"info","msg":"Phase 0 starting","phase":"classification"}
{"ts":"2026-02-11T23:00:05.456Z","level":"info","msg":"Fetching ticket from Pylon","ticket_id":5555}
{"ts":"2026-02-11T23:00:06.789Z","level":"info","msg":"Ticket fetched","customer":"DoorDash","title":"Okta superadmin..."}
{"ts":"2026-02-11T23:00:10.000Z","level":"info","msg":"Classification complete","classification":"connector_bug","connector":"okta"}
{"ts":"2026-02-11T23:00:10.100Z","level":"info","msg":"Reached checkpoint","checkpoint":"checkpoint_1_post_classification","status":"waiting"}
{"ts":"2026-02-11T23:00:15.000Z","level":"info","msg":"Checkpoint approved","checkpoint":"checkpoint_1_post_classification","approved_by":"user"}
{"ts":"2026-02-11T23:00:15.123Z","level":"info","msg":"Phase 1 starting","agents":["slack","linear","pylon","codebase"]}
{"ts":"2026-02-11T23:00:15.456Z","level":"info","msg":"Agent spawned","agent":"slack","pid":12345,"log":"logs/5555-agent-slack.jsonl"}
```

### Agent Log (per agent)

```jsonl
{"ts":"2026-02-11T23:00:15.500Z","level":"info","msg":"Agent started","agent":"slack","investigation_id":5555}
{"ts":"2026-02-11T23:00:16.000Z","level":"info","msg":"Calling tool","tool":"slack_list_channels"}
{"ts":"2026-02-11T23:00:17.123Z","level":"info","msg":"Tool result","tool":"slack_list_channels","channels":45}
{"ts":"2026-02-11T23:00:18.000Z","level":"info","msg":"Calling tool","tool":"slack_get_channel_history","channel":"#support-eng"}
{"ts":"2026-02-11T23:00:20.456Z","level":"info","msg":"Writing findings","file":"investigations/5555/investigation-1/slack-findings.md"}
{"ts":"2026-02-11T23:00:21.000Z","level":"info","msg":"Agent completed","agent":"slack","duration_ms":5500,"status":"success"}
```

## Database Schema Updates

### investigations table (existing)
- Add: `main_log_file` TEXT
- Add: `agent_pids` JSON (map of agent name → PID)

### agents table (new)
```sql
CREATE TABLE IF NOT EXISTS agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  investigation_id INTEGER NOT NULL,
  investigation_run_id INTEGER,
  agent_name TEXT NOT NULL, -- slack, linear, pylon, codebase
  pid INTEGER,              -- Process ID
  status TEXT NOT NULL,     -- pending, running, completed, error, checkpoint
  log_file TEXT,            -- Path to agent-specific log
  findings_file TEXT,       -- Path to findings markdown
  started_at DATETIME,
  completed_at DATETIME,
  error_message TEXT,
  FOREIGN KEY (investigation_id) REFERENCES investigations(id),
  FOREIGN KEY (investigation_run_id) REFERENCES investigation_runs(id)
);
```

## Agent Orchestration (No tmux)

### Old (tmux-based)
```javascript
// Spawn in tmux pane, hard to track, requires tmux attach to debug
await execAsync(`tmux send-keys -t ${sessionName} "claude" C-m`);
```

### New (child_process-based)
```javascript
// Spawn as background process, pipe to log files
const logStream = fs.createWriteStream(agentLogFile, { flags: 'a' });
const agentProcess = spawn('claude', ['--prompt', promptFile], {
  stdio: ['pipe', 'pipe', 'pipe'],
  detached: true,
  env: {
    TICKET: ticketId,
    AGENT: agentName,
    OUTPUT_PATH: investigationDir,
    ...process.env
  }
});

agentProcess.stdout.pipe(logStream);
agentProcess.stderr.pipe(logStream);

// Track in database
await db.run(`
  INSERT INTO agents (investigation_id, agent_name, pid, status, log_file, started_at)
  VALUES (?, ?, ?, 'running', ?, datetime('now'))
`, [investigationId, agentName, agentProcess.pid, agentLogFile]);

// Don't wait - let it run in background
agentProcess.unref();
```

## TUI Simplification

### Old (orchestrates everything)
```javascript
// TUI manages tmux, spawns agents, tracks state
const tmuxSession = await this.orchestrator.createSession(investigation, agents);
this.startAgentPolling(session.ticketNumber);
```

### New (calls CLI)
```javascript
// TUI just calls CLI commands and displays results
const { execSync } = require('child_process');

// Create investigation
const result = execSync(`triage create --ticket 5555 --skill troubleshoot`);
this.updateStatus(result.toString());

// Check status (poll every 2s)
setInterval(() => {
  const status = execSync(`triage status 5555 --json`);
  this.updateSessionDisplay(JSON.parse(status));
}, 2000);

// Tail logs for live updates
const logTail = spawn('tail', ['-f', logFile]);
logTail.stdout.on('data', (data) => {
  this.appendToAgentView(data.toString());
});
```

## Benefits

1. **Observable**: `tail -f` any log file to see what's happening
2. **Debuggable**: Use CLI commands directly to test/reproduce issues
3. **Scriptable**: Can automate investigations from shell scripts
4. **Testable**: CLI commands can be unit tested
5. **Simple TUI**: No complex state management
6. **No tmux**: One less dependency and abstraction layer
7. **Resilient**: Agents are background processes, not tied to terminal

## Migration Strategy

1. **Phase 1**: Build CLI alongside existing TUI (don't break current system)
2. **Phase 2**: Refactor orchestrator to use child_process instead of tmux
3. **Phase 3**: Simplify TUI to use CLI commands
4. **Phase 4**: Deprecate old TUI code once new system works

## Testing Strategy

```bash
# Test CLI commands independently
triage create --ticket 9999 --skill troubleshoot
triage status 9999
triage logs 9999
triage approve 9999 checkpoint_1
triage logs 9999 --agent slack -f  # Follow slack agent log

# Test with real ticket
triage create --ticket 5555 --skill troubleshoot
# Wait for checkpoint
triage approve 5555 checkpoint_1
# Watch logs in separate terminals
tail -f ~/support-triage/logs/5555-main.jsonl
tail -f ~/support-triage/logs/5555-agent-slack.jsonl

# Test TUI
node ui/tui/app.js
# Should display same data as CLI commands
```
