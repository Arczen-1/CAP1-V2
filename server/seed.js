#!/usr/bin/env node

/**
 * Database Seeding Script
 * 
 * This script seeds the database with initial data:
 * - Demo users for all departments
 * - Sample menu tastings
 * - Sample contracts
 * 
 * Usage: node server/seed.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const User = require('./models/User');
const MenuTasting = require('./models/MenuTasting');
const Contract = require('./models/Contract');
const Incident = require('./models/Incident');
const CreativeInventory = require('./models/CreativeInventory');
const StockroomInventory = require('./models/StockroomInventory');
const LinenInventory = require('./models/LinenInventory');
const KitchenInventory = require('./models/KitchenInventory');
const { Driver, Truck } = require('./models/Logistics');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/juancarlos';

// Demo users data
const demoUsers = [
  { name: 'Sales Manager', email: 'sales@juancarlos.com', password: 'password123', role: 'sales', department: 'Sales' },
  { name: 'Accounting Manager', email: 'accounting@juancarlos.com', password: 'password123', role: 'accounting', department: 'Accounting' },
  { name: 'Logistics Manager', email: 'logistics@juancarlos.com', password: 'password123', role: 'logistics', department: 'Logistics' },
  { name: 'Banquet Supervisor', email: 'banquet@juancarlos.com', password: 'password123', role: 'banquet_supervisor', department: 'Banquet Operations' },
  { name: 'Kitchen Manager', email: 'kitchen@juancarlos.com', password: 'password123', role: 'kitchen', department: 'Kitchen' },
  { name: 'Purchasing Manager', email: 'purchasing@juancarlos.com', password: 'password123', role: 'purchasing', department: 'Purchasing' },
  { name: 'Stockroom', email: 'stockroom@juancarlos.com', password: 'password123', role: 'stockroom', department: 'Stockroom' },
  { name: 'Creative Manager', email: 'creative@juancarlos.com', password: 'password123', role: 'creative', department: 'Creative' },
  { name: 'Linen Manager', email: 'linen@juancarlos.com', password: 'password123', role: 'linen', department: 'Linen' },
  { name: 'System Admin', email: 'admin@juancarlos.com', password: 'admin123', role: 'admin', department: 'Admin' }
];

// Demo menu tastings
const demoMenuTastings = [
  {
    tastingNumber: 'TASTE-2503-0001',
    clientName: 'Maria Santos',
    clientEmail: 'maria.santos@email.com',
    clientPhone: '0917-123-4567',
    clientAddress: {
      street: '123 Main Street',
      city: 'Makati',
      province: 'Metro Manila',
      zipCode: '1200'
    },
    eventType: 'wedding',
    expectedGuests: 150,
    preferredEventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    tastingDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    tastingTime: '2:00 PM',
    numberOfPax: 4,
    menuItems: [
      { category: 'Appetizer', itemName: 'Caesar Salad', selected: true, notes: '' },
      { category: 'Main Course', itemName: 'Beef Steak', selected: true, notes: '' },
      { category: 'Dessert', itemName: 'Chocolate Cake', selected: false, notes: '' }
    ],
    status: 'confirmed',
    contractCreated: false,
    clientNotes: 'Bride has gluten allergy'
  },
  {
    tastingNumber: 'TASTE-2503-0002',
    clientName: 'ABC Corporation',
    clientEmail: 'events@abccorp.com',
    clientPhone: '02-8987-6543',
    clientAddress: {
      street: '456 Corporate Ave',
      city: 'Taguig',
      province: 'Metro Manila',
      zipCode: '1630'
    },
    eventType: 'corporate',
    expectedGuests: 80,
    preferredEventDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    tastingDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    tastingTime: '11:00 AM',
    numberOfPax: 3,
    menuItems: [
      { category: 'Appetizer', itemName: 'Bruschetta', selected: true, notes: '' },
      { category: 'Main Course', itemName: 'Chicken Roulade', selected: true, notes: '' },
      { category: 'Dessert', itemName: 'Fruit Tart', selected: true, notes: '' }
    ],
    status: 'completed',
    contractCreated: true,
    feedback: {
      rating: 5,
      comments: 'Excellent food quality',
      itemsLiked: ['Chicken Roulade', 'Fruit Tart'],
      itemsToChange: []
    }
  },
  {
    tastingNumber: 'TASTE-2503-0003',
    clientName: 'Dela Cruz Family',
    clientEmail: 'delacruz@email.com',
    clientPhone: '0918-987-6543',
    clientAddress: {
      street: '789 Family Road',
      city: 'Quezon City',
      province: 'Metro Manila',
      zipCode: '1100'
    },
    eventType: 'birthday',
    expectedGuests: 100,
    preferredEventDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    tastingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    tastingTime: '10:00 AM',
    numberOfPax: 5,
    menuItems: [],
    status: 'booked',
    contractCreated: false
  }
];

// Demo contracts
const demoContracts = [
  {
    contractNumber: 'JC-2503-0001',
    status: 'approved',
    progress: 75,
    currentDepartment: 'all',
    clientName: 'Maria Santos & John Reyes',
    clientContact: '0917-123-4567',
    clientEmail: 'maria@email.com',
    clientAddress: {
      street: '123 Main Street',
      city: 'Makati',
      province: 'Metro Manila',
      zipCode: '1200'
    },
    clientType: 'wedding',
    eventDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    bookingDate: new Date(),
    venue: { name: 'The Glass Garden', address: 'Pasig City', contact: '02-8123-4567', notes: '' },
    packageSelected: 'premium',
    menuDetails: [
      { category: 'Appetizer', item: 'Caesar Salad', quantity: 150, confirmed: true },
      { category: 'Main Course', item: 'Beef Steak', quantity: 150, confirmed: true },
      { category: 'Dessert', item: 'Chocolate Cake', quantity: 150, confirmed: false }
    ],
    totalPacks: 150,
    preferredColor: 'Blush Pink & Gold',
    napkinType: 'Satin',
    tableSetup: 'round',
    backdropRequirements: 'Floral arch with fairy lights',
    specialRequests: 'Vegetarian options for 20 guests',
    packagePrice: 150000,
    totalContractValue: 180000,
    paymentTerms: 'wedding_standard',
    paymentStatus: 'partially_paid',
    payments: [
      { amount: 72000, date: new Date(), method: 'bank_transfer', status: 'completed', reference: 'BT123456' }
    ],
    departmentProgress: { sales: 100, accounting: 100, logistics: 50, banquet: 0, kitchen: 80, purchasing: 100, creative: 60, linen: 100 },
    slaWarning: false
  },
  {
    contractNumber: 'JC-2503-0002',
    status: 'submitted',
    progress: 35,
    currentDepartment: 'accounting',
    clientName: 'ABC Corporation',
    clientContact: '02-8987-6543',
    clientEmail: 'events@abccorp.com',
    clientAddress: {
      street: '456 Corporate Ave',
      city: 'Taguig',
      province: 'Metro Manila',
      zipCode: '1630'
    },
    clientType: 'corporate',
    eventDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    bookingDate: new Date(),
    venue: { name: 'Marriott Hotel Manila', address: 'Newport City', contact: '02-8988-9999', notes: 'Grand Ballroom' },
    packageSelected: 'standard',
    menuDetails: [
      { category: 'Appetizer', item: 'Bruschetta', quantity: 80, confirmed: true },
      { category: 'Main Course', item: 'Chicken Roulade', quantity: 80, confirmed: true },
      { category: 'Dessert', item: 'Fruit Tart', quantity: 80, confirmed: true }
    ],
    totalPacks: 80,
    preferredColor: 'Navy Blue & Silver',
    napkinType: 'Cotton',
    tableSetup: 'rectangular',
    backdropRequirements: 'Company logo backdrop',
    specialRequests: 'AV equipment needed',
    packagePrice: 80000,
    totalContractValue: 95000,
    paymentTerms: 'corporate_flexible',
    paymentStatus: 'unpaid',
    payments: [],
    departmentProgress: { sales: 100, accounting: 0, logistics: 0, banquet: 0, kitchen: 0, purchasing: 0, creative: 0, linen: 0 },
    slaWarning: false
  }
];

const demoStockroomItems = [
  {
    itemCode: 'CHA-26-0001',
    name: 'Tiffany Chair - White',
    category: 'Chair',
    subcategory: 'Banquet Chair',
    description: 'Stackable event chair for weddings and formal receptions',
    quantity: 300,
    availableQuantity: 240,
    reservedQuantity: 60,
    minimumStock: 50,
    condition: 'good',
    status: 'available',
    dimensions: { length: 40, width: 40, height: 92, weight: 4 },
    storageLocation: { warehouse: 'Main Warehouse', section: 'Chairs', shelf: 'Rack A', bin: 'Bay 1' },
    purchasePrice: 1850,
    rentalPricePerDay: 85,
    replacementCost: 2200,
    supplier: { name: 'Event Essentials PH', contact: '09171234567', email: 'sales@eventessentials.ph' },
    purchaseDate: new Date('2025-01-15'),
    notes: 'Most requested chair for premium events'
  },
  {
    itemCode: 'TAB-26-0001',
    name: 'Round Banquet Table 60"',
    category: 'Table',
    subcategory: 'Dining Table',
    description: 'Seats 8 to 10 guests comfortably',
    quantity: 45,
    availableQuantity: 30,
    reservedQuantity: 15,
    minimumStock: 8,
    condition: 'good',
    status: 'available',
    dimensions: { length: 152, width: 152, height: 76, weight: 19 },
    storageLocation: { warehouse: 'Main Warehouse', section: 'Tables', shelf: 'Floor', bin: 'Zone B' },
    purchasePrice: 5200,
    rentalPricePerDay: 350,
    replacementCost: 6500,
    supplier: { name: 'Metro Event Furnishings', contact: '09181112223', email: 'orders@metrofurnishings.ph' },
    purchaseDate: new Date('2024-11-08')
  },
  {
    itemCode: 'TEN-26-0001',
    name: 'Clear Span Tent 10x20m',
    category: 'Tent',
    subcategory: 'Outdoor Tent',
    description: 'Weather-ready reception tent with aluminum frame',
    quantity: 6,
    availableQuantity: 4,
    reservedQuantity: 2,
    minimumStock: 1,
    condition: 'excellent',
    status: 'available',
    dimensions: { length: 2000, width: 1000, height: 420, weight: 480 },
    storageLocation: { warehouse: 'Outdoor Yard', section: 'Tent Storage', shelf: 'Lot 2', bin: 'Container A' },
    purchasePrice: 180000,
    rentalPricePerDay: 9500,
    replacementCost: 225000,
    supplier: { name: 'Summit Structures', contact: '09998887766', email: 'support@summitstructures.ph' },
    purchaseDate: new Date('2024-06-21'),
    nextMaintenanceDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
  },
  {
    itemCode: 'EQU-26-0001',
    name: 'Portable PA System',
    category: 'Equipment',
    subcategory: 'Audio',
    description: 'Portable speaker and wireless microphone set',
    quantity: 8,
    availableQuantity: 6,
    reservedQuantity: 2,
    minimumStock: 2,
    condition: 'fair',
    status: 'maintenance',
    storageLocation: { warehouse: 'AV Room', section: 'Audio', shelf: 'Shelf 2', bin: 'Case 5' },
    purchasePrice: 24000,
    rentalPricePerDay: 1800,
    replacementCost: 30000,
    lastMaintenanceDate: new Date('2026-02-20'),
    nextMaintenanceDate: new Date('2026-03-25'),
    maintenanceNotes: 'One unit has intermittent feedback and is under inspection'
  }
];

const demoCreativeItems = [
  {
    itemCode: 'CR-BAC-0001',
    name: 'Floral Arch Backdrop',
    category: 'Backdrop',
    subCategory: 'Wedding Arch',
    description: 'White floral ceremony backdrop with layered silk draping',
    images: [{ url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200', caption: 'Floral arch', isPrimary: true }],
    quantity: 3,
    availableQuantity: 2,
    condition: 'excellent',
    storageLocation: 'Creative Room / Backdrop Bay A',
    dimensions: { length: 320, width: 90, height: 260, weight: 24 },
    acquisition: { type: 'custom_made', date: new Date('2025-03-02'), cost: 28000, supplier: 'JC Fabrication Team' },
    status: 'available'
  },
  {
    itemCode: 'CR-CEN-0002',
    name: 'Crystal Centerpiece Set',
    category: 'Centerpiece',
    subCategory: 'Table Decor',
    description: 'Tall crystal centerpiece for formal reception tables',
    images: [{ url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200', caption: 'Centerpiece', isPrimary: true }],
    quantity: 20,
    availableQuantity: 14,
    condition: 'good',
    storageLocation: 'Creative Room / Shelf C',
    dimensions: { length: 35, width: 35, height: 68, weight: 2.5 },
    acquisition: { type: 'purchased', date: new Date('2024-09-18'), cost: 3200, supplier: 'Elegant Tablescapes Co.' },
    status: 'available'
  },
  {
    itemCode: 'CR-LIG-0003',
    name: 'Warm Fairy Light Curtain',
    category: 'Lighting',
    subCategory: 'Ambient Lighting',
    description: 'Soft warm-white light curtain for backdrop and tunnel styling',
    images: [{ url: 'https://images.unsplash.com/photo-1513883049090-d0b7439799bf?w=1200', caption: 'Fairy lights', isPrimary: true }],
    quantity: 18,
    availableQuantity: 11,
    condition: 'good',
    storageLocation: 'Creative Room / Lighting Rack',
    dimensions: { length: 600, width: 300, height: 10, weight: 1.5 },
    acquisition: { type: 'purchased', date: new Date('2025-01-12'), cost: 1800, supplier: 'Lumina Event Supply' },
    status: 'available'
  },
  {
    itemCode: 'CR-SIG-0004',
    name: 'Mirror Welcome Sign',
    category: 'Signage',
    subCategory: 'Entrance Sign',
    description: 'Framed mirror sign with customizable vinyl lettering',
    images: [{ url: 'https://images.unsplash.com/photo-1525253086316-d0c936c814f8?w=1200', caption: 'Welcome sign', isPrimary: true }],
    quantity: 6,
    availableQuantity: 4,
    condition: 'good',
    storageLocation: 'Creative Room / Signage Shelf',
    dimensions: { length: 70, width: 4, height: 120, weight: 12 },
    acquisition: { type: 'custom_made', date: new Date('2024-11-06'), cost: 9500, supplier: 'JC Fabrication Team' },
    status: 'available'
  }
];

const demoLinenItems = [
  {
    itemCode: 'LN-TAB-0001',
    name: 'White Polyester Tablecloth',
    category: 'Tablecloth',
    size: 'round_72',
    material: 'Polyester',
    color: 'White',
    quantity: 120,
    availableQuantity: 86,
    minimumStock: 20,
    condition: 'excellent',
    washCount: 48,
    storageLocation: 'Linen Room / Rack A',
    status: 'available',
    acquisition: { date: new Date('2025-02-14'), cost: 450, supplier: 'Linen Source Manila' }
  },
  {
    itemCode: 'LN-NAP-0002',
    name: 'Navy Blue Satin Napkin',
    category: 'Napkin',
    size: 'medium',
    material: 'Satin',
    color: 'Navy Blue',
    quantity: 400,
    availableQuantity: 310,
    minimumStock: 80,
    condition: 'good',
    washCount: 62,
    storageLocation: 'Linen Room / Drawer C',
    status: 'available',
    acquisition: { date: new Date('2025-05-11'), cost: 55, supplier: 'Fabrix Events Supply' }
  },
  {
    itemCode: 'LN-OVE-0003',
    name: 'Dusty Rose Organza Overlay',
    category: 'Overlay',
    size: 'large',
    material: 'Organza',
    color: 'Dusty Rose',
    quantity: 75,
    availableQuantity: 28,
    minimumStock: 15,
    condition: 'good',
    washCount: 35,
    storageLocation: 'Linen Room / Rack D',
    status: 'laundry',
    acquisition: { date: new Date('2024-10-03'), cost: 130, supplier: 'Elegant Textiles Co.' }
  },
  {
    itemCode: 'LN-SAS-0004',
    name: 'Gold Taffeta Chair Sash',
    category: 'Sash',
    size: 'custom',
    material: 'Taffeta',
    color: 'Gold',
    quantity: 250,
    availableQuantity: 180,
    minimumStock: 40,
    condition: 'fair',
    washCount: 97,
    storageLocation: 'Linen Room / Bin S2',
    status: 'available',
    acquisition: { date: new Date('2024-08-18'), cost: 42, supplier: 'Elegant Textiles Co.' }
  }
];

const demoKitchenItems = [
  {
    itemCode: 'UTE-26-0001',
    name: 'Chef Knife 8"',
    category: 'Utensil',
    subcategory: 'Knife',
    description: 'Stainless chef knife for prep station use',
    quantity: 24,
    availableQuantity: 18,
    reservedQuantity: 6,
    minimumStock: 6,
    unit: 'piece',
    condition: 'good',
    status: 'available',
    brand: 'Victorinox',
    storageLocation: { area: 'Main Kitchen', section: 'Knife Rack', container: 'Slot 3' },
    purchasePrice: 1850,
    replacementCost: 2200
  },
  {
    itemCode: 'COO-26-0001',
    name: 'Aluminum Stock Pot 40L',
    category: 'Cookware',
    subcategory: 'Stock Pot',
    description: 'Large batch soup and sauce preparation pot',
    quantity: 10,
    availableQuantity: 7,
    reservedQuantity: 3,
    minimumStock: 2,
    unit: 'piece',
    condition: 'good',
    status: 'available',
    brand: 'Vulcan',
    storageLocation: { area: 'Main Kitchen', section: 'Cookware Shelf', container: 'Lower Rack' },
    purchasePrice: 6800,
    replacementCost: 8200
  },
  {
    itemCode: 'APP-26-0001',
    name: 'Commercial Stand Mixer',
    category: 'Appliance',
    subcategory: 'Mixer',
    description: 'Heavy-duty mixer for dough and batter production',
    quantity: 3,
    availableQuantity: 2,
    reservedQuantity: 1,
    minimumStock: 1,
    unit: 'piece',
    condition: 'excellent',
    status: 'available',
    brand: 'KitchenAid',
    model: 'KSM8990',
    serialNumber: 'KA-8990-26-1001',
    storageLocation: { area: 'Bakery Prep', section: 'Appliance Counter', container: 'Station 2' },
    purchasePrice: 58000,
    replacementCost: 64000,
    lastMaintenanceDate: new Date('2026-01-10'),
    nextMaintenanceDate: new Date('2026-07-10')
  },
  {
    itemCode: 'ING-26-0001',
    name: 'Olive Oil Extra Virgin',
    category: 'Ingredient',
    subcategory: 'Oil',
    description: 'Bulk cooking oil for finishing and sauteing',
    quantity: 18,
    availableQuantity: 6,
    reservedQuantity: 12,
    minimumStock: 5,
    unit: 'L',
    condition: 'good',
    status: 'available',
    storageLocation: { area: 'Dry Storage', section: 'Shelf B', container: 'Row 2' },
    purchasePrice: 420,
    replacementCost: 460,
    expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    batchNumber: 'OO-202603'
  }
];

const demoDrivers = [
  {
    firstName: 'Miguel',
    lastName: 'Garcia',
    phone: '0917-777-8888',
    licenseNumber: 'N01-12-345678',
    licenseType: 'professional',
    licenseExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    employmentType: 'full_time',
    status: 'active'
  },
  {
    firstName: 'Antonio',
    lastName: 'Lim',
    phone: '0918-999-0000',
    licenseNumber: 'N02-23-456789',
    licenseType: 'professional',
    licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    employmentType: 'contractual',
    status: 'active'
  }
];

const demoTrucks = [
  {
    plateNumber: 'ABC-1234',
    truckType: 'closed_van',
    capacity: {
      weight: 3000,
      volume: 15,
      dimensions: { length: 450, width: 200, height: 220 }
    },
    status: 'available'
  },
  {
    plateNumber: 'XYZ-5678',
    truckType: 'refrigerated',
    capacity: {
      weight: 5000,
      volume: 25,
      dimensions: { length: 600, width: 240, height: 250 }
    },
    status: 'available'
  }
];

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('URI:', MONGODB_URI.replace(/:([^@]+)@/, ':****@')); // Hide password
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('\nClearing existing data...');
    await User.deleteMany({});
    await MenuTasting.deleteMany({});
    await Contract.deleteMany({});
    await Incident.deleteMany({});
    await CreativeInventory.deleteMany({});
    await StockroomInventory.deleteMany({});
    await LinenInventory.deleteMany({});
    await KitchenInventory.deleteMany({});
    await Driver.deleteMany({});
    await Truck.deleteMany({});
    console.log('✅ Cleared existing data');

    // Seed users
    console.log('\nSeeding users...');
    for (const userData of demoUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`  ✅ Created user: ${userData.email}`);
    }

    // Seed menu tastings
    console.log('\nSeeding menu tastings...');
    const savedTastings = [];
    for (const tastingData of demoMenuTastings) {
      const tasting = new MenuTasting(tastingData);
      await tasting.save();
      savedTastings.push(tasting);
      console.log(`  ✅ Created tasting: ${tastingData.tastingNumber}`);
    }

    // Seed contracts and link to tastings
    console.log('\nSeeding contracts...');
    for (let i = 0; i < demoContracts.length; i++) {
      const contractData = demoContracts[i];
      
      // Link second contract to second tasting
      if (i === 1 && savedTastings[1]) {
        contractData.menuTasting = savedTastings[1]._id;
      }
      
      const contract = new Contract(contractData);
      await contract.save();
      console.log(`  ✅ Created contract: ${contractData.contractNumber}`);

      // Update tasting with contract reference
      if (i === 1 && savedTastings[1]) {
        savedTastings[1].contract = contract._id;
        await savedTastings[1].save();
      }
    }

    console.log('\n✅ Database seeded successfully!');
    console.log('\nSeeding logistics resources...');
    for (const driverData of demoDrivers) {
      const driver = new Driver(driverData);
      await driver.save();
      console.log(`  Created driver: ${driver.fullName}`);
    }

    for (const truckData of demoTrucks) {
      const truck = new Truck(truckData);
      await truck.save();
      console.log(`  Created truck: ${truck.plateNumber}`);
    }

    console.log('\nSeeding creative inventory...');
    for (const itemData of demoCreativeItems) {
      const item = new CreativeInventory(itemData);
      await item.save();
      console.log(`  Created creative item: ${itemData.itemCode}`);
    }

    console.log('\nSeeding stockroom inventory...');
    for (const itemData of demoStockroomItems) {
      const item = new StockroomInventory(itemData);
      await item.save();
      console.log(`  âœ… Created stockroom item: ${itemData.itemCode}`);
    }

    console.log('\nSeeding linen inventory...');
    for (const itemData of demoLinenItems) {
      const item = new LinenInventory(itemData);
      await item.save();
      console.log(`  âœ… Created linen item: ${itemData.itemCode}`);
    }

    console.log('\nSeeding kitchen inventory...');
    for (const itemData of demoKitchenItems) {
      const item = new KitchenInventory(itemData);
      await item.save();
      console.log(`  âœ… Created kitchen item: ${itemData.itemCode}`);
    }

    console.log('\nInitial work accounts were seeded successfully.');
    console.log('Share login credentials with the team privately instead of keeping them in the repository.');
    console.log('\nYou can now start the app with: npm run dev');

  } catch (error) {
    console.error('\n❌ Error seeding database:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Make sure your MONGODB_URI is correct in .env file');
    console.error('  2. Check that your MongoDB Atlas cluster is running');
    console.error('  3. Verify your IP address is whitelisted in MongoDB Atlas');
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the seed function
seedDatabase();
