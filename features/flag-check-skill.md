# Feature: /flag-check Skill + Pipeline Integration

## Summary
Create a `/flag-check` skill that searches the C1 codebase for feature flags related to a support issue, then generates a support dashboard prompt to verify flag state on the customer's tenant. Integrate into /triage, /troubleshoot, /validator, /customer-response, and /qa.

## Problem
Investigation skills sometimes recommend code changes or escalations when the fix is simply enabling a feature flag on the customer's tenant. There's no automated step to check for relevant flags before escalating.

## Proposed Solution

### New Skill: `/flag-check`
- Input: ticket number, issue description, product area, connector name
- Process:
  1. Search `~/C1/ductone/` for feature flag definitions related to the product area/connector
  2. Search for flag names near relevant code paths (e.g., grep for "feature" + "flag" + "google workspace")
  3. Present found flags with their code context
  4. Generate a support dashboard AI prompt to check flag state on the customer's tenant
- Output: list of relevant flags + dashboard prompt

### Pipeline Integration
- `/triage` — after classification, note if product area has known flags
- `/troubleshoot` — during context gathering, run flag search for the connector/product area
- `/validator` — Wire up Pass 2f Check C.1 to actually query flags (currently stubbed)
- `/customer-response` — before recommending code changes, verify flags
- `/qa` — audit whether flag check was performed

## Priority
High — directly reduces unnecessary escalations

## Effort
Medium — codebase grep is straightforward; dashboard prompt generation is templated

## Created
2026-03-20
