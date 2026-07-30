/**
 * Advisor demo seed.
 *
 * Prepares a clean, self-explaining dataset for the advisor walkthrough:
 *
 *   1. Clears every existing notification (all departments).
 *   2. Removes any previous DEMO-* contracts and their procurement requests.
 *   3. Creates one contract per Walkthrough department (DEMO-W1 .. DEMO-W8)
 *      and one per Traceability business rule (DEMO-R1 .. DEMO-R11).
 *   4. Writes the department-handoff notifications using the exact titles,
 *      messages, and action URLs the real routes emit.
 *   5. Runs the real payment-compliance and kitchen-prep sweeps so the
 *      rule-driven notifications are produced by the actual system code
 *      rather than being hand-written here.
 *
 * Safe to re-run: it is idempotent for DEMO-* records.
 *
 * Usage:  node server/seedAdvisorDemo.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const Contract = require('./models/Contract');
const Notification = require('./models/Notification');
const ProcurementRequest = require('./models/ProcurementRequest');
const User = require('./models/User');
const BanquetStaff = require('./models/BanquetStaff');
const { Driver, Truck } = require('./models/Logistics');

// ---------------------------------------------------------------- helpers

const startOfDay = (value) => { const d = new Date(value); d.setHours(0, 0, 0, 0); return d; };
const TODAY = startOfDay(new Date());
const day = (offset) => { const d = new Date(TODAY); d.setDate(d.getDate() + offset); return d; };
const money = (value) => Math.round(value * 100) / 100;

const formatDateLabel = (value) => new Date(value).toLocaleDateString('en-PH', {
  year: 'numeric', month: 'long', day: 'numeric'
});

// Mirrors CONTRACT_SECTION_ACTION_TABS in routes/contracts.js
const SECTION_TABS = {
  sales: 'details', accounting: 'payments', creative: 'inventory',
  linen: 'inventory', stockroom: 'inventory', kitchen: 'menu',
  banquet: 'banquet', logistics: 'logistics', purchasing: 'inventory'
};

// Mirrors DEPARTMENT_NOTIFICATION_ROLES in routes/contracts.js
const DEPARTMENT_ROLES = {
  sales: ['sales'], accounting: ['accounting'], creative: ['creative'],
  linen: ['linen'], stockroom: ['stockroom'], kitchen: ['kitchen'],
  banquet: ['banquet_supervisor'], logistics: ['logistics'], purchasing: ['purchasing']
};

// ------------------------------------------------------- inventory refs
// Real records already present in the database, so availability, shortage
// detection, and same-day reservation conflicts all compute for real.

const CREATIVE = {
  backdrop: { itemId: '69b9004dea4f04732e19e057', item: 'PLYWOOD PANEL', itemCode: 'LEG-CR-0463', category: 'Backdrop' },
  entrance: { itemId: '69b9004dea4f04732e19e059', item: 'CLASSIC ROMANCE ENTRANCE', itemCode: 'LEG-CR-0480', category: 'Signage' },
  rattan: { itemId: '69b9004dea4f04732e19e05f', item: 'RATTAN BALL', itemCode: 'LEG-CR-0545', category: 'Props' }
};

const LINEN = {
  napkin: { itemId: '69b9004dea4f04732e19e01a', type: 'Table Napkin White', itemCode: 'LEG-LN-0048', category: 'Napkin', size: 'medium', material: 'Polyester', color: 'White' },
  sash: { itemId: '69b9004dea4f04732e19e024', type: 'Sash Red', itemCode: 'LEG-LN-0085', category: 'Other', size: 'custom', material: 'Polyester', color: 'Red' }
};

const STOCK = {
  chafing: { itemId: '69b9004dea4f04732e19e098', item: 'Chafing Dish Oval', itemCode: 'LEG-ST-0864', category: 'Equipment' },
  table: { itemId: '69b9004dea4f04732e19e09e', item: 'Table Round', itemCode: 'LEG-ST-0940', category: 'Table' },
  fork: { itemId: '69b9004dea4f04732e19e094', item: 'Fork CHINAWARE', itemCode: 'LEG-ST-0825', category: 'Tool' }
};

const creativeItem = (ref, quantity, status = 'pending') => ({ ...ref, quantity, status, postEventStatus: 'pending_check' });
const linenItem = (ref, quantity, status = 'pending') => ({ ...ref, quantity, status, postEventStatus: 'pending_check' });
const stockItem = (ref, quantity, status = 'pending') => ({ ...ref, quantity, status, postEventStatus: 'pending_check' });

const menu = (rows) => rows.map(([category, item, quantity, confirmed = false, notes = '']) => ({
  category, item, quantity, confirmed, notes
}));

const VENUES = {
  lima: { name: 'Lima Park Hotel - Grand Ballroom', address: 'Malvar, Batangas', capacity: 500, contact: 'Lima Park Events' },
  pontefino: { name: 'Pontefino Residences - Function Hall', address: 'Batangas City', capacity: 300, contact: 'Pontefino Front Desk' },
  wtc: { name: 'World Trade Center - Hall C', address: 'Pasay City', capacity: 700, contact: 'WTC Events' },
  casa: { name: 'Casa Consuelo Events Place', address: 'Lipa City, Batangas', capacity: 250, contact: 'Casa Consuelo Admin' },
  balai: { name: 'Balai Taal Garden Pavilion', address: 'Taal, Batangas', capacity: 200, contact: 'Balai Taal Coordinator' }
};

// ------------------------------------------------------------ main seed

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  console.log(`Connected to ${mongoose.connection.name}`);

  const users = await User.find({ isActive: true }).select('_id role name').lean();
  const byRole = (role) => users.filter((u) => u.role === role);
  const oneOf = (role) => byRole(role)[0];
  const salesUser = oneOf('sales');
  const purchasingUser = oneOf('purchasing');
  const stockroomUser = oneOf('stockroom');

  if (!salesUser) throw new Error('No active sales user found - cannot seed.');

  // ---- 1. clear all notifications -----------------------------------
  const before = await Notification.countDocuments();
  await Notification.deleteMany({});
  console.log(`Cleared ${before} notification(s) across all departments.`);

  // ---- 2. clear previous demo records --------------------------------
  const oldContracts = await Contract.find({ contractNumber: /^DEMO-/ }).select('_id').lean();
  const oldIds = oldContracts.map((c) => c._id);
  const removedRequests = await ProcurementRequest.deleteMany({
    $or: [{ contract: { $in: oldIds } }, { requestNotes: /ADVISOR-DEMO/ }]
  });
  await Contract.deleteMany({ contractNumber: /^DEMO-/ });
  console.log(`Removed ${oldIds.length} previous demo contract(s) and ${removedRequests.deletedCount} demo procurement request(s).`);

  // ---- reference records ---------------------------------------------
  const waiters = await BanquetStaff.find({ status: 'active', role: { $in: ['waiter', 'waitress'] } })
    .select('_id').limit(30).lean();
  const captain = await BanquetStaff.findOne({ status: 'active', role: 'head_captain' }).select('_id').lean();
  const cargoTruck = await Truck.findOne({ truckId: 'SCN-TRK-001' }).select('_id').lean();
  const anyDriver = await Driver.findOne({ status: 'active' }).select('_id').lean();

  const staffTeam = (count) => {
    const picked = waiters.slice(0, Math.max(0, count));
    const rows = picked.map((s) => ({ staff: s._id, assignmentRole: 'service_staff' }));
    if (captain) rows.unshift({ staff: captain._id, assignmentRole: 'head_captain' });
    return rows;
  };

  const created = {};

  // The declarations below keep the address as a readable "City, Province"
  // string and describe the payer as individual/corporate. The schema wants a
  // structured address, an event-category clientType, and explicit payment
  // terms, so normalize once here instead of repeating it 20 times.
  const ZIP_CODES = {
    'Batangas City': '4200', 'Lipa City': '4217', 'Taal': '4208',
    'Malvar': '4233', 'Sto. Tomas': '4234', 'Nasugbu': '4231',
    'San Jose': '4227', 'Makati City': '1200', 'Pasay City': '1300'
  };

  const normalizeAddress = (value) => {
    const parts = String(value).split(',').map((part) => part.trim()).filter(Boolean);
    const city = parts[0] || 'Batangas City';
    const province = parts[1] || 'Metro Manila';
    return {
      street: `${city} Poblacion`,
      city,
      province,
      zipCode: ZIP_CODES[city] || '4200'
    };
  };

  const make = async (doc) => {
    const payerType = doc.clientType;
    const contract = new Contract({
      ...doc,
      clientAddress: normalizeAddress(doc.clientAddress),
      // Schema's clientType is the event category, not the payer category.
      clientType: doc.eventType,
      paymentTerms: payerType === 'corporate' ? 'corporate_flexible' : 'wedding_standard'
    });
    await contract.save();
    created[doc.contractNumber] = contract;
    return contract;
  };

  // =================================================================
  // WALKTHROUGH CONTRACTS  (Advisor Brief section 05)
  // =================================================================

  // W1 - Sales: a fresh draft whose inventory sections are still unvalidated.
  await make({
    contractNumber: 'DEMO-W1-SALES',
    clientName: 'Amanda Robles 60th Birthday',
    clientEmail: 'amanda.robles@example.com',
    clientContact: '0917-555-0101',
    clientAddress: 'Lipa City, Batangas',
    clientType: 'individual',
    eventType: 'birthday',
    status: 'draft',
    currentDepartment: 'sales',
    bookingDate: day(-2),
    eventDate: day(96),
    venue: VENUES.casa,
    packageSelected: 'standard',
    totalPacks: 180,
    packagePrice: 1450,
    totalContractValue: money(180 * 1450),
    downPaymentPercent: 40,
    finalPaymentPercent: 60,
    reservationFeeAmount: 30000,
    paymentStatus: 'unpaid',
    menuDetails: menu([
      ['beef', 'Beef Caldereta', 180],
      ['chicken', 'Chicken Cordon Bleu', 180],
      ['pasta', 'Baked Macaroni', 180],
      ['dessert', 'Buko Pandan', 180]
    ]),
    creativeAssets: [creativeItem(CREATIVE.entrance, 1)],
    linenRequirements: [linenItem(LINEN.napkin, 180)],
    equipmentChecklist: [stockItem(STOCK.table, 18), stockItem(STOCK.fork, 180)],
    internalNotes: 'ADVISOR DEMO W1 - Sales. Draft awaiting department validation.'
  });

  // W1B - Sales, return leg: every department has validated, so the ball is
  // back with Sales to confirm the payment term.
  await make({
    contractNumber: 'DEMO-W1B-SALES-CONFIRM',
    clientName: 'Torres Corporate Anniversary',
    clientEmail: 'torres.anniversary@example.com',
    clientContact: '0917-555-0109',
    clientAddress: 'Sto. Tomas, Batangas',
    clientType: 'corporate',
    eventType: 'anniversary',
    status: 'draft',
    currentDepartment: 'sales',
    bookingDate: day(-6),
    eventDate: day(92),
    venue: VENUES.lima,
    packageSelected: 'premium',
    totalPacks: 260,
    packagePrice: 1600,
    totalContractValue: money(260 * 1600),
    downPaymentPercent: 40,
    finalPaymentPercent: 60,
    reservationFeeAmount: 30000,
    paymentStatus: 'unpaid',
    menuDetails: menu([
      ['beef', 'Beef Tenderloin Tips', 260],
      ['chicken', 'Chicken Marsala', 260],
      ['rice', 'Buttered Rice', 260],
      ['dessert', 'Blueberry Cheesecake', 260]
    ]),
    creativeAssets: [creativeItem(CREATIVE.entrance, 1)],
    linenRequirements: [linenItem(LINEN.napkin, 260)],
    equipmentChecklist: [stockItem(STOCK.table, 26)],
    // All three departments already signed off; payments is still open.
    sectionConfirmations: {
      creative: { confirmed: true },
      linen: { confirmed: true },
      stockroom: { confirmed: true },
      payments: { confirmed: false }
    },
    internalNotes: 'ADVISOR DEMO W1B - Sales return leg. All departments validated; Sales must confirm the payment term.'
  });

  // W2 - Inventory trio: a draft with a genuine shortage (Sash Red: 28 on hand).
  await make({
    contractNumber: 'DEMO-W2-VALIDATION',
    clientName: 'Villanueva-Santos Wedding',
    clientEmail: 'villanueva.santos@example.com',
    clientContact: '0917-555-0102',
    clientAddress: 'Taal, Batangas',
    clientType: 'individual',
    eventType: 'wedding',
    status: 'draft',
    currentDepartment: 'sales',
    bookingDate: day(-1),
    eventDate: day(88),
    venue: VENUES.balai,
    packageSelected: 'premium',
    totalPacks: 200,
    packagePrice: 1650,
    totalContractValue: money(200 * 1650),
    downPaymentPercent: 40,
    finalPaymentPercent: 60,
    reservationFeeAmount: 30000,
    paymentStatus: 'unpaid',
    menuDetails: menu([
      ['beef', 'Beef Salpicao', 200],
      ['fish', 'Fish Fillet with Lemon Butter', 200],
      ['vegetables', 'Chopsuey', 200],
      ['dessert', 'Leche Flan', 200]
    ]),
    creativeAssets: [creativeItem(CREATIVE.backdrop, 6)],
    // 60 requested against 28 on hand - the shortage and its blockers are real.
    linenRequirements: [linenItem(LINEN.sash, 60), linenItem(LINEN.napkin, 200)],
    equipmentChecklist: [stockItem(STOCK.table, 20)],
    internalNotes: 'ADVISOR DEMO W2 - Creative/Linen/Stockroom validation. Sash Red is short (60 needed, 28 on hand).'
  });

  // W3 - Accounting: signed contract waiting for review and down payment.
  await make({
    contractNumber: 'DEMO-W3-ACCOUNTING',
    clientName: 'Meridian Corp Annual Conference',
    clientEmail: 'events@meridiancorp.example.com',
    clientContact: '0917-555-0103',
    clientAddress: 'Makati City',
    clientType: 'corporate',
    eventType: 'corporate',
    status: 'submitted',
    currentDepartment: 'accounting',
    clientSigned: true,
    clientSignedAt: day(-1),
    submittedAt: day(-1),
    bookingDate: day(-3),
    eventDate: day(104),
    venue: VENUES.wtc,
    packageSelected: 'premium',
    totalPacks: 320,
    packagePrice: 1750,
    totalContractValue: money(320 * 1750),
    downPaymentPercent: 40,
    finalPaymentPercent: 60,
    reservationFeeAmount: 30000,
    paymentStatus: 'unpaid',
    menuDetails: menu([
      ['beef', 'Roast Beef with Mushroom Gravy', 320],
      ['chicken', 'Chicken Teriyaki', 320],
      ['rice', 'Java Rice', 320],
      ['dessert', 'Fruit Salad', 320]
    ]),
    creativeAssets: [creativeItem(CREATIVE.entrance, 1)],
    linenRequirements: [linenItem(LINEN.napkin, 320)],
    equipmentChecklist: [stockItem(STOCK.table, 32)],
    sectionConfirmations: {
      creative: { confirmed: true }, linen: { confirmed: true },
      stockroom: { confirmed: true }, payments: { confirmed: true }
    },
    internalNotes: 'ADVISOR DEMO W3 - Accounting. Signed, awaiting down payment + approval.'
  });

  // W4 - Kitchen: approved, event inside the 7-day preparation window.
  await make({
    contractNumber: 'DEMO-W4-KITCHEN',
    clientName: 'Delos Reyes Golden Anniversary',
    clientEmail: 'delosreyes.golden@example.com',
    clientContact: '0917-555-0104',
    clientAddress: 'Batangas City',
    clientType: 'individual',
    eventType: 'anniversary',
    status: 'approved',
    currentDepartment: 'all',
    clientSigned: true,
    approvedAt: day(-30),
    bookingDate: day(-120),
    eventDate: day(5),
    venue: VENUES.pontefino,
    packageSelected: 'premium',
    totalPacks: 220,
    packagePrice: 1650,
    totalContractValue: money(220 * 1650),
    downPaymentPercent: 40,
    finalPaymentPercent: 60,
    reservationFeeAmount: 30000,
    paymentStatus: 'paid',
    payments: [
      { amount: money(220 * 1650 * 0.4), date: day(-118), method: 'bank_transfer', reference: 'DEMO-W4-DP', status: 'completed' },
      { amount: money(220 * 1650 * 0.6), date: day(-45), method: 'bank_transfer', reference: 'DEMO-W4-FB', status: 'completed' }
    ],
    ingredientStatus: 'procured',
    // Per-dish client preferences print on the kitchen checklist.
    menuDetails: menu([
      ['beef', 'Beef Kaldereta', 220, false, 'Client asked for less chili - elderly guests.'],
      ['pork', 'Lechon Kawali', 220, false, 'Serve sauce on the side.'],
      ['chicken', 'Chicken Galantina', 220, false, ''],
      ['pasta', 'Spaghetti Bolognese', 220, false, 'Half portion, kids table.'],
      ['dessert', 'Mango Float', 220, false, '']
    ]),
    creativeAssets: [creativeItem(CREATIVE.rattan, 20, 'prepared')],
    linenRequirements: [linenItem(LINEN.napkin, 220, 'prepared')],
    equipmentChecklist: [stockItem(STOCK.table, 22, 'prepared'), stockItem(STOCK.chafing, 6, 'prepared')],
    internalNotes: 'ADVISOR DEMO W4 - Kitchen. Event in 5 days: prep window open, menu not yet confirmed.'
  });

  // W5 - Banquet: approved, staffing not yet assigned. 425 pax -> 17 waiters.
  await make({
    contractNumber: 'DEMO-W5-BANQUET',
    clientName: 'Batangas Medical Society Gala',
    clientEmail: 'gala@batmedsociety.example.com',
    clientContact: '0917-555-0105',
    clientAddress: 'Batangas City',
    clientType: 'corporate',
    eventType: 'corporate',
    status: 'approved',
    currentDepartment: 'all',
    clientSigned: true,
    approvedAt: day(-25),
    bookingDate: day(-100),
    eventDate: day(11),
    venue: VENUES.lima,
    packageSelected: 'premium',
    totalPacks: 425,
    packagePrice: 1700,
    totalContractValue: money(425 * 1700),
    downPaymentPercent: 40,
    finalPaymentPercent: 60,
    reservationFeeAmount: 30000,
    paymentStatus: 'paid',
    payments: [
      { amount: money(425 * 1700 * 0.4), date: day(-98), method: 'bank_transfer', reference: 'DEMO-W5-DP', status: 'completed' },
      { amount: money(425 * 1700 * 0.6), date: day(-40), method: 'bank_transfer', reference: 'DEMO-W5-FB', status: 'completed' }
    ],
    ingredientStatus: 'procured',
    menuDetails: menu([
      ['beef', 'Beef Stroganoff', 425, true],
      ['fish', 'Cream Dory Provencal', 425, true],
      ['rice', 'Steamed Rice', 425, true],
      ['dessert', 'Panna Cotta', 425, true]
    ]),
    creativeAssets: [creativeItem(CREATIVE.entrance, 1, 'prepared')],
    linenRequirements: [linenItem(LINEN.napkin, 425, 'prepared')],
    equipmentChecklist: [stockItem(STOCK.table, 43, 'prepared')],
    internalNotes: 'ADVISOR DEMO W5 - Banquet. 425 pax requires 17 service staff (1 per 25). None assigned yet.'
  });

  // W6 - Logistics: approved, no truck booked, full load manifest to show.
  await make({
    contractNumber: 'DEMO-W6-LOGISTICS',
    clientName: 'Aguilar Debut Celebration',
    clientEmail: 'aguilar.debut@example.com',
    clientContact: '0917-555-0106',
    clientAddress: 'Malvar, Batangas',
    clientType: 'individual',
    eventType: 'debut',
    status: 'approved',
    currentDepartment: 'all',
    clientSigned: true,
    approvedAt: day(-20),
    bookingDate: day(-95),
    eventDate: day(6),
    venue: VENUES.lima,
    packageSelected: 'premium',
    totalPacks: 260,
    packagePrice: 1650,
    totalContractValue: money(260 * 1650),
    downPaymentPercent: 40,
    finalPaymentPercent: 60,
    reservationFeeAmount: 30000,
    paymentStatus: 'paid',
    payments: [
      { amount: money(260 * 1650 * 0.4), date: day(-93), method: 'bank_transfer', reference: 'DEMO-W6-DP', status: 'completed' },
      { amount: money(260 * 1650 * 0.6), date: day(-38), method: 'bank_transfer', reference: 'DEMO-W6-FB', status: 'completed' }
    ],
    ingredientStatus: 'prepared',
    menuDetails: menu([
      ['beef', 'Beef Broccoli', 260, true],
      ['chicken', 'Buttered Chicken', 260, true],
      ['pasta', 'Carbonara', 260, true],
      ['dessert', 'Buko Salad', 260, true]
    ]),
    // A varied manifest so "what are we bringing" is visibly answered.
    creativeAssets: [creativeItem(CREATIVE.backdrop, 8, 'prepared'), creativeItem(CREATIVE.rattan, 30, 'prepared')],
    linenRequirements: [linenItem(LINEN.napkin, 260, 'prepared')],
    equipmentChecklist: [
      stockItem(STOCK.table, 26, 'prepared'),
      stockItem(STOCK.chafing, 10, 'prepared'),
      stockItem(STOCK.fork, 260, 'prepared')
    ],
    banquetAssignment: { assignments: staffTeam(11) },
    internalNotes: 'ADVISOR DEMO W6 - Logistics. Approved, no truck yet. Load manifest spans creative, linen, and stockroom.'
  });

  // W7 - Purchasing: approved contract that generated a procurement request.
  const w7 = await make({
    contractNumber: 'DEMO-W7-PURCHASING',
    clientName: 'San Jose Parish Centennial',
    clientEmail: 'parish.centennial@example.com',
    clientContact: '0917-555-0107',
    clientAddress: 'San Jose, Batangas',
    clientType: 'individual',
    eventType: 'other',
    status: 'approved',
    currentDepartment: 'all',
    clientSigned: true,
    approvedAt: day(-12),
    bookingDate: day(-80),
    eventDate: day(24),
    venue: VENUES.casa,
    packageSelected: 'standard',
    totalPacks: 240,
    packagePrice: 1400,
    totalContractValue: money(240 * 1400),
    downPaymentPercent: 40,
    finalPaymentPercent: 60,
    reservationFeeAmount: 30000,
    // Fully settled: this contract is here to demonstrate procurement, so it
    // must not be caught by the final-balance hold rule.
    paymentStatus: 'paid',
    payments: [
      { amount: money(240 * 1400 * 0.4), date: day(-78), method: 'bank_transfer', reference: 'DEMO-W7-DP', status: 'completed' },
      { amount: money(240 * 1400 * 0.6), date: day(-40), method: 'bank_transfer', reference: 'DEMO-W7-FB', status: 'completed' }
    ],
    menuDetails: menu([
      ['pork', 'Pork Menudo', 240, true],
      ['chicken', 'Chicken Afritada', 240, true],
      ['rice', 'Plain Rice', 240, true],
      ['dessert', 'Maja Blanca', 240, true]
    ]),
    creativeAssets: [creativeItem(CREATIVE.entrance, 1)],
    linenRequirements: [linenItem(LINEN.napkin, 240)],
    // 40 chafing dishes against 25 on hand - drives the shortage request below.
    equipmentChecklist: [stockItem(STOCK.chafing, 40), stockItem(STOCK.table, 24)],
    internalNotes: 'ADVISOR DEMO W7 - Purchasing. Chafing dish shortage raised a procurement request.'
  });

  // W8 - Admin: every department finished. Fires "All departments ready".
  await make({
    contractNumber: 'DEMO-W8-ADMIN',
    clientName: 'Mercado Silver Wedding Anniversary',
    clientEmail: 'mercado.silver@example.com',
    clientContact: '0917-555-0108',
    clientAddress: 'Lipa City, Batangas',
    clientType: 'individual',
    eventType: 'anniversary',
    status: 'approved',
    currentDepartment: 'all',
    clientSigned: true,
    approvedAt: day(-18),
    bookingDate: day(-90),
    eventDate: day(9),
    venue: VENUES.pontefino,
    packageSelected: 'premium',
    totalPacks: 200,
    packagePrice: 1700,
    totalContractValue: money(200 * 1700),
    downPaymentPercent: 40,
    finalPaymentPercent: 60,
    reservationFeeAmount: 30000,
    paymentStatus: 'paid',
    payments: [
      { amount: money(200 * 1700 * 0.4), date: day(-88), method: 'bank_transfer', reference: 'DEMO-W8-DP', status: 'completed' },
      { amount: money(200 * 1700 * 0.6), date: day(-35), method: 'bank_transfer', reference: 'DEMO-W8-FB', status: 'completed' }
    ],
    ingredientStatus: 'prepared',
    menuDetails: menu([
      ['beef', 'Beef Morcon', 200, true],
      ['fish', 'Baked Salmon', 200, true],
      ['vegetables', 'Buttered Vegetables', 200, true],
      ['dessert', 'Tiramisu', 200, true]
    ]),
    creativeAssets: [creativeItem(CREATIVE.rattan, 24, 'prepared')],
    linenRequirements: [linenItem(LINEN.napkin, 200, 'prepared')],
    equipmentChecklist: [stockItem(STOCK.table, 20, 'prepared')],
    logisticsAssignment: cargoTruck
      ? { truck: cargoTruck._id, driver: anyDriver ? anyDriver._id : null, assignmentStatus: 'scheduled' }
      : { assignmentStatus: 'pending' },
    banquetAssignment: { assignments: staffTeam(8) },
    internalNotes: 'ADVISOR DEMO W8 - Admin. Every department complete; readiness alert fired.'
  });

  // =================================================================
  // TRACEABILITY CONTRACTS  (Advisor Brief section 06)
  // =================================================================

  // R1 - PHP 30,000 non-refundable reservation fee inside the down payment.
  await make({
    contractNumber: 'DEMO-R1-RESERVATION',
    clientName: 'Bautista Wedding Reception',
    clientEmail: 'bautista.wedding@example.com',
    clientContact: '0917-555-0201',
    clientAddress: 'Taal, Batangas',
    clientType: 'individual',
    eventType: 'wedding',
    status: 'approved',
    currentDepartment: 'all',
    clientSigned: true,
    approvedAt: day(-40),
    bookingDate: day(-50),
    eventDate: day(110),
    venue: VENUES.balai,
    packageSelected: 'premium',
    totalPacks: 200,
    packagePrice: 1500,
    totalContractValue: 300000,
    downPaymentPercent: 40,
    finalPaymentPercent: 60,
    reservationFeeAmount: 30000,
    paymentStatus: 'partially_paid',
    // The 30,000 reservation fee is the first slice of the 120,000 down payment.
    payments: [
      { amount: 30000, date: day(-50), method: 'cash', reference: 'DEMO-R1-RESV', receiptNumber: 'OR-DEMO-0001', status: 'completed', notes: 'Non-refundable reservation fee (Appendix H)' },
      { amount: 90000, date: day(-44), method: 'bank_transfer', reference: 'DEMO-R1-DP', receiptNumber: 'OR-DEMO-0002', status: 'completed', notes: 'Balance of the 40% down payment' }
    ],
    menuDetails: menu([['beef', 'Beef Belly Steak', 200, true], ['chicken', 'Chicken Roulade', 200, true], ['dessert', 'Sans Rival', 200, true]]),
    creativeAssets: [creativeItem(CREATIVE.entrance, 1)],
    linenRequirements: [linenItem(LINEN.napkin, 200)],
    equipmentChecklist: [stockItem(STOCK.table, 20)],
    internalNotes: 'ADVISOR DEMO R1 - Reservation fee. 30,000 recorded inside the 120,000 down payment.'
  });

  // R2 - Down payment missed, 30-day aging window expired -> uncollectible.
  await make({
    contractNumber: 'DEMO-R2-AGING',
    clientName: 'Northgate Realty Client Night',
    clientEmail: 'events@northgaterealty.example.com',
    clientContact: '0917-555-0202',
    clientAddress: 'Sto. Tomas, Batangas',
    clientType: 'corporate',
    eventType: 'corporate',
    status: 'accounting_review',
    currentDepartment: 'accounting',
    clientSigned: true,
    submittedAt: day(-108),
    bookingDate: day(-110),
    eventDate: day(200),
    venue: VENUES.lima,
    packageSelected: 'premium',
    totalPacks: 220,
    packagePrice: 1600,
    totalContractValue: 352000,
    downPaymentPercent: 40,
    finalPaymentPercent: 60,
    reservationFeeAmount: 30000,
    paymentStatus: 'unpaid',
    payments: [],
    menuDetails: menu([['beef', 'Beef Pepper Steak', 220, false], ['fish', 'Fish Fillet Tartar', 220, false]]),
    creativeAssets: [creativeItem(CREATIVE.entrance, 1)],
    linenRequirements: [linenItem(LINEN.napkin, 220)],
    equipmentChecklist: [stockItem(STOCK.table, 22)],
    internalNotes: 'ADVISOR DEMO R2 - Aging. Booked 110 days ago, nothing collected: past the 30-day aging window.'
  });

  // R3 - Final balance unpaid past event-minus-2-months -> automatic hold.
  await make({
    contractNumber: 'DEMO-R3-HOLD',
    clientName: 'Ramirez Family Reunion',
    clientEmail: 'ramirez.reunion@example.com',
    clientContact: '0917-555-0203',
    clientAddress: 'Batangas City',
    clientType: 'individual',
    eventType: 'other',
    status: 'approved',
    currentDepartment: 'all',
    clientSigned: true,
    approvedAt: day(-95),
    bookingDate: day(-100),
    eventDate: day(45),
    venue: VENUES.casa,
    packageSelected: 'premium',
    totalPacks: 280,
    packagePrice: 1650,
    totalContractValue: 462000,
    downPaymentPercent: 40,
    finalPaymentPercent: 60,
    reservationFeeAmount: 30000,
    paymentStatus: 'partially_paid',
    // 40% collected on time; the 60% never arrived.
    payments: [
      { amount: 184800, date: day(-96), method: 'bank_transfer', reference: 'DEMO-R3-DP', status: 'completed' }
    ],
    menuDetails: menu([['pork', 'Crispy Pata', 280, true], ['chicken', 'Chicken Inasal', 280, true], ['rice', 'Garlic Rice', 280, true]]),
    creativeAssets: [creativeItem(CREATIVE.rattan, 20)],
    linenRequirements: [linenItem(LINEN.napkin, 280)],
    equipmentChecklist: [stockItem(STOCK.table, 28)],
    internalNotes: 'ADVISOR DEMO R3 - Auto-hold. 60% balance of 277,200 uncollected past the deadline.'
  });

  // R4 - Payment may never exceed the remaining balance. Balance is exactly 60.00.
  await make({
    contractNumber: 'DEMO-R4-OVERPAYMENT',
    clientName: 'Lorenzo Corporate Christmas Party',
    clientEmail: 'lorenzo.christmas@example.com',
    clientContact: '0917-555-0204',
    clientAddress: 'Makati City',
    clientType: 'corporate',
    eventType: 'corporate',
    status: 'approved',
    currentDepartment: 'all',
    clientSigned: true,
    approvedAt: day(-15),
    bookingDate: day(-20),
    eventDate: day(120),
    venue: VENUES.wtc,
    packageSelected: 'premium',
    totalPacks: 170,
    packagePrice: 1542.02,
    totalContractValue: 262144.33,
    downPaymentPercent: 40,
    finalPaymentPercent: 60,
    reservationFeeAmount: 30000,
    paymentStatus: 'partially_paid',
    // 104,857.73 + 157,226.60 = 262,084.33  ->  remaining balance exactly 60.00
    payments: [
      { amount: 104857.73, date: day(-18), method: 'bank_transfer', reference: 'DEMO-R4-DP', status: 'completed' },
      { amount: 157226.60, date: day(-6), method: 'bank_transfer', reference: 'DEMO-R4-FB', status: 'completed' }
    ],
    menuDetails: menu([['beef', 'Beef Wellington', 170, true], ['fish', 'Grilled Tanigue', 170, true], ['dessert', 'Chocolate Mousse', 170, true]]),
    creativeAssets: [creativeItem(CREATIVE.entrance, 1)],
    linenRequirements: [linenItem(LINEN.napkin, 170)],
    equipmentChecklist: [stockItem(STOCK.table, 17)],
    internalNotes: 'ADVISOR DEMO R4 - Overpayment guard. Remaining balance is exactly PHP 60.00; 60.01 is rejected, 60.00 closes it.'
  });

  // R5 - 7-day material freeze: items already prepared, event 4 days away.
  await make({
    contractNumber: 'DEMO-R5-FREEZE',
    clientName: 'Castillo Christening Luncheon',
    clientEmail: 'castillo.christening@example.com',
    clientContact: '0917-555-0205',
    clientAddress: 'Lipa City, Batangas',
    clientType: 'individual',
    eventType: 'other',
    status: 'approved',
    currentDepartment: 'all',
    clientSigned: true,
    approvedAt: day(-35),
    bookingDate: day(-110),
    eventDate: day(4),
    venue: VENUES.casa,
    packageSelected: 'standard',
    totalPacks: 150,
    packagePrice: 1400,
    totalContractValue: 210000,
    downPaymentPercent: 40,
    finalPaymentPercent: 60,
    reservationFeeAmount: 30000,
    paymentStatus: 'paid',
    payments: [
      { amount: 84000, date: day(-108), method: 'bank_transfer', reference: 'DEMO-R5-DP', status: 'completed' },
      { amount: 126000, date: day(-50), method: 'bank_transfer', reference: 'DEMO-R5-FB', status: 'completed' }
    ],
    ingredientStatus: 'procured',
    menuDetails: menu([['pork', 'Pork Hamonado', 150, true], ['chicken', 'Chicken Pastel', 150, true], ['dessert', 'Ube Halaya', 150, true]]),
    // Everything is prepared, so attempting to revert any item hits the freeze.
    creativeAssets: [creativeItem(CREATIVE.rattan, 15, 'prepared')],
    linenRequirements: [linenItem(LINEN.napkin, 150, 'prepared')],
    equipmentChecklist: [stockItem(STOCK.table, 15, 'prepared'), stockItem(STOCK.fork, 150, 'prepared')],
    internalNotes: 'ADVISOR DEMO R5 - Material freeze. Event in 4 days; prepared items are locked to this event.'
  });

  // R6 - 3-day transport lead time: event in 2 days, nothing booked.
  await make({
    contractNumber: 'DEMO-R6-TRANSPORT',
    clientName: 'Ferrer Retirement Dinner',
    clientEmail: 'ferrer.retirement@example.com',
    clientContact: '0917-555-0206',
    clientAddress: 'Batangas City',
    clientType: 'individual',
    eventType: 'other',
    status: 'approved',
    currentDepartment: 'all',
    clientSigned: true,
    approvedAt: day(-30),
    bookingDate: day(-105),
    eventDate: day(2),
    venue: VENUES.pontefino,
    packageSelected: 'standard',
    totalPacks: 140,
    packagePrice: 1400,
    totalContractValue: 196000,
    downPaymentPercent: 40,
    finalPaymentPercent: 60,
    reservationFeeAmount: 30000,
    paymentStatus: 'paid',
    payments: [
      { amount: 78400, date: day(-103), method: 'bank_transfer', reference: 'DEMO-R6-DP', status: 'completed' },
      { amount: 117600, date: day(-48), method: 'bank_transfer', reference: 'DEMO-R6-FB', status: 'completed' }
    ],
    ingredientStatus: 'prepared',
    menuDetails: menu([['beef', 'Beef Mechado', 140, true], ['chicken', 'Chicken Curry', 140, true], ['dessert', 'Halo-Halo', 140, true]]),
    creativeAssets: [creativeItem(CREATIVE.rattan, 12, 'prepared')],
    linenRequirements: [linenItem(LINEN.napkin, 140, 'prepared')],
    equipmentChecklist: [stockItem(STOCK.table, 14, 'prepared')],
    // Staff assigned but no vehicle at all - triggers both lead-time warnings.
    banquetAssignment: { assignments: staffTeam(6) },
    internalNotes: 'ADVISOR DEMO R6 - Transport lead time. Event in 2 days with no inventory or staff transport booked.'
  });

  // R7 - 1 waiter per 25 guests. 425 pax -> 17 service staff required.
  await make({
    contractNumber: 'DEMO-R7-WAITER-RATIO',
    clientName: 'Provincial Capitol Awards Night',
    clientEmail: 'capitol.awards@example.com',
    clientContact: '0917-555-0207',
    clientAddress: 'Batangas City',
    clientType: 'corporate',
    eventType: 'corporate',
    status: 'approved',
    currentDepartment: 'all',
    clientSigned: true,
    approvedAt: day(-22),
    bookingDate: day(-85),
    eventDate: day(14),
    venue: VENUES.wtc,
    packageSelected: 'premium',
    // 525 packs - 25 non-seated = 500 seated guests -> exactly 20 service staff.
    totalPacks: 525,
    packagePrice: 1700,
    totalContractValue: 892500,
    downPaymentPercent: 40,
    finalPaymentPercent: 60,
    reservationFeeAmount: 30000,
    paymentStatus: 'paid',
    payments: [
      { amount: 357000, date: day(-83), method: 'bank_transfer', reference: 'DEMO-R7-DP', status: 'completed' },
      { amount: 535500, date: day(-30), method: 'bank_transfer', reference: 'DEMO-R7-FB', status: 'completed' }
    ],
    ingredientStatus: 'procured',
    menuDetails: menu([['beef', 'Beef Bourguignon', 525, true], ['fish', 'Fish en Papillote', 525, true], ['rice', 'Herbed Rice', 525, true], ['dessert', 'Creme Brulee', 525, true]]),
    creativeAssets: [creativeItem(CREATIVE.entrance, 1, 'prepared')],
    linenRequirements: [linenItem(LINEN.napkin, 525, 'prepared')],
    equipmentChecklist: [stockItem(STOCK.table, 53, 'prepared')],
    // Deliberately understaffed at 6 of the required 20 so the gap is visible.
    banquetAssignment: { assignments: staffTeam(6) },
    internalNotes: 'ADVISOR DEMO R7 - Waiter ratio. 500 seated guests require 20 service staff; only 6 assigned.'
  });

  // R8 - Staff transport requires a driver on every vehicle.
  await make({
    contractNumber: 'DEMO-R8-STAFF-DRIVER',
    clientName: 'Alvarez Beach Wedding',
    clientEmail: 'alvarez.beach@example.com',
    clientContact: '0917-555-0208',
    clientAddress: 'Nasugbu, Batangas',
    clientType: 'individual',
    eventType: 'wedding',
    status: 'approved',
    currentDepartment: 'all',
    clientSigned: true,
    approvedAt: day(-26),
    bookingDate: day(-92),
    eventDate: day(8),
    venue: VENUES.balai,
    packageSelected: 'premium',
    totalPacks: 300,
    packagePrice: 1650,
    totalContractValue: 495000,
    downPaymentPercent: 40,
    finalPaymentPercent: 60,
    reservationFeeAmount: 30000,
    paymentStatus: 'paid',
    payments: [
      { amount: 198000, date: day(-90), method: 'bank_transfer', reference: 'DEMO-R8-DP', status: 'completed' },
      { amount: 297000, date: day(-33), method: 'bank_transfer', reference: 'DEMO-R8-FB', status: 'completed' }
    ],
    ingredientStatus: 'procured',
    menuDetails: menu([['fish', 'Grilled Blue Marlin', 300, true], ['chicken', 'Lemon Herb Chicken', 300, true], ['dessert', 'Mango Panna Cotta', 300, true]]),
    creativeAssets: [creativeItem(CREATIVE.rattan, 25, 'prepared')],
    linenRequirements: [linenItem(LINEN.napkin, 300, 'prepared')],
    equipmentChecklist: [stockItem(STOCK.table, 30, 'prepared')],
    // 13 staff need transport to Nasugbu; no vehicle booked yet.
    banquetAssignment: { assignments: staffTeam(12) },
    internalNotes: 'ADVISOR DEMO R8 - Staff transport driver rule. 13 staff need transport; booking a vehicle without a driver is rejected.'
  });

  // R9 - 7-day standard requisition lead time (emergency requisition is the escape hatch).
  const r9 = await make({
    contractNumber: 'DEMO-R9-LEAD-TIME',
    clientName: 'Gonzales Corporate Townhall',
    clientEmail: 'gonzales.townhall@example.com',
    clientContact: '0917-555-0209',
    clientAddress: 'Sto. Tomas, Batangas',
    clientType: 'corporate',
    eventType: 'corporate',
    status: 'approved',
    currentDepartment: 'all',
    clientSigned: true,
    approvedAt: day(-10),
    bookingDate: day(-70),
    eventDate: day(5),
    venue: VENUES.pontefino,
    packageSelected: 'standard',
    totalPacks: 160,
    packagePrice: 1400,
    totalContractValue: 224000,
    downPaymentPercent: 40,
    finalPaymentPercent: 60,
    reservationFeeAmount: 30000,
    paymentStatus: 'paid',
    payments: [
      { amount: 89600, date: day(-68), method: 'bank_transfer', reference: 'DEMO-R9-DP', status: 'completed' },
      { amount: 134400, date: day(-20), method: 'bank_transfer', reference: 'DEMO-R9-FB', status: 'completed' }
    ],
    ingredientStatus: 'procured',
    menuDetails: menu([['pork', 'Pork Bistek', 160, true], ['chicken', 'Chicken Adobo', 160, true], ['dessert', 'Puto Bumbong', 160, true]]),
    creativeAssets: [creativeItem(CREATIVE.entrance, 1)],
    linenRequirements: [linenItem(LINEN.napkin, 160)],
    equipmentChecklist: [stockItem(STOCK.chafing, 30), stockItem(STOCK.table, 16)],
    internalNotes: 'ADVISOR DEMO R9 - Requisition lead time. Event in 5 days: a standard requisition is rejected, emergency is allowed.'
  });

  // R10 - Package tier caps the menu. Basic package already at its 3-main limit.
  await make({
    contractNumber: 'DEMO-R10-PACKAGE-CAP',
    clientName: 'Perez Simple Birthday Lunch',
    clientEmail: 'perez.birthday@example.com',
    clientContact: '0917-555-0210',
    clientAddress: 'Lipa City, Batangas',
    clientType: 'individual',
    eventType: 'birthday',
    status: 'draft',
    currentDepartment: 'sales',
    bookingDate: day(-1),
    eventDate: day(70),
    venue: VENUES.casa,
    packageSelected: 'basic',
    totalPacks: 120,
    packagePrice: 1200,
    totalContractValue: 144000,
    downPaymentPercent: 40,
    finalPaymentPercent: 60,
    reservationFeeAmount: 30000,
    paymentStatus: 'unpaid',
    // Basic allows 3 mains / 2 sides / 1 dessert / 1 drink - already at the cap.
    menuDetails: menu([
      ['beef', 'Beef Tapa', 120],
      ['pork', 'Pork Sisig', 120],
      ['chicken', 'Fried Chicken', 120],
      ['rice', 'Steamed Rice', 120],
      ['vegetables', 'Pinakbet', 120],
      ['dessert', 'Leche Flan', 120]
    ]),
    creativeAssets: [creativeItem(CREATIVE.rattan, 10)],
    linenRequirements: [linenItem(LINEN.napkin, 120)],
    equipmentChecklist: [stockItem(STOCK.table, 12)],
    internalNotes: 'ADVISOR DEMO R10 - Package cap. Basic package is at its 3-main limit; adding a 4th main is rejected.'
  });

  // R11 - Same-day stock reservation. Two events compete for 25 chafing dishes.
  const sameDay = day(21);
  await make({
    contractNumber: 'DEMO-R11-SAMEDAY-A',
    clientName: 'Herrera Wedding (holds the stock)',
    clientEmail: 'herrera.wedding@example.com',
    clientContact: '0917-555-0211',
    clientAddress: 'Taal, Batangas',
    clientType: 'individual',
    eventType: 'wedding',
    status: 'approved',
    currentDepartment: 'all',
    clientSigned: true,
    approvedAt: day(-14),
    bookingDate: day(-60),
    eventDate: sameDay,
    venue: VENUES.balai,
    packageSelected: 'premium',
    totalPacks: 240,
    packagePrice: 1650,
    totalContractValue: 396000,
    downPaymentPercent: 40,
    finalPaymentPercent: 60,
    reservationFeeAmount: 30000,
    // Fully settled so the same-day reservation demo is not confused by a hold.
    paymentStatus: 'paid',
    payments: [
      { amount: 158400, date: day(-58), method: 'bank_transfer', reference: 'DEMO-R11A-DP', status: 'completed' },
      { amount: 237600, date: day(-30), method: 'bank_transfer', reference: 'DEMO-R11A-FB', status: 'completed' }
    ],
    menuDetails: menu([['beef', 'Beef Caldereta', 240, true], ['chicken', 'Chicken Cordon Bleu', 240, true], ['dessert', 'Buko Pandan', 240, true]]),
    creativeAssets: [creativeItem(CREATIVE.entrance, 1)],
    linenRequirements: [linenItem(LINEN.napkin, 240)],
    // Reserves 20 of the 25 chafing dishes for this date.
    equipmentChecklist: [stockItem(STOCK.chafing, 20), stockItem(STOCK.table, 24)],
    internalNotes: 'ADVISOR DEMO R11-A - Same-day reservation. Holds 20 of 25 chafing dishes on this event date.'
  });

  await make({
    contractNumber: 'DEMO-R11-SAMEDAY-B',
    clientName: 'Domingo Debut (blocked by the conflict)',
    clientEmail: 'domingo.debut@example.com',
    clientContact: '0917-555-0212',
    clientAddress: 'Batangas City',
    clientType: 'individual',
    eventType: 'debut',
    status: 'draft',
    currentDepartment: 'sales',
    bookingDate: day(-1),
    eventDate: sameDay,
    venue: VENUES.pontefino,
    packageSelected: 'premium',
    totalPacks: 180,
    packagePrice: 1650,
    totalContractValue: 297000,
    downPaymentPercent: 40,
    finalPaymentPercent: 60,
    reservationFeeAmount: 30000,
    paymentStatus: 'unpaid',
    menuDetails: menu([['pork', 'Lechon Belly', 180], ['fish', 'Fish Fillet', 180], ['dessert', 'Mango Float', 180]]),
    creativeAssets: [creativeItem(CREATIVE.rattan, 15)],
    linenRequirements: [linenItem(LINEN.napkin, 180)],
    // Only 5 remain free on that date, so this request cannot be satisfied.
    equipmentChecklist: [stockItem(STOCK.chafing, 12), stockItem(STOCK.table, 18)],
    internalNotes: 'ADVISOR DEMO R11-B - Same-day conflict. Needs 12 chafing dishes but only 5 are free on that date.'
  });

  console.log(`Created ${Object.keys(created).length} demo contracts.`);

  // =================================================================
  // PROCUREMENT REQUESTS
  // =================================================================

  const procurementRequests = [];

  if (purchasingUser && stockroomUser) {
    // W7: a live shortage request sitting in the purchasing queue.
    const shortage = new ProcurementRequest({
      status: 'requested',
      department: 'stockroom',
      requestType: 'purchase',
      requisitionType: 'purchase_requisition',
      source: 'contract_shortage',
      sourceSection: 'equipmentChecklist',
      contract: w7._id,
      eventDate: w7.eventDate,
      neededBy: day(17),
      inventoryModel: 'StockroomInventory',
      inventoryItem: STOCK.chafing.itemId,
      itemName: STOCK.chafing.item,
      itemCode: STOCK.chafing.itemCode,
      itemCategory: STOCK.chafing.category,
      requestedQuantity: 15,
      shortageQuantity: 15,
      requestReason: 'Contract requires 40 chafing dishes; only 25 are on hand for the event date.',
      requestNotes: 'ADVISOR-DEMO W7 - awaiting purchasing to source a supplier and prepare the budget request.',
      sla: { leadTimeDays: 7, status: 'on_track' },
      createdBy: stockroomUser._id,
      updatedBy: stockroomUser._id
    });
    await shortage.save();
    procurementRequests.push(shortage);

    // R9: the emergency requisition that a rush event legitimately requires.
    const emergency = new ProcurementRequest({
      status: 'requested',
      department: 'stockroom',
      requestType: 'rental',
      requisitionType: 'emergency_requisition',
      source: 'contract_shortage',
      sourceSection: 'equipmentChecklist',
      contract: r9._id,
      eventDate: r9.eventDate,
      neededBy: day(3),
      inventoryModel: 'StockroomInventory',
      inventoryItem: STOCK.chafing.itemId,
      itemName: STOCK.chafing.item,
      itemCode: STOCK.chafing.itemCode,
      itemCategory: STOCK.chafing.category,
      requestedQuantity: 8,
      shortageQuantity: 8,
      requestReason: 'Event is 5 days away and 30 chafing dishes are required. Filed as an emergency requisition because standard lead time cannot be met.',
      requestNotes: 'ADVISOR-DEMO R9 - contrasts with a standard requisition, which the system rejects inside 7 days.',
      sla: { leadTimeDays: 7, status: 'rush' },
      createdBy: stockroomUser._id,
      updatedBy: stockroomUser._id
    });
    await emergency.save();
    procurementRequests.push(emergency);
  }

  console.log(`Created ${procurementRequests.length} demo procurement request(s).`);

  // =================================================================
  // HANDOFF NOTIFICATIONS
  // Wording, action URLs, and priorities mirror routes/contracts.js and
  // routes/procurementRequests.js exactly.
  // =================================================================

  const rows = [];
  const pushFor = (roles, payload) => {
    roles.forEach((role) => {
      byRole(role).forEach((user) => {
        rows.push({ recipient: user._id, isRead: false, ...payload });
      });
    });
  };

  const contractUrl = (contract, tab = 'details') => `/contracts/${contract._id}?tab=${tab}`;

  const notifyDepartments = (contract, departments, payload) => {
    [...new Set(departments)].forEach((department) => {
      pushFor(DEPARTMENT_ROLES[department] || [], {
        ...payload,
        contract: contract._id,
        department,
        actionUrl: contractUrl(contract, SECTION_TABS[department] || 'details')
      });
    });
  };

  const C = created;

  // --- W1: Sales draft -> inventory departments must validate.
  notifyDepartments(C['DEMO-W1-SALES'], ['creative', 'linen', 'stockroom'], {
    type: 'task_assigned',
    title: `Draft inventory validation needed for ${C['DEMO-W1-SALES'].contractNumber}`,
    message: `${C['DEMO-W1-SALES'].clientName} has a new draft contract for ${formatDateLabel(C['DEMO-W1-SALES'].eventDate)}. Review and confirm your department inventory items before Sales can finalize the payment arrangement.`,
    priority: 'high',
    actionLabel: 'Validate inventory'
  });

  // --- W1B: departments finished validating, so the ball returns to Sales.
  pushFor(['sales'], {
    type: 'task_assigned',
    title: `Inventory validation complete for ${C['DEMO-W1B-SALES-CONFIRM'].contractNumber}`,
    message: 'All required inventory departments have confirmed their sections. Sales can now confirm the payment arrangement before sending the contract for signature.',
    contract: C['DEMO-W1B-SALES-CONFIRM']._id,
    department: 'sales',
    priority: 'high',
    actionUrl: contractUrl(C['DEMO-W1B-SALES-CONFIRM'], 'payments'),
    actionLabel: 'Confirm payment term'
  });

  // --- W2: the shortage draft.
  notifyDepartments(C['DEMO-W2-VALIDATION'], ['creative', 'linen', 'stockroom'], {
    type: 'task_assigned',
    title: `Draft inventory validation needed for ${C['DEMO-W2-VALIDATION'].contractNumber}`,
    message: `${C['DEMO-W2-VALIDATION'].clientName} has a new draft contract for ${formatDateLabel(C['DEMO-W2-VALIDATION'].eventDate)}. Review and confirm your department inventory items before Sales can finalize the payment arrangement.`,
    priority: 'high',
    actionLabel: 'Validate inventory'
  });

  // --- R10 and R11-B are drafts too, so their departments are prompted as well.
  notifyDepartments(C['DEMO-R10-PACKAGE-CAP'], ['creative', 'linen', 'stockroom'], {
    type: 'task_assigned',
    title: `Draft inventory validation needed for ${C['DEMO-R10-PACKAGE-CAP'].contractNumber}`,
    message: `${C['DEMO-R10-PACKAGE-CAP'].clientName} has a new draft contract for ${formatDateLabel(C['DEMO-R10-PACKAGE-CAP'].eventDate)}. Review and confirm your department inventory items before Sales can finalize the payment arrangement.`,
    priority: 'medium',
    actionLabel: 'Validate inventory'
  });

  notifyDepartments(C['DEMO-R11-SAMEDAY-B'], ['creative', 'linen', 'stockroom'], {
    type: 'task_assigned',
    title: `Draft inventory validation needed for ${C['DEMO-R11-SAMEDAY-B'].contractNumber}`,
    message: `${C['DEMO-R11-SAMEDAY-B'].clientName} has a new draft contract for ${formatDateLabel(C['DEMO-R11-SAMEDAY-B'].eventDate)}. Review and confirm your department inventory items before Sales can finalize the payment arrangement.`,
    priority: 'high',
    actionLabel: 'Validate inventory'
  });

  // --- W3: signed contract handed to Accounting.
  pushFor(['accounting'], {
    type: 'contract_submitted',
    title: `Signed contract ready for Accounting: ${C['DEMO-W3-ACCOUNTING'].contractNumber}`,
    message: `${C['DEMO-W3-ACCOUNTING'].clientName} signed the contract for ${formatDateLabel(C['DEMO-W3-ACCOUNTING'].eventDate)}. Review the payment arrangement, collect the down payment, and approve the contract to release it to the operating departments.`,
    contract: C['DEMO-W3-ACCOUNTING']._id,
    department: 'accounting',
    priority: 'high',
    actionUrl: contractUrl(C['DEMO-W3-ACCOUNTING'], 'payments'),
    actionLabel: 'Review payment'
  });

  // --- Approval fan-out for every approved demo contract.
  const PREP_MESSAGES = {
    kitchen: (c) => `${c.clientName}'s event on ${formatDateLabel(c.eventDate)} is approved. Review and confirm the menu checklist now. You'll get a reminder about two weeks out to start sourcing ingredients, and another once the event is within 7 days when you can begin preparing the food.`,
    banquet: () => 'Banquet can now prepare the staffing plan and print the staff attendance sheet.',
    logistics: () => 'Logistics can now assign the truck, driver, dispatch details, and post-event transport updates.',
    creative: () => 'Creative can now prepare the assigned decor items and update the inventory checklist.',
    linen: () => 'Linen can now prepare the assigned linen items and update the inventory checklist.',
    stockroom: () => 'Stockroom can now prepare the assigned equipment and supplies and update the inventory checklist.'
  };

  const approvedForFanOut = [
    'DEMO-W4-KITCHEN', 'DEMO-W5-BANQUET', 'DEMO-W6-LOGISTICS', 'DEMO-W7-PURCHASING',
    'DEMO-R5-FREEZE', 'DEMO-R6-TRANSPORT', 'DEMO-R7-WAITER-RATIO', 'DEMO-R8-STAFF-DRIVER'
  ];

  approvedForFanOut.forEach((key) => {
    const contract = C[key];
    const departments = ['kitchen', 'banquet', 'logistics'];
    if ((contract.creativeAssets || []).length) departments.push('creative');
    if ((contract.linenRequirements || []).length) departments.push('linen');
    if ((contract.equipmentChecklist || []).length) departments.push('stockroom');

    departments.forEach((department) => {
      pushFor(DEPARTMENT_ROLES[department] || [], {
        type: 'contract_approved',
        title: department === 'kitchen'
          ? `Approved event - review menu for ${contract.contractNumber}`
          : `Approved event ready for ${department}: ${contract.contractNumber}`,
        message: (PREP_MESSAGES[department] || (() => `${contract.clientName}'s approved event is ready for your department action.`))(contract),
        contract: contract._id,
        department,
        priority: 'high',
        actionUrl: contractUrl(contract, SECTION_TABS[department] || 'details'),
        actionLabel: 'Open task'
      });
    });
  });

  // --- W8: every department finished.
  pushFor(['sales', 'accounting', 'admin'], {
    type: 'task_assigned',
    title: `All departments ready for ${C['DEMO-W8-ADMIN'].contractNumber}`,
    message: `Kitchen, logistics, banquet, and every inventory department finished preparing ${C['DEMO-W8-ADMIN'].clientName}'s event on ${formatDateLabel(C['DEMO-W8-ADMIN'].eventDate)}. The event is ready for execution.`,
    contract: C['DEMO-W8-ADMIN']._id,
    department: 'sales',
    priority: 'high',
    actionUrl: contractUrl(C['DEMO-W8-ADMIN'], 'details'),
    actionLabel: 'View readiness'
  });

  // --- Procurement handoffs.
  procurementRequests.forEach((request) => {
    pushFor(['purchasing', 'admin'], {
      type: 'task_assigned',
      title: 'New Stockroom procurement request',
      message: `${request.requestNumber} needs ${request.requestedQuantity} ${request.itemName} by ${formatDateLabel(request.neededBy)}.`,
      contract: request.contract || undefined,
      procurementRequest: request._id,
      priority: 'high',
      actionUrl: `/purchasing?tab=queue&request=${request._id}`,
      actionLabel: 'Prepare report',
      department: 'purchasing'
    });
  });

  await Notification.insertMany(rows);
  console.log(`Wrote ${rows.length} handoff notification(s).`);

  // =================================================================
  // RUN THE REAL SWEEPS
  // The rule-driven reminders (aging, auto-hold, kitchen prep windows,
  // post-event checks) are produced by the production code paths, not
  // written by hand here.
  // =================================================================

  const { runPaymentComplianceSweep } = require('./paymentCompliance');
  const { runKitchenPrepSweep } = require('./kitchenPrepNotifications');
  const { runTransportLeadTimeSweep } = require('./transportLeadTimeNotifications');

  const paymentSummary = await runPaymentComplianceSweep();
  console.log(`Payment sweep: checked ${paymentSummary.checked}, notified ${paymentSummary.notified}, held [${(paymentSummary.held || []).join(', ')}], released [${(paymentSummary.released || []).join(', ')}]`);

  const kitchenSummary = await runKitchenPrepSweep();
  console.log(`Kitchen sweep: checked ${kitchenSummary.checked}, notified ${kitchenSummary.notified}`);

  const transportSummary = await runTransportLeadTimeSweep();
  console.log(`Transport lead-time sweep: checked ${transportSummary.checked}, notified ${transportSummary.notified}`);

  // =================================================================
  // REPORT
  // =================================================================

  const total = await Notification.countDocuments();
  console.log(`\nTotal notifications now: ${total}`);
  console.log('\nPer recipient role:');
  const perRole = await Notification.aggregate([
    { $lookup: { from: 'users', localField: 'recipient', foreignField: '_id', as: 'u' } },
    { $unwind: '$u' },
    { $group: { _id: '$u.role', n: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  perRole.forEach((r) => console.log(`  ${String(r._id).padEnd(20)} ${r.n}`));

  const demoIds = Object.values(created).map((c) => c._id);
  const demoCount = await Notification.countDocuments({ contract: { $in: demoIds } });
  console.log(`\nNotifications attached to DEMO contracts: ${demoCount}`);
  console.log(`Notifications attached to other contracts: ${total - demoCount - (await Notification.countDocuments({ contract: null }))}`);

  await mongoose.disconnect();
  console.log('\nDone.');
}

run().catch(async (error) => {
  console.error('SEED FAILED:', error);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});
