# Change Request

Change ID: CHANGE-002

Status: IMPLEMENTED (uncommitted) — see agent-artifacts/changes/CHANGE-002-staff-transport-same-day/

Priority: High

## Change Title

Prevent same-day double-booking of staff-transport passenger vehicles

## Requested Change

When logistics books staff transportation (auto-assign or manual), a passenger vehicle that is already committed to **another event on the same date** must not be offered or assigned. Mirror the same-day conflict handling that already exists for the cargo truck/driver.

## Reason for Change

Real logistics scenario: two events on the same day. Today the staff-transport auto-assign selects passenger vehicles only by fleet `status` (`available`/`in_use`) and never checks whether the vehicle is already assigned to another same-day contract's `staffTransport`. This can silently double-book one van for two events.

## Current Behavior

- `POST /:id/staff-transport/auto-assign` and `PUT /:id/staff-transport` filter by `passengerVehicle: true` and exclude only this event's cargo truck.
- `staffTransport` is referenced nowhere in same-day conflict/availability logic (confirmed: only the two booking routes touch it).

## Expected Behavior

- Auto-assign skips passenger vehicles already booked in another same-day contract's `staffTransport`.
- Manual booking rejects (with a clear message) a vehicle already booked for another same-day event.
- No change to single-event behavior.

## Affected Users

- Logistics, Admin

## Expected Thesis Basis

Scheduling/Logistics module — vehicle scheduling & conflict avoidance (Ch1 §1.4.1.3; Ch5 Logistics). UNKNOWN exact section for staff transport (staff transport is an added capability — see alignment report).

## Acceptance Expectations

- Given two approved events on the same date, a passenger vehicle assigned to event A is not auto-assigned to event B.
- Manual attempt to book the same vehicle for a same-day second event is rejected with a readable message.
- Different-date events are unaffected.
- Existing single-event auto-assign/manual booking still works.

## Restrictions

- Reuse the existing same-day conflict pattern used for cargo trucks; do not invent a new reservation store.
- No schema-breaking changes.
- Do not change the passenger-vehicle seat/capacity logic.
- Preserve existing behavior for events with no conflict.

## Testing Notes

Two same-day approved contracts; auto-assign on both; verify no shared vehicle. Manual booking conflict path. Different-date control case. Regression: normal auto-assign still fills seats.

## Human Notes

Grounded in code review on branch CAP2 (`server/routes/contracts.js` staff-transport routes). This is a bug/workflow-correctness fix, not a new feature.
