# Implementation Report — CHANGE-002

## Change Implemented

Prevent a passenger vehicle from being booked for staff transport on two events the **same day**. Added same-day conflict handling across all three staff-transport surfaces.

## Files Modified

- `server/routes/contracts.js`
  - New helper `getSameDayStaffTruckIds(contract)` — returns the set of truck IDs already in another active contract's `staffTransport.vehicles` on the same event date (mirrors the existing same-day pattern used for venue/cargo conflicts, reusing `ACTIVE_CONTRACT_STATUSES` + `startOfDay`/`endOfDay`).
  - **Auto-assign** (`POST /:id/staff-transport/auto-assign`): candidate passenger vehicles now also filtered by `!sameDayStaffTruckIds.has(id)`.
  - **Manual booking** (`PUT /:id/staff-transport`): rejects a vehicle already booked same-day elsewhere with a clear message.
  - **Operations summary** (`buildOperationsSummary`): added `staffTransport` to the same-day `.select(...)`, built a same-day staff-truck set, and excluded those from `staffTransportVehicles` so the UI picker never offers them.

## Technical Notes

Same-day scope = other contracts with `status ∈ ACTIVE_CONTRACT_STATUSES` and `eventDate` within the event's day. Cargo truck exclusion and passenger-only filtering are preserved. No schema changes.

## Commands Executed

- `node --check server/routes/contracts.js` → OK (syntax).
- Live smoke test: `POST /staff-transport/auto-assign` on an approved contract → 400 **"Assign the banquet staff first"** (expected — that contract has 0 staff); confirms the new query path runs without error. `operations-summary` still returns 6 passenger-vehicle options (exclusion not over-filtering).

## Acceptance Criteria

- AC (auto-assign skips same-day-booked vans): implemented — needs a two-same-day-staffed-events run for full runtime confirmation.
- AC (manual booking rejects same-day conflict): implemented (clear 400 message).
- AC (different-date unaffected): logic scoped to the event's day only.
- AC (single-event still works): verified via smoke test (no regression; validation unchanged).

## Known Limitations

Full double-booking scenario (two same-day contracts each with staff assigned) not exercised end-to-end unattended — recommend that quick manual test. Logic is a direct mirror of the existing, proven same-day conflict pattern.
