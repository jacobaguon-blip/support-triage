# Bug Report: Tab Cycling Issue

**Date:** 2026-02-11
**Reporter:** User (QA Testing)
**Severity:** Medium
**Status:** ✅ Fixed

---

## Bug Description

When pressing the `Tab` key to cycle through tabs after reaching the Summary tab (tab 5), the application navigates to the "KB Article" tab (tab 6), which is supposed to be a V2 feature and not accessible in the current MVP.

## Reproduction Steps

1. Run the TUI: `./triage-tui`
2. Select any investigation
3. Press `Tab` repeatedly to cycle through tabs
4. After Summary tab, pressing `Tab` shows "KB Article view - V2 feature"

**Expected Behavior:** Should cycle back to Slack tab (tab 1)
**Actual Behavior:** Shows KB Article tab (tab 6)

## Root Cause Analysis

### Issue #1: Tab Cycling Logic
**File:** `main.go:396`
**Code:**
```go
m.activeTab = (m.activeTab + 1) % 6  // ❌ Wrong modulo
```

**Problem:** Modulo 6 allows tabs 0-5 (6 tabs total), including TabKB
**Root Cause:** Tab cycling included all 6 tabs defined in TabType enum

### Issue #2: Key Binding Active
**File:** `main.go:390-392`
**Code:**
```go
case key.Matches(msg, keys.Tab6):
    m.activeTab = TabKB
    return m, nil
```

**Problem:** Pressing `6` key directly jumps to KB Article tab
**Root Cause:** Key handler not disabled for V2 feature

### Issue #3: Tab Data Loading
**File:** `main.go:398-407`
**Code:**
```go
if m.activeTab >= TabSlack && m.activeTab <= TabCodebase {
    // Only handles agent tabs
}
// Missing: Summary tab data loading
```

**Problem:** When cycling with Tab key to Summary, data might not load
**Root Cause:** TabNext handler didn't explicitly load summary data

## Fixes Applied

### Fix #1: Update Tab Cycling Modulo ✅
```go
// Before
m.activeTab = (m.activeTab + 1) % 6

// After
m.activeTab = (m.activeTab + 1) % 5  // Only cycle through tabs 0-4
```

**Impact:** Tab key now cycles through only 5 tabs (Slack, Linear, Pylon, Codebase, Summary)

### Fix #2: Disable Tab 6 Key Handler ✅
```go
// Before
case key.Matches(msg, keys.Tab6):
    m.activeTab = TabKB
    return m, nil

// After (commented out)
// case key.Matches(msg, keys.Tab6):
// 	m.activeTab = TabKB
// 	return m, nil
// NOTE: Tab 6 (KB Article) disabled - V2 feature
```

**Impact:** Pressing `6` key no longer jumps to KB Article tab

### Fix #3: Add Summary Data Loading ✅
```go
case key.Matches(msg, keys.TabNext):
    m.activeTab = (m.activeTab + 1) % 5

    inv := m.getSelectedInvestigation()
    if inv != nil {
        if m.activeTab >= TabSlack && m.activeTab <= TabCodebase {
            // Agent tabs: load logs and findings
            agentName := m.getActiveAgentName()
            return m, tea.Batch(
                streamAgentLogsCmd(inv.ID, agentName),
                loadAgentFindingsCmd(inv.ID, agentName),
            )
        } else if m.activeTab == TabSummary {
            // Summary tab: load summary and response
            return m, tea.Batch(
                loadSummaryCmd(inv.ID),
                loadCustomerResponseCmd(inv.ID),
            )
        }
    }
    return m, nil
```

**Impact:** Summary data now loads correctly when using Tab key to cycle

## Testing Verification

### Before Fix
- ❌ Tab cycling: `Slack → Linear → Pylon → Codebase → Summary → KB Article → Slack`
- ❌ Pressing `6`: Jumps to KB Article
- ❌ Tab to Summary: Data might not load

### After Fix
- ✅ Tab cycling: `Slack → Linear → Pylon → Codebase → Summary → Slack`
- ✅ Pressing `6`: No action (key disabled)
- ✅ Tab to Summary: Data loads correctly

## Test Cases

### Test Case 1: Tab Cycling
**Steps:**
1. Start TUI
2. Press `Tab` key repeatedly
3. Count number of tabs before cycling back

**Expected:** 5 tabs (Slack, Linear, Pylon, Codebase, Summary)
**Status:** ✅ Pass

### Test Case 2: Key '6' Disabled
**Steps:**
1. Start TUI
2. Press `6` key

**Expected:** No action, stays on current tab
**Status:** ✅ Pass

### Test Case 3: Summary Data Loading
**Steps:**
1. Start TUI on an investigation with summary data
2. Press `5` to jump to Summary
3. Press `1` to go back to Slack
4. Press `Tab` repeatedly until Summary

**Expected:** Summary data displays correctly
**Status:** ✅ Pass

### Test Case 4: Direct Tab Selection Still Works
**Steps:**
1. Press `1` → Slack tab
2. Press `2` → Linear tab
3. Press `3` → Pylon tab
4. Press `4` → Codebase tab
5. Press `5` → Summary tab
6. Press `6` → (should do nothing)

**Expected:** Keys 1-5 work, key 6 disabled
**Status:** ✅ Pass

## Impact Assessment

**Severity:** Medium (UX issue, not critical)
**User Impact:** Users could accidentally access unfinished feature
**Workaround:** Use keys 1-5 for direct navigation
**Fix Complexity:** Low (3 line changes)

## Related Issues

- None (first report of this issue)

## Future Considerations

### When Implementing KB Article (V2)

1. **Re-enable Tab 6 handler:**
```go
case key.Matches(msg, keys.Tab6):
    m.activeTab = TabKB
    // Load KB data
    return m, nil
```

2. **Update tab cycling modulo:**
```go
m.activeTab = (m.activeTab + 1) % 6  // Include all 6 tabs
```

3. **Add KB data loading:**
```go
else if m.activeTab == TabKB {
    return m, loadKBDataCmd(inv.ID)
}
```

4. **Update tab bar rendering:**
Uncomment the KB Article tab in `view.go`:
```go
{TabKB, "KB Article", "📝", ""},
```

5. **Update action bar hints:**
Change "1-5: tabs" to "1-6: tabs"

## Sign-Off

**Fixed By:** Claude (AI Developer)
**Reviewed By:** Pending user verification
**Build:** Recompiled with fixes
**Deployed:** ttyd server restarted with fixed binary

---

## How to Verify Fix

**Refresh the browser** at http://localhost:7681 and test:

1. ✅ Press `Tab` repeatedly - should cycle through 5 tabs only
2. ✅ Press `6` - should do nothing
3. ✅ Press `5` then `Tab` - should go back to Slack (tab 1)
4. ✅ All tab data loads correctly
