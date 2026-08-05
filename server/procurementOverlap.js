const ProcurementRequest = require('./models/ProcurementRequest');

// Rent-vs-buy overlap analysis.
//
// Every procurement request used to be judged on its own, so two events renting
// the same item were two unrelated approvals and nobody could see the pair.
// This groups the still-decidable requests by the item they actually refer to
// and works out whether buying would have been cheaper than renting twice.
//
// The important subtlety: buying only helps when the rentals do NOT overlap in
// time. One owned tent covers two events on different weekends; it cannot cover
// two events on the same Saturday. So the comparison is made against the PEAK
// number of units needed at any single moment, not the number of requests.
// Without that, the system would cheerfully recommend buying one chair cover to
// solve a same-day shortage of 180.

// Statuses where a buy-instead decision can still change the outcome. Once the
// proof of purchase is in, the money is spent and the advice is noise.
const DECIDABLE_STATUSES = ['requested', 'awaiting_accounting_approval', 'approved'];

// The purchase price lives under a different name on each inventory model
// (`purchasePrice` on stockroom, `pricePerItem` on creative and linen).
// Normalised here so callers never have to guess.
const PURCHASE_PRICE_FIELDS = ['purchasePrice', 'pricePerItem', 'unitPrice'];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const roundToTwo = (value) => Math.round((Number(value) || 0) * 100) / 100;

const getPurchaseUnitPrice = (inventoryItem) => {
  if (!inventoryItem) return 0;
  for (const field of PURCHASE_PRICE_FIELDS) {
    const price = toNumber(inventoryItem[field]);
    if (price) return price;
  }
  return 0;
};

const startOfDay = (value) => { const d = new Date(value); d.setHours(0, 0, 0, 0); return d; };

const toPlain = (request) => (typeof request.toObject === 'function' ? request.toObject() : request);

// Two requests are "the same item" when they point at the same inventory
// record. Requests raised without a link fall back to the item code, then to a
// normalised name, so a shortage raised from a contract still matches a
// restock request for the same thing.
const getItemKey = (request) => {
  const inventoryItemId = request.inventoryItem?._id || request.inventoryItem;
  if (inventoryItemId) return `id:${String(inventoryItemId)}`;

  const model = request.inventoryModel || 'unknown';
  const code = String(request.itemCode || '').trim().toLowerCase();
  if (code) return `code:${model}:${code}`;

  const name = String(request.itemName || '').trim().toLowerCase().replace(/\s+/g, ' ');
  return name ? `name:${model}:${name}` : `req:${String(request._id)}`;
};

// When the item is actually held. Prefers the quoted rental window, falls back
// to the event date, then to the needed-by date. A request with only a single
// date is treated as occupying that one day.
const getWindow = (request) => {
  const rentalStart = request.quote?.rentalStartDate;
  const rentalEnd = request.quote?.rentalEndDate;

  if (rentalStart) {
    return {
      start: startOfDay(rentalStart),
      end: startOfDay(rentalEnd || rentalStart),
      basis: 'rental dates'
    };
  }

  const anchor = request.eventDate || request.neededBy;
  if (!anchor) return null;
  return { start: startOfDay(anchor), end: startOfDay(anchor), basis: request.eventDate ? 'event date' : 'needed-by date' };
};

// What one rental actually costs. Uses the quote when there is one, otherwise
// prices the window from the inventory record's daily rate. Returns 0 when
// neither is known, which the caller treats as "cannot compare".
const getRentalCost = (request) => {
  const quotedTotal = toNumber(request.quote?.quotedTotal);
  if (quotedTotal) return { cost: quotedTotal, basis: 'supplier quote' };

  const quotedUnit = toNumber(request.quote?.quotedUnitPrice);
  const quantity = toNumber(request.requestedQuantity) || 1;
  if (quotedUnit) return { cost: quotedUnit * quantity, basis: 'quoted unit price' };

  const dailyRate = toNumber(request.inventoryItem?.rentalPricePerDay);
  const window = getWindow(request);
  if (dailyRate && window) {
    const days = Math.max(1, Math.round((window.end - window.start) / MS_PER_DAY) + 1);
    return { cost: dailyRate * quantity * days, basis: `daily rate x ${days} day(s)` };
  }

  return { cost: 0, basis: null };
};

