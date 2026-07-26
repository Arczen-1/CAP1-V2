# Evaluation Criteria

**Source:** Ch1 §1.3.2 objectives O5-O7 (PDF p.16); Ch5 §5.2.2 SO7-SO9 (PDF pp.65-66); Ch6 §6.1 (PDF pp.77+). See [thesis-index.md](thesis-index.md).

## How success is measured (per thesis)

1. **Functional correctness** — each module behaves per its acceptance test (Ch6 test tables: Test Case, Procedure, Input, Expected, Actual, Status).
2. **Reliability & effectiveness** in addressing the identified problems P1-P18 (objective O5).
3. **Accuracy on real operational data** — dashboards and reports produce correct outputs when populated with real data (O6, SO8).
4. **Usability** — minimal training, intuitive UI; validated via user feedback (SO9, NFR-1).
5. **User feedback** — performance, usability issues, new ideas (NFR-4, §5.4.5).
6. **Live-environment deployment** and actual staff use (O7).

## Evaluation method actually used (Ch6 §6.1.1, PDF p.77)

**User Acceptance Testing (UAT)** — departmental personnel simulate day-to-day scenarios; role-based access enforced; iterative refinement from feedback. Results tabulated per module:

- Login Module (§6.1.2.1)
- Contract Management Module (§6.1.2.2)
- Accounting and Payment Module (§6.1.2.3)
- Inventory Management Module (§6.1.2.4)
- Procurement and Purchasing Module (§6.1.2.5)
- Logistics Module (§6.1.2.6)
- Reports Module (§6.1.2.7)

## Acceptance-criteria pattern for AI-agent changes

For each queued change, the Researcher/Tester should express acceptance criteria in the same shape the thesis uses (measurable, per-scenario): **Procedure → Input → Expected → Actual → Status**, covering normal, invalid, boundary, authorization, regression, and failure cases (see `.claude/agents/capstone-researcher.md` and `capstone-tester.md`).

## Alignment note

- Objectives mention **unit and integration testing** (O5, O6, SO7), but the executed method is **manual UAT**; no automated test suite is present in the repo. Reconcile the objective wording with the UAT reality, or add a minimal automated suite. (Human decision — see alignment report.)
- The thesis's tested-module names (Login, Contract Management, Accounting & Payment, Inventory, Procurement & Purchasing, Logistics, Reports) match the **current system** better than the Chapter 1 "four modules," confirming the system evolved past the original module framing.
