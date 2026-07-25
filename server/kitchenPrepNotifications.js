const Contract = require('./models/Contract');
const Notification = require('./models/Notification');
const User = require('./models/User');

// Kitchen preparation timeline rules:
// - Kitchen may only BEGIN preparing food/items when the event is within 7 days.
// - Two weeks out (14 days) the kitchen gets an early heads-up so they can start
//   sourcing / preparing ingredients ahead of the actual cooking window.
// - Seven days out the kitchen is told the preparation window is now open.
// These heads-ups are emitted by a periodic sweep (like paymentCompliance) so they
// fire as the event date approaches, not at approval time (which can be months out).
const KITCHEN_INGREDIENT_PREP_WINDOW_DAYS = 14;
const KITCHEN_PREP_START_WINDOW_DAYS = 7;

const startOfDay = (value) => { const d = new Date(value); d.setHours(0, 0, 0, 0); return d; };

const getDaysUntil = (eventDate) => {
  const event = startOfDay(eventDate).getTime();
  const today = startOfDay(new Date()).getTime();
  return Math.ceil((event - today) / (1000 * 60 * 60 * 24));
};

const formatDate = (value) => new Date(value).toLocaleDateString('en-PH', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

// One notification per recipient, exactly once per contract + type + title. Re-running
// the sweep never duplicates an alert that was already sent for that window.
const notifyKitchenOnce = async ({ contract, type, title, message, priority = 'high' }) => {
  const alreadySent = await Notification.exists({ contract: contract._id, type, title });
  if (alreadySent) {
    return false;
  }

  const users = await User.find({ role: { $in: ['kitchen', 'admin'] }, isActive: true }).select('_id');
  if (users.length === 0) {
    return false;
  }

  await Notification.insertMany(users.map((user) => ({
    recipient: user._id,
    type,
    title,
    message,
    contract: contract._id,
    actionUrl: `/contracts/${contract._id}?tab=menu`,
    actionLabel: 'Open menu',
    department: 'kitchen',
    priority
  })));

  return true;
};

let sweepRunning = false;

const runKitchenPrepSweep = async () => {
  if (sweepRunning) {
    return { skipped: true };
  }

  sweepRunning = true;
  const summary = { checked: 0, notified: 0 };

  try {
    const contracts = await Contract.find({ status: 'approved' });
    summary.checked = contracts.length;

    for (const contract of contracts) {
      // Nothing to prepare if there is no menu, or the event has already passed.
      const menuItems = contract.menuDetails || [];
      if (menuItems.length === 0) {
        continue;
      }

      // While a payment hold is active, kitchen preparation is blocked, so don't
      // tell them to start.
      if (contract.paymentHold?.active) {
        continue;
      }

      // Nothing left to do once preparation is already complete.
      if (contract.ingredientStatus === 'prepared') {
        continue;
      }

      const daysAway = getDaysUntil(contract.eventDate);
      if (daysAway < 0) {
        continue;
      }

      // 2-week heads-up: start sourcing / prepping ingredients.
      if (daysAway <= KITCHEN_INGREDIENT_PREP_WINDOW_DAYS && daysAway > KITCHEN_PREP_START_WINDOW_DAYS) {
        const sent = await notifyKitchenOnce({
          contract,
          type: 'deadline_reminder',
          title: `Kitchen: start sourcing ingredients for ${contract.contractNumber}`,
          message: `${contract.clientName}'s event is on ${formatDate(contract.eventDate)} (about two weeks away). Begin sourcing and preparing ingredients now. Actual food preparation can begin once the event is within 7 days.`,
          priority: 'medium'
        });
        if (sent) summary.notified += 1;
      }

      // 7-day window: preparation may now begin.
      if (daysAway <= KITCHEN_PREP_START_WINDOW_DAYS && daysAway >= 0) {
        const sent = await notifyKitchenOnce({
          contract,
          type: 'deadline_reminder',
          title: `Kitchen: begin preparations for ${contract.contractNumber}`,
          message: `${contract.clientName}'s event is on ${formatDate(contract.eventDate)}, now within 7 days. You can begin preparing the food/items. Complete the menu checklist and mark preparation as ready.`,
          priority: 'high'
        });
        if (sent) summary.notified += 1;
      }
    }
  } catch (error) {
    console.error('Kitchen prep sweep failed:', error.message);
  } finally {
    sweepRunning = false;
  }

  return summary;
};

const startKitchenPrepSweep = (intervalMs = 6 * 60 * 60 * 1000) => {
  runKitchenPrepSweep();
  const timer = setInterval(runKitchenPrepSweep, intervalMs);
  if (typeof timer.unref === 'function') {
    timer.unref();
  }
};

module.exports = { runKitchenPrepSweep, startKitchenPrepSweep };
