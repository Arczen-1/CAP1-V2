const Contract = require('./models/Contract');
const Notification = require('./models/Notification');
const User = require('./models/User');
const {
  LOADING_STARTS_DAYS_BEFORE,
  READINESS_DEADLINE_DAYS,
  getLoadingReadiness,
  getDaysUntilEvent,
  describeBlockers
} = require('./loadingReadiness');

// Loading readiness sweep.
//
// Logistics could already see every item assigned to an event, but nothing told
// them whether the event could actually be loaded - the dashboard's next step
// was derived from the date and the truck booking alone. This closes that gap
// with three signals:
//
//   1. Cleared for loading - every department has finished. The go signal.
//   2. Not ready, loading starts tomorrow - the escalation, naming who is
//      outstanding and going to those departments as well as Logistics.
//   3. Loading window open and still not ready - the event is now at risk.
//
// The escalation matters more than the clearance: an event that is ready needs
// no decision, and if clearance were the only signal, silence would be
// ambiguous - "not ready" and "nobody updated the record" would look identical.

// Only announce clearance once the event is near enough for it to mean
// anything. An event ready two months out is not news.
const CLEARANCE_HORIZON_DAYS = 7;

const describeWhen = (daysUntil) => {
  if (daysUntil <= 0) return 'today';
  if (daysUntil === 1) return 'tomorrow';
  return `in ${daysUntil} days`;
};

// One notification per recipient, exactly once per contract + type + title.
// Titles are kept free of counts that change as departments finish, so a
// reminder cannot re-fire under a slightly different name.
const notifyOnce = async ({ contract, roles, type, title, message, actionUrl, actionLabel, department, priority = 'high' }) => {
  const alreadySent = await Notification.exists({ contract: contract._id, type, title });
  if (alreadySent) {
    return false;
  }

  const users = await User.find({ role: { $in: roles }, isActive: true }).select('_id role');
  if (users.length === 0) {
    return false;
  }

  await Notification.insertMany(users.map((user) => ({
    recipient: user._id,
    type,
    title,
    message,
    contract: contract._id,
    actionUrl,
    actionLabel,
    department,
    priority
  })));

  return true;
};

let sweepRunning = false;

