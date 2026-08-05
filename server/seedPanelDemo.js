// Purpose-built data for demonstrating panel comments 4 and 5.
//
//   #4  Issues with allocated resources inside the "locked-in" period —
//       a contract sitting inside the 7-day material freeze with every item
//       prepared, so the freeze can be shown blocking the ordinary path and
//       then the incident-backed replacement working.
//
//   #5  Access to information during decision-making — procurement requests
//       that make each supplier check pass or fail for a real reason, a
//       three-quotation canvass to choose from, and a same-day pair where one
//       event is visibly holding the trucks and staff the other wants.
//
// Everything is prefixed PD- and this script only ever deletes its own records,
// so it can be re-run between rehearsals without disturbing the other datasets.
require('dotenv').config();
const mongoose = require('mongoose');
const Contract = require('./models/Contract');
const ProcurementRequest = require('./models/ProcurementRequest');
const Incident = require('./models/Incident');
const Notification = require('./models/Notification');
const Supplier = require('./models/Supplier');
const User = require('./models/User');
const BanquetStaff = require('./models/BanquetStaff');
const { Driver, Truck } = require('./models/Logistics');
const CreativeInventory = require('./models/CreativeInventory');
const LinenInventory = require('./models/LinenInventory');
const StockroomInventory = require('./models/StockroomInventory');

const TAG = 'PD-';
const peso = (n) => Math.round(n * 100) / 100;
const day = (n) => { const d = new Date(); d.setHours(9, 0, 0, 0); d.setDate(d.getDate() + n); return d; };
const month = (n) => { const d = new Date(); d.setHours(9, 0, 0, 0); d.setMonth(d.getMonth() + n); return d; };