// Peak units required at any single moment.
//
// A sweep over the window edges: every request adds its quantity while its
// window is open. Requests spread across different dates never stack, so the
// peak is the largest single request. Requests on the same date stack, and the
// peak is their sum - which is exactly the case where buying one unit solves
// nothing.
const getPeakConcurrentQuantity = (requests) => {
  const events = [];
  let unscheduled = 0;

  for (const request of requests) {
    const window = getWindow(request);
    const quantity = toNumber(request.requestedQuantity) || 1;
    if (!window) {
      // No usable date: assume it could coincide with anything.
      unscheduled += quantity;
      continue;
    }
    events.push({ at: window.start.getTime(), delta: quantity });
    events.push({ at: window.end.getTime() + MS_PER_DAY, delta: -quantity });
  }

  events.sort((a, b) => (a.at - b.at) || (a.delta - b.delta));

  let running = 0;
  let peak = 0;
  for (const event of events) {
    running += event.delta;
    if (running > peak) peak = running;
  }

  return peak + unscheduled;
};

// Do any two of these requests want the item at the same time?
const hasTimeOverlap = (requests) => {
  const windows = requests.map(getWindow).filter(Boolean);
  for (let i = 0; i < windows.length; i += 1) {
    for (let j = i + 1; j < windows.length; j += 1) {
      if (windows[i].start <= windows[j].end && windows[j].start <= windows[i].end) {
        return true;
      }
    }
  }
  return false;
};

const formatAmount = (value) => new Intl.NumberFormat('en-PH', {
  style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2
}).format(Number(value) || 0);

// Evaluate one group of requests that all refer to the same item.
const evaluateGroup = (requests) => {
  const rentals = requests.filter((request) => request.requestType === 'rental');
  const purchases = requests.filter((request) => request.requestType === 'purchase');

  const sample = requests.find((request) => request.inventoryItem) || requests[0];
  const itemLabel = sample.itemName || 'this item';
  const purchaseUnitPrice = getPurchaseUnitPrice(sample.inventoryItem);

  const overlapping = hasTimeOverlap(rentals);
  const unitsNeeded = getPeakConcurrentQuantity(rentals);

  const rentalCosts = rentals.map(getRentalCost);
  const knownRentalCost = rentalCosts.every((entry) => entry.cost > 0)
    ? roundToTwo(rentalCosts.reduce((sum, entry) => sum + entry.cost, 0))
    : 0;
  const purchaseCost = purchaseUnitPrice ? roundToTwo(purchaseUnitPrice * unitsNeeded) : 0;

  // A request with no supplier quote is priced from the inventory record's
  // daily rate. That is useful, but it means part of the comparison is an
  // estimate - and an estimate presented as a quote is how an approval gets
  // made on a number nobody actually agreed to. Flag it so the UI can say so.
  const estimated = rentalCosts.some((entry) => entry.basis && entry.basis.startsWith('daily rate'));

  const comparable = rentals.length >= 2 && knownRentalCost > 0 && purchaseCost > 0;
  // Only ever a positive saving. Renting being cheaper is expressed by the
  // recommendation, not by a negative number that a caller might render as
  // "saves -42,000".
  const savings = comparable && knownRentalCost > purchaseCost
    ? roundToTwo(knownRentalCost - purchaseCost)
    : 0;

  let recommendation = 'none';
  if (rentals.length >= 2) {
    if (!comparable) {
      recommendation = 'compare_manually';
    } else if (savings > 0) {
      recommendation = 'buy';
    } else {
      recommendation = 'keep_renting';
    }
  }

  // The headline a reviewer reads. Written once here so the accounting queue,
  // the purchasing list and the notification all say the same thing.
  // Appended whenever any leg of the comparison was priced from a daily rate
  // rather than an agreed quote.
  const estimateNote = estimated
    ? ' One or more legs are estimated from the inventory daily rate rather than a supplier quote.'
    : '';

  let summary = '';
  if (recommendation === 'buy') {
    summary = `${rentals.length} rental requests for ${itemLabel}${overlapping ? '' : ' on separate dates'}. Renting: ${formatAmount(knownRentalCost)}. Buying ${unitsNeeded} unit(s): ${formatAmount(purchaseCost)}. Buying saves ${formatAmount(savings)}.${estimateNote}`;
  } else if (recommendation === 'keep_renting') {
    summary = overlapping
      ? `${rentals.length} rental requests for ${itemLabel} overlap in time, so ${unitsNeeded} unit(s) would have to be bought to replace them: ${formatAmount(purchaseCost)} against ${formatAmount(knownRentalCost)} to rent. Renting stays cheaper.`
      : `${rentals.length} rental requests for ${itemLabel}. Renting: ${formatAmount(knownRentalCost)}. Buying ${unitsNeeded} unit(s): ${formatAmount(purchaseCost)}. Renting stays cheaper.`;
  } else if (recommendation === 'compare_manually') {
    const missing = [
      knownRentalCost > 0 ? '' : 'a supplier quote is still missing',
      purchaseCost > 0 ? '' : 'no purchase price is recorded on the inventory item'
    ].filter(Boolean).join(' and ');
    summary = `${rentals.length} rental requests for ${itemLabel}${overlapping ? ' overlapping in time' : ' on separate dates'}. Buying cannot be costed automatically because ${missing}. Compare manually before approving.`;
  }

  return {
    itemLabel,
    rentalRequestCount: rentals.length,
    purchaseRequestCount: purchases.length,
    duplicateCount: requests.length,
    overlapping,
    unitsNeeded,
    rentalCost: knownRentalCost,
    purchaseUnitPrice,
    purchaseCost,
    savings,
    comparable,
    estimated,
    recommendation,
    summary,
    // Enough to render "also requested by" without another round trip.
    relatedRequests: requests.map((request) => ({
      _id: String(request._id),
      requestNumber: request.requestNumber,
      requestType: request.requestType,
      status: request.status,
      department: request.department,
      requestedQuantity: request.requestedQuantity,
      eventDate: request.eventDate || null,
      neededBy: request.neededBy || null,
      contractNumber: request.contract?.contractNumber || null,
      clientName: request.contract?.clientName || null
    }))
  };
};

