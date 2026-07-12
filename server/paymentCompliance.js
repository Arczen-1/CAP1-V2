const Contract = require('./models/Contract');
const Notification = require('./models/Notification');
const User = require('./models/User');

// Collection-timeline rules (keep in sync with getPaymentMilestones in routes/contracts.js):
// - 40% of the contract value is due 2 months after the booking date, with a
//   follow-up alert 1 month ahead of that due date.
// - A missed 40% enters a 30-day aging window; past it the account is uncollectible.
// - The remaining 60% must be fully collected 2 months before the event date.
//   Contracts that reach that deadline unpaid are placed ON HOLD (Final Balance
//   Overdue): preparation, release, and execution are blocked until the balance
//   is settled or management releases the hold. The 40% is never auto-refunded;
//   refunds require a formal cancellation letter and Execom review outside the system.
// - Clients may pay 100% early at any time; a fully paid contract skips every rule.
const RESERVATION_FEE_AMOUNT = 30000;
const PAYMENT_AGING_WINDOW_DAYS = 30;
const ACTIVE_STATUSES = ['submitted', 'accounting_review', 'approved'];

const startOfDay = (value) => { const d = new Date(value); d.setHours(0, 0, 0, 0); return d; };
const endOfDay = (value) => { const d = new Date(value); d.setHours(23, 59, 59, 999); return d; };
const addDays = (value, days) => { const d = new Date(value); d.setDate(d.getDate() + days); return d; };
const addMonths = (value, months) => { const d = new Date(value); d.setMonth(d.getMonth() + months); return d; };
const roundToTwo = (value) => Math.round((value || 0) * 100) / 100;

const getNormalizedPaymentSplit = (contract = {}) => {
  const rawDown = Number(contract.downPaymentPercent);
  const rawFinal = Number(contract.finalPaymentPercent);

  if (rawDown >= 100 || rawFinal <= 0) {
    return { downPaymentPercent: 100, finalPaymentPercent: 0 };
  }

  if (rawDown === 60 && rawFinal === 40) {
    return { downPaymentPercent: 40, finalPaymentPercent: 60 };
  }

  return {
    downPaymentPercent: Number.isFinite(rawDown) && rawDown > 0 ? rawDown : 40,
    finalPaymentPercent: Number.isFinite(rawFinal) && rawFinal >= 0 ? rawFinal : 60
  };
};

const getFinalPaymentDueDate = (contract) => {
  const dueDate = new Date(contract.eventDate || new Date());
  dueDate.setMonth(dueDate.getMonth() - 2);
  return dueDate;
};

const getPaymentMilestones = (contract) => {
  const totalContractValue = Number(contract.totalContractValue) || 0;
  const { downPaymentPercent, finalPaymentPercent } = getNormalizedPaymentSplit(contract);
  const downPaymentRate = downPaymentPercent / 100;
  const fullPaymentPlan = downPaymentRate >= 1 || finalPaymentPercent <= 0;
  const totalPaid = (contract.payments || [])
    .filter((payment) => payment.status === 'completed')
    .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  const requiredDownPayment = roundToTwo(totalContractValue * downPaymentRate);
  const bookingDate = contract.bookingDate || contract.createdAt || new Date();
  const fortyPercentDueDate = addMonths(bookingDate, 2);
  const fortyPercentFollowUpDate = addMonths(fortyPercentDueDate, -1);
  const finalBalanceDueDate = getFinalPaymentDueDate(contract);
  const agingEndsAt = addDays(fortyPercentDueDate, PAYMENT_AGING_WINDOW_DAYS);
  const now = new Date();
  const downPaymentSatisfied = fullPaymentPlan ? totalPaid >= totalContractValue : totalPaid >= requiredDownPayment;
  const fullyPaid = totalPaid >= totalContractValue;

  return {
    totalPaid,
    requiredDownPayment,
    remainingBalance: Math.max(0, totalContractValue - totalPaid),
    fortyPercentDueDate,
    fortyPercentFollowUpDate,
    finalBalanceDueDate,
    agingEndsAt,
    downPaymentSatisfied,
    fullyPaid,
    uncollectible: !downPaymentSatisfied && now > endOfDay(agingEndsAt)
  };
};

const formatDate = (value) => new Date(value).toLocaleDateString('en-PH', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

const formatAmount = (value) => new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 2
}).format(Number(value) || 0);

// Creates one notification per recipient, exactly once per contract + type +
// title. Re-running the sweep never duplicates an alert that was already sent.
const notifyRolesOnce = async ({ contract, roles, type, title, message, priority = 'high' }) => {
  const alreadySent = await Notification.exists({ contract: contract._id, type, title });
  if (alreadySent) {
    return false;
  }

  const users = await User.find({ role: { $in: roles }, isActive: true }).select('_id');
  if (users.length === 0) {
    return false;
  }

  await Notification.insertMany(users.map((user) => ({
    recipient: user._id,
    type,
    title,
    message,
    contract: contract._id,
    actionUrl: `/contracts/${contract._id}?tab=payments`,
    actionLabel: 'Review payment',
    department: 'accounting',
    priority
  })));

  return true;
};

let sweepRunning = false;

