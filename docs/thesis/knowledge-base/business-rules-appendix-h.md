# Current Business Rules (Appendix H)

**Source:** Thesis Appendix H "Current Business Rule" — PDF pp.137–138 (printed A-36/A-37); corroborated by Appendix I "Juan Carlo Third Interview" (PDF pp.138–140). See [thesis-index.md](thesis-index.md).
**Revised:** 6 August 2026 — expanded with rules the client restated, and aligned to the system as it now stands after the post-defense revisions.

> These are **Juan Carlo's business rules**, and the basis for the payment, logistics, freeze, and post-event behaviour of the system. Each rule below is written as the system currently enforces it.
>
> Where the client's most recent restatement gives a different figure from the one implemented, the difference is noted inline as *(to confirm)* and listed in [Points to confirm](#points-to-confirm). Those are open questions with the client, not defects — nothing in this appendix describes behaviour the system does not have.

---

## 1. Payment and billing

Payment structure depends on the client type.

- **Corporate clients** follow an extended payment cycle: settlement may run to **one, two, or three months after the service is delivered**. *(Client-stated; the system has no separate corporate due-date logic — corporate contracts are recorded on the standard terms.)*
- **Special events** follow a split schedule: a **40% down payment**, then the remaining **60%**.
  - 40% is due **two months after booking**, with collection follow-up beginning **one month before** that date.
  - 60% is due **two months before the event**. *(The client has since restated this as one month — to confirm.)*
- The **₱30,000 reservation fee** is collected at booking to hold the schedule, is **strictly non-refundable**, and counts toward the first collection.
- A **40% not received by its due date** enters a **30-day aging period**, after which it may be classified uncollectible. A **final notice is issued three days before** that window closes.
- A **60% unpaid past its due date** places the contract **on hold** — preparation, release, and execution are blocked — until it is settled or **management releases the hold**. Neither the 40% nor the reservation fee is refunded automatically.
- **While an account is outstanding or a contract is held, a reminder is issued every seven days**, carrying the number of days the balance has been outstanding.
- **Where the balance is still unsettled one month before the event, the booking is cancelled and the date released.** Sales, Accounting, and Admin are notified to contact the client; every operating department is told to release what it was holding; and procurement raised for the event that has not yet been approved is voided.
- Clients may **pay in full early** at any time.

## 2. Booking confirmation

- A booking is **confirmed once the client completes a food tasting and confirms their satisfaction**, which may happen **before any payment is made**.
- **One booking per hourly tasting slot** — a second booking on the same date and time is rejected.
- Payments are posted only **after the contract is signed**.

## 3. Data confidentiality

- Once event data is encoded, **each department sees only the details relevant to its own operational workflow**.
- **Package price and total contract value are restricted to Accounting, Sales, and Admin** — on screen, in exported PDFs, and in the payment-hold notice, where other departments see a non-monetary message. *(The client has since restated this as Accounting only — to confirm, as it would leave Sales unable to see the value of the contract it sells.)*

## 4. Service level agreements and timelines

- **All final event details must be confirmed one month before the event date**, aligning with the kitchen's ingredient preparation SLA.
- **Kitchen windows:** a **sourcing alert two weeks** before the event, and a **preparation alert seven days** before, which is the earliest cooking may begin. *(The client has restated the ingredient SLA as one month — to confirm whether that is the sourcing window.)*
- **Material freeze:** seven days before the event, assigned materials are locked to that event and cannot be released or reassigned.
  - A **damaged, lost, or spoiled item may still be replaced like-for-like at the same quantity**, which files an incident automatically and notifies Accounting and Admin. Only the affected units are replaced; the rest keep their item and their prepared status, so the total the event receives never changes.
  - **Reducing a quantity, or removing an item, remains blocked** and requires management.
- **Banquet roster freeze:** seven days before the event the roster is locked; a late replacement requires management and is recorded.
- **Logistics timeline:** equipment is **staged two days before** the event, **loaded one day before**, and **dispatched on the day**. *(The staging step is client-stated; the system tracks preparation, loading, and dispatch, but not a separate staging state.)*
- Any department requiring transportation must **file a vehicle request three days before the event**, so Logistics can allocate trucks and drivers. The system raises a **warning** at that point rather than blocking a late booking.

## 5. Resource allocation

- **Waitstaff are derived from the guest count** at **one per 25 guests**, with a minimum of two — 40 waiters for 1,000 pax — alongside a role-based plan of head captain, servers, food runners, bussers, bartenders, and setup crew. *(The client has since restated this as 50 per 1,000, and as brackets rather than a ratio — to confirm.)*
- **Truck assignment is determined by the required equipment in cubic metres.** Where the load exceeds the internal fleet, additional trucks are **rented through a requisition**, subject to the seven-day lead time and Accounting approval.
- **Vehicles, drivers, and banquet staff already committed to another event on the same date are withheld**, and the competing event is named so the shortage can be explained rather than guessed at.
- **Metro Manila number coding (UVVRP)** excludes vehicles whose plate is coded on the event's weekday.

## 6. Procurement and spending

