# Investigation: #8544 / #9212 — Shakepay

## Ticket Summary

Shakepay (James Jee) reports that users from their secondary Google Workspace domain (`contractors.shakepay.co`) are not syncing to ConductorOne. The initial fix — clearing the Domain field in the GWS connector config — triggered a Lambda 404 redeployment error (Feb 18). A month later (Mar 19, ticket #9212), James reports the domain field **keeps reverting** to `shakepay.co` on every sync, contractors on the secondary domain **cannot log into C1 via SSO**, and requests guidance on **Google Workspace automation workflows** for onboarding/offboarding.

## Classification

- **Type:** Connector Bug (multi-issue)
- **Product Area:** Connectors (Google Workspace)
- **Connector:** Google Workspace v2 (`baton-google-workspace`)
- **Pylon Priority:** P1 - Partial Service Failure
- **Suggested Priority:** P1 (confirmed) — contractors are completely blocked from using C1 for access requests

## Issues Identified

### Issue A: GWS Connector Domain Field Reverts on Sync
**Classification:** Connector Bug

The `domain` config field in the GWS connector, once cleared by the customer, reverts to `shakepay.co` on every automatic sync. This prevents secondary domain users from ever being synced.

### Issue B: SSO Blocked for Secondary Domain Contractors
**Classification:** Product Bug / Configuration Issue

Contractors authenticating via `contractors.shakepay.co` cannot log into ConductorOne. SSO is configured only for `shakepay.co`. This may require multi-domain SSO support or additional SSO configuration.

### Issue C: Google Workspace Automation Workflows
**Classification:** How-to / Documentation

James is asking for example onboarding/offboarding workflows using Google Workspace connector actions.

## Key Findings

### Code Analysis (Level 2)

**Relevant Files:**
- `baton-google-workspace/pkg/connector/user.go:69-74` — User list query branches on `domain` field: when set, calls `r.Domain(o.domain)` (single-domain scope); when blank, calls `r.Customer(o.customerId)` (all-domain scope)
- `baton-google-workspace/pkg/connector/user.go:245-261` — Get() method has secondary domain check via Organizations field; logs "user not in domain" and silently drops non-matching users
- `baton-google-workspace/pkg/connector/group.go:58-62` — Same domain filtering pattern for group listing
- `baton-google-workspace/pkg/config/config.go:19-24` — `DomainField` is a single `StringField`, not required, no multi-domain support
- `baton-google-workspace/pkg/connector/connector.go:478-501` — Validate() checks domain is in verified domains list; passes if domain is blank

**Error Trace — Domain Revert Bug (Issue A):**
The connector's `domain` field is a plain string config. When James clears it, the connector should fall back to `Customer(customerId)` scope. However, the field **reverts to shakepay.co on every sync**. This suggests the platform or connector is re-populating the domain field during sync — possibly from the Google Directory API's verified domains list, or from a cached connector configuration that overwrites the user's change.

This revert behavior is NOT explained by the connector code alone. The code reads the config but does not write back to it. The revert likely happens at the **platform level** — either in connector configuration management or during the Lambda redeployment flow.

**Lambda 404 Error (Feb 18):**
```
ResourceNotFoundException: Function not found: arn:aws:lambda:us-west-2:387095824848:function:38DWU1JvsqVxuQygBsk5gYfBfp0-39r4gZz5vGV3u6KQJ0J3VMvywUO-GoogleWo:$LATEST
```
This error occurs when the connector configuration change triggers a redeployment of the Lambda function. Known issue — 404s persist for ~30 minutes during redeployment. However, the domain revert issue may mean the redeployment is also resetting the configuration.

> **Want me to go deeper with root cause analysis?** This would include investigating whether the Lambda redeployment pipeline resets the domain config, and whether the platform's connector configuration store has a race condition between user edits and sync-triggered updates.

## Related Issues

- **Linear CXH-649** — "Sync external users for GWS" (Backlog, unresolved since July 2025). Same class of issue: non-primary-domain users invisible in C1. Customer: FunctionHealth. No resolution documented.
- **Linear CXH-882** — "Google Workspace Connector (v2): email alias support" (Duplicate). Related: GWS connector only captures primary email, not alternates.
- **Linear CXP-347** — "Investigate Google Workspace connector 412 error" (Todo, March 2026). The 412 error ("User list response size is too large") is mechanically related to domain scoping.
- **Linear EPD-1793** — "Merge C1 users for Shakepay" (Done, March 2026). Shakepay had duplicate users from Rippling connector not pulling emails initially.
- **Linear CXH-839** — "Google Workspace v2: Add Connector Actions Support" (Todo). Explicitly names Shakepay as a customer driving GWS work.
- **Pylon #9069** — SEV-0 incident: "Users unable to log in after C1 users merged for Shakepay." Resolved via migration #117. Related to Shakepay's unstable directory config.

## Slack Context

- **#product (2024-12-04)** — Paul Querna shipped PR #23 making the GWS connector `domain` field optional. When blank, connector syncs all domains via `Customer()` instead of `Domain()`. This fix was confirmed working for WeddingWire/ttkw (60 domains). Source: https://conductorone.slack.com/archives/C01C6C9RNMD/p1733330239809309
- **#customer-success (2024-12-05)** — Ali Falahi announced the fix: "Yesterday Paul made a change which negates the need to have multiple connectors if you have multiple domains." Source: https://conductorone.slack.com/archives/C036VSVTN3B/p1733405412422399
- **#support-connectors (2026-03-04)** — Marcus Whitaker flagged Shakepay (and Advisor360) deleted old directory in favor of Rippling, causing duplicate users. Harika Vadapalli suggested remediation: re-add GWS, remove Rippling, wait, re-add Rippling. Source: https://conductorone.slack.com/archives/C087N95G127/p1772648200643599
- **#lightning-strike / #cfe (2026-03-16)** — Pylon #9069 elevated to Sev-0. Incident #670: users unable to log in after C1 user merge. Resolved via migration #117.
- **#cfe (2026-02-18)** — Marcus Whitaker escalated Rippling connector issue blocking Shakepay go-live. John Allers pinned Shakepay's Rippling connector to preview version.
- **#general (2026-01-28)** — Shakepay closed as new customer ($20K/1yr, 110 employees). Champion: James Jee.

## Root Cause Assessment

**Status: Suspected — recommend escalation**

**Issue A (domain revert):** The connector code itself does not write the domain field back. The revert is likely happening at the platform level — either during Lambda redeployment, during connector config sync, or through a cached config overwriting the user's edit. This requires platform-side investigation. The Dec 2024 fix (PR #23) made the field optional, but something in the deployment or config management pipeline is re-populating it.

**Issue B (SSO):** This is likely a platform-level SSO configuration issue. If C1's SSO is configured for `shakepay.co` only, users authenticating from `contractors.shakepay.co` would be rejected. Whether C1 supports multi-domain SSO needs engineering confirmation.

**Issue C (automations):** This is a documentation/guidance question. Linear CXH-839 tracks GWS connector actions support for Shakepay.

## Recommended Actions

1. **Escalate Issue A to engineering** — The domain field revert is a platform-level bug that cannot be resolved through connector config alone. Linear EPD-1848 created and linked to Pylon #8544 and #9212. Both Pylon tickets moved to on_hold.
2. **Issue B (SSO) — likely resolves with Issue A fix** — Per Sean Harmuth (Mar 20): Google is the first directory, Rippling is #2. Since GWS isn't syncing contractors (domain revert bug), the only user records come from Rippling with personal emails (e.g., mypersonal@gmail.com). When contractors try Google SSO with their @contractors.shakepay.co email, C1 can't match them. Fixing the domain revert should resolve SSO by syncing contractors with correct GWS emails.
3. **Issue C (automation workflows) — RESOLVED** — Customer response sent Mar 20 with full list of GWS connector actions for onboarding/offboarding, doc links, and setup instructions.
4. **Issue D (connector actions enablement) — RESOLVED** — James confirmed actions are visible (Pylon #9256).
5. **Consolidate tickets** — Working #9212 as active, #8544 linked as original (per Sean's suggestion).

## Open Questions / Escalation Needs

- Why does the GWS connector domain field revert to `shakepay.co` on every sync? Is this a platform config management bug or a Lambda redeployment side effect? (Tracked: Linear EPD-1848)
- Confirm Sean's theory: once GWS syncs contractors with correct emails, does SSO automatically resolve? Or is there a separate SSO domain validation issue?
- Is Shakepay's GWS connector running the version with PR #23 (Dec 2024 multi-domain fix)?

## Actions Taken

- **Linear EPD-1848** created: "GWS connector domain config field reverts to primary domain on every sync" (Team: EPD, Priority: High, State: Triage, Labels: Bug, CFE)
- **Pylon #8544** linked to EPD-1848, state → on_hold
- **Pylon #9212** linked to EPD-1848, state → on_hold
- **Customer response sent** Mar 20 18:25 covering all 4 issues (A: bug confirmed, B: investigating, C: automation examples provided, D: acknowledged resolved)
