const mongoose = require('mongoose');

const creativeInventorySchema = new mongoose.Schema({
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
    enum: ['Backdrop', 'Table Decor', 'Lighting', 'Floral', 'Signage', 'Props', 'Drapery', 'Centerpiece', 'Other'],
    required: true
  },
  subCategory: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
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
    enum: ['excellent', 'good', 'fair', 'needs_repair', 'damaged'],
    default: 'good'
  },
  // Location
  storageLocation: {
    type: String,
    trim: true
  },
  // Dimensions for logistics planning
  dimensions: {
    length: Number, // in cm
    width: Number,
    height: Number,
    weight: Number // in kg
  },
  // Rental/Purchase info
  acquisition: {
    type: {
      type: String,
      enum: ['purchased', 'rented', 'custom_made'],
      default: 'purchased'
    },
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
    enum: ['available', 'in_use', 'maintenance', 'retired'],
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
creativeInventorySchema.pre('validate', async function() {
  if ((this.availableQuantity === undefined || this.availableQuantity === null) && typeof this.quantity === 'number') {
    this.availableQuantity = this.quantity;
  }

  if (!this.itemCode) {
    const prefix = 'CR';
    const categoryCode = this.category.substring(0, 3).toUpperCase();
    const count = await mongoose.model('CreativeInventory').countDocuments();
    this.itemCode = `${prefix}-${categoryCode}-${String(count + 1).padStart(4, '0')}`;
  }
});

module.exports = mongoose.model('CreativeInventory', creativeInventorySchema);