const runLoadingReadinessSweep = async () => {
  if (sweepRunning) {
    return { skipped: true };
  }

  sweepRunning = true;
  const summary = { checked: 0, notified: 0, cleared: [], escalated: [], atRisk: [] };

  try {
    const contracts = await Contract.find({ status: 'approved' });
    summary.checked = contracts.length;

    for (const contract of contracts) {
      // A held contract is blocked from preparation anyway - chasing departments
      // over it would be chasing them for work they are not allowed to do.
      if (contract.paymentHold?.active) {
        continue;
      }

      const daysUntil = getDaysUntilEvent(contract.eventDate);
      if (daysUntil < 0 || daysUntil > CLEARANCE_HORIZON_DAYS) {
        continue;
      }

      const readiness = getLoadingReadiness(contract);
      // Nothing assigned to any department: there is nothing to be ready for,
      // and a "cleared to load" alert for an empty event would be misleading.
      if (!readiness.hasAnyRequirement) {
        continue;
      }

      const eventWhen = describeWhen(daysUntil);
      const contractUrl = `/contracts/${contract._id}?tab=logistics`;

      // ---------------------------------------------------------- the go signal
      if (readiness.allReady) {
        const sent = await notifyOnce({
          contract,
          roles: ['logistics', 'admin'],
          type: 'task_assigned',
          title: `Cleared for loading: ${contract.contractNumber}`,
          message: `All ${readiness.applicableCount} department(s) have finished preparing ${contract.clientName}'s event ${eventWhen} (${new Date(contract.eventDate).toDateString()}). Everything on the load manifest is marked prepared, so loading can proceed. Loading may begin the day before the event.`,
          actionUrl: contractUrl,
          actionLabel: 'View load manifest',
          department: 'logistics',
          priority: 'medium'
        });
        if (sent) { summary.notified += 1; summary.cleared.push(contract.contractNumber); }
        continue;
      }

      // Everything below is the not-ready path. Outside the deadline window the
      // departments still have time, so nothing is escalated yet.
      if (daysUntil > READINESS_DEADLINE_DAYS) {
        continue;
      }

      const blockerNames = describeBlockers(readiness.blockers);
      const blockerDetail = readiness.blockers
        .map((blocker) => `${blocker.label}: ${blocker.detail}`)
        .join('; ');
      const windowOpen = daysUntil <= LOADING_STARTS_DAYS_BEFORE;

      // --------------------------------------------------- escalation to Logistics
      // Which events cannot be loaded on schedule, and who to chase for each.
      const logisticsTitle = windowOpen
        ? `Loading window open - event not ready: ${contract.contractNumber}`
        : `Not ready for loading: ${contract.contractNumber}`;
      const logisticsMessage = windowOpen
        ? `${contract.clientName}'s event is ${eventWhen} and loading should already be under way, but ${readiness.readyCount} of ${readiness.applicableCount} department(s) are ready. Outstanding - ${blockerDetail}. Chase ${blockerNames} now or re-sequence today's loading; this event is at risk.`
        : `${contract.clientName}'s event is ${eventWhen} and loading starts tomorrow, but ${blockerNames} ${readiness.blockers.length === 1 ? 'has' : 'have'} not finished preparing. Outstanding - ${blockerDetail}. Follow up today so the truck is not held up in the morning.`;

      const sentLogistics = await notifyOnce({
        contract,
        roles: ['logistics', 'admin'],
        type: 'deadline_reminder',
        title: logisticsTitle,
        message: logisticsMessage,
        actionUrl: contractUrl,
        actionLabel: 'Review readiness',
        department: 'logistics',
        priority: 'high'
      });
      if (sentLogistics) summary.notified += 1;

      // ------------------------------------------ escalation to the blocking side
      // Sent separately so each department gets its own outstanding count and a
      // link to the screen where it can actually clear the block.
      for (const blocker of readiness.blockers) {
        const sent = await notifyOnce({
          contract,
          roles: blocker.roles,
          type: 'deadline_reminder',
          title: windowOpen
            ? `Loading is waiting on ${blocker.label}: ${contract.contractNumber}`
            : `Prepare items before loading starts: ${contract.contractNumber}`,
          message: windowOpen
            ? `Loading for ${contract.clientName}'s event ${eventWhen} should already be under way and is waiting on ${blocker.label}. ${blocker.detail}. Please finish and mark the items prepared now, or tell Logistics what cannot be sent.`
            : `${contract.clientName}'s event is ${eventWhen} and loading starts tomorrow. ${blocker.label} still has items outstanding - ${blocker.detail}. Please finish preparing them today and mark them prepared so Logistics can load on schedule.`,
          actionUrl: `/contracts/${contract._id}?tab=${blocker.tab}`,
          actionLabel: blocker.actionLabel,
          department: blocker.key,
          priority: 'high'
        });
        if (sent) summary.notified += 1;
      }

      if (windowOpen) {
        summary.atRisk.push(contract.contractNumber);
      } else {
        summary.escalated.push(contract.contractNumber);
      }
    }
  } catch (error) {
    console.error('Loading readiness sweep failed:', error.message);
  } finally {
    sweepRunning = false;
  }

  return summary;
};

const startLoadingReadinessSweep = (intervalMs = 6 * 60 * 60 * 1000) => {
  runLoadingReadinessSweep();
  const timer = setInterval(runLoadingReadinessSweep, intervalMs);
  if (typeof timer.unref === 'function') {
    timer.unref();
  }
};

module.exports = { runLoadingReadinessSweep, startLoadingReadinessSweep };
