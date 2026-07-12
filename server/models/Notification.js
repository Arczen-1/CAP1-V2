const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'contract_submitted',
      'contract_approved',
      'payment_received',
      'payment_followup',
      'payment_milestone_due',
      'payment_uncollectible',
      'final_balance_due',
      'contract_on_hold',
      'contract_auto_cancelled',
      'sla_warning',
      'conflict_alert',
      'incident_reported',
      'task_assigned',
      'deadline_reminder'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  contract: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract'
  },
  actionUrl: String,
  actionLabel: String,
  department: String,
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
