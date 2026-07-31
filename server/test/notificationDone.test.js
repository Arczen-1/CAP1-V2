/**
 * Resolver test harness for notification "Done" tags.
 *
 * Every notification the system emits is checked here in BOTH states — before the
 * department acts (must be red / not done) and after it acts (must be green /
 * done) — so a Done tag can never silently fail to enforce for any department.
 *
 * Pure functions, no database needed. Run: node server/test/notificationDone.test.js
 */

const {
  isContractNotificationDone,
  isProcurementNotificationDone
} = require('../routes/notifications');

let passed = 0;
let failed = 0;
const failures = [];

const check = (label, actual, expected) => {
  if (actual === expected) {
    passed += 1;
  } else {
    failed += 1;
    failures.push(`  FAIL  ${label}\n        expected actionDone=${expected}, got ${actual}`);
  }
};

// Builders -------------------------------------------------------------------
const note = (over = {}) => ({
  type: 'task_assigned', title: '', message: '', actionLabel: '', department: null, ...over
});
const contract = (over = {}) => ({
  status: 'draft', paymentStatus: 'unpaid', clientSigned: false,
  departmentProgress: {}, sectionConfirmations: {}, paymentHold: { active: false },
  logisticsAssignment: {}, staffTransport: { vehicles: [] },
  creativeAssets: [], linenRequirements: [], equipmentChecklist: [], ...over
});

const contractDone = (label, n, c, expected) => check(label, isContractNotificationDone(n, c), expected);
const procDone = (label, n, r, expected) => check(label, isProcurementNotificationDone(n, r), expected);

// ============================================================ CONTRACT RESOLVER

// 1. Draft inventory validation — Creative / Linen / Stockroom
for (const dept of ['creative', 'linen', 'stockroom']) {
  const n = note({ department: dept, title: `Draft inventory validation needed for JC-1`, actionLabel: 'Validate inventory' });
  contractDone(`${dept}: validation — not confirmed`, n, contract(), false);
  contractDone(`${dept}: validation — section confirmed`, n, contract({ sectionConfirmations: { [dept]: { confirmed: true } } }), true);
  contractDone(`${dept}: validation — past draft`, n, contract({ status: 'submitted' }), true);
}

// 2. Draft inventory changed (re-validation) — Creative
{
  const n = note({ department: 'creative', title: 'Draft inventory changed for JC-1', actionLabel: 'Validate inventory' });
  contractDone('creative: inventory changed — not confirmed', n, contract(), false);
  contractDone('creative: inventory changed — confirmed', n, contract({ sectionConfirmations: { creative: { confirmed: true } } }), true);
}

// 3. Sales draft prompts
{
  const titles = [
    'Draft contract ready for payment term confirmation',
    'Inventory validation complete for JC-1',
    'Creative confirmed for JC-1',
    'Payment arrangement confirmed for JC-1'
  ];
  for (const title of titles) {
    const n = note({ department: 'sales', title });
    contractDone(`sales: "${title}" — payments not confirmed`, n, contract(), false);
    contractDone(`sales: "${title}" — payments confirmed`, n, contract({ sectionConfirmations: { payments: { confirmed: true } } }), true);
    contractDone(`sales: "${title}" — past draft`, n, contract({ status: 'pending_client_signature' }), true);
  }
}

// 4. Signed contract ready for Accounting (contract_submitted)
{
  const n = note({ type: 'contract_submitted', department: 'accounting', title: 'Signed contract ready for Accounting: JC-1' });
  contractDone('accounting: signed ready — submitted', n, contract({ status: 'submitted' }), false);
  contractDone('accounting: signed ready — approved', n, contract({ status: 'approved' }), true);
}

// 5. Waiting for client signature
{
  const n = note({ type: 'contract_submitted', department: 'sales', title: 'JC-1 is waiting for client signature' });
  contractDone('sales: client signature — not signed', n, contract({ status: 'pending_client_signature' }), false);
  contractDone('sales: client signature — signed', n, contract({ status: 'submitted', clientSigned: true }), true);
}

// 6. Kitchen — approved event + prep reminders (progress-based)
for (const title of ['Approved event - review menu for JC-1', 'Kitchen: begin preparations for JC-1']) {
  const type = title.startsWith('Kitchen:') ? 'deadline_reminder' : 'contract_approved';
  const n = note({ type, department: 'kitchen', title });
  contractDone(`kitchen: "${title}" — half prepared`, n, contract({ status: 'approved', departmentProgress: { kitchen: 50 } }), false);
  contractDone(`kitchen: "${title}" — prepared`, n, contract({ status: 'approved', departmentProgress: { kitchen: 100 } }), true);
}

// 7. Banquet — approved event (coverage progress)
{
  const n = note({ type: 'contract_approved', department: 'banquet', title: 'Approved event ready for banquet: JC-1' });
  contractDone('banquet: approved — understaffed', n, contract({ status: 'approved', departmentProgress: { banquet: 40 } }), false);
  contractDone('banquet: approved — fully staffed', n, contract({ status: 'approved', departmentProgress: { banquet: 100 } }), true);
}

// 8. Logistics — approved event (resolves on truck booked)
{
  const n = note({ type: 'contract_approved', department: 'logistics', title: 'Approved event ready for logistics: JC-1' });
  contractDone('logistics: approved — no truck', n, contract({ status: 'approved' }), false);
  contractDone('logistics: approved — truck booked', n, contract({ status: 'approved', logisticsAssignment: { truck: 'TRUCK1' } }), true);
}

