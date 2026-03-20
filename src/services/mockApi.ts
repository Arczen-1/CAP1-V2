// Mock API service for demo purposes when backend is not available

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mockUsers = [
  { id: '1', name: 'Sales Manager', email: 'sales@juancarlos.com', role: 'sales', department: 'Sales' },
  { id: '2', name: 'Accounting Manager', email: 'accounting@juancarlos.com', role: 'accounting', department: 'Accounting' },
  { id: '3', name: 'Logistics Manager', email: 'logistics@juancarlos.com', role: 'logistics', department: 'Logistics' },
  { id: '4', name: 'Banquet Supervisor', email: 'banquet@juancarlos.com', role: 'banquet_supervisor', department: 'Banquet Operations' },
  { id: '5', name: 'Kitchen Manager', email: 'kitchen@juancarlos.com', role: 'kitchen', department: 'Kitchen' },
  { id: '6', name: 'Purchasing Manager', email: 'purchasing@juancarlos.com', role: 'purchasing', department: 'Purchasing' },
  { id: '7', name: 'Stockroom', email: 'stockroom@juancarlos.com', role: 'stockroom', department: 'Stockroom' },
  { id: '8', name: 'Creative Manager', email: 'creative@juancarlos.com', role: 'creative', department: 'Creative' },
  { id: '9', name: 'Linen Manager', email: 'linen@juancarlos.com', role: 'linen', department: 'Linen' },
  { id: '10', name: 'Admin', email: 'admin@juancarlos.com', role: 'admin', department: 'Admin' }
];

const mockMenuTastings = [
  {
    _id: 't1',
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
    preferredEventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    tastingDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    tastingTime: '2:00 PM',
    numberOfPax: 4,
    menuItems: [
      { category: 'Appetizer', itemName: 'Caesar Salad', selected: true, notes: '' },
      { category: 'Main Course', itemName: 'Beef Steak', selected: true, notes: '' },
      { category: 'Dessert', itemName: 'Chocolate Cake', selected: false, notes: '' }
    ],
    status: 'confirmed',
    contract: null,
    contractCreated: false,
    clientNotes: 'Bride has gluten allergy',
    internalNotes: 'VIP client - prioritize',
    createdAt: new Date().toISOString()
  },
  {
    _id: 't2',
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
    preferredEventDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    tastingDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    tastingTime: '11:00 AM',
    numberOfPax: 3,
    menuItems: [
      { category: 'Appetizer', itemName: 'Bruschetta', selected: true, notes: '' },
      { category: 'Main Course', itemName: 'Chicken Roulade', selected: true, notes: '' },
      { category: 'Dessert', itemName: 'Fruit Tart', selected: true, notes: '' }
    ],
    status: 'completed',
    contract: '2',
    contractCreated: true,
    feedback: {
      rating: 5,
      comments: 'Excellent food quality',
      itemsLiked: ['Chicken Roulade', 'Fruit Tart'],
      itemsToChange: []
    },
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 't3',
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
    preferredEventDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    tastingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    tastingTime: '10:00 AM',
    numberOfPax: 5,
    menuItems: [],
    status: 'booked',
    contract: null,
    contractCreated: false,
    createdAt: new Date().toISOString()
  }
];

