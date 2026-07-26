# Current Business Rules (Appendix H)

**Source:** Thesis Appendix H "Current Business Rule" — PDF pp.137–138 (printed A-36/A-37); corroborated by Appendix I "Juan Carlo Third Interview" (PDF pp.138–140). See [thesis-index.md](thesis-index.md).

> These are **Juan Carlo's actual, client-provided business rules**, gathered from the company. They are the authoritative basis for the payment, logistics, freeze, and post-event behaviors in the system. (This appendix was initially missed in the first-pass knowledge base, which only covered the main chapters — the alignment report has been corrected accordingly.)

## Payment & billing (Appendix H, PDF p.137)

- **₱30,000 reservation fee** collected at booking to hold the schedule; **strictly non-refundable**; counted as part of the first collection.
- **40 / 60 split:** 40% down payment due **two months after booking**; collections follow up starting **one month before** that due date. Remaining **60% due two months before the event**.
- **40% not received by due date → 30-day aging period → may be classified uncollectible.**
- **60% unpaid past due → contract auto-placed ON HOLD** (preparation, release, execution blocked) until settled or **management releases the hold**; no automatic refund of the 40% or reservation fee.
- Clients may **pay in full early**. Booking + tasting can be recorded **before any payment**; payments are posted **only after the contract is signed**.

## Data confidentiality (Appendix H, PDF p.137)

- Each department sees **only the details relevant to its workflow**.
- **Package price and total contract value are visible only to Accounting and Sales** — all other departments are restricted from viewing these. *(Directly supports the PDF financial-redaction feature.)*

## SLAs, freeze & loading (Appendix H, PDF p.138)

- **All final event details due ≥ 1 month before the event** (aligns with the kitchen ingredient-prep window).
- **Material freeze:** 7 days before the event, assigned materials are locked to that event (cannot be offered to/used by another).
- **Equipment loading may begin the day before** the event, with dispatch on the day itself.
- **Transportation requests ≥ 3 days prior** so Logistics can allocate trucks and drivers. *(Basis for staff/department transportation.)*

## Resource allocation (Appendix H, PDF p.138)

- **Waitstaff ≈ 1 per 25 guests** (e.g., 40 waiters for 1,000 pax), plus a role-based banquet plan (head captain, servers, food runners, bussers, bartenders). *(Basis for guest-based suggestions, SO4.)*
- **Truck assignment by required cubic meters**; if the load exceeds the internal fleet, rent additional trucks via a **purchase/rental requisition (7-day lead + accounting approval)**.

## Post-event accountability (Appendix H, PDF p.138)

- Staff/logistics **may not leave the venue until equipment loaded back matches the inventory checklist** brought to the event — via the **supervisor's return count** and the **warehouse's second count** on arrival. *(Basis for the return/pickup checklist + return reconciliation.)*
- **Variance between counts → missing-and-damaged summary**; unresolved losses may be charged unless the supervisor files a valid counter-report.
- **On-site incidents** (e.g., burnt tablecloths, damaged equipment) must be **logged in an incident report (linked to contract + item)** by the next day.

## Traceability to the system (all IMPLEMENTED and now DOCUMENTED)

| Business rule (Appendix H) | System | 
|---|---|
| ₱30k fee, 40/60, aging, auto-hold, no refund, early full pay, post-after-sign | `server/paymentCompliance.js` + hold logic | 
| Price/value visible to Accounting & Sales only | PDF redaction (`ContractDetail.tsx canViewContractFinancials`) |
| Material freeze (7 days) | `isMaterialFreezeActive` (enforced) |
| Transportation ≥3 days; Logistics allocates trucks/drivers | logistics booking + **staff transportation** (CHANGE-002) |
| Waitstaff 1:25 + role-based banquet plan | banquet staffing + guest-based quantities |
| Truck by m³; rent if over capacity (requisition + approval) | logistics + procurement |
| Loaded-back must match checklist; return + second count; variance → missing/damaged | **return/pickup checklist + return reconciliation** (CHANGE-001/003); post-event checks |
| Incident report linked to contract+item | `routes/incidents.js` |
