# Recommended Thesis Updates

Proposed revisions so the thesis draft matches the **current, approved system behavior**. These are recommendations only — the original PDF is not modified. Each item notes whether it needs human/panel approval.

> Context (project owner): the external APIs below (Nodemailer, Facebook Prophet, Google APIs, Acrobat Sign) were **intentionally replaced with in-system workarounds**; they are not pending work. These updates make the paper describe what was actually built.

---

### TU-1 — E-signature approach

- **Affected section:** Ch1 §1.4.2 (Design Architecture, PDF p.29); Ch5 §5.3 Integrated Services (PDF p.66); §5.1 signature feature (p.65).
- **Existing thesis statement:** "Acrobat Sign API will be integrated for e-signatures" / "E-Signature API."
- **Current system behavior:** Custom in-app signature workflow — staff/client signature **images are uploaded**, contract can be **sent for signature**, signed status recorded, and a **signature-ready / signed contract PDF** is generated and downloadable. No Acrobat Sign or third-party e-sign API.
- **Proposed revised explanation:** Describe a built-in electronic signature workflow (upload + record + signature-ready PDF export) rather than Acrobat Sign integration.
- **Reason:** Reflects actual implementation; avoids claiming an unused third-party integration.
- **Evidence:** `src/pages/ContractDetail.tsx` (signature assets, `handleExportSignaturePacket`, "Signature-Ready PDF"); `routes/contracts.js` signature-assets/client-signature routes.
- **Requires human approval:** No (factual correction) — but panel should be briefed.

### TU-2 — Notifications (email/push → in-app)

- **Affected section:** Ch1 §1.4.2.5-1.4.2.6 (PDF pp.30-31: "Nodemailer.js sends email notifications"; "Push notifications and email alerts").
- **Existing thesis statement:** Email notifications via Nodemailer + push notifications.
- **Current system behavior:** In-app notification center (`Notification` model, `/api/notifications`) drives approvals/reminders/alerts. No email or push.
- **Proposed revised explanation:** Describe an in-application notification system (real-time in-app alerts per role) as the notification mechanism.
- **Reason:** Matches the implemented workaround.
- **Evidence:** `server/models/Notification.js`, `server/routes/notifications.js`, `notifyRolesForContract` in `routes/contracts.js`.
- **Requires human approval:** No (factual correction).

### TU-3 — Inventory forecasting (Facebook Prophet)

- **Affected section:** Ch1 §1.4.1.2 (PDF p.23); §1.4.2 (p.29); Ch1 §1.5.2 Scope (p.32) — "basic inventory forecasting … through Facebook Prophet."
- **Existing thesis statement:** Facebook Prophet used for inventory demand forecasting.
- **Current system behavior:** No ML forecasting. Availability is handled by **dynamic same-day reservation checks** (live availability computed from other active contracts on the event date) plus shortage alerts and procurement requests.
- **Proposed revised explanation:** Either (a) reframe as real-time availability/shortage detection (no ML), or (b) explicitly move Prophet forecasting to "Future Work / Recommendations."
- **Reason:** Prophet is not implemented; the workaround meets the practical need.
- **Evidence:** `buildReservationMap`, `getDateAvailableQuantity` in `routes/contracts.js`; no `prophet`/forecast code.
- **Requires human approval:** **Yes** — forecasting is named in **Scope** and objectives; removing/relabelling a scope item is a scope-level change the panel may probe.

### TU-4 — Scheduling/logistics APIs (Google Calendar/Maps)

- **Affected section:** Ch1 §1.4.1.3 (PDF p.25) and §1.4.2 (p.28) — "Google Calendar API and Google Maps API."
- **Existing thesis statement:** Google Calendar + Maps APIs facilitate scheduling and venue routing.
- **Current system behavior:** Internal scheduling/availability logic and an **owned/rented fleet** (Driver/Truck models) with recommended truck/driver + conflict checks; no Google APIs.
- **Proposed revised explanation:** Describe internal calendar/availability and fleet-assignment logic instead of Google API integration.
- **Reason:** Reflects actual implementation.
- **Evidence:** `models/Logistics.js`, logistics assignment + operations-summary logic in `routes/contracts.js`; `BookingCalendar.tsx`.
- **Requires human approval:** No (factual correction).

### TU-5 — Logistics = internal fleet (+ staff transport), not only third-party rental

