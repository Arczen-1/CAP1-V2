# Bugs & Issues Found While Building the Walkthrough

Recorded as they surface, so they survive context compaction. Each entry says
what happens, where, and why it matters.

**Status key:** 🔴 open · 🟡 open, cosmetic · 📋 note, not a defect · ✅ fixed

---

## 🔴 1. Phone format is inconsistent between Tasting and Contract

**Where:** `MenuTasting` validation vs. the contract form (Client section).

The tasting booking accepts `0917-555-0188`. The contract form requires **exactly
11 digits** and rejects that same value with *"Mobile must be 11 digits"*, so the
Client section never turns green.

**Why it matters:** a booking taken correctly at Stage 1 blocks contract creation
at Stage 3. Sales has to retype a number the system already holds.

**Suggested fix:** either apply the 11-digit rule at tasting time, or strip
non-digits when the contract form imports from the tasting.

---

## ✅ 2. `MenuTasting.menuItems` silently discards wrongly-shaped entries — FIXED

**Where:** `sanitizeMenuItems()` in `server/routes/menuTastings.js`.

The sub-document field is **`itemName`**. Posting `name` instead causes every item
to be filtered out — the request still returns **HTTP 201** with an empty
`menuItems` array. No error, no warning.

**Why it matters:** silent data loss on a successful-looking response. Hit this
directly while seeding the walkthrough scenario.

**Suggested fix:** reject entries that have a name-like key but no `itemName`,
or return a warning listing how many items were dropped.

---

## 🟡 3. Contract form: progress tracker and tab labels disagree

**Where:** contract creation form.

| Tracker says | Tab says |
|---|---|
| Client | Client Info |
| Event | Event Details |
| Menu | Package & Menu |
| **Inventory** | **Add-ons** |
| Summary | Summary |

Section 4 is called two different things on the same screen.

**Why it matters:** a user following instructions ("go to Inventory") can't find
a tab with that name. Cosmetic but confusing in a document or demo.

---

## 🔴 4. `slaWarning` is computed only on save, and never notifies

**Where:** `Contract.js` pre-validate hook; `sla_warning` in the Notification enum.

`slaWarning = now > finalDetailsDeadline && status === 'draft'`, computed in a
`pre('save')` hook. A draft nobody touches never re-evaluates, and **no sweep
scans `draft` contracts**, so nothing triggers the re-save.

The `sla_warning` notification type exists in the enum but is **never emitted
anywhere in the codebase** — zero senders.

**Why it matters:** "Awaiting Department Validation" has no enforced deadline.
A draft can sit indefinitely and nobody is told. The groundwork exists but isn't
wired up.

**Suggested fix:** a draft-stage sweep mirroring `kitchenPrepNotifications.js`,
emitting `sla_warning` to the departments still holding unconfirmed sections.

---

## ✅ 5. A payment posted without a date is stored broken and renders "Invalid Date" — FIXED

**Where:** `POST /contracts/:id/payment` in `server/routes/contracts.js`.

```js
contract.payments.push({
  ...req.body,          // no `date` fallback
  amount,
  receiptIssuedBy: 'Juan Carlos',
  receiptGeneratedAt: new Date(),
  status: req.body.status || 'completed'
});
```

`paymentSchema.date` has no default, so omitting `date` stores `undefined` and the
payment history shows **"Invalid Date"**. The request still succeeds with 200.

**Why it matters:** the amount, receipt number and reference are validated, but the
date — the field the whole collection timeline depends on — is not. Hit this while
recording the walkthrough's reservation fee.

**Suggested fix:** `date: req.body.date || new Date()`, or make it a required
validated field like `receiptNumber`.

---

## ✅ 6. `inventoryItem` is silently dropped when creating a procurement request — FIXED

**Where:** `POST /procurement-requests`.

Posting a valid `inventoryItem` id stores **`null`**. The request is created
successfully (201) and moves through quoting and accounting approval without
complaint. It only fails three steps later at fulfilment:

> *"Link this request to an inventory item before marking it fulfilled"*

**Why it matters:** the failure appears at a completely different step from the
cause, after two departments have already done work on the request. Same class as
finding 2 — a field is accepted, ignored, and the consequence surfaces late.

**Suggested fix:** persist `inventoryItem` on create, or reject the request up
front when it is missing for a `contract_shortage` source.

---

## 📋 7. Procurement approval has undocumented prerequisites

Not bugs, but they block the flow and are worth documenting for users:

- Accounting cannot approve a budget request until an **active finance budget
  exists for that month** *and* the requesting department has an allocation in it.
  Error: *"No active finance budget is set for 2026-08"*, then
  *"Stockroom / Equipment has no allocated budget for 2026-08."*
