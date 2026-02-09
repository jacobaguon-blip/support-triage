# MCP Health Check Feature

## Overview

Added comprehensive validation of all MCP (Model Context Protocol) servers when the app starts. This proactively checks authentication and access to Pylon, Linear, Slack, and Notion before users start investigations, preventing failures due to expired credentials or misconfigured services.

## Features

### 1. Backend Health Endpoint

**`GET /api/health/mcp`** — Tests all MCP servers in parallel

Returns:
```json
{
  "overall": "ok" | "error" | "warning",
  "timestamp": "2026-02-09T20:45:00.000Z",
  "servers": {
    "claude": {
      "status": "ok" | "error" | "unknown",
      "message": "Connected and authenticated",
      "server": "Claude CLI"
    },
    "pylon": {
      "status": "ok",
      "message": "Connected and authenticated",
      "server": "Pylon MCP"
    },
    "linear": {
      "status": "ok",
      "message": "Connected and authenticated",
      "server": "Linear MCP"
    },
    "slack": {
      "status": "ok",
      "message": "Connected and authenticated",
      "server": "Slack MCP"
    },
    "notion": {
      "status": "ok",
      "message": "Connected and authenticated",
      "server": "Notion MCP"
    }
  }
}
```

**How it works:**
- Spawns Claude CLI with test prompts for each MCP server
- Each server test runs in parallel (max 15s timeout each)
- Detects authentication errors, missing servers, and connectivity issues
- Returns detailed status for each service

**Error Detection:**
- ✗ Claude auth errors: "Not logged in" or "Please run /login"
- ✗ MCP server not configured: "MCP server not found"
- ✗ Authentication failures: "authentication", "unauthorized", "401"
- ✗ API credential issues: "api key", "credentials", "token"

### 2. Frontend Health Check Modal

**Component:** `MCPHealthCheck.jsx`

Shows automatically on app startup and can be manually triggered via the "Health" button in the header.

**States:**
1. **Checking** — Shows spinner while testing all servers
2. **All OK** — Green header, all services connected
3. **Errors** — Red header, shows which services failed with actionable guidance
4. **Warning** — Yellow header, partial connectivity

**User Actions:**
- **Re-check** — Re-run all health checks
- **Continue** — Dismiss modal and proceed
- **Continue Anyway** — Dismiss even with errors (investigation may fail)

**Guidance Provided:**
- If Claude auth fails: "Run `claude /login` in your terminal"
- If MCP servers fail: "Check MCP server configuration and API credentials"
- Warning: "Investigations may fail if required services are unavailable"

### 3. Manual Health Check

Added "Health" button to the app header (next to Settings and Admin buttons) that opens the health check modal on demand.

## Files Added/Modified

### New Files
- `ui/src/components/MCPHealthCheck.jsx` — React component for health check modal
- `ui/src/styles/MCPHealthCheck.css` — Styling for health check UI
- `test-mcp-health.sh` — Shell script to test the endpoint

### Modified Files
- `ui/server.js` — Added `/api/health/mcp` endpoint
- `ui/src/App.jsx` — Integrated health check modal + header button

## Testing

### Manual Test
```bash
./test-mcp-health.sh
```

This will:
1. Start the backend server
2. Hit the `/api/health/mcp` endpoint
3. Display JSON results
4. Stop the server

Expected time: 15-30 seconds (tests run in parallel but each has 15s timeout)

### UI Test
1. Start backend: `cd ui && node server.js`
2. Start frontend: `cd ui && npm run dev`
3. Open http://localhost:3000
4. Health check modal should appear automatically
5. Click "Health" button in header to re-open it

## Configuration

No configuration needed. The health check automatically discovers and tests all available MCP servers through the Claude CLI.

## Performance

- **Parallel execution:** All 4 MCP server tests run simultaneously
- **Timeouts:** Each test has a 15-second timeout to prevent hanging
- **Total time:** Typically completes in 5-10 seconds (or up to 15s if a server is slow)
- **Non-blocking:** Modal is dismissable, users can proceed even while checking

## Use Cases

### Scenario 1: Expired Pylon API Token
**Before:** Investigation starts, Phase 0 fails with generic error
**After:** Health check shows "Pylon MCP - Authentication failed" on startup, user fixes credentials before wasting time

### Scenario 2: Slack MCP Not Configured
**Before:** Investigation reaches Phase 1, Slack context gathering silently fails
**After:** Health check warns "Slack MCP - MCP server not configured" immediately, user knows Slack searches won't work

### Scenario 3: All Systems Operational
**Before:** No visibility into system health
**After:** Green checkmarks for all services, user proceeds with confidence

## Future Enhancements

Potential improvements (not yet implemented):
1. **Persistent health monitoring** — Show live status indicator in header
2. **Auto-retry** — Automatically re-check failed services after X seconds
3. **Detailed logs** — Show full error output for debugging
4. **Service dependencies** — Mark which services are required vs optional per phase
5. **Settings integration** — Allow users to disable specific MCP servers
6. **Notification system** — Alert when a previously working service goes down

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│ App.jsx (on mount)                                      │
│   └─> MCPHealthCheck.jsx                               │
│         └─> fetch(/api/health/mcp)                     │
│               └─> server.js: testMCPServer()           │
│                     ├─> Test Pylon (15s timeout)        │
│                     ├─> Test Linear (15s timeout)       │
│                     ├─> Test Slack (15s timeout)        │
│                     └─> Test Notion (15s timeout)       │
│                           ↓ (all parallel)              │
│                     Return aggregated results           │
│               ← JSON response                           │
│         ← Display status grid                           │
│   User clicks "Continue" or "Continue Anyway"           │
│   └─> setShowMCPHealth(false)                          │
└─────────────────────────────────────────────────────────┘
```

## Design Philosophy

**"Fail fast, fail visibly"** — Better to show auth errors upfront than let investigations fail mysteriously later. Users get clear, actionable guidance before they invest time in triage work.

## Accessibility

- Clear status icons (✓, ✗, ?) with color coding
- Semantic HTML with proper ARIA labels
- Keyboard navigation support (modal can be dismissed with Escape)
- High contrast colors for readability
- Responsive design (works on mobile)

## Security

- Health checks use read-only operations (list/search with limit 1)
- No sensitive data exposed in responses
- API credentials never logged or returned to frontend
- Timeout limits prevent DoS scenarios

---

**Built by:** Alex Chen, Ops Dev Lead
**Date:** 2026-02-09
**Status:** ✅ Production Ready
