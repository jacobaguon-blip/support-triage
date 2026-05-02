# Support Triage System — Issue & Feature Tracker

_Last updated: 2026-02-13_

## Bugs / Issues

| ID | Title | Severity | Status | Notes |
|----|-------|----------|--------|-------|
| B-01 | MCP tools silently denied for multi-agent system | High | **Fixed** | Root cause: `defaultMode: "dontAsk"` + missing tools in allow list. Fix: `--allowedTools` flag + preflight auto-grant (`agent-permissions.js`) |
| B-02 | Linear not in `enabledMcpjsonServers` | High | **Fixed** | Added `"linear"` to `.claude/settings.local.json` |
| B-03 | Pressing 'a' to approve checkpoint did nothing | High | **Fixed** | Investigation list was stale — `hasCheckpoint()` checked old status. Fix: tick handler reloads investigations list |
| B-04 | No visible prompt for checkpoints 2-4 | Medium | **Fixed** | Only CP1 had a review card. Added checkpoint banners with descriptions and command hints for CP2-4 |
| B-05 | TUI flashing black every 2 seconds | Medium | **Mitigated** | Caused by `loadInvestigationsCmd()` firing every tick. Fix: only reload when active investigations exist, skip redundant data loads. May still flash occasionally in ttyd |
| B-06 | Linear agent can't access Linear MCP tools at runtime | Medium | **Open** | `--allowedTools` granted correctly, server is in `mcp.json`, but `@linear/mcp-server` may fail to start as subprocess. Needs investigation into MCP server startup in `claude -p` |
| B-07 | Slack bot not a member of relevant channels | Low | **Open** | Slack MCP tools work but bot can't read `#product`, `#bug-question-mark`. Workspace admin needs to add bot to channels |
| B-08 | Slack MCP server not configured in `mcp.json` | Low | **Open** | No Slack entry in `~/.claude/mcp.json` — needs API token. Preflight correctly skips Slack agent |
| B-09 | Debounce auto-trigger bypassed human approval | Medium | **Fixed** | `evaluateAndTrigger()` was auto-creating runs and calling Phase 0. Changed to set `has_new_reply` flag for TSE decision |

## Features Implemented (This Session)

| ID | Title | Files Changed | Commit |
|----|-------|---------------|--------|
| F-01 | Agent permission preflight + auto-grant | `ui/agent-permissions.js` (new), `ui/server.js`, `ui/investigation-runner.js`, `.claude/settings.local.json` | `e3f08b6` |
| F-02 | `--allowedTools` flag for `claude -p` subprocesses | `ui/investigation-runner.js` | `e3f08b6` |
| F-03 | Permission API endpoints (status, grant, fix-all) | `ui/server.js` | `e3f08b6` |
| F-04 | Manual reset with context (Shift+R) | `tui/main.go`, `tui/view.go`, `tui/commands.go`, `tui/messages.go`, `tui/model.go` | `e3f08b6` |
| F-05 | Customer reply detection → TSE prompt | `ui/debounce-manager.js`, `ui/server.js`, `tui/*` | `e3f08b6` |
| F-06 | Investigation info bar (Run #N + contextual commands) | `tui/view.go` | `742a2eb` |
| F-07 | Checkpoint review banners for CP2-4 | `tui/view.go`, `tui/main.go` | `37d6cd6` |
| F-08 | Sidebar meta: checkpoint + run number | `tui/view.go` | `742a2eb` |
| F-09 | New API endpoints: approve-new-run, dismiss-reply | `ui/server.js` | `e3f08b6` |
| F-10 | `has_new_reply` / `new_reply_summary` DB columns | `ui/server.js` | `e3f08b6` |

## Backlog / Planned

| ID | Title | Priority | Category | Notes |
|----|-------|----------|----------|-------|
| P-01 | Three-column layout redesign (React web UI) | Medium | UI | Classification in right details pane, workflow in center. Spec in CLAUDE.md |
| P-02 | Real-time Pylon webhook for reply detection | Low | Backend | Currently polling every 60s. Webhook would be instant |
| P-03 | Surface reset/reply features in React web UI | Medium | UI | TUI has these but web UI does not |
| P-04 | Fix Linear MCP server startup in subprocesses | High | Backend | B-06 — agents can't use Linear tools despite correct config |
| P-05 | Add Slack bot to relevant workspace channels | Low | Config | B-07 — workspace admin task |
| P-06 | Configure Slack MCP server | Medium | Config | B-08 — needs API token in `~/.claude/mcp.json` |
| P-07 | Phase 2 timeout / retry handling | Low | Backend | Phase 2 can take 2+ minutes, no progress indicator in TUI |
| P-08 | TUI: scroll checkpoint banner into view on state change | Low | TUI | Banner appears but user might be scrolled down in findings |
| P-09 | TUI: show "Phase running..." indicator during Phase 0/1/2 | Low | TUI | Currently just shows yellow dot, no phase-specific info |
| P-10 | KB Article tab (Tab 6) | Low | TUI | Disabled in code, marked as V2 feature |
