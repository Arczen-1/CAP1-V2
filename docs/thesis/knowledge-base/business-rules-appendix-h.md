# Current Business Rules (Appendix H)

**Source:** Thesis Appendix H "Current Business Rule" — PDF pp.137–138 (printed A-36/A-37); corroborated by Appendix I "Juan Carlo Third Interview" (PDF pp.138–140). See [thesis-index.md](thesis-index.md).
**Revised:** 6 August 2026, against the client's restatement of the rules.

> These are **Juan Carlo's actual, client-provided business rules**. They are the authoritative basis for the payment, logistics, freeze, and post-event behaviour in the system.
>
> ⚠️ **The client's restatement differs from the previous version of this appendix in five places, and the system implements the previous version.** The rules are written below as the client states them. Every difference is listed in [Where the system differs](#where-the-system-differs) — do not treat the two as reconciled.

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

## Where the system differs

Five rules in the restatement do not match what the system enforces. Each needs a decision: **change the code**, or **go back to the client** because the restatement was loose. Leaving them is the one option that does not work, because the thesis and the system would then contradict each other in front of the panel.

| # | Rule | Client now says | System does | Weight |
|---|---|---|---|---|
| 1 | 60% due date | One month before the event | **Two months** before | **High** — drives the auto-hold, the sweep, and Table A.1 |
| 2 | Price visibility | Accounting **only** | Accounting, **Sales, Admin** | **High** — Sales cannot quote without the package price |
| 3 | Kitchen SLA | **One month** ingredient preparation | Sourcing at **2 weeks**, prep at **7 days** | **High** — changes when the kitchen is told to act |
| 4 | Waitstaff | **50 per 1,000 pax** (1 : 20) | **40 per 1,000** (1 : 25) | **High** — ten more staff on a 1,000-pax event |
| 5 | Staging | Staging area **2 days** before | No staging step; loading begins the day before | **Medium** — a step not modelled at all |

### Notes on each

**1 · The 60% due date.** The largest single change. The collection timeline, the automatic hold, the final settlement deadline, and Appendix A Table A.1 are all built on *event minus two months*. Moving it to one month compresses the recovery window, and it would then fall on the **same day** as the existing rule that an unsettled balance cancels the booking one month out — leaving no gap between "overdue" and "cancelled". **Confirm before changing anything.**

**2 · Price visibility.** The previous appendix said "Accounting and Sales"; the system also allows Admin. Restricting to Accounting alone would leave Sales unable to see the value of the contract it is selling, which is unlikely to be intended. **Most probably the client means "not the operating departments"** rather than literally excluding Sales.

**3 · Kitchen SLA.** "One-month ingredient preparation" conflicts with the client's own earlier statement that the kitchen may only begin preparing within seven days of the event. The two reconcile if one month is to **source** and seven days is to **prepare** — in which case the current two-week sourcing alert should move to one month.

**4 · Waitstaff.** The previous appendix gave 1 : 25 with the example "40 waiters for 1,000 pax". The client now says **50 for 1,000**, which is 1 : 20. Both cannot be right, and the system was changed to 1 : 25 on the strength of the earlier figure. Note the client says **brackets**, not a ratio — the real rule may be a table (500 → 25, 1,000 → 50) that does not divide evenly, in which case a flat ratio is wrong regardless of the number.

**5 · Staging.** The system goes from prepared straight to loaded. Adding a staging state is a modelling change rather than a rule change, and is the least urgent of the five.

---

## Traceability to the system

| Business rule | System behaviour | Status |
|---|---|---|
| ₱30,000 non-refundable reservation fee | Recorded separately, counted in the first collection | Implemented |
| 40% due two months after booking, 30-day aging | Payment compliance sweep, escalating alerts | Implemented |
| 60% unpaid → automatic hold, auto-release on settlement | Hold logic, weekly reminders while held | Implemented — **at 2 months, see difference 1** |
| Corporate extended payment cycle | — | **Not implemented** — new rule |
| Booking confirmed on tasting, before payment | Tasting → contract → payment order enforced | Implemented |
| Departmental data restriction | Role-based access control | Implemented |
| Price and contract value restricted | Hidden on screen, in exported PDFs, and in the hold banner | Implemented — **Sales/Accounting/Admin, see difference 2** |
| Final details one month before the event | SLA deadline recorded | Implemented |
| Kitchen ingredient preparation window | Sourcing and preparation alerts | Implemented — **2 weeks / 7 days, see difference 3** |
| Material freeze seven days before | Enforced server-side; like-for-like replacement permitted, with an incident | Implemented |
| Staging two days before the event | — | **Not implemented** — see difference 5 |
| Loading the day before, dispatch on the day | Load manifest, driver pickup checklist, dispatch | Implemented |
| Transport request three days prior | Lead-time warning and reminder notification | Implemented — **advisory, not blocking** |
| Waitstaff by guest count | Suggested plan derived from pax | Implemented — **at 1 : 25, see difference 4** |
| Truck assignment by cubic metres; rent if over capacity | Load volume estimate, rental requisition path | Implemented |
| No leaving until returned equipment matches the checklist | Return checklist and return reconciliation | Implemented |
| Incidents logged by the next office day | Incident register linked to contract and item | Implemented |

## Open questions for the client

1. Is the final 60% due **one month** or **two months** before the event?
2. Does "Accounting only" for package price mean **Sales is also excluded**, or only the operating departments?
3. Is the kitchen's **one month** for *sourcing*, with preparation still starting seven days out?
4. Is the waitstaff rule **50 per 1,000** (1 : 20), and is it a **bracket table** rather than a flat ratio? What are the other brackets?
5. Should the **three-day transport request** block the booking, or stay a warning?
6. Should the **two-day staging step** be tracked in the system, or is it handled outside it?
7. For **corporate clients**, what starts the one-to-three-month clock — the event date, or the invoice date?
