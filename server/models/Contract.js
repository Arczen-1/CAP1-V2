const mongoose = require('mongoose');

const PRE_EVENT_CHECKLIST_STATUSES = ['pending', 'prepared'];
const LEGACY_ITEM_STATUSES = ['returned'];
const ITEM_STATUS_ENUM = [...PRE_EVENT_CHECKLIST_STATUSES, ...LEGACY_ITEM_STATUSES];
const POST_EVENT_CHECKLIST_STATUSES = ['pending_check', 'checked_ok', 'incident_reported'];
const LEGACY_CHECKLIST_STATUS_MAP = {
  staged: 'prepared',
  setup: 'prepared',
  loaded: 'prepared',
  dispatched: 'prepared',
  returned: 'prepared'
};

const normalizeChecklistStatus = (value) => {
  if (value === undefined || value === null || value === '') {
    return value;
  }

  if (PRE_EVENT_CHECKLIST_STATUSES.includes(value)) {
    return value;
  }

  return LEGACY_CHECKLIST_STATUS_MAP[value] || value;
};

const normalizePostEventStatus = (value, legacyStatus) => {
  if (POST_EVENT_CHECKLIST_STATUSES.includes(value)) {
    return value;
  }

  if (legacyStatus === 'returned') {
    return 'checked_ok';
  }

  return 'pending_check';
};

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildNextContractNumber = async (date = new Date()) => {
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const prefix = `JC-${year}${month}`;
  const contractModel = mongoose.model('Contract');
  const prefixPattern = new RegExp(`^${escapeRegExp(prefix)}-\\d{4}$`);
  const latestContract = await contractModel.findOne({
    contractNumber: prefixPattern
  })
    .sort({ contractNumber: -1 })
    .select('contractNumber')
    .lean();

  const latestSequence = latestContract?.contractNumber
    ? parseInt(String(latestContract.contractNumber).split('-').pop(), 10) || 0
    : 0;

  let nextSequence = latestSequence + 1;
  let candidate = `${prefix}-${String(nextSequence).padStart(4, '0')}`;

  while (await contractModel.exists({ contractNumber: candidate })) {
    nextSequence += 1;
    candidate = `${prefix}-${String(nextSequence).padStart(4, '0')}`;
  }

  return candidate;
};

const menuItemSchema = new mongoose.Schema({
  category: String,
  item: String,
  quantity: Number,
  confirmed: {
    type: Boolean,
    default: false
  }
});

const paymentSchema = new mongoose.Schema({
  amount: Number,
  date: Date,
  method: {
    type: String,
    enum: ['cash', 'check', 'bank_transfer', 'credit_card', 'gcash', 'ewallet']
  },
  reference: String,
  receiptNumber: String,
  receiptIssuedBy: {
    type: String,
    default: 'Juan Carlos'
  },
  receiptGeneratedAt: Date,
  receiptImageUrl: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  }
});

const sectionConfirmationSchema = new mongoose.Schema({
  confirmed: {
    type: Boolean,
    default: false
  },
  confirmedAt: Date,
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { _id: false });

const signaturePartySchema = new mongoose.Schema({
  signedName: String,
  title: String,
  imageUrl: String,
  uploadedAt: Date
}, { _id: false });

// Creative Assets Schema - Connected to database
const creativeAssetSchema = new mongoose.Schema({
  itemId: String,
  item: {
    type: String,
    required: true
  },
  itemCode: String,
  category: {
    type: String,
    enum: ['Backdrop', 'Table Decor', 'Lighting', 'Floral', 'Signage', 'Props', 'Other'],
    required: true
  },
  imageUrl: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ITEM_STATUS_ENUM,
    default: 'pending'
  },
  postEventStatus: {
    type: String,
    enum: POST_EVENT_CHECKLIST_STATUSES,
    default: 'pending_check'
  },
  postEventNotes: String,
  notes: String,
  cost: Number,
  pricePerItem: Number
});

const equipmentChecklistItemSchema = new mongoose.Schema({
  itemId: String,
  item: String,
  itemCode: String,
  category: String,
  imageUrl: String,
  quantity: Number,
  unitPrice: Number,
  notes: String,
  status: {
    type: String,
    enum: ITEM_STATUS_ENUM,
    default: 'pending'
  },
  postEventStatus: {
    type: String,
    enum: POST_EVENT_CHECKLIST_STATUSES,
    default: 'pending_check'
  },
  postEventNotes: String,
});

const linenRequirementSchema = new mongoose.Schema({
  itemId: String,
  type: String,
  itemCode: String,
  category: String,
  imageUrl: String,
  size: String,
  material: String,
  color: String,
  quantity: Number,
  unitPrice: Number,
  notes: String,
  status: {
    type: String,
    enum: ITEM_STATUS_ENUM,
    default: 'pending'
  },
  postEventStatus: {
    type: String,
    enum: POST_EVENT_CHECKLIST_STATUSES,
    default: 'pending_check'
  },
  postEventNotes: String,
});

const logisticsAssignmentSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },
  truck: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Truck',
    default: null
  },
  assignmentStatus: {
    type: String,
    enum: ['pending', 'scheduled', 'ready_for_dispatch', 'dispatched', 'completed'],
    default: 'pending'
  },
  notes: String,
  checkedAt: Date,
  checkedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
});

const BANQUET_ASSIGNMENT_ROLES = [
  'head_captain',
  'service_staff',
  'food_runner',
  'busser',
  'bartender',
  'setup_crew'
];

const banquetStaffingPlanSchema = new mongoose.Schema({
  head_captain: {
    type: Number,
    default: 0,
    min: 0
  },
  service_staff: {
    type: Number,
    default: 0,
    min: 0
  },
  food_runner: {
    type: Number,
    default: 0,
    min: 0
  },
  busser: {
    type: Number,
    default: 0,
    min: 0
  },
  bartender: {
    type: Number,
    default: 0,
    min: 0
  },
  setup_crew: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: false });

const banquetTeamAssignmentSchema = new mongoose.Schema({
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BanquetStaff',
    required: true
  },
  assignmentRole: {
    type: String,
    enum: BANQUET_ASSIGNMENT_ROLES,
    required: true
  }
}, { _id: false });

const banquetAssignmentSchema = new mongoose.Schema({
  serviceGuestCount: {
    type: Number,
    default: 0,
    min: 0
  },
  staffingPlan: {
    type: banquetStaffingPlanSchema,
    default: () => ({})
  },
  assignments: {
    type: [banquetTeamAssignmentSchema],
    default: []
  },
  updatedAt: Date,
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { _id: false });

// Creative Requirements Schema
const creativeRequirementsSchema = new mongoose.Schema({
  theme: String,
  colorPalette: [String],
  style: {
    type: String,
    enum: ['Classic', 'Modern', 'Rustic', 'Vintage', 'Minimalist', 'Glamorous', 'Bohemian', 'Other']
  },
  backdropType: {
    type: String,
    enum: ['Floral Arch', 'Draped Fabric', 'LED Wall', 'Photo Wall', 'Balloon', 'Custom', 'None']
  },
  backdropDetails: String,
  lightingRequirements: [String],
  tableCenterpieces: String,
  specialElements: [String],
  pinterestBoard: String,
  referenceImages: [String]
});

const contractSchema = new mongoose.Schema({
  // Core Contract Info (auto-generated)
  contractNumber: {
    type: String,
    unique: true
  },
  
  // Link to Menu Tasting
  menuTasting: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuTasting',
    default: null
  },
  
  status: {
    type: String,
    enum: ['draft', 'pending_client_signature', 'submitted', 'accounting_review', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'draft'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  currentDepartment: {
    type: String,
    enum: ['sales', 'accounting', 'logistics', 'banquet', 'kitchen', 'purchasing', 'creative', 'linen', 'all'],
    default: 'sales'
  },
  clientSigned: {
    type: Boolean,
    default: false
  },
  clientSignedAt: Date,
  signatureAssets: {
    client: { type: signaturePartySchema, default: () => ({}) },
    staff: { type: signaturePartySchema, default: () => ({}) }
  },

  // Client Details - With Validation
  clientName: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  clientContact: {
    type: String,
    required: [true, 'Contact number is required'],
    minlength: [7, 'Contact number must be at least 7 characters'],
    maxlength: [20, 'Contact number cannot exceed 20 characters']
  },
  clientEmail: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  clientAddress: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    province: {
      type: String,
      required: [true, 'Province is required'],
      trim: true
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required'],
      match: [/^\d{4,6}$/, 'Please enter a valid ZIP code']
    }
  },
  clientType: {
    type: String,
    enum: ['wedding', 'corporate', 'birthday', 'debut', 'anniversary', 'other'],
    required: [true, 'Event type is required']
  },

  // Event Details
  eventDate: {
    type: Date,
    required: [true, 'Event date is required']
  },
  bookingDate: {
    type: Date,
    default: Date.now
  },
  venue: {
    name: {
      type: String,
      required: [true, 'Venue name is required']
    },
    address: {
      type: String,
      required: [true, 'Venue address is required']
    },
    contact: String,
    notes: String
  },
  eventType: String,

  // Package & Menu
  packageSelected: {
    type: String,
    enum: ['basic', 'standard', 'premium', 'deluxe', 'custom'],
    required: [true, 'Package selection is required']
  },
  menuDetails: [menuItemSchema],
  totalPacks: {
    type: Number,
    required: [true, 'Total packs is required'],
    min: [1, 'Must have at least 1 pack']
  },

  // Preferences
  preferredColor: String,
  napkinType: String,
  tableSetup: {
    type: String,
    enum: ['round', 'rectangular', 'cocktail', 'mixed']
  },
  backdropRequirements: String,
  specialRequests: String,

  // Creative - Connected to Database
  creativeRequirements: creativeRequirementsSchema,
  creativeAssets: [creativeAssetSchema],
  setupPerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  setupTeam: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Financial
  packagePrice: {
    type: Number,
    required: [true, 'Package price is required'],
    min: [0, 'Price cannot be negative']
  },
  totalContractValue: {
    type: Number,
    required: [true, 'Total contract value is required'],
    min: [0, 'Value cannot be negative']
  },
  paymentTerms: {
    type: String,
    enum: ['wedding_standard', 'corporate_flexible'],
    required: [true, 'Payment terms are required']
  },
  downPaymentPercent: {
    type: Number,
    default: 60
  },
  finalPaymentPercent: {
    type: Number,
    default: 40
  },
  payments: [paymentSchema],
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partially_paid', 'paid'],
    default: 'unpaid'
  },
  battableSales: Boolean,
  governmentSales: Boolean,

  // Logistics
  vehicleRequests: [{
    type: {
      type: String,
      enum: ['internal', 'rented']
    },
    quantity: Number,
    cubicMeters: Number,
    filedDate: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'dispatched'],
      default: 'pending'
    }
  }],
  estimatedWaiters: Number,
  estimatedVehicles: Number,
  logisticsAssignment: logisticsAssignmentSchema,
  equipmentChecklist: [equipmentChecklistItemSchema],

  // Kitchen
  cookingLocation: {
    type: String,
    enum: ['on_site', 'commissary']
  },
  ingredientStatus: {
    type: String,
    enum: ['pending', 'procured', 'prepared'],
    default: 'pending'
  },

  // Linen
  linenRequirements: [linenRequirementSchema],
  linenStatus: {
    type: String,
    enum: ITEM_STATUS_ENUM,
    default: 'pending'
  },

  // Assignment
  assignedSupervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  banquetAssignment: {
    type: banquetAssignmentSchema,
    default: () => ({})
  },

  // SLA Tracking
  finalDetailsDeadline: Date,
  slaWarning: {
    type: Boolean,
    default: false
  },
  vehicleRequestDeadline: Date,

  // Timestamps
  submittedAt: Date,
  approvedAt: Date,
  completedAt: Date,

  // Department Progress
  departmentProgress: {
    sales: { type: Number, default: 0 },
    accounting: { type: Number, default: 0 },
    logistics: { type: Number, default: 0 },
    banquet: { type: Number, default: 0 },
    kitchen: { type: Number, default: 0 },
    purchasing: { type: Number, default: 0 },
    creative: { type: Number, default: 0 },
    linen: { type: Number, default: 0 }
  },

  sectionConfirmations: {
    details: { type: sectionConfirmationSchema, default: () => ({}) },
    menu: { type: sectionConfirmationSchema, default: () => ({}) },
    preferences: { type: sectionConfirmationSchema, default: () => ({}) },
    payments: { type: sectionConfirmationSchema, default: () => ({}) },
    creative: { type: sectionConfirmationSchema, default: () => ({}) },
    linen: { type: sectionConfirmationSchema, default: () => ({}) },
    stockroom: { type: sectionConfirmationSchema, default: () => ({}) },
    logistics: { type: sectionConfirmationSchema, default: () => ({}) }
  },

  // Notes
  internalNotes: String,
  clientNotes: String
}, {
  timestamps: true
});

