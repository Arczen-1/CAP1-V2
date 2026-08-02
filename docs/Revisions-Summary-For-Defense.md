# Revisions Summary — Two-Week Development Cycle

**Period:** 22 July – 29 July 2026 · **Branch:** CAP2
**Purpose:** consolidated list of revisions for the defense, grouped by impact, with the user-manual section where each is documented and whether it appears in the live demo.

**Headline:** 10 major capability additions, 30+ fixes and refinements, across all 10 departments. Every business rule cited below traces to the client's documented rules (thesis **Appendix H / I**).

---

## Part 1 — Big Wins (feature-level, panel-visible)

### 1. Staff Transportation — new capability
Personnel now have a **dedicated passenger vehicle booking**, entirely separate from the trucks carrying food and equipment. Vehicles are seat-tagged; the system sizes the booking by headcount and seat capacity, auto-assigns or lets Logistics pick manually, requires a driver per vehicle, and blocks same-day double-booking.
**Manual:** §10.4 · Figure 10.4.1 · **Answers the panel's own concern:** staff never ride in the back of a cargo truck.

### 2. The logistics round trip is now complete
Previously the system only handled *delivery*. It now covers the full cycle:
- **Load Manifest** including **kitchen/food items** (was equipment/linen/decor only) — §10.5
- **Department Load Readiness** board — shows who can be picked up early — §10.5
- **Driver Pickup Checklist** — what to collect from each department, with release/receive sign-off — §10.5
- **Return / Pickup Checklist** — reusable items to collect back from the venue (food excluded) — §10.5
- **Return Reconciliation** — "X of Y items returned / pending" per department — §10.6 · Figure 10.6.1
**Business basis:** Appendix H — teams may not leave the venue until returned equipment matches the checklist.

### 3. Guided logistics workflow
The logistics tab was reorganized into numbered sub-tabs — **1. Inventory Transport → 2. Staff Transport → Load & Dispatch (info)** — with a progress panel. Load & Dispatch is informational, so completion counts **out of 2**.
**Manual:** §10.1, §10.3–10.5 · Figure 10.3.1

### 4. Kitchen preparation windows
The kitchen can only begin preparing within 7 days of the event, so the system now drives that timeline:
- **2 weeks out** — "start sourcing items" alert
- **7 days out** — "begin preparations" alert
- The approval alert was **reworded** (it previously implied cooking could start immediately)
- **Preferences tab** now shows the linked **menu-tasting comments** instead of static fields
- **Printable kitchen checklist** with those preferences
- Inventory tab **removed** (not applicable); stage label shows **"Event Week"** instead of the irrelevant material-freeze wording
**Manual:** §8.2 (Table 8.2 alert windows), §8.3–8.6

### 5. Financial confidentiality
Package price and total contract value are now restricted to **Sales, Accounting, and Admin** — on screen, in **exported PDFs**, and in the payment-hold banner (other departments see a non-monetary "on hold pending Accounting" message).
**Manual:** Table 4.3 · **Table A.2** · **Business basis:** Appendix H, verbatim.

### 6. Contract status system reworked
Added the missing **"Awaiting Contract Close"** stage, colour-coded every stage, and gave each an **owner** so it's clear who holds the contract. Kitchen sees a role-appropriate label.
**Manual:** Ch. 2–4 stage references · **Demo:** visible throughout.

### 7. Notification system overhaul
- **Done tag** — a completed action shows green **Done** instead of red **High**, routed correctly for **every** department
- **Dismiss (×)** on each notification to avoid clutter
- Popups now **stack** instead of covering each other
- Notifications from **deleted contracts are removed**; closed-contract notifications **auto-expire**
- Text truncation fixed; sidebar wording corrected (not everything is a "pending action")
- **New post-event notifications:** departments are told when to begin post-event checks; **Accounting is told when a contract is ready to close**
**Manual:** §2.5 · **Table 2.2** (all 14 notification types) · §4.2 (Table 4.2)

### 8. Business rules made enforceable (not just labels)
| Rule | Before | Now |
|---|---|---|
| Material freeze (7 days) | label only | enforced server-side, Admin override |
| Banquet roster freeze (7 days) | label only | **enforced server-side**, Admin override |
| Tasting slot conflict | advisory list | **rejected on save** |
| Same-day vehicle double-booking | not checked | **blocked** (cargo + staff) — verified with a live two-event test |
| Waitstaff ratio | 1 : 30 | **1 : 25** per Appendix H (40 waiters / 1,000 pax) |
| Transport lead time | none | **3-day advisory warning** + reminder notification |
| Number coding (UVVRP) | none | Metro Manila coded plates excluded per event date |
**Manual:** Tables 4.3, 9.2, 10.2 · **Appendix A** (Tables A.1 & A.2)

### 9. Accounting: monthly budget and enforced procurement approval
Monthly operating budget per category with a **data-derived suggestion** (trailing 3-month average of confirmed procurement spend), and procurement approval that **checks the request against the month's remaining allocation** and blocks it when insufficient.
**Manual:** **§4.7, §4.8** · Figures 4.7.1 & 4.8.1 · **★ This is Demo Beats 1 & 2.**

