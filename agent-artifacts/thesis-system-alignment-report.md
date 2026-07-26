# Thesis–System Alignment Report

**Generated:** 2026-07-26
**Thesis:** `docs/thesis/thesis-draft-current.pdf` — "Catering Management System for Juan Carlo Catering Services" (DLSU CAP-IT0 proposal, draft under revision)
**System:** `REDEF/` repository, branch `CAP2`
**Knowledge base:** `docs/thesis/knowledge-base/` (see [thesis-index.md](../docs/thesis/knowledge-base/thesis-index.md))

> **Owner-confirmed deviations:** External integrations named in the thesis — **Nodemailer email, Facebook Prophet forecasting, Google Calendar/Maps APIs, Acrobat Sign** — were **intentionally replaced with in-system workarounds** and are **not pending work**. They are classified below as *Implemented differently / approved deviation*, and the recommended fix is to update the **thesis**, not the system.

---

## 1. Current project summary

The system is a centralized, web-based Catering Management System for Juan Carlo Catering Services (React + TS + Vite frontend; Node/Express + MongoDB backend; JWT + RBAC). It covers the full catering lifecycle (pre-event, during-event, post-event) across ten roles (admin, sales, accounting, kitchen, logistics, banquet_supervisor, creative, linen, stockroom, purchasing). It implements contracts (creation, drafts, approval routing, signature workflow), menu tastings, payments with an automated collection/hold engine, kitchen menu/ingredient prep, an owned/rented logistics fleet with staff transportation, banquet staffing, three inventory departments, purchasing/procurement, reports, incidents, and an in-app notification center. It has grown **beyond** the thesis draft in several operational areas (see §7).

## 2. Thesis objectives mapped to system modules

| Thesis objective | System realization | Status |
|---|---|---|
| O3 Centralized system (contract relay, dashboards, real-time inventory) | Contracts + role dashboards + inventory | ✅ Aligned |
| O4 Desktop + mobile | Responsive, desktop-optimized | 🟡 Partial |
| O5/O6 Unit & integration testing on real data | UAT (manual) | 🟡 Diverged (method) |
| O7 Live deployment + feedback | Not verifiable in repo | ❓ Human confirm |
| SO3 Digital approvals | Procurement + finance approvals | ✅ |
| SO4 Guest-based setup suggestions | pax-driven quantities | 🟡 Verify auto-suggest |
| SO5 Staff availability suggestions | recommended driver/truck, banquet availability, staff-transport auto-assign | ✅ |

Full detail: [traceability-matrix.md](../docs/thesis/knowledge-base/traceability-matrix.md).

## 3. Functional-requirement traceability

Implemented: FR-1..FR-11, FR-13..FR-20 and feature codes F1, F3-F9, F6-F7 (see [functional-requirements.md](../docs/thesis/knowledge-base/functional-requirements.md)). Divergences/gaps: **F10 commission** (not implemented), **F2 design upload/approval** (verify), **FR-17 signature** (custom, not Acrobat Sign).

## 4. Non-functional-requirement traceability

- RBAC/roles ✅ · Usability/responsive UI ✅ · Institutional workflow fit ✅
- Email/push notifications → **in-app notifications** (workaround) 🔧
- Availability SLA, automatic data backups, technical-support structure → **operational/infra, not verifiable in repo** ❓
- Security: JWT + RBAC ✅ (deeper security review out of scope here)

## 5. Features documented AND implemented

Contracts (entry, drafts, approval auto-distribution), menu tasting booking, inventory view/add/edit/delete (creative/linen/stockroom), procurement/purchasing with Accounting approval, digital approvals, payment tracking, pre-event & contract preparation tracking, banquet staffing, logistics booking (trucks/drivers), post-event checking, incident reporting (+image), printable/exportable forms, client & staff signature workflow, role-based dashboards, real-time status tracking. (Ch5 §5.1; confirmed in repo.)

## 6. Features documented BUT missing from the system

| Item | Thesis ref | Status |
|---|---|---|
| **Commission computation/distribution** | F10; Ch5 Accounting role & Finance module | **Genuine gap** — decide implement vs defer (TU-6) |
| Facebook Prophet inventory forecasting | §1.4.1.2, Scope §1.5.2 | Approved deviation (workaround: dynamic reservations) — update thesis (TU-3) |
| Email (Nodemailer) + push notifications | §1.4.2.5-6 | Approved deviation (in-app) — update thesis (TU-2) |
| Google Calendar/Maps APIs | §1.4.1.3, §1.4.2 | Approved deviation (internal logic) — update thesis (TU-4) |
| Acrobat Sign e-signature | §1.4.2, §5.3 | Approved deviation (custom signature) — update thesis (TU-1) |
| Client-facing design upload & approval (F2) | §1.4.1.1 | Verify with developer (❓) |

## 7. Features implemented BUT missing from the thesis (🆕)

