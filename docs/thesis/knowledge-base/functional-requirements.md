# Functional Requirements

**Sources:** Ch1 §1.4.1 module legends (Figures 1.6-1.9, PDF pp.21-27); Ch5 §5.1 feature list (PDF pp.64-65) and §5.5 Modules (PDF pp.70-71). See [thesis-index.md](thesis-index.md).

The thesis frames functionality two ways: (a) four conceptual modules with feature codes **F1-F10** (Ch1), and (b) a richer Chapter 5 feature list that more closely matches the built system. Both are captured.

## Feature codes F1-F10 (Ch1 conceptual modules)

| Code | Feature | Module | Problems addressed | PDF page |
|---|---|---|---|---|
| F1 | Client booking entry | Event Mgmt | P1,P2,P3,P5,P10 | p.21 |
| F2 | Design upload & approval workflow | Event Mgmt | P2,P10 | p.21 |
| F3 | Auto-distribution to departments | Event Mgmt | P1,P3 | p.22 |
| F4 | Real-time inventory & requests | Inventory Mgmt | P6,P7,P8,P11 | p.23 |
| F5 | Fabrication, repair, and outsourcing tracker | Inventory Mgmt | P13,P16 | p.23 |
| F6 | Event calendar and truck/staff scheduling | Scheduling | P4,P5 | p.25 |
| F7 | Truck loading checklist & logistics planning | Scheduling | P12 | p.25 |
| F8 | Digital contracts and payment tracking | Finance | P9 | p.26 |
| F9 | Budget requests and validation | Finance | P15,P16 | p.26 |
| F10 | Commission computation | Finance | P17,P18 | p.26 |

## Chapter 5 feature list (FR-1 … FR-15) — Ch5 §5.1, PDF pp.64-65

| ID | Requirement |
|---|---|
| FR-1 | Centralized contract entries (Sales enters event details) |
| FR-2 | Automated task distribution to departments on approval |
| FR-3 | Digital approvals (budgets, requests, materials) by department heads |
| FR-4 | Real-time tracking of pending tasks, statuses, department progress |
| FR-5 | Paperless workflow (replaces printed forms, manual reminders) |
| FR-6 | Inventory management: view/add/edit/delete items digitally |
| FR-7 | Contract creation with draft save |
| FR-8 | Menu tasting booking by the client (via Sales) |
| FR-9 | Pre-event preparation progress tracking |
| FR-10 | Contract preparation progress tracking (Sales) |
| FR-11 | Banquet staffing management (assign staff digitally) |
| FR-12 | Logistics booking (trucks for transport — thesis: third-party rental) |
| FR-13 | Purchasing/procurement: request purchase/rental of lacking items; supplier-based requests for Accounting approval |
| FR-14 | Post-event checking (verify items used, update post-event statuses) |
| FR-15 | Incident reporting (damaged/missing/incorrect items, optional image) |
| FR-16 | Printable/exportable forms per department (contracts, details, assignments, tasks) |
| FR-17 | Client & staff signature workflow (send for signature, record signed status, generate signed copy) |

## Chapter 5 objective-derived functional behaviors (Ch5 §5.2.2, PDF pp.65-66)

| ID | Requirement |
|---|---|
| FR-18 | Automatic guest-based setup: suggest setup-item quantities from expected guest count |
| FR-19 | Staff availability suggestions for Logistics and Banquet based on event date |
| FR-20 | Real-time task routing, status tracking, inventory updates for all departments |

## Implementation status (summary — see traceability-matrix.md & alignment report)

- **Implemented:** FR-1..FR-11, FR-13..FR-20 (in some form), plus F1-F9, F6-F7.
- **Not implemented / diverged:** **F10 commission computation** (no commission code found); **F2 client-facing design upload/approval** (creative handling exists but not a client design-upload approval flow — verify); e-signature is **custom** (image upload + signature-ready PDF), not an external E-Signature/Acrobat Sign API (FR-17 satisfied by different means).
- Verify FR-18 (guest-based auto-suggested quantities) and FR-2/F2 (design approval workflow) against current code with the developer before defense.
