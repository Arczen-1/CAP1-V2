# Current Business Rules (Appendix H)

**Source:** Thesis Appendix H "Current Business Rule" — PDF pp.137–138 (printed A-36/A-37); corroborated by Appendix I "Juan Carlo Third Interview" (PDF pp.138–140). See [thesis-index.md](thesis-index.md).
**Revised:** 6 August 2026, against the client's restatement of the rules.

> These are **Juan Carlo's actual, client-provided business rules**, and they supersede the earlier version of this appendix. They are the authoritative basis for the payment, logistics, freeze, and post-event behaviour of the system.
>
> ⚠️ **The system has not yet been updated to five of them.** The rules below are correct as written; the code is what lags. [What the system must change](#what-the-system-must-change) lists each gap as work to be done, not as an open question — with one exception, noted there, that cannot be implemented as stated.

---

## 1. Payment and billing

Payment structure depends on the client type.

- **Corporate clients** follow an extended payment cycle: settlement may run to **one, two, or three months after the service is delivered**. *(New — not previously documented.)*
- **Special events** follow a split schedule: **40% down payment** collected at the start, with the remaining **60% due exactly one month before the event date**, to limit the company's exposure.
- The **₱30,000 reservation fee** is collected at booking to hold the schedule, is **strictly non-refundable**, and counts toward the first collection.
- A **40% not received by its due date** enters a **30-day aging period**, after which it may be classified uncollectible.
- A **60% unpaid past its due date** places the contract **on hold** — preparation, release, and execution are blocked — until it is settled or **management releases the hold**. Neither the 40% nor the reservation fee is refunded automatically.
- Clients may **pay in full early** at any time.

## 2. Booking confirmation

- A booking is **confirmed in the system once the client completes a food tasting and confirms their satisfaction**. This may happen **before any payment is made**.
- Payments are posted only **after the contract is signed**.

## 3. Data confidentiality

- Once event data is encoded, **each department sees only the details relevant to its own operational workflow**.
- **Package price and total contract value are authorised for the Accounting Department only.** All other departments are restricted from viewing them.

## 4. Service level agreements and timelines

- **All final event details must be confirmed exactly one month before the event date**, to align with the kitchen's **one-month ingredient preparation SLA**.
- **Logistics timeline**, in mandatory order:
  1. Equipment placed in the **staging area two days before** the event.
  2. Equipment **loaded into the trucks one day before** the event.
  3. Equipment **dispatched to the site on the day** of the event.
- Any department requiring transportation must **file a vehicle request form exactly three days before the event**, so Logistics can plan the allocation of trucks and drivers.
- **Material freeze:** seven days before the event, assigned materials are locked to that event and cannot be offered to or used by another. *(Carried from the previous version; not restated by the client, so retained pending confirmation.)*

## 5. Resource allocation

- **Waitstaff follow assigned brackets based on total guest count** — for example, **50 waiters for an event of 1,000 pax**.
- The banquet plan is role-based: head captain, servers, food runners, bussers, bartenders, setup crew.
- **Truck assignment is determined by measuring the required equipment in cubic metres.** Where the load exceeds the company's internal logistics capacity, **additional trucks must be rented**.

## 6. Post-event accountability

- Staff and logistics teams **may not pack up and leave the venue until the equipment loaded back into the trucks matches the inventory checklist** of what was brought to the event.
- A **variance between the counts** goes to the missing-and-damaged summary; unresolved losses may be charged unless the supervisor files a valid counter-report.
- **On-site incidents** — for example a tablecloth burnt by a food heater, or damaged equipment — must be **formally logged in an incident report by the time staff return to the office the following day**.

---

## What the system must change

The rules above are the standard. The list below is the work needed to bring the code to them, in the order it should be done.

| # | Rule to implement | Code affected | Effort |
|---|---|---|---|
| 1 | Waitstaff **50 per 1,000 pax** | `routes/contracts.js` staffing suggestion, `routes/reports.js` forecast | Small — one constant, two call sites |
| 2 | Price visible to **Accounting only** | `canViewContractFinancials`, PDF redaction, hold banner | Small — one allow-list |
| 3 | Kitchen sourcing alert at **one month** | `kitchenPrepNotifications.js` | Small — one window |
| 4 | **Staging** step two days before the event | Contract stage model, logistics workflow, load readiness | Medium — a new state, not just a date |
| 5 | 60% due **one month** before the event | `paymentCompliance.js`, `getPaymentMilestones`, Table A.1 | **Blocked — see below** |

### Notes on each

**1 · Waitstaff.** Change the divisor from 25 to 20 so a 1,000-pax event derives 50. One caution: the client describes **assigned brackets**, not a ratio. A flat 1 : 20 reproduces the 1,000-pax example but may not match the smaller brackets. Implement 1 : 20 now; ask for the full bracket table and replace the ratio with a lookup if one exists.

**2 · Price visibility.** Remove Sales and Admin from the allow-list. Worth confirming in passing that Sales is genuinely meant to be excluded — it would leave them unable to see the value of the contract they are selling — but the rule as written says Accounting only, so that is what goes in.

**3 · Kitchen sourcing.** Move the sourcing alert from two weeks to one month. The seven-day preparation alert stays: the client's one month is the *ingredient* SLA, and the seven-day window is when cooking may begin. Both survive.

**4 · Staging.** The system currently goes from prepared straight to loaded. This adds a real state between them, with its own two-day deadline, and touches the logistics workflow and the load-readiness board. The largest of the four buildable items.

**5 · The 60% due date — cannot be implemented as stated.** Moving the 60% to one month before the event puts it on the **same day** as the existing rule that an unsettled balance cancels the booking one month out. The balance would become overdue and the booking would be cancelled on the same date, leaving no window in which to collect — the hold, the reminders, and the recovery period would all have nothing to act in.

This is a collision between two rules, not a coding problem, so it needs the client rather than a decision here. Two ways it resolves:

- The 60% is due one month before, and **cancellation moves later** (say, two weeks before, or the event date itself); or
- The 60% stays at two months before, and **one month is the cancellation deadline** — which is what the system does today.

**Leave the code at two months until this is answered.** Changing it first would produce contracts that are cancelled the moment they fall overdue.

---

## Traceability to the system

| Business rule | System behaviour | Status |
|---|---|---|
| ₱30,000 non-refundable reservation fee | Recorded separately, counted in the first collection | Implemented |
| 40% due two months after booking, 30-day aging | Payment compliance sweep, escalating alerts | Implemented |
| 60% unpaid → automatic hold, auto-release on settlement | Hold logic, weekly reminders while held | Implemented — **at 2 months; change 5 is blocked** |
| Corporate extended payment cycle | — | **Not implemented** — new rule, no due-date logic for it yet |
| Booking confirmed on tasting, before payment | Tasting → contract → payment order enforced | Implemented |
| Departmental data restriction | Role-based access control | Implemented |
| Price and contract value restricted | Hidden on screen, in exported PDFs, and in the hold banner | **Change 2** — currently Sales/Accounting/Admin |
| Final details one month before the event | SLA deadline recorded | Implemented |
| Kitchen ingredient preparation window | Sourcing and preparation alerts | **Change 3** — sourcing moves from 2 weeks to 1 month |
| Material freeze seven days before | Enforced server-side; like-for-like replacement permitted, with an incident | Implemented |
| Staging two days before the event | — | **Change 4** — not modelled |
| Loading the day before, dispatch on the day | Load manifest, driver pickup checklist, dispatch | Implemented |
| Transport request three days prior | Lead-time warning and reminder notification | Implemented — **advisory, not blocking** |
| Waitstaff by guest count | Suggested plan derived from pax | **Change 1** — currently 1 : 25, must be 50 per 1,000 |
| Truck assignment by cubic metres; rent if over capacity | Load volume estimate, rental requisition path | Implemented |
| No leaving until returned equipment matches the checklist | Return checklist and return reconciliation | Implemented |
| Incidents logged by the next office day | Incident register linked to contract and item | Implemented |

## Still to confirm with the client

These do not hold up the four buildable changes. The first is the only one blocking work.

1. **Blocking.** If the 60% is due one month before the event, when is a booking cancelled for non-payment? As stated, the balance falls overdue and the booking is cancelled on the same day, leaving no window to collect.
2. What are the **other waitstaff brackets**? The rule is described as brackets, and 50 per 1,000 is one point on the scale — a flat ratio may not fit the smaller events.
3. For **corporate clients**, what starts the one-to-three-month clock — the event date, or the invoice date? And is a corporate booking held without a down payment?
4. Should the **three-day transport request** block the booking, or stay a warning as it is now?
5. Does the **two-day staging** step need to be tracked in the system, or is it managed on paper in the warehouse?
