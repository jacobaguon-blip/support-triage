# Pre-Commit Checklist

**MANDATORY:** All items must be checked before committing any code.

## For UI Features

### Build Verification
- [ ] `cd ui && npm run build` completes with 0 errors
- [ ] No console warnings during build
- [ ] All imports resolve correctly

### Manual Testing
- [ ] Component renders without white screen or crashes
- [ ] All user interactions work as expected
- [ ] Forms submit successfully
- [ ] Error states display correctly
- [ ] Loading states work properly
- [ ] Empty states display when appropriate

### Browser Testing
- [ ] Tested in Chrome/Arc
- [ ] No console errors (check with F12 DevTools)
- [ ] No React warnings in console

### Responsive Testing
- [ ] Tested at full desktop width (1920px+)
- [ ] Tested at 900px breakpoint (tablet)
- [ ] Tested at 768px breakpoint (mobile)
- [ ] No horizontal scroll on any breakpoint
- [ ] All buttons/controls remain accessible
- [ ] Text remains readable

### Design System Compliance
- [ ] Uses CSS variables from `ui/src/styles/index.css`
- [ ] Matches C1 light theme colors
- [ ] Follows existing component patterns
- [ ] Typography uses Inter font
- [ ] Spacing uses consistent units

### API Integration
- [ ] All API endpoints tested and respond correctly
- [ ] Error responses handled gracefully
- [ ] Loading states while waiting for responses
- [ ] Network failures don't crash the UI

### Data Handling
- [ ] Empty data displays appropriate message
- [ ] Large datasets don't cause performance issues
- [ ] Data refreshes work correctly
- [ ] State updates don't cause unnecessary re-renders

## For Backend Features

### Code Quality
- [ ] All new endpoints follow REST conventions
- [ ] Error handling in place for all operations
- [ ] Database queries use parameterized statements (SQL injection prevention)
- [ ] Proper HTTP status codes returned

### Testing
- [ ] Endpoints tested with `curl` or Postman
- [ ] Success cases work
- [ ] Error cases return appropriate messages
- [ ] Edge cases handled (empty input, invalid IDs, etc.)

### Database
- [ ] Schema changes documented
- [ ] Migrations work without data loss
- [ ] Queries are efficient (no N+1 problems)

## For Scripts/Tools

### Functionality
- [ ] Script runs without errors
- [ ] Usage documentation added to README
- [ ] Error messages are clear and actionable
- [ ] Exit codes used correctly (0 = success, non-zero = error)

### Safety
- [ ] No destructive operations without confirmation
- [ ] Dry-run mode available where appropriate
- [ ] Clear warnings before risky operations

## Universal Requirements

### Documentation
- [ ] README updated if needed
- [ ] CHANGELOG.md entry added (if applicable)
- [ ] Comments added for complex logic
- [ ] Feature documented in appropriate place

### Git
- [ ] Commit message is descriptive
- [ ] Commit message follows convention: `{type}: {description}`
  - Types: feat, fix, docs, style, refactor, test, chore
- [ ] No commented-out code committed
- [ ] No debug console.log statements left in production code
- [ ] No TODO comments without tracking issue

### Security
- [ ] No API keys or secrets in code
- [ ] No passwords or tokens committed
- [ ] Environment variables used for sensitive data
- [ ] User input sanitized before use

## After Committing

- [ ] Pushed to GitHub
- [ ] Moshi notification sent (for completed features)
- [ ] Feature moved to completed in BACKLOG.md
- [ ] User notified if they requested the feature

---

## Quick Fail Fast Test

Before going through the full checklist, do this 30-second smoke test:

1. **Build:** `cd ui && npm run build` → Must pass
2. **Render:** Open in browser → Must see UI, not white screen
3. **Console:** F12 → Must have 0 errors

If any of these fail, **stop and fix before proceeding.**

---

## Enforcement

**No commit should be made without completing this checklist.**

If a bug is found post-commit that would have been caught by this checklist, that's a process failure that should be reviewed and prevented in the future.