- **Requisitions require seven days of lead time.** Inside that window the **emergency requisition** is the documented route, carrying its own approval path.
- **A quoted supplier must be an accredited record in the supplier directory**, still active, and cleared for the requesting department and the type of request. The directory is maintained by Purchasing; Accounting holds read-only access, so it cannot serve as Purchasing's own check.
- **Purchasing canvasses the suppliers and may record up to three quotations** on a request. **Accounting funds one of them** — the cheapest by default — and cannot introduce a supplier of its own.
- **Approval is blocked where the amount exceeds the month's remaining allocation** for that category.
- **Purchasing verifies that a supplier can deliver; Accounting verifies that the supplier is payable.** Whoever selects the vendor does not release the funds.

## 7. Post-event accountability

- Staff and logistics teams **may not pack up and leave the venue until the equipment loaded back into the trucks matches the inventory checklist** of what was brought.
- A **variance between the counts** goes to the missing-and-damaged summary; unresolved losses may be charged unless the supervisor files a valid counter-report.
- **On-site incidents** — a tablecloth burnt by a food heater, damaged equipment, a missing item — must be **logged in an incident report by the time staff return to the office the following day**, linked to the contract and the item.
- A contract is **closed only once the event has passed, the balance is fully collected, the logistics booking is complete, and no post-event check is outstanding.**

---

## Points to confirm

Four figures in the client's most recent restatement differ from what is implemented and documented above. None is a defect; each is a question of which figure is current.

| Rule | Documented and implemented | Client's restatement |
|---|---|---|
| Final 60% due date | Two months before the event | One month before |
| Package price visibility | Accounting, Sales, Admin | Accounting only |
| Kitchen ingredient SLA | Sourcing at 2 weeks, preparation at 7 days | One month |
| Waitstaff | 1 per 25 — 40 per 1,000 pax | 50 per 1,000 pax, in brackets |

Two of them need care rather than a simple correction.

**The 60% due date.** Moving it to one month before the event puts it on the **same day** as the rule that cancels an unsettled booking one month out. The balance would fall overdue and the booking would be cancelled on the same date, leaving no window in which to collect and nothing for the hold or the reminders to act in. If the 60% moves, the cancellation deadline has to move with it.

**The waitstaff figure.** The client describes **brackets**, not a ratio, so 50 per 1,000 may be one point on a table rather than a rate that applies at every size. A flat ratio — whether 1 : 25 or 1 : 20 — cannot express a bracket table, so the full set of brackets is worth asking for before any figure is changed.

Also outstanding, and additive rather than contradictory:

- **Corporate clients.** What starts the one-to-three-month clock — the event date or the invoice date? Is a corporate booking held without a down payment?
- **Staging.** Should the two-day staging step be tracked in the system, or is it managed in the warehouse outside it?
- **Transport requests.** Should the three-day request block a late booking, or remain a warning as it is now?

---

## Traceability to the system

| Business rule | Where it is enforced |
|---|---|
| ₱30,000 non-refundable reservation fee | Recorded separately, counted in the first collection |
| 40% two months after booking; 30-day aging; 3-day final notice | `server/paymentCompliance.js` |
| 60% before the event → automatic hold, auto-release on settlement | `server/paymentCompliance.js` |
| Weekly reminder while outstanding or held | `notifyRolesRecurring`, `server/paymentCompliance.js` |
| Cancellation one month out; departments told what to release | `paymentCompliance.js`; `routes/contracts.js` cancel |
| Booking confirmed on tasting, before payment | `routes/menuTastings.js`; contract creation order |
| One booking per tasting slot | `routes/menuTastings.js` — rejected on save |
| Departmental data restriction | Role-based access control |
| Price and contract value restricted | `canViewContractFinancials`, PDF redaction, hold banner |
| Kitchen sourcing and preparation windows | `server/kitchenPrepNotifications.js` |
| Material freeze; like-for-like replacement with an incident | `isMaterialFreezeActive`; `POST /:id/material-replacement` |
| Banquet roster freeze | `routes/contracts.js` banquet assignment |
| Loading the day before, dispatch on the day | Load manifest, driver pickup checklist, dispatch |
| Transport request three days prior | `server/transportLeadTimeNotifications.js` — advisory |
| Waitstaff from guest count; role-based plan | `routes/contracts.js` staffing suggestion; `routes/reports.js` |
| Truck assignment by cubic metres; rent if over capacity | Logistics load estimate; procurement requisition |
| Same-day resources withheld, competing event named | `sameDayContention`, `routes/contracts.js` |
| Number coding (UVVRP) | `getEventCodingSummary` |
| Seven-day requisition lead time; emergency route | `routes/procurementRequests.js` |
| Supplier accreditation checks | `getSupplierVerificationChecks`, `src/lib/procurement.ts` |
| Three-quotation canvass; Accounting funds one | `quotes[]`; `POST /:id/select-quote` |
| Budget blocks approval over allocation | `utils/financeBudgeting.js` |
| Return must match the checklist; variance recorded | Return checklist, return reconciliation |
| Incidents logged by the next office day | `routes/incidents.js` |
| Closing conditions | `routes/contracts.js` closure checks |
