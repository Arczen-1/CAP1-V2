# Thesis Decisions Log

Owner-directed decisions on the open items from the [alignment report](../../../agent-artifacts/thesis-system-alignment-report.md). Recorded 2026-07-26. These resolve how the **thesis draft** should describe the system; apply them when revising the PDF (originals are not modified here).

---

## D-1 — Sales commission computation → **DEFER to Future Work**

- **Decision:** Do **not** build commission computation/distribution in this milestone. Move it to "Recommendations / Future Work" in the thesis.
- **Rationale:** It is a whole new feature (not a bug/stabilization item), the current focus is bugs + department-workflow correctness ("no major system changes"), and the thesis draft does not specify the commission formula or rate — so it cannot be built or defended precisely right now.
- **Apply to thesis:**
  - Ch1 §1.4.1.4 (F10) and Ch5 §5.5 Finance module: soften "automatically calculates/distributes commission" → describe it as planned/Future Work.
  - Ch5 §5.4.1 Accounting role: change "distribute commissions to sales agents" → note this is a manual/offline step for now, targeted for a future release.
- **Supersedes:** [recommended-thesis-updates.md](recommended-thesis-updates.md) TU-6 (now DECIDED: defer).
- **If revisited:** requires the client-approved commission formula + rate before implementation; then re-queue as a change request.

## D-2 — Inventory forecasting (Facebook Prophet) → **Reframe + move Prophet to Future Work**

- **Decision:** Describe the **actual** implemented approach (real-time availability), and move ML forecasting (Facebook Prophet) to "Future Work." Do not claim Prophet is integrated.
- **Rationale:** Prophet is not implemented; the system instead prevents shortages with **dynamic, same-day availability checks** (live availability computed from other active contracts on the event date) plus shortage alerts and procurement requests — a working, defensible workaround. Building Prophet is out of scope for this stabilization milestone.
- **Apply to thesis:**
  - Ch1 §1.4.1.2, §1.4.2, and **Scope §1.5.2**: replace "basic inventory forecasting … through Facebook Prophet" with a description of real-time availability/shortage detection; list Prophet-based demand forecasting under Recommendations / Future Work.
  - Note the Scope-section wording is the sensitive one (forecasting is currently named as an in-scope deliverable) — this is a scope-level edit the panel may probe; be ready to explain the substitution.
- **Supersedes:** [recommended-thesis-updates.md](recommended-thesis-updates.md) TU-3 (now DECIDED: reframe + defer Prophet).

---

## D-3 — Payment/hold policy, financial confidentiality, staff transport, return reconciliation → **CONFIRMED client-approved (Appendix H)**

- **Decision/finding:** These are **Juan Carlo's actual business rules**, documented in **Appendix H "Current Business Rule"** (PDF pp.137–138) and corroborated by Appendix I (client interview). Confirmed by the owner on 2026-07-26.
- **Covers:** ₱30k reservation fee + 40/60 milestones + aging + auto-hold + no-refund; **package price/total value visible only to Accounting & Sales**; material freeze; **department/staff transportation** (≥3-day request, Logistics allocates trucks/drivers); **return reconciliation** (loaded-back must match checklist; return + second count; variance → missing-and-damaged); guest brackets; incident reporting.
- **Consequence:** These are **approved scope**, not scope expansions. No thesis *addition* needed — Appendix H already documents them. **Recommended:** cross-reference Appendix H from the Finance/Logistics chapters so the main body and appendix agree. See [business-rules-appendix-h.md](business-rules-appendix-h.md).
- **Supersedes:** TU-5 and TU-10 (were "needs approval / add to thesis" → now "already documented in Appendix H; cross-reference only").

## Still open (not decided here)

- Evaluation method wording — UAT vs unit/integration testing (TU-9).
- Live-deployment status (objective O7) and NFR infra (backups/support) — factual confirmation.