const contractBase = ({ number, client, eventDate, pax, price, status, extra = {} }) => ({
  contractNumber: number,
  clientName: client,
  clientContact: '0917-555-0140',
  clientEmail: `${number.toLowerCase()}@paneldemo.test`,
  clientAddress: { street: '8 Rizal Avenue', city: 'Batangas City', province: 'Batangas', zipCode: '4200' },
  clientType: 'wedding',
  eventDate,
  bookingDate: month(-4),
  venue: { name: 'Villa Escondida Pavilion', address: 'Barangay Balagtas, Batangas City', capacity: 350 },
  packageSelected: 'premium',
  totalPacks: pax,
  packagePrice: peso(price / pax),
  totalContractValue: peso(price),
  paymentTerms: 'wedding_standard',
  downPaymentPercent: 40,
  finalPaymentPercent: 60,
  status,
  clientSigned: true,
  clientSignedAt: month(-4),
  menuDetails: [
    { category: 'Beef', item: 'Beef Caldereta', quantity: pax, confirmed: true, notes: 'Mild sauce - elderly guests at the family tables.' },
    { category: 'Chicken', item: 'Chicken Galantina', quantity: pax, confirmed: true },
    { category: 'Dessert', item: 'Mango Float', quantity: pax, confirmed: true, notes: 'Less sweet than the tasting portion.' },
  ],
  payments: [{
    amount: peso(price), date: month(-3), method: 'bank_transfer',
    reference: `${number}-OR`, receiptNumber: `${number}-OR`, receiptIssuedBy: 'Juan Carlos',
    receiptGeneratedAt: month(-3), status: 'completed',
  }],
  paymentStatus: 'paid',
  ...extra,
});

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Connected to ${mongoose.connection.name}\n`);
  const notes = [];

  // ------------------------------------------------------------ clean slate
  const priorContracts = await Contract.find({ contractNumber: new RegExp(`^${TAG}`) }).select('_id').lean();
  const priorIds = priorContracts.map((c) => c._id);
  await Promise.all([
    Incident.deleteMany({ contract: { $in: priorIds } }),
    Notification.deleteMany({ contract: { $in: priorIds } }),
    ProcurementRequest.deleteMany({ requestNumber: new RegExp(`^${TAG}`) }),
    Contract.deleteMany({ contractNumber: new RegExp(`^${TAG}`) }),
    LinenInventory.deleteMany({ itemCode: `${TAG}LN-01` }),
  ]);

  const [sales, accounting] = await Promise.all([
    User.findOne({ role: 'sales' }), User.findOne({ role: 'accounting' }),
  ]);
  const requesterByDept = {};
  for (const dept of ['creative', 'linen', 'stockroom']) {
    requesterByDept[dept] = await User.findOne({ role: dept }) || accounting;
  }

  // A linen line owned by this dataset, so the freeze demonstration never
  // depends on - or disturbs - real stock levels.
  const demoLinen = await LinenInventory.create({
    name: 'PD Ivory Table Runner (panel demo)', itemCode: `${TAG}LN-01`,
    category: 'Runner', quantity: 120, availableQuantity: 120,
    status: 'available', color: 'Ivory', material: 'Satin', size: 'medium', unitPrice: 85,
  });

  const [creativeItem, stockItem] = await Promise.all([
    CreativeInventory.findOne({ status: 'available' }).sort({ availableQuantity: -1 }),
    StockroomInventory.findOne({ status: 'available' }).sort({ availableQuantity: -1 }),
  ]);

  // ============================================ #4 · inside the freeze =====
  // Three days out, fully paid, every item prepared: the freeze is active and
  // there is something prepared to try to release.
  const prepared = (extra) => ({ status: 'prepared', postEventStatus: 'pending_check', ...extra });

  const frozen = await Contract.create(contractBase({
    number: `${TAG}FREEZE-001`,
    client: 'Alvarez–Bautista Wedding (panel demo)',
    eventDate: day(3), pax: 220, price: 528000, status: 'approved',
    extra: {
      linenRequirements: [prepared({
        itemId: String(demoLinen._id), type: demoLinen.name, itemCode: demoLinen.itemCode,
        category: demoLinen.category, quantity: 60, unitPrice: demoLinen.unitPrice,
      })],
      creativeAssets: creativeItem ? [prepared({
        itemId: String(creativeItem._id), item: creativeItem.name, itemCode: creativeItem.itemCode,
        category: creativeItem.category || 'Other', quantity: 2, pricePerItem: creativeItem.pricePerItem || 0,
      })] : [],
      equipmentChecklist: stockItem ? [prepared({
        itemId: String(stockItem._id), item: stockItem.name, itemCode: stockItem.itemCode,
        category: stockItem.category, quantity: 12, unitPrice: stockItem.unitPrice || 0,
      })] : [],
      departmentProgress: { linen: 100, creative: 100, stockroom: 100 },
    },
  }));
  notes.push(`#4 · ${frozen.contractNumber} - event in 3 days, all items PREPARED, freeze active.`);

  // ======================================= #5 · same-day contention ========
  // A and B share a date. A holds a truck, a driver, and four banquet staff,
  // so B's lists are visibly short and the screen names A as the reason.
  const sameDate = day(24);
  const [truck, driver, staff] = await Promise.all([
    Truck.findOne({ status: { $in: ['available', 'in_use'] } }).lean(),
    Driver.findOne({ status: 'active' }).lean(),
    BanquetStaff.find({ status: 'active' }).limit(4).lean(),
  ]);

  const holder = await Contract.create(contractBase({
    number: `${TAG}SAMEDAY-A`,
    client: 'Delos Santos Golden Anniversary (holds the resources)',
    eventDate: sameDate, pax: 180, price: 414000, status: 'approved',
    extra: {
      logisticsAssignment: truck && driver
        ? { truck: truck._id, driver: driver._id, assignmentStatus: 'scheduled' } : {},
      banquetAssignment: { assignments: staff.map((s) => ({ staff: s._id, assignmentRole: 'service_staff' })) },
    },
  }));

  const wanter = await Contract.create(contractBase({
    number: `${TAG}SAMEDAY-B`,
    client: 'Rivera Debut Celebration (wants the same resources)',
    eventDate: sameDate, pax: 150, price: 345000, status: 'approved',
  }));
  notes.push(`#5 · ${holder.contractNumber} holds 1 truck, 1 driver, ${staff.length} staff on ${sameDate.toDateString()};`);
  notes.push(`     open ${wanter.contractNumber} to see them withheld and A named as the reason.`);

  // ==================================== #5 · procurement decision data =====
  const suppliers = await Supplier.find({ isActive: true }).lean();
  const stockroomSupplier = suppliers.find((s) => (s.departments || []).includes('stockroom')) || suppliers[0];
  const alternates = suppliers.filter((s) => String(s._id) !== String(stockroomSupplier._id)).slice(0, 2);
  // A supplier that is on file and active but NOT cleared for a rental, so one
  // check fails for a reason a person skimming the screen would miss.
  const purchaseOnly = suppliers.find((s) => (s.requestTypes || []).length === 1
    && (s.requestTypes || [])[0] === 'purchase') || suppliers[1] || stockroomSupplier;

  const baseRequest = (number, extra) => ({
    requestNumber: number,
    status: 'awaiting_accounting_approval',
    department: 'stockroom',
    inventoryModel: 'StockroomInventory',
    createdBy: requesterByDept.stockroom?._id || accounting?._id,
    requestType: 'purchase',
    requisitionType: 'purchase_requisition',
    source: 'inventory_low_stock',
    sourceSection: 'equipmentChecklist',
    itemCategory: 'Event Requirement',
    neededBy: day(18),
    ...extra,
  });

  // (a) A full canvass — the quotation Accounting actually chooses between.
  const canvassed = await ProcurementRequest.create(baseRequest(`${TAG}PR-CANVASS`, {
    itemName: 'Chafing Dish Roll-Top 9L',
    requestedQuantity: 12,
    requestReason: `[${TAG}] Buffet line replacement. Three suppliers were canvassed for comparison.`,
    quotes: [
      {
        supplier: stockroomSupplier._id, supplierName: stockroomSupplier.name,
        supplierContact: '0917-555-0188', quotedUnitPrice: 2150, quotedTotal: 25800,
        leadTimeDays: 7, quoteReference: `${TAG}PR-CANVASS-Q1`,
      },
      ...alternates.map((s, i) => ({
        supplier: s._id, supplierName: s.name,
        quotedUnitPrice: i === 0 ? 1980 : 2340,
        quotedTotal: (i === 0 ? 1980 : 2340) * 12,
        leadTimeDays: i === 0 ? 10 : 5,
        quoteReference: `${TAG}PR-CANVASS-Q${i + 2}`,
      })),
    ],
  }));
  {
    const saved = await ProcurementRequest.findById(canvassed._id);
    const cheapest = saved.quotes.reduce((best, q) => (q.quotedTotal < best.quotedTotal ? q : best), saved.quotes[0]);
    saved.selectedQuoteId = cheapest._id;
    saved.syncSelectedQuote();
    await saved.save();
    notes.push(`#5 · ${saved.requestNumber} - 3 quotations, cheapest (${cheapest.supplierName}, P${cheapest.quotedTotal}) funded by default.`);
  }

  // (b) Supplier typed by hand — fails "Accredited supplier on file".
  await ProcurementRequest.create(baseRequest(`${TAG}PR-NOSUPPLIER`, {
    itemName: 'Cocktail Table Riser',
    requestedQuantity: 6,
    requestReason: `[${TAG}] Sourced by phone from a walk-in supplier.`,
    quote: {
      supplierName: 'Batangas Quick Rentals (walk-in)',
      supplierContact: '0999-555-0101',
      quotedUnitPrice: 1450, quotedTotal: 8700, leadTimeDays: 6,
      quoteReference: `${TAG}PR-NOSUPPLIER-Q1`,
    },
  }));
  notes.push(`#5 · ${TAG}PR-NOSUPPLIER - supplier typed by hand, fails "Accredited supplier on file".`);

  // (c) Accredited and active, but not cleared for a rental.
  await ProcurementRequest.create(baseRequest(`${TAG}PR-WRONGTYPE`, {
    requestType: 'rental',
    itemName: 'Reception Tent 10x20m',
    requestedQuantity: 1,
    requestReason: `[${TAG}] Tent is only needed for this event, so it is rented.`,
    quote: {
      supplier: purchaseOnly._id, supplierName: purchaseOnly.name,
      supplierContact: '0917-555-0190',
      quotedUnitPrice: 12400, quotedTotal: 12400, leadTimeDays: 5,
      quoteReference: `${TAG}PR-WRONGTYPE-Q1`,
    },
  }));
  notes.push(`#5 · ${TAG}PR-WRONGTYPE - ${purchaseOnly.name} is on file and active but handles [${(purchaseOnly.requestTypes || []).join(', ')}].`);

  console.log('  PANEL DEMO SEEDED (comments 4 and 5)');
  console.log('  ' + '-'.repeat(66));
  notes.forEach((n) => console.log('  • ' + n));
  console.log('\n  All records carry the PD- prefix. Re-run any time to reset them.\n');

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error('Panel demo seed failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
