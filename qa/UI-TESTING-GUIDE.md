# UI Testing Guide

Comprehensive guide for testing the Support Triage frontend UI.

## Starting the Dev Environment

### Prerequisites

- Node.js 18+ installed
- Project dependencies installed (`npm install` run in both root and ui directories)
- Port 3000 (backend) and 5173 (frontend) available

### Start Backend Server

```bash
cd /path/to/support-triage
npm install
node server.js
```

Expected output: `Server running on http://localhost:3000`

### Start Frontend Dev Server

In a new terminal:

```bash
cd /path/to/support-triage/ui
npm install
npm run dev
```

Expected output: `➜ Local: http://localhost:5173/`

### Access the Application

Open http://localhost:5173 in your browser. You should see the Support Triage interface.

## Key URLs and Endpoints

| Page | URL | Purpose |
|------|-----|---------|
| Home | http://localhost:5173/ | Main investigation list |
| New Investigation | http://localhost:5173/ (New button) | Create investigation with ticket ID |
| Investigation Detail | http://localhost:5173/#/investigation/:id | View single investigation |
| Settings | http://localhost:5173/#/settings | Application settings |

## Common Test Scenarios

### Scenario 1: Create Investigation

**Goal:** Verify user can create a new investigation with a ticket ID

**Steps:**

1. Open http://localhost:5173/
2. Click "New Investigation" button
3. Enter a ticket ID (e.g., `TICKET-001`)
4. Click "Create"
5. Verify redirect to investigation detail page
6. Verify investigation appears in list

**Expected Results:**

- [ ] Form validates (error if ticket ID missing)
- [ ] Investigation creates successfully
- [ ] Investigation detail page loads
- [ ] Back to home, investigation visible in list
- [ ] No console errors

**Browser Checks:**

- Open DevTools Console (F12 → Console tab)
- Check for red error messages
- Verify API call: POST /api/investigations in Network tab

---

### Scenario 2: Navigate Investigation Phases

**Goal:** Verify user can move through investigation phases

**Prerequisites:** Investigation created from Scenario 1

**Steps:**

1. Open investigation detail page
2. Identify current phase indicator (usually "Phase 1" or "New")
3. Click "Next Phase" or similar button
4. Verify phase advances
5. Click "Next Phase" again if multiple phases exist
6. Verify cannot go beyond final phase

**Expected Results:**

- [ ] Phase counter updates visibly
- [ ] Phase name/description changes
- [ ] Navigation buttons enable/disable appropriately
- [ ] Previous phase data preserved
- [ ] No console errors

**Browser Checks:**

- Network tab: Verify PATCH or POST request to update phase
- Console: No errors
- Elements: Verify CSS classes update (e.g., `phase--active`)

---

### Scenario 3: Checkpoint Approval Flow

**Goal:** Verify checkpoint creation and approval workflow

**Prerequisites:** Investigation in a phase with checkpoint feature

**Steps:**

1. In investigation detail, locate checkpoint section
2. Click "Create Checkpoint" button
3. (If form appears) Fill in checkpoint details
4. Click "Save Checkpoint"
5. Verify checkpoint appears in list
6. Click "Approve" on checkpoint
7. Verify checkpoint marked as approved
8. Verify approval status persists on reload

**Expected Results:**

- [ ] Checkpoint created with timestamp
- [ ] Checkpoint displays in reverse-chronological order
- [ ] Approve button toggles to "Approved" state
- [ ] Approved state persists after page reload
- [ ] All states have clear visual indicators
- [ ] No console errors

**CSS Verification:**

- Approved state uses C1 success color (var(--c1-success))
- Pending state uses C1 warning color (var(--c1-warning))

---

### Scenario 4: Hard Reset

**Goal:** Verify hard reset clears investigation data

**Prerequisites:** Investigation with data (files, checkpoints, phase progress)

**Steps:**

1. In investigation detail, find Settings or More Options menu
2. Click "Hard Reset" or "Reset Investigation"
3. Verify confirmation dialog appears
4. Click "Confirm Reset"
5. Verify investigation state resets to initial phase
6. Verify all checkpoint/file data cleared
7. Verify on page reload, reset persists

