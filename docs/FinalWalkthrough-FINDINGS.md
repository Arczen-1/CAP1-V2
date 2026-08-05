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

## ✅ 12. Recurring reminders were throttled by notification *type*, not by their own series — FIXED

**Where:** `server/paymentCompliance.js` · `notifyRolesRecurring`.

The weekly reminders (*“Still uncollected after N days”*, *“Still on hold after
N days”*) decide whether enough time has passed by looking at the newest
notification **of the same `type`** on that contract:

```js
const [latest] = await Notification.find({ contract: contract._id, type })
```

But `payment_followup` is not exclusive to the weekly reminder — *“Start 40%
collection follow-up”* uses it too. Any other alert sharing the type resets the
clock, silently pushing the next weekly reminder back by a full 7 days. The same
applies to `contract_on_hold`.

**How it surfaced:** a probe contract created 10 days overdue received its
follow-up and its due-date task in the same sweep, and the weekly reminder then
suppressed itself because a `payment_followup` had been written seconds earlier.

**Real-world reach:** narrow but genuine. In normal operation the follow-up
fires a month before the due date, so by day 7 overdue the gap already exceeds
7 days. It bites whenever two `payment_followup` alerts land within a week of
each other — which is exactly what a compressed or back-dated contract does.

**Fix:** the reminder now identifies its own series and matches on it, so
unrelated alerts of the same type cannot delay it.

