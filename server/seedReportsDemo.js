#!/usr/bin/env node

/**
 * Non-destructive report demo seeder.
 *
 * This script creates/upserts demo records that make every role-based report
 * show meaningful data in the current report date range. It does not clear
 * real contracts, users, inventory, or bookings.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Contract = require('./models/Contract');
const MenuTasting = require('./models/MenuTasting');
const ProcurementRequest = require('./models/ProcurementRequest');
const Incident = require('./models/Incident');
const CreativeInventory = require('./models/CreativeInventory');
const LinenInventory = require('./models/LinenInventory');
const StockroomInventory = require('./models/StockroomInventory');
const KitchenInventory = require('./models/KitchenInventory');
const BanquetStaff = require('./models/BanquetStaff');
const Supplier = require('./models/Supplier');
const FinanceBudget = require('./models/FinanceBudget');
const { Driver, Truck } = require('./models/Logistics');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/juancarlos';
const DEMO_TAG = '[REPORT-DEMO]';

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const addMonths = (date, months) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const atTime = (date, hours, minutes = 0) => {
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return next;
};

const getPeriodMonth = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const maskMongoUri = (uri) => uri.replace(/:([^@]+)@/, ':****@');

const upsertDocument = async (Model, lookup, payload) => {
  let doc = await Model.findOne(lookup);
  const created = !doc;

  if (!doc) {
    doc = new Model(payload);
  } else {
    Object.assign(doc, payload);
  }

  await doc.save();
  return { doc, created };
};

const ensureUser = async (userData) => {
  const email = userData.email.toLowerCase();
  const existing = await User.findOne({ email });

  if (existing) {
    if (/^Report Demo /.test(existing.name || '')) {
      existing.name = userData.name;
    }
    existing.role = userData.role;
    existing.department = userData.department;
    existing.isActive = true;
    await existing.save();
    return { doc: existing, created: false };
  }

  const user = new User({ ...userData, email });
  await user.save();
  return { doc: user, created: true };
};

const confirmedSection = (userId, date) => ({
  confirmed: true,
  confirmedAt: date,
  confirmedBy: userId || null
});

const makeAddress = (city = 'Lipa City') => ({
  street: 'Report Demo Street',
  city,
  province: 'Batangas',
  zipCode: '4217'
});

async function seedReportDemoData() {
  const today = startOfToday();
  const yesterday = addDays(today, -1);
  const lastWeek = addDays(today, -7);
  const nextMonth = addMonths(today, 1);
  const now = new Date();

  console.log('Connecting to MongoDB...');
  console.log('URI:', maskMongoUri(MONGODB_URI));
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const usersToEnsure = [
    { name: 'System Admin', email: 'admin@juancarlos.com', password: 'admin123', role: 'admin', department: 'Admin' },
    { name: 'Sales Manager', email: 'sales@juancarlos.com', password: 'password123', role: 'sales', department: 'Sales' },
    { name: 'Accounting Manager', email: 'accounting@juancarlos.com', password: 'password123', role: 'accounting', department: 'Accounting' },
    { name: 'Creative Manager', email: 'creative@juancarlos.com', password: 'password123', role: 'creative', department: 'Creative' },
    { name: 'Linen Manager', email: 'linen@juancarlos.com', password: 'password123', role: 'linen', department: 'Linen' },
    { name: 'Stockroom Manager', email: 'stockroom@juancarlos.com', password: 'password123', role: 'stockroom', department: 'Stockroom' },
    { name: 'Kitchen Manager', email: 'kitchen@juancarlos.com', password: 'password123', role: 'kitchen', department: 'Kitchen' },
    { name: 'Banquet Supervisor', email: 'banquet@juancarlos.com', password: 'password123', role: 'banquet_supervisor', department: 'Banquet Operations' },
    { name: 'Logistics Manager', email: 'logistics@juancarlos.com', password: 'password123', role: 'logistics', department: 'Logistics' },
    { name: 'Purchasing Manager', email: 'purchasing@juancarlos.com', password: 'password123', role: 'purchasing', department: 'Purchasing' }
  ];

  const users = {};
  console.log('\nEnsuring department users...');
  for (const userData of usersToEnsure) {
    const result = await ensureUser(userData);
    users[userData.role] = result.doc;
    console.log(`  ${result.created ? 'created' : 'updated'} ${userData.email}`);
  }

  const adminId = users.admin?._id || null;
  const salesId = users.sales?._id || null;
  const accountingId = users.accounting?._id || null;
  const purchasingId = users.purchasing?._id || null;

  console.log('\nEnsuring report demo finance budget...');
  const budgetMonth = getPeriodMonth(today);
  await upsertDocument(FinanceBudget, { periodMonth: budgetMonth }, {
    periodMonth: budgetMonth,
    status: 'active',
    totalBudget: 300000,
    sourceOfFunds: 'mixed',
    categories: [
      { key: 'creative', label: 'Creative Inventory', allocatedAmount: 50000, notes: `${DEMO_TAG} Demo allocation for styling rentals and replacements.` },
      { key: 'linen', label: 'Linen Inventory', allocatedAmount: 45000, notes: `${DEMO_TAG} Demo allocation for napkins, sashes, and tablecloths.` },
      { key: 'stockroom', label: 'Stockroom / Equipment', allocatedAmount: 40000, notes: `${DEMO_TAG} Demo allocation for equipment and replacement tools.` },
      { key: 'kitchen', label: 'Kitchen Supplies', allocatedAmount: 30000, notes: `${DEMO_TAG} Demo kitchen operating allocation.` },
      { key: 'logistics', label: 'Logistics', allocatedAmount: 25000, notes: `${DEMO_TAG} Demo allocation for transport support.` },
      { key: 'banquet', label: 'Banquet Operations', allocatedAmount: 25000, notes: `${DEMO_TAG} Demo allocation for banquet staffing support.` },
      { key: 'contingency', label: 'Contingency / Emergency', allocatedAmount: 20000, notes: `${DEMO_TAG} Demo emergency buffer.` },
      { key: 'administration', label: 'Administration', allocatedAmount: 10000, notes: `${DEMO_TAG} Demo admin allocation.` }
    ],
    notes: `${DEMO_TAG} Current-month demo budget for Accounting Finance module. Based on projected collections, approved event load, and purchasing needs.`,
    preparedBy: accountingId,
    approvedBy: accountingId,
    approvedAt: today
  });
  console.log(`  ensured active finance budget for ${budgetMonth}`);

  console.log('\nEnsuring supplier directory...');
  const supplierLinen = (await upsertDocument(Supplier, { name: 'Report Demo Linen Works' }, {
    name: 'Report Demo Linen Works',
    contactPerson: 'Leah Villanueva',
    phone: '09175003342',
    email: 'linenworks.demo@example.com',
    address: 'Santo Tomas, Batangas',
    city: 'Santo Tomas',
    province: 'Batangas',
    serviceAreas: ['Batangas', 'Laguna', 'Quezon'],
    departments: ['linen'],
    requestTypes: ['purchase', 'rental'],
    supportedCategories: ['Tablecloth', 'Napkin', 'Sash', 'Chair Cover'],
    supportedKeywords: ['linen', 'cloth', 'napkin', 'sash'],
    isPreferred: true,
    priority: 10,
    notes: `${DEMO_TAG} Supplier for report demo linen requests.`,
    isActive: true
  })).doc;

  const supplierCreative = (await upsertDocument(Supplier, { name: 'Report Demo Decor Studio' }, {
    name: 'Report Demo Decor Studio',
    contactPerson: 'Marco Dela Cruz',
    phone: '09178004451',
    email: 'decorstudio.demo@example.com',
    address: 'Batangas City, Batangas',
    city: 'Batangas City',
    province: 'Batangas',
    serviceAreas: ['Batangas City', 'Lipa City', 'Bauan'],
    departments: ['creative'],
    requestTypes: ['purchase', 'rental'],
    supportedCategories: ['Backdrop', 'Lighting', 'Props', 'Table Decor'],
    supportedKeywords: ['backdrop', 'decor', 'lights', 'floral'],
    isPreferred: true,
    priority: 9,
    notes: `${DEMO_TAG} Supplier for report demo creative requests.`,
    isActive: true
  })).doc;

  const supplierStockroom = (await upsertDocument(Supplier, { name: 'Report Demo Tableware Supply' }, {
    name: 'Report Demo Tableware Supply',
    contactPerson: 'Nina Ramos',
    phone: '09179005562',
    email: 'tableware.demo@example.com',
    address: 'Lipa City, Batangas',
    city: 'Lipa City',
    province: 'Batangas',
    serviceAreas: ['Batangas', 'Cavite', 'Laguna'],
    departments: ['stockroom'],
    requestTypes: ['purchase', 'rental'],
    supportedCategories: ['Chair', 'Table', 'Equipment', 'Tool'],
    supportedKeywords: ['chair', 'table', 'equipment', 'utensils'],
    isPreferred: true,
    priority: 8,
    notes: `${DEMO_TAG} Supplier for report demo stockroom requests.`,
    isActive: true
  })).doc;

  await upsertDocument(Supplier, { name: 'Report Demo Market Runner' }, {
    name: 'Report Demo Market Runner',
    contactPerson: 'Paolo Mercado',
    phone: '09179990011',
    email: 'runner.demo@example.com',
    address: 'Lipa City Public Market',
    city: 'Lipa City',
    province: 'Batangas',
    serviceAreas: ['Lipa City', 'Malvar', 'Tanauan'],
    departments: ['stockroom', 'linen', 'creative'],
    requestTypes: ['purchase'],
    supportedCategories: ['Other', 'Equipment', 'Table Decor'],
    supportedKeywords: ['urgent', 'market', 'replacement', 'rental'],
    isPreferred: false,
    priority: 3,
    notes: `${DEMO_TAG} Backup supplier for urgent demo purchasing.`,
    isActive: true
  });
  console.log('  ensured 4 suppliers');

  console.log('\nEnsuring inventory snapshots...');
  const creativeBackdrop = (await upsertDocument(CreativeInventory, { itemCode: 'RPT-CR-BACKDROP-001' }, {
    itemCode: 'RPT-CR-BACKDROP-001',
    name: 'Report Demo Floral Arch Backdrop',
    category: 'Backdrop',
    subCategory: 'Wedding Stage',
    description: 'Freestanding floral arch for report demo contracts.',
    quantity: 3,
    availableQuantity: 3,
    pricePerItem: 8500,
    rentalPricePerDay: 3500,
    condition: 'excellent',
    storageLocation: 'Creative Room / Bay R1',
    dimensions: { length: 310, width: 80, height: 250, weight: 18 },
    acquisition: { type: 'custom_made', date: addMonths(today, -8), cost: 30000, supplier: 'Report Demo Decor Studio' },
    totalUses: 14,
    lastUsed: yesterday,
    status: 'available',
    notes: `${DEMO_TAG} Active creative report item.`,
    createdBy: adminId,
    updatedBy: adminId
  })).doc;

  const creativeLights = (await upsertDocument(CreativeInventory, { itemCode: 'RPT-CR-LIGHTS-001' }, {
    itemCode: 'RPT-CR-LIGHTS-001',
    name: 'Report Demo Warm Bistro Lights',
    category: 'Lighting',
    subCategory: 'Ambient Lighting',
    description: 'Warm string lights used in outdoor styling.',
    quantity: 18,
    availableQuantity: 0,
    pricePerItem: 1200,
    rentalPricePerDay: 400,
    condition: 'good',
    storageLocation: 'Creative Room / Lighting Rack',
    dimensions: { length: 1000, width: 10, height: 10, weight: 2 },
    acquisition: { type: 'purchased', date: addMonths(today, -6), cost: 1200, supplier: 'Report Demo Decor Studio' },
    totalUses: 28,
    lastUsed: today,
    status: 'available',
    notes: `${DEMO_TAG} Low availability item for creative report alert.`,
    createdBy: adminId,
    updatedBy: adminId
  })).doc;

  const creativeCenterpiece = (await upsertDocument(CreativeInventory, { itemCode: 'RPT-CR-CENTER-001' }, {
    itemCode: 'RPT-CR-CENTER-001',
    name: 'Report Demo Gold Centerpiece Set',
    category: 'Table Decor',
    subCategory: 'Centerpiece',
    description: 'Gold table centerpiece set for formal events.',
    quantity: 42,
    availableQuantity: 14,
    pricePerItem: 950,
    rentalPricePerDay: 250,
    condition: 'needs_repair',
    storageLocation: 'Creative Room / Shelf R3',
    dimensions: { length: 40, width: 40, height: 45, weight: 2 },
    acquisition: { type: 'purchased', date: addMonths(today, -10), cost: 950, supplier: 'Report Demo Decor Studio' },
    totalUses: 35,
    lastUsed: yesterday,
    status: 'maintenance',
    notes: `${DEMO_TAG} Attention item for creative report.`,
    createdBy: adminId,
    updatedBy: adminId
  })).doc;

  const linenTablecloth = (await upsertDocument(LinenInventory, { itemCode: 'RPT-LN-TC-001' }, {
    itemCode: 'RPT-LN-TC-001',
    name: 'Report Demo White Round Tablecloth',
    category: 'Tablecloth',
    size: 'round_72',
    dimensions: { length: 72, width: 72, unit: 'inches' },
    material: 'Polyester',
    color: 'White',
    quantity: 150,
    availableQuantity: 150,
    pricePerItem: 480,
    rentalPricePerDay: 80,
    condition: 'excellent',
    minimumStock: 25,
    lastWashed: yesterday,
    washCount: 22,
    storageLocation: 'Linen Room / Rack R1',
    acquisition: { date: addMonths(today, -7), cost: 480, supplier: 'Report Demo Linen Works' },
    totalUses: 60,
    lastUsed: today,
    status: 'available',
    notes: `${DEMO_TAG} Active linen report item.`,
    createdBy: adminId,
    updatedBy: adminId
  })).doc;

  const linenNapkin = (await upsertDocument(LinenInventory, { itemCode: 'RPT-LN-NAP-001' }, {
    itemCode: 'RPT-LN-NAP-001',
    name: 'Report Demo Champagne Napkin',
    category: 'Napkin',
    size: 'medium',
    dimensions: { length: 20, width: 20, unit: 'inches' },
    material: 'Satin',
    color: 'Champagne',
    quantity: 360,
    availableQuantity: 32,
    pricePerItem: 65,
    rentalPricePerDay: 18,
    condition: 'good',
    minimumStock: 60,
    lastWashed: yesterday,
    washCount: 40,
    storageLocation: 'Linen Room / Drawer R2',
    acquisition: { date: addMonths(today, -8), cost: 65, supplier: 'Report Demo Linen Works' },
    totalUses: 120,
    lastUsed: today,
    status: 'available',
    notes: `${DEMO_TAG} Low stock linen report item.`,
    createdBy: adminId,
    updatedBy: adminId
  })).doc;

  const linenSash = (await upsertDocument(LinenInventory, { itemCode: 'RPT-LN-SASH-001' }, {
    itemCode: 'RPT-LN-SASH-001',
    name: 'Report Demo Dusty Blue Chair Sash',
    category: 'Sash',
    size: 'custom',
    dimensions: { length: 110, width: 8, unit: 'inches' },
    material: 'Taffeta',
    color: 'Dusty Blue',
    quantity: 280,
    availableQuantity: 20,
    pricePerItem: 75,
    rentalPricePerDay: 20,
    condition: 'stained',
    minimumStock: 50,
    lastWashed: lastWeek,
    washCount: 52,
    storageLocation: 'Linen Room / Bin R3',
    acquisition: { date: addMonths(today, -5), cost: 75, supplier: 'Report Demo Linen Works' },
    totalUses: 90,
    lastUsed: yesterday,
    status: 'laundry',
    notes: `${DEMO_TAG} Attention linen report item.`,
    createdBy: adminId,
    updatedBy: adminId
  })).doc;

  const stockChair = (await upsertDocument(StockroomInventory, { itemCode: 'RPT-ST-CHAIR-001' }, {
    itemCode: 'RPT-ST-CHAIR-001',
    name: 'Report Demo White Banquet Chair',
    category: 'Chair',
    subcategory: 'Banquet Chair',
    description: 'White banquet chair stock for report demo events.',
    quantity: 420,
    reservedQuantity: 395,
    minimumStock: 50,
    condition: 'good',
    status: 'available',
    dimensions: { length: 42, width: 42, height: 90, weight: 4 },
    storageLocation: { warehouse: 'Main Warehouse', section: 'Chairs', shelf: 'Rack R1', bin: 'Bay 2' },
    purchasePrice: 1900,
    rentalPricePerDay: 90,
    replacementCost: 2300,
    supplier: { name: 'Report Demo Tableware Supply', contact: '09179005562', email: 'tableware.demo@example.com' },
    purchaseDate: addMonths(today, -11),
    totalRentals: 185,
    lastUsedDate: today,
    notes: `${DEMO_TAG} Low available stockroom item.`
  })).doc;

  const stockTable = (await upsertDocument(StockroomInventory, { itemCode: 'RPT-ST-TABLE-001' }, {
    itemCode: 'RPT-ST-TABLE-001',
    name: 'Report Demo Round Banquet Table',
    category: 'Table',
    subcategory: 'Dining Table',
    description: 'Round table for guest seating.',
    quantity: 80,
    reservedQuantity: 38,
    minimumStock: 12,
    condition: 'excellent',
    status: 'available',
    dimensions: { length: 152, width: 152, height: 76, weight: 19 },
    storageLocation: { warehouse: 'Main Warehouse', section: 'Tables', shelf: 'Floor', bin: 'Zone R2' },
    purchasePrice: 5400,
    rentalPricePerDay: 360,
    replacementCost: 6800,
    supplier: { name: 'Report Demo Tableware Supply', contact: '09179005562', email: 'tableware.demo@example.com' },
    purchaseDate: addMonths(today, -10),
    totalRentals: 95,
    lastUsedDate: yesterday,
    notes: `${DEMO_TAG} Active stockroom item.`
  })).doc;

  const stockAudio = (await upsertDocument(StockroomInventory, { itemCode: 'RPT-ST-AUDIO-001' }, {
    itemCode: 'RPT-ST-AUDIO-001',
    name: 'Report Demo Portable PA System',
    category: 'Equipment',
    subcategory: 'Audio',
    description: 'Portable speaker and wireless mic set.',
    quantity: 8,
    reservedQuantity: 8,
    minimumStock: 2,
    condition: 'poor',
    status: 'maintenance',
    dimensions: { length: 60, width: 40, height: 45, weight: 18 },
    storageLocation: { warehouse: 'AV Room', section: 'Audio', shelf: 'Rack R2', bin: 'Case 1' },
    purchasePrice: 26000,
    rentalPricePerDay: 2000,
    replacementCost: 32000,
    supplier: { name: 'Report Demo Tableware Supply', contact: '09179005562', email: 'tableware.demo@example.com' },
    purchaseDate: addMonths(today, -14),
    totalRentals: 48,
    lastUsedDate: yesterday,
    lastMaintenanceDate: lastWeek,
    nextMaintenanceDate: addDays(today, 5),
    maintenanceNotes: 'Speaker crackle reported after last event.',
    notes: `${DEMO_TAG} Attention stockroom item.`
  })).doc;

  await upsertDocument(KitchenInventory, { itemCode: 'RPT-KT-CHK-001' }, {
    itemCode: 'RPT-KT-CHK-001',
    name: 'Report Demo Chicken Fillet',
    category: 'Ingredient',
    subcategory: 'Protein',
    description: 'Frozen chicken fillet for banquet prep.',
    quantity: 160,
    reservedQuantity: 145,
    minimumStock: 25,
    unit: 'kg',
    condition: 'good',
    status: 'available',
    storageLocation: { area: 'Cold Storage', section: 'Freezer R1', container: 'Shelf A' },
    purchasePrice: 240,
    replacementCost: 260,
    supplier: { name: 'Report Demo Market Runner', contact: '09179990011', email: 'runner.demo@example.com' },
    purchaseDate: yesterday,
    totalUses: 40,
    lastUsedDate: today,
    expiryDate: addDays(today, 30),
    batchNumber: 'RPT-CHK-2606',
    notes: `${DEMO_TAG} Low stock kitchen report item.`
  });

  await upsertDocument(KitchenInventory, { itemCode: 'RPT-KT-POT-001' }, {
    itemCode: 'RPT-KT-POT-001',
    name: 'Report Demo Stock Pot 40L',
    category: 'Cookware',
    subcategory: 'Stock Pot',
    description: 'Heavy duty stock pot for commissary prep.',
    quantity: 12,
    reservedQuantity: 3,
    minimumStock: 2,
    unit: 'piece',
    condition: 'poor',
    status: 'maintenance',
    brand: 'Vulcan',
    storageLocation: { area: 'Main Kitchen', section: 'Cookware Rack', container: 'Lower Rack' },
    purchasePrice: 7200,
    replacementCost: 8500,
    supplier: { name: 'Report Demo Market Runner', contact: '09179990011', email: 'runner.demo@example.com' },
    totalUses: 90,
    lastUsedDate: yesterday,
    maintenanceNotes: 'Handle repair needed.',
    notes: `${DEMO_TAG} Attention kitchen report item.`
  });
  console.log('  ensured creative, linen, stockroom, and kitchen inventory');

  console.log('\nEnsuring banquet staff pool...');
  const staffSeeds = [
    ['RPT-BS-001', 'Miguel', 'Santos', 'head_captain', 4.8, 34, 1800],
    ['RPT-BS-002', 'Ana', 'Reyes', 'waitress', 4.6, 42, 1400],
    ['RPT-BS-003', 'Carlo', 'Garcia', 'waiter', 4.5, 39, 1400],
    ['RPT-BS-004', 'Rina', 'Lopez', 'food_runner', 4.4, 28, 1300],
    ['RPT-BS-005', 'Jun', 'Villanueva', 'busser', 4.2, 22, 1200],
    ['RPT-BS-006', 'Mara', 'Flores', 'bartender', 4.7, 31, 1600],
    ['RPT-BS-007', 'Paolo', 'Rivera', 'setup_crew', 4.3, 26, 1250],
    ['RPT-BS-008', 'Ella', 'Cruz', 'waitress', 4.5, 33, 1400],
    ['RPT-BS-009', 'Nico', 'Tan', 'waiter', 4.1, 18, 1350],
    ['RPT-BS-010', 'Lara', 'Mendoza', 'setup_crew', 4.2, 21, 1250]
  ];

  const banquetStaff = [];
  for (const [employeeId, firstName, lastName, role, rating, totalEventsWorked, ratePerDay] of staffSeeds) {
    const result = await upsertDocument(BanquetStaff, { employeeId }, {
      employeeId,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email: `${employeeId.toLowerCase()}@juancarlos.demo`,
      phone: `0917${employeeId.slice(-3)}0000`,
      address: makeAddress(),
      role,
      employmentType: role === 'head_captain' ? 'full_time' : 'on_call',
      status: 'active',
      dateHired: addMonths(today, -18),
      skills: ['Event Service', 'Guest Handling', 'Buffet Setup'],
      yearsOfExperience: Math.max(1, Math.round(totalEventsWorked / 12)),
      emergencyContact: { name: 'Report Demo Contact', relationship: 'Relative', phone: '09170000000' },
      ratePerDay,
      ratePerHour: Math.round(ratePerDay / 8),
      notes: `${DEMO_TAG} Banquet staff for report demo.`,
      rating,
      totalEventsWorked,
      createdBy: adminId,
      updatedBy: adminId
    });
    banquetStaff.push(result.doc);
  }
  console.log(`  ensured ${banquetStaff.length} banquet staff`);

  console.log('\nEnsuring logistics resources...');
  const driverOne = (await upsertDocument(Driver, { driverId: 'RPT-DRV-001' }, {
    driverId: 'RPT-DRV-001',
    firstName: 'Ramon',
    lastName: 'Dela Pena',
    fullName: 'Ramon Dela Pena',
    email: 'rpt-driver-1@juancarlos.demo',
    phone: '09170010001',
    licenseNumber: 'RPT-DL-2606-001',
    licenseType: 'professional',
    licenseExpiry: addMonths(today, 12),
    employmentType: 'full_time',
    status: 'active',
    yearsOfExperience: 8,
    notes: `${DEMO_TAG} Active report demo driver.`,
    createdBy: adminId,
    updatedBy: adminId
  })).doc;

  const driverTwo = (await upsertDocument(Driver, { driverId: 'RPT-DRV-002' }, {
    driverId: 'RPT-DRV-002',
    firstName: 'Leo',
    lastName: 'Navarro',
    fullName: 'Leo Navarro',
    email: 'rpt-driver-2@juancarlos.demo',
    phone: '09170010002',
    licenseNumber: 'RPT-DL-2606-002',
    licenseType: 'professional',
    licenseExpiry: addMonths(today, 10),
    employmentType: 'contractual',
    status: 'active',
    yearsOfExperience: 5,
    notes: `${DEMO_TAG} Active report demo driver.`,
    createdBy: adminId,
    updatedBy: adminId
  })).doc;

  const driverThree = (await upsertDocument(Driver, { driverId: 'RPT-DRV-003' }, {
    driverId: 'RPT-DRV-003',
    firstName: 'Benjie',
    lastName: 'Mercado',
    fullName: 'Benjie Mercado',
    email: 'rpt-driver-3@juancarlos.demo',
    phone: '09170010003',
    licenseNumber: 'RPT-DL-2606-003',
    licenseType: 'professional',
    licenseExpiry: addMonths(today, 8),
    employmentType: 'full_time',
    status: 'on_leave',
    yearsOfExperience: 6,
    notes: `${DEMO_TAG} On-leave report demo driver.`,
    createdBy: adminId,
    updatedBy: adminId
  })).doc;

  const truckOne = (await upsertDocument(Truck, { truckId: 'RPT-TRK-001' }, {
    truckId: 'RPT-TRK-001',
    plateNumber: 'RPT1001',
    truckType: 'closed_van',
    brand: 'Isuzu',
    model: 'NQR',
    year: 2022,
    color: 'White',
    capacity: { weight: 3500, volume: 18, dimensions: { length: 520, width: 210, height: 220 } },
    ownership: 'owned',
    status: 'available',
    registrationDate: addMonths(today, -10),
    registrationExpiry: addMonths(today, 3),
    assignedDriver: driverOne._id,
    totalTrips: 62,
    notes: `${DEMO_TAG} Available report demo truck.`,
    createdBy: adminId,
    updatedBy: adminId
  })).doc;

  const truckTwo = (await upsertDocument(Truck, { truckId: 'RPT-TRK-002' }, {
    truckId: 'RPT-TRK-002',
    plateNumber: 'RPT1002',
    truckType: 'refrigerated',
    brand: 'Fuso',
    model: 'Canter',
    year: 2021,
    color: 'Silver',
    capacity: { weight: 4200, volume: 22, dimensions: { length: 560, width: 220, height: 230 } },
    ownership: 'owned',
    status: 'in_use',
    registrationDate: addMonths(today, -8),
    registrationExpiry: addMonths(today, 5),
    assignedDriver: driverTwo._id,
    totalTrips: 50,
    notes: `${DEMO_TAG} In-use report demo truck.`,
    createdBy: adminId,
    updatedBy: adminId
  })).doc;

  const truckThree = (await upsertDocument(Truck, { truckId: 'RPT-TRK-003' }, {
    truckId: 'RPT-TRK-003',
    plateNumber: 'RPT1003',
    truckType: 'mini_truck',
    brand: 'Hyundai',
    model: 'H100',
    year: 2020,
    color: 'White',
    capacity: { weight: 1800, volume: 10, dimensions: { length: 420, width: 185, height: 190 } },
    ownership: 'leased',
    status: 'maintenance',
    registrationDate: addMonths(today, -12),
    registrationExpiry: addMonths(today, 1),
    assignedDriver: driverThree._id,
    totalTrips: 38,
    maintenanceNotes: 'Brake inspection scheduled.',
    notes: `${DEMO_TAG} Maintenance report demo truck.`,
    createdBy: adminId,
    updatedBy: adminId
  })).doc;

  driverOne.assignedTrucks = [truckOne._id];
  await driverOne.save();
  driverTwo.assignedTrucks = [truckTwo._id];
  await driverTwo.save();
  driverThree.assignedTrucks = [truckThree._id];
  await driverThree.save();
  console.log('  ensured 3 drivers and 3 trucks');

  console.log('\nEnsuring menu tasting bookings...');
  const tastingOne = (await upsertDocument(MenuTasting, { tastingNumber: 'RPT-TASTE-2606-0001' }, {
    tastingNumber: 'RPT-TASTE-2606-0001',
    clientName: 'Alyssa and Mark Santos',
    clientEmail: 'alyssa.mark.report@example.com',
    clientPhone: '09171230101',
    clientAddress: makeAddress('Batangas City'),
    eventType: 'wedding',
    expectedGuests: 180,
    preferredEventDate: addMonths(today, 5),
    tastingDate: atTime(today, 10, 0),
    tastingTime: '10:00 AM',
    numberOfPax: 4,
    menuItems: [
      { category: 'Main Course', itemName: 'Beef Caldereta', selected: true },
      { category: 'Main Course', itemName: 'Buttered Chicken', selected: true },
      { category: 'Dessert', itemName: 'Mango Float', selected: true }
    ],
    status: 'completed',
    contractCreated: true,
    assignedStaff: salesId,
    clientNotes: `${DEMO_TAG} Converted tasting for sales report.`,
    internalNotes: `${DEMO_TAG} Demo converted tasting.`
  })).doc;

  await upsertDocument(MenuTasting, { tastingNumber: 'RPT-TASTE-2606-0002' }, {
    tastingNumber: 'RPT-TASTE-2606-0002',
    clientName: 'Lipa Tech Solutions',
    clientEmail: 'events.lipatech.report@example.com',
    clientPhone: '09171230102',
    clientAddress: makeAddress(),
    eventType: 'corporate',
    expectedGuests: 120,
    preferredEventDate: addMonths(today, 3),
    tastingDate: atTime(today, 14, 0),
    tastingTime: '2:00 PM',
    numberOfPax: 3,
    menuItems: [
      { category: 'Main Course', itemName: 'Fish Fillet', selected: true },
      { category: 'Salad', itemName: 'Caesar Salad', selected: true }
    ],
    status: 'confirmed',
    contractCreated: false,
    assignedStaff: salesId,
    clientNotes: `${DEMO_TAG} Pending tasting for sales report.`,
    internalNotes: `${DEMO_TAG} Demo unconverted tasting.`
  });

  await upsertDocument(MenuTasting, { tastingNumber: 'RPT-TASTE-2606-0003' }, {
    tastingNumber: 'RPT-TASTE-2606-0003',
    clientName: 'Reyes Family',
    clientEmail: 'reyes.family.report@example.com',
    clientPhone: '09171230103',
    clientAddress: makeAddress('Tanauan City'),
    eventType: 'birthday',
    expectedGuests: 90,
    preferredEventDate: addMonths(today, 2),
    tastingDate: atTime(yesterday, 15, 0),
    tastingTime: '3:00 PM',
    numberOfPax: 5,
    menuItems: [
      { category: 'Main Course', itemName: 'Pork Menudo', selected: true },
      { category: 'Dessert', itemName: 'Buko Pandan', selected: true }
    ],
    status: 'booked',
    contractCreated: false,
    assignedStaff: salesId,
    clientNotes: `${DEMO_TAG} Booked tasting for sales report.`,
    internalNotes: `${DEMO_TAG} Demo booked tasting.`
  });
  console.log('  ensured 3 menu tastings');

  const sectionConfirmations = {
    details: confirmedSection(salesId, yesterday),
    menu: confirmedSection(users.kitchen?._id, yesterday),
    preferences: confirmedSection(salesId, yesterday),
    payments: confirmedSection(salesId, today),
    creative: confirmedSection(users.creative?._id, today),
    linen: confirmedSection(users.linen?._id, today),
    stockroom: confirmedSection(users.stockroom?._id, today),
    logistics: confirmedSection(users.logistics?._id, today)
  };

  console.log('\nEnsuring contracts for reports...');
  const paidWedding = (await upsertDocument(Contract, { contractNumber: 'RPT-CON-2606-0001' }, {
    contractNumber: 'RPT-CON-2606-0001',
    menuTasting: tastingOne._id,
    status: 'approved',
    currentDepartment: 'all',
    clientSigned: true,
    clientSignedAt: yesterday,
    signatureAssets: {
      client: { signedName: 'Alyssa Santos', title: 'Client', imageUrl: '/demo/signatures/alyssa.png', uploadedAt: yesterday },
      staff: { signedName: 'Report Demo Sales', title: 'Sales', imageUrl: '/demo/signatures/staff.png', uploadedAt: yesterday }
    },
    clientName: 'Alyssa and Mark Santos',
    clientContact: '09171230101',
    clientEmail: 'alyssa.mark.report@example.com',
    clientAddress: makeAddress('Batangas City'),
    clientType: 'wedding',
    eventDate: atTime(today, 16, 0),
    bookingDate: lastWeek,
    venue: {
      name: 'Juan Carlo Garden Pavilion',
      address: 'Lipa City, Batangas',
      capacity: 250,
      contact: '09175550000',
      notes: `${DEMO_TAG} Approved paid wedding for report demo.`
    },
    eventType: 'Wedding Reception',
    packageSelected: 'premium',
    menuDetails: [
      { category: 'Main Course', item: 'Beef Caldereta', quantity: 180, confirmed: true },
      { category: 'Main Course', item: 'Buttered Chicken', quantity: 180, confirmed: true },
      { category: 'Side', item: 'Yang Chow Fried Rice', quantity: 180, confirmed: true },
      { category: 'Dessert', item: 'Mango Float', quantity: 180, confirmed: true }
    ],
    totalPacks: 180,
    preferredColor: 'Ivory and Champagne',
    napkinType: 'Satin',
    tableSetup: 'round',
    backdropRequirements: 'Floral arch with warm light accents',
    specialRequests: 'VIP head table for 12 guests',
    creativeRequirements: {
      theme: 'Classic Garden Wedding',
      colorPalette: ['Ivory', 'Champagne', 'Warm White'],
      style: 'Classic',
      backdropType: 'Floral Arch',
      tableCenterpieces: 'Gold centerpiece set'
    },
    creativeAssets: [
      { itemId: String(creativeBackdrop._id), item: creativeBackdrop.name, itemCode: creativeBackdrop.itemCode, category: 'Backdrop', quantity: 1, status: 'prepared', notes: 'Main stage', cost: 8500, pricePerItem: 8500 },
      { itemId: String(creativeLights._id), item: creativeLights.name, itemCode: creativeLights.itemCode, category: 'Lighting', quantity: 10, status: 'pending', notes: 'Garden path', cost: 4000, pricePerItem: 400 },
      { itemId: String(creativeCenterpiece._id), item: creativeCenterpiece.name, itemCode: creativeCenterpiece.itemCode, category: 'Table Decor', quantity: 18, status: 'prepared', notes: 'Guest tables', cost: 4500, pricePerItem: 250 }
    ],
    packagePrice: 190000,
    totalContractValue: 260000,
    paymentTerms: 'wedding_standard',
    downPaymentPercent: 60,
    finalPaymentPercent: 40,
    payments: [
      { amount: 156000, date: atTime(yesterday, 11, 0), method: 'bank_transfer', reference: 'RPT-PAY-0001-DP', receiptNumber: 'PR-RPT-0001', receiptIssuedBy: 'Juan Carlos', receiptGeneratedAt: yesterday, status: 'completed' },
      { amount: 104000, date: atTime(today, 9, 0), method: 'cash', reference: 'RPT-PAY-0001-FINAL', receiptNumber: 'PR-RPT-0002', receiptIssuedBy: 'Juan Carlos', receiptGeneratedAt: today, status: 'completed' }
    ],
    paymentStatus: 'paid',
    vehicleRequests: [{ type: 'internal', quantity: 2, cubicMeters: 25, filedDate: yesterday, status: 'approved' }],
    estimatedWaiters: 16,
    estimatedVehicles: 2,
    logisticsAssignment: {
      driver: driverOne._id,
      truck: truckOne._id,
      assignmentStatus: 'ready_for_dispatch',
      notes: `${DEMO_TAG} Ready dispatch for report demo.`,
      checkedAt: today,
      checkedBy: users.logistics?._id || null
    },
    equipmentChecklist: [
      { itemId: String(stockChair._id), item: stockChair.name, itemCode: stockChair.itemCode, category: stockChair.category, quantity: 180, unitPrice: stockChair.rentalPricePerDay, notes: 'Guest seating', status: 'prepared' },
      { itemId: String(stockTable._id), item: stockTable.name, itemCode: stockTable.itemCode, category: stockTable.category, quantity: 20, unitPrice: stockTable.rentalPricePerDay, notes: 'Guest tables', status: 'prepared' },
      { itemId: String(stockAudio._id), item: stockAudio.name, itemCode: stockAudio.itemCode, category: stockAudio.category, quantity: 1, unitPrice: stockAudio.rentalPricePerDay, notes: 'Program audio', status: 'pending' }
    ],
    cookingLocation: 'commissary',
    ingredientStatus: 'prepared',
    linenRequirements: [
      { itemId: String(linenTablecloth._id), type: linenTablecloth.name, itemCode: linenTablecloth.itemCode, category: linenTablecloth.category, size: linenTablecloth.size, material: linenTablecloth.material, color: linenTablecloth.color, quantity: 20, unitPrice: 80, notes: 'Guest tables', status: 'prepared' },
      { itemId: String(linenNapkin._id), type: linenNapkin.name, itemCode: linenNapkin.itemCode, category: linenNapkin.category, size: linenNapkin.size, material: linenNapkin.material, color: linenNapkin.color, quantity: 180, unitPrice: 18, notes: 'Place settings', status: 'pending' },
      { itemId: String(linenSash._id), type: linenSash.name, itemCode: linenSash.itemCode, category: linenSash.category, size: linenSash.size, material: linenSash.material, color: linenSash.color, quantity: 180, unitPrice: 20, notes: 'Chair styling', status: 'pending' }
    ],
    linenStatus: 'pending',
    assignedSupervisor: users.banquet_supervisor?._id || null,
    banquetAssignment: {
      serviceGuestCount: 180,
      staffingPlan: { head_captain: 1, service_staff: 12, food_runner: 2, busser: 2, bartender: 1, setup_crew: 3 },
      assignments: [
        { staff: banquetStaff[0]._id, assignmentRole: 'head_captain' },
        { staff: banquetStaff[1]._id, assignmentRole: 'service_staff' },
        { staff: banquetStaff[2]._id, assignmentRole: 'service_staff' },
        { staff: banquetStaff[3]._id, assignmentRole: 'food_runner' },
        { staff: banquetStaff[4]._id, assignmentRole: 'busser' },
        { staff: banquetStaff[5]._id, assignmentRole: 'bartender' },
        { staff: banquetStaff[6]._id, assignmentRole: 'setup_crew' }
      ],
      updatedAt: today,
      updatedBy: users.banquet_supervisor?._id || null
    },
    submittedAt: yesterday,
    approvedAt: today,
    departmentProgress: { sales: 100, accounting: 100, logistics: 75, banquet: 80, kitchen: 100, purchasing: 50, creative: 70, linen: 55 },
    sectionConfirmations,
    internalNotes: `${DEMO_TAG} Paid approved event for full report demo.`
  })).doc;

  tastingOne.contract = paidWedding._id;
  tastingOne.contractCreated = true;
  await tastingOne.save();

  const receivableCorporate = (await upsertDocument(Contract, { contractNumber: 'RPT-CON-2606-0002' }, {
    contractNumber: 'RPT-CON-2606-0002',
    status: 'submitted',
    currentDepartment: 'accounting',
    clientSigned: true,
    clientSignedAt: today,
    clientName: 'Lipa Tech Solutions',
    clientContact: '09171230102',
    clientEmail: 'events.lipatech.report@example.com',
    clientAddress: makeAddress(),
    clientType: 'corporate',
    eventDate: atTime(today, 12, 0),
    bookingDate: lastWeek,
    venue: {
      name: 'Lipa Convention Hall',
      address: 'Lipa City, Batangas',
      capacity: 180,
      contact: '09175551111',
      notes: `${DEMO_TAG} Submitted contract awaiting accounting review.`
    },
    eventType: 'Corporate Lunch',
    packageSelected: 'standard',
    menuDetails: [
      { category: 'Main Course', item: 'Fish Fillet', quantity: 120, confirmed: true },
      { category: 'Main Course', item: 'Pork Menudo', quantity: 120, confirmed: true },
      { category: 'Side', item: 'Steamed Rice', quantity: 120, confirmed: true },
      { category: 'Dessert', item: 'Fruit Salad', quantity: 120, confirmed: false }
    ],
    totalPacks: 120,
    preferredColor: 'Navy and Silver',
    napkinType: 'Cotton',
    tableSetup: 'rectangular',
    backdropRequirements: 'Simple corporate signage',
    specialRequests: 'Presentation table near stage',
    creativeRequirements: {
      theme: 'Corporate Lunch',
      colorPalette: ['Navy', 'Silver'],
      style: 'Minimalist',
      backdropType: 'LED Wall',
      tableCenterpieces: 'Minimal centerpieces'
    },
    creativeAssets: [
      { itemId: String(creativeLights._id), item: creativeLights.name, itemCode: creativeLights.itemCode, category: 'Lighting', quantity: 6, status: 'pending', notes: 'Stage lights', cost: 2400, pricePerItem: 400 },
      { itemId: String(creativeCenterpiece._id), item: creativeCenterpiece.name, itemCode: creativeCenterpiece.itemCode, category: 'Table Decor', quantity: 12, status: 'pending', notes: 'Guest tables', cost: 3000, pricePerItem: 250 }
    ],
    packagePrice: 130000,
    totalContractValue: 185000,
    paymentTerms: 'corporate_flexible',
    downPaymentPercent: 60,
    finalPaymentPercent: 40,
    payments: [
      { amount: 90000, date: atTime(today, 13, 0), method: 'gcash', reference: 'RPT-PAY-0002-DP', receiptNumber: 'PR-RPT-0003', receiptIssuedBy: 'Juan Carlos', receiptGeneratedAt: today, status: 'completed' }
    ],
    paymentStatus: 'partially_paid',
    vehicleRequests: [{ type: 'internal', quantity: 1, cubicMeters: 12, filedDate: today, status: 'pending' }],
    estimatedWaiters: 10,
    estimatedVehicles: 1,
    logisticsAssignment: {
      driver: null,
      truck: null,
      assignmentStatus: 'pending',
      notes: `${DEMO_TAG} Waiting for accounting approval.`
    },
    equipmentChecklist: [
      { itemId: String(stockChair._id), item: stockChair.name, itemCode: stockChair.itemCode, category: stockChair.category, quantity: 120, unitPrice: stockChair.rentalPricePerDay, notes: 'Conference seating', status: 'pending' },
      { itemId: String(stockTable._id), item: stockTable.name, itemCode: stockTable.itemCode, category: stockTable.category, quantity: 14, unitPrice: stockTable.rentalPricePerDay, notes: 'Dining and buffet tables', status: 'pending' }
    ],
    cookingLocation: 'commissary',
    ingredientStatus: 'procured',
    linenRequirements: [
      { itemId: String(linenTablecloth._id), type: linenTablecloth.name, itemCode: linenTablecloth.itemCode, category: linenTablecloth.category, size: linenTablecloth.size, material: linenTablecloth.material, color: linenTablecloth.color, quantity: 14, unitPrice: 80, notes: 'Guest tables', status: 'pending' },
      { itemId: String(linenNapkin._id), type: linenNapkin.name, itemCode: linenNapkin.itemCode, category: linenNapkin.category, size: linenNapkin.size, material: linenNapkin.material, color: linenNapkin.color, quantity: 120, unitPrice: 18, notes: 'Place settings', status: 'pending' }
    ],
    linenStatus: 'pending',
    assignedSupervisor: users.banquet_supervisor?._id || null,
    banquetAssignment: {
      serviceGuestCount: 120,
      staffingPlan: { head_captain: 1, service_staff: 8, food_runner: 1, busser: 1, bartender: 0, setup_crew: 2 },
      assignments: [
        { staff: banquetStaff[7]._id, assignmentRole: 'service_staff' },
        { staff: banquetStaff[8]._id, assignmentRole: 'service_staff' },
        { staff: banquetStaff[9]._id, assignmentRole: 'setup_crew' }
      ],
      updatedAt: today,
      updatedBy: users.banquet_supervisor?._id || null
    },
    submittedAt: today,
    approvedAt: null,
    departmentProgress: { sales: 100, accounting: 35, logistics: 0, banquet: 35, kitchen: 60, purchasing: 20, creative: 20, linen: 20 },
    sectionConfirmations,
    internalNotes: `${DEMO_TAG} Receivable contract for finance report demo.`
  })).doc;

  const draftBirthday = (await upsertDocument(Contract, { contractNumber: 'RPT-CON-2606-0003' }, {
    contractNumber: 'RPT-CON-2606-0003',
    status: 'draft',
    currentDepartment: 'sales',
    clientSigned: false,
    clientName: 'Reyes Family',
    clientContact: '09171230103',
    clientEmail: 'reyes.family.report@example.com',
    clientAddress: makeAddress('Tanauan City'),
    clientType: 'birthday',
    eventDate: atTime(today, 18, 0),
    bookingDate: today,
    venue: {
      name: 'Casa Maria Events Place',
      address: 'Tanauan City, Batangas',
      capacity: 140,
      contact: '09175552222',
      notes: `${DEMO_TAG} Draft contract for sales pipeline report.`
    },
    eventType: 'Birthday Dinner',
    packageSelected: 'basic',
    menuDetails: [
      { category: 'Main Course', item: 'Pork Menudo', quantity: 90, confirmed: false },
      { category: 'Main Course', item: 'Buttered Chicken', quantity: 90, confirmed: false },
      { category: 'Dessert', item: 'Buko Pandan', quantity: 90, confirmed: false }
    ],
    totalPacks: 90,
    preferredColor: 'Blush Pink',
    napkinType: 'Polyester',
    tableSetup: 'round',
    backdropRequirements: 'Birthday photo wall',
    specialRequests: 'Kids table setup',
    creativeRequirements: {
      theme: 'Family Birthday',
      colorPalette: ['Pink', 'White'],
      style: 'Modern',
      backdropType: 'Photo Wall'
    },
    creativeAssets: [
      { itemId: String(creativeBackdrop._id), item: creativeBackdrop.name, itemCode: creativeBackdrop.itemCode, category: 'Backdrop', quantity: 1, status: 'pending', notes: 'Photo wall frame', cost: 8500, pricePerItem: 8500 }
    ],
    packagePrice: 98000,
    totalContractValue: 128000,
    paymentTerms: 'wedding_standard',
    downPaymentPercent: 60,
    finalPaymentPercent: 40,
    payments: [],
    paymentStatus: 'unpaid',
    vehicleRequests: [{ type: 'internal', quantity: 1, cubicMeters: 10, filedDate: today, status: 'pending' }],
    estimatedWaiters: 8,
    estimatedVehicles: 1,
    logisticsAssignment: { assignmentStatus: 'pending', notes: `${DEMO_TAG} Draft contract not yet scheduled.` },
    equipmentChecklist: [
      { itemId: String(stockChair._id), item: stockChair.name, itemCode: stockChair.itemCode, category: stockChair.category, quantity: 90, unitPrice: stockChair.rentalPricePerDay, notes: 'Guest chairs', status: 'pending' }
    ],
    cookingLocation: 'commissary',
    ingredientStatus: 'pending',
    linenRequirements: [
      { itemId: String(linenTablecloth._id), type: linenTablecloth.name, itemCode: linenTablecloth.itemCode, category: linenTablecloth.category, size: linenTablecloth.size, material: linenTablecloth.material, color: linenTablecloth.color, quantity: 10, unitPrice: 80, notes: 'Guest tables', status: 'pending' }
    ],
    linenStatus: 'pending',
    banquetAssignment: {
      serviceGuestCount: 90,
      staffingPlan: { head_captain: 1, service_staff: 6, food_runner: 1, busser: 1, bartender: 0, setup_crew: 2 },
      assignments: [],
      updatedAt: today,
      updatedBy: users.banquet_supervisor?._id || null
    },
    departmentProgress: { sales: 40, accounting: 0, logistics: 0, banquet: 0, kitchen: 0, purchasing: 0, creative: 0, linen: 0 },
    sectionConfirmations: {
      details: confirmedSection(salesId, today),
      menu: confirmedSection(null, null),
      preferences: confirmedSection(null, null),
      payments: confirmedSection(null, null),
      creative: confirmedSection(null, null),
      linen: confirmedSection(null, null),
      stockroom: confirmedSection(null, null),
      logistics: confirmedSection(null, null)
    },
    internalNotes: `${DEMO_TAG} Draft contract for sales and inventory validation demo.`
  })).doc;

  const completedAnniversary = (await upsertDocument(Contract, { contractNumber: 'RPT-CON-2606-0004' }, {
    contractNumber: 'RPT-CON-2606-0004',
    status: 'completed',
    completedAt: atTime(yesterday, 23, 0),
    currentDepartment: 'all',
    clientSigned: true,
    clientSignedAt: lastWeek,
    signedDocument: {
      fileUrl: '/demo/signed-contracts/rpt-con-2606-0004.pdf',
      fileName: 'RPT-CON-2606-0004-signed.pdf',
      uploadedAt: lastWeek,
      uploadedBy: salesId
    },
    clientName: 'Dela Cruz Anniversary',
    clientContact: '09171230104',
    clientEmail: 'delacruz.anniv.report@example.com',
    clientAddress: makeAddress('Lemery'),
    clientType: 'anniversary',
    eventDate: atTime(yesterday, 17, 0),
    bookingDate: addMonths(today, -2),
    venue: {
      name: 'The Orchard Pavilion',
      address: 'Lemery, Batangas',
      capacity: 160,
      contact: '09175553333',
      notes: `${DEMO_TAG} Completed post-event contract for reports.`
    },
    eventType: 'Anniversary Dinner',
    packageSelected: 'deluxe',
    menuDetails: [
      { category: 'Main Course', item: 'Roast Beef', quantity: 140, confirmed: true },
      { category: 'Main Course', item: 'Chicken Galantina', quantity: 140, confirmed: true },
      { category: 'Side', item: 'Garlic Vegetables', quantity: 140, confirmed: true },
      { category: 'Dessert', item: 'Leche Flan', quantity: 140, confirmed: true }
    ],
    totalPacks: 140,
    preferredColor: 'Emerald and Gold',
    napkinType: 'Linen',
    tableSetup: 'mixed',
    backdropRequirements: 'Anniversary photo wall',
    specialRequests: 'Senior guest assistance',
    creativeRequirements: {
      theme: 'Elegant Anniversary',
      colorPalette: ['Emerald', 'Gold', 'Ivory'],
      style: 'Glamorous',
      backdropType: 'Photo Wall'
    },
    creativeAssets: [
      { itemId: String(creativeBackdrop._id), item: creativeBackdrop.name, itemCode: creativeBackdrop.itemCode, category: 'Backdrop', quantity: 1, status: 'returned', postEventStatus: 'checked_ok', notes: 'Returned', cost: 8500, pricePerItem: 8500 },
      { itemId: String(creativeCenterpiece._id), item: creativeCenterpiece.name, itemCode: creativeCenterpiece.itemCode, category: 'Table Decor', quantity: 14, status: 'returned', postEventStatus: 'incident_reported', notes: 'One cracked centerpiece', cost: 3500, pricePerItem: 250 }
    ],
    packagePrice: 145000,
    totalContractValue: 150000,
    paymentTerms: 'wedding_standard',
    downPaymentPercent: 60,
    finalPaymentPercent: 40,
    payments: [
      { amount: 90000, date: atTime(yesterday, 10, 0), method: 'bank_transfer', reference: 'RPT-PAY-0004-DP', receiptNumber: 'PR-RPT-0004', receiptIssuedBy: 'Juan Carlos', receiptGeneratedAt: yesterday, status: 'completed' },
      { amount: 60000, date: atTime(yesterday, 20, 0), method: 'cash', reference: 'RPT-PAY-0004-FINAL', receiptNumber: 'PR-RPT-0005', receiptIssuedBy: 'Juan Carlos', receiptGeneratedAt: yesterday, status: 'completed' }
    ],
    paymentStatus: 'paid',
    vehicleRequests: [{ type: 'internal', quantity: 1, cubicMeters: 18, filedDate: lastWeek, status: 'dispatched' }],
    estimatedWaiters: 12,
    estimatedVehicles: 1,
    logisticsAssignment: {
      driver: driverTwo._id,
      truck: truckTwo._id,
      assignmentStatus: 'completed',
      notes: `${DEMO_TAG} Completed delivery and pull-out.`,
      checkedAt: yesterday,
      checkedBy: users.logistics?._id || null
    },
    equipmentChecklist: [
      { itemId: String(stockChair._id), item: stockChair.name, itemCode: stockChair.itemCode, category: stockChair.category, quantity: 140, unitPrice: stockChair.rentalPricePerDay, notes: 'Returned', status: 'returned', postEventStatus: 'checked_ok' },
      { itemId: String(stockTable._id), item: stockTable.name, itemCode: stockTable.itemCode, category: stockTable.category, quantity: 16, unitPrice: stockTable.rentalPricePerDay, notes: 'Returned', status: 'returned', postEventStatus: 'checked_ok' },
      { itemId: String(stockAudio._id), item: stockAudio.name, itemCode: stockAudio.itemCode, category: stockAudio.category, quantity: 1, unitPrice: stockAudio.rentalPricePerDay, notes: 'Mic missing', status: 'returned', postEventStatus: 'incident_reported' }
    ],
    cookingLocation: 'commissary',
    ingredientStatus: 'prepared',
    linenRequirements: [
      { itemId: String(linenTablecloth._id), type: linenTablecloth.name, itemCode: linenTablecloth.itemCode, category: linenTablecloth.category, size: linenTablecloth.size, material: linenTablecloth.material, color: linenTablecloth.color, quantity: 16, unitPrice: 80, notes: 'Returned from laundry', status: 'returned', postEventStatus: 'checked_ok' },
      { itemId: String(linenNapkin._id), type: linenNapkin.name, itemCode: linenNapkin.itemCode, category: linenNapkin.category, size: linenNapkin.size, material: linenNapkin.material, color: linenNapkin.color, quantity: 140, unitPrice: 18, notes: 'Two stained napkins', status: 'returned', postEventStatus: 'incident_reported' }
    ],
    linenStatus: 'returned',
    assignedSupervisor: users.banquet_supervisor?._id || null,
    banquetAssignment: {
      serviceGuestCount: 140,
      staffingPlan: { head_captain: 1, service_staff: 10, food_runner: 1, busser: 2, bartender: 1, setup_crew: 2 },
      assignments: [
        { staff: banquetStaff[0]._id, assignmentRole: 'head_captain' },
        { staff: banquetStaff[1]._id, assignmentRole: 'service_staff' },
        { staff: banquetStaff[2]._id, assignmentRole: 'service_staff' },
        { staff: banquetStaff[3]._id, assignmentRole: 'food_runner' },
        { staff: banquetStaff[4]._id, assignmentRole: 'busser' },
        { staff: banquetStaff[5]._id, assignmentRole: 'bartender' },
        { staff: banquetStaff[6]._id, assignmentRole: 'setup_crew' }
      ],
      updatedAt: yesterday,
      updatedBy: users.banquet_supervisor?._id || null
    },
    submittedAt: lastWeek,
    approvedAt: addDays(lastWeek, 1),
    departmentProgress: { sales: 100, accounting: 100, logistics: 100, banquet: 100, kitchen: 100, purchasing: 100, creative: 100, linen: 100 },
    sectionConfirmations,
    internalNotes: `${DEMO_TAG} Completed event for post-event and finance reports.`
  })).doc;

  console.log('  ensured 4 report contracts');

  console.log('\nRefreshing report demo procurement requests...');
  await ProcurementRequest.deleteMany({ requestNumber: /^RPT-PR-2606-/ });
  const procurementSeeds = [
    {
      requestNumber: 'RPT-PR-2606-0001',
      status: 'awaiting_accounting_approval',
      department: 'linen',
      requestType: 'purchase',
      source: 'contract_shortage',
      sourceSection: 'linen',
      contract: receivableCorporate._id,
      eventDate: receivableCorporate.eventDate,
      neededBy: addDays(today, 2),
      inventoryModel: 'LinenInventory',
      inventoryItem: linenNapkin._id,
      itemName: linenNapkin.name,
      itemCode: linenNapkin.itemCode,
      itemCategory: linenNapkin.category,
      requestedQuantity: 100,
      shortageQuantity: 68,
      requestReason: `${DEMO_TAG} Low napkin availability for corporate contract.`,
      requestNotes: 'Accounting should review budget before Purchasing buys replacement napkins.',
      quote: {
        supplier: supplierLinen._id,
        supplierName: supplierLinen.name,
        supplierContact: `${supplierLinen.contactPerson} | ${supplierLinen.phone}`,
        quotedUnitPrice: 65,
        quotedTotal: 6500,
        notes: 'Quoted using preferred linen supplier.',
        submittedAt: now,
        submittedBy: purchasingId
      },
      accounting: { status: 'pending' },
      createdBy: users.linen?._id || purchasingId,
      updatedBy: purchasingId
    },
    {
      requestNumber: 'RPT-PR-2606-0002',
      status: 'approved',
      department: 'creative',
      requestType: 'rental',
      source: 'contract_shortage',
      sourceSection: 'creative',
      contract: paidWedding._id,
      eventDate: paidWedding.eventDate,
      neededBy: addDays(today, 1),
      inventoryModel: 'CreativeInventory',
      inventoryItem: creativeLights._id,
      itemName: creativeLights.name,
      itemCode: creativeLights.itemCode,
      itemCategory: creativeLights.category,
      requestedQuantity: 8,
      shortageQuantity: 8,
      requestReason: `${DEMO_TAG} Extra warm lights needed for garden styling.`,
      requestNotes: 'Approved demo rental request.',
      quote: {
        supplier: supplierCreative._id,
        supplierName: supplierCreative.name,
        supplierContact: `${supplierCreative.contactPerson} | ${supplierCreative.phone}`,
        quotedUnitPrice: 400,
        quotedTotal: 3200,
        notes: 'One-day rental for bistro lights.',
        submittedAt: now,
        submittedBy: purchasingId
      },
      accounting: {
        status: 'approved',
        reviewedAt: today,
        reviewedBy: accountingId,
        notes: 'Approved for event readiness.',
        reviewChecklist: { inventoryNeedValidated: true, supplierVerified: true, pricingReviewed: true, timelineConfirmed: true }
      },
      createdBy: users.creative?._id || purchasingId,
      updatedBy: accountingId
    },
    {
      requestNumber: 'RPT-PR-2606-0003',
      status: 'proof_submitted',
      department: 'stockroom',
      requestType: 'purchase',
      source: 'inventory_low_stock',
      sourceSection: 'stockroom',
      contract: paidWedding._id,
      eventDate: paidWedding.eventDate,
      neededBy: addDays(today, 3),
      inventoryModel: 'StockroomInventory',
      inventoryItem: stockAudio._id,
      itemName: 'Wireless Microphone Replacement',
      itemCode: stockAudio.itemCode,
      itemCategory: 'Equipment',
      requestedQuantity: 2,
      shortageQuantity: 2,
      requestReason: `${DEMO_TAG} Replacement microphone needed after equipment incident.`,
      requestNotes: 'Proof has been uploaded and is waiting for accounting confirmation.',
      quote: {
        supplier: supplierStockroom._id,
        supplierName: supplierStockroom.name,
        supplierContact: `${supplierStockroom.contactPerson} | ${supplierStockroom.phone}`,
        quotedUnitPrice: 2800,
        quotedTotal: 5600,
        notes: 'Replacement wireless microphones.',
        submittedAt: now,
        submittedBy: purchasingId
      },
      accounting: {
        status: 'approved',
        reviewedAt: today,
        reviewedBy: accountingId,
        notes: 'Approved due to equipment shortage.',
        reviewChecklist: { inventoryNeedValidated: true, supplierVerified: true, pricingReviewed: true, timelineConfirmed: true }
      },
      fulfillment: {
        receivedQuantity: 2,
        invoiceReference: 'PRV-RPT-0003',
        notes: 'Provisional receipt uploaded for accounting confirmation.',
        attachments: ['/demo/proofs/rpt-pr-2606-0003.pdf'],
        confirmationStatus: 'pending',
        fulfilledAt: today,
        fulfilledBy: purchasingId,
        inventoryUpdated: false
      },
      createdBy: users.stockroom?._id || purchasingId,
      updatedBy: purchasingId
    },
    {
      requestNumber: 'RPT-PR-2606-0004',
      status: 'fulfilled',
      department: 'linen',
      requestType: 'purchase',
      source: 'manual',
      sourceSection: 'linen',
      contract: completedAnniversary._id,
      eventDate: completedAnniversary.eventDate,
      neededBy: yesterday,
      inventoryModel: 'LinenInventory',
      inventoryItem: linenSash._id,
      itemName: linenSash.name,
      itemCode: linenSash.itemCode,
      itemCategory: linenSash.category,
      requestedQuantity: 50,
      shortageQuantity: 25,
      requestReason: `${DEMO_TAG} Replenish stained chair sashes.`,
      requestNotes: 'Completed purchase for reporting.',
      quote: {
        supplier: supplierLinen._id,
        supplierName: supplierLinen.name,
        supplierContact: `${supplierLinen.contactPerson} | ${supplierLinen.phone}`,
        quotedUnitPrice: 75,
        quotedTotal: 3750,
        notes: 'Purchased replacement sashes.',
        submittedAt: yesterday,
        submittedBy: purchasingId
      },
      accounting: {
        status: 'approved',
        reviewedAt: yesterday,
        reviewedBy: accountingId,
        notes: 'Approved and confirmed.',
        reviewChecklist: { inventoryNeedValidated: true, supplierVerified: true, pricingReviewed: true, timelineConfirmed: true }
      },
      fulfillment: {
        receivedQuantity: 50,
        invoiceReference: 'PRV-RPT-0004',
        notes: 'Receipt confirmed and inventory updated.',
        attachments: ['/demo/proofs/rpt-pr-2606-0004.pdf'],
        confirmationStatus: 'confirmed',
        confirmedAt: today,
        confirmedBy: accountingId,
        confirmationNotes: 'Amount matched approved budget.',
        fulfilledAt: today,
        fulfilledBy: purchasingId,
        inventoryUpdated: true,
        inventoryUpdateSummary: 'Added 50 chair sashes to linen inventory.'
      },
      createdBy: users.linen?._id || purchasingId,
      updatedBy: accountingId
    },
    {
      requestNumber: 'RPT-PR-2606-0005',
      status: 'rejected',
      department: 'creative',
      requestType: 'purchase',
      source: 'manual',
      sourceSection: 'creative',
      contract: draftBirthday._id,
      eventDate: draftBirthday.eventDate,
      neededBy: nextMonth,
      inventoryModel: 'CreativeInventory',
      inventoryItem: creativeCenterpiece._id,
      itemName: 'Premium Acrylic Photo Wall',
      itemCode: 'RPT-CR-CUSTOM-001',
      itemCategory: 'Backdrop',
      requestedQuantity: 1,
      shortageQuantity: 0,
      requestReason: `${DEMO_TAG} Custom backdrop requested before final design approval.`,
      requestNotes: 'Rejected because contract is still draft and design is not final.',
      quote: {
        supplier: supplierCreative._id,
        supplierName: supplierCreative.name,
        supplierContact: `${supplierCreative.contactPerson} | ${supplierCreative.phone}`,
        quotedUnitPrice: 22000,
        quotedTotal: 22000,
        notes: 'Custom acrylic backdrop estimate.',
        submittedAt: today,
        submittedBy: purchasingId
      },
      accounting: {
        status: 'rejected',
        reviewedAt: today,
        reviewedBy: accountingId,
        rejectionReason: 'Budget not approved while contract remains draft.',
        reviewChecklist: { inventoryNeedValidated: false, supplierVerified: true, pricingReviewed: true, timelineConfirmed: false }
      },
      createdBy: users.creative?._id || purchasingId,
      updatedBy: accountingId
    }
  ];

  await ProcurementRequest.insertMany(procurementSeeds);
  console.log(`  created ${procurementSeeds.length} report procurement requests`);

  console.log('\nRefreshing report demo incidents...');
  await Incident.deleteMany({ description: new RegExp('\\[REPORT-DEMO\\]') });
  const incidentSeeds = [
    {
      contract: completedAnniversary._id,
      department: 'linen',
      incidentType: 'burnt_cloth',
      description: `${DEMO_TAG} Two napkins returned with burn marks after candle setup.`,
      sourceSection: 'linen',
      inventoryItemName: linenNapkin.name,
      inventoryItemCode: linenNapkin.itemCode,
      affectedQuantity: 2,
      eventDate: completedAnniversary.eventDate,
      reportedBy: users.linen?._id || adminId,
      reportedAt: atTime(today, 8, 0),
      severity: 'medium',
      status: 'in_review',
      attachments: ['/demo/incidents/linen-burn-photo.jpg'],
      departmentNotified: [{ department: 'linen', notifiedAt: today }, { department: 'accounting', notifiedAt: today }]
    },
    {
      contract: completedAnniversary._id,
      department: 'creative',
      incidentType: 'damaged_equipment',
      description: `${DEMO_TAG} One gold centerpiece cracked during post-event pull-out.`,
      sourceSection: 'creative',
      inventoryItemName: creativeCenterpiece.name,
      inventoryItemCode: creativeCenterpiece.itemCode,
      affectedQuantity: 1,
      eventDate: completedAnniversary.eventDate,
      reportedBy: users.creative?._id || adminId,
      reportedAt: atTime(today, 8, 30),
      severity: 'low',
      status: 'open',
      attachments: ['/demo/incidents/centerpiece-crack.jpg'],
      departmentNotified: [{ department: 'creative', notifiedAt: today }]
    },
    {
      contract: completedAnniversary._id,
      department: 'logistics',
      incidentType: 'missing_item',
      description: `${DEMO_TAG} One wireless microphone missing after logistics pull-out.`,
      sourceSection: 'stockroom',
      inventoryItemName: stockAudio.name,
      inventoryItemCode: stockAudio.itemCode,
      affectedQuantity: 1,
      eventDate: completedAnniversary.eventDate,
      reportedBy: users.stockroom?._id || adminId,
      reportedAt: atTime(today, 9, 0),
      severity: 'high',
      status: 'in_review',
      attachments: ['/demo/incidents/missing-mic.pdf'],
      departmentNotified: [{ department: 'stockroom', notifiedAt: today }, { department: 'logistics', notifiedAt: today }]
    },
    {
      contract: paidWedding._id,
      department: 'kitchen',
      incidentType: 'food_spoilage',
      description: `${DEMO_TAG} Small batch of vegetables rejected during prep quality check.`,
      sourceSection: 'kitchen',
      inventoryItemName: 'Mixed Vegetables',
      inventoryItemCode: 'RPT-KT-VEG-001',
      affectedQuantity: 5,
      eventDate: paidWedding.eventDate,
      reportedBy: users.kitchen?._id || adminId,
      reportedAt: atTime(today, 9, 30),
      severity: 'medium',
      status: 'resolved',
      resolution: 'Replaced with fresh stock before event dispatch.',
      resolvedAt: atTime(today, 10, 30),
      resolvedBy: users.kitchen?._id || adminId,
      attachments: ['/demo/incidents/veg-replacement.jpg'],
      departmentNotified: [{ department: 'kitchen', notifiedAt: today }]
    },
    {
      contract: paidWedding._id,
      department: 'banquet',
      incidentType: 'staff_issue',
      description: `${DEMO_TAG} One assigned service staff called in sick; replacement assigned from on-call pool.`,
      sourceSection: 'banquet',
      inventoryItemName: 'Service Staff Replacement',
      affectedQuantity: 1,
      eventDate: paidWedding.eventDate,
      reportedBy: users.banquet_supervisor?._id || adminId,
      reportedAt: atTime(today, 10, 0),
      severity: 'low',
      status: 'resolved',
      resolution: 'On-call waiter assigned before call time.',
      resolvedAt: atTime(today, 10, 15),
      resolvedBy: users.banquet_supervisor?._id || adminId,
      attachments: [],
      departmentNotified: [{ department: 'banquet', notifiedAt: today }]
    },
    {
      contract: receivableCorporate._id,
      department: 'purchasing',
      incidentType: 'other',
      description: `${DEMO_TAG} Supplier confirmation delayed for replacement napkin request.`,
      sourceSection: 'purchasing',
      inventoryItemName: linenNapkin.name,
      inventoryItemCode: linenNapkin.itemCode,
      affectedQuantity: 100,
      eventDate: receivableCorporate.eventDate,
      reportedBy: users.purchasing?._id || adminId,
      reportedAt: atTime(today, 11, 0),
      severity: 'medium',
      status: 'open',
      attachments: ['/demo/incidents/supplier-delay.pdf'],
      departmentNotified: [{ department: 'purchasing', notifiedAt: today }, { department: 'accounting', notifiedAt: today }]
    }
  ];

  await Incident.insertMany(incidentSeeds);
  console.log(`  created ${incidentSeeds.length} report incidents`);

  console.log('\nReport demo data ready.');
  console.log('  Contracts: RPT-CON-2606-0001 to RPT-CON-2606-0004');
  console.log('  Menu tastings: RPT-TASTE-2606-0001 to RPT-TASTE-2606-0003');
  console.log('  Procurement: RPT-PR-2606-0001 to RPT-PR-2606-0005');
  console.log('  Incidents: 6 current-period report incidents');
}

async function main() {
  try {
    await seedReportDemoData();
  } catch (error) {
    console.error('\nError seeding report demo data:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

main();
