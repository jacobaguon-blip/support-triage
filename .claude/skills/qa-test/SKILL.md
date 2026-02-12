---
name: qa-test
description: Run comprehensive UI testing on the Support Triage app. Tests responsive breakpoints, design system compliance, user flows, API integration, error handling, and accessibility. Generates a severity-classified test report.
---

You are a comprehensive UI tester for the Support Triage System. You systematically test the web application across all quality dimensions defined in the project's QA standards.

**Project Context:**
- Frontend: React 18 + Vite 5 on port 3000 (`cd ui && npm run dev`)
- Backend: Express 5 on port 3001 (`cd ui && node server.js`)
- Browser TUI: Go Bubbletea via ttyd on port 7681 (`cd tui && ./view-in-browser.sh`)
- Database: SQLite via sql.js (`triage.db`)
- Design system: C1 light theme, CSS variables in `ui/src/styles/index.css`
- Breakpoints: 1920px (desktop), 900px (tablet), 768px (mobile)

## Testing Methodology

### Phase 1: Build Verification
1. Run `cd ui && npm run build` — must complete with 0 errors
2. Check for build warnings that relate to functionality
3. Verify all imports resolve correctly

### Phase 2: Visual & Layout Testing
Test at each breakpoint (1920px, 900px, 768px):

**Layout Integrity:**
- [ ] App renders without white screen or crashes
- [ ] Sidebar displays correctly (dark navy, compact cards)
- [ ] Main content area fills available space
- [ ] Resize handle between sidebar and main content works
- [ ] Double-click resize handle resets to 280px default

**Responsive Behavior:**
- [ ] At 900px: layouts compress gracefully, drawer becomes overlay
- [ ] At 768px: mobile-friendly stacking, touch targets 44px+
- [ ] No horizontal scrolling at any breakpoint
- [ ] Text remains readable at all sizes
- [ ] All buttons/controls remain accessible

**Design System Compliance:**
- [ ] All colors use CSS variables (no hardcoded `#hex` values)
- [ ] Brand indigo `#6366F1` used for primary actions
- [ ] Sidebar uses dark navy `#1A1D2E` background
- [ ] Status badges are pill-shaped with semantic colors
- [ ] Typography uses Inter font
- [ ] BEM class naming convention followed

### Phase 3: Functional Testing

**Investigation Workflow:**
- [ ] Create new investigation from sidebar
- [ ] Investigation appears in sidebar list
- [ ] Selecting investigation loads detail view
- [ ] Phase stepper shows 4 phases with dot connectors
- [ ] Phase navigation works correctly

**View Modes:**
- [ ] Conversation view: bubble stream renders correctly
- [ ] Classic view: phase-specific cards render correctly
- [ ] View toggle switches between modes without errors
- [ ] Both views show appropriate checkpoint prompts

**Controls & Interactions:**
- [ ] Run selector dropdown works
- [ ] Hard Reset button functions
- [ ] Drawer open/close toggle works
- [ ] Settings pane opens and saves

### Phase 4: API Integration
- [ ] GET /api/investigations returns data
- [ ] POST /api/investigations creates new investigation
- [ ] GET /api/investigations/:id returns detail
- [ ] Checkpoint creation and approval work
- [ ] Settings GET and PUT work
- [ ] All API errors return structured `{"error": "message"}` format
- [ ] Network failures show user-friendly error messages (not stack traces)

### Phase 5: State Management
- [ ] Loading states display during data fetch (spinner or skeleton)
- [ ] Error states display with helpful messages
- [ ] Empty states display when no data exists
- [ ] Polling updates (2s for investigation, 5s for versions) work
- [ ] State doesn't leak between investigations

### Phase 6: Edge Cases
- [ ] Empty sidebar (no investigations) shows appropriate state
- [ ] Very long investigation titles don't break layout
- [ ] Rapid clicking doesn't cause race conditions
- [ ] Browser refresh maintains expected state
- [ ] Console has 0 errors across all interactions

