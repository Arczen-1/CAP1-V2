#!/usr/bin/env node

// Demo data for the re-defense, covering only the changes made after the first
// defense. Everything it creates is prefixed RD- so it is obvious on screen and
// safe to re-run: the script deletes its own records first, then recreates them.
//
//   npm run seed:redefense
//
// It also runs the payment-compliance and loading-readiness sweeps at the end,
// so the notifications each scenario is supposed to produce are already sitting
// in the right inboxes when the demo starts. Nothing is written by hand.
//
// What it stages, per improvement:
//
//   Loading readiness   RD-LOAD-GO     everything prepared, cleared to load
//                       RD-LOAD-LINEN  Linen outstanding, loading starts tomorrow
//                       RD-LOAD-RISK   Kitchen outstanding, loading window open
//
//   Settlement deadline RD-HOLD-WARN   on hold, 3 days left to settle
//                       RD-HOLD-LAPSE  deadline passed, cancelled by the sweep
//
//   40% write-off       RD-AGING-LAST  aging window closes in 2 days
//
//   Rent vs buy         RD-RENT-SEP-A/B  same tent, separate dates -> buy
//                       RD-RENT-DAY-A/B  same riser, same date    -> keep renting

const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const Contract = require('./models/Contract');
const ProcurementRequest = require('./models/ProcurementRequest');
const Notification = require('./models/Notification');
const Supplier = require('./models/Supplier');
const User = require('./models/User');
const StockroomInventory = require('./models/StockroomInventory');
require('./models/LinenInventory');
require('./models/CreativeInventory');

const { runPaymentComplianceSweep } = require('./paymentCompliance');
const { runLoadingReadinessSweep } = require('./loadingReadinessNotifications');
const { notifyRentVsBuy } = require('./procurementOverlap');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/juancarlos';

const TAG = 'RD-';
const now = new Date();
const day = (n) => { const d = new Date(now); d.setDate(d.getDate() + n); d.setHours(12, 0, 0, 0); return d; };
const month = (n) => { const d = new Date(now); d.setMonth(d.getMonth() + n); d.setHours(12, 0, 0, 0); return d; };
const peso = (value) => Math.round(value * 100) / 100;

// ---------------------------------------------------------------- item builders
const dish = (name, category, pax) => ({ category, item: name, quantity: pax, confirmed: true });
const equip = (name, code, qty, status) => ({ item: name, itemCode: code, category: 'Equipment', quantity: qty, status });
const linen = (type, code, qty, status) => ({ type, itemCode: code, category: 'Table Linen', quantity: qty, status });
const decor = (name, code, qty, status) => ({ item: name, itemCode: code, category: 'Props', quantity: qty, status });

const MENU = (pax) => [
  dish('Beef Salpicao', 'Beef', pax),
  dish('Chicken Cordon Bleu', 'Chicken', pax),
  dish('Baked Ziti', 'Pasta', pax),
  dish('Mango Panna Cotta', 'Dessert', pax),
];

