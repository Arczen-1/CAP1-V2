const Contract = require('./models/Contract');
const Notification = require('./models/Notification');
const User = require('./models/User');

// Transport lead-time rule (Appendix H): any department that needs transport must
// arrange it at least 3 days before the event. This sweep turns that rule into a
// reminder — once an approved event moves inside the 3-day window with no truck
// and/or no staff transport booked, Logistics (and Admin) get a single alert.
// It runs like the payment and kitchen sweeps, so it fires as the date approaches
// even if nobody is looking at the logistics screen.
const TRANSPORT_LEAD_DAYS = 3;

const startOfDay = (value) => { const d = new Date(value); d.setHours(0, 0, 0, 0); return d; };

const getDaysUntil = (eventDate) => {
  const event = startOfDay(eventDate).getTime();
  const today = startOfDay(new Date()).getTime();
  return Math.ceil((event - today) / (1000 * 60 * 60 * 24));
};

// Staff needing transport = assigned banquet staff (plus the supervisor, if any).
// Mirrors getStaffHeadcount in routes/contracts.js.
const getStaffHeadcount = (contract) => (
  (contract.banquetAssignment?.assignments || []).length + (contract.assignedSupervisor ? 1 : 0)
);

const describeWhen = (daysUntil) => {
  if (daysUntil <= 0) return 'today';
  if (daysUntil === 1) return 'tomorrow';
  return `in ${daysUntil} days`;
};

// One notification per recipient, exactly once per contract + type + title.
const notifyTransportOnce = async ({ contract, title, message }) => {
  const alreadySent = await Notification.exists({ contract: contract._id, type: 'deadline_reminder', title });
  if (alreadySent) {
    return false;
  }

  const users = await User.find({ role: { $in: ['logistics', 'admin'] }, isActive: true }).select('_id role');
  if (users.length === 0) {
    return false;
  }

  await Notification.insertMany(users.map((user) => ({
    recipient: user._id,
    type: 'deadline_reminder',
    title,
    message,
    contract: contract._id,
    actionUrl: `/contracts/${contract._id}?tab=logistics`,
    actionLabel: 'Book transport',
    department: 'logistics',
    priority: 'high'
  })));

  return true;
};

let sweepRunning = false;

const runTransportLeadTimeSweep = async () => {
  if (sweepRunning) {
    return { skipped: true };
  }

  sweepRunning = true;
  const summary = { checked: 0, notified: 0 };

  try {
    const contracts = await Contract.find({ status: 'approved' });
    summary.checked = contracts.length;

    for (const contract of contracts) {
      // A held contract is blocked from preparation anyway, so don't nag about transport.
      if (contract.paymentHold?.active) {
        continue;
      }

      const daysUntil = getDaysUntil(contract.eventDate);
      // Only inside the 3-day window and not past the event.
      if (daysUntil < 0 || daysUntil >= TRANSPORT_LEAD_DAYS) {
        continue;
      }

      const truckBooked = Boolean(contract.logisticsAssignment?.truck);
      const staffHeadcount = getStaffHeadcount(contract);
      const staffTransportBooked = Boolean(contract.staffTransport?.vehicles?.length);
      const needsTruck = !truckBooked;
      const needsStaffTransport = staffHeadcount > 0 && !staffTransportBooked;

      // Nothing outstanding — every needed transport is already booked.
      if (!needsTruck && !needsStaffTransport) {
        continue;
      }

      let missingClause;
      if (needsTruck && needsStaffTransport) {
        missingClause = 'the delivery truck and staff transport are not booked yet';
      } else if (needsTruck) {
        missingClause = 'the delivery truck is not booked yet';
      } else {
        missingClause = `staff transport for the ${staffHeadcount} assigned staff is not booked yet`;
      }

      const sent = await notifyTransportOnce({
        contract,
        title: `Transport not booked yet: ${contract.contractNumber}`,
        message: `${contract.clientName}'s event is ${describeWhen(daysUntil)} and ${missingClause}. Please book it now — transport should be arranged at least 3 days before the event.`
      });
      if (sent) summary.notified += 1;
    }
  } catch (error) {
    console.error('Transport lead-time sweep failed:', error.message);
  } finally {
    sweepRunning = false;
  }

  return summary;
};

const startTransportLeadTimeSweep = (intervalMs = 6 * 60 * 60 * 1000) => {
  runTransportLeadTimeSweep();
  const timer = setInterval(runTransportLeadTimeSweep, intervalMs);
  if (typeof timer.unref === 'function') {
    timer.unref();
  }
};

module.exports = { runTransportLeadTimeSweep, startTransportLeadTimeSweep };
