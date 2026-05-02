# Feature Request: Display Access Profile Entitlements Inline During Campaign Setup

**Status**: Ready for Linear
**Date Created**: 2026-02-11
**Requested By**: Kayak (Pylon #8401)
**Priority**: P4 (Low - Workflow improvement, workaround exists)
**Team**: Access Reviews / Campaigns

---

## Executive Summary

When configuring campaign scope in the Access Reviews feature, compliance administrators need to understand what entitlements are included within access profiles to make informed scoping decisions. Currently, there is no inline view of access profile entitlements during campaign setup—users must navigate away from the campaign setup workflow to the Admin → Access Profiles page to view this information.

This feature request proposes adding an expandable or inline view that displays the entitlements configured within an access profile, directly within the campaign scope selection interface.

---

## Customer Request

**Source**: Pylon #8401
**Customer**: Kayak
**Original Question**:
> "In the Campaigns feature, is there currently a way to review what entitlements are set up in an access profile?"

**Context**:
- Customer is setting up campaigns and needs to understand what's inside access profiles
- Currently requires context-switching to a separate Admin page
- This interrupts the campaign configuration workflow and reduces confidence in scope selection

---

## Current Behavior

1. **Campaign Scope Setup Location**: `Campaign Details → Scope Tab → Apps and Resources`
2. **Access Profiles Selection**: Users can include/exclude access profiles in campaign scope
3. **Entitlement Visibility**:
   - Access profile names are visible in the scope selection
   - No inline view of what entitlements are configured within each profile
   - To view entitlements, users must:
     - Leave campaign setup
     - Navigate to Admin → Access Profiles
     - Find the specific access profile
     - Click into it and view the Entitlements tab
     - Return to campaign setup

**Code Reference**:
- Campaign scope component: `/c1/frontend/components/pages/accessreview/recurring/details/tabs/scope/RecurringCampaignScope.tsx`
- Resource rollup list: `/c1/frontend/components/pages/accessreview/recurring/details/tabs/scope/AppsEntitlementsScope/resourceRollups/RecurringCampaignResourceRollupList.tsx`
- Existing entitlement list (for reference): `/c1/frontend/components/pages/requestcatalog/details/setup/catalog_entitlement_list/index.tsx`

---

## Proposed Solution

Add the ability to view access profile entitlements inline during campaign scope configuration, using one of these UX patterns:

### Option 1: Expandable Inline List (Recommended)
- Add an expand/collapse icon next to each access profile name
- When expanded, show a nested list of entitlements within that profile
- Display: App name, Resource type, Entitlement name
- Optionally show: Grant counts, affected users

### Option 2: Hover Tooltip/Popover
- Show a preview of entitlements when hovering over the access profile name
- Quick preview with top 5-10 entitlements
- "View all" link to open full modal if needed

### Option 3: Side Panel/Drawer
- Add an info icon (ℹ️) next to access profile names
- Click to open a right-side drawer with full entitlement details
- Similar to existing drawer patterns in the app

### Option 4: Modal Dialog
- Click access profile name or info button
- Opens a modal dialog with full entitlement list
- Includes search/filter if profile has many entitlements

---

## Technical Implementation Notes

### Backend API
**Already available**: The backend API to fetch access profile entitlements exists:
- API Method: `ListAppEntitlementProfileBindings()`
- Located in: `/c1/pkg/api/app/rpc_app_profiles.go`
- Used by: Access Profile detail page in Admin section

### Frontend Component
**Existing reference implementation**:
- Component: `CatalogEntitlementList`
- Location: `/c1/frontend/components/pages/requestcatalog/details/setup/catalog_entitlement_list/index.tsx`
- This component already displays entitlements for access profiles (request catalogs)
- Can be adapted/reused for campaign scope view

### Integration Points
1. Modify `RecurringCampaignResourceRollupList.tsx` to add expand/collapse or info button
2. Create or adapt an entitlement viewer component
3. Wire up API call to fetch entitlements when user expands/clicks
4. Handle loading states and pagination (if profile has many entitlements)
5. Ensure responsive design for different screen sizes

### Edge Cases to Handle
- Access profiles with 100+ entitlements (pagination needed)
- Access profiles with no entitlements (show empty state)
- Permissions: Ensure user has permission to view entitlement details
- Performance: Lazy-load entitlements only when user expands/views

---

## User Stories

**As a** compliance administrator configuring campaign scope
**I want to** view what entitlements are in an access profile without leaving campaign setup
**So that** I can make informed decisions about which profiles to include in the campaign scope

**As a** TSE helping a customer configure campaigns
**I want to** quickly see what's inside an access profile during a support call
**So that** I can guide the customer without asking them to navigate to multiple pages

---

## Success Metrics

- **Reduced context-switching**: Track how often users navigate away from campaign setup to view access profiles
- **Faster campaign configuration**: Measure time to complete campaign scope setup
- **User feedback**: Survey users on whether this feature improves their workflow
- **Support ticket reduction**: Fewer questions about "what's in this access profile?"

---

## Related Work

- **Pylon #8038**: Entitlements filtering enhancement (already in production)
- **EntitlementChips Component**: Already displays entitlement chips in resource rollup views
- **CatalogEntitlementList**: Existing implementation that displays entitlements for access profiles

---

## Priority Justification

**Priority: P4 (Low)**

**Reasoning**:
- Workaround exists: Users can open a separate tab to view access profiles
- Not blocking: Campaign setup can be completed without this feature
- Quality-of-life improvement: Reduces friction but doesn't fix a broken workflow
- Single customer request so far: Not yet proven to be a widespread pain point

**Could increase priority if**:
- Multiple customers request this feature
- Data shows users frequently navigate away from campaigns to view access profiles
- Customer feedback indicates this is a significant workflow friction point

---

## Open Questions

1. **Which UI pattern is preferred?** (Expandable list, drawer, modal, tooltip)
2. **Should we show all entitlements or paginate?** (Consider profiles with 100+ entitlements)
3. **What metadata to display?** (Just entitlement names, or also grant counts, affected users, etc.)
4. **Permissions handling**: Do all users who can configure campaigns have permission to view entitlements?
5. **Mobile/responsive design**: How should this look on smaller screens?

---

## Next Steps

1. ✅ Create this feature spec document
2. ⬜ Create Linear issue for engineering team
3. ⬜ Add to feature backlog with priority P4
4. ⬜ Await design review for UX pattern selection
5. ⬜ Await engineering sizing/estimation
6. ⬜ Monitor for additional customer requests

---

## Linear Issue Draft

**Title**: `[FR] Display access profile entitlements inline during campaign setup`

**Team**: Access Reviews / Campaigns (or equivalent)

**Priority**: 4 (Low)

**Labels**: feature-request, campaigns, ux-improvement, access-reviews

**Description**: [See full description in "Proposed Solution" section above]

---

**Document Owner**: Jacob Aguon, Technical Support Engineer
**Last Updated**: 2026-02-11