const mockContracts = [
  {
    _id: '1',
    contractNumber: 'JC-2503-0001',
    menuTasting: null,
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
    eventDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    bookingDate: new Date().toISOString(),
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
    creativeRequirements: {
      theme: 'Romantic Garden',
      colorPalette: ['Blush Pink', 'Gold', 'Ivory'],
      style: 'Classic',
      backdropType: 'Floral Arch',
      backdropDetails: 'White and pink roses with eucalyptus',
      lightingRequirements: ['Fairy lights', 'Uplighting'],
      tableCenterpieces: 'Low floral arrangements',
      specialElements: ['Photo booth', 'Candy bar']
    },
    creativeAssets: [
      { item: 'Floral Arch', category: 'Backdrop', quantity: 1, assignedTo: null, status: 'pending', notes: '', cost: 15000 },
      { item: 'Fairy Lights', category: 'Lighting', quantity: 20, assignedTo: null, status: 'pending', notes: '', cost: 5000 }
    ],
    packagePrice: 150000,
    totalContractValue: 180000,
    paymentTerms: 'wedding_standard',
    paymentStatus: 'partially_paid',
    payments: [
      { amount: 72000, date: new Date().toISOString(), method: 'bank_transfer', status: 'completed', reference: 'BT123456' }
    ],
    estimatedWaiters: 6,
    estimatedVehicles: 2,
    cookingLocation: 'on_site',
    ingredientStatus: 'procured',
    linenStatus: 'prepared',
    departmentProgress: { sales: 100, accounting: 100, logistics: 50, banquet: 0, kitchen: 80, purchasing: 100, creative: 60, linen: 100 },
    slaWarning: false,
    finalDetailsDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    assignedSupervisor: { _id: '4', name: 'Banquet Supervisor' }
  },
  {
    _id: '2',
    contractNumber: 'JC-2503-0002',
    menuTasting: 't2',
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
    eventDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    bookingDate: new Date().toISOString(),
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
    creativeRequirements: {
      theme: 'Corporate Professional',
      colorPalette: ['Navy Blue', 'Silver', 'White'],
      style: 'Modern',
      backdropType: 'Custom',
      backdropDetails: 'Company logo on LED wall',
      lightingRequirements: ['Spotlight', 'Ambient'],
      tableCenterpieces: 'Minimalist corporate branding'
    },
    packagePrice: 80000,
    totalContractValue: 95000,
    paymentTerms: 'corporate_flexible',
    paymentStatus: 'unpaid',
    payments: [],
    estimatedWaiters: 4,
    estimatedVehicles: 1,
    departmentProgress: { sales: 100, accounting: 0, logistics: 0, banquet: 0, kitchen: 0, purchasing: 0, creative: 0, linen: 0 },
    slaWarning: false,
    finalDetailsDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    assignedSupervisor: null
  },
  {
    _id: '3',
    contractNumber: 'JC-2503-0003',
    menuTasting: null,
    status: 'draft',
    progress: 10,
    currentDepartment: 'sales',
    clientName: 'Dela Cruz Family',
    clientContact: '0918-987-6543',
    clientEmail: 'delacruz@email.com',
    clientAddress: {
      street: '789 Family Road',
      city: 'Quezon City',
      province: 'Metro Manila',
      zipCode: '1100'
    },
    clientType: 'birthday',
    eventDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    bookingDate: new Date().toISOString(),
    venue: { name: 'The Blue Leaf Filipinas', address: 'Aseana City', contact: '02-8777-8888', notes: '' },
    packageSelected: 'basic',
    menuDetails: [
      { category: 'Main Course', item: 'Pancit Canton', quantity: 100, confirmed: false },
      { category: 'Main Course', item: 'Lechon Kawali', quantity: 100, confirmed: false }
    ],
    totalPacks: 100,
    preferredColor: 'Royal Blue',
    napkinType: 'Paper',
    tableSetup: 'round',
    backdropRequirements: 'Balloon setup',
    specialRequests: '',
    packagePrice: 50000,
    totalContractValue: 55000,
    paymentTerms: 'wedding_standard',
    paymentStatus: 'unpaid',
    payments: [],
    departmentProgress: { sales: 10, accounting: 0, logistics: 0, banquet: 0, kitchen: 0, purchasing: 0, creative: 0, linen: 0 },
    slaWarning: false,
    finalDetailsDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    assignedSupervisor: null
  },
  {
    _id: '4',
    contractNumber: 'JC-2503-0004',
    menuTasting: null,
    status: 'approved',
    progress: 90,
    currentDepartment: 'all',
    clientName: 'TechStart Inc.',
    clientContact: '0919-555-7777',
    clientEmail: 'hello@techstart.com',
    clientAddress: {
      street: '100 Startup Blvd',
      city: 'Taguig',
      province: 'Metro Manila',
      zipCode: '1630'
    },
    clientType: 'corporate',
    eventDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    bookingDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    venue: { name: 'Shangri-La at the Fort', address: 'BGC, Taguig', contact: '02-8820-0888', notes: 'Function Room B' },
    packageSelected: 'premium',
    menuDetails: [
      { category: 'Appetizer', item: 'Salmon Carpaccio', quantity: 50, confirmed: true },
      { category: 'Main Course', item: 'Wagyu Beef', quantity: 50, confirmed: true },
      { category: 'Dessert', item: 'Crème Brûlée', quantity: 50, confirmed: true }
    ],
    totalPacks: 50,
    preferredColor: 'Black & Gold',
    napkinType: 'Linen',
    tableSetup: 'cocktail',
    backdropRequirements: 'LED wall with company branding',
    specialRequests: 'Cocktail service',
    creativeRequirements: {
      theme: 'Tech Launch',
      colorPalette: ['Black', 'Gold', 'Neon Blue'],
      style: 'Modern',
      backdropType: 'LED Wall',
      backdropDetails: 'Company branding with animated logo',
      lightingRequirements: ['LED Uplighting', 'Spotlight', 'Moving heads'],
      tableCenterpieces: 'Minimalist tech-inspired'
    },
    packagePrice: 120000,
    totalContractValue: 135000,
    paymentTerms: 'corporate_flexible',
    paymentStatus: 'paid',
    payments: [
      { amount: 67500, date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), method: 'check', status: 'completed', reference: 'CHK001' },
      { amount: 67500, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), method: 'check', status: 'completed', reference: 'CHK002' }
    ],
    estimatedWaiters: 4,
    estimatedVehicles: 1,
    cookingLocation: 'commissary',
    ingredientStatus: 'prepared',
    linenStatus: 'prepared',
    departmentProgress: { sales: 100, accounting: 100, logistics: 100, banquet: 80, kitchen: 100, purchasing: 100, creative: 100, linen: 100 },
    slaWarning: false,
    finalDetailsDeadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    assignedSupervisor: { _id: '4', name: 'Banquet Supervisor' }
  }
];

const mockIncidents = [
  {
    _id: '1',
    contract: { contractNumber: 'JC-2502-0098', clientName: 'Garcia Wedding' },
    incidentType: 'damaged_equipment',
    description: 'One chafing dish was dented during transport',
    eventDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    reportedBy: { name: 'Logistics Manager' },
    reportedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    severity: 'low',
    status: 'open',
    resolution: null
  },
  {
    _id: '2',
    contract: { contractNumber: 'JC-2502-0095', clientName: 'Metro Corp Event' },
    incidentType: 'burnt_cloth',
    description: 'Tablecloth scorched by hot plate',
    eventDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    reportedBy: { name: 'Banquet Supervisor' },
    reportedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    severity: 'medium',
    status: 'resolved',
    resolution: 'Charged to client, replacement ordered'
  }
];