- **Staff transportation** booking + automated passenger-vehicle assignment (headcount/availability/seat capacity); passenger-vehicle fleet.
- **Payment compliance engine:** PHP 30,000 reservation fee, 40/60 milestone timeline, 30-day aging, automatic **payment holds** + release.
- **Kitchen prep-window notifications** (2-week sourcing, 7-day begin-prep) and reworded approval alert.
- **Material freeze** (7-day lock on reserved materials; admin override).
- **"Awaiting Contract Close"** stage + Accounting "ready to close" notification after post-event checks.
- **Logistics workflow** sub-tabs (Book Transport / Staff Transport / Load & Dispatch) with completion tracking; **load manifest incl. kitchen items**; **per-department load readiness**; **driver pickup checklist**.
- **PDF financial-visibility restriction** (package price / contract value limited to Sales/Accounting/Admin); non-finance departments see redacted payment-hold messaging.
- Notification lifecycle: cleanup on contract deletion; short expiry after contract close.

## 8. Approved changes not yet reflected in the thesis

Based on this session's approved change requests (and pending confirmation these were client/panel-approved): staff transportation; kitchen tab/notification rework; payment-term "N/A at creation"; downloadable signature-ready PDF; logistics load manifest + readiness + workflow sub-tabs; post-event "awaiting close" flow; PDF price-visibility restriction; notification cleanup/expiry. → Fold into thesis via [recommended-thesis-updates.md](../docs/thesis/knowledge-base/recommended-thesis-updates.md) (TU-5, TU-10, etc.).

## 9. Outdated thesis descriptions

- "Four modules" (Ch1/§5.5) vs seven tested operational modules (Ch6). (TU-7)
- External APIs (Nodemailer/Prophet/Google/Acrobat) described as integrated. (TU-1..TU-4)
- Logistics as "third-party truck rental" only. (TU-5)
- Objectives citing unit/integration testing vs UAT actually used. (TU-9)
- Mobile-use objective vs desktop-optimized/responsive reality. (TU-8)
- TOC pagination placeholders ("54"/"44") in Ch4-7 — draft not finalized.

## 10. Possible scope conflicts

- **Internal scope tension:** Scope §1.5.2 excludes "third-party integrations," yet the architecture proposes Google/Acrobat/Prophet (all third-party). Resolved in practice by the workarounds; the paper should be reconciled. (Human decision.)
- **Commission** is a documented core Finance capability but unbuilt — either implement (scope-in) or defer (scope-note). (Human decision.)
- **Staff transportation** may be a scope expansion beyond "scheduling deliveries" — confirm approval. (Human decision.)

## 11. Recommended system corrections

1. **Decide on commission computation** (implement minimal version or mark Future Work). *Only real functional gap.*
2. Verify/clarify **guest-based auto-suggested quantities** (SO4) and **design upload/approval** (F2) — confirm present or note as not-built.
3. Optional: add a **minimal automated test suite** to back the O5/O6 "unit & integration testing" claim (otherwise reconcile wording).
4. Fix the pre-existing **`AccountingFinanceModule.tsx` type errors** that break `npm run build` (dev works; build doesn't).

## 12. Recommended thesis corrections

See [recommended-thesis-updates.md](../docs/thesis/knowledge-base/recommended-thesis-updates.md) — TU-1..TU-10. Priority: TU-1 (e-sign), TU-2 (notifications), TU-3 (forecasting/scope), TU-4 (Google APIs), TU-6 (commission), TU-10 (payment policy), TU-7 (module framing).

## 13. Human decisions required

- **Commission:** implement now or defer to Future Work? (TU-6)
- **Forecasting in Scope:** relabel/remove Prophet from Scope, or keep as Future Work? (TU-3, scope-level)
- **Staff transportation & payment-hold policy:** confirm these are client/panel-approved additions (TU-5, TU-10).
- **Evaluation method:** accept UAT as the documented method, or add automated tests? (TU-9)
- **Deployment status (O7):** is the system live with real users yet? (evidence not in repo)
- Confirm **NFR infra** (backups, support, availability) arrangements exist (not verifiable in code).

## 14. Possible panel questions caused by inconsistencies

1. Your thesis says Acrobat Sign / Nodemailer / Google APIs / Facebook Prophet — the system uses none of these. Why, and were the workarounds approved?
2. Where is the **commission computation** your Finance module and Accounting role describe?
3. Scope says "no third-party integrations," but the architecture lists several third-party APIs — how do you reconcile that?
4. Objectives mention **unit and integration testing**, but testing is UAT — where are the automated tests?
5. Is the system **mobile** (objective O4) or desktop-only (§1.4.2.6)? Which is it?
6. Logistics is described as third-party truck rental, but you manage an internal fleet and staff transport — is that within approved scope?
7. The paper describes **four modules**, but you tested seven — which is the real architecture?
8. Are the **PHP 30,000 reservation fee and 40/60 collection/hold rules** client-approved policy? They aren't in the thesis.
9. Is the system **deployed live** with real staff and feedback (objective O7)?
10. How do you ensure **availability/backups** (NFR §5.4.4) — is that implemented or operational?

---

### Method & honesty notes

- Thesis content was extracted as text (no OCR of figures); figure/BPMN/Gantt contents were **not** read and are flagged where relevant.
- "Not implemented" means not found in the current repository during this analysis; some items (deployment, backups, commission) may exist outside the repo or in unmerged work — treated as **needs human confirmation** where applicable.
- This report reflects the repository at analysis time on branch `CAP2`.
