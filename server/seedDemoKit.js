#!/usr/bin/env node

// Purpose-built demo data for the defense demonstration of the ACCOUNTING
// (budgeting) and REPORTS modules, plus the two scenario spotlights.
//
// Everything it creates is prefixed DK- (Demo Kit) so it is easy to recognise on
// screen and safe to re-run: the script deletes its own records first, then
// recreates them. It never touches records it did not create.
//
// All dates are relative to the run date, so the kit never goes stale.
//
//   npm run seed:demokit
//
// What it prepares, per demonstration part:
//   Part 1  Monthly budget for the current month + three months of confirmed
//           procurement spend, so "Suggest From Last 3 Months" has a real basis.
//   Part 2  Two requests waiting for Accounting: one comfortably inside budget
//           (approve it live) and one large enough to be blocked (₱48,000
//           against a Creative allocation of ₱15,000).
//   Part 3  Six months of collections and four receivables aged into different
//           buckets, so the trend line and the A/R aging chart are populated.
//   Part 4  A contract on payment hold, and one that has finished its post-event
//           checks and is sitting at "Awaiting Contract Close".
//   Part 5  A same-day pair of events competing for the same scarce item, the
//           purchase and rental requests that result, and a post-event incident.

const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Contract = require('./models/Contract');
const ProcurementRequest = require('./models/ProcurementRequest');
const FinanceBudget = require('./models/FinanceBudget');
const Incident = require('./models/Incident');
const Supplier = require('./models/Supplier');
const User = require('./models/User');
const LinenInventory = require('./models/LinenInventory');
const StockroomInventory = require('./models/StockroomInventory');
const CreativeInventory = require('./models/CreativeInventory');

dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/juancarlos';

const TAG = 'DK-';
const now = new Date();

// Which inventory collection each department's requests are drawn from.
const INVENTORY_MODEL = {
  creative: 'CreativeInventory',
  linen: 'LinenInventory',
  stockroom: 'StockroomInventory',
};

// ---------------------------------------------------------------- date utils
const day = (n) => { const d = new Date(now); d.setDate(d.getDate() + n); d.setHours(12, 0, 0, 0); return d; };
const month = (n) => { const d = new Date(now); d.setMonth(d.getMonth() + n); d.setHours(12, 0, 0, 0); return d; };
const periodMonth = (d = now) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const peso = (n) => Number(n.toFixed(2));

// A contract shell with every required field filled in.
const contractBase = ({ number, client, type, eventDate, pax, price, status, extra = {} }) => ({
  contractNumber: number,
  clientName: client,
  clientContact: '0917-555-0100',
  clientEmail: `${number.toLowerCase()}@demokit.test`,
  clientAddress: { street: '12 Buenavista Street', city: 'Batangas City', province: 'Batangas', zipCode: '4200' },
  clientType: type,
  eventDate,
  bookingDate: month(-3),
  venue: { name: 'Casa Ilustrado Garden Pavilion', address: 'Barangay Alangilan, Batangas City', capacity: 400 },
  packageSelected: 'premium',
  totalPacks: pax,
  packagePrice: peso(price / pax),
  totalContractValue: peso(price),
  paymentTerms: type === 'corporate' ? 'corporate_flexible' : 'wedding_standard',
  downPaymentPercent: 40,
  finalPaymentPercent: 60,
  status,
  clientSigned: true,
  clientSignedAt: month(-3),
  menuDetails: [
    { category: 'Beef', item: 'Beef Salpicao', quantity: pax, confirmed: true },
    { category: 'Chicken', item: 'Chicken Cordon Bleu', quantity: pax, confirmed: true },
    { category: 'Pasta', item: 'Baked Ziti', quantity: pax, confirmed: true },
    { category: 'Dessert', item: 'Mango Panna Cotta', quantity: pax, confirmed: true },
  ],
  ...extra,
});

const payment = (amount, date, ref) => ({
  amount: peso(amount), date, method: 'bank_transfer',
  reference: ref, receiptNumber: ref, receiptIssuedBy: 'Juan Carlos',
  receiptGeneratedAt: date, status: 'completed',
});

