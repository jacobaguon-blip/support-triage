# Fix: Claude CLI Authentication Error Handling

## Summary
Implemented better error handling for Claude CLI authentication failures when starting investigations. The system now detects auth errors specifically and provides clear, actionable guidance to users.

## Changes Made

### 1. investigation-runner.js

**Detection in `runClaude()` function** (lines 223-240):
- Added auth error detection by checking stdout/stderr for "Not logged in" or "Please run /login"
- Reject with specific `CLAUDE_AUTH_ERROR:` prefix for easy identification
- Write clear activity log message: "Claude CLI authentication expired. Run 'claude /login' in your terminal, then reset this investigation."

**Better error surfacing in `runPhase0()`** (lines 378-394):
- Check if error is auth-specific using `CLAUDE_AUTH_ERROR` prefix
- Update investigation status to 'error' with auth-specific message stored in snapshot
- Provide actionable guidance in activity log

### 2. server.js

**Added health-check endpoint** `GET /api/health/claude` (lines 1024-1091):
- Runs a quick authentication test by spawning `claude -p --output-format text`
- Returns `{ authenticated: true/false, message: ... }`
- Detects "Not logged in" or "Please run /login" in output
- Times out after 10 seconds to prevent hanging
- Handles all error cases gracefully

**Route ordering:**
- Placed `/api/health/claude` BEFORE `/api/health` to ensure correct Express routing
- More specific routes must be defined before less specific ones

## Testing

All tests passing:
- ✅ Server starts successfully (`npm run build` passes)
- ✅ `/api/health` endpoint works
- ✅ `/api/health/claude` endpoint works and correctly detects authentication status
- ✅ Auth error messages are clear and actionable

## Usage

**For the UI:**
```javascript
// Check authentication before starting an investigation
const response = await fetch('http://localhost:3001/api/health/claude')
const { authenticated, message } = await response.json()

if (!authenticated) {
  alert(message) // "Claude CLI is not authenticated. Run 'claude /login' to authenticate."
}
```

**Activity log output when auth fails:**
```
Claude CLI authentication expired. Run 'claude /login' in your terminal, then reset this investigation.
```

**Investigation status on auth failure:**
- status: 'error'
- snapshot contains: `{ error: "Claude CLI authentication expired...", error_type: "auth" }`

## Files Modified

- `ui/investigation-runner.js` — Auth detection in runClaude() and runPhase0()
- `ui/server.js` — Health check endpoint + spawn import

## Next Steps

Consider adding:
1. UI warning banner when `/api/health/claude` returns `authenticated: false`
2. Automatic health check on app startup
3. Retry button in UI that runs health check before retrying investigation
