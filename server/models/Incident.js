const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  contract: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract',
    required: true
  },
  department: {
    type: String,
    enum: ['sales', 'accounting', 'logistics', 'banquet', 'kitchen', 'purchasing', 'creative', 'linen', 'all'],
    default: 'all'
  },
  incidentType: {
    type: String,
    enum: [
      'burnt_cloth',
      'damaged_equipment',
      'missing_item',
      'food_spoilage',
      'vehicle_breakdown',
      'staff_issue',
      'client_complaint',
      'other'
    ],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  sourceSection: String,
  inventoryItemName: String,
  inventoryItemCode: String,
  affectedQuantity: {
    type: Number,
    min: 1
  },
  eventDate: {
    type: Date,
    required: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedAt: {
    type: Date,
    default: Date.now
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  status: {
    type: String,
    enum: ['open', 'in_review', 'resolved', 'closed'],
    default: 'open'
  },
  resolution: String,
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  attachments: [String],
  departmentNotified: [{
    department: String,
    notifiedAt: Date
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Incident', incidentSchema);