**Expected Results:**

- [ ] Confirmation dialog appears (prevents accidental reset)
- [ ] Phase resets to "Phase 1" or initial state
- [ ] Checkpoint list becomes empty
- [ ] File list becomes empty
- [ ] Reset persists across page reloads
- [ ] No console errors

**Error Cases:**

- [ ] Attempting reset without confirmation: nothing happens
- [ ] Reset with network error: error message shown, data not cleared

---

### Scenario 5: View Modes (Conversation vs Classic)

**Goal:** Verify investigation can display in different view modes

**Prerequisites:** Investigation with conversation/classic data

**Steps:**

1. Open investigation detail
2. Locate view mode toggle (usually in header or settings)
3. Switch between "Conversation View" and "Classic View"
4. Verify display updates
5. Verify data is same in both views
6. Verify scroll position reasonable in each view
7. Toggle back and forth multiple times

**Expected Results:**

- [ ] View updates immediately when toggled
- [ ] All data visible in both views
- [ ] Layout is responsive in both views
- [ ] View preference persists on reload (if implemented)
- [ ] Conversation view shows chronological order
- [ ] Classic view shows structured sections
- [ ] No console errors

**Responsive Check:**

- Test both view modes at 1024px, 900px, and 768px
- Verify readability at each breakpoint

---

### Scenario 6: Settings Page

**Goal:** Verify settings can be viewed and modified

**Steps:**

1. Navigate to http://localhost:5173/#/settings
2. Verify page loads with current settings
3. Modify a setting (e.g., enable/disable feature)
4. Click "Save" or "Apply"
5. Verify confirmation message
6. Navigate away and return to settings
7. Verify saved setting persists

**Expected Results:**

- [ ] Settings page loads without errors
- [ ] All setting controls are visible
- [ ] Save button is active/clickable
- [ ] Save triggers API request (PUT /api/settings)
- [ ] Success message displays
- [ ] Settings persist across page reloads
- [ ] No console errors

**Network Verification:**

- DevTools Network tab shows PUT request to /api/settings
- Response includes updated settings object

---

## Responsive Breakpoints Testing

Test all scenarios above at each breakpoint using browser DevTools:

### Desktop (1024px) - Default

1. Resize browser: Right-click → Inspect → (Ctrl+Shift+M or View → Toggle Device Toolbar)
2. Set width to 1440px (or wider)
3. Test all scenarios
4. Verify no horizontal scrolling

### Tablet (900px)

1. Use DevTools: Set width to 900px
2. Run through all scenarios
3. Verify touch targets are 44px or larger
4. Check that layout stacks appropriately
5. Verify navigation accessible (hamburger menu if needed)

### Mobile (768px)

1. Use DevTools: Set width to 768px
2. Run through all scenarios
3. Verify single-column layout
4. Verify touch targets 44px+
5. Verify text is readable (min 14px)
6. Verify no horizontal scrolling
7. Test navigation on small screen

**Checklist for Each Breakpoint:**

- [ ] Layout renders without overflow
- [ ] Text readable (no small, cramped text)
- [ ] Buttons/links clickable (44px+ touch targets)
- [ ] Images scale appropriately
- [ ] Forms are usable
- [ ] Navigation accessible
- [ ] No console errors at any breakpoint

## Browser DevTools Tips

### CSS Debugging

1. **Open DevTools:** F12
2. **Elements Tab:** Right-click element → Inspect
3. **Verify CSS Variables:**
   - Inspect element
   - Look for `color: var(--c1-text-primary)` or similar
   - NOT `color: #333` or hardcoded colors
4. **Check BEM Naming:**
   - Class names should follow pattern: `block__element--modifier`
   - Good: `investigation__header`, `investigation__header--active`
   - Bad: `header`, `header1`, `h-active`
5. **Check Responsive Classes:**
   - Look for media query breakpoints
   - Verify appropriate breakpoints: 900px, 768px

### Network Debugging

