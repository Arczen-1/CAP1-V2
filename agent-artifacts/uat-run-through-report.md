# UAT Run-Through Report — Department Perspective (Juan Carlo)

**Date:** 2026-07-26 · **Branch:** CAP2 · **Tester role:** acting as each department, from Juan Carlo's operational perspective.

**Method (honest note):** This is a **code-grounded UAT (test-by-inspection)** of the full lifecycle and the requested scenarios, plus the **live checks run this session** (full `npm run build` ✓, `npm run lint`, and the same-day staff-transport double-booking test ✓). It is not a full manual click-through of every screen; findings cite the code path so they can be reproduced/confirmed in the UI. Each finding is tagged **[Department] · [Scenario] · Severity** with evidence and a "what could be better."

---

## Part 1 — Lifecycle run-through

| Stage | Department | Result | Notes |
|---|---|---|---|
| **Menu booking** | Sales | ⚠️ Works, one gap | Booking blocks duplicate active email; slot list shown. **Slot double-booking not enforced on save** (F1). |
| **Contract creation** | Sales | ✅ | Draft save; payment term shows "N/A" until confirmed; routes to departments on approval. |
| **Accounting / payment** | Accounting | ✅ Strong | Role-gated; receipt required; amount ≤ remaining balance; **payments only after client-signed** (Appendix H); milestone + auto-hold engine (`paymentCompliance.js`). |
| **Approval → prep hand-off** | Accounting → all | ✅ | Approve blocked until conflicts/procurement resolved; departments notified. |
| **Pre-event: Kitchen** | Kitchen | ✅ | Menu checklist gates ingredient prep; 2-wk/7-day reminders; can't mark ready before checklist. |
| **Pre-event: Banquet** | Banquet | ⚠️ Works, one gap | Staff assignment + supervisor validated; payment-hold gated. **7-day roster freeze is UI-only, not server-enforced** (F2). |
| **Pre-event: Logistics** | Logistics | ✅ (fixed) | Truck/driver booking; staff transport auto/manual; **same-day vehicle double-booking now prevented** (CHANGE-002, verified). |
| **Pre-event: Inventory (Creative/Linen/Stockroom)** | Inventory depts | ✅ | Item validation; same-day availability; **material freeze enforced** server-side. |
| **Procurement** | Purchasing/Accounting | ✅ Strong | Quote → budget-checked accounting review → proof → fulfilled. One low finding (F3). |
| **Post-event checks** | Inventory/Logistics | ✅ | Per-item post-event status; **return checklist + reconciliation** (CHANGE-001/003). |
| **Closing** | Accounting | ✅ | Closure gated on event-passed + fully paid + logistics completed + checks done; "Awaiting Contract Close" + ready-to-close alert. |

## Part 2 — Scenario results

- **Two same bookings (same-day) — [Sales/Accounting/Logistics]:** Contract-level handling is solid — **venue conflict** flagged and blocks approval (`buildVenueConflictIssues`), **same-day inventory reservations** computed and surfaced, **vehicle** conflict now prevented (cargo + staff). **Gap:** the *tasting* slot itself can be double-booked (F1).
- **Inventory conflict — [Creative/Linen/Stockroom]:** ✅ Same-day available quantity computed (`getDateAvailableQuantity`); shortages + same-day conflict surfaced with **alternative suggestions**; approval blocked until covered (procurement). Well-handled.
- **Procurement request — [Purchasing/Accounting]:** ✅ Robust: request → quote → accounting budget check (`getBudgetCheckForRequest`) → approve/reject with reason → record proof. Minor: creation not role-restricted (F3).
- **Banquet staff + logistics in pre-event — [Banquet/Logistics]:** Assignment flows work; logistics staff transport fixed. **Gaps:** banquet roster freeze not enforced (F2); verify the guest-based waitstaff bracket (F4).

---

## Part 3 — Findings (bugs / gaps / improvements)