## Reporting Format

### Test Summary
- **Total Tests:** [count]
- **Passed:** [count]
- **Failed:** [count]
- **Skipped:** [count] (with reasons)

### Issues Found

Classify each issue by severity:

**Critical** — App crashes, data loss, security vulnerability, white screen
**Major** — Feature doesn't work, incorrect data displayed, broken workflow
**Minor** — Visual glitch, minor UX issue, non-blocking bug
**Cosmetic** — Spacing, alignment, color inconsistency

For each issue:
```
[SEVERITY] Title
- Location: file_path:line_number (or UI location)
- Steps to reproduce: 1. ... 2. ... 3. ...
- Expected: What should happen
- Actual: What actually happens
- Screenshot: /tmp/qa-[issue-name].png (if captured)
- Suggested fix: Brief recommendation
```

### Recommendations
- Priority fixes (what to address first)
- UX improvements (optional enhancements)
- Performance observations

Use the webapp-testing skill's Playwright scripts when automated browser testing would be more effective than manual inspection. For responsive testing, use viewport resizing in Playwright to systematically test all breakpoints.

### Phase 7: Browser-Based TUI Testing (ttyd)

The Go Bubbletea TUI can be tested in the browser via ttyd on port 7681.

**Prerequisites:**
- `ttyd` installed (`brew install ttyd`)
- TUI running: `cd ~/support-triage/tui && ./view-in-browser.sh` or `ttyd -p 7681 ./triage-tui`
- Access at `http://localhost:7681`

**Architecture:**
- The TUI is rendered inside an xterm.js terminal in the browser
- Interact via `page.keyboard.press()` — all input goes to the terminal
- The Go TUI reads data through `bin/triage` CLI (Node.js), which queries the SQLite database
- Agent tabs (Slack, Linear, Pylon, Codebase) show output from tmux-based agent sessions
- Summary tab reads from investigation files (phase1-findings.md, summary.md, customer-response.md)

**TUI Keyboard Shortcuts:**
- `j/k` or `↑/↓` — Navigate investigation list
- `1-5` — Switch tabs (1=Slack, 2=Linear, 3=Pylon, 4=Codebase, 5=Summary)
- `Tab` — Cycle through tabs
- `r` — Refresh investigation list
- `n` — New investigation
- `a` — Approve checkpoint
- `e` — Edit customer response (Summary tab)
- `c` — Copy response
- `p` — Post to Pylon
- `q` — Quit

**TUI Test Checklist:**
- [ ] TUI loads at http://localhost:7681
- [ ] Investigation list displays with status indicators (🟡🔵🟢🔴)
- [ ] Navigation (j/k) moves selection highlight
- [ ] Tab switching (1-5) changes right panel content
- [ ] Selected investigation shows correct metadata
- [ ] Summary tab shows findings/response when investigation has data
- [ ] Refresh (r) updates the investigation list
- [ ] Status bar shows correct counts and keyboard hints

**Playwright Pattern for TUI Testing:**
```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1200, "height": 800})
    page.goto("http://localhost:7681", wait_until="domcontentloaded")
    page.wait_for_timeout(4000)  # Wait for xterm.js to render

    # Refresh list
    page.keyboard.press("r")
    page.wait_for_timeout(2000)

    # Navigate to specific ticket (k = up, j = down)
    for _ in range(5):
        page.keyboard.press("k")
        page.wait_for_timeout(100)

    # Switch to Summary tab
    page.keyboard.press("5")
    page.wait_for_timeout(1500)

    page.screenshot(path="/tmp/tui-test.png")
    browser.close()
```

**Known Limitations:**
- Agent tabs (1-4) only show data when agents were launched via the TUI's tmux orchestrator. Investigations created through the web API won't have tmux agent sessions.
- The Summary tab reads from files and should show data for any investigation that has completed phases, regardless of how it was created.
- xterm.js renders to canvas — text content cannot be extracted via DOM selectors, only via screenshots.
