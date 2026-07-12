const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: [
      'sales',
      'accounting',
      'logistics',
      'banquet_supervisor',
      'kitchen',
      'purchasing',
      'stockroom',
      'creative',
      'linen',
      'admin'
    ],
    required: true
  },
  department: {
    type: String,
    enum: [
      'Sales',
      'Accounting',
      'Logistics',
      'Banquet Operations',
      'Kitchen',
      'Purchasing',
      'Stockroom',
      'Creative',
      'Linen',
      'Admin'
    ],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  passwordResetToken: {
    type: String
  },
  passwordResetExpiresAt: {
    type: Date
  },
  lastLogin: {
    type: Date
  },
  assignedContracts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract'
  }]
}, {
  timestamps: true
});

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
