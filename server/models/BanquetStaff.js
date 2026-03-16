const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const banquetStaffSchema = new mongoose.Schema({
  // Employee ID
  employeeId: {
    type: String,
    unique: true,
    required: true
  },
  // Personal Info
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  fullName: {
    type: String
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  address: {
    street: String,
    city: String,
    province: String,
    zipCode: String
  },
  // Role & Position
  role: {
    type: String,
    enum: [
      'waiter',           // Service staff
      'waitress',         // Service staff
      'event_manager',    // Manages events
      'supervisor',       // Supervises staff
      'head_captain',     // Lead service
      'bartender',        // Bar service
      'food_runner',      // Delivers food
      'busser',           // Clears tables
      'setup_crew',       // Sets up venue
      'coordinator',      // Event coordination
      'other'
    ],
    required: true
  },
  // Employment Status
  employmentType: {
    type: String,
    enum: ['full_time', 'part_time', 'contractual', 'on_call'],
    default: 'full_time'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'on_leave', 'terminated'],
    default: 'active'
  },
  // Employment Dates
  dateHired: {
    type: Date,
    default: Date.now
  },
  dateTerminated: Date,
  // Account (optional - for staff who need login)
  hasAccount: {
    type: Boolean,
    default: false
  },
  accountEmail: {
    type: String,
    sparse: true,
    lowercase: true
  },
  // Skills & Certifications
  skills: [String],
  certifications: [{
    name: String,
    issuedBy: String,
    dateIssued: Date,
    dateExpires: Date,
    documentUrl: String
  }],
  // Experience
  yearsOfExperience: {
    type: Number,
    default: 0
  },
  // Emergency Contact
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  // Bank Info for payroll
  bankInfo: {
    bankName: String,
    accountNumber: String,
    accountName: String
  },
  // Rate/Salary
  ratePerDay: {
    type: Number,
    default: 0
  },
  ratePerHour: {
    type: Number,
    default: 0
  },
  // Documents
  documents: [{
    name: String,
    url: String,
    type: String
  }],
  // Notes
  notes: String,
  // Performance tracking
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  totalEventsWorked: {
    type: Number,
    default: 0
  },
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

// Generate full name and employee ID before saving
banquetStaffSchema.pre('save', async function() {
  this.fullName = `${this.firstName} ${this.lastName}`;
  
  if (!this.employeeId) {
    const prefix = 'BS';
    const year = new Date().getFullYear().toString().slice(-2);
    const count = await mongoose.model('BanquetStaff').countDocuments();
    this.employeeId = `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
  }
});

module.exports = mongoose.model('BanquetStaff', banquetStaffSchema);
