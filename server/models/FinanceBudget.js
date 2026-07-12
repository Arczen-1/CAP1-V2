const mongoose = require('mongoose');

const FINANCE_BUDGET_CATEGORIES = [
  { key: 'creative', label: 'Creative Inventory' },
  { key: 'linen', label: 'Linen Inventory' },
  { key: 'stockroom', label: 'Stockroom / Equipment' },
  { key: 'kitchen', label: 'Kitchen Supplies' },
  { key: 'logistics', label: 'Logistics' },
  { key: 'banquet', label: 'Banquet Operations' },
  { key: 'contingency', label: 'Contingency / Emergency' },
  { key: 'administration', label: 'Administration' }
];

const financeBudgetCategorySchema = new mongoose.Schema({
  key: {
    type: String,
    enum: FINANCE_BUDGET_CATEGORIES.map((category) => category.key),
    required: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  allocatedAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: false });

const financeBudgetSchema = new mongoose.Schema({
  periodMonth: {
    type: String,
    required: true,
    unique: true,
    match: [/^\d{4}-\d{2}$/, 'Period month must use YYYY-MM format']
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'closed'],
    default: 'active'
  },
  totalBudget: {
    type: Number,
    min: 0,
    default: 0
  },
  sourceOfFunds: {
    type: String,
    enum: ['client_collections', 'monthly_allocation', 'management_approved', 'mixed'],
    default: 'monthly_allocation'
  },
  categories: {
    type: [financeBudgetCategorySchema],
    default: () => FINANCE_BUDGET_CATEGORIES.map((category) => ({
      ...category,
      allocatedAmount: 0
    }))
  },
  notes: {
    type: String,
    trim: true
  },
  preparedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: Date
}, {
  timestamps: true
});

financeBudgetSchema.pre('validate', function normalizeCategories() {
  const categoryByKey = new Map((this.categories || []).map((category) => [category.key, category]));

  this.categories = FINANCE_BUDGET_CATEGORIES.map((category) => {
    const existingCategory = categoryByKey.get(category.key) || {};
    return {
      key: category.key,
      label: category.label,
      allocatedAmount: Math.max(0, Number(existingCategory.allocatedAmount) || 0),
      notes: String(existingCategory.notes || '').trim()
    };
  });

  if (this.status === 'active' && !this.approvedAt) {
    this.approvedAt = new Date();
  }
});

module.exports = mongoose.model('FinanceBudget', financeBudgetSchema);
module.exports.FINANCE_BUDGET_CATEGORIES = FINANCE_BUDGET_CATEGORIES;
