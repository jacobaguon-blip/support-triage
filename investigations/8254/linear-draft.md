**Title:** [Bug] Policy review page displays blank after UI update (intermittent)
**Team:** Platform/UI Engineering
**Priority:** Medium
**Labels:** bug, policies, ui-rendering, intermittent, regression, needs-reproduction

### Description

Customer (Trading212) reports that the "Review policy" page displays blank content following a recent UI update. The issue is intermittent and the customer cannot reproduce it consistently, suggesting a potential race condition or conditional rendering bug.

**Impact:** Prevents users from viewing policy details, affecting policy review workflow. While intermittent, this impacts customer trust in the platform and could affect compliance workflows.

**Environment:** Trading212 tenant (production)

### Steps to Reproduce

⚠️ **Reproduction steps unknown** — Customer cannot consistently reproduce

**Suspected navigation path:**
1. Navigate to Policies section
2. Select a policy to review
3. Page loads but displays blank content (intermittently)

**Additional context needed:**
- Browser and version
- Specific policy ID or characteristics
- User role/permissions
- Navigation path taken
- Frequency of occurrence

### Expected vs Actual Behavior

**Expected:** Policy review page should display policy details, rules, configuration, and review interface

**Actual:** Page displays completely blank (no content, no error message, no loading indicator)

### Technical Notes

**Likely root causes to investigate:**
1. Race condition in policy data loading (component renders before data fetch completes)
2. Missing null checks or loading states in policy detail component
3. Unhandled error being silently caught (no error boundary fallback)
4. State management issue (Redux/Context not properly initialized on certain paths)
5. Browser-specific rendering issue

**Investigation needed:**
- Review recent policy UI changes (deployment history around customer's report timeframe)
- Check error monitoring (Sentry/Datadog) for JavaScript errors on policy pages in Trading212 environment
- Examine policy detail component lifecycle and data fetching logic
- Add additional logging/telemetry to capture blank state conditions
- Test across browsers and user permission levels

**Files to review:**
- Policy detail/review page components
- Policy data fetching hooks/API layer
- Error boundaries for policy views
- Recent commits to policy UI (within last 2-4 weeks)

### Related Issues

*(To be filled after Linear search is completed)*

### Investigation Reference

Triage investigation: ~/support-triage/investigations/8254/

**Customer:** Trading212  
**Pylon Ticket:** #8254  
**Reported:** Recent (post-UI update)  
**Current Priority:** P3 in Pylon  
**Suggested Priority:** P2 (UI regression affecting core functionality)