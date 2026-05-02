# TUI Testing Guide

## Quick Start

### Running the TUI

```bash
cd ~/support-triage/ui
node tui/app.js --ticket 8484 --customer "acme.com" --context "Testing the flow"
```

### View Real-Time Logs

In a separate terminal:

```bash
cd ~/support-triage/ui
./tui/view-logs.sh
```

This will tail the latest log file and pretty-print JSON entries.

### Test Investigation Creation

Run the standalone test script:

```bash
cd ~/support-triage/ui
./tui/test-investigation-creation.js
```

This tests the database adapter and investigation creation logic without launching the full TUI.

## Command-Line Arguments

| Argument | Required | Description | Example |
|----------|----------|-------------|---------|
| `--ticket` | No | Ticket number (just numbers) | `--ticket 8484` |
| `--customer` | No | Customer name | `--customer "acme.com"` |
| `--context` | No | Extra context for agents | `--context "Auth issue after deploy"` |

**Note:** If `--ticket` is not provided, the TUI will show the "New Session" modal (currently using skip version for testing).

## What Was Fixed (Session 2026-02-11)

### Issue: Investigation Creation Returning Null

**Problem:** The `createInvestigation()` API call was returning `null` in some cases, causing the TUI to think the investigation failed. However, server logs showed investigations WERE being created successfully.

**Root Cause:** The API was returning a different response format than expected:
- Expected: Investigation object directly
- Actual: `{ success: true, id: 3089, status: 'running', message: '...', investigationDir: '...' }`

**Fix Applied:**
1. Updated `app.js` to properly parse the API response format
2. Extract the investigation ID from `result.id` when `result.success === true`
3. Added fallback logic: if the API returns null or fails, check if the investigation exists by querying all investigations
4. Fixed variable naming to avoid confusion (renamed `investigation` variable to `investigationForTmux` in the tmux launch block)

**Files Modified:**
- `ui/tui/app.js` (lines 336-378)

### Testing the Fix

Run the test script:

```bash
cd ~/support-triage/ui
./tui/test-investigation-creation.js
```

**Expected Output:**

```
Testing investigation creation...

Test 1: Creating investigation with ticketId: 3099
Create result: {
  success: true,
  id: 3099,
  status: 'running',
  message: 'Investigation #3099 created. Fetching ticket data...',
  investigationDir: '/Users/jacobaguon/support-triage/investigations/3099'
}
✅ Create returned valid result: { ... }

Test 3: Using investigation ID 3099 for session creation
Session would be created with: { ... }
✅ Can proceed with session creation
```

## Known Limitations

1. **Modal Input Not Working** — Blessed textbox widgets have conflicts with global key bindings. Currently using CLI arguments as a workaround. The modal version is in `components/new-session-modal-skip.js` which auto-generates test data.

2. **TUI Must Run in Foreground** — The TUI is an interactive blessed app and needs a terminal to render. Cannot run in background with `&`.

3. **Ticket Format** — Tickets should be just numbers (e.g., "8484") or with `#` prefix (e.g., "#8484"). No other prefixes.

## Next Steps

Once investigation creation is confirmed working end-to-end:
- [ ] Verify tmux session spawning works correctly
- [ ] Test agent status polling
- [ ] Test checkpoint approval system
- [ ] Test summary and response aggregation tabs
- [ ] Complete Phase 2 of the implementation plan