### F1 — Tasting slot can be double-booked · **[Sales · Menu Booking]** · **[Scenario: two same bookings]** · Medium · ✅ FIXED (2026-07-26)
> Fixed: `POST /api/menu-tastings` now rejects a booking whose date+time slot is already booked/confirmed (`server/routes/menuTastings.js`). Syntax-checked.
`POST /api/menu-tastings` validates a duplicate **email** but does **not** check the requested **date + time slot** against existing bookings. `GET /slots/available` computes free slots for the UI only. Two different clients (or a direct API call / race) can book the same date+time.
- **Evidence:** `server/routes/menuTastings.js:196-207` (email check only), `:373-400` (slots advisory).
- **Better:** on create, reject if `tastingDate` + `tastingTime` is already `booked`/`confirmed` (reuse the `slots/available` query) — mirrors the same-day conflict pattern already used for venue/vehicles.

### F2 — Banquet 7-day roster freeze not enforced server-side · **[Banquet · Pre-event]** · **[Scenario: banquet staffing]** · Medium · ✅ FIXED (2026-07-26)
> Fixed: `PUT /:id/banquet-assignment` now blocks non-admin roster changes within 7 days of the event (reuses `isMaterialFreezeActive`), matching the material freeze; admin can override for late replacements. Syntax-checked. Note: this also blocks first-time roster setup inside the window for non-admins (by design; admin can do it).
The one-week banquet roster freeze is shown as UI labels ("Roster Frozen / Freeze Required") but the `PUT /:id/banquet-assignment` route does not block roster changes inside the 7-day window — unlike the **material freeze**, which *is* enforced (`isMaterialFreezeActive`, contracts.js:2031/3223).
- **Evidence:** banquet-assignment route validates supervisor + payment hold only; no freeze check.
- **Better:** enforce like the material freeze (block roster edits within 7 days unless admin/management override with a recorded reason). Appendix H documents freeze/SLA rules.

### F3 — Procurement request creation not role-restricted · **[Purchasing · Procurement]** · **[Scenario: procurement request]** · Low
`POST /api/procurement-requests` uses `auth` but no `requireRole`, so any authenticated role (incl. kitchen/banquet) can create an inventory procurement request.
- **Evidence:** `server/routes/procurementRequests.js:391`.
- **Better:** restrict to requesting departments (creative/linen/stockroom/logistics/purchasing/admin), or confirm this is intended and document it. (Requester role is recorded, so impact is low.)

### F4 — Confirm guest-based waitstaff bracket (1 waiter / 25 guests) · **[Banquet · Pre-event]** · Low / verify
Appendix H specifies waitstaff ≈ 1 per 25 guests + role-based banquet plan. The system has banquet staffing suggestions, but the exact 1:25 bracket wasn't verified in this pass.
- **Better:** confirm the suggestion engine uses the 1:25 ratio (and the role plan), so it matches the documented rule.

### F5 — Single large JS bundle (no code-splitting) · **[Global · Performance]** · Low
Production build emits one ~1.75 MB JS chunk (Vite warns >500 kB). Slower first load, especially on the "mobile status-check" use case.
- **Evidence:** `npm run build` output.
- **Better:** route-level `React.lazy()` / `manualChunks` to split by dashboard/module.

### F6 — Build/tooling warnings & lint debt · **[Global · Maintainability]** · Low
`postcss.config.js` / `eslint.config.js` "module type not specified" warnings; browserslist data 7 months old; 268 lint items (mostly `no-explicit-any` + unused-vars — style, not defects).
- **Better:** add `"type": "module"` (or rename configs to `.mjs`), `npx update-browserslist-db`, and chip away at `any`/unused over time. Not urgent.

---

## Confirmed strengths (balance)

- **Payment/accounting** matches Appendix H (post-after-signed, ≤ balance, role-gated, milestone + auto-hold).
- **Same-day conflict detection** for venue, inventory, and vehicles (vehicle fix verified).
- **Material freeze** enforced server-side.
- **Procurement** budget-checked end to end.
- **Financial confidentiality** (price/value redacted for non-finance) — Appendix H rule.
- **Post-event**: return checklist + reconciliation + incident reporting + "Awaiting Contract Close".

## Suggested queue (if you want these fixed)

| ID (suggested) | Finding | Priority |
|---|---|---|
| CHANGE-004 | F1 tasting slot double-booking | Medium |
| CHANGE-005 | F2 enforce banquet roster freeze server-side | Medium |
| CHANGE-006 | F3 restrict procurement-request creation | Low |
| — | F4 verify 1:25 waitstaff bracket | Low |
| — | F5 code-splitting; F6 tooling/lint | Low |
