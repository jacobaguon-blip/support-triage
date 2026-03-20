# Investigation: #7580 — Kraken (Sam Asbury)

## Ticket Summary
Sam Asbury from Kraken is unable to filter the task log by approver. They want to see all requests a specific user (e.g., "JonD") has interacted with/approved. The "Assigned to" filter only works for open tasks, and there is no "Approved By" filter in the task log UI.

## Classification
- **Type:** Feature Request (reclassified from Product Defect tag)
- **Product Area:** Platform / UI — Task Log, Analytics
- **Pylon Priority:** Not set
- **Suggested Priority:** P2 — Lighthouse customer, multiple customers requesting this, actively being built

### Classification Reasoning
The Pylon tag says "Product Defect," but the conversation reveals this is a feature gap, not a bug. The "Assigned to" filter works correctly (it's designed for open tasks). The customer wants an "Approved By" filter that doesn't exist yet in the UI. Marcus Whitaker confirmed the gap and created a product ticket.

## Key Findings

1. **Feature is actively being built (VIS-56, In Progress)**
   - Source: [Linear VIS-56](https://linear.app/ductone/issue/VIS-56/add-filter-for-approved-by-in-the-task-log)
   - PR #13181 submitted by Irene Pham (Visibility team), High priority
   - Customer needs linked: **Kraken**, **Zinnia**
   - Created: 2025-08-11, predates this ticket by 4 months

2. **Related "Reviewed by" filter already shipped (TKT-61, Done)**
   - Source: [Linear TKT-61](https://linear.app/ductone/issue/TKT-61/filter-tasks-by-previously-interacting-users)
   - PR #13487 "Display previous approvers and add 'Reviewed by' filter for completed tasks"
   - Completed: 2026-02-10
   - Customers: Amperity, Chime, Clario, PriceSmart

3. **Duplicate Linear ticket exists (IGA-999, Backlog)**
   - Source: [Linear IGA-999](https://linear.app/ductone/issue/IGA-999/task-log-add-fitler-for-approved-by)
   - Created by Marcus Whitaker on 2025-12-18 (same day as Pylon ticket)
   - Customers: Kraken
   - Also linked to Pylon #8438 (Qualtrics requesting same feature)

4. **Related reporting gap exists (VIS-73, Backlog)**
   - Source: [Linear VIS-73](https://linear.app/ductone/issue/VIS-73/task-log-reporting-missing-execution-plan-and-access-approval)
   - Missing execution plan and access approval info in task log export
   - Customers: Devolutions, Kyriba

5. **API workaround already communicated to customer**
   - Jacob Aguon provided two API endpoints on 2025-12-18:
     - `POST /api/search/tasks` with `assignedOrStepApproverUserId`
     - `POST /api/v1/searchtasks` with `previouslyActedOnIds`

6. **CSV export workaround confirmed (partial)**
   - Marcus confirmed "Approved By" is a column in CSV exports
   - But no user filter exists in the UI — must export and filter manually

## Slack Context
- **#eng-team-visibility** (2026-01-26) — Irene Pham posted PR #13181 for approved by filter. Alex Tebbs raised concerns about query performance with new task search filters.
  - [Permalink](https://conductorone.slack.com/archives/C09CVQTKSJX/p1769461094472479)
- **#eng-team-iga-core** (2026-02-09) — Alan Lee discussing "Reviewed by" vs "Assigned to" filter behavior for completed tasks. Bema Fisher reviewing PR for column overlap.
  - [Permalink](https://conductorone.slack.com/archives/C09HKAD2HH9/p1770678701969189)
- **#product-visibility** (2025-11-05) — Marcus Whitaker discussing analytics improvements including most-requested apps visualization. Irene Pham confirmed they're building it.
  - [Permalink](https://conductorone.slack.com/archives/C07PU979S2K/p1762354874085409)

## Related Linear Issues
| Issue | Title | Status | Priority | Relevance |
|-------|-------|--------|----------|-----------|
| [VIS-56](https://linear.app/ductone/issue/VIS-56) | Add filter for approved by in the task log | **In Progress** | High | **Direct match** — exact feature requested |
| [TKT-61](https://linear.app/ductone/issue/TKT-61) | Filter Tasks by Previously Interacting Users | **Done** | Medium | Partially addresses — "Reviewed by" filter |
| [IGA-999](https://linear.app/ductone/issue/IGA-999) | Task Log: Add filter for "approved by" | Backlog | Medium | Duplicate — Kraken-specific ticket |
| [VIS-73](https://linear.app/ductone/issue/VIS-73) | Task Log Reporting — Missing Execution Plan and Access Approval | Backlog | Medium | Related — reporting gaps |
| [EPD-597](https://linear.app/ductone/issue/EPD-597) | Assigned To Filter times out | Canceled | Medium | Context — historical filter performance issues |

## Root Cause Assessment
**Status:** Confirmed — Feature Gap (not a bug)

The task log UI currently lacks an "Approved By" filter. The "Assigned to" filter only applies to open tasks (by design). The data exists in the system (available in CSV exports and via API), but the UI filter has not been built yet.

This is a known gap being actively addressed:
- TKT-61 shipped a "Reviewed by" filter (2026-02-10) which partially addresses this
- VIS-56 is actively in progress with PR #13181 for the "Approved By" filter specifically

## Recommended Actions
1. **Check if TKT-61's "Reviewed by" filter already covers Kraken's use case** — it shipped in Feb 2026 and may already allow filtering completed tasks by approver
2. **Follow up on VIS-56 (PR #13181)** — check if the "Approved By" filter has been merged/deployed
3. **Update Kraken** with current status: workaround via API available now, "Reviewed by" filter may already be in production, "Approved By" filter in active development
4. **Consider closing IGA-999 as duplicate of VIS-56** to reduce ticket clutter

## Open Questions / Escalation Needs
- Has TKT-61's "Reviewed by" filter been deployed to production? If so, does it satisfy Kraken's need to see all tasks a user has interacted with?
- What is the expected ship date for VIS-56 (PR #13181)?
- Alex Tebbs raised performance concerns about new task search filters — has this been addressed for the "Approved By" filter?