```js
const [latest] = await Notification.find({
  contract: contract._id,
  type,
  title: new RegExp(`^${series.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
})
```

Both call sites pass `series` (`'Still uncollected after'`,
`'Still on hold after'`).

**Verified by:** probe contract D (10 days overdue) fires
*“Still uncollected after 10 days”* after the fix and did not before; re-running
the sweep still produces no duplicates.

---

## 📋 13. The 60% already had an advance warning — the gap was on the 40% side

Recorded because it corrects an earlier reading of the code.

The two collection ladders looked asymmetric: the 40% appeared to have an
advance warning that the 60% lacked. It does not. `final_balance_due` fires at
`finalBalanceDueDate − 1 month`, the exact counterpart of the 40% follow-up. It
is easy to miss because it sits at the **bottom** of the unpaid branch, below
several `continue` statements that return early.

The genuine gap was the opposite one: the 60% gained a 3-day final notice before
auto-cancellation, while the 40% went straight from a weekly reminder to being
written off. That is what was added (see the ladders below).

**Both ladders, after this change:**

| Stage | 40% collection | 60% final balance |
|---|---|---|
| Advance warning | `Start 40% collection follow-up` — due − 1 month | `Final balance due <date>` — due − 1 month |
| Due date | `40% collection task` | hold placed · `contract_on_hold` |
| Recurring | `Still uncollected after N days` — weekly | `Still on hold after N days` — weekly |
| Final notice | **`Final notice - N days before write-off`** — 3 days out ← new | `Final notice - N day(s) to settle` — 3 days out |
| Terminal | `Account uncollectible` — day 30 | contract cancelled · resources released |

The weekly reminder now stops once the final notice takes over, so the last
three days carry one clear message instead of two overlapping ones.

The existing `final_balance_due` message was also extended: it previously ended
at *“placed on hold automatically”*, which is no longer where the story ends. It
now names the settlement deadline and the cancellation.

---

## ✅ 14. Logistics could see what to bring, but not whether it could go — FIXED

**Where:** `src/pages/dashboards/LogisticsDashboard.tsx`, and now
`server/loadingReadiness.js` + `server/loadingReadinessNotifications.js`.

Panel comment (post-defense): the load manifest shows what to load, but the
system was marketed as improving decision making, and nothing indicated whether
trucks were actually ready for loading.

**The concrete defect.** The dashboard's "Next Step" was derived from two inputs
only — days until the event, and whether a truck was booked. It had no awareness
of preparation at all, so on the eve of an event whose linen had not been washed
it still read:

> Dispatch and loading window — *The event is immediate. Confirm loading, travel
> timing, and on-site arrival.*

Meanwhile the server was already computing `allItemsReady` across the three
inventory groups and the frontend typed it but never rendered it. The signal
existed and was discarded. `allItemsReady` also excluded the kitchen and could
not say *which* department was outstanding.

**What was added.**

| Piece | Where | What it decides |
|---|---|---|
| Readiness calculation | `server/loadingReadiness.js` | Per-department: Kitchen, Stockroom, Linen, Creative. One definition, shared by the API, the dashboard and the sweep. |
| Dashboard roll-up | Logistics dashboard | "Ready To Load" / "Not Ready" cards, a **Not Ready** tab, a per-row badge, and a next step that names the blocking department. |
| Manifest banner | Contract → Logistics tab | Ready / not ready above the manifest tables, with each department's state. |
| Clearance alert | sweep | `Cleared for loading` once every department has finished, within 7 days of the event. |
| Escalation | sweep | At T−2 `Not ready for loading` to Logistics, and `Prepare items before loading starts` to each blocking department. |
| At-risk alert | sweep | At T−1 `Loading window open - event not ready`, and `Loading is waiting on <department>`. |

**Why the escalation matters more than the clearance.** An event that is ready
needs no decision. If clearance were the only signal, silence would be ambiguous
— "not ready" and "nobody updated the record" would look identical, and neither
can be acted on. The escalation names the department and the outstanding count,
which is the actual decision: chase, re-sequence, or accept the risk.

**Timing basis.** Loading may begin the day before the event — already stated on
the load manifest. `READINESS_DEADLINE_DAYS` is derived from that
(`LOADING_STARTS_DAYS_BEFORE + 1`) rather than being a new rule.

**Design note — departments with nothing assigned.** A department with no items
is *not applicable*, not ready. Counting it ready would let an event with nothing
prepared anywhere announce itself clear to load. A contract with no requirements
at all is never announced.

**Honest limitation for the defense:** this is only as truthful as the
preparation statuses departments actually maintain. If they do not mark items
prepared, a green clearance would be misleading. The escalation path is the
primary feature and degrades correctly — chasing a department that has not
updated its records is still the right action.

**Verified by:** 24 checks — 10 on the readiness calculation directly (including
the empty-contract and not-applicable cases), 14 driving the real sweep with
five probe contracts covering cleared, escalated at T−2, at-risk at T−1, silent
five days out, and silent while on payment hold; plus sweep idempotence and an
unchanged-demo-estate check. Then walked through the running app as the
logistics user, which caught two further defects the tests could not.

### 14a. The next step hid the readiness blocker behind a missing truck — FIXED

Found only by looking at the screen. `DEMO-R5-FREEZE` is two days out with
Kitchen outstanding **and** no truck booked. The no-truck branch returns first,
so the one line the user reads said only *"Book truck and assign driver"* — half
the problem, on the row whose whole purpose is to state the decision.

The truck still leads (it is the harder blocker), but inside the loading window
the step now names both: *"Book truck - and Kitchen not ready"*, with the
outstanding detail in the note.

### 14b. The load manifest marked unprepared dishes as "Prepared" — FIXED

The readiness banner and the table beneath it contradicted each other on screen:
the banner said *Kitchen — ingredients not sourced yet*, while all four dishes
showed **Prepared**.

The banner was right. The manifest computed a dish's status as:

```js
status: (item.confirmed || contract.ingredientStatus === 'prepared') ? 'prepared' : 'pending'
```

`confirmed` means *the client confirmed this dish*, not *the kitchen prepared
it*. The system's own definition requires both — `kitchenReady` in
`routes/contracts.js` is `menuItems.every(item => item.confirmed) &&
contract.ingredientStatus === 'prepared'`, and the ingredient-status route
refuses to accept `prepared` while any dish is unconfirmed.

Because the manifest used **OR**, every dish appeared prepared as soon as the
menu was confirmed — months before the kitchen touched it. This is a
pre-existing defect that predates this change, and it overstated readiness on
the exact screen Logistics uses to decide whether to load. Now `&&`, matching
the server. `getLoadingReadiness` checks the same pair for the same reason.

---

## ✅ 15. Two events renting the same item were two unrelated approvals — FIXED

**Where:** `server/procurementOverlap.js` (new), the procurement request endpoints,
the accounting approval queue and the purchasing dashboard.

Panel comment (post-defense), raised during the accounting procurement
demonstration: if two events request a rental of the same thing, wouldn't it be
better to buy it — and how would Accounting or Purchasing even know?

**The defect.** Every procurement request was judged on its own. The list
endpoint sorted them and returned them; nothing compared one request against
another, so two events renting the same tent were two unrelated approvals and
the pair was invisible. The data to answer the question already existed —
`requestType: 'purchase' | 'rental'`, a link to the inventory record,
`quote.quotedTotal`, rental windows, and purchase prices on the inventory
models. Only the comparison was missing.

**Why "two rentals means buy" is the wrong rule.** Buying only helps when the
rentals do **not** overlap in time. One owned tent covers two events on separate
weekends; it cannot cover two events on the same Saturday. A naive count-based
rule would recommend buying a single chair cover to solve a same-day shortage of
180 — which is exactly the shape of the `DK-SAMEDAY-A` / `DK-SAMEDAY-B` scenario
already in the demo data.

So the comparison is made against the **peak units required at any one moment**,
computed by a sweep over the rental windows, rather than against the number of
requests. Count is the trigger; cost is the recommendation.

| Recommendation | When |
|---|---|
| `buy` | ≥2 decidable rentals of one item and the purchase cost of the peak units is below the combined rental cost |
| `keep_renting` | the comparison is possible and renting still wins |
| `compare_manually` | a quote or a purchase price is missing, so no honest number can be produced |

**Deliberate limits.**

- **The system recommends; a person decides.** Approving still rents. Nothing
  auto-converts a rental into a purchase — that is a capital decision.
- **It stays quiet when it cannot be sure.** A missing quote or an unpriced
  inventory record produces `compare_manually` naming what is missing, not a
  confident wrong number.
- **Estimates are declared.** A request without a quote is priced from the
  inventory daily rate. That is useful, but an estimate presented as a quote is
  how an approval gets made on a number nobody agreed to, so `estimated` is
  flagged and both the panel and the notification say so.
- **`savings` is never negative.** It returned `-42,000` when renting won, which
  a card would have rendered as "saves -₱42,000". It is now a positive saving or
  zero; renting winning is expressed by the recommendation.
- **The purchase-price field is normalised in one place** — `purchasePrice` on
  stockroom, `pricePerItem` on creative and linen.
- **Filtering cannot hide a duplicate.** The index is always built over every
  decidable request, not the subset a query returned.

**Honest limitation for the defense:** this compares cost, not utilisation. Two
rentals a year of an item owned for a decade may still be worth buying for
reasons the number does not capture, and one purchase that beats two rentals may
still be wrong if the item then sits idle. `StockroomInventory.totalRentals`
would support a "rented six times this year" signal, but creative and linen do
not track it, so it was left out.

**Demo fixtures** (seeded, DK-prefixed, idempotent):

| Requests | Dates | Result |
|---|---|---|
| `DK-PR-0005` / `0006` — Reception Tent | separate | **Buying wins** — rent ₱23,000 vs buy 1 unit ₱18,000, saves ₱5,000 |
| `DK-PR-0007` / `0008` — Stage Riser | same day | **Renting wins** — 2 units needed at ₱52,000 vs ₱18,000 to rent |

**Verified by:** 37 checks — 30 on the calculation (item identity, peak
concurrency, the same-day trap at scale, missing quote, unpriced inventory,
estimate flagging, single request, rental+purchase mix) and 7 through the live
annotation path. Confirmed through the real authenticated endpoint, and the
creation notification was exercised end to end: the browser pane double-fired
the POST and only one notification title was produced, which demonstrated the
dedupe. Both panels were then read and screenshotted on both screens — the
accounting Budget Approval Queue and the purchasing Waiting Budget Approval tab
— with no console errors introduced.

**Pre-existing, unrelated:** a Radix `DialogContent requires a DialogTitle`
accessibility error fires on both dashboards. No dialogs were added or changed
by this work; it predates it and is left alone.

### 15a. The recommendation had no follow-through — FIXED

Asked during review: *if they do want it purchased instead, how do they go about
it?* The honest answer was that they couldn't, cleanly.

**The gap.** `requestType` is immutable — no endpoint converts a rental into a
purchase. There is no cancel action either: the schema has a `cancelled` status
but **no route ever sets it**. So acting on the recommendation meant Accounting
returning the rentals as `rejected`, then Purchasing manually retyping a new
purchase request. Three problems with that: nothing enforced the quantity (the
peak-units number is exactly what a human retyping would get wrong), "rejected"
reads as *Purchasing erred* rather than *we chose to buy*, and nothing linked
the purchase to the rentals that caused it.

**Role constraint that shaped the fix.** Accounting is not in
`CREATE_ACCESS_ROLES` — it cannot raise procurement requests at all. Verified
live: an accounting POST to `/procurement-requests` returns **403**. That is
correct organisationally (Accounting releases money, Purchasing sources), but it
means the two screens need different follow-through.

| Screen | Action | What it does |
|---|---|---|
| Purchasing | **Raise purchase instead** | Opens a pre-filled dialog — quantity = peak units needed, needed-by = earliest of the rentals, reason pre-written. The person still reviews and submits. |
| Accounting | **Recommend purchase to Purchasing** | Opens the Return dialog with the full comparison already written into the note. |

Both buttons appear only when the recommendation is `buy`; the same-day
`keep_renting` case correctly shows none.

**New `replacesRequests` field** links a purchase to the rentals it replaces.
The ids are **validated, not trusted** — they must exist, still be open, be
rentals, and refer to the same item, or the request is rejected. A false audit
link is worse than none. On success the link is written **both ways**.

**Two deliberate calls.**

- **The rentals are not auto-closed.** If the purchase is refused on budget, the
  rental fallback has to still be there. A person returns them.
- **The unused `cancelled` status was not repurposed.** It would read more
  honestly than `rejected`, but it means touching status handling the whole
  queue depends on. The return note carries the real reason instead — same audit
  value, none of the risk.

**Verified live through the real endpoint:** all three validation rejections
(a rental cannot replace rentals; a different item is refused by name; an
unknown id is refused), the successful path (purchase raised at quantity 1 — the
peak units, not the request count), the two-way link recorded, **both rentals
confirmed still `awaiting_accounting_approval`**, and the notification to
Accounting and Admin. Both dialogs were opened and screenshotted. Probe records
were then deleted and the demo kit re-seeded, leaving `DK-PR-0005` / `0006` with
clean notes.

### 15b. Nothing stopped a second purchase being raised — FIXED

Asked during review: *when a purchase is raised, does it indicate that it
already has?* Barely, and not enough to matter.

**The gap.** `purchaseRequestCount` was computed server-side and **never used in
the UI**. The existing purchase appeared as a single line in "Also requested by",
styled identically to the rentals, and the **Raise purchase instead** button was
gated only on `recommendation === 'buy'` — nothing about whether a purchase
already existed. Two people looking at the two rentals could each raise a
purchase, and the system would take both. For a capital item that is an
expensive mistake to undo.

**Fix, in three parts.**

- **A server guard.** Raising a purchase whose `replacesRequests` overlaps a
  rental already covered by an open purchase returns **409**, naming the
  existing request. This catches the partial case too — replacing just one of
  the two rentals is still blocked.
- **The panel states it.** When any related request is a purchase, an
  "A purchase has already been raised" notice replaces the action button,
  listing the request number and quantity. Decided inside `RentVsBuyPanel`
  rather than on each screen, so Accounting and Purchasing cannot drift apart.
- **Purchases read differently.** In the "Also requested by" list a purchase is
  emphasised rather than reading like another rental — it is the one line that
  changes what to do next.

**Verified live:** first purchase 201; an identical second 409; a partial
overlap (one of the two rentals) also 409. In the UI, both flagged rentals lost
the button and gained the notice.

**Emergent behaviour worth knowing:** the purchase also appears in the panel's
"Also requested by" list, so the item's full picture — two rentals and the
purchase raised against them — reads from one place.

### 15c. Approving both the rental and its replacement purchase — FIXED

Asked during review: *if Purchasing has already sent the rental to Accounting
and then raises a purchase on it, won't that confuse Accounting?*

**What was already fine.** A newly raised request starts at `requested`, and the
accounting queue only lists `awaiting_accounting_approval`. So the purchase goes
to Purchasing for a quote first — Accounting's queue does not grow a third item
out of nowhere. The rental cards also already carried the "a purchase has
already been raised" notice from 15b.

**The genuine hole.** Nothing stopped Accounting approving the rental anyway and
then approving the purchase a week later when it arrived quoted — paying twice
for the same need. The queue card said so; the approval dialog, where the money
is actually committed, did not.

**Fix — warn at the point of commitment, never block.** Blocking would be wrong:
if the purchase is refused on budget, approving the rental is the correct call.
So the approve dialog now states the conflict and leaves the decision open.

| Approving | Warning |
|---|---|
| a **rental** with an open purchase against it | red — *"A purchase is already open for this item… Approving this rental as well would pay for the same need twice. Approve only if the purchase is being refused."* |
| a **purchase** whose rentals are still open | amber — *"This purchase replaces DK-PR-0005, DK-PR-0006, which are still in the queue. Approving this does not close them. Return those rentals after approving, or the item may be rented as well."* |

`replacesRequests` is now populated on the request so the warning can name the
counterpart requests rather than showing raw ids.

**Verified live:** the rental warning fired on `DK-PR-0005` with `PR-26-0053`
open against it; the purchase warning fired on `PR-26-0053` naming both rentals;
each appeared only on the correct side. Probe records deleted and the demo kit
re-seeded, leaving `DK-PR-0005` / `0006` clean.

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