// Creative Inventory Mock Data
const mockCreativeInventory = [
  {
    _id: 'c1',
    itemCode: 'CRT-001',
    name: 'Floral Arch - White Roses',
    category: 'Backdrop',
    images: [{ url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400', caption: 'Primary', isPrimary: true }],
    quantity: 3,
    availableQuantity: 2,
    condition: 'excellent',
    status: 'available',
    dimensions: { length: 300, width: 200, height: 250, weight: 15 }
  },
  {
    _id: 'c2',
    itemCode: 'CRT-002',
    name: 'Fairy Lights - Warm White',
    category: 'Lighting',
    images: [{ url: 'https://images.unsplash.com/photo-1513883049090-d0b7439799bf?w=400', caption: 'Primary', isPrimary: true }],
    quantity: 50,
    availableQuantity: 35,
    condition: 'good',
    status: 'available',
    dimensions: { length: 1000, width: 0, height: 0, weight: 0.5 }
  },
  {
    _id: 'c3',
    itemCode: 'CRT-003',
    name: 'Crystal Centerpiece Set',
    category: 'Centerpiece',
    images: [],
    quantity: 20,
    availableQuantity: 15,
    condition: 'good',
    status: 'available',
    dimensions: { length: 30, width: 30, height: 40, weight: 2 }
  }
];

// Banquet Staff Mock Data
const mockBanquetStaff = [
  {
    _id: 'bs1',
    employeeId: 'EMP-001',
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    fullName: 'Juan Dela Cruz',
    email: 'juan.delacruz@juancarlos.com',
    role: 'waiter',
    employmentType: 'full_time',
    phone: '0917-111-2222',
    hasAccount: false,
    ratePerDay: 500,
    ratePerHour: 65,
    totalEventsWorked: 45
  },
  {
    _id: 'bs2',
    employeeId: 'EMP-002',
    firstName: 'Maria',
    lastName: 'Santos',
    fullName: 'Maria Santos',
    email: 'maria.santos@juancarlos.com',
    role: 'event_manager',
    employmentType: 'full_time',
    phone: '0918-333-4444',
    hasAccount: true,
    accountEmail: 'maria.santos@juancarlos.com',
    ratePerDay: 800,
    ratePerHour: 100,
    totalEventsWorked: 120
  },
  {
    _id: 'bs3',
    employeeId: 'EMP-003',
    firstName: 'Pedro',
    lastName: 'Reyes',
    fullName: 'Pedro Reyes',
    email: 'pedro.reyes@juancarlos.com',
    role: 'bartender',
    employmentType: 'part_time',
    phone: '0919-555-6666',
    hasAccount: false,
    ratePerDay: 600,
    ratePerHour: 75,
    totalEventsWorked: 30
  }
];

// Logistics Mock Data
const mockDrivers = [
  {
    _id: 'd1',
    driverId: 'DRV-001',
    firstName: 'Miguel',
    lastName: 'Garcia',
    fullName: 'Miguel Garcia',
    licenseNumber: 'N01-12-345678',
    licenseType: 'professional',
    licenseExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    phone: '0917-777-8888',
    assignedTrucks: []
  },
  {
    _id: 'd2',
    driverId: 'DRV-002',
    firstName: 'Antonio',
    lastName: 'Lim',
    fullName: 'Antonio Lim',
    licenseNumber: 'N02-23-456789',
    licenseType: 'professional',
    licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    phone: '0918-999-0000',
    assignedTrucks: []
  }
];

const mockTrucks = [
  {
    _id: 'tr1',
    truckId: 'TRK-001',
    plateNumber: 'ABC-1234',
    truckType: 'closed_van',
    capacity: { weight: 3000, volume: 15, dimensions: { length: 4.5, width: 2.0, height: 2.2 } },
    assignedDriver: null,
    images: [{ url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400', caption: 'Primary', isPrimary: true }]
  },
  {
    _id: 'tr2',
    truckId: 'TRK-002',
    plateNumber: 'XYZ-5678',
    truckType: 'refrigerated',
    capacity: { weight: 5000, volume: 25, dimensions: { length: 6.0, width: 2.4, height: 2.5 } },
    assignedDriver: null,
    images: []
  }
];

// Driver Bookings Mock Data
const mockBookings = [
  {
    _id: 'b1',
    driverId: 'd1',
    driverName: 'Miguel Garcia',
    date: new Date().toISOString(),
    status: 'booked',
    contractNumber: 'JC-2503-0001',
    venue: 'The Glass Garden',
    notes: 'Wedding event'
  },
  {
    _id: 'b2',
    driverId: 'd2',
    driverName: 'Antonio Lim',
    date: new Date(Date.now() + 86400000).toISOString(),
    status: 'available',
    contractNumber: '',
    venue: '',
    notes: ''
  },
  {
    _id: 'b3',
    driverId: 'd1',
    driverName: 'Miguel Garcia',
    date: new Date(Date.now() + 172800000).toISOString(),
    status: 'on_leave',
    contractNumber: '',
    venue: '',
    notes: 'Personal leave'
  }
];

// Linen Inventory Mock Data
const mockLinenInventory = [
  {
    _id: 'l1',
    itemCode: 'LIN-001',
    name: 'White Polyester Tablecloth',
    category: 'Tablecloth',
    size: 'round_72',
    material: 'Polyester',
    color: 'White',
    images: [{ url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', caption: 'Primary', isPrimary: true }],
    quantity: 100,
    availableQuantity: 75,
    minimumStock: 20,
    washCount: 150,
    status: 'available'
  },
  {
    _id: 'l2',
    itemCode: 'LIN-002',
    name: 'Navy Blue Satin Napkin',
    category: 'Napkin',
    size: 'medium',
    material: 'Satin',
    color: 'Navy Blue',
    images: [],
    quantity: 500,
    availableQuantity: 420,
    minimumStock: 100,
    washCount: 80,
    status: 'available'
  },
  {
    _id: 'l3',
    itemCode: 'LIN-003',
    name: 'Gold Organza Runner',
    category: 'Runner',
    size: 'large',
    material: 'Organza',
    color: 'Gold',
    images: [{ url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=400', caption: 'Primary', isPrimary: true }],
    quantity: 50,
    availableQuantity: 15,
    minimumStock: 20,
    washCount: 45,
    status: 'available'
  }
];

let currentUser: any = null;
let menuTastings = [...mockMenuTastings];
let contracts = [...mockContracts];
let incidents = [...mockIncidents];
let creativeInventory = [...mockCreativeInventory];
let banquetStaff = [...mockBanquetStaff];
let drivers = [...mockDrivers];
let trucks = [...mockTrucks];
let linenInventory = [...mockLinenInventory];
let bookings = [...mockBookings];
const mockPasswords: Record<string, string> = {
  'sales@juancarlos.com': 'password123',
  'accounting@juancarlos.com': 'password123',
  'logistics@juancarlos.com': 'password123',
  'banquet@juancarlos.com': 'password123',
  'kitchen@juancarlos.com': 'password123',
  'purchasing@juancarlos.com': 'password123',
  'stockroom@juancarlos.com': 'password123',
  'creative@juancarlos.com': 'password123',
  'linen@juancarlos.com': 'password123',
  'admin@juancarlos.com': 'admin123',
};
const mockResetCodes: Record<string, { code: string; expiresAt: number }> = {};

export const mockApi = {
  // Generic HTTP methods for new endpoints
  async get(url: string, _params?: any) {
    await delay(300);
    
    // Creative Inventory endpoints
    if (url === '/creative-inventory') {
      return { data: creativeInventory };
    }
    if (url === '/creative-inventory/stats/overview') {
      return { data: await this.getCreativeInventoryStats() };
    }
    if (url.startsWith('/creative-inventory/') && !url.includes('/stats')) {
      const id = url.split('/')[2];
      return { data: creativeInventory.find(i => i._id === id) };
    }
    
    // Banquet Staff endpoints
    if (url === '/banquet-staff') {
      return { data: banquetStaff };
    }
    if (url === '/banquet-staff/stats/overview') {
      return { data: await this.getBanquetStaffStats() };
    }
    if (url.startsWith('/banquet-staff/') && !url.includes('/stats') && !url.includes('/create-account')) {
      const id = url.split('/')[2];
      return { data: banquetStaff.find(s => s._id === id) };
    }
    
    // Logistics endpoints
    if (url === '/logistics/drivers') {
      return { data: await this.getDrivers() };
    }
    if (url === '/logistics/trucks') {
      return { data: await this.getTrucks() };
    }
    if (url === '/logistics/stats/overview') {
      return { data: await this.getLogisticsStats() };
    }
    if (url === '/logistics/bookings') {
      return { data: bookings };
    }
    
    // Linen Inventory endpoints
    if (url === '/linen-inventory') {
      return { data: linenInventory };
    }
    if (url === '/linen-inventory/stats/overview') {
      return { data: await this.getLinenInventoryStats() };
    }
    if (url.startsWith('/linen-inventory/') && !url.includes('/stats')) {
      const id = url.split('/')[2];
      return { data: linenInventory.find(i => i._id === id) };
    }
    
    // Auth/User endpoints
    if (url === '/auth/users') {
      return { data: await this.getUsers() };
    }
    if (url === '/auth/stats/overview') {
      return { data: await this.getUserStats() };
    }
    
    throw new Error(`Unknown endpoint: ${url}`);
  },

  async post(url: string, data?: any) {
    await delay(400);
    
    // Creative Inventory endpoints
    if (url === '/creative-inventory') {
      return { data: await this.createCreativeItem(data) };
    }
    
    // Banquet Staff endpoints
    if (url === '/banquet-staff') {
      return { data: await this.createBanquetStaff(data) };
    }
    if (url.match(/\/banquet-staff\/[^/]+\/create-account/)) {
      const id = url.split('/')[2];
      return { data: await this.createStaffAccount(id, data) };
    }
    
    // Logistics endpoints
    if (url === '/logistics/drivers') {
      return { data: await this.createDriver(data) };
    }
    if (url === '/logistics/trucks') {
      return { data: await this.createTruck(data) };
    }
    if (url.match(/\/logistics\/trucks\/[^/]+\/assign-driver/)) {
      const truckId = url.split('/')[3];
      return { data: await this.assignDriverToTruck(truckId, data.driverId) };
    }
    if (url === '/logistics/bookings') {
      const newBooking = {
        _id: 'b' + (bookings.length + 1),
        ...data,
        driverName: drivers.find(d => d._id === data.driverId)?.fullName || 'Unknown'
      };
      bookings.push(newBooking);
      return { data: newBooking };
    }
    
    // Linen Inventory endpoints
    if (url === '/linen-inventory') {
      return { data: await this.createLinenItem(data) };
    }
    
    // Auth endpoints
    if (url === '/auth/register') {
      return { data: await this.createUser(data) };
    }
    if (url.match(/\/auth\/users\/[^/]+\/reset-password/)) {
      const id = url.split('/')[3];
      return { data: await this.resetUserPassword(id, data) };
    }
    
    throw new Error(`Unknown endpoint: ${url}`);
  },

  async put(url: string, data?: any) {
    await delay(300);
    
    // Creative Inventory endpoints
    if (url.startsWith('/creative-inventory/')) {
      const id = url.split('/')[2];
      return { data: await this.updateCreativeItem(id, data) };
    }
    
    // Banquet Staff endpoints
    if (url.startsWith('/banquet-staff/')) {
      const id = url.split('/')[2];
      return { data: await this.updateBanquetStaff(id, data) };
    }
    
    // Logistics endpoints
    if (url.startsWith('/logistics/drivers/')) {
      const id = url.split('/')[3];
      return { data: await this.updateDriver(id, data) };
    }
    if (url.startsWith('/logistics/trucks/')) {
      const id = url.split('/')[3];
      return { data: await this.updateTruck(id, data) };
    }
    
    // Linen Inventory endpoints
    if (url.startsWith('/linen-inventory/')) {
      const id = url.split('/')[2];
      return { data: await this.updateLinenItem(id, data) };
    }
    
    // Auth endpoints
    if (url.startsWith('/auth/users/')) {
      const id = url.split('/')[3];
      return { data: await this.updateUser(id, data) };
    }
    
    throw new Error(`Unknown endpoint: ${url}`);
  },

  async delete(url: string) {
    await delay(300);
    
    // Creative Inventory endpoints
    if (url.startsWith('/creative-inventory/')) {
      const id = url.split('/')[2];
      return { data: await this.deleteCreativeItem(id) };
    }
    
    // Banquet Staff endpoints
    if (url.startsWith('/banquet-staff/')) {
      const id = url.split('/')[2];
      return { data: await this.deleteBanquetStaff(id) };
    }
    
    // Logistics endpoints
    if (url.startsWith('/logistics/drivers/')) {
      const id = url.split('/')[3];
      return { data: await this.deleteDriver(id) };
    }
    if (url.startsWith('/logistics/trucks/')) {
      const id = url.split('/')[3];
      return { data: await this.deleteTruck(id) };
    }
    
    // Linen Inventory endpoints
    if (url.startsWith('/linen-inventory/')) {
      const id = url.split('/')[2];
      return { data: await this.deleteLinenItem(id) };
    }
    
    // Auth endpoints
    if (url.startsWith('/auth/users/')) {
      const id = url.split('/')[3];
      return { data: await this.deleteUser(id) };
    }
    
    throw new Error(`Unknown endpoint: ${url}`);
  },

  async patch(url: string, data?: any) {
    await delay(300);
    
    // Auth endpoints
    if (url.match(/\/auth\/users\/[^/]+\/status/)) {
      const id = url.split('/')[3];
      return { data: await this.toggleUserStatus(id, data) };
    }
    
    throw new Error(`Unknown endpoint: ${url}`);
  },

  async login(email: string, password: string) {
    await delay(500);
    const normalizedEmail = email.trim().toLowerCase();
    const user = mockUsers.find(u => u.email === normalizedEmail);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    if (mockPasswords[normalizedEmail] !== password) {
      throw new Error('Invalid credentials');
    }
    currentUser = user;
    return {
      token: 'mock-jwt-token-' + Date.now(),
      user
    };
  },

  async requestPasswordReset(email: string) {
    await delay(400);
    const normalizedEmail = email.trim().toLowerCase();
    const user = mockUsers.find((item) => item.email === normalizedEmail);
    const response: { message: string; resetCode?: string; expiresInMinutes?: number } = {
      message: 'If the email is registered, a password reset code has been generated.',
    };

    if (!user) {
      return response;
    }

    const resetCode = String(Math.floor(100000 + Math.random() * 900000));
    mockResetCodes[normalizedEmail] = {
      code: resetCode,
      expiresAt: Date.now() + 15 * 60 * 1000,
    };

    return {
      ...response,
      resetCode,
      expiresInMinutes: 15,
    };
  },

  async resetPassword(email: string, resetCode: string, newPassword: string) {
    await delay(400);
    const normalizedEmail = email.trim().toLowerCase();
    const storedReset = mockResetCodes[normalizedEmail];

    if (!storedReset || storedReset.code !== resetCode || storedReset.expiresAt <= Date.now()) {
      throw new Error('The reset code is invalid or has expired');
    }

    mockPasswords[normalizedEmail] = newPassword;
    delete mockResetCodes[normalizedEmail];

    return {
      message: 'Password updated successfully. You can now sign in with your new password.',
    };
  },

  async getMe() {
    await delay(300);
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    return { user: currentUser };
  },

  // Menu Tasting APIs
  async getMenuTastings(params?: any) {
    await delay(400);
    let result = [...menuTastings];
    if (params?.status) {
      result = result.filter(t => t.status === params.status);
    }
    return result;
  },

  async getMenuTasting(id: string) {
    await delay(300);
    const tasting = menuTastings.find(t => t._id === id);
    if (!tasting) throw new Error('Menu tasting not found');
    return tasting;
  },

  async createMenuTasting(data: any) {
    await delay(500);
    // Validation checks
    if (!data.clientName || data.clientName.length < 2) {
      throw new Error('Name must be at least 2 characters');
    }
    if (!data.clientEmail || !data.clientEmail.includes('@')) {
      throw new Error('Please enter a valid email address');
    }
    if (!data.clientPhone) {
      throw new Error('Phone number is required');
    }
    if (!data.clientAddress?.street || !data.clientAddress?.city || 
        !data.clientAddress?.province || !data.clientAddress?.zipCode) {
      throw new Error('Complete address is required');
    }
    
    const newTasting = {
      _id: 't' + (menuTastings.length + 1),
      tastingNumber: `TASTE-2503-${String(menuTastings.length + 1).padStart(4, '0')}`,
      ...data,
      status: 'booked',
      contract: null,
      contractCreated: false,
      createdAt: new Date().toISOString()
    };
    menuTastings.push(newTasting);
    return newTasting;
  },

  async updateMenuTasting(id: string, data: any) {
    await delay(300);
    const index = menuTastings.findIndex(t => t._id === id);
    if (index === -1) throw new Error('Menu tasting not found');
    menuTastings[index] = { ...menuTastings[index], ...data };
    return menuTastings[index];
  },

  async deleteMenuTasting(id: string) {
    await delay(300);
    const index = menuTastings.findIndex(t => t._id === id);
    if (index === -1) throw new Error('Menu tasting not found');
    if (menuTastings[index].contractCreated) {
      throw new Error('Cannot delete tasting - contract already created');
    }
    menuTastings.splice(index, 1);
    return { message: 'Menu tasting deleted' };
  },

  async linkContractToTasting(tastingId: string, contractId: string) {
    await delay(300);
    const index = menuTastings.findIndex(t => t._id === tastingId);
    if (index === -1) throw new Error('Menu tasting not found');
    menuTastings[index].contract = contractId;
    menuTastings[index].contractCreated = true;
    menuTastings[index].status = 'completed';
    return menuTastings[index];
  },

  async getTastingStats() {
    await delay(300);
    const completed = menuTastings.filter(t => t.status === 'completed').length;
    const converted = menuTastings.filter(t => t.contractCreated).length;
    return {
      total: menuTastings.length,
      upcoming: menuTastings.filter(t => ['booked', 'confirmed'].includes(t.status)).length,
      today: menuTastings.filter(t => {
        const today = new Date().toDateString();
        return new Date(t.tastingDate).toDateString() === today;
      }).length,
      completed,
      converted,
      conversionRate: completed > 0 ? Math.round((converted / completed) * 100) : 0
    };
  },

  async getAvailableSlots(date: string) {
    await delay(200);
    const timeSlots = ['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];
    const bookedSlots = menuTastings
      .filter(t => new Date(t.tastingDate).toDateString() === new Date(date).toDateString())
      .map(t => t.tastingTime);
    return {
      date,
      allSlots: timeSlots,
      bookedSlots,
      availableSlots: timeSlots.filter(s => !bookedSlots.includes(s))
    };
  },

  // Contract APIs
  async getContracts() {
    await delay(500);
    if (currentUser?.role === 'banquet_supervisor') {
      return contracts.filter(c => c.assignedSupervisor?._id === currentUser.id || c.status === 'approved');
    }
    if (currentUser?.role === 'accounting') {
      return contracts.filter(c => ['submitted', 'accounting_review', 'approved', 'completed'].includes(c.status));
    }
    if (currentUser?.role === 'kitchen') {
      return contracts.filter(c => ['approved', 'completed'].includes(c.status));
    }
    if (['purchasing', 'stockroom'].includes(currentUser?.role)) {
      return contracts.filter(c => ['draft', 'pending_client_signature', 'submitted', 'accounting_review', 'approved', 'completed'].includes(c.status));
    }
    return contracts;
  },

  async getContract(id: string) {
    await delay(300);
    const contract = contracts.find(c => c._id === id);
    if (!contract) throw new Error('Contract not found');
    return contract;
  },

  async createContract(data: any) {
    await delay(500);
    // Validation
    if (!data.clientName || data.clientName.length < 2) {
      throw new Error('Client name must be at least 2 characters');
    }
    if (!data.clientEmail || !data.clientEmail.match(/^\S+@\S+\.\S+$/)) {
      throw new Error('Please enter a valid email address');
    }
    if (!data.clientContact) {
      throw new Error('Contact number is required');
    }
    if (!data.clientAddress?.street || !data.clientAddress?.city || 
        !data.clientAddress?.province || !data.clientAddress?.zipCode) {
      throw new Error('Complete address is required');
    }
    if (!data.venue?.name || !data.venue?.address) {
      throw new Error('Venue name and address are required');
    }
    if (!data.packageSelected || !['basic', 'standard', 'premium', 'deluxe', 'custom'].includes(data.packageSelected)) {
      throw new Error('Package selection is required');
    }
    if (!data.totalPacks || data.totalPacks < 1) {
      throw new Error('Total packs must be at least 1');
    }
    if (!data.packagePrice || data.packagePrice < 0) {
      throw new Error('Package price is required');
    }
    if (!data.totalContractValue || data.totalContractValue < 0) {
      throw new Error('Total contract value is required');
    }
    if (!data.paymentTerms) {
      throw new Error('Payment terms are required');
    }

    const newContract = {
      _id: String(contracts.length + 1),
      contractNumber: `JC-2503-${String(contracts.length + 1).padStart(4, '0')}`,
      status: 'draft',
      progress: 0,
      currentDepartment: 'sales',
      departmentProgress: { sales: 0, accounting: 0, logistics: 0, banquet: 0, kitchen: 0, purchasing: 0, creative: 0, linen: 0 },
      paymentStatus: 'unpaid',
      payments: [],
      menuDetails: [],
      vehicleRequests: [],
      equipmentChecklist: [],
      creativeAssets: [],
      linenRequirements: [],
      slaWarning: false,
      ...data,
      eventDate: data.eventDate || new Date().toISOString(),
      bookingDate: new Date().toISOString(),
      finalDetailsDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    contracts.push(newContract);
    return newContract;
  },

  async updateContract(id: string, data: any) {
    await delay(300);
    const index = contracts.findIndex(c => c._id === id);
    if (index === -1) throw new Error('Contract not found');
    contracts[index] = { ...contracts[index], ...data };
    return contracts[index];
  },

  async deleteContract(id: string) {
    await delay(300);
    contracts = contracts.filter(c => c._id !== id);
    return { message: 'Contract deleted' };
  },

  async submitContract(id: string) {
    await delay(400);
    const index = contracts.findIndex(c => c._id === id);
    if (index === -1) throw new Error('Contract not found');
    contracts[index].status = 'submitted';
    contracts[index].currentDepartment = 'all';
    contracts[index].departmentProgress.sales = 100;
    return contracts[index];
  },

  async approveContract(id: string) {
    await delay(400);
    const index = contracts.findIndex(c => c._id === id);
    if (index === -1) throw new Error('Contract not found');
    contracts[index].status = 'approved';
    contracts[index].departmentProgress.accounting = 100;
    return contracts[index];
  },

  async addPayment(id: string, payment: any) {
    await delay(300);
    const index = contracts.findIndex(c => c._id === id);
    if (index === -1) throw new Error('Contract not found');
    contracts[index].payments = [...(contracts[index].payments || []), payment];
    
    const totalPaid = contracts[index].payments
      .filter((p: any) => p.status === 'completed')
      .reduce((sum: number, p: any) => sum + p.amount, 0);
    
    if (totalPaid >= contracts[index].totalContractValue) {
      contracts[index].paymentStatus = 'paid';
    } else if (totalPaid > 0) {
      contracts[index].paymentStatus = 'partially_paid';
    }
    
    return contracts[index];
  },

  async getDashboardStats() {
    await delay(300);
    return {
      total: contracts.length,
      draft: contracts.filter(c => c.status === 'draft').length,
      submitted: contracts.filter(c => c.status === 'submitted').length,
      approved: contracts.filter(c => c.status === 'approved').length,
      completed: contracts.filter(c => c.status === 'completed').length,
      thisWeek: contracts.filter(c => {
        const days = Math.ceil((new Date(c.eventDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return days <= 7 && days >= 0;
      }).length,
      thisMonth: contracts.filter(c => {
        const days = Math.ceil((new Date(c.eventDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return days <= 30 && days >= 0;
      }).length
    };
  },

  async getIncidents() {
    await delay(400);
    return incidents;
  },

  async createIncident(data: any) {
    await delay(400);
    const newIncident = {
      _id: String(incidents.length + 1),
      ...data,
      reportedBy: { name: currentUser?.name || 'Unknown' },
      reportedAt: new Date().toISOString(),
      status: 'open'
    };
    incidents.push(newIncident);
    return newIncident;
  },

  async updateIncident(id: string, data: any) {
    await delay(300);
    const index = incidents.findIndex(i => i._id === id);
    if (index === -1) throw new Error('Incident not found');
    incidents[index] = { ...incidents[index], ...data };
    return incidents[index];
  },

  async getNotifications() {
    await delay(300);
    return [];
  },

  async getUnreadCount() {
    await delay(200);
    return { count: 0 };
  },

  // Creative Inventory APIs
  async getCreativeInventory() {
    await delay(400);
    return creativeInventory;
  },

  async createCreativeItem(data: any) {
    await delay(500);
    const newItem = {
      _id: 'c' + (creativeInventory.length + 1),
      itemCode: `CRT-${String(creativeInventory.length + 1).padStart(3, '0')}`,
      ...data,
      availableQuantity: data.quantity
    };
    creativeInventory.push(newItem);
    return newItem;
  },

  async updateCreativeItem(id: string, data: any) {
    await delay(300);
    const index = creativeInventory.findIndex(i => i._id === id);
    if (index === -1) throw new Error('Item not found');
    creativeInventory[index] = { ...creativeInventory[index], ...data };
    return creativeInventory[index];
  },

  async deleteCreativeItem(id: string) {
    await delay(300);
    creativeInventory = creativeInventory.filter(i => i._id !== id);
    return { message: 'Item deleted' };
  },

  async getCreativeInventoryStats() {
    await delay(300);
    return {
      total: creativeInventory.length,
      available: creativeInventory.filter(i => i.status === 'available').reduce((sum, i) => sum + i.availableQuantity, 0),
      inUse: creativeInventory.filter(i => i.status === 'in_use').reduce((sum, i) => sum + i.quantity - i.availableQuantity, 0),
      maintenance: creativeInventory.filter(i => i.status === 'maintenance').length
    };
  },

  // Banquet Staff APIs
  async getBanquetStaff() {
    await delay(400);
    return banquetStaff;
  },

  async createBanquetStaff(data: any) {
    await delay(500);
    const newStaff = {
      _id: 'bs' + (banquetStaff.length + 1),
      employeeId: `EMP-${String(banquetStaff.length + 1).padStart(3, '0')}`,
      fullName: `${data.firstName} ${data.lastName}`,
      ...data,
      totalEventsWorked: 0
    };
    banquetStaff.push(newStaff);
    return newStaff;
  },

  async updateBanquetStaff(id: string, data: any) {
    await delay(300);
    const index = banquetStaff.findIndex(s => s._id === id);
    if (index === -1) throw new Error('Staff member not found');
    banquetStaff[index] = { ...banquetStaff[index], ...data };
    if (data.firstName || data.lastName) {
      banquetStaff[index].fullName = `${banquetStaff[index].firstName} ${banquetStaff[index].lastName}`;
    }
    return banquetStaff[index];
  },

  async deleteBanquetStaff(id: string) {
    await delay(300);
    banquetStaff = banquetStaff.filter(s => s._id !== id);
    return { message: 'Staff member deleted' };
  },

  async createStaffAccount(id: string, _data: any) {
    await delay(500);
    const index = banquetStaff.findIndex(s => s._id === id);
    if (index === -1) throw new Error('Staff member not found');
    banquetStaff[index].hasAccount = true;
    banquetStaff[index].accountEmail = banquetStaff[index].email;
    return banquetStaff[index];
  },

  async getBanquetStaffStats() {
    await delay(300);
    const byRole = banquetStaff.reduce((acc: any, staff) => {
      acc[staff.role] = (acc[staff.role] || 0) + 1;
      return acc;
    }, {});
    return {
      total: banquetStaff.length,
      byRole: Object.entries(byRole).map(([role, count]) => ({ _id: role, count }))
    };
  },

  // Logistics APIs
  async getDrivers() {
    await delay(400);
    return drivers.map(d => ({
      ...d,
      assignedTrucks: trucks.filter(t => (t.assignedDriver as any)?._id === d._id)
    }));
  },

  async createDriver(data: any) {
    await delay(500);
    const newDriver = {
      _id: 'd' + (drivers.length + 1),
      driverId: `DRV-${String(drivers.length + 1).padStart(3, '0')}`,
      fullName: `${data.firstName} ${data.lastName}`,
      ...data,
      assignedTrucks: []
    };
    drivers.push(newDriver);
    return newDriver;
  },

  async updateDriver(id: string, data: any) {
    await delay(300);
    const index = drivers.findIndex(d => d._id === id);
    if (index === -1) throw new Error('Driver not found');
    drivers[index] = { ...drivers[index], ...data };
    if (data.firstName || data.lastName) {
      drivers[index].fullName = `${drivers[index].firstName} ${drivers[index].lastName}`;
    }
    return drivers[index];
  },

  async deleteDriver(id: string) {
    await delay(300);
    drivers = drivers.filter(d => d._id !== id);
    trucks = trucks.map(t => ((t.assignedDriver as any)?._id === id) ? { ...t, assignedDriver: null as any } : t);
    return { message: 'Driver deleted' };
  },

  async getTrucks() {
    await delay(400);
    return trucks.map(t => ({
      ...t,
      assignedDriver: drivers.find(d => d._id === (t.assignedDriver as any)?._id) || (t.assignedDriver as any)
    }));
  },

  async createTruck(data: any) {
    await delay(500);
    const newTruck = {
      _id: 'tr' + (trucks.length + 1),
      truckId: `TRK-${String(trucks.length + 1).padStart(3, '0')}`,
      ...data,
      assignedDriver: null
    };
    trucks.push(newTruck);
    return newTruck;
  },

  async updateTruck(id: string, data: any) {
    await delay(300);
    const index = trucks.findIndex(t => t._id === id);
    if (index === -1) throw new Error('Truck not found');
    trucks[index] = { ...trucks[index], ...data };
    return trucks[index];
  },

  async deleteTruck(id: string) {
    await delay(300);
    trucks = trucks.filter(t => t._id !== id);
    return { message: 'Truck deleted' };
  },

  async assignDriverToTruck(truckId: string, driverId: string) {
    await delay(300);
    const truckIndex = trucks.findIndex(t => t._id === truckId);
    if (truckIndex === -1) throw new Error('Truck not found');
    const driver = drivers.find(d => d._id === driverId);
    if (!driver) throw new Error('Driver not found');
    trucks[truckIndex].assignedDriver = driver as any;
    return trucks[truckIndex];
  },

  async getLogisticsStats() {
    await delay(300);
    return {
      totalDrivers: drivers.length,
      totalTrucks: trucks.length,
      availableTrucks: trucks.filter(t => !t.assignedDriver).length,
      assignedTrucks: trucks.filter(t => t.assignedDriver).length
    };
  },

  // Linen Inventory APIs
  async getLinenInventory() {
    await delay(400);
    return linenInventory;
  },

  async createLinenItem(data: any) {
    await delay(500);
    const newItem = {
      _id: 'l' + (linenInventory.length + 1),
      itemCode: `LIN-${String(linenInventory.length + 1).padStart(3, '0')}`,
      ...data,
      availableQuantity: data.quantity,
      washCount: 0
    };
    linenInventory.push(newItem);
    return newItem;
  },

  async updateLinenItem(id: string, data: any) {
    await delay(300);
    const index = linenInventory.findIndex(i => i._id === id);
    if (index === -1) throw new Error('Item not found');
    linenInventory[index] = { ...linenInventory[index], ...data };
    return linenInventory[index];
  },

  async deleteLinenItem(id: string) {
    await delay(300);
    linenInventory = linenInventory.filter(i => i._id !== id);
    return { message: 'Item deleted' };
  },

  async getLinenInventoryStats() {
    await delay(300);
    return {
      total: linenInventory.length,
      available: linenInventory.filter(i => i.status === 'available').reduce((sum, i) => sum + i.availableQuantity, 0),
      inLaundry: linenInventory.filter(i => i.status === 'laundry').reduce((sum, i) => sum + i.quantity - i.availableQuantity, 0),
      lowStock: linenInventory.filter(i => i.availableQuantity <= i.minimumStock).length
    };
  },

  // Admin/User Management APIs
  async getUsers() {
    await delay(400);
    return mockUsers.map(u => ({
      _id: u.id,
      name: u.name,
      email: u.email,
      department: u.department.toLowerCase().replace(' ', '_'),
      role: u.role,
      isActive: true,
      lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    }));
  },

  async createUser(data: any) {
    await delay(500);
    const newUser = {
      id: String(mockUsers.length + 1),
      name: data.name,
      email: data.email,
      role: data.role,
      department: data.department
    };
    mockUsers.push(newUser as any);
    mockPasswords[data.email.toLowerCase()] = data.password || 'password123';
    return newUser;
  },

  async updateUser(id: string, data: any) {
    await delay(300);
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');
    const previousEmail = mockUsers[index].email.toLowerCase();
    mockUsers[index] = { ...mockUsers[index], ...data };
    const nextEmail = mockUsers[index].email.toLowerCase();

    if (previousEmail !== nextEmail) {
      mockPasswords[nextEmail] = mockPasswords[previousEmail] || 'password123';
      delete mockPasswords[previousEmail];
      if (mockResetCodes[previousEmail]) {
        mockResetCodes[nextEmail] = mockResetCodes[previousEmail];
        delete mockResetCodes[previousEmail];
      }
    }

    return mockUsers[index];
  },

  async deleteUser(id: string) {
    await delay(300);
    const index = mockUsers.findIndex(u => u.id === id);
    if (index > -1) {
      const [removedUser] = mockUsers.splice(index, 1);
      delete mockPasswords[removedUser.email.toLowerCase()];
      delete mockResetCodes[removedUser.email.toLowerCase()];
    }
    return { message: 'User deleted' };
  },

  async resetUserPassword(_id: string, _data: any) {
    await delay(300);
    const user = mockUsers.find((item) => item.id === _id);
    if (!user) throw new Error('User not found');
    mockPasswords[user.email.toLowerCase()] = _data?.password || 'password123';
    return { message: 'Password reset successfully' };
  },

  async toggleUserStatus(_id: string, _data: any) {
    await delay(300);
    return { message: 'Status updated' };
  },

  async getUserStats() {
    await delay(300);
    return {
      total: mockUsers.length,
      active: mockUsers.length,
      inactive: 0,
      byDepartment: Object.entries(
        mockUsers.reduce((acc: any, u) => {
          acc[u.department] = (acc[u.department] || 0) + 1;
          return acc;
        }, {})
      ).map(([dept, count]) => ({ _id: dept, count }))
    };
  }
};
