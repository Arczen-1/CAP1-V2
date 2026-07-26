# Change Request

Change ID: CHANGE-003

Status: PENDING

Priority: Medium

## Change Title

Reconcile loaded-out vs returned quantities after the event

## Requested Change

At post-event, compare what was **loaded out** for the event against what was **returned/checked**, and surface any discrepancy (missing/short) so it can be recorded (e.g., as an incident or note) before the contract is closed.

## Reason for Change

Closing the loop on the round trip: items that go out should come back (minus consumables). A shortfall between loaded and returned is exactly what logistics/warehouse need flagged, and it supports the post-event summary and contract-close checks.

## Current Behavior

- Post-event status is tracked per item (checked_ok / incident_reported).
- The trip ticket mentions a second count on return, but there is no in-system reconciliation of loaded vs returned quantities.

## Expected Behavior

- A per-department post-event reconciliation summary: loaded qty vs returned/accounted qty, with discrepancies highlighted.
- A discrepancy can be recorded via the existing incident flow (no new parallel model).
- No false positives when everything is accounted for.

## Affected Users

- Logistics, Stockroom, Creative, Linen, Accounting (close), Admin.

## Expected Thesis Basis

Post-event phase — inventory count, noting damaged/missing equipment (Ch1 §1.5.2; Ch5 post-event checking).

## Acceptance Expectations

- Loaded vs returned compared per department.
- Discrepancy highlighted and recordable as an incident.
- No discrepancy shown when fully accounted.
- Financial figures remain finance-only (do not expose price/value to non-finance).

## Restrictions

- Reuse the incident model + existing post-event data; no schema-breaking changes.
- Do not change the scoring/finance formulas.
- Keep contained; if it requires new persistence, flag for approval instead of building it unattended.

## Testing Notes

Loaded == returned (no flag); returned < loaded (flag + incident path); consumables excluded; authorization; regression on close checks.

## Human Notes

Pairs with CHANGE-001 (return/pickup). Depends on how "loaded quantity" is persisted — the researcher should confirm before implementing; if loaded qty isn't stored, this may need a small model addition → treat as needs-approval.
