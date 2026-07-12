const mongoose = require('mongoose');

const PROCUREMENT_STATUSES = [
  'requested',
  'awaiting_accounting_approval',
  'approved',
  'proof_submitted',
  'proof_needs_revision',
  'rejected',
  'fulfilled',
  'cancelled'
];

const REQUISITION_TYPES = [
  'item_requisition',
  'purchase_requisition',
  'emergency_requisition'
];

const SLA_STATUSES = [
  'on_track',
  'rush',
  'blocked'
];

const RELEASE_AUTHORIZATION_STATUSES = [
  'locked',
  'authorized',
  'rejected',
  'released'
];

const procurementQuoteSchema = new mongoose.Schema({
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    default: null
  },
  supplierName: {
    type: String,
    trim: true
  },
  supplierContact: {
    type: String,
    trim: true
  },
  supplierEmail: {
    type: String,
    trim: true
  },
  quotedUnitPrice: {
    type: Number,
    min: 0
  },
  quotedTotal: {
    type: Number,
    min: 0
  },
  leadTimeDays: {
    type: Number,
    min: 0
  },
  quoteReference: {
    type: String,
    trim: true
  },
  expectedFulfillmentDate: Date,
  rentalStartDate: Date,
  rentalEndDate: Date,
  notes: {
    type: String,
    trim: true
  },
  submittedAt: Date,
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { _id: false });

const procurementSlaSchema = new mongoose.Schema({
  requiredLeadDays: {
    type: Number,
    min: 0,
    default: 7
  },
  daysUntilNeeded: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: SLA_STATUSES,
    default: 'on_track'
  },
  reviewNote: {
    type: String,
    trim: true
  },
  computedAt: Date
}, { _id: false });

const procurementAccountingChecklistSchema = new mongoose.Schema({
  inventoryNeedValidated: {
    type: Boolean,
    default: false
  },
  supplierVerified: {
    type: Boolean,
    default: false
  },
  pricingReviewed: {
    type: Boolean,
    default: false
  },
  timelineConfirmed: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const procurementAccountingSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedAt: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  notes: {
    type: String,
    trim: true
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  reviewChecklist: {
    type: procurementAccountingChecklistSchema,
    default: () => ({})
  }
}, { _id: false });

const procurementFulfillmentSchema = new mongoose.Schema({
  receivedQuantity: {
    type: Number,
    min: 0
  },
  invoiceReference: {
    type: String,
    trim: true
  },
  rentalStartDate: Date,
  rentalEndDate: Date,
  notes: {
    type: String,
    trim: true
  },
  attachments: {
    type: [String],
    default: []
  },
  confirmationStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'needs_revision'],
    default: 'pending'
  },
  confirmedAt: Date,
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  confirmationNotes: {
    type: String,
    trim: true
  },
  fulfilledAt: Date,
  fulfilledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  inventoryUpdated: {
    type: Boolean,
    default: false
  },
  inventoryUpdateSummary: {
    type: String,
    trim: true
  }
}, { _id: false });

const procurementReleaseAuthorizationSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: RELEASE_AUTHORIZATION_STATUSES,
    default: 'locked'
  },
  authorizedAt: Date,
  authorizedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  signatureLabel: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: false });

const procurementRequestSchema = new mongoose.Schema({
  requestNumber: {
    type: String,
    unique: true
  },
  status: {
    type: String,
    enum: PROCUREMENT_STATUSES,
    default: 'requested'
  },
  department: {
    type: String,
    enum: ['creative', 'linen', 'stockroom'],
    required: true
  },
  requestType: {
    type: String,
    enum: ['purchase', 'rental'],
    required: true
  },
  requisitionType: {
    type: String,
    enum: REQUISITION_TYPES,
    default: 'purchase_requisition'
  },
  source: {
    type: String,
    enum: ['contract_shortage', 'inventory_low_stock', 'manual'],
    default: 'manual'
  },
  sourceSection: {
    type: String,
    trim: true
  },
  contract: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract',
    default: null
  },
  eventDate: Date,
  neededBy: {
    type: Date,
    required: true
  },
  inventoryModel: {
    type: String,
    enum: ['CreativeInventory', 'LinenInventory', 'StockroomInventory'],
    required: true
  },
  inventoryItem: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'inventoryModel',
    default: null
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  itemCode: {
    type: String,
    trim: true
  },
  itemCategory: {
    type: String,
    trim: true
  },
  requestedQuantity: {
    type: Number,
    required: true,
    min: 1
  },
  shortageQuantity: {
    type: Number,
    min: 0,
    default: 0
  },
  requestReason: {
    type: String,
    required: true,
    trim: true
  },
  requestNotes: {
    type: String,
    trim: true
  },
  sla: {
    type: procurementSlaSchema,
    default: () => ({})
  },
  quote: {
    type: procurementQuoteSchema,
    default: () => ({})
  },
  accounting: {
    type: procurementAccountingSchema,
    default: () => ({})
  },
  releaseAuthorization: {
    type: procurementReleaseAuthorizationSchema,
    default: () => ({})
  },
  fulfillment: {
    type: procurementFulfillmentSchema,
    default: () => ({})
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

procurementRequestSchema.pre('save', async function generateRequestNumber() {
  if (this.requestNumber) {
    return;
  }

  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const count = await mongoose.model('ProcurementRequest').countDocuments();
  this.requestNumber = `PR-${year}-${String(count + 1).padStart(4, '0')}`;
});

module.exports = mongoose.model('ProcurementRequest', procurementRequestSchema);
module.exports.PROCUREMENT_STATUSES = PROCUREMENT_STATUSES;
module.exports.REQUISITION_TYPES = REQUISITION_TYPES;
