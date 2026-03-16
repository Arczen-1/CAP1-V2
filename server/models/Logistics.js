const mongoose = require('mongoose');

// Driver Schema
const driverSchema = new mongoose.Schema({
  driverId: {
    type: String,
    unique: true,
    required: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  fullName: String,
  email: {
    type: String,
    lowercase: true
  },
  phone: {
    type: String,
    required: true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  licenseType: {
    type: String,
    enum: ['1', '2', '3', 'professional'],
    default: 'professional'
  },
  licenseExpiry: Date,
  // Employment
  employmentType: {
    type: String,
    enum: ['full_time', 'part_time', 'contractual', 'on_call'],
    default: 'full_time'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'on_leave', 'suspended'],
    default: 'active'
  },
  // Experience
  yearsOfExperience: {
    type: Number,
    default: 0
  },
  // Documents
  documents: [{
    name: String,
    url: String
  }],
  // Assigned trucks
  assignedTrucks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Truck'
  }],
  notes: String,
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

driverSchema.pre('validate', async function() {
  this.fullName = `${this.firstName} ${this.lastName}`;
  
  if (!this.driverId) {
    const prefix = 'DRV';
    const count = await mongoose.model('Driver').countDocuments();
    this.driverId = `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }
});

// Truck Schema
const truckSchema = new mongoose.Schema({
  truckId: {
    type: String,
    unique: true,
    required: true
  },
  // Vehicle Info
  plateNumber: {
    type: String,
    required: [true, 'Plate number is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  truckType: {
    type: String,
    enum: [
      'closed_van',       // Closed van
      'open_truck',       // Open truck/bakal
      'refrigerated',     // Refrigerated truck
      'wing_van',         // Wing van
      'flatbed',          // Flatbed
      'mini_truck',       // Small truck
      'lorry',            // Large lorry
      'other'
    ],
    required: true
  },
  brand: {
    type: String,
    trim: true
  },
  model: String,
  year: Number,
  color: String,
  // Capacity
  capacity: {
    weight: Number,      // in kg
    volume: Number,      // in cubic meters
    dimensions: {
      length: Number,    // in cm
      width: Number,
      height: Number
    }
  },
  // Ownership
  ownership: {
    type: String,
    enum: ['owned', 'rented', 'leased', 'contracted'],
    default: 'owned'
  },
  // Status
  status: {
    type: String,
    enum: ['available', 'in_use', 'maintenance', 'repair', 'retired'],
    default: 'available'
  },
  // Registration
  registrationDate: Date,
  registrationExpiry: Date,
  orCrNumber: String,
  // Insurance
  insurance: {
    provider: String,
    policyNumber: String,
    expiryDate: Date
  },
  // Maintenance
  lastMaintenance: Date,
  nextMaintenance: Date,
  maintenanceNotes: String,
  // Assigned driver
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
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
  // Usage tracking
  totalTrips: {
    type: Number,
    default: 0
  },
  notes: String,
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

truckSchema.pre('validate', async function() {
  if (!this.truckId) {
    const prefix = 'TRK';
    const typeCode = this.truckType.substring(0, 3).toUpperCase();
    const count = await mongoose.model('Truck').countDocuments();
    this.truckId = `${prefix}-${typeCode}-${String(count + 1).padStart(4, '0')}`;
  }
});

const Driver = mongoose.model('Driver', driverSchema);
const Truck = mongoose.model('Truck', truckSchema);

module.exports = { Driver, Truck };
