# Open Questions for Juan Carlo & Scoping Notes

Areas where the business rules were thin or assumptions were made in code. Confirm these with Juan Carlo (and reflect in the thesis). Raised by the team 2026-07-26.

## 1. Logistics / staff transportation — assumptions (low-priority area)

Appendix H gives only: transportation requests **≥3 days prior**, Logistics allocates **trucks and drivers**, trucks sized by **cubic meters**, rent extra if over fleet capacity (7-day requisition + accounting approval). Everything more specific was a **reasonable dev assumption**, not a mandated rule:

- **Any problems found?** Only two, both handled: the same-day **vehicle double-booking** (fixed + verified), and the fleet needed **passenger vehicles seeded** for staff transport. Otherwise logistics/staff transport works. No blocking bugs.
- **Assumptions to confirm:** staff headcount = banquet assignments + supervisor; vehicle auto-selection = fewest passenger vehicles by seat capacity; the 3-day lead time is **not yet enforced** in code (advisory). 
- **Recommendation:** these are defensible as "operational assumptions"; confirm the seat/headcount basis with Juan Carlo, and decide whether the 3-day lead time should be **enforced** (currently not).

## 2. Accounting — budget allocation period

- **Question raised:** is Juan Carlo's budget allocation **monthly, semi-annual, or annual**? The requirements didn't specify.
- **What the system does now:** **MONTHLY.** The `FinanceBudget` model keys budgets by `periodMonth` (YYYY-MM); Accounting sets a budget **each month**, and suggestions come from the **trailing 3-month** average of procurement spend.
- **So:** the dev picked monthly. **If Juan Carlo actually budgets annually/semi-annually, this is a mismatch to fix** (moderate — model + UI change). If monthly is acceptable, it's already implemented and just needs confirming + documenting.
- **Action:** confirm the real period with Juan Carlo. Don't change code until confirmed.

## 3. Reports — needs real business reports (not just prints)

- **Concern raised:** reports feel too simple / print-oriented.
- **What exists now:** one backend endpoint (`/api/reports/department`) driving role-based sections with **charts, stat cards, tables, print, and Excel export** — so it's more than a print, but it's essentially **per-department summaries**, not business analytics.
- **Recommended real reports** (what a catering business actually needs) — priority order:
  1. **Accounts Receivable / Collections** — outstanding balances, **aging 30/60/90**, overdue & on-hold contracts, collection rate. (Directly supported by the payment engine + Appendix H.)
  2. **Sales & Revenue** — bookings and revenue over time, by **package type / client type**, tasting→contract **conversion rate**.
  3. **Event operations** — events per period, **pax volume**, venue utilization, peak-season load.
  4. **Procurement & spend vs budget** — spend by supplier/category against the monthly budget.
  5. **Post-event accountability** — missing-and-damaged summary, incident rates, return-variance by department (from the new reconciliation).
- **Effort:** moderate — each needs a backend aggregation endpoint + a UI section (reuse the existing chart/stat/table + Excel/print framework, so not from scratch). This is a **feature effort, not a quick fix**, and it strengthens objectives O3/O6 (dashboards/reports) and the Ch6 "Reports Module."
- **Suggested next step:** build **#1 (AR aging)** and **#2 (sales/revenue)** first as the highest-value, most defensible additions; queue the rest.

## Also still open (from the alignment report)

- Evaluation-method wording — UAT vs "unit & integration testing" (reword or add tests).
- Deployment (O7): **not deployed — intentional, defend first, then deploy.** (Resolved.)
- NFR infra (backups/support) — confirm arrangements.