const contractBase = ({ number, client, type, eventDate, pax, price, status, extra = {} }) => ({
  contractNumber: number,
  clientName: client,
  clientContact: '0917-555-0142',
  clientEmail: `${number.toLowerCase()}@redefense.test`,
  clientAddress: { street: '48 Rizal Avenue', city: 'Batangas City', province: 'Batangas', zipCode: '4200' },
  clientType: type,
  eventDate,
  bookingDate: month(-4),
  venue: { name: 'Casa Ilustrado Garden Pavilion', address: 'Barangay Alangilan, Batangas City', capacity: 500 },
  packageSelected: 'premium',
  totalPacks: pax,
  packagePrice: peso(price / pax),
  totalContractValue: peso(price),
  paymentTerms: type === 'corporate' ? 'corporate_flexible' : 'wedding_standard',
  downPaymentPercent: 40,
  finalPaymentPercent: 60,
  status,
  clientSigned: true,
  clientSignedAt: month(-4),
  menuDetails: MENU(pax),
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
  const priorContracts = await Contract.find({ contractNumber: new RegExp(`^${TAG}`) }).select('_id').lean();
  const priorRequests = await ProcurementRequest.find({ requestNumber: new RegExp(`^${TAG}`) }).select('_id').lean();
  const wipedNotifs = await Notification.deleteMany({
    $or: [
      { contract: { $in: priorContracts.map((c) => c._id) } },
      { procurementRequest: { $in: priorRequests.map((r) => r._id) } },
      // The rent-vs-buy alert is deduped by item name, so it has to go too or a
      // re-run would find it already sent and stay silent.
      { title: /RD Marquee Tent|RD Stage Riser/ },
    ],
  });
  const wiped = await Promise.all([
    Contract.deleteMany({ contractNumber: new RegExp(`^${TAG}`) }),
    ProcurementRequest.deleteMany({ requestNumber: new RegExp(`^${TAG}`) }),
    StockroomInventory.deleteMany({ itemCode: { $in: ['RD-ST-TENT', 'RD-ST-RISER'] } }),
  ]);
  summary.push(`Cleared previous re-defense set: ${wiped[0].deletedCount} contracts, ${wiped[1].deletedCount} requests, ${wipedNotifs.deletedCount} notifications.`);

  const accounting = await User.findOne({ role: 'accounting' });
  const stockroomUser = await User.findOne({ role: 'stockroom' }) || accounting;
  const supplier = await Supplier.findOne({ departments: 'stockroom' }) || await Supplier.findOne();

  // =========================================================== LOADING READINESS
  // Readiness is per department: Kitchen is all-or-nothing on ingredientStatus,
  // the other three are ready when every assigned item is marked prepared.

  // Everything done, event in 2 days -> cleared for loading.
  await Contract.create(contractBase({
    number: `${TAG}LOAD-GO`, client: 'RD Navarro Garden Wedding', type: 'wedding',
    eventDate: day(2), pax: 180, price: 396000, status: 'approved',
    extra: {
      ingredientStatus: 'prepared',
      equipmentChecklist: [equip('Chafing Dish Set', 'RD-EQ-01', 12, 'prepared'), equip('Cocktail Table', 'RD-EQ-02', 8, 'prepared')],
      linenRequirements: [linen('Round Table Cloth', 'RD-LN-01', 20, 'prepared'), linen('Napkin Set', 'RD-LN-02', 180, 'prepared')],
      creativeAssets: [decor('Floral Arch', 'RD-CR-01', 1, 'prepared')],
      logisticsAssignment: { assignmentStatus: 'scheduled' },
      payments: [payment(396000, month(-3), 'RD-GO-FULL')],
    },
  }));

  // Linen not finished, event in 2 days -> escalation, loading starts tomorrow.
  await Contract.create(contractBase({
    number: `${TAG}LOAD-LINEN`, client: 'RD Espinosa Corporate Dinner', type: 'corporate',
    eventDate: day(2), pax: 150, price: 330000, status: 'approved',
    extra: {
      ingredientStatus: 'prepared',
      equipmentChecklist: [equip('Chafing Dish Set', 'RD-EQ-01', 10, 'prepared')],
      linenRequirements: [linen('Round Table Cloth', 'RD-LN-01', 18, 'prepared'), linen('Chair Sash', 'RD-LN-03', 150, 'pending')],
      creativeAssets: [decor('Stage Backdrop', 'RD-CR-02', 1, 'prepared')],
      logisticsAssignment: { assignmentStatus: 'scheduled' },
      payments: [payment(330000, month(-3), 'RD-LINEN-FULL')],
    },
  }));

  // Kitchen still sourcing, event tomorrow -> loading window open, at risk.
  await Contract.create(contractBase({
    number: `${TAG}LOAD-RISK`, client: 'RD Villamor Debut', type: 'debut',
    eventDate: day(1), pax: 200, price: 440000, status: 'approved',
    extra: {
      ingredientStatus: 'procured',
      equipmentChecklist: [equip('Cocktail Table', 'RD-EQ-02', 10, 'prepared')],
      linenRequirements: [linen('Round Table Cloth', 'RD-LN-01', 22, 'prepared')],
      creativeAssets: [decor('Balloon Arch', 'RD-CR-03', 2, 'prepared')],
      logisticsAssignment: { assignmentStatus: 'scheduled' },
      payments: [payment(440000, month(-3), 'RD-RISK-FULL')],
    },
  }));
  summary.push('Loading readiness · RD-LOAD-GO (cleared), RD-LOAD-LINEN (Linen outstanding, T-2), RD-LOAD-RISK (Kitchen outstanding, T-1).');

  // ========================================================= SETTLEMENT DEADLINE
  // Deadline is one month before the event. A contract on hold stays recoverable
  // until then; past it the sweep cancels the booking.

  // Event 33 days out -> deadline in 3 days -> final notice fires.
  const warnEvent = day(33);
  await Contract.create(contractBase({
    number: `${TAG}HOLD-WARN`, client: 'RD Sandoval Silver Anniversary', type: 'wedding',
    eventDate: warnEvent, pax: 240, price: 528000, status: 'approved',
    extra: {
      bookingDate: month(-6),
      payments: [payment(528000 * 0.4, month(-4), 'RD-WARN-40')],
      paymentHold: {
        active: true,
        reason: 'Final balance of PHP 316,800.00 was not fully collected by the due date (2 months before the event).',
        startedAt: day(-24),
        managementOverride: false,
      },
    },
  }));

  // Event 26 days out -> deadline passed 4 days ago -> sweep cancels it.
  await Contract.create(contractBase({
    number: `${TAG}HOLD-LAPSE`, client: 'RD Bautista Corporate Gala', type: 'corporate',
    eventDate: day(26), pax: 300, price: 660000, status: 'approved',
    extra: {
      bookingDate: month(-7),
      payments: [payment(660000 * 0.4, month(-5), 'RD-LAPSE-40')],
      paymentHold: {
        active: true,
        reason: 'Final balance of PHP 396,000.00 was not fully collected by the due date (2 months before the event).',
        startedAt: day(-38),
        managementOverride: false,
      },
    },
  }));
  summary.push('Settlement deadline · RD-HOLD-WARN (3 days left) and RD-HOLD-LAPSE (deadline passed, cancelled by the sweep).');

  // ============================================================ 40% WRITE-OFF
  // 40% due at booking + 2 months, then a 30-day aging window. Booking is set so
  // the window closes in 2 days and the new final notice fires.
  const fortyDue = day(-28);
  const agingBooking = new Date(fortyDue); agingBooking.setMonth(agingBooking.getMonth() - 2);
  await Contract.create(contractBase({
    number: `${TAG}AGING-LAST`, client: 'RD Delgado Christening', type: 'birthday',
    eventDate: day(210), pax: 120, price: 264000, status: 'approved',
    extra: { bookingDate: agingBooking, payments: [] },
  }));
  summary.push('40% write-off · RD-AGING-LAST (aging window closes in 2 days, final notice fires).');

  // =============================================================== RENT VS BUY
  // Two inventory items priced so the comparison lands on opposite answers.

  // Rented at PHP 11,500 an event; owning one costs PHP 18,000. Two rentals on
  // separate dates therefore cost more than buying one unit.
  const tent = await StockroomInventory.create({
    name: 'RD Marquee Tent 10x20m', itemCode: 'RD-ST-TENT', category: 'Tent',
    quantity: 0, availableQuantity: 0, status: 'available',
    purchasePrice: 18000, rentalPricePerDay: 11500,
  });

  // Owning two costs far more than renting two for one day, so the same-day pair
  // must NOT be recommended for purchase.
  const riser = await StockroomInventory.create({
    name: 'RD Stage Riser 4x8ft', itemCode: 'RD-ST-RISER', category: 'Equipment',
    quantity: 0, availableQuantity: 0, status: 'available',
    purchasePrice: 26000, rentalPricePerDay: 9000,
  });

  const rentalContracts = [
    { number: `${TAG}RENT-SEP-A`, client: 'RD Ilagan Garden Reception', type: 'wedding', event: day(38), pax: 160, item: tent, unit: 11500 },
    { number: `${TAG}RENT-SEP-B`, client: 'RD Mercado Garden Reception', type: 'wedding', event: day(82), pax: 170, item: tent, unit: 11500 },
    { number: `${TAG}RENT-DAY-A`, client: 'RD Cordero Product Launch', type: 'corporate', event: day(52), pax: 190, item: riser, unit: 9000 },
    { number: `${TAG}RENT-DAY-B`, client: 'RD Panganiban Awards Night', type: 'corporate', event: day(52), pax: 210, item: riser, unit: 9000 },
  ];

  const rentalRequests = [];
  for (const entry of rentalContracts) {
    const contract = await Contract.create(contractBase({
      number: entry.number, client: entry.client, type: entry.type,
      eventDate: entry.event, pax: entry.pax, price: entry.pax * 2200, status: 'approved',
      // Paid in full on purpose. These contracts exist to demonstrate the
      // procurement comparison, and an unpaid balance would put them on payment
      // hold - which blocks preparation and buries the point being made.
      extra: { payments: [payment(entry.pax * 2200, month(-3), `${entry.number}-FULL`)] },
    }));

    rentalRequests.push(await ProcurementRequest.create({
      requestNumber: `${TAG}PR-${entry.number.replace(TAG, '')}`,
      status: 'awaiting_accounting_approval',
      department: 'stockroom',
      inventoryModel: 'StockroomInventory',
      inventoryItem: entry.item._id,
      createdBy: stockroomUser?._id || accounting?._id,
      requestType: 'rental',
      requisitionType: 'purchase_requisition',
      source: 'contract_shortage',
      sourceSection: 'equipmentChecklist',
      contract: contract._id,
      eventDate: entry.event,
      itemName: entry.item.name,
      itemCode: entry.item.itemCode,
      itemCategory: entry.item.category,
      requestedQuantity: 1,
      shortageQuantity: 1,
      neededBy: day(Math.max(7, Math.round((entry.event - now) / 86400000) - 5)),
      requestReason: `[${TAG}] ${entry.item.name} is not held in stock and is needed for this event.`,
      quote: {
        supplier: supplier?._id,
        supplierName: supplier?.name,
        supplierContact: '0917-555-0188',
        quotedUnitPrice: entry.unit,
        quotedTotal: entry.unit,
        leadTimeDays: 7,
        quoteReference: `${entry.number}-Q1`,
        rentalStartDate: entry.event,
        rentalEndDate: entry.event,
        notes: `[${TAG}] Quotation prepared by Purchasing.`,
      },
    }));
  }

  // Raised through the same helper the create endpoint uses, so the alert the
  // panel sees is the one the system produces - not seeded text.
  for (const request of rentalRequests) {
    await notifyRentVsBuy(request);
  }
  summary.push('Rent vs buy · RD-PR-RENT-SEP-A/B (separate dates, buying wins) and RD-PR-RENT-DAY-A/B (same day, renting wins).');

  // ============================================== let the system speak for itself
  // The scenarios above are only data. Running the sweeps here is what turns them
  // into the alerts each department will be looking at during the demo.
  const payments = await runPaymentComplianceSweep();
  const loading = await runLoadingReadinessSweep();
  summary.push(`Sweeps run · payment compliance notified ${payments.notified}, cancelled ${payments.cancelled.join(', ') || 'none'}.`);
  summary.push(`Sweeps run · loading readiness notified ${loading.notified}, cleared ${loading.cleared.join(', ') || 'none'}.`);

  const rdNotifs = await Notification.countDocuments({
    contract: { $in: (await Contract.find({ contractNumber: new RegExp(`^${TAG}`) }).select('_id').lean()).map((c) => c._id) },
  });
  summary.push(`${rdNotifs} notifications now sit against RD- contracts.`);

  console.log('');
  console.log('  RE-DEFENSE DEMO SEEDED');
  console.log('  ------------------------------------------------------------------');
  summary.forEach((line) => console.log(`  • ${line}`));
  console.log('');
  console.log('  Records carry the RD- prefix. Re-run any time to reset them;');
  console.log('  it only ever deletes its own records.');
  console.log('');

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Re-defense demo seed failed:', error.message);
  try { await mongoose.disconnect(); } catch { /* already down */ }
  process.exit(1);
});
