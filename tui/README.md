# Support Triage TUI (Bubbletea)

Clean, professional terminal UI for Support Triage system using Go and Bubbletea.

## Architecture

```
Bubbletea TUI (Go)
       ↓
  Calls CLI commands
       ↓
Node.js CLI (bin/triage)
       ↓
Agent Manager, Database, Logs
```

The TUI is a **thin client** that calls the Node.js CLI and displays the results.

## Features

- ✅ List all investigations with status indicators
- ✅ Real-time status updates (refresh with 'r')
- ✅ C1 design system (clean, professional colors)
- ✅ Keyboard navigation
- 🚧 Detail view (coming next)
- 🚧 Log streaming (coming next)

## Build & Run

```bash
# Build
cd tui
go build -o triage-tui main.go

# Run
./triage-tui
```

## Keyboard Shortcuts

- `↑/↓` or `j/k` - Navigate list
- `enter` - Select investigation (detail view)
- `r` - Refresh investigations list
- `/` - Search/filter
- `q` or `ctrl+c` - Quit

## Design System (C1 Colors)

Follows ConductorOne brand guidelines:

- **Primary**: #6366F1 (indigo)
- **Text**: #111827 (dark gray)
- **Borders**: #E5E7EB (subtle gray)
- **Status Colors**:
  - 🟡 Running: #F59E0B (amber)
  - 🔵 Waiting: #3B82F6 (blue)
  - 🟢 Completed: #10B981 (green)
  - 🔴 Error: #EF4444 (red)

Clean, minimal, professional - no rainbow colors.

## How It Works

### 1. List View (Current)

Calls: `triage list --json`
Displays investigations in a scrollable list with:
- Status icon (🟡🔵🟢🔴)
- Investigation ID
- Customer name
- Classification
- Priority
- Status

### 2. Detail View (Next)

Calls: `triage status <id> --json`
Shows:
- Full investigation details
- Agent statuses
- Checkpoint information
- Log file paths
- Next actions

### 3. Log View (Next)

Calls: `triage logs <id> -f`
Streams logs in real-time with:
- Auto-scrolling
- Colored by log level
- Filterable by agent

## Development

### Add New Views

1. Create view struct with `tea.Model` interface
2. Add state to main model
3. Handle keyboard navigation
4. Call CLI command and parse JSON
5. Style with Lipgloss (C1 colors)

### Style Guidelines

- Use C1 color variables (c1Primary, textPrimary, etc.)
- Minimal borders (only where needed for clarity)
- Generous padding and whitespace
- Bold for emphasis, not color
- Status indicators for at-a-glance info

## Next Steps

- [ ] Detail view with investigation info
- [ ] Agent status panel
- [ ] Log streaming view
- [ ] Approve checkpoint from TUI
- [ ] Split pane layout (list + detail)
- [ ] Keyboard shortcuts for common actions
