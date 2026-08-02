# Demo Script — Accounting (Budgeting) & Reports Modules

**Scope of this demo:** the two modules not covered in the previous defense — Accounting's **monthly operating budget** and the **Reports** module.
**Deliberately excluded:** the contract's full journey (booking → contract → approval → prep → close). The panel has already seen it. Do **not** walk Appendix B.1.

**Companion document:** `docs/FinalUserManual.docx`. Every beat below cites the manual section, figure, or table the panel can follow along with while you demo.

**Opening line (sets the frame):**
> "Since the contract lifecycle was covered in our last defense, we're focusing on the two modules that weren't: how Accounting sets and enforces its operating budget, and what the system reports back. We'll follow Chapter 4 and Chapter 13 of the user manual."

---

## Pre-demo checklist (do this before the panel arrives)

| # | Item | Why |
|---|---|---|
| 1 | Start the app: `npm run dev` — backend :5000, frontend :5173 | Both must be up |
| 2 | Log in as **accounting@juancarlos.com** | The whole demo is in this role |
| 3 | Confirm **August 2026** budget exists (Total ₱150,000; Creative ₱50,000 · Linen ₱40,000 · Stockroom ₱60,000) | Beat 1 baseline |
| 4 | Confirm the approval queue still has **PR-26-0007** (Creative · Tropical Entrance · ₱7,000) | Beat 2 uses it |
| 5 | **Set up the block (see Beat 2b).** Lower **Creative Inventory to ₱5,000** and save, so the ₱7,000 request gets blocked live. Raise it back to ₱50,000 after the demo. | Without this, nothing is over budget and the enforcement can't be shown live |
| 6 | Have the manual open at **Chapter 4** (printed or on a second screen) | Panel follows along |

> **Why step 5 matters:** all pending requests are currently well under their category budgets, so an over-budget block will not occur naturally. Either pre-lower the Creative budget as above, or narrate the rule from **Table 4.3** instead of demoing it.

---

## Beat 1 — Setting the monthly operating budget
**Manual:** §4.8 Monthly Operating Budget · **Figure 4.8.1** (Monthly budget editor) · supporting: **Table 4.1** (Accounting features)
**Time:** ~2 minutes

**Say:** "Accounting sets an operating budget every month. It's not a static number — the system proposes amounts from actual spending history."

**Do:**
1. Accounting Dashboard → **Finance** tab.
2. Point out the month selector and the current allocations per category.
3. Click **Standard Amounts** — show the template baseline.
4. Click **Suggest From Last 3 Months** — the Creative, Linen, and Stockroom amounts change.
5. Read the **Basis** line aloud: the suggestion derives those three from the trailing 3-month average of *confirmed procurement spend* (May 2026 – Jul 2026); other categories use the standard template.
6. Point at **Allocated total** vs **Unallocated** at the bottom.
7. Click **Save Monthly Budget**.

**Key point to land:** *"The budget is data-derived, not guessed — it comes from what the departments actually spent."*

---

## Beat 2 — The budget as a control (procurement approval)
**Manual:** §4.7 Procurement Budget Approval · **Figure 4.7.1** (approval queue with review checklist) · **Table 4.3** (Financial Business Rules)
**Time:** ~3 minutes — *this is the most important beat*

**Say:** "A budget that only records numbers isn't a control. Here's the budget actually deciding whether money is released."

### 2a — A normal approval
1. Accounting Dashboard → **Procurement Approval** tab.
2. Open a request — e.g. **PR-26-0030** (Stockroom · Crates · ₱1,800) or **PR-26-0032** (Linen · ₱128).
3. Walk the **review checklist** — every box must be ticked before approval is allowed.
4. Show the **budget basis note**: category allocation, available before approval, remaining after approval.
5. **Approve**. Purchasing is notified and can now procure.

### 2b — A blocked, over-budget request *(requires prep step 5)*
1. Open **PR-26-0007** (Creative · Tropical Entrance · **₱7,000**) against the lowered ₱5,000 Creative budget.
2. Attempt to approve → the system **blocks it** and reports the shortfall (requested vs available).
3. **Say:** "No manual policing. The month's allocation is checked at the moment of approval."
4. Optionally: return the request with a reason so Purchasing can revise — show the round-trip.

**Key point to land:** *"Budget approval is enforced by the system, not by memory."*

---

## Beat 3 — Reports module
**Manual:** §13.1 Department Reports · **Table 13.1 Report Contents per Role** · **Figure 13.1.1** (Reports page)
**Time:** ~4 minutes