const runPaymentComplianceSweep = async () => {
  if (sweepRunning) {
    return { skipped: true };
  }

  sweepRunning = true;
  const summary = { checked: 0, notified: 0, held: [], released: [] };

  try {
    const now = new Date();
    const contracts = await Contract.find({ status: { $in: ACTIVE_STATUSES } });
    summary.checked = contracts.length;

    for (const contract of contracts) {
      const milestones = getPaymentMilestones(contract);
      const eventStart = startOfDay(contract.eventDate);

      // Milestone 1 follow-up: alert collections 1 month before the 40% due date.
      if (!milestones.downPaymentSatisfied && now >= milestones.fortyPercentFollowUpDate) {
        const sent = await notifyRolesOnce({
          contract,
          roles: ['accounting'],
          type: 'payment_followup',
          title: `Start 40% payment follow-up: ${contract.contractNumber}`,
          message: `${contract.clientName}'s 40% collection of ${formatAmount(milestones.requiredDownPayment)} is due on ${formatDate(milestones.fortyPercentDueDate)}. Begin payment follow-ups with the client now.`,
          priority: 'medium'
        });
        if (sent) summary.notified += 1;
      }

      // Milestone 1: the 40% collection task at booking + 2 months.
      if (!milestones.downPaymentSatisfied && now >= milestones.fortyPercentDueDate) {
        const sent = await notifyRolesOnce({
          contract,
          roles: ['accounting'],
          type: 'payment_milestone_due',
          title: `40% collection task: ${contract.contractNumber}`,
          message: `${contract.clientName}'s 40% collection of ${formatAmount(milestones.requiredDownPayment)} reached its due date (${formatDate(milestones.fortyPercentDueDate)}). Unresolved accounts enter the 30-day aging window ending ${formatDate(milestones.agingEndsAt)}.`
        });
        if (sent) summary.notified += 1;
      }

      // Aging window expired without payment: the account is uncollectible.
      if (milestones.uncollectible) {
        const sent = await notifyRolesOnce({
          contract,
          roles: ['accounting'],
          type: 'payment_uncollectible',
          title: `Account uncollectible: ${contract.contractNumber}`,
          message: `${contract.clientName}'s 40% collection was not received within the 30-day aging window that ended ${formatDate(milestones.agingEndsAt)}. The account is now marked uncollectible.`
        });
        if (sent) summary.notified += 1;
      }

      // A later payment settles the balance: release the hold automatically.
      if (milestones.fullyPaid && contract.paymentHold?.active) {
        contract.paymentHold.active = false;
        contract.paymentHold.releasedAt = now;
        contract.paymentHold.overrideNote = 'Released automatically - remaining balance fully settled.';
        await contract.save();
        summary.released.push(contract.contractNumber);
        continue;
      }

      if (!milestones.fullyPaid) {
        const pastFinalDue = now > endOfDay(milestones.finalBalanceDueDate);

        // Milestone 2 enforcement: an unpaid balance past event - 2 months puts
        // the contract on hold (Final Balance Overdue). Preparation, release,
        // and execution stay blocked until the balance is settled or management
        // releases the hold. Skipped once management has overridden the hold,
        // and for past events (the closure checklist handles those).
        if (pastFinalDue && now < eventStart && !contract.paymentHold?.active && !contract.paymentHold?.managementOverride) {
          contract.paymentHold = {
            ...(contract.paymentHold || {}),
            active: true,
            reason: `Final balance of ${formatAmount(milestones.remainingBalance)} was not fully collected by ${formatDate(milestones.finalBalanceDueDate)} (2 months before the event).`,
            startedAt: now,
            managementOverride: false
          };
          await contract.save();
          summary.held.push(contract.contractNumber);

          await notifyRolesOnce({
            contract,
            roles: ['accounting', 'sales', 'admin'],
            type: 'contract_on_hold',
            title: `Final balance overdue - contract on hold: ${contract.contractNumber}`,
            message: `${contract.clientName}'s event on ${formatDate(contract.eventDate)} is on hold. The remaining balance of ${formatAmount(milestones.remainingBalance)} was not collected by ${formatDate(milestones.finalBalanceDueDate)}. Preparation is blocked until payment is settled or management releases the hold. The PHP 30,000 reservation fee and the 40% collection remain non-refundable; refunds require a formal cancellation letter and Execom review.`
          });
          continue;
        }

        // Milestone 2 notification: final 60% balance due 2 months before the event.
        if (now >= addMonths(milestones.finalBalanceDueDate, -1)) {
          const sent = await notifyRolesOnce({
            contract,
            roles: ['accounting'],
            type: 'final_balance_due',
            title: `Final balance due ${formatDate(milestones.finalBalanceDueDate)}: ${contract.contractNumber}`,
            message: `${contract.clientName}'s remaining balance of ${formatAmount(milestones.remainingBalance)} must be fully collected by ${formatDate(milestones.finalBalanceDueDate)} (2 months before the event on ${formatDate(contract.eventDate)}). Contracts unpaid past that date are placed on hold automatically.`
          });
          if (sent) summary.notified += 1;
        }
      }
    }
  } catch (error) {
    console.error('Payment compliance sweep failed:', error.message);
  } finally {
    sweepRunning = false;
  }

  if (summary.held.length > 0) {
    console.log(`Payment compliance sweep: placed on hold ${summary.held.join(', ')} (final balance unpaid past due date)`);
  }
  if (summary.released.length > 0) {
    console.log(`Payment compliance sweep: released hold on ${summary.released.join(', ')} (balance settled)`);
  }

  return summary;
};

const startPaymentComplianceSweep = (intervalMs = 6 * 60 * 60 * 1000) => {
  runPaymentComplianceSweep();
  const timer = setInterval(runPaymentComplianceSweep, intervalMs);
  if (typeof timer.unref === 'function') {
    timer.unref();
  }
};

module.exports = { runPaymentComplianceSweep, startPaymentComplianceSweep };
