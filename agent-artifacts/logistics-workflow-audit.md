# Logistics & Department Workflow Audit

**Generated:** 2026-07-26 (overnight, team-lead-directed) · Branch: CAP2
**Focus:** the real logistics round trip — deliver → event → pick up → return → post-event → close — per the owner's request. Findings are grounded in code review; each is classified **safe-to-auto-fix** or **needs human approval** (no moderate features were built unattended).

## The round-trip today (what exists)

| Leg | Where | State |
|---|---|---|
| Collect from departments (to deliver) | Driver Pickup Checklist, load manifest, dept load readiness | ✅ Solid (built this session) |
| Deliver to venue / dispatch | Booking form → dispatched; trip ticket | ✅ |
| Staff transport | Auto-assign + manual booking (passenger vehicles) | ✅ Works; see F1 |
| Event day | Banquet supervisor incident reporting | ✅ |
| **Pick up from venue (return leg)** | Only implicit: trip-ticket return count + per-item post-event status | ⚠️ Gap (F2) |
| Post-event checks / returns | Per-item post-event status (creative/linen/stockroom) | ✅ |
| Loaded↔returned reconciliation | — | ⚠️ Gap (F3) |
| Awaiting close → close | "Awaiting Contract Close" stage + Accounting notify | ✅ (built this session) |

## Findings

### F1 — Staff-transport passenger vehicles can be double-booked same-day  · **needs approval** · High
`POST /:id/staff-transport/auto-assign` and `PUT /:id/staff-transport` (`server/routes/contracts.js`) pick passenger vehicles by fleet `status` only and exclude just this event's cargo truck. `staffTransport` is referenced in **no** same-day conflict/availability logic (cargo trucks have same-day checks; passenger vehicles don't). Two same-day events could share one van.
→ Queued as **CHANGE-002** (bug). Fix = mirror the existing same-day conflict pattern. Not auto-fixed: it touches booking logic and needs runtime verification with two same-day contracts.

### F2 — No first-class "return / pickup from venue" step · **needs approval** · Medium
Delivery is well modeled; the return leg (collect reusable items back from the venue) exists only implicitly. Drivers have no dedicated "what to collect back" checklist.
→ Queued as **CHANGE-001**. Contained (reuse load-manifest + post-event data). Deferred because it adds a view/flow (moderate), and the owner asked for "no major changes" unattended.

### F3 — No loaded-vs-returned reconciliation · **needs approval** · Medium
Post-event tracks per-item status but never compares quantity loaded out vs quantity returned, so shortages aren't surfaced systematically.
→ Queued as **CHANGE-003**. May need a small model addition (persisted "loaded qty") — researcher to confirm; treat as needs-approval.

### F4 — Build was broken (pre-existing) · **FIXED** · High
`npm run build` failed on `AccountingFinanceModule.tsx` null-safety errors. Fixed (see `changes/CHANGE-000-build-fix/`); `tsc -b` now clean. This unblocks reliable testing for every other change.

## Lighter observations (not yet queued — promote if you want them)

- **Banquet roster freeze is UI-only** — the 7-day banquet roster freeze is shown as labels but not enforced server-side (unlike the material freeze, which is enforced). Consistency item; enforce server-side or relabel. (Also in the thesis alignment report.)
- **Logistics completion vs round trip** — "Logistics 100%" ties to `assignmentStatus === 'completed'`; consider requiring the return/post-event checks (F2/F3) before 100%, so completion reflects the real round trip.
- **Driver display fallbacks** — audited; `fullName || driverId` fallbacks are in place (fixed earlier). No remaining `undefined (…)` render found in logistics views.

## What was NOT done overnight (on purpose)

Per "no major system changes" + unattended safety, F1-F3 were **researched and queued, not built**. They need either runtime verification (F1) or small persistence decisions (F3) that shouldn't be made without you. Only the genuine build-blocker bug (F4) was fixed, and it's type-verified.
