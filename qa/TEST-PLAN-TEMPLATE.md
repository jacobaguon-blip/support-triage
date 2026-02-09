# Test Plan Template

Use this template to document testing for each feature or bug fix.

## Header Information

| Field | Value |
|-------|-------|
| **Feature/Fix Name** | [Enter feature name or bug ID] |
| **Date** | [YYYY-MM-DD] |
| **Tester** | [Name] |
| **Status** | [In Progress / Complete / Blocked] |
| **Environment** | [Development / Staging / Production] |

## Pre-Conditions

These conditions must be met before testing begins:

- [ ] Project built successfully: `cd ui && npm run build` exits with 0 errors
- [ ] Backend server running on http://localhost:3000
- [ ] Frontend dev server running on http://localhost:5173
- [ ] Database initialized with clean state (or known test data)
- [ ] Browser: [Specify Chrome/Firefox/Safari version]
- [ ] No other testing in progress on shared environment

**Setup Instructions:**

```bash
# Terminal 1: Backend
cd /path/to/project
npm install
node server.js

# Terminal 2: Frontend
cd ui
npm install
npm run dev
```

## Test Cases

| ID | Description | Steps | Expected Result | Actual Result | Pass/Fail |
|---|---|---|---|---|---|
| TC-001 | [Brief test description] | 1. [First step]<br/>2. [Second step]<br/>3. [Verify] | [What should happen] | [Tester notes] | [✓/✗] |
| TC-002 | [Next test] | 1. [Steps]<br/>2. [Continue] | [Expected] | [Actual] | [✓/✗] |
| TC-003 | [Error scenario] | 1. [Steps to trigger error] | [Error message shown] | [Actual] | [✓/✗] |

**Example:**

| ID | Description | Steps | Expected Result | Actual Result | Pass/Fail |
|---|---|---|---|---|---|
| TC-001 | User can create new investigation | 1. Click "New Investigation"<br/>2. Enter ticket ID<br/>3. Click "Create" | Investigation created, redirect to investigation page | [Tester fills in] | [✓/✗] |
| TC-002 | Error message on missing ticket ID | 1. Click "New Investigation"<br/>2. Leave ticket ID blank<br/>3. Click "Create" | Error: "Ticket ID is required" | [Tester fills in] | [✓/✗] |

## Responsive Testing

Test the feature at each breakpoint using browser DevTools or device emulation:

### Desktop (1024px+)

| Test | Result | Notes |
|------|--------|-------|
| Layout displays correctly | ✓/✗ | [Any issues?] |
| All buttons clickable | ✓/✗ | |
| Text readable | ✓/✗ | |
| No horizontal scroll | ✓/✗ | |

### Tablet (900px)

| Test | Result | Notes |
|------|--------|-------|
| Layout responsive | ✓/✗ | [Any issues?] |
| Touch targets adequate (44px+) | ✓/✗ | |
| Text readable | ✓/✗ | |
| Navigation accessible | ✓/✗ | |

### Mobile (768px)

| Test | Result | Notes |
|------|--------|-------|
| Single column layout | ✓/✗ | [Any issues?] |
| Touch targets adequate (44px+) | ✓/✗ | |
| Text readable (font size >= 14px) | ✓/✗ | |
| No horizontal scroll | ✓/✗ | |
| Hamburger menu functional | ✓/✗ | |

## Error Scenario Testing

Test the feature's behavior when things go wrong:

| Scenario | Steps | Expected Behavior | Actual Result | Pass/Fail |
|----------|-------|-------------------|----------------|-----------|
| Network timeout | [Steps to simulate] | Error message, retry option | [Tester notes] | [✓/✗] |
| Missing data | [Steps] | Graceful degradation or empty state | [Tester notes] | [✓/✗] |
| Invalid input | [Steps] | Validation error with guidance | [Tester notes] | [✓/✗] |
| Server error | [Steps to trigger 500] | Error message, user not confused | [Tester notes] | [✓/✗] |

## Integration Testing

How does this feature work with existing features?

| Feature Interaction | Test Steps | Expected Result | Pass/Fail |
|-------------------|-----------|-----------------|-----------|
| [Feature A] ↔ [This Feature] | [Steps] | [Expected] | [✓/✗] |
| [Feature B] ↔ [This Feature] | [Steps] | [Expected] | [✓/✗] |
| [Feature C] ↔ [This Feature] | [Steps] | [Expected] | [✓/✗] |

## Browser DevTools Checks

Open DevTools (F12) and verify:

### Console

- [ ] No JavaScript errors (red messages)
- [ ] No console warnings related to feature
- [ ] Network requests complete successfully

### Network Tab

- [ ] API requests have correct method and path
- [ ] Response codes are 2xx or appropriate 4xx (not 5xx)
- [ ] Response time is acceptable (< 1 second for most calls)
- [ ] Payloads match expected structure

### Elements/Inspector

- [ ] CSS variables used from C1 design system (no hardcoded colors)
- [ ] BEM-style class names applied
- [ ] No inline styles except for dynamic content
- [ ] Responsive classes apply correctly at breakpoints

### Performance

- [ ] Page load time acceptable
- [ ] No memory leaks when testing repeatedly
- [ ] No layout thrashing or excessive reflows

## Sign-Off

### Tester Sign-Off

- **Tester Name:** [Name]
- **Date Tested:** [YYYY-MM-DD]
- **Overall Result:** [PASS / FAIL / BLOCKED]
- **Blocking Issues:** [List any critical failures]
- **Recommendations:** [Suggestions for improvement]

```
Signature: ________________     Date: __________
```

### Reviewer Sign-Off

- **Reviewer Name:** [Name]
- **Date Reviewed:** [YYYY-MM-DD]
- **Approved for Merge:** [YES / NO]
- **Feedback:** [Any comments]

```
Signature: ________________     Date: __________
```

## Notes & Observations

Use this section for additional testing notes:

```
[Tester notes, unusual behavior, edge cases discovered, etc.]
```

## Attached Evidence

- [ ] Screenshots of passing tests: [File paths or links]
- [ ] Screenshots of failures: [File paths or links]
- [ ] Browser console logs: [Attached or referenced]
- [ ] Video recording: [Link if available]

## References

- See STANDARDS.md for QA standards and conventions
- See UI-TESTING-GUIDE.md for detailed UI testing procedures
- See API-TESTING-GUIDE.md for API endpoint testing
- See ../QA-CHECKLIST.md for ISO 25010 comprehensive checklist
