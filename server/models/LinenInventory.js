const mongoose = require('mongoose');

const linenInventorySchema = new mongoose.Schema({
  itemCode: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['Tablecloth', 'Napkin', 'Runner', 'Overlay', 'Chair Cover', 'Sash', 'Skirting', 'Other'],
    required: true
  },
  // Size/Type
  size: {
    type: String,
    enum: ['small', 'medium', 'large', 'extra_large', 'round_60', 'round_72', 'round_90', 'banquet', 'custom'],
    required: true
  },
  dimensions: {
    length: Number,  // in inches or cm
    width: Number,
    unit: {
      type: String,
      enum: ['inches', 'cm'],
      default: 'inches'
    }
  },
  // Material & Color
  material: {
    type: String,
    enum: ['Polyester', 'Satin', 'Cotton', 'Linen', 'Spandex', 'Taffeta', 'Organza', 'Velvet', 'Other'],
    required: true
  },
  color: {
    type: String,
    required: true
  },
  colorCode: String, // For specific color tracking
  // Images/references
  images: [{
    url: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  referenceUrl: String,
  // Inventory tracking
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 1
  },
  pricePerItem: {
    type: Number,
    min: 0
  },
  rentalPricePerDay: {
    type: Number,
    min: 0
  },
  availableQuantity: {
    type: Number,
    default: function() { return this.quantity; },
    min: 0
  },
  // Condition tracking
  condition: {
    type: String,
    enum: ['new', 'excellent', 'good', 'fair', 'stained', 'damaged', 'needs_replacement'],
    default: 'good'
  },
  // Minimum stock alert
  minimumStock: {
    type: Number,
    default: 10
  },
  // Laundry tracking
  lastWashed: Date,
  washCount: {
    type: Number,
    default: 0
  },
  // Storage
  storageLocation: {
    type: String,
    trim: true
  },
  // Acquisition
  acquisition: {
    date: Date,
    cost: Number,
    supplier: String
  },
  // Usage tracking
  totalUses: {
    type: Number,
    default: 0
  },
  lastUsed: Date,
  // Status
  status: {
    type: String,
    enum: ['available', 'in_use', 'laundry', 'maintenance', 'retired'],
    default: 'available'
  },
  // Notes
  notes: String,
  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate required defaults before validation so new items can be created without manual item codes.
linenInventorySchema.pre('validate', async function() {
  if ((this.availableQuantity === undefined || this.availableQuantity === null) && typeof this.quantity === 'number') {
    this.availableQuantity = this.quantity;
  }

  if (!this.itemCode) {
    const prefix = 'LN';
    const categoryCode = this.category.substring(0, 3).toUpperCase();
    const count = await mongoose.model('LinenInventory').countDocuments();
    this.itemCode = `${prefix}-${categoryCode}-${String(count + 1).padStart(4, '0')}`;
  }
});

module.exports = mongoose.model('LinenInventory', linenInventorySchema);
