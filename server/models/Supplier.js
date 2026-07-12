const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  contactPerson: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  province: {
    type: String,
    trim: true
  },
  serviceAreas: [{
    type: String,
    trim: true
  }],
  departments: [{
    type: String,
    enum: ['creative', 'linen', 'stockroom']
  }],
  requestTypes: [{
    type: String,
    enum: ['purchase', 'rental']
  }],
  supportedCategories: [{
    type: String,
    trim: true
  }],
  supportedKeywords: [{
    type: String,
    trim: true
  }],
  isPreferred: {
    type: Boolean,
    default: false
  },
  priority: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Supplier', supplierSchema);