- **Affected section:** Ch5 §5.1 (PDF p.65) — "Logistics Booking … asking a third party for trucks to be rented."
- **Existing thesis statement:** Logistics booking is third-party truck rental.
- **Current system behavior:** Manages an internal fleet (owned + rented) of trucks and drivers, **plus a separate staff-transportation booking** with automated passenger-vehicle assignment (headcount, availability, seat capacity).
- **Proposed revised explanation:** Describe fleet management (owned + rented vehicles, drivers) and staff transportation, with rental as one option.
- **Reason:** System scope is broader than "third-party rental."
- **Evidence:** `models/Logistics.js` (Driver/Truck, `passengerVehicle`), staff-transport routes, `seedPassengerVehicles.js`.
- **Requires human approval:** **Yes** — staff transportation appears to be an added capability; confirm it is an approved change.

### TU-6 — Commission computation

- **Affected section:** Ch1 §1.4.1.4 Finance (F10, PDF p.26); Ch5 §5.4.1 Accounting role ("distribute commissions"); §5.5 Finance module (p.71).
- **Existing thesis statement:** System automatically computes and distributes sales commissions to Account Executives.
- **Current system behavior:** No commission computation/distribution found in the codebase.
- **Proposed revised explanation:** Either implement commissions (if still in scope) or move to "Future Work," and soften the Accounting role/Finance-module claims.
- **Reason:** Avoid claiming an unimplemented, prominently-described feature at defense.
- **Evidence:** No `commission` code in `server/` or `src/`.
- **Requires human approval:** **Yes** — this is a documented core Finance feature; decide implement-vs-defer.

### TU-7 — Module framing (four modules → seven operational modules)

- **Affected section:** Ch1 §1.4.1 & Ch5 §5.5 ("four main modules").
- **Existing thesis statement:** Four modules — Event Management, Inventory, Scheduling, Finance.
- **Current system behavior:** Operates as finer-grained areas matching Ch6 testing: Login/Auth, Contract Management, Accounting & Payment, Inventory, Procurement & Purchasing, Logistics, Reports (+ Kitchen, Banquet, Incidents, Notifications).
- **Proposed revised explanation:** Note that the four conceptual modules are realized as the seven tested operational modules; keep the mapping explicit.
- **Reason:** Ch1 and Ch6 already disagree; make the paper internally consistent.
- **Evidence:** Ch6 §6.1.2 module list (PDF pp.77+); repo route/model structure.
- **Requires human approval:** No (clarification), but improves internal consistency.

### TU-8 — Mobile support wording

- **Affected section:** Ch1 §1.3.2 O4 ("desktop and mobile") vs §1.4.2.6 (desktop-optimized, responsive) and Ch5 SO6 (desktop/laptops).
- **Existing thesis statement:** Objective O4 implies mobile use; other sections say desktop-optimized/responsive.
- **Current system behavior:** Responsive web app optimized for desktop; usable on mobile browsers, no dedicated mobile app.
- **Proposed revised explanation:** Standardize on "responsive web, desktop-optimized" across objectives and architecture.
- **Reason:** Remove the O4-vs-§1.4.2.6/SO6 inconsistency.
- **Evidence:** Responsive Tailwind layouts; no mobile-app code.
- **Requires human approval:** No (consistency fix).

### TU-9 — Evaluation method (unit/integration vs UAT)

- **Affected section:** Ch1 O5/O6, Ch5 SO7/SO8 (unit & integration testing) vs Ch6 §6.1.1 (UAT).
- **Existing thesis statement:** Objectives cite unit and integration testing.
- **Current system behavior:** Validation done via **UAT** (scenario-based); no automated test suite in the repo.
- **Proposed revised explanation:** Align objective wording with the UAT approach actually used (or add a minimal automated suite and keep both).
- **Reason:** Match stated method to executed method.
- **Evidence:** Ch6 §6.1.1 (PDF p.77); no test runner in repo.
- **Requires human approval:** **Yes** — changing how evaluation is described is a methodology-level edit.

### TU-10 — Payment/collection policy detail (reservation fee & milestones)

- **Affected section:** Ch1 §1.4.1.4 / Ch5 Finance & §5.4.1 Accounting.
- **Existing thesis statement:** General "payment tracking / follow up late fees."
- **Current system behavior:** Concrete policy engine — **PHP 30,000 reservation fee (non-refundable)**, 40/60 collection milestones with due dates relative to booking/event, 30-day aging window, automatic **payment holds** blocking preparation, and hold release on settlement.
- **Proposed revised explanation:** Document the actual collection-timeline rules and hold behavior (implemented-but-not-documented).
- **Reason:** A major, defensible feature currently absent from the thesis.
- **Evidence:** `server/paymentCompliance.js`; hold logic in `routes/contracts.js`.
- **Requires human approval:** **Yes** — confirm these business rules were approved by the client (they encode Juan Carlo's actual policy).
