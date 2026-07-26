# Traceability Matrix

Maps thesis objectives → problems addressed → system modules/files → status.
**Source refs:** see [functional-requirements.md](functional-requirements.md), [objectives.md](objectives.md), [thesis-index.md](thesis-index.md).

**Status legend:** ✅ Documented & implemented · 🟡 Partially aligned · 🔧 Implemented via workaround (approved deviation) · 📄 Documented, not implemented · 🆕 Implemented, not documented · ❓ Needs human confirmation

## Objectives → system

| Objective | Where realized (current system) | Status |
|---|---|---|
| O1/O2 Analyze current workflow & gaps | Ch1/Ch4 analysis (paper) | ✅ (research) |
| O3 Contract relay + departmental dashboards + real-time inventory | Contracts + approval routing + `pages/dashboards/*` + inventory pages | ✅ |
| O4 Desktop **and mobile** | Responsive React/Tailwind (desktop-optimized) | 🟡 (responsive, not mobile app) |
| O5/O6/SO7/SO8 Unit & integration testing on real data | UAT (Ch6); no automated suite in repo | 🟡 / ❓ |
| O7 Live deployment + feedback | Deployment status not in repo | ❓ |
| SO1 Unified task/request/schedule/contract/progress platform | Contract lifecycle + department modules | ✅ |
| SO2/SO20 Real-time routing, status, inventory | Approval → notify departments; readiness panels | ✅ |
| SO3 Digital approval (budgets, fabrication, materials) | `procurementRequests` + finance approval | ✅ |
| SO4 Automatic guest-based setup quantities | pax/guest-count-driven quantities | 🟡 ❓ (verify auto-suggest) |
| SO5 Staff availability suggestions (Logistics & Banquet) | recommended driver/truck; banquet availability; staff-transport auto-assign | ✅ |
| SO6 Runs on desktop/laptop | Yes | ✅ |
| SO9 Usability via feedback | UAT feedback loop | ✅ (process) |

## Feature codes / requirements → system

| Ref | Feature | Module/files | Status |
|---|---|---|---|
| F1/FR-1/FR-7 | Client booking & contract entry, drafts | `NewContract.tsx`, `routes/contracts.js`, `models/Contract.js` | ✅ |
| F2/FR- | Design upload & approval workflow | Creative inventory exists; client design-upload approval unclear | ❓ |
| F3/FR-2 | Auto-distribution to departments on approval | `contracts.js` approval → `notifyRolesForContract` | ✅ |
| F4/FR-6 | Real-time inventory & requests (view/add/edit/delete) | Creative/Linen/Stockroom inventory pages + models | ✅ |
| F5/FR-13 | Fabrication/repair/outsourcing + purchasing | `routes/procurementRequests.js`, `Suppliers` | ✅ |
| F6/FR-19 | Event calendar + truck/staff scheduling & availability | `BookingCalendar.tsx`, logistics assignment, banquet | ✅ |
| F7/FR-12 | Truck loading checklist & logistics planning | Load manifest, trip ticket, driver pickup checklist | ✅ 🆕(kitchen items, readiness) |
| F8/FR-8 | Digital contracts & payment tracking | `contracts.js` payments, `paymentCompliance.js` | ✅ |
| F9/FR-3 | Budget requests & validation | procurement + accounting approval | ✅ |
| **F10** | **Commission computation** | none found | 📄 (gap) |
| FR-8/FR-8 | Menu tasting booking | `MenuTastings*.tsx`, `routes/menuTastings.js`, `models/MenuTasting.js` | ✅ |
| FR-9/FR-10 | Pre-event & contract preparation tracking | readiness panels, stage labels | ✅ |
| FR-11 | Banquet staffing management | `BanquetStaff.tsx`, `banquet-assignment` route | ✅ |
| FR-14 | Post-event checking | post-event status routes; "Awaiting Contract Close" | ✅ 🆕(status) |
| FR-15 | Incident reporting (+image) | `routes/incidents.js`, `Incident` model | ✅ |
| FR-16 | Printable/exportable forms | Contract PDF, trip ticket, dispatch sheet, kitchen/inventory sheets | ✅ 🆕(price gating) |
| FR-17 | Client & staff signature workflow | signature assets + signature-ready PDF | 🔧 (custom, not Acrobat Sign) |
| NFR email/push | Email (Nodemailer) + push notifications | in-app `Notification` model only | 🔧 (workaround) |
| Scope forecast | Inventory forecasting (Facebook Prophet) | dynamic reservation checks; no ML | 🔧/📄 (workaround/omitted) |
| Arch | Google Calendar/Maps API | internal logic; no Google APIs | 🔧 (workaround) |

## Implemented-but-not-documented (🆕) highlights

- **Staff transportation booking** with automated passenger-vehicle assignment (headcount/capacity/availability).
- **Payment compliance engine**: PHP 30,000 reservation fee, 40/60 milestone timeline, aging window, automatic **payment holds**, hold release.
- **Kitchen prep-window notifications** (2-week / 7-day) and reworded approval alerts.
- **Material freeze** (7-day lock on reserved materials, admin override).
- **"Awaiting Contract Close"** stage + Accounting "ready to close" notification.
- **Load manifest incl. kitchen items**, per-department load readiness, **driver pickup checklist**, **logistics workflow sub-tabs**.
- **PDF financial-visibility restriction** (package price / contract value limited to Sales/Accounting/Admin).

See the full analysis in [../../../agent-artifacts/thesis-system-alignment-report.md](../../../agent-artifacts/thesis-system-alignment-report.md).
