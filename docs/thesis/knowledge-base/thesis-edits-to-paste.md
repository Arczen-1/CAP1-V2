# Thesis Document Edits — Ready to Paste

Paste-ready text to make the thesis draft match the built system. For each edit: **WHERE** (chapter/section + PDF page), **FIND** (the current text to replace, when applicable), and **PASTE** (drop-in replacement/insertion). Based on [decisions-log.md](decisions-log.md), [business-rules-appendix-h.md](business-rules-appendix-h.md), and the alignment report.

> Keep the writing style consistent with the rest of your paper; tweak wording as needed.

---

## EDIT 1 — E-signature (custom, not Acrobat Sign)
**WHERE:** Ch1 §1.4.1.4 Finance Module (PDF p.26) and §1.4.2 Design Architecture (p.29); Ch5 §5.3 Integrated Services (p.66).
**FIND:** "Acrobat Sign will then be used for the digital signature of digital contracts." / "Acrobat Sign API will also be integrated for e-signatures." / "E-Signature API".
**PASTE:**
> The system provides a built-in electronic signature workflow rather than a third-party e-signature service. Sales sends the contract for signing, the client's and staff signatures are captured and recorded in the system, and a signature-ready contract PDF is generated for download, sharing, and documentation.

---

## EDIT 2 — Notifications (in-app, not email/push)
**WHERE:** Ch1 §1.4.2.5–1.4.2.6 (PDF pp.30–31).
**FIND:** "Nodemailer.js sends email notifications for approvals, disapprovals, and confirmation of full payments." and "Push notifications and email alerts sent via Nodemailer."
**PASTE:**
> Departments are kept informed through an in-application notification center. The system generates real-time, role-targeted notifications for approvals, disapprovals, payment confirmations, preparation reminders, and post-event actions, viewable by each user within their dashboard.

---

## EDIT 3 — Inventory forecasting (real-time availability; Prophet → Future Work)
**WHERE:** Ch1 §1.4.1.2 Inventory Module (PDF p.23), §1.4.2 (p.29), and **Scope §1.5.2 (p.32)**.
**FIND:** "In order to predict inventory stocks, Facebook Prophet by Meta will be utilized." and (Scope) "The system will also include basic inventory forecasting using historical data through Facebook Prophet…"
**PASTE (Ch1/architecture):**
> To prevent shortages, the system computes real-time item availability per event date — deducting quantities already committed to other events on the same day — and raises shortage alerts that trigger purchasing/rental requests.
**PASTE (Scope §1.5.2 — replace the forecasting sentence):**
> The system supports real-time inventory availability and shortage detection across events. Predictive demand forecasting (e.g., using time-series models) is identified as future work and is outside the current scope.
**ALSO:** add "ML-based inventory demand forecasting" to Ch7 Recommendations / Future Work.

---

## EDIT 4 — Scheduling/logistics (internal logic + fleet, not Google APIs)
**WHERE:** Ch1 §1.4.1.3 Scheduling Module (PDF p.25) and §1.4.2 (p.28).
**FIND:** "This will be done through Google Calendar API and Google Maps API…" and the Google APIs mention in the tools list.
**PASTE:**
> Scheduling and logistics are handled within the system: a booking calendar, event-date availability checks, and recommended truck/driver matching against an internally managed fleet (owned and rented vehicles), including same-day conflict detection. External mapping/calendar APIs are not used.

---

## EDIT 5 — Commission computation (defer to Future Work)
**WHERE:** Ch1 §1.4.1.4 Finance Module / feature F10 (PDF p.26); Ch5 §5.5 Finance Management Module (p.71); Ch5 §5.4.1 Accounting role (p.67).
**FIND:** claims that the system "automatically calculates the sales commission" / "distribute commissions to sales agents."
**PASTE (Finance module):**
> Automated sales-commission computation is planned as future work; the current system focuses on collections, payment milestones, holds, and budget approval.
**PASTE (Accounting role §5.4.1 — adjust the responsibility line):**
> Accounting manages payments, collections, budget approvals, and contract release. (Commission distribution is handled manually for now and is targeted for a future release.)
**ALSO:** add "Automated commission computation" to Ch7 Future Work.

---

## EDIT 6 — Module framing (four → realized as seven operational modules)
**WHERE:** Ch1 §1.4.1 and Ch5 §5.5 "four main modules" (PDF p.70).
**PASTE (add a sentence after the four-module description):**
> In implementation, these four conceptual modules are realized as the operational modules validated in Chapter 6 — Login/Access, Contract Management, Accounting & Payment, Inventory Management, Procurement & Purchasing, Logistics, and Reports — with Kitchen, Banquet, and Incident handling integrated across the pre-event and post-event workflow.

---

## EDIT 7 — Platform wording (responsive web, desktop-optimized)
**WHERE:** Ch1 §1.3.2 Objective O4 (PDF p.16) — align with §1.4.2.6 (p.31) and Ch5 SO6 (p.66).
**FIND:** "Develop a centralized management system optimized for both desktop and mobile use."
**PASTE:**
> Develop a responsive web-based system, optimized for desktop/laptop use in the office and accessible on mobile browsers for quick status checks.

---

## EDIT 8 — Evaluation method (UAT)
**WHERE:** Ch1 §1.3.2 O5/O6 (PDF p.16) and Ch5 §5.2.2 SO7/SO8 (p.66) — align with Ch6 §6.1.1 (p.77).
**FIND:** wording that says the system is evaluated "through unit and integration testing."
**PASTE:**
> Evaluate the system through User Acceptance Testing (UAT), where departmental personnel validate each module against day-to-day operational scenarios, with iterative refinement based on their feedback.
> *(Only keep "unit and integration testing" if you actually add an automated test suite; otherwise use the UAT wording above to match Chapter 6.)*

---

## EDIT 9 — Cross-reference Appendix H (business rules)
**WHERE:** Ch5 Finance Management Module (p.71) and Logistics/Scheduling (p.65), and/or Ch1 Scope.
**PASTE (add a sentence in each relevant place):**
> The detailed operating rules governing these workflows — the ₱30,000 reservation fee, the 40/60 collection milestones and aging/hold policy, financial-confidentiality (package price and total value restricted to Accounting and Sales), the 7-day material freeze, transportation lead time and fleet allocation, and post-event return reconciliation — are documented in **Appendix H: Current Business Rule**.

---

## Quick checklist for the group
- [ ] E-signature (Edit 1)
- [ ] Notifications (Edit 2)
- [ ] Forecasting + Scope (Edit 3) — *scope-level, review carefully*
- [ ] Google APIs (Edit 4)
- [ ] Commission → Future Work (Edit 5)
- [ ] Module framing (Edit 6)
- [ ] Mobile wording (Edit 7)
- [ ] Evaluation method (Edit 8)
- [ ] Appendix H cross-references (Edit 9)
- [ ] Add Future Work items: ML forecasting, commission (Ch7)