**Say:** "Reports are role-based — every department gets its own. Table 13.1 in the manual lists what each role receives. We'll show the Accounting report."

**Do:**
1. Open **Reports** (still logged in as accounting). Set a wide date range so the charts are populated.
2. **Summary cards:** Contract Revenue · Cash Collected · Accounts Receivable · Overdue A/R · Available Budget Estimate.
3. **Monthly Collections Trend** — trailing 6 months of completed payments.
4. **Accounts Receivable Aging** chart, then scroll to the **A/R Aging Schedule** table — aged by the milestone currently owed, oldest first, with days overdue and aging bucket.
5. **Financial Position Summary** — collected, receivable, confirmed expenses, open commitments.
6. **Procurement Budget Register** — ties directly back to Beat 2.
7. **Export to Excel** (and/or **Print**) — do this live; it lands well.
8. Hold up **Table 13.1** and note that Sales, Kitchen, Logistics, Banquet, Purchasing, and the inventory departments each get their own report from the same engine — Admin sees all of it.

**Key point to land:** *"One reporting engine, role-scoped output, exportable for management."*

---

## Beat 4 — Close on a self-contained scenario
**Manual:** §4.10 Accounting Scenarios · Appendix A **Table A.1** (Collection & Preparation Timeline)
**Time:** ~2 minutes — narrate, no long clicking

Pick **one** (both stand alone — neither requires the contract journey):

**Option A — "Budget request exceeds the month's budget"** *(best pairing with Beats 1–2)*
> "Approval is blocked with the shortfall shown. Accounting either adjusts the monthly allocation or returns the request to Purchasing. The month's budget holds."

**Option B — "A payment is missed"** *(if the panel asks about collections)*
> Escalation runs itself: follow-up alert one month before the 40% due date → milestone due → 30-day aging → uncollectible. For the final 60%, an unpaid balance past due **automatically places the contract on hold** and blocks preparation until it's settled or management releases it. Show §4.6 / **Figure 4.6.1** if they want to see it.
> Point at **Table A.1** — these timings are Juan Carlo's own business rules (thesis Appendix H), enforced by the system.

---

## Manual sections to have bookmarked

| Beat | Section | Figure / Table |
|---|---|---|
| Frame | Ch. 4 opener, §4.1 | Table 4.1 Accounting Features |
| 1 | §4.8 Monthly Operating Budget | Figure 4.8.1 |
| 2 | §4.7 Procurement Budget Approval | Figure 4.7.1 · Table 4.3 |
| 3 | §13.1 Department Reports | Figure 13.1.1 · **Table 13.1** |
| 4 | §4.10 Accounting Scenarios · §4.6 Payment Holds | Figure 4.6.1 · Table A.1 |
| Reference | §4.2 Notifications | Table 4.2 |

---

## Likely panel questions & where to answer from

| Question | Answer / manual reference |
|---|---|
| "Is the budget monthly, annual, or semi-annual?" | Currently **monthly** — Accounting sets it each month (§4.8). *Be honest:* the period was not specified in the requirements, so monthly was implemented; it's an open item to confirm with Juan Carlo. |
| "Where does the suggestion come from?" | Trailing **3-month average of confirmed procurement spend** for Creative, Linen, Stockroom; standard template for the rest. Shown in the Basis line, §4.8. |
| "What stops someone from over-spending?" | The budget check at approval (§4.7) — demoed in Beat 2b. |
| "Are these your rules or the client's?" | Juan Carlo's documented business rules — thesis **Appendix H**; summarized in **Table 4.3** and **Table A.1**. |
| "Can other departments see the money?" | No. Package price and total contract value are restricted to Sales, Accounting, and Admin — on screen **and** in exported PDFs (Table A.2). |
| "Can reports be used outside the system?" | Yes — every report prints and **exports to Excel** (§13.1); demoed in Beat 3. |
| "Is it deployed?" | Not yet — deployment follows a successful defense. |

---

## Timing

| Beat | Minutes |
|---|---|
| Frame | 0:30 |
| 1 — Budget | 2:00 |
| 2 — Enforcement | 3:00 |
| 3 — Reports | 4:00 |
| 4 — Scenario | 2:00 |
| Buffer / questions | remainder |
| **Total demo** | **~12 minutes** |

## After the demo
Restore the **Creative Inventory budget to ₱50,000** if you lowered it for Beat 2b.