contractSchema.pre('validate', function normalizeLegacyChecklistStatuses() {
  this.creativeAssets = (this.creativeAssets || []).map((item) => {
    const legacyStatus = item?.status;
    if (item?.status) {
      item.status = normalizeChecklistStatus(item.status);
    }

    item.postEventStatus = normalizePostEventStatus(item?.postEventStatus, legacyStatus);

    return item;
  });

  this.equipmentChecklist = (this.equipmentChecklist || []).map((item) => {
    const legacyStatus = item?.status;
    if (item?.status) {
      item.status = normalizeChecklistStatus(item.status);
    }

    item.postEventStatus = normalizePostEventStatus(item?.postEventStatus, legacyStatus);

    return item;
  });

  this.linenRequirements = (this.linenRequirements || []).map((item) => {
    const legacyStatus = item?.status;
    if (item?.status) {
      item.status = normalizeChecklistStatus(item.status);
    }

    item.postEventStatus = normalizePostEventStatus(item?.postEventStatus, legacyStatus);

    return item;
  });

  if (this.linenStatus) {
    this.linenStatus = normalizeChecklistStatus(this.linenStatus);
  }
});

// Generate contract number before saving
contractSchema.pre('save', async function() {
  if (!this.contractNumber) {
    this.contractNumber = await buildNextContractNumber();
  }
  
  // Calculate deadlines
  if (this.eventDate) {
    const oneMonthBefore = new Date(this.eventDate);
    oneMonthBefore.setMonth(oneMonthBefore.getMonth() - 1);
    this.finalDetailsDeadline = oneMonthBefore;
    
    const threeDaysBefore = new Date(this.eventDate);
    threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
    this.vehicleRequestDeadline = threeDaysBefore;
    
    // Check SLA warning
    const now = new Date();
    this.slaWarning = now > oneMonthBefore && this.status === 'draft';
  }
  
  // Calculate progress
  const deptProgress = this.departmentProgress;
  const total = Object.values(deptProgress).reduce((a, b) => a + b, 0);
  this.progress = Math.round(total / 8);
});

module.exports = mongoose.model('Contract', contractSchema);
