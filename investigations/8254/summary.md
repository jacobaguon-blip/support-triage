# Investigation: #8254 — Trading212

## Ticket Summary
Customer reports that the "Review policy" UI is displaying blank after a recent UI update. The issue is intermittent and the customer cannot reproduce it consistently, suggesting a potential race condition or environment-specific rendering issue.

## Classification
- **Type:** Product Bug
- **Product Area:** Policies
- **Connector:** N/A
- **Pylon Priority:** P3
- **Suggested Priority:** P2 (Upgrade recommended — UI rendering issues affecting core policy functionality, even if intermittent, can impact customer trust and workflow)

## Key Findings
1. **Intermittent nature suggests timing or state management issue** — Customer explicitly states they cannot reproduce consistently, which typically indicates a race condition, async loading problem, or conditional rendering bug
2. **Linked to recent UI update** — Customer specifically mentions "since the UI update," suggesting this is a regression introduced in a recent deployment
3. **Limited customer-provided details** — No screenshots, browser information, steps taken, or error messages provided, requiring further investigation

## Code Analysis
**Status:** Pending — Requires access to codebase to identify relevant files

**Areas to investigate:**
- Policy detail view components (React components handling policy display)
- Policy data fetching logic (API calls, data loaders)
- Recent commits to policy UI components around the time of the reported UI update
- Conditional rendering logic that might cause blank states
- Error boundaries and loading states for policy views

**Likely file patterns to examine:**
- `c1/ui/policies/` or similar policy component directories
- Policy detail/review page components
- Policy data hooks or API integration layer
- Recent changes to styling or layout systems affecting policies

> **Want me to go deeper with root cause analysis?** Once codebase access is granted, I can trace the exact components involved and identify the specific rendering logic causing the blank display.

## Related Issues
**Status:** Pending — Requires Linear and Pylon access to search for similar reports

**Search queries needed:**
- Linear: "blank policy", "policy not displaying", "policy UI", filtered by recent activity
- Pylon: Other Trading212 tickets, other "blank" UI issues post-update
- Slack: Discussions in #engineering or #customer-success about recent policy UI changes

## Slack Context
**Status:** Pending — Requires Slack search for:
- Recent policy UI updates or deployments
- Trading212 customer discussions
- Other reports of blank/empty UI states
- UI update announcements that might correlate with the timeframe

## Root Cause Assessment
**Status:** Unknown — Recommend escalation to engineering with current information

**Preliminary hypothesis:**
Given the intermittent nature and post-update timing, likely causes include:
1. **Race condition in data loading** — Component renders before policy data arrives
2. **Conditional rendering logic** — Missing null checks or fallback states
3. **State management issue** — React state not properly initialized on certain navigation paths
4. **Error silently swallowed** — Exception caught but no error state displayed
5. **Browser-specific issue** — Works in some browsers/versions but not others

**Next steps to confirm:**
1. Gather reproduction steps from customer (browser, navigation path, user role)
2. Request screenshots or console errors
3. Review recent policy UI deployment logs
4. Check error tracking (Sentry/similar) for policy page errors around customer's timestamp
5. Test across different browsers and user permission levels

## Recommended Actions
1. **Gather reproduction context from customer** — Browser, steps taken, frequency, user role/permissions
2. **Request screenshot or screen recording** — Visual evidence helps dramatically
3. **Check error monitoring systems** — Look for JavaScript errors on policy pages for Trading212 tenant
4. **Review recent deployments** — Identify what "UI update" refers to and review those changes
5. **Attempt reproduction in Trading212's environment** — Use test account if available
6. **Review commit history** — Focus on policy UI changes in the deployment window

## Open Questions / Escalation Needs
- **What specific UI update is the customer referring to?** — Need deployment timeline
- **Which policy are they reviewing?** — Specific policy ID/name would help
- **What browser and version?** — Could be browser-specific rendering issue
- **User's role and permissions?** — Might be related to RBAC logic
- **Full navigation path?** — How did they reach the "Review policy" screen?
- **Does this happen with all policies or just one?** — Helps isolate if it's data-specific
- **Any console errors?** — Customer may need to check browser dev tools

**Escalation:** Engineering team should be notified if this affects multiple customers or if it's reproducible with specific steps. Given the intermittent nature and lack of reproduction steps, this may require engineering to add additional logging/telemetry to policy UI components to capture the failure state.

---