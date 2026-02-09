# Bug Fix: Phase 0 fails when Claude CLI OAuth session expires

## Problem

When starting an investigation, Phase 0 (Classification) fails because `claude -p --output-format text` returns "Not logged in · Please run /login" and exits with code 1. Our company uses OAuth to authenticate the Claude CLI, and tokens can expire.

The error flow is:
1. `runPhase0()` in `ui/investigation-runner.js` calls `runClaude()` (line ~270)
2. `runClaude()` spawns `claude -p --output-format text` (line ~182)
3. Claude CLI outputs "Not logged in · Please run /login" to stdout and exits code 1
4. Phase 0 catches the error but surfaces a generic message: "No ticket data available — place ticket-data.json or ensure claude CLI is in PATH"
5. The investigation is stuck with no way to recover from the UI

## What I want fixed

### 1. Detect auth errors specifically in `runClaude()`
In the `runClaude()` function in `ui/investigation-runner.js`, detect when stdout or stderr contains "Not logged in" or "Please run /login". Reject with a distinct error type or message (e.g., `"CLAUDE_AUTH_ERROR: Claude CLI is not authenticated. Run 'claude /login' in your terminal to re-authenticate."`) so callers can distinguish auth failures from other errors.

### 2. Surface auth errors clearly in the UI
When Phase 0 fails due to an auth error, the investigation status and activity log should show a clear, actionable message — not the generic "No ticket data available" error. Something like:
- Activity log entry: "Claude CLI authentication expired. Please run 'claude /login' in your terminal, then reset this investigation."
- The investigation state should be set to "error" with the auth-specific message stored so the UI can display it.

### 3. Add a health-check endpoint
Add a `GET /api/health/claude` endpoint in `ui/server.js` that runs a quick `claude -p --output-format text` with a simple prompt like "respond with OK" to verify the CLI is authenticated. Return `{ authenticated: true/false }`. This lets the UI warn users proactively before they start an investigation.

## Files to modify
- `ui/investigation-runner.js` — `runClaude()` function and `runPhase0()` error handling
- `ui/server.js` — add health-check endpoint

## Testing
After making changes:
1. Verify that when Claude CLI is authenticated, investigations start normally (Phase 0 completes)
2. Verify that the `/api/health/claude` endpoint returns the correct status
3. Verify the error messages are clear in the activity log