- The approval requires **all four review checklist items** confirmed
  (`inventoryNeedValidated`, `supplierVerified`, `pricingReviewed`,
  `timelineConfirmed`), otherwise: *"Confirm the accounting review checklist…"*
- Recording a payment requires a **provisional receipt number**.
- A contract cannot be approved while any item is still short — the shortage must
  be *fulfilled*, not merely requested.

---

## ✅ 8. Notification deep-links can land on the wrong tab (race on load) — FIXED

**Where:** `ContractDetail.tsx` — tab resolution.

```js
const activeTab = visibleTabs.includes(rawActiveTab) ? rawActiveTab : visibleTabs[0] || 'details';
```

`visibleTabs` is derived from role **and from the loaded contract**. Before the
contract arrives, the per-tab permission flags are false, `visibleTabs` collapses,
and `activeTab` falls back to `details`.

**Observed:** loading `/contracts/<id>?tab=logistics` as Logistics and
`?tab=banquet` as Banquet both landed on **Details**, even though both are valid
keys in `ALL_CONTRACT_TABS` and both tabs were visible once rendered.
`?tab=payments` and `?tab=inventory` did land correctly, so it is inconsistent
rather than uniformly broken — which points at a load-order race rather than a
bad key.

**Why it matters:** this is exactly what notification deep-links rely on. The
transport lead-time reminder links to `?tab=logistics`; if it lands on Details,
the "notifications take you to the work" behaviour silently degrades to
"notifications take you to the contract".

**Suggested fix:** keep the requested tab in state and re-apply it once the
contract has loaded, rather than recomputing the fallback on every render — e.g.
only fall back when `contract` is non-null and the tab is genuinely not permitted.

**How to verify:** open a logistics or banquet notification and confirm which tab
is active on arrival.

---

## 🔴 9. No event less than 6 months away can be booked anywhere in the UI

**Where:** *both* entry forms.

```js
// src/pages/NewMenuTasting.tsx
const getMinimumPreferredEventDate = () => startOfDay(addMonths(new Date(), 6));
// src/pages/NewContract.tsx:491
const getMinimumContractEventDate  = () => startOfDay(addMonths(new Date(), 6));
```

Each is used in three places — the field's initial value, the calendar's
`disabled={(date) => date < getMinimum…()}`, and the form's validation. So both
date fields open pre-filled with *today + 6 months* and grey out everything
earlier.

**Why it matters:**

- **There is no way in.** A client wanting an event in three months cannot be
  booked through the tasting module *or* the contract module. Sales has to work
  outside the system entirely.
- Nothing on screen states the rule. The user sees a date they did not pick and
  a calendar where most of the year is dead, with no explanation.
- The walkthrough's own scenario (tasting 2 Aug 2026, event 22 Aug 2026) **cannot
  be recreated through the UI at all** — the contract only exists because it was
  seeded directly. Figures 4.4 and 6.2 are framed around this: 4.4 shows the
  client sections only, and 6.2 necessarily shows the enforced default of
  *February 2nd, 2027* rather than the scenario's own event date.

**Suggested fix:** confirm whether 6 months is really the intended commercial
policy. If it is, say so next to the field. If it is not — and the seeded data
suggests it is not — relax both constants to a realistic lead time.

**Found:** while capturing Figure 4.4, then confirmed on the contract form while
capturing Figure 6.2.

---

## 🟡 10. A venue outside the catalogue loses its name

**Where:** contract form → Event Details → Venue.

The venue picker lists five venue groups plus **OTHERS / Manual venue**. Choosing
OTHERS reveals *Venue Address* and *Venue Capacity* — but **no venue name field**.
The venue is then recorded as literally "OTHERS", and the actual name survives
only if the user types it into the address line.

The walkthrough's own venue, *Lima Park Hotel – Grand Ballroom*, is not in the
catalogue, so Figure 6.2 has to show it exactly this way: Venue = OTHERS, with
the name folded into the address.

**Why it matters:** the contract summary, the logistics booking and the printed
contract all display the venue name. For any venue not in the catalogue that
name is "OTHERS".

**Suggested fix:** add a *Venue Name* field to the manual-venue branch, or let
the picker accept a typed-in venue.

---

## ✅ Fixed during this session

Kept short — these are done, listed only so they aren't re-reported.