const run = async () => {
  await mongoose.connect(MONGODB_URI);
  const summary = [];

  // ------------------------------------------------------------- clean slate
  const wipes = await Promise.all([
    Contract.deleteMany({ contractNumber: new RegExp(`^${TAG}`) }),
    ProcurementRequest.deleteMany({ requestNumber: new RegExp(`^${TAG}`) }),
    Incident.deleteMany({ description: new RegExp(`^\\[${TAG}\\]`) }),
    LinenInventory.deleteMany({ itemCode: 'DK-LN-90' }),
    StockroomInventory.deleteMany({ itemCode: { $in: ['DK-ST-91', 'DK-ST-92'] } }),
  ]);
  summary.push(`Cleared previous demo kit: ${wipes[0].deletedCount} contracts, ${wipes[1].deletedCount} requests, ${wipes[2].deletedCount} incidents.`);

  const accounting = await User.findOne({ role: 'accounting' });
  // Procurement requests record which inventory they draw from and who raised
  // them, so resolve the model name and a requesting user per department.
  const requesterByDept = {};
  for (const dept of ['creative', 'linen', 'stockroom']) {
    requesterByDept[dept] = await User.findOne({ role: dept }) || accounting;
  }
  const supplierByDept = {};
  for (const dept of ['creative', 'linen', 'stockroom']) {
    supplierByDept[dept] = await Supplier.findOne({ departments: dept })
      || await Supplier.findOne();
  }
  const linenItem = await LinenInventory.findOne({ status: 'available' }).sort({ availableQuantity: -1 });

  // Part 5 needs an item that genuinely runs out. Picking an existing line by
  // "most available" guarantees the opposite — the winner had 7,660 units, so
  // 220 + 180 reserved against it produced no shortage and the scenario showed
  // nothing. Use a dedicated DK item stocked to exactly what event A reserves,
  // so event B is short by its full requirement and no real stock is touched.
  const SAMEDAY_STOCK = 220;
  await LinenInventory.deleteMany({ itemCode: 'DK-LN-90' });
  const sameDayLinen = await LinenInventory.create({
    name: 'DK Seat Cover Black (same-day demo)',
    itemCode: 'DK-LN-90',
    category: 'Chair Cover',
    quantity: SAMEDAY_STOCK,
    availableQuantity: SAMEDAY_STOCK,
    status: 'available',
    color: 'Black',
    material: 'Spandex',
    size: 'medium',
    unitPrice: 45,
  });
  const stockItem = await StockroomInventory.findOne({ status: 'available' }).sort({ availableQuantity: -1 });
  const creativeItem = await CreativeInventory.findOne({ status: 'available' }).sort({ availableQuantity: -1 });

  // ============================================================= PART 3 data
  // Collections trend: one closed contract per month for the last six months,
  // each fully paid, so the trend line has six real points.
  const trendContracts = [];
  for (let i = 5; i >= 0; i--) {
    const value = 210000 + i * 18000;
    const eventDate = month(-i - 1);
    const doc = await Contract.create(contractBase({
      number: `${TAG}TREND-${String(6 - i).padStart(2, '0')}`,
      client: `DK Trend Client ${6 - i}`,
      type: 'corporate',
      eventDate,
      pax: 150,
      price: value,
      status: 'completed',
      extra: {
        completedAt: month(-i),
        paymentStatus: 'paid',
        payments: [
          payment(value * 0.4, month(-i - 2), `DK-OR-${6 - i}A`),
          payment(value * 0.6, month(-i), `DK-OR-${6 - i}B`),
        ],
      },
    }));
    trendContracts.push(doc);
  }
  summary.push(`Part 3 · collections trend: ${trendContracts.length} paid contracts across the last six months.`);

  // A/R aging: four receivables, each owed a different age so every bucket fills.
  const agingPlan = [
    { key: 'CURRENT', bookedMonthsAgo: 1, value: 240000, note: 'not yet due' },
    { key: 'AGED-30', bookedMonthsAgo: 3, value: 305000, note: '40% just past due' },
    { key: 'AGED-60', bookedMonthsAgo: 4, value: 268000, note: '40% overdue about two months' },
    { key: 'AGED-90', bookedMonthsAgo: 5, value: 352000, note: '40% overdue about three months' },
  ];
  for (const plan of agingPlan) {
    await Contract.create(contractBase({
      number: `${TAG}AR-${plan.key}`,
      client: `DK Receivable ${plan.key}`,
      type: 'wedding',
      eventDate: month(6),
      pax: 200,
      price: plan.value,
      status: 'approved',
      extra: {
        bookingDate: month(-plan.bookedMonthsAgo),
        paymentStatus: 'partially_paid',
        internalNotes: `[${TAG}] Receivable demo — ${plan.note}.`,
        payments: [payment(30000, month(-plan.bookedMonthsAgo), `DK-RES-${plan.key}`)],
      },
    }));
  }
  summary.push(`Part 3 · A/R aging: ${agingPlan.length} receivables aged into separate buckets.`);

  // ============================================================= PART 4 data
  // A contract whose final balance is overdue, so it sits on automatic hold.
  //
  // The event date has to land between the two milestones: past the final
  // balance due date (event - 2 months) so the hold applies, but before the
  // settlement deadline (event - 1 month) or the compliance sweep cancels the
  // contract outright and the hold demonstration disappears. 45 days out puts
  // the balance 15 days overdue with 15 days left to settle.
  const holdValue = 418000;
  await Contract.create(contractBase({
    number: `${TAG}HOLD-001`,
    client: 'DK Reyes–Villanueva Wedding',
    type: 'wedding',
    eventDate: day(45),
    pax: 260,
    price: holdValue,
    status: 'approved',
    extra: {
      bookingDate: month(-7),
      paymentStatus: 'partially_paid',
      payments: [payment(holdValue * 0.4, month(-5), 'DK-OR-HOLD-40')],
      paymentHold: {
        active: true,
        reason: `Final balance of ₱${peso(holdValue * 0.6).toLocaleString()} was not fully collected by ${month(-2).toDateString()} (2 months before the event).`,
        startedAt: month(-2),
        managementOverride: false,
      },
    },
  }));

  // A contract past its event with every post-event check done and the balance
  // settled, so its stage reads "Awaiting Contract Close".
  const closeValue = 296000;
  const checked = (items) => items.map((item) => ({ ...item, status: 'prepared', postEventStatus: 'checked_ok' }));
  await Contract.create(contractBase({
    number: `${TAG}CLOSE-001`,
    client: 'DK Aguilar Corporate Anniversary',
    type: 'corporate',
    eventDate: day(-6),
    pax: 180,
    price: closeValue,
    status: 'approved',
    extra: {
      paymentStatus: 'paid',
      payments: [
        payment(closeValue * 0.4, month(-4), 'DK-OR-CLOSE-40'),
        payment(closeValue * 0.6, month(-1), 'DK-OR-CLOSE-60'),
      ],
      ingredientStatus: 'prepared',
      equipmentChecklist: checked([
        { item: 'Chafing Dish Oval', itemCode: 'DK-ST-01', category: 'Buffet', quantity: 12 },
        { item: 'Cocktail Table', itemCode: 'DK-ST-02', category: 'Table', quantity: 8 },
      ]),
      linenRequirements: checked([
        { type: 'Table Napkin White', itemCode: 'DK-LN-01', category: 'Napkin', quantity: 200 },
      ]),
      creativeAssets: checked([
        { item: 'Centerpiece Vase Set', itemCode: 'DK-CR-01', category: 'Table Decor', quantity: 20 },
      ]),
      logisticsAssignment: { assignmentStatus: 'completed', notes: `[${TAG}] Returned and reconciled.` },
      departmentProgress: {
        sales: 100, accounting: 100, logistics: 100, banquet: 100,
        kitchen: 100, purchasing: 100, creative: 100, linen: 100, stockroom: 100,
      },
    },
  }));
  summary.push('Part 4 · one contract on payment hold, one awaiting contract close.');

  // ============================================================= PART 5 data
  // Two events on the same date competing for the same scarce linen item.
  // Far enough out that the 60% balance is not yet due — otherwise the payment
  // compliance sweep would put both contracts on hold and mask the scenario.
  const sameDay = day(85);
  const scarceLinen = {
    itemId: sameDayLinen._id,
    type: sameDayLinen.name,
    itemCode: sameDayLinen.itemCode,
    category: sameDayLinen.category,
    quantity: SAMEDAY_STOCK,
    status: 'pending',
  };
  const sameDayA = await Contract.create(contractBase({
    number: `${TAG}SAMEDAY-A`,
    client: 'DK Bautista Debut (holds the stock)',
    type: 'debut',
    eventDate: sameDay,
    pax: 220,
    price: 352000,
    status: 'approved',
    extra: {
      paymentStatus: 'partially_paid',
      payments: [payment(352000 * 0.4, month(-2), 'DK-OR-SDA')],
      linenRequirements: [scarceLinen],
      internalNotes: `[${TAG}] First event on ${sameDay.toDateString()} — reserves the linen.`,
    },
  }));
  const sameDayB = await Contract.create(contractBase({
    number: `${TAG}SAMEDAY-B`,
    client: 'DK Mendoza Wedding (runs short)',
    type: 'wedding',
    eventDate: sameDay,
    pax: 180,
    price: 288000,
    status: 'approved',
    extra: {
      paymentStatus: 'partially_paid',
      payments: [payment(288000 * 0.4, month(-2), 'DK-OR-SDB')],
      linenRequirements: [{ ...scarceLinen, quantity: 180 }],
      equipmentChecklist: [{
        item: 'Reception Tent 10x20m', itemCode: 'DK-ST-90', category: 'Structure', quantity: 1, status: 'pending',
      }],
      internalNotes: `[${TAG}] Second event on the same date — the linen is already committed.`,
    },
  }));
  summary.push(`Part 5 · same-day pair on ${sameDay.toDateString()} competing for "${scarceLinen.type}".`);

  // A post-event incident on the contract that is awaiting close.
  const closeContract = await Contract.findOne({ contractNumber: `${TAG}CLOSE-001` });
  await Incident.create({
    contract: closeContract._id,
    department: 'creative',
    incidentType: 'damaged_equipment',
    description: `[${TAG}] Two centerpiece vases were chipped during pack-up and are unfit for the next event.`,
    affectedQuantity: 2,
    eventDate: closeContract.eventDate,
    severity: 'medium',
    sourceSection: 'creativeAssets',
    inventoryItemName: 'Centerpiece Vase Set',
    inventoryItemCode: 'DK-CR-01',
    reportedBy: accounting?._id,
    status: 'open',
  });
  summary.push('Part 5 · one post-event incident (damaged centerpieces) linked to the closing contract.');

  // ======================================================= PARTS 1 & 2 data
  // Three months of confirmed spend, so the budget suggestion has a real basis.
  const historyPlan = [
    { dept: 'creative', item: 'Bistro String Lights', qty: 20, unit: 480, monthsAgo: 1 },
    { dept: 'creative', item: 'Floral Foam Blocks', qty: 60, unit: 95, monthsAgo: 2 },
    { dept: 'creative', item: 'Backdrop Fabric Roll', qty: 8, unit: 1250, monthsAgo: 3 },
    { dept: 'linen', item: 'Table Napkin Ivory', qty: 300, unit: 42, monthsAgo: 1 },
    { dept: 'linen', item: 'Chair Cover Spandex', qty: 150, unit: 78, monthsAgo: 2 },
    { dept: 'linen', item: 'Table Cloth Round 120in', qty: 60, unit: 320, monthsAgo: 3 },
    { dept: 'stockroom', item: 'Dinner Plate Restock', qty: 400, unit: 55, monthsAgo: 1 },
    { dept: 'stockroom', item: 'Chafing Fuel Gel', qty: 200, unit: 38, monthsAgo: 2 },
    { dept: 'stockroom', item: 'Serving Spoon Set', qty: 100, unit: 62, monthsAgo: 3 },
  ];
  let historySeq = 0;
  for (const h of historyPlan) {
    historySeq += 1;
    const total = h.qty * h.unit;
    const needed = month(-h.monthsAgo);
    await ProcurementRequest.create({
      requestNumber: `${TAG}HIST-${String(historySeq).padStart(3, '0')}`,
      status: 'fulfilled',
      department: h.dept,
      inventoryModel: INVENTORY_MODEL[h.dept],
      createdBy: requesterByDept[h.dept]?._id || accounting?._id,
      requestType: 'purchase',
      requisitionType: 'purchase_requisition',
      source: 'inventory_low_stock',
      itemName: h.item,
      itemCategory: 'Restock',
      requestedQuantity: h.qty,
      neededBy: needed,
      createdAt: new Date(needed.getTime() - 7 * 86400000),
      requestReason: `[${TAG}] Historical spend used as the basis for the budget suggestion.`,
      quote: {
        supplier: supplierByDept[h.dept]?._id,
        supplierName: supplierByDept[h.dept]?.name,
        quotedUnitPrice: h.unit,
        quotedTotal: total,
        leadTimeDays: 7,
      },
      accounting: { status: 'approved', reviewedBy: accounting?._id, notes: `[${TAG}] Approved (historical).` },
      fulfillment: { receivedQuantity: h.qty, confirmationStatus: 'confirmed', inventoryUpdated: true },
    });
  }
  summary.push(`Parts 1 · ${historyPlan.length} fulfilled requests across the last three months (budget-suggestion basis).`);

  // The current month's budget. Creative is deliberately modest so the large
  // Creative request below is blocked on its own, with no manual preparation.
  const thisMonth = periodMonth();
  await FinanceBudget.findOneAndUpdate(
    { periodMonth: thisMonth },
    {
      periodMonth: thisMonth,
      status: 'active',
      totalBudget: 150000,
      sourceOfFunds: 'monthly_allocation',
      categories: [
        { key: 'creative', label: 'Creative Inventory', allocatedAmount: 15000, notes: 'Trailing 3-month average' },
        { key: 'linen', label: 'Linen Inventory', allocatedAmount: 22000, notes: 'Trailing 3-month average' },
        { key: 'stockroom', label: 'Stockroom / Equipment', allocatedAmount: 28000, notes: 'Trailing 3-month average' },
        { key: 'kitchen', label: 'Kitchen Supplies', allocatedAmount: 35000, notes: 'Standard template' },
        { key: 'logistics', label: 'Logistics', allocatedAmount: 20000, notes: 'Standard template' },
        { key: 'banquet', label: 'Banquet Operations', allocatedAmount: 15000, notes: 'Standard template' },
        { key: 'contingency', label: 'Contingency / Emergency', allocatedAmount: 10000, notes: 'Standard template' },
        { key: 'administration', label: 'Administration', allocatedAmount: 5000, notes: 'Standard template' },
      ],
      notes: `[${TAG}] Monthly operating budget prepared for the demonstration.`,
      preparedBy: accounting?._id,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  summary.push(`Parts 1–2 · budget for ${thisMonth} set (Creative ₱15,000 — deliberately below the blocked request).`);

  // The four live requests waiting in the Accounting queue.
  const requests = [
    {
      number: `${TAG}PR-0001`, dept: 'stockroom', type: 'purchase', item: 'Chafing Dish Oval',
      qty: 10, unit: 185, needed: day(12), contract: null, shortage: 0,
      reason: 'Buffet line replacement for the August events. Comfortably inside the stockroom allocation.',
    },
    {
      number: `${TAG}PR-0002`, dept: 'creative', type: 'purchase', item: 'Grand Entrance Arch and Floral Installation',
      qty: 1, unit: 48000, needed: day(15), contract: null, shortage: 0,
      reason: 'Feature installation requested for a premium wedding. Exceeds the month\'s Creative allocation.',
    },
    {
      number: `${TAG}PR-0003`, dept: 'linen', type: 'purchase', item: scarceLinen.type,
      qty: 180, unit: 46, needed: day(14), contract: sameDayB._id, shortage: 180,
      reason: 'The same-day event already reserved the available stock; this quantity must be bought.',
    },
    {
      number: `${TAG}PR-0004`, dept: 'stockroom', type: 'rental', item: 'Reception Tent 10x20m',
      qty: 1, unit: 11500, needed: day(14), contract: sameDayB._id, shortage: 1,
      reason: 'A tent this size is not held in stock and is only needed for this event, so it is rented.',
    },
  ];
  for (const r of requests) {
    const total = r.qty * r.unit;
    await ProcurementRequest.create({
      requestNumber: r.number,
      status: 'awaiting_accounting_approval',
      department: r.dept,
      inventoryModel: INVENTORY_MODEL[r.dept],
      createdBy: requesterByDept[r.dept]?._id || accounting?._id,
      requestType: r.type,
      requisitionType: r.type === 'rental' ? 'purchase_requisition' : 'purchase_requisition',
      source: r.contract ? 'contract_shortage' : 'inventory_low_stock',
      sourceSection: r.dept === 'linen' ? 'linenRequirements' : r.dept === 'creative' ? 'creativeAssets' : 'equipmentChecklist',
      contract: r.contract,
      itemName: r.item,
      itemCategory: 'Event Requirement',
      requestedQuantity: r.qty,
      shortageQuantity: r.shortage,
      neededBy: r.needed,
      requestReason: `[${TAG}] ${r.reason}`,
      quote: {
        supplier: supplierByDept[r.dept]?._id,
        supplierName: supplierByDept[r.dept]?.name,
        supplierContact: '0917-555-0188',
        quotedUnitPrice: r.unit,
        quotedTotal: total,
        leadTimeDays: 7,
        quoteReference: `${r.number}-Q1`,
        notes: `[${TAG}] Quotation prepared by Purchasing.`,
      },
    });
  }
  summary.push('Part 2 · DK-PR-0001 (₱1,850 stockroom — approve live) and DK-PR-0002 (₱48,000 creative — blocked live).');
  summary.push('Part 5 · DK-PR-0003 (purchase) and DK-PR-0004 (rental) both raised from the same-day shortage.');

  // ------------------------------------------------- rent-vs-buy demonstration
  // The panel asked: if two events rent the same thing, should it be bought?
  // Two pairs are seeded so both halves of the answer can be shown.
  //
  //   DK-PR-0005 / DK-PR-0006  separate dates -> one tent covers both, so buying
  //                            is genuinely cheaper and the system says so.
  //   DK-PR-0007 / DK-PR-0008  the same date  -> one purchased unit cannot be in
  //                            two places, so buying is NOT recommended. This is
  //                            the case a naive "two rentals = buy" rule gets
  //                            wrong, and it is the more interesting demo.
  await StockroomInventory.deleteMany({ itemCode: { $in: ['DK-ST-91', 'DK-ST-92'] } });

  // Rented at PHP 11,500 an event; owning one costs PHP 18,000. Two separate
  // rentals (PHP 23,000) therefore cost more than buying.
  const rentBuyTent = await StockroomInventory.create({
    name: 'DK Reception Tent 10x20m (rent-vs-buy demo)',
    itemCode: 'DK-ST-91', category: 'Tent',
    quantity: 0, availableQuantity: 0, status: 'available',
    purchasePrice: 18000, rentalPricePerDay: 11500,
  });

  // Deliberately expensive to own relative to its rental: even before the
  // same-day rule bites, buying two is the wrong call.
  const rentBuyStage = await StockroomInventory.create({
    name: 'DK Stage Riser 4x8ft (same-day demo)',
    itemCode: 'DK-ST-92', category: 'Equipment',
    quantity: 0, availableQuantity: 0, status: 'available',
    purchasePrice: 26000, rentalPricePerDay: 9000,
  });

  const rentBuyRequests = [
    { number: `${TAG}PR-0005`, item: rentBuyTent, qty: 1, unit: 11500, event: day(30),
      reason: 'Marquee tent needed for the garden reception; not held in stock.' },
    { number: `${TAG}PR-0006`, item: rentBuyTent, qty: 1, unit: 11500, event: day(75),
      reason: 'Same marquee tent needed again for a later garden reception.' },
    { number: `${TAG}PR-0007`, item: rentBuyStage, qty: 1, unit: 9000, event: day(45),
      reason: 'Stage riser for the programme area.' },
    { number: `${TAG}PR-0008`, item: rentBuyStage, qty: 1, unit: 9000, event: day(45),
      reason: 'Stage riser for a second event running the same day.' },
  ];

  for (const r of rentBuyRequests) {
    await ProcurementRequest.create({
      requestNumber: r.number,
      status: 'awaiting_accounting_approval',
      department: 'stockroom',
      inventoryModel: 'StockroomInventory',
      inventoryItem: r.item._id,
      createdBy: requesterByDept.stockroom?._id || accounting?._id,
      requestType: 'rental',
      requisitionType: 'purchase_requisition',
      source: 'manual',
      sourceSection: 'equipmentChecklist',
      itemName: r.item.name,
      itemCode: r.item.itemCode,
      itemCategory: r.item.category,
      requestedQuantity: r.qty,
      shortageQuantity: r.qty,
      eventDate: r.event,
      neededBy: day(Math.max(7, Math.round((r.event - now) / 86400000) - 3)),
      requestReason: `[${TAG}] ${r.reason}`,
      quote: {
        supplier: supplierByDept.stockroom?._id,
        supplierName: supplierByDept.stockroom?.name,
        supplierContact: '0917-555-0188',
        quotedUnitPrice: r.unit,
        quotedTotal: r.qty * r.unit,
        leadTimeDays: 7,
        quoteReference: `${r.number}-Q1`,
        rentalStartDate: r.event,
        rentalEndDate: r.event,
        notes: `[${TAG}] Quotation prepared by Purchasing.`,
      },
    });
  }
  summary.push('Rent-vs-buy · DK-PR-0005/0006 (separate dates — buying wins) and DK-PR-0007/0008 (same day — renting wins).');

  // ------------------------------------------------------------------ report
  console.log('');
  console.log('  DEMO KIT SEEDED');
  console.log('  ' + '-'.repeat(66));
  summary.forEach((line) => console.log('  • ' + line));
  console.log('');
  console.log('  Records created carry the DK- prefix. Re-run this script any time to');
  console.log('  reset them; it only ever deletes its own records.');
  console.log('');

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Demo kit seed failed:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
