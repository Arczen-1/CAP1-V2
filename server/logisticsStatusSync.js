const { Truck } = require('./models/Logistics');
const Contract = require('./models/Contract');

// Keeps truck.status honest instead of decorative: a truck reads 'in_use' only
// while it is actually deployed for an event, and returns to 'available' once
// the job is done. Manual operational states (maintenance/repair/retired) are
// never overridden - only 'available' <-> 'in_use' is automated.
//
// "Deployed now" means the truck is assigned to an approved contract that is
// either explicitly dispatched, or inside its loading-to-event window (the day
// before the event through the end of the event day, matching the trip-ticket
// rule that loading may begin the day before).

const MANUAL_STATUSES = ['maintenance', 'repair', 'retired'];

const startOfDay = (value) => { const d = new Date(value); d.setHours(0, 0, 0, 0); return d; };
const endOfDay = (value) => { const d = new Date(value); d.setHours(23, 59, 59, 999); return d; };
const addDays = (value, days) => { const d = new Date(value); d.setDate(d.getDate() + days); return d; };

const isActiveDeploymentWindow = (eventDate, assignmentStatus, now = new Date()) => {
  if (assignmentStatus === 'completed') {
    return false;
  }
  if (assignmentStatus === 'dispatched') {
    return true;
  }
  if (!eventDate) {
    return false;
  }

  const loadingStart = startOfDay(addDays(eventDate, -1));
  const eventEnd = endOfDay(eventDate);
  return now >= loadingStart && now <= eventEnd;
};

// Reconciles a single truck. Returns the resulting status (or null when the
// truck is missing or under a manual status that must be preserved).
const reconcileTruckStatus = async (truckId, now = new Date()) => {
  if (!truckId) {
    return null;
  }

  const truck = await Truck.findById(truckId);
  if (!truck || MANUAL_STATUSES.includes(truck.status)) {
    return truck ? truck.status : null;
  }

  const bookings = await Contract.find({
    status: 'approved',
    'logisticsAssignment.truck': truck._id
  }).select('eventDate logisticsAssignment.assignmentStatus').lean();

  const deployed = bookings.some((contract) => isActiveDeploymentWindow(
    contract.eventDate,
    contract.logisticsAssignment?.assignmentStatus,
    now
  ));

  const nextStatus = deployed ? 'in_use' : 'available';
  if (truck.status !== nextStatus) {
    truck.status = nextStatus;
    await truck.save();
  }

  return nextStatus;
};

// Full pass across every automatable truck. Runs at startup and on an interval.
const syncAllTruckStatuses = async () => {
  const summary = { checked: 0, deployed: 0, freed: 0 };

  try {
    const trucks = await Truck.find({ status: { $in: ['available', 'in_use'] } }).select('_id status');
    const now = new Date();

    for (const truck of trucks) {
      const before = truck.status;
      const after = await reconcileTruckStatus(truck._id, now);
      summary.checked += 1;
      if (before !== 'in_use' && after === 'in_use') summary.deployed += 1;
      if (before === 'in_use' && after === 'available') summary.freed += 1;
    }
  } catch (error) {
    console.error('Logistics status sync failed:', error.message);
  }

  if (summary.deployed || summary.freed) {
    console.log(`Logistics status sync: ${summary.deployed} truck(s) marked in use, ${summary.freed} freed (of ${summary.checked} checked).`);
  }

  return summary;
};

const startLogisticsStatusSync = (intervalMs = 6 * 60 * 60 * 1000) => {
  syncAllTruckStatuses();
  const timer = setInterval(syncAllTruckStatuses, intervalMs);
  if (typeof timer.unref === 'function') {
    timer.unref();
  }
  return timer;
};

module.exports = { reconcileTruckStatus, syncAllTruckStatuses, startLogisticsStatusSync };