// 9. Logistics — transport lead-time reminder
{
  const n = note({ type: 'deadline_reminder', department: 'logistics', title: 'Transport not booked yet: JC-1' });
  contractDone('logistics: transport reminder — nothing booked', n, contract({ status: 'approved' }), false);
  contractDone('logistics: transport reminder — truck booked', n, contract({ status: 'approved', logisticsAssignment: { truck: 'T1' } }), true);
  contractDone('logistics: transport reminder — staff transport booked', n, contract({ status: 'approved', staffTransport: { vehicles: [{ truck: 'V1' }] } }), true);
}

// 10. Creative/Linen/Stockroom — approved event prep (progress-based)
for (const dept of ['creative', 'linen', 'stockroom']) {
  const n = note({ type: 'contract_approved', department: dept, title: `Approved event ready for ${dept}: JC-1` });
  contractDone(`${dept}: approved prep — half`, n, contract({ status: 'approved', departmentProgress: { [dept]: 50 } }), false);
  contractDone(`${dept}: approved prep — done`, n, contract({ status: 'approved', departmentProgress: { [dept]: 100 } }), true);
}

// 11. Ready to close (must NOT be done at approval; only when completed)
{
  const n = note({ type: 'deadline_reminder', department: 'accounting', title: 'Ready to close: JC-1', actionLabel: 'Close contract' });
  contractDone('accounting: ready to close — approved (still open)', n, contract({ status: 'approved', departmentProgress: { accounting: 100 } }), false);
  contractDone('accounting: ready to close — completed', n, contract({ status: 'completed' }), true);
}

// 12. Post-event checks — Creative
{
  const n = note({ type: 'deadline_reminder', department: 'creative', title: 'Post-event checks ready: JC-1' });
  contractDone('creative: post-event — pending', n, contract({ status: 'approved', creativeAssets: [{ postEventStatus: 'pending_check' }] }), false);
  contractDone('creative: post-event — all checked', n, contract({ status: 'approved', creativeAssets: [{ postEventStatus: 'checked_ok' }] }), true);
}

// 13. Payment-timeline sweeps (resolve when fully paid)
for (const type of ['payment_followup', 'payment_milestone_due', 'payment_uncollectible', 'final_balance_due']) {
  const n = note({ type, department: 'accounting', title: `${type} JC-1` });
  contractDone(`accounting: ${type} — unpaid`, n, contract({ status: 'approved', paymentStatus: 'partially_paid' }), false);
  contractDone(`accounting: ${type} — paid`, n, contract({ status: 'approved', paymentStatus: 'paid' }), true);
}

// 14. On hold
{
  const n = note({ type: 'contract_on_hold', department: 'accounting', title: 'Final balance overdue - contract on hold: JC-1' });
  contractDone('accounting: on hold — active', n, contract({ status: 'approved', paymentHold: { active: true } }), false);
  contractDone('accounting: on hold — released', n, contract({ status: 'approved', paymentHold: { active: false } }), true);
}

// 15. Any notification on a completed/cancelled contract resolves
{
  const n = note({ department: 'creative', title: 'Draft inventory validation needed for JC-1' });
  contractDone('completed contract resolves everything', n, contract({ status: 'completed' }), true);
  contractDone('cancelled contract resolves everything', n, contract({ status: 'cancelled' }), true);
}

// ========================================================= PROCUREMENT RESOLVER

const req = (status) => ({ status });

// 16. New procurement request (purchasing)
{
  const n = note({ department: 'purchasing', title: 'New Stockroom procurement request' });
  procDone('purchasing: new request — requested', n, req('requested'), false);
  procDone('purchasing: new request — quoted', n, req('awaiting_accounting_approval'), true);
}

// 17. Budget approval needed (accounting)
{
  const n = note({ department: 'accounting', title: 'Budget approval needed' });
  procDone('accounting: budget approval — awaiting', n, req('awaiting_accounting_approval'), false);
  procDone('accounting: budget approval — decided', n, req('approved'), true);
}

// 18. Budget request approved (purchasing acts on it)
{
  const n = note({ department: 'purchasing', title: 'Budget request approved', actionLabel: 'Record purchase proof' });
  procDone('purchasing: approved budget — not purchased', n, req('approved'), false);
  procDone('purchasing: approved budget — proof submitted', n, req('proof_submitted'), true);
}

// 19. Expense confirmation needed (accounting)
{
  const n = note({ department: 'accounting', title: 'Expense confirmation needed' });
  procDone('accounting: expense — proof submitted', n, req('proof_submitted'), false);
  procDone('accounting: expense — fulfilled', n, req('fulfilled'), true);
}

// 20. Proof needs revision (purchasing)
{
  const n = note({ department: 'purchasing', title: 'Proof needs revision', actionLabel: 'Update proof' });
  procDone('purchasing: proof revision — needs revision', n, req('proof_needs_revision'), false);
  procDone('purchasing: proof revision — resubmitted', n, req('proof_submitted'), true);
}

// 21. Fulfilled / cancelled requests resolve everything
{
  const n = note({ department: 'accounting', title: 'Budget approval needed' });
  procDone('procurement: fulfilled resolves', n, req('fulfilled'), true);
  procDone('procurement: cancelled resolves', n, req('cancelled'), true);
}

// ============================================================ REPORT
console.log(`\nNotification Done-tag resolver test`);
console.log(`===================================`);
if (failures.length) {
  console.log(failures.join('\n'));
}
console.log(`\n${passed} passed, ${failed} failed (${passed + failed} assertions).`);
process.exit(failed === 0 ? 0 : 1);
