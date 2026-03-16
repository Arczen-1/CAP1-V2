#!/usr/bin/env node

/**
 * Non-destructive demo seeder.
 *
 * Creates or updates a small set of demo-only records without deleting
 * existing data.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const MenuTasting = require('./models/MenuTasting');
const Contract = require('./models/Contract');
const CreativeInventory = require('./models/CreativeInventory');
const StockroomInventory = require('./models/StockroomInventory');
const LinenInventory = require('./models/LinenInventory');
const KitchenInventory = require('./models/KitchenInventory');
const { Driver, Truck } = require('./models/Logistics');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/juancarlos';
const DEMO_TAG = '[DEMO-SEED-2]';

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

const getEndOfWeek = (date) => {
  const next = new Date(date);
  const daysUntilSunday = (7 - next.getDay()) % 7;
  next.setDate(next.getDate() + daysUntilSunday);
  return next;
};

const getThisWeekDate = (preferredOffset, fallbackOffset = 0) => {
  const today = startOfToday();
  const weekEnd = getEndOfWeek(today);
  const preferred = addDays(today, preferredOffset);

  if (preferred <= weekEnd) {
    return preferred;
  }

  const fallback = addDays(today, fallbackOffset);
  return fallback <= weekEnd ? fallback : weekEnd;
};

const formatDate = (date) => date.toLocaleDateString('en-PH', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const createConfirmedSection = (confirmedBy, confirmedAt) => ({
  confirmed: true,
  confirmedAt,
  confirmedBy,
});

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
  const existingUser = await User.findOne({ email: userData.email.toLowerCase() });

  if (existingUser) {
    return { doc: existingUser, created: false };
  }

  const user = new User(userData);
  await user.save();
  return { doc: user, created: true };
};

async function seedDemoData() {
  const today = startOfToday();
  const tastingDay = getThisWeekDate(1, 0);
  const eventDay = getThisWeekDate(2, 1);
  const closeReadyEventDay = addDays(today, -2);
  const preferredEventDate = addDays(addMonths(today, 6), 7);
  const signingDate = addDays(today, -5);
  const approvalDate = addDays(today, -3);
  const closeReadySigningDate = addDays(today, -21);
  const closeReadyApprovalDate = addDays(today, -18);
  const closeReadyFinalPaymentDate = addDays(today, -7);

  console.log('Connecting to MongoDB...');
  console.log('URI:', MONGODB_URI.replace(/:([^@]+)@/, ':****@'));
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const demoUsers = [
    { name: 'Sales Manager', email: 'sales@juancarlos.com', password: 'password123', role: 'sales', department: 'Sales' },
    { name: 'Accounting Manager', email: 'accounting@juancarlos.com', password: 'password123', role: 'accounting', department: 'Accounting' },
    { name: 'Logistics Manager', email: 'logistics@juancarlos.com', password: 'password123', role: 'logistics', department: 'Logistics' },
    { name: 'Kitchen Manager', email: 'kitchen@juancarlos.com', password: 'password123', role: 'kitchen', department: 'Kitchen' },
    { name: 'Creative Manager', email: 'creative@juancarlos.com', password: 'password123', role: 'creative', department: 'Creative' },
    { name: 'Linen Manager', email: 'linen@juancarlos.com', password: 'password123', role: 'linen', department: 'Linen' },
    { name: 'System Admin', email: 'admin@juancarlos.com', password: 'admin123', role: 'admin', department: 'Admin' },
  ];

  const ensuredUsers = {};
  console.log('\nEnsuring demo users...');
  for (const userData of demoUsers) {
    const result = await ensureUser(userData);
    ensuredUsers[userData.role] = result.doc;
    console.log(`  ${result.created ? 'created' : 'kept'} user ${userData.email}`);
  }

  const adminUser = ensuredUsers.admin;
  const salesUser = ensuredUsers.sales;

  console.log('\nEnsuring demo logistics resources...');
  const driverOne = (await upsertDocument(Driver, { driverId: 'DRV-DEMO-0001' }, {
    driverId: 'DRV-DEMO-0001',
    firstName: 'Ramon',
    lastName: 'Delos Santos',
    fullName: 'Ramon Delos Santos',
    email: 'ramon.demo@juancarlos.com',
    phone: '09170001001',
    licenseNumber: 'D00-26-000001',
    licenseType: 'professional',
    licenseExpiry: addMonths(today, 12),
    employmentType: 'full_time',
    status: 'active',
    yearsOfExperience: 8,
    notes: `${DEMO_TAG} Demo driver for same-week preparation tests.`,
    createdBy: adminUser?._id || null,
    updatedBy: adminUser?._id || null,
  })).doc;

  const driverTwo = (await upsertDocument(Driver, { driverId: 'DRV-DEMO-0002' }, {
    driverId: 'DRV-DEMO-0002',
    firstName: 'Leo',
    lastName: 'Navarro',
    fullName: 'Leo Navarro',
    email: 'leo.demo@juancarlos.com',
    phone: '09170001002',
    licenseNumber: 'D00-26-000002',
    licenseType: 'professional',
    licenseExpiry: addMonths(today, 10),
    employmentType: 'contractual',
    status: 'active',
    yearsOfExperience: 5,
    notes: `${DEMO_TAG} Backup demo driver for same-week preparation tests.`,
    createdBy: adminUser?._id || null,
    updatedBy: adminUser?._id || null,
  })).doc;

  const truckOne = (await upsertDocument(Truck, { truckId: 'TRK-DEMO-0001' }, {
    truckId: 'TRK-DEMO-0001',
    plateNumber: 'DEM-1001',
    truckType: 'closed_van',
    brand: 'Isuzu',
    model: 'NQR',
    year: 2022,
    color: 'White',
    capacity: {
      weight: 3500,
      volume: 18,
      dimensions: { length: 520, width: 210, height: 220 },
    },
    ownership: 'owned',
    status: 'available',
    registrationDate: addMonths(today, -10),
    registrationExpiry: addMonths(today, 2),
    assignedDriver: driverOne._id,
    notes: `${DEMO_TAG} Main demo truck for weekly prep runs.`,
    createdBy: adminUser?._id || null,
    updatedBy: adminUser?._id || null,
  })).doc;

  const truckTwo = (await upsertDocument(Truck, { truckId: 'TRK-DEMO-0002' }, {
    truckId: 'TRK-DEMO-0002',
    plateNumber: 'DEM-1002',
    truckType: 'refrigerated',
    brand: 'Fuso',
    model: 'Canter',
    year: 2021,
    color: 'Silver',
    capacity: {
      weight: 4200,
      volume: 22,
      dimensions: { length: 560, width: 220, height: 230 },
    },
    ownership: 'owned',
    status: 'available',
    registrationDate: addMonths(today, -8),
    registrationExpiry: addMonths(today, 4),
    assignedDriver: driverTwo._id,
    notes: `${DEMO_TAG} Secondary demo truck for weekly prep runs.`,
    createdBy: adminUser?._id || null,
    updatedBy: adminUser?._id || null,
  })).doc;

  driverOne.assignedTrucks = [truckOne._id];
  driverOne.updatedBy = adminUser?._id || null;
  await driverOne.save();

  driverTwo.assignedTrucks = [truckTwo._id];
  driverTwo.updatedBy = adminUser?._id || null;
  await driverTwo.save();

  console.log('  ensured 2 demo drivers and 2 demo trucks');

  console.log('\nEnsuring demo inventory...');
  const creativeBackdrop = (await upsertDocument(CreativeInventory, { itemCode: 'CR-DEMO-2603-0001' }, {
    itemCode: 'CR-DEMO-2603-0001',
    name: 'Ivory Ceremony Backdrop',
    category: 'Backdrop',
    subCategory: 'Wedding Backdrop',
    description: 'Freestanding ivory backdrop for ceremony or stage setup.',
    quantity: 4,
    availableQuantity: 4,
    condition: 'excellent',
    storageLocation: 'Creative Room / Bay A',
    dimensions: { length: 320, width: 80, height: 250, weight: 20 },
    acquisition: { type: 'custom_made', date: addMonths(today, -6), cost: 32000, supplier: 'JC Fabrication Team' },
    status: 'available',
    notes: `${DEMO_TAG} Demo backdrop item.`,
    createdBy: adminUser?._id || null,
    updatedBy: adminUser?._id || null,
  })).doc;

  const creativeLights = (await upsertDocument(CreativeInventory, { itemCode: 'CR-DEMO-2603-0002' }, {
    itemCode: 'CR-DEMO-2603-0002',
    name: 'Warm Bistro Lights',
    category: 'Lighting',
    subCategory: 'Ambient Lighting',
    description: 'Outdoor-safe string lighting for reception ambiance.',
    quantity: 24,
    availableQuantity: 24,
    condition: 'good',
    storageLocation: 'Creative Room / Lighting Rack',
    dimensions: { length: 1200, width: 10, height: 10, weight: 2 },
    acquisition: { type: 'purchased', date: addMonths(today, -9), cost: 2900, supplier: 'Lumina Event Supply' },
    status: 'available',
    notes: `${DEMO_TAG} Demo lighting item.`,
    createdBy: adminUser?._id || null,
    updatedBy: adminUser?._id || null,
  })).doc;

  const creativeCenterpiece = (await upsertDocument(CreativeInventory, { itemCode: 'CR-DEMO-2603-0003' }, {
    itemCode: 'CR-DEMO-2603-0003',
    name: 'Gold Glass Centerpiece Set',
    category: 'Table Decor',
    subCategory: 'Centerpiece',
    description: 'Gold-framed glass vase centerpiece for reception tables.',
    quantity: 30,
    availableQuantity: 30,
    condition: 'excellent',
    storageLocation: 'Creative Room / Shelf C',
    dimensions: { length: 35, width: 35, height: 55, weight: 2 },
    acquisition: { type: 'purchased', date: addMonths(today, -7), cost: 3500, supplier: 'Elegant Tablescapes Co.' },
    status: 'available',
    notes: `${DEMO_TAG} Demo centerpiece item.`,
    createdBy: adminUser?._id || null,
    updatedBy: adminUser?._id || null,
  })).doc;

  const linenTablecloth = (await upsertDocument(LinenInventory, { itemCode: 'LN-DEMO-2603-0001' }, {
    itemCode: 'LN-DEMO-2603-0001',
    name: 'White Round Tablecloth',
    category: 'Tablecloth',
    size: 'round_72',
    material: 'Polyester',
    color: 'White',
    quantity: 160,
    availableQuantity: 160,
    minimumStock: 20,
    condition: 'excellent',
    washCount: 20,
    storageLocation: 'Linen Room / Rack A',
    status: 'available',
    acquisition: { date: addMonths(today, -5), cost: 480, supplier: 'Linen Source Manila' },
    notes: `${DEMO_TAG} Demo tablecloth stock.`,
    createdBy: adminUser?._id || null,
    updatedBy: adminUser?._id || null,
  })).doc;

  const linenNapkin = (await upsertDocument(LinenInventory, { itemCode: 'LN-DEMO-2603-0002' }, {
    itemCode: 'LN-DEMO-2603-0002',
    name: 'Champagne Satin Napkin',
    category: 'Napkin',
    size: 'medium',
    material: 'Satin',
    color: 'Champagne',
    quantity: 500,
    availableQuantity: 500,
    minimumStock: 60,
    condition: 'good',
    washCount: 35,
    storageLocation: 'Linen Room / Drawer B',
    status: 'available',
    acquisition: { date: addMonths(today, -8), cost: 60, supplier: 'Fabrix Events Supply' },
    notes: `${DEMO_TAG} Demo napkin stock.`,
    createdBy: adminUser?._id || null,
    updatedBy: adminUser?._id || null,
  })).doc;

  const linenSash = (await upsertDocument(LinenInventory, { itemCode: 'LN-DEMO-2603-0003' }, {
    itemCode: 'LN-DEMO-2603-0003',
    name: 'Dusty Blue Chair Sash',
    category: 'Sash',
    size: 'custom',
    material: 'Taffeta',
    color: 'Dusty Blue',
    quantity: 320,
    availableQuantity: 320,
    minimumStock: 40,
    condition: 'good',
    washCount: 28,
    storageLocation: 'Linen Room / Bin S1',
    status: 'available',
    acquisition: { date: addMonths(today, -4), cost: 75, supplier: 'Elegant Textiles Co.' },
    notes: `${DEMO_TAG} Demo chair sash stock.`,
    createdBy: adminUser?._id || null,
    updatedBy: adminUser?._id || null,
  })).doc;

  const stockroomChair = (await upsertDocument(StockroomInventory, { itemCode: 'CHR-DEMO-2603-0001' }, {
    itemCode: 'CHR-DEMO-2603-0001',
    name: 'Banquet Chair - White',
    category: 'Chair',
    subcategory: 'Banquet Chair',
    description: 'White banquet chair for formal events.',
    quantity: 420,
    availableQuantity: 420,
    reservedQuantity: 0,
    minimumStock: 50,
    condition: 'good',
    status: 'available',
    dimensions: { length: 42, width: 42, height: 90, weight: 4 },
    storageLocation: { warehouse: 'Main Warehouse', section: 'Chairs', shelf: 'Rack A', bin: 'Bay 2' },
    purchasePrice: 1900,
    rentalPricePerDay: 90,
    replacementCost: 2300,
    supplier: { name: 'Event Essentials PH', contact: '09171234567', email: 'sales@eventessentials.ph' },
    purchaseDate: addMonths(today, -10),
    notes: `${DEMO_TAG} Demo chair stock.`,
  })).doc;

  const stockroomTable = (await upsertDocument(StockroomInventory, { itemCode: 'TAB-DEMO-2603-0001' }, {
    itemCode: 'TAB-DEMO-2603-0001',
    name: 'Round Banquet Table 60in',
    category: 'Table',
    subcategory: 'Dining Table',
    description: 'Round banquet table that seats 8 to 10 guests.',
    quantity: 60,
    availableQuantity: 60,
    reservedQuantity: 0,
    minimumStock: 10,
    condition: 'good',
    status: 'available',
    dimensions: { length: 152, width: 152, height: 76, weight: 19 },
    storageLocation: { warehouse: 'Main Warehouse', section: 'Tables', shelf: 'Floor', bin: 'Zone B' },
    purchasePrice: 5400,
    rentalPricePerDay: 360,
    replacementCost: 6800,
    supplier: { name: 'Metro Event Furnishings', contact: '09181112223', email: 'orders@metrofurnishings.ph' },
    purchaseDate: addMonths(today, -11),
    notes: `${DEMO_TAG} Demo table stock.`,
  })).doc;

  const stockroomTent = (await upsertDocument(StockroomInventory, { itemCode: 'TEN-DEMO-2603-0001' }, {
    itemCode: 'TEN-DEMO-2603-0001',
    name: 'Reception Tent 10x20m',
    category: 'Tent',
    subcategory: 'Outdoor Tent',
    description: 'Weather-ready tent for outdoor receptions.',
    quantity: 5,
    availableQuantity: 5,
    reservedQuantity: 0,
    minimumStock: 1,
    condition: 'excellent',
    status: 'available',
    dimensions: { length: 2000, width: 1000, height: 420, weight: 450 },
    storageLocation: { warehouse: 'Outdoor Yard', section: 'Tent Storage', shelf: 'Lot 1', bin: 'Container B' },
    purchasePrice: 185000,
    rentalPricePerDay: 9800,
    replacementCost: 230000,
    supplier: { name: 'Summit Structures', contact: '09998887766', email: 'support@summitstructures.ph' },
    purchaseDate: addMonths(today, -14),
    notes: `${DEMO_TAG} Demo tent stock.`,
  })).doc;

  const stockroomAudio = (await upsertDocument(StockroomInventory, { itemCode: 'EQU-DEMO-2603-0001' }, {
    itemCode: 'EQU-DEMO-2603-0001',
    name: 'Portable PA System',
    category: 'Equipment',
    subcategory: 'Audio',
    description: 'Portable speaker and wireless microphone set.',
    quantity: 10,
    availableQuantity: 10,
    reservedQuantity: 0,
    minimumStock: 2,
    condition: 'good',
    status: 'available',
    storageLocation: { warehouse: 'AV Room', section: 'Audio', shelf: 'Shelf 2', bin: 'Case 3' },
    purchasePrice: 26000,
    rentalPricePerDay: 2000,
    replacementCost: 32000,
    purchaseDate: addMonths(today, -9),
    notes: `${DEMO_TAG} Demo PA system stock.`,
  })).doc;

  await upsertDocument(KitchenInventory, { itemCode: 'ING-DEMO-2603-0001' }, {
    itemCode: 'ING-DEMO-2603-0001',
    name: 'Chicken Fillet',
    category: 'Ingredient',
    subcategory: 'Protein',
    description: 'Frozen chicken fillet for banquet menu prep.',
    quantity: 180,
    availableQuantity: 180,
    reservedQuantity: 0,
    minimumStock: 20,
    unit: 'kg',
    condition: 'good',
    status: 'available',
    storageLocation: { area: 'Cold Storage', section: 'Freezer 1', container: 'Shelf A' },
    purchasePrice: 240,
    replacementCost: 260,
    expiryDate: addDays(today, 45),
    batchNumber: 'DEMO-CHK-2603',
    notes: `${DEMO_TAG} Demo kitchen ingredient stock.`,
  });

  await upsertDocument(KitchenInventory, { itemCode: 'ING-DEMO-2603-0002' }, {
    itemCode: 'ING-DEMO-2603-0002',
    name: 'Mixed Vegetables',
    category: 'Ingredient',
    subcategory: 'Vegetable',
    description: 'Prepped mixed vegetables for buffet service.',
    quantity: 95,
    availableQuantity: 95,
    reservedQuantity: 0,
    minimumStock: 12,
    unit: 'kg',
    condition: 'good',
    status: 'available',
    storageLocation: { area: 'Cold Storage', section: 'Chiller', container: 'Tray 4' },
    purchasePrice: 160,
    replacementCost: 175,
    expiryDate: addDays(today, 20),
    batchNumber: 'DEMO-VEG-2603',
    notes: `${DEMO_TAG} Demo vegetable stock.`,
  });

  await upsertDocument(KitchenInventory, { itemCode: 'COO-DEMO-2603-0001' }, {
    itemCode: 'COO-DEMO-2603-0001',
    name: 'Heavy Duty Stock Pot 40L',
    category: 'Cookware',
    subcategory: 'Stock Pot',
    description: 'Large stock pot for commissary prep.',
    quantity: 12,
    availableQuantity: 12,
    reservedQuantity: 0,
    minimumStock: 2,
    unit: 'piece',
    condition: 'good',
    status: 'available',
    brand: 'Vulcan',
    storageLocation: { area: 'Main Kitchen', section: 'Cookware Shelf', container: 'Lower Rack' },
    purchasePrice: 7200,
    replacementCost: 8500,
    notes: `${DEMO_TAG} Demo cookware stock.`,
  });

  console.log('  ensured demo creative, linen, stockroom, and kitchen inventory');

  console.log('\nEnsuring demo menu tasting...');
  const tastingResult = await upsertDocument(MenuTasting, { tastingNumber: 'DEMO-TASTE-THIS-WEEK' }, {
    tastingNumber: 'DEMO-TASTE-THIS-WEEK',
    clientName: 'Sofia Reyes',
    clientEmail: 'sofia.reyes.demo@email.com',
    clientPhone: '09171230001',
    clientAddress: {
      street: '88 Acacia Street',
      city: 'Lipa City',
      province: 'Batangas',
      zipCode: '4217',
    },
    eventType: 'birthday',
    expectedGuests: 120,
    preferredEventDate,
    tastingDate: atTime(tastingDay, 14, 0),
    tastingTime: '2:00 PM',
    numberOfPax: 4,
    menuItems: [
      { category: 'Appetizer', itemName: 'Caesar Salad', selected: true, notes: '' },
      { category: 'Main Course', itemName: 'Buttered Chicken', selected: true, notes: '' },
      { category: 'Dessert', itemName: 'Mango Float', selected: true, notes: '' },
    ],
    status: 'confirmed',
    contract: null,
    contractCreated: false,
    assignedStaff: salesUser?._id || null,
    clientNotes: `${DEMO_TAG} Demo tasting booking scheduled for this week.`,
    internalNotes: `${DEMO_TAG} Keep this tasting available for demo contract creation.`,
  });

  console.log(`  ${tastingResult.created ? 'created' : 'updated'} tasting DEMO-TASTE-THIS-WEEK`);

  const confirmedSections = {
    details: createConfirmedSection(adminUser?._id || null, signingDate),
    menu: createConfirmedSection(adminUser?._id || null, signingDate),
    preferences: createConfirmedSection(adminUser?._id || null, signingDate),
    creative: createConfirmedSection(adminUser?._id || null, signingDate),
    linen: createConfirmedSection(adminUser?._id || null, signingDate),
    stockroom: createConfirmedSection(adminUser?._id || null, signingDate),
    logistics: createConfirmedSection(adminUser?._id || null, signingDate),
  };

  console.log('\nEnsuring demo contracts...');
  const approvedContract = await upsertDocument(Contract, { contractNumber: 'DEMO-CONTRACT-OPS-THIS-WEEK' }, {
    contractNumber: 'DEMO-CONTRACT-OPS-THIS-WEEK',
    status: 'approved',
    currentDepartment: 'all',
    menuTasting: null,
    clientSigned: true,
    clientSignedAt: signingDate,
    clientName: 'Camille and Andre Navarro',
    clientContact: '09171230002',
    clientEmail: 'camille.andre.demo@email.com',
    clientAddress: {
      street: '45 Sampaguita Avenue',
      city: 'Lipa City',
      province: 'Batangas',
      zipCode: '4217',
    },
    clientType: 'wedding',
    eventDate: atTime(eventDay, 16, 0),
    bookingDate: addMonths(today, -2),
    venue: {
      name: 'Juan Carlo Garden Pavilion',
      address: 'Lipa City, Batangas',
      contact: '09171235555',
      notes: `${DEMO_TAG} Same-week approved contract for preparation testing.`,
    },
    eventType: 'wedding reception',
    packageSelected: 'premium',
    menuDetails: [
      { category: 'Main Course', item: 'Buttered Chicken', quantity: 180, confirmed: true },
      { category: 'Main Course', item: 'Beef Caldereta', quantity: 180, confirmed: true },
      { category: 'Side', item: 'Yang Chow Fried Rice', quantity: 180, confirmed: true },
      { category: 'Dessert', item: 'Mango Float', quantity: 180, confirmed: true },
    ],
    totalPacks: 180,
    preferredColor: 'Ivory and Champagne',
    napkinType: 'Satin',
    tableSetup: 'round',
    backdropRequirements: 'Ivory backdrop with warm lights',
    specialRequests: 'VIP head table for 12 guests',
    creativeRequirements: {
      theme: 'Classic Garden Wedding',
      colorPalette: ['Ivory', 'Champagne', 'Warm White'],
      backdropType: 'Floral Arch',
      tableCenterpieces: 'Gold glass centerpieces',
    },
    creativeAssets: [
      { itemId: String(creativeBackdrop._id), item: creativeBackdrop.name, itemCode: creativeBackdrop.itemCode, category: 'Backdrop', quantity: 1, status: 'prepared', notes: 'Main stage setup', cost: 6500, pricePerItem: 6500 },
      { itemId: String(creativeLights._id), item: creativeLights.name, itemCode: creativeLights.itemCode, category: 'Lighting', quantity: 8, status: 'pending', notes: 'Garden pathway lighting', cost: 9600, pricePerItem: 1200 },
      { itemId: String(creativeCenterpiece._id), item: creativeCenterpiece.name, itemCode: creativeCenterpiece.itemCode, category: 'Table Decor', quantity: 18, status: 'prepared', notes: 'Guest table centerpieces', cost: 21600, pricePerItem: 1200 },
    ],
    packagePrice: 171000,
    totalContractValue: 235000,
    paymentTerms: 'wedding_standard',
    downPaymentPercent: 60,
    finalPaymentPercent: 40,
    payments: [
      { amount: 235000, date: approvalDate, method: 'bank_transfer', reference: 'DEMO-FULL-235000', receiptNumber: 'OR-DEMO-OPS-0001', receiptIssuedBy: 'Juan Carlos', receiptGeneratedAt: approvalDate, status: 'completed' },
    ],
    paymentStatus: 'paid',
    logisticsAssignment: {
      driver: null,
      truck: null,
      assignmentStatus: 'pending',
      notes: `${DEMO_TAG} Leave unassigned so logistics can demo booking.`,
    },
    equipmentChecklist: [
      { itemId: String(stockroomChair._id), item: stockroomChair.name, itemCode: stockroomChair.itemCode, category: stockroomChair.category, quantity: 180, unitPrice: stockroomChair.rentalPricePerDay, notes: 'Guest chairs', status: 'pending' },
      { itemId: String(stockroomTable._id), item: stockroomTable.name, itemCode: stockroomTable.itemCode, category: stockroomTable.category, quantity: 20, unitPrice: stockroomTable.rentalPricePerDay, notes: 'Round dining tables', status: 'prepared' },
      { itemId: String(stockroomAudio._id), item: stockroomAudio.name, itemCode: stockroomAudio.itemCode, category: stockroomAudio.category, quantity: 1, unitPrice: stockroomAudio.rentalPricePerDay, notes: 'Ceremony and program audio', status: 'pending' },
      { itemId: String(stockroomTent._id), item: stockroomTent.name, itemCode: stockroomTent.itemCode, category: stockroomTent.category, quantity: 1, unitPrice: stockroomTent.rentalPricePerDay, notes: 'Weather backup tent', status: 'pending' },
    ],
    cookingLocation: 'commissary',
    ingredientStatus: 'procured',
    linenRequirements: [
      { itemId: String(linenTablecloth._id), type: linenTablecloth.name, itemCode: linenTablecloth.itemCode, category: linenTablecloth.category, size: linenTablecloth.size, material: linenTablecloth.material, color: linenTablecloth.color, quantity: 20, unitPrice: 120, notes: 'Guest table setup', status: 'prepared' },
      { itemId: String(linenNapkin._id), type: linenNapkin.name, itemCode: linenNapkin.itemCode, category: linenNapkin.category, size: linenNapkin.size, material: linenNapkin.material, color: linenNapkin.color, quantity: 180, unitPrice: 35, notes: 'Guest place settings', status: 'pending' },
      { itemId: String(linenSash._id), type: linenSash.name, itemCode: linenSash.itemCode, category: linenSash.category, size: linenSash.size, material: linenSash.material, color: linenSash.color, quantity: 180, unitPrice: 30, notes: 'Chair styling', status: 'pending' },
    ],
    linenStatus: 'pending',
    estimatedWaiters: 16,
    estimatedVehicles: 2,
    submittedAt: signingDate,
    approvedAt: approvalDate,
    departmentProgress: { sales: 100, accounting: 100, logistics: 30, banquet: 20, kitchen: 45, purchasing: 40, creative: 35, linen: 25 },
    sectionConfirmations: confirmedSections,
    internalNotes: `${DEMO_TAG} Approved same-week contract for inventory, kitchen, and logistics demo.`,
  });

  console.log(`  ${approvedContract.created ? 'created' : 'updated'} DEMO-CONTRACT-OPS-THIS-WEEK`);

  const submittedContract = await upsertDocument(Contract, { contractNumber: 'DEMO-CONTRACT-RELEASE-THIS-WEEK' }, {
    contractNumber: 'DEMO-CONTRACT-RELEASE-THIS-WEEK',
    status: 'submitted',
    currentDepartment: 'accounting',
    menuTasting: null,
    clientSigned: true,
    clientSignedAt: addDays(today, -1),
    clientName: 'Lipa Tech Solutions',
    clientContact: '09171230003',
    clientEmail: 'events@lipatech.demo',
    clientAddress: {
      street: '3 Rizal Park Drive',
      city: 'Lipa City',
      province: 'Batangas',
      zipCode: '4217',
    },
    clientType: 'corporate',
    eventDate: atTime(eventDay, 12, 0),
    bookingDate: addMonths(today, -1),
    venue: {
      name: 'Lipa Convention Hall',
      address: 'Lipa City, Batangas',
      contact: '09175550000',
      notes: `${DEMO_TAG} Signed same-week contract waiting for payment approval.`,
    },
    eventType: 'corporate lunch',
    packageSelected: 'standard',
    menuDetails: [
      { category: 'Main Course', item: 'Buttered Chicken', quantity: 100, confirmed: true },
      { category: 'Main Course', item: 'Fish Fillet', quantity: 100, confirmed: true },
      { category: 'Side', item: 'Steamed Rice', quantity: 100, confirmed: true },
      { category: 'Dessert', item: 'Fruit Salad', quantity: 100, confirmed: true },
    ],
    totalPacks: 100,
    preferredColor: 'Navy Blue and Silver',
    napkinType: 'Cotton',
    tableSetup: 'rectangular',
    backdropRequirements: 'Simple LED welcome backdrop',
    specialRequests: 'Presentation setup near stage',
    creativeRequirements: {
      theme: 'Clean corporate setup',
      colorPalette: ['Navy Blue', 'Silver'],
      backdropType: 'LED Wall',
      tableCenterpieces: 'Minimal floral centerpieces',
    },
    creativeAssets: [
      { itemId: String(creativeLights._id), item: creativeLights.name, itemCode: creativeLights.itemCode, category: 'Lighting', quantity: 4, status: 'pending', notes: 'Stage wash lighting', cost: 4800, pricePerItem: 1200 },
      { itemId: String(creativeCenterpiece._id), item: creativeCenterpiece.name, itemCode: creativeCenterpiece.itemCode, category: 'Table Decor', quantity: 10, status: 'pending', notes: 'Centerpieces for guest tables', cost: 12000, pricePerItem: 1200 },
    ],
    packagePrice: 82000,
    totalContractValue: 118000,
    paymentTerms: 'corporate_flexible',
    downPaymentPercent: 60,
    finalPaymentPercent: 40,
    payments: [],
    paymentStatus: 'unpaid',
    logisticsAssignment: {
      driver: null,
      truck: null,
      assignmentStatus: 'pending',
      notes: `${DEMO_TAG} Payment-first demo contract for accounting approval testing.`,
    },
    equipmentChecklist: [
      { itemId: String(stockroomChair._id), item: stockroomChair.name, itemCode: stockroomChair.itemCode, category: stockroomChair.category, quantity: 100, unitPrice: stockroomChair.rentalPricePerDay, notes: 'Conference seating', status: 'pending' },
      { itemId: String(stockroomTable._id), item: stockroomTable.name, itemCode: stockroomTable.itemCode, category: stockroomTable.category, quantity: 12, unitPrice: stockroomTable.rentalPricePerDay, notes: 'Buffet and guest tables', status: 'pending' },
      { itemId: String(stockroomAudio._id), item: stockroomAudio.name, itemCode: stockroomAudio.itemCode, category: stockroomAudio.category, quantity: 1, unitPrice: stockroomAudio.rentalPricePerDay, notes: 'Corporate program audio', status: 'pending' },
    ],
    cookingLocation: 'commissary',
    ingredientStatus: 'pending',
    linenRequirements: [
      { itemId: String(linenTablecloth._id), type: linenTablecloth.name, itemCode: linenTablecloth.itemCode, category: linenTablecloth.category, size: linenTablecloth.size, material: linenTablecloth.material, color: linenTablecloth.color, quantity: 12, unitPrice: 120, notes: 'Buffet and guest tables', status: 'pending' },
      { itemId: String(linenNapkin._id), type: linenNapkin.name, itemCode: linenNapkin.itemCode, category: linenNapkin.category, size: linenNapkin.size, material: linenNapkin.material, color: linenNapkin.color, quantity: 100, unitPrice: 35, notes: 'Guest place settings', status: 'pending' },
    ],
    linenStatus: 'pending',
    estimatedWaiters: 10,
    estimatedVehicles: 1,
    submittedAt: addDays(today, -1),
    departmentProgress: { sales: 100, accounting: 20, logistics: 0, banquet: 0, kitchen: 0, purchasing: 0, creative: 0, linen: 0 },
    sectionConfirmations: confirmedSections,
    internalNotes: `${DEMO_TAG} Signed same-week contract for accounting payment and approval demo.`,
  });

  console.log(`  ${submittedContract.created ? 'created' : 'updated'} DEMO-CONTRACT-RELEASE-THIS-WEEK`);

  const closeReadyContract = await upsertDocument(Contract, { contractNumber: 'DEMO-CONTRACT-CLOSE-READY' }, {
    contractNumber: 'DEMO-CONTRACT-CLOSE-READY',
    status: 'approved',
    completedAt: null,
    currentDepartment: 'all',
    menuTasting: null,
    clientSigned: true,
    clientSignedAt: closeReadySigningDate,
    clientName: 'Santos Family Reunion',
    clientContact: '09171230004',
    clientEmail: 'santos.family.demo@email.com',
    clientAddress: {
      street: '88 Mabini Street',
      city: 'Lipa City',
      province: 'Batangas',
      zipCode: '4217',
    },
    clientType: 'anniversary',
    eventDate: atTime(closeReadyEventDay, 17, 0),
    bookingDate: addMonths(today, -3),
    venue: {
      name: 'Casa Maria Events Place',
      address: 'Lipa City, Batangas',
      contact: '09175556666',
      notes: `${DEMO_TAG} Post-event contract ready for immediate close-contract testing.`,
    },
    eventType: 'family reunion dinner',
    packageSelected: 'deluxe',
    menuDetails: [
      { category: 'Main Course', item: 'Roast Beef', quantity: 120, confirmed: true },
      { category: 'Main Course', item: 'Chicken Galantina', quantity: 120, confirmed: true },
      { category: 'Side', item: 'Garlic Butter Vegetables', quantity: 120, confirmed: true },
      { category: 'Dessert', item: 'Buko Pandan', quantity: 120, confirmed: true },
    ],
    totalPacks: 120,
    preferredColor: 'Emerald and Gold',
    napkinType: 'Linen',
    tableSetup: 'round',
    backdropRequirements: 'Simple family photo wall',
    specialRequests: 'Senior-friendly access near main buffet',
    creativeRequirements: {
      theme: 'Elegant family gathering',
      colorPalette: ['Emerald', 'Gold', 'Ivory'],
      backdropType: 'Photo Wall',
      tableCenterpieces: 'Low floral pieces',
    },
    creativeAssets: [
      { itemId: String(creativeBackdrop._id), item: creativeBackdrop.name, itemCode: creativeBackdrop.itemCode, category: 'Backdrop', quantity: 1, status: 'returned', notes: 'Returned after event', cost: 6500, pricePerItem: 6500 },
      { itemId: String(creativeCenterpiece._id), item: creativeCenterpiece.name, itemCode: creativeCenterpiece.itemCode, category: 'Table Decor', quantity: 12, status: 'returned', notes: 'All decor returned and checked', cost: 14400, pricePerItem: 1200 },
    ],
    packagePrice: 128000,
    totalContractValue: 168000,
    paymentTerms: 'wedding_standard',
    downPaymentPercent: 60,
    finalPaymentPercent: 40,
    payments: [
      { amount: 100800, date: closeReadyApprovalDate, method: 'bank_transfer', reference: 'DEMO-CLOSE-DP-0001', receiptNumber: 'OR-DEMO-CLOSE-0001', receiptIssuedBy: 'Juan Carlos', receiptGeneratedAt: closeReadyApprovalDate, status: 'completed' },
      { amount: 67200, date: closeReadyFinalPaymentDate, method: 'cash', reference: 'DEMO-CLOSE-FULL-0002', receiptNumber: 'OR-DEMO-CLOSE-0002', receiptIssuedBy: 'Juan Carlos', receiptGeneratedAt: closeReadyFinalPaymentDate, status: 'completed' },
    ],
    paymentStatus: 'paid',
    logisticsAssignment: {
      driver: driverTwo._id,
      truck: truckTwo._id,
      assignmentStatus: 'completed',
      notes: `${DEMO_TAG} Completed logistics for close-contract testing.`,
    },
    equipmentChecklist: [
      { itemId: String(stockroomChair._id), item: stockroomChair.name, itemCode: stockroomChair.itemCode, category: stockroomChair.category, quantity: 120, unitPrice: stockroomChair.rentalPricePerDay, notes: 'All guest chairs returned', status: 'returned' },
      { itemId: String(stockroomTable._id), item: stockroomTable.name, itemCode: stockroomTable.itemCode, category: stockroomTable.category, quantity: 14, unitPrice: stockroomTable.rentalPricePerDay, notes: 'Dining tables returned to stockroom', status: 'returned' },
      { itemId: String(stockroomAudio._id), item: stockroomAudio.name, itemCode: stockroomAudio.itemCode, category: stockroomAudio.category, quantity: 1, unitPrice: stockroomAudio.rentalPricePerDay, notes: 'Audio system returned and tested', status: 'returned' },
    ],
    cookingLocation: 'commissary',
    ingredientStatus: 'prepared',
    linenRequirements: [
      { itemId: String(linenTablecloth._id), type: linenTablecloth.name, itemCode: linenTablecloth.itemCode, category: linenTablecloth.category, size: linenTablecloth.size, material: linenTablecloth.material, color: linenTablecloth.color, quantity: 14, unitPrice: 120, notes: 'All tablecloths returned from laundry', status: 'returned' },
      { itemId: String(linenNapkin._id), type: linenNapkin.name, itemCode: linenNapkin.itemCode, category: linenNapkin.category, size: linenNapkin.size, material: linenNapkin.material, color: linenNapkin.color, quantity: 120, unitPrice: 35, notes: 'Napkins returned and counted', status: 'returned' },
      { itemId: String(linenSash._id), type: linenSash.name, itemCode: linenSash.itemCode, category: linenSash.category, size: linenSash.size, material: linenSash.material, color: linenSash.color, quantity: 120, unitPrice: 30, notes: 'Chair sashes returned and packed', status: 'returned' },
    ],
    linenStatus: 'returned',
    estimatedWaiters: 10,
    estimatedVehicles: 1,
    submittedAt: closeReadySigningDate,
    approvedAt: closeReadyApprovalDate,
    departmentProgress: { sales: 100, accounting: 100, logistics: 100, banquet: 100, kitchen: 100, purchasing: 100, creative: 100, linen: 100 },
    sectionConfirmations: confirmedSections,
    internalNotes: `${DEMO_TAG} Approved past-event contract seeded specifically for close-contract demo.`,
  });

  console.log(`  ${closeReadyContract.created ? 'created' : 'updated'} DEMO-CONTRACT-CLOSE-READY`);

  console.log('\nDemo data ready.');
  console.log(`  Tasting this week: ${formatDate(atTime(tastingDay, 14, 0))} at 2:00 PM`);
  console.log(`  Same-week event date: ${formatDate(atTime(eventDay, 16, 0))}`);
  console.log('  Demo tasting record: DEMO-TASTE-THIS-WEEK');
  console.log('  Prep-ready contract: DEMO-CONTRACT-OPS-THIS-WEEK');
  console.log('  Accounting-release contract: DEMO-CONTRACT-RELEASE-THIS-WEEK');
  console.log(`  Close-ready contract: DEMO-CONTRACT-CLOSE-READY (${formatDate(atTime(closeReadyEventDay, 17, 0))})`);
  console.log('\nSuggested next step: npm run seed:demo');
}

async function main() {
  try {
    await seedDemoData();
  } catch (error) {
    console.error('\nError seeding demo data:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

main();
