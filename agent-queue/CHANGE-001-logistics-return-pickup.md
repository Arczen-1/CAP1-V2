# Change Request

Change ID: CHANGE-001

Status: PENDING

Priority: Medium

## Change Title

Make the logistics return / pickup-from-venue leg a first-class step

## Requested Change

Add a clear "Return / Pickup" step to the logistics workflow so, after the event, the driver knows which items to **collect from the venue** and bring back — the reusable inventory that was loaded out (creative/decor, linen, stockroom equipment). Food/kitchen items are consumable and excluded. The return step should tie into the existing post-event checks.

## Reason for Change

The real logistics cycle is a round trip: deliver items to the venue, then pick them up afterward. Today delivery is well covered (load manifest, driver pickup checklist, trip ticket), but the "pick it up from the venue" leg exists only implicitly (trip-ticket return count + per-item post-event status). Logistics has no dedicated view/checklist of what to collect back.

## Current Behavior

- Delivery: load manifest, "Driver Pickup Checklist" (collect from departments), trip ticket.
- Post-event: per-item post-event status (checked_ok / incident_reported) for creative/linen/stockroom.
- No dedicated "return from venue" checklist for the driver.

## Expected Behavior

- A "Return / Pickup" checklist (viewable + printable) listing the non-consumable items loaded out for this event, for the driver to check off when collecting from the venue.
- Excludes kitchen/food (consumable).
- Checking items ties into / reflects the existing post-event return checks (no parallel data model).
- Available only after the event date.

## Affected Users

- Logistics, Admin (view); feeds Creative/Linen/Stockroom post-event checks.

## Expected Thesis Basis

Post-event phase — logging returned items (Ch1 §1.5.2 Scope; Ch5 post-event checking). UNKNOWN exact wording.

## Acceptance Expectations

- Return checklist lists exactly the creative/linen/stockroom items loaded for the event; excludes food.
- Only available after event date.
- Printable.
- Reuses existing post-event status data; no duplicate source of truth.
- No change to the delivery-side flows.

## Restrictions

- Build on existing load-manifest + post-event data; no schema changes if avoidable.
- No scope expansion beyond the return checklist.
- Preserve all existing logistics behavior.
- This is a workflow refinement — keep it small; if it grows beyond a contained view, split it and flag for approval.

## Testing Notes

Items match load-out; food excluded; availability gated to post-event; authorization (logistics/admin); regression on existing post-event checks and driver pickup checklist.

## Human Notes

Directly from the owner's scenario: "logistics; transporting inventory to an event, picking it up." Keep contained; do not redesign logistics.