| # | Issue |
|---|---|
| 5 | **Done tags never flipped.** `text.includes('approve')` matched *"**Approved** event ready for banquet"*, so the approval that created a task also resolved it. Resolution is now decided by notification **type** before any keyword match. |
| 6 | **Post-event alerts mis-tagged.** `paymentCompliance` stamped every alert `department: 'accounting'` and a payments-tab link — including post-event checks sent to Creative/Linen/Stockroom, which then resolved against Accounting's progress. |
| 7 | **Notification dropdown capped at 10.** `slice(0, 10)` inside a container already built to scroll; anyone with more than 10 lost access to the rest. |
| 8 | **Drivers & Trucks white-screened.** `driver.fullName.toLowerCase()` unguarded; 4 of 12 drivers had no `fullName` (inserted around the Mongoose hook). Same crash in Banquet Staff (17 of 77). Data backfilled via `server/backfillFullNames.js`. |
| 9 | **Auto-assign booked oversized vehicles.** Comment said "fewest seats first"; the sort was descending. 13 staff → 45-seat bus. Now picks the smallest vehicle that fits. |
| 10 | **Passenger vans offered as cargo trucks.** The inventory-transport list included all 29 vehicles, including 0 m³ passenger vans. Now cargo-only, enforced server-side too. |
| 11 | **Same-day conflicts missed across booking types.** A driver could haul inventory for one event and drive a staff van for another on the same date. Both pools now read one combined reservation set. |
| 12 | **Notification menu closed itself.** Defined as a component inside render, so the 30-second poll remounted it. Now a stable element, and the poll pauses while the menu is open. |

### Findings 2, 5, 6 and 8 — fixed and verified

| # | Fix | Verified by |
|---|---|---|
| **8** | **Deep-links landed on Details.** `activeTab` fell back to `visibleTabs[0]` while the contract was still loading, and an effect then *rewrote the URL*, deleting the `tab` parameter — so the requested tab was lost even after permissions resolved. Resolution and the URL rewrite are now both gated on the contract being loaded (`canResolveTabs`). | `?tab=logistics` as Logistics → **Logistics** active; `?tab=banquet` as Banquet → **Banquet** active; the query string survives in both. |
| **2** | **Menu items silently discarded.** A dish posted with `name` (or `dish`, `item`, `title`, `label`) instead of `itemName` was dropped and the request still returned 201. The route now rejects with 400 and names the offending entry and the key it used. | Wrong key → `400`, *“entry 1 used "name" instead of "itemName"”*. Correct key → `201` with the dish saved. |
| **5** | **Payment stored without a date.** `paymentSchema.date` has no default, so omitting it stored `undefined` and the history rendered **“Invalid Date”**. The date now defaults to now, and an unparseable date is rejected. | Invalid date → `400 "Payment date is not a valid date."` |
| **6** | **`inventoryItem` dropped on create.** The route read `inventoryItemId` only, so a caller posting the stored field name was ignored and the request failed three steps later at fulfilment. `request.inventoryItem` is never assigned after creation, so such a request was permanently unfulfillable. Both spellings are now accepted; for a `contract_shortage` the item is resolved from the item code or name when no id is supplied, and only an unmatchable item is rejected. | Unmatchable item → `400`; item omitted but matchable by name → `201` **with the link repaired**. |

> The contract form omits `inventoryItemId` for inventory lines with no catalogue
> link (`ContractDetail.tsx`, the `procurementRequestTarget.item.itemId` guard).
> That is why finding 6 resolves by code and name rather than simply rejecting —
> a plain rejection would have blocked a path the UI actually uses.

---

## 📋 11. The budget check runs against the request's needed-by month

**Where:** procurement budget approval.

Not a defect — but it is the trap that breaks the demonstration outline's
pre-demo step 5, so it is recorded here.

The budget check is performed against the month of the request's **needed-by
date**, not the current month. A request needed in a month with no active
finance budget is refused with *“No active finance budget is set for 2026-03”*
rather than a shortfall.

**Consequence for the demo:** `PR-26-0007` (Creative · Tropical Entrance) is
needed by **30 March 2026**, so lowering the *August* Creative allocation cannot
block it. **`PR-26-0030` is the only queued request whose needed-by date falls
inside August 2026.** The Demo Kit uses it, with Stockroom lowered to ₱1,000.

Worth knowing for narration: the refusal reports the **available** figure, which
is the allocation *less* what is already committed and spent — it read
`-1250` against a ₱1,000 allocation with ₱2,250 already committed.

---

## Notes for the defense

Items 1–4, 9 and 10 are worth mentioning as *known limitations* rather than
hiding — a panel that finds an issue you already documented reads very
differently from one that finds an issue you didn't. Item 4 in particular pairs
with the "what prompts the user" theme: it's the one lifecycle stage with no
clock-based prompt.

**Item 9 is the one to prepare for.** A panelist who opens either booking form
will see a date they didn't choose and a calendar that refuses most of the year,
within a minute. Know the answer before you are asked: is a 6-month minimum
booking lead the real business rule, or a placeholder that was never revisited?
The seeded demo data — events days away, not months — suggests the latter.
