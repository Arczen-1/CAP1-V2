const mongoose = require('mongoose');

const kitchenInventorySchema = new mongoose.Schema({
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
    enum: ['Utensil', 'Cookware', 'Serveware', 'Appliance', 'Tool', 'Container', 'Ingredient', 'Other'],
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
    default: 5,
    min: 0
  },
  unit: {
    type: String,
    enum: ['piece', 'set', 'dozen', 'kg', 'g', 'L', 'mL', 'box', 'pack'],
    default: 'piece'
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
  
  // For appliances/tools
  brand: String,
  model: String,
  serialNumber: String,
  
  // Storage Location
  storageLocation: {
    area: String,      // e.g., "Main Kitchen", "Prep Area"
    section: String,   // e.g., "Utensil Rack", "Shelf A"
    container: String  // e.g., "Bin 1", "Drawer 3"
  },
  
  // Pricing
  purchasePrice: {
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
  
  // Maintenance (for appliances)
  lastMaintenanceDate: Date,
  nextMaintenanceDate: Date,
  maintenanceNotes: String,
  
  // Usage Tracking
  totalUses: {
    type: Number,
    default: 0
  },
  lastUsedDate: Date,
  
  // For consumables/ingredients
  expiryDate: Date,
  batchNumber: String,
  
  // Notes
  notes: String,
  internalNotes: String
  
}, {
  timestamps: true
});

// Generate required defaults before validation so new items can be created without manual item codes.
kitchenInventorySchema.pre('validate', async function() {
  if (this.isNew || this.isModified('quantity') || this.isModified('reservedQuantity')) {
    this.updateAvailable();
  }

  if (!this.itemCode) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const prefix = this.category.substring(0, 3).toUpperCase();
    const count = await mongoose.model('KitchenInventory').countDocuments({ category: this.category });
    this.itemCode = `${prefix}-${year}-${(count + 1).toString().padStart(4, '0')}`;
  }
});

// Update available quantity
kitchenInventorySchema.methods.updateAvailable = function() {
  this.availableQuantity = this.quantity - this.reservedQuantity;
  if (this.availableQuantity < 0) this.availableQuantity = 0;
};

// Check if stock is low
kitchenInventorySchema.methods.isLowStock = function() {
  return this.availableQuantity <= this.minimumStock;
};

// Check if expired (for consumables)
kitchenInventorySchema.methods.isExpired = function() {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
};

module.exports = mongoose.model('KitchenInventory', kitchenInventorySchema);