1. **Open DevTools:** F12
2. **Network Tab:** Click tab, reload page
3. **API Requests:** Look for `/api/*` URLs
4. **Method Verification:** GET/POST/PUT match expected
5. **Response Check:** Click request → Response tab
6. **Status Code:** Should be 2xx for success (3xx redirect OK)
7. **Payload:** Response should be valid JSON with no errors

**Example Request Check:**

```
POST /api/investigations/123/checkpoint
Status: 200 OK
Response: {"id": "cp-456", "investigationId": "123", "createdAt": "..."}
```

### Console Logging

**Check Console Tab:**

- [ ] No red error messages
- [ ] No 404 errors for resources
- [ ] Expected log messages appear
- [ ] No deprecation warnings for React

**Common Issues:**

- `Failed to fetch` = API not running, check backend
- `Cannot read property X of undefined` = Component logic error
- `Missing variable X` = CSS variable not defined

### Performance Check

1. Network Tab: Check response times (ideally < 1s)
2. Performance Tab: Record and check for excessive reflows
3. Memory: Watch for memory growth on repeated actions

## C1 Design Token Verification

Verify all colors use C1 design tokens from `ui/index.css`:

### CSS Variables to Use

**Text Colors:**
- `var(--c1-text-primary)` - Main body text
- `var(--c1-text-secondary)` - Secondary text, muted
- `var(--c1-text-tertiary)` - Very light text
- `var(--c1-text-inverse)` - Text on dark backgrounds

**Semantic Colors:**
- `var(--c1-success)` - Success states (green)
- `var(--c1-warning)` - Warning states (yellow)
- `var(--c1-error)` - Error states (red)
- `var(--c1-info)` - Info states (blue)

**Neutral Colors:**
- `var(--c1-bg-primary)` - Primary background
- `var(--c1-bg-secondary)` - Secondary background
- `var(--c1-border)` - Border color
- `var(--c1-divider)` - Divider color

### How to Verify

1. Open DevTools Inspector (F12)
2. Click element with color
3. In Styles panel, find the rule
4. Look for `color: var(--c1-*)` or `background: var(--c1-*)`
5. If you see `#` color code (e.g., `#333`), that's a violation

**Example - Correct:**
```css
.investigation__title {
  color: var(--c1-text-primary);
  background: var(--c1-bg-primary);
}
```

**Example - Incorrect:**
```css
.investigation__title {
  color: #333;
  background: white;
}
```

## Testing Checklist

Use this checklist for complete UI testing:

- [ ] Build passes: `cd ui && npm run build`
- [ ] No console errors at any breakpoint
- [ ] All API calls succeed (no 5xx errors)
- [ ] Loading states display on data fetch
- [ ] Error states display with helpful messages
- [ ] Empty states display when no data
- [ ] All colors use C1 CSS variables
- [ ] All class names follow BEM convention
- [ ] Responsive at 1024px, 900px, and 768px
- [ ] Touch targets are 44px+ on mobile
- [ ] Text readable on all breakpoints
- [ ] No horizontal scrolling at any breakpoint
- [ ] Navigation accessible on all devices
- [ ] Forms validate appropriately
- [ ] Buttons have clear active/hover states
- [ ] Links are underlined or otherwise distinguished
- [ ] Images load and scale correctly
- [ ] Video/media loads (if applicable)

## Quick Reference

| Task | Command |
|------|---------|
| Start backend | `node server.js` from project root |
| Start frontend | `npm run dev` from ui directory |
| Build UI | `npm run build` from ui directory |
| Access app | http://localhost:5173 |
| Access backend | http://localhost:3000 |
| Open DevTools | F12 or Cmd+Option+I (Mac) |
| Toggle device mode | Cmd+Shift+M or Ctrl+Shift+M |
| Inspect element | Right-click → Inspect |
| Clear cache | Cmd+Shift+Delete or Ctrl+Shift+Delete |

## See Also

- STANDARDS.md - QA standards and conventions
- API-TESTING-GUIDE.md - Backend API testing
- TEST-PLAN-TEMPLATE.md - Document test execution
- ../QA-CHECKLIST.md - Full ISO 25010 checklist
