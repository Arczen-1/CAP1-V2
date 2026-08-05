// Loading readiness.
//
// The load manifest answers "what do we bring". It does not answer "can we go
// yet, and if not, who is holding us up" - which is the question Logistics
// actually has to decide on the morning of a loading day. This module derives
// that answer from the preparation statuses the departments already maintain,
// so both the API and the reminder sweep read it from one place.
//
// Readiness here means a department has declared its own assigned items
// prepared. Stock shortages are a separate signal already surfaced by the
// inventory workspace (`shortages` / `readyForDispatch`); an item can be marked
// prepared and still be short, and that case is deliberately left to the
// shortage path rather than folded in here.

// Loading may begin the day before the event - stated on the load manifest.
const LOADING_STARTS_DAYS_BEFORE = 1;
// So everything has to be prepared the day before loading starts. This is the
// deadline the escalation measures against; it is derived from the loading
// window above rather than being a new rule of its own.
const READINESS_DEADLINE_DAYS = LOADING_STARTS_DAYS_BEFORE + 1;

const PREPARED = 'prepared';

// Each department, the items it owns on a contract, and how it declares them
// ready. Kitchen is all-or-nothing: it tracks one ingredient status for the
// whole event rather than a status per dish, so its items are either all
// prepared or none are.
const DEPARTMENTS = [
  {
    key: 'kitchen',
    label: 'Kitchen',
    roles: ['kitchen'],
    tab: 'kitchen',
    actionLabel: 'Update kitchen prep',
    items: (contract) => contract.menuDetails || [],
    // Matches the system's own definition of kitchen readiness (see
    // `kitchenReady` in routes/contracts.js): the menu line must be confirmed
    // and the ingredients marked prepared. The route already refuses to set
    // `prepared` while any dish is unconfirmed, but checking both keeps this
    // correct for records that predate that guard.
    isItemPrepared: (item, contract) => Boolean(item.confirmed) && contract.ingredientStatus === PREPARED,
    describePending: (contract) => (contract.ingredientStatus === 'procured'
      ? 'ingredients sourced but not prepared yet'
      : 'ingredients not sourced yet')
  },
  {
    key: 'stockroom',
    label: 'Stockroom',
    roles: ['stockroom'],
    tab: 'inventory',
    actionLabel: 'Update equipment status',
    items: (contract) => contract.equipmentChecklist || [],
    isItemPrepared: (item) => item.status === PREPARED
  },
  {
    key: 'linen',
    label: 'Linen',
    roles: ['linen'],
    tab: 'inventory',
    actionLabel: 'Update linen status',
    items: (contract) => contract.linenRequirements || [],
    isItemPrepared: (item) => item.status === PREPARED
  },
  {
    key: 'creative',
    label: 'Creative',
    roles: ['creative'],
    tab: 'inventory',
    actionLabel: 'Update creative status',
    items: (contract) => contract.creativeAssets || [],
    isItemPrepared: (item) => item.status === PREPARED
  }
];

const startOfDay = (value) => { const d = new Date(value); d.setHours(0, 0, 0, 0); return d; };

// Whole days from today to the event. 0 is the event day, 1 is tomorrow.
const getDaysUntilEvent = (eventDate) => Math.ceil(
  (startOfDay(eventDate).getTime() - startOfDay(new Date()).getTime()) / (1000 * 60 * 60 * 24)
);

// Per-department readiness for one contract.
//
// A department with no items assigned is "not applicable" rather than ready -
// counting it as ready would let an event with nothing prepared anywhere report
// itself clear to load.
const getLoadingReadiness = (contract = {}) => {
  const departments = DEPARTMENTS.map((department) => {
    const items = department.items(contract);
    const total = items.length;
    const prepared = items.filter((item) => department.isItemPrepared(item, contract)).length;
    const applicable = total > 0;
    const pending = total - prepared;

    return {
      key: department.key,
      label: department.label,
      roles: department.roles,
      tab: department.tab,
      actionLabel: department.actionLabel,
      applicable,
      total,
      prepared,
      pending,
      isReady: applicable && prepared === total,
      // A short phrase the UI and the notification messages can both use, so
      // the wording of a blocker is written once.
      detail: !applicable
        ? 'Nothing assigned'
        : prepared === total
          ? `All ${total} item(s) prepared`
          : department.describePending
            ? `${department.describePending(contract)} (${total} dish(es))`
            : `${prepared} of ${total} item(s) prepared`
    };
  });

  const applicable = departments.filter((department) => department.applicable);
  const blockers = applicable.filter((department) => !department.isReady);
  const readyCount = applicable.length - blockers.length;

  return {
    departments,
    applicable,
    blockers,
    readyCount,
    applicableCount: applicable.length,
    // Nothing assigned anywhere means there is nothing to be ready for, so this
    // stays false and the event is never announced as clear to load.
    allReady: applicable.length > 0 && blockers.length === 0,
    hasAnyRequirement: applicable.length > 0,
    summary: applicable.length === 0
      ? 'No items assigned yet'
      : `${readyCount} of ${applicable.length} department(s) ready`
  };
};

// "Linen and Creative" - for message text.
const describeBlockers = (blockers) => {
  const labels = blockers.map((blocker) => blocker.label);
  if (labels.length <= 1) return labels[0] || '';
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
};

module.exports = {
  LOADING_STARTS_DAYS_BEFORE,
  READINESS_DEADLINE_DAYS,
  DEPARTMENTS,
  getLoadingReadiness,
  getDaysUntilEvent,
  describeBlockers
};
