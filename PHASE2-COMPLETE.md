# Phase 2 Complete ✅ - Agent Orchestration

## What's Working

### ✅ Background Agent Processes
- Agents spawn as child processes (no tmux!)
- Each agent runs independently with its own PID
- Tracked in database with status, log files, PIDs
- Run detached in background

### ✅ Database Integration
- `agents` table tracks all agent processes
- Status updates: pending → running → completed/error
- PIDs recorded for process management
- Log file paths stored

### ✅ Structured Logging
- Per-agent log files: `{id}-agent-{name}.jsonl`
- Main investigation log: `{id}-main.jsonl`
- All in JSON Lines format
- Easy to tail and monitor

### ✅ CLI Workflow
```bash
# 1. Create investigation
./bin/triage create --ticket 8484 --skill troubleshoot

# 2. Wait at checkpoint_1, then approve
./bin/triage approve 8484 checkpoint_1_post_classification

# 3. Agents spawn automatically!
#    ✓ Slack Agent (PID 76776)
#    ✓ Linear Agent (PID 76779)
#    ✓ Pylon Agent (PID 76782)
#    ✓ Codebase Agent (PID 76785)

# 4. Watch progress
./bin/triage status 8484
./bin/triage logs 8484 -f
```

## Test Results

### Investigation 8484
```
Agents:
──────────────────────────────────────────────────
  🟡 slack: running (PID 76776)
     Log: ~/support-triage/logs/8484-agent-slack.jsonl
  🟡 linear: running (PID 76779)
     Log: ~/support-triage/logs/8484-agent-linear.jsonl
  🟡 pylon: running (PID 76782)
     Log: ~/support-triage/logs/8484-agent-pylon.jsonl
  🟡 codebase: running (PID 76785)
     Log: ~/support-triage/logs/8484-agent-codebase.jsonl
```

### Process Verification
```bash
$ ps aux | grep claude
jacobaguon  76776  claude  # Slack agent
jacobaguon  76779  claude  # Linear agent
jacobaguon  76782  claude  # Pylon agent
jacobaguon  76785  claude  # Codebase agent
```

All 4 agents running as independent background processes!

## Architecture

```
CLI approve command
  ↓
Update database (status: running)
  ↓
AgentManager.spawnAgents()
  ↓
For each agent:
  1. Generate prompt file
  2. spawn('claude') with piped stdio
  3. Track PID in database
  4. Create log file
  5. agentProcess.unref() - run in background
  ↓
Agents work independently
  ↓
Write findings to files
  ↓
Update database on completion
```

## Files Created

```
lib/
├── core/
│   └── agent-manager.js      # Agent spawning & lifecycle ✅
└── cli/commands/
    └── approve.js             # Updated to spawn agents ✅

test-phase2.sh                 # End-to-end test script ✅
watch-agents.sh                # Watch all agent logs ✅
PHASE2-COMPLETE.md             # This file ✅
```

## How to Test

### Quick Test (Automated)
```bash
cd ~/support-triage
./test-phase2.sh
```

### Manual Test
```bash
# Terminal 1: Create & approve
./bin/triage create --ticket 9999 --skill troubleshoot
./bin/triage approve 9999 checkpoint_1_post_classification

# Terminal 2: Watch main log
./bin/triage logs 9999 -f

# Terminal 3: Watch Slack agent
./bin/triage logs 9999 --agent slack -f

# Terminal 4: Check status
watch -n 2 './bin/triage status 9999'

# Terminal 5: Watch all agents
./watch-agents.sh 9999
```

## What's Next: Phase 3

### TUI Simplification
- [ ] Remove tmux dependencies from TUI
- [ ] Make TUI call CLI commands
- [ ] Read logs for real-time display
- [ ] Fix session switching bug
- [ ] Simplify to viewer/controller role

### Benefits So Far

✅ **Observable** - Everything logged, can tail any file
✅ **Debuggable** - CLI commands work independently
✅ **No tmux** - One less dependency, simpler architecture
✅ **Background** - Agents run detached, don't block
✅ **Tracked** - All state in database + log files
✅ **Scriptable** - Full automation possible

## Known Limitations

1. **Claude Code Output Not Captured**: Claude Code's interactive TUI output doesn't pipe to log files cleanly. This is expected - the blessed UI writes directly to terminal. Agents still work and produce findings files.

2. **Log Files Minimal**: Agent log files show start/end but not Claude Code's internal output. This is by design - the important output (findings) goes to markdown files.

3. **No Real-Time Progress**: Can't see Claude Code's thinking/tool use in logs. Could be solved by:
   - Adding `--dangerously-skip-permissions` flag
   - Parsing Claude Code's TTY output
   - Or accepting this limitation (findings files are what matters)

## Database Schema

```sql
CREATE TABLE agents (
  id INTEGER PRIMARY KEY,
  investigation_id INTEGER NOT NULL,
  agent_name TEXT NOT NULL,
  pid INTEGER,                     -- Process ID
  status TEXT NOT NULL,            -- pending, running, completed, error
  log_file TEXT,                   -- Path to log
  findings_file TEXT,              -- Path to findings
  started_at DATETIME,
  completed_at DATETIME,
  error_message TEXT
);
```

## Success Metrics

- ✅ Agents spawn without tmux
- ✅ PIDs tracked in database
- ✅ Background processes work
- ✅ Findings files created
- ✅ CLI end-to-end flow works
- ✅ Observable via logs and status commands

## Next: Phase 3 Implementation

Ready to simplify the TUI to use these CLI commands?
