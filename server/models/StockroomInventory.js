const mongoose = require('mongoose');

const stockroomInventorySchema = new mongoose.Schema({
  // Item Reference
  itemCode: {
    type: String,
    unique: true,
    required: [true, 'Item code is required']
  },
  
  // Item Information
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['Chair', 'Table', 'Tent', 'Equipment', 'Tool', 'Decor', 'Other'],
    required: [true, 'Category is required']
  },
  subcategory: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Images
  images: [{
    url: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  referenceUrl: String,
  
  // Quantity Management
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  availableQuantity: {
    type: Number,
    required: [true, 'Available quantity is required'],
    min: [0, 'Available quantity cannot be negative'],
    default: 0
  },
  reservedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  minimumStock: {
    type: Number,
    default: 10,
    min: 0
  },
  
  // Item Details
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'damaged'],
    default: 'good'
  },
  status: {
    type: String,
    enum: ['available', 'in_use', 'reserved', 'maintenance', 'retired'],
    default: 'available'
  },
  
  // Dimensions (for logistics planning)
  dimensions: {
    length: Number,  // cm
    width: Number,   // cm
    height: Number,  // cm
    weight: Number   // kg
  },
  
  // Storage Location
  storageLocation: {
    warehouse: String,
    section: String,
    shelf: String,
    bin: String
  },
  
  // Pricing
  purchasePrice: {
    type: Number,
    min: 0
  },
  rentalPricePerDay: {
    type: Number,
    min: 0
  },
  replacementCost: {
    type: Number,
    min: 0
  },
  
  // Purchase Info
  supplier: {
    name: String,
    contact: String,
    email: String
  },
  purchaseDate: Date,
  warrantyExpiry: Date,
  
  // Maintenance
  lastMaintenanceDate: Date,
  nextMaintenanceDate: Date,
  maintenanceNotes: String,
  
  // Usage Tracking
  totalRentals: {
    type: Number,
    default: 0
  },
  lastUsedDate: Date,
  
  // Notes
  notes: String,
  internalNotes: String
  
}, {
  timestamps: true
});

// Generate required defaults before validation so new items can be created without manual item codes.
stockroomInventorySchema.pre('validate', async function() {
  if (this.isNew || this.isModified('quantity') || this.isModified('reservedQuantity')) {
    this.updateAvailable();
  }

  if (!this.itemCode) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const prefix = this.category.substring(0, 3).toUpperCase();
    const count = await mongoose.model('StockroomInventory').countDocuments({ category: this.category });
    this.itemCode = `${prefix}-${year}-${(count + 1).toString().padStart(4, '0')}`;
  }
});

// Update available quantity
stockroomInventorySchema.methods.updateAvailable = function() {
  this.availableQuantity = this.quantity - this.reservedQuantity;
  if (this.availableQuantity < 0) this.availableQuantity = 0;
};

// Check if stock is low
stockroomInventorySchema.methods.isLowStock = function() {
  return this.availableQuantity <= this.minimumStock;
};

module.exports = mongoose.model('StockroomInventory', stockroomInventorySchema);