// Groups every still-decidable request by item. Always evaluated over the whole
// decidable set rather than whatever the caller happened to filter to, so
// narrowing the queue to one department cannot change the answer.
const buildOverlapIndex = async () => {
  const requests = await ProcurementRequest
    .find({ status: { $in: DECIDABLE_STATUSES } })
    .populate('inventoryItem')
    .populate('contract', 'contractNumber clientName eventDate')
    .lean();

  const groups = new Map();
  for (const request of requests) {
    const key = getItemKey(request);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(request);
  }

  const index = new Map();
  for (const [key, groupRequests] of groups) {
    // A single request has nothing to compare against.
    if (groupRequests.length < 2) continue;
    const evaluation = evaluateGroup(groupRequests);
    // Only annotate when there is actually something to say.
    if (evaluation.recommendation === 'none') continue;
    index.set(key, evaluation);
  }

  return index;
};

// Attaches `rentVsBuy` to each request, leaving requests with no overlap alone.
const annotateRequests = async (requests) => {
  const index = await buildOverlapIndex();
  if (index.size === 0) return requests.map((request) => toPlain(request));

  return requests.map((request) => {
    const plain = toPlain(request);
    const evaluation = index.get(getItemKey(plain));
    if (!evaluation) return plain;

    return {
      ...plain,
      rentVsBuy: {
        ...evaluation,
        // Drop this request from its own "also requested by" list.
        relatedRequests: evaluation.relatedRequests.filter(
          (related) => related._id !== String(plain._id)
        )
      }
    };
  });
};

module.exports = {
  DECIDABLE_STATUSES,
  getItemKey,
  getWindow,
  getRentalCost,
  getPurchaseUnitPrice,
  getPeakConcurrentQuantity,
  hasTimeOverlap,
  evaluateGroup,
  buildOverlapIndex,
  annotateRequests
};