### 10. Reports expanded per department
Role-scoped reports with summary cards, charts, and detail tables — A/R aging (30/60/90), collections trend, financial position, receivables, payment ledger, procurement budget register — all **printable and Excel-exportable**.
**Manual:** **§13.1 · Table 13.1** · Figure 13.1.1 · **★ This is Demo Beat 3.**

---

## Part 2 — Small Wins (fixes and refinements)

### Money & data correctness
- **Decimal rounding fixed** — remaining balances were carrying floating-point drift (e.g. ₱59.00004 shown as ₱60), which made final payments and therefore **contract closing impossible**. Now settled to two decimals with tolerance.
- **Full-payment notification** no longer says "40% milestone met" on a non-40/60 term.
- **Payment term at creation** now reads **"N/A — confirmed after signing"** instead of a fabricated "60% / 40% split".

### Sales
- **Signature-Ready PDF** is now downloadable (Download/Print toolbar inside the document) and reachable any time via a dedicated **View Signature-Ready PDF** button.
- Menu-tasting booking **rejects a double-booked date + time slot**.
- Menu tasting now includes **items for tasting**; the record-feedback interface was reworked to match the kitchen-checklist style.
- Add-on quantities can be **cleared and retyped** (0 and negatives still rejected).

### Kitchen
- **"Ingredients" relabelled to "Items"** throughout the dashboard — the kitchen handles menu items, not ingredients.
- Preparation status now updates correctly as checkboxes are ticked (previously stayed Pending).

### Banquet
- **Suggested staff now show their names** (blank "– Suggested" entries fixed at the source, with first + last name fallback).
- **Supervisor-assignment block removed** — the supervisor *is* the account holder, so the old requirement no longer blocks readiness.
- **Next Step** text now updates after the staffing form is saved.

### Logistics
- **Driver "undefined (SCN-DRV-001)"** fixed — falls back to the driver ID everywhere.
- Inventory tab **removed** from the logistics contract view (not applicable).
- Staff transport can be booked **manually**, showing **people to transport** and **seats per vehicle** for decision support; **driver assignment required** — a vehicle without a driver is rejected.
- **Passenger fleet populated** — 18 seat-tagged vehicles, each paired with a driver.

### Creative
- **Creative-lead assignment removed** (old business rule — the lead is the account holder).

### Purchasing & Accounting
- **Purchasing filters** — department, requisition type, and sort order across the request queues.
- **Accounting Procurement Approval filters** — newest first, oldest first, by event date, by date needed.
- Procurement-request creation confirmed properly **role-restricted**.

### Cross-cutting / technical
- **Build fixed** — `npm run build` was failing on pre-existing type errors; it now passes end-to-end.
- **Performance** — vendor bundle split; main JS **1.75 MB → 1.22 MB**.
- **Timeline tab** wording improved with least-privilege information display.
- **User manual rebuilt** — restructured per department, 62 pages, 47 figures (10 screenshots newly captured or replaced), business-rule and notification tables per role.

---

## Part 3 — Where these appear in the demo

The demo covers **Accounting (budgeting) and Reports**. The contract's full journey is **excluded** — already presented in the previous defense.

| Demo beat | Revisions on display | Manual |
|---|---|---|
| **1 — Set the monthly budget** | Big Win #9 (budget + 3-month suggestion) | §4.8 · Fig 4.8.1 |
| **2 — Budget enforces procurement** | Big Win #9 (budget check), Accounting filters, rejected-budget round trip | §4.7 · Fig 4.7.1 · Table 4.3 |
| **3 — Reports** | Big Win #10 (all department reports, Excel export) | §13.1 · **Table 13.1** |
| **4 — Closing scenario** | Big Wins #6, #7, #8 (Awaiting Contract Close, ready-to-close notification, auto-hold), decimal fix that makes closing possible | §4.6, §4.10 · Table A.1 |

**Visible throughout the demo without extra clicks:** status colours and owners (#6), the Done tag and dismissible notifications (#7), and financial confidentiality (#5).

**Best answers to keep in reserve** (each is a documented scenario section, not improvisation): §10.8 Logistics (number coding, early pickup), §9.6 Banquet (1:25 ratio), §11.6 Purchasing (emergency requisition, rejected budget), §5.7 / 6.7 / 7.8 inventory departments.

---

## Part 4 — Known gaps (state plainly if asked)

Documented in the thesis but **deliberately not built** — management decisions made outside the system:

| Item | Status |
|---|---|
| **Cancellation refund (70%)** | The system records the cancellation and the formal letter's reason; the refund percentage and emergency-reason judgement require Execom review. Reservation fee is non-refundable by policy. |
| **Food-To-Go conversion** of cancelled events | Not implemented — noted in Appendix I as a management option. |
| **Client-initiated reschedule** (e.g. typhoon) | No dedicated flow; event details are editable while the contract is a draft. |
| **Sales commission computation** | Deferred to future work — the formula was never specified in the requirements. |
| **Budget period** | Implemented as **monthly**; the period was not specified in the requirements and is pending confirmation with Juan Carlo. |
| **Deployment** | Not deployed — deployment follows a successful defense. |

*All items in Parts 1 and 2 were verified against the running system and the current codebase.*
