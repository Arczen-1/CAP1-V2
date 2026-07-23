const FinanceBudget = require('../models/FinanceBudget');
const ProcurementRequest = require('../models/ProcurementRequest');
const { FINANCE_BUDGET_CATEGORIES } = require('../models/FinanceBudget');

const PROCUREMENT_BUDGET_STATUSES = [
  'awaiting_accounting_approval',
  'approved',
  'proof_submitted',
  'proof_needs_revision',
  'fulfilled'
];

const DEFAULT_MONTHLY_BUDGET_TEMPLATE = {
  totalBudget: 300000,
  status: 'active',
  sourceOfFunds: 'monthly_allocation',
  notes: 'Standard monthly operating budget template. Accounting may adjust allocations based on event volume, expected collections, and management instructions before saving.',
  categories: [
    { key: 'creative', allocatedAmount: 50000, notes: 'Styling rentals, decor replacement, floral and prop support.' },
    { key: 'linen', allocatedAmount: 45000, notes: 'Tablecloths, napkins, chair covers, sashes, and laundry-related replacements.' },
    { key: 'stockroom', allocatedAmount: 40000, notes: 'Tables, chairs, equipment, utensils, and emergency stockroom replacements.' },
    { key: 'kitchen', allocatedAmount: 30000, notes: 'Kitchen consumables, ingredients, tools, and prep supplies.' },
    { key: 'logistics', allocatedAmount: 25000, notes: 'Transport support, vehicle-related needs, fuel buffer, and delivery support.' },
    { key: 'banquet', allocatedAmount: 25000, notes: 'Banquet operations support and staffing-related requirements.' },
    { key: 'contingency', allocatedAmount: 20000, notes: 'Emergency buffer for urgent event requirements.' },
    { key: 'administration', allocatedAmount: 10000, notes: 'Administrative and miscellaneous operating support.' }
  ]
};

const getDefaultMonthlyBudgetTemplate = () => ({
  ...DEFAULT_MONTHLY_BUDGET_TEMPLATE,
  categories: FINANCE_BUDGET_CATEGORIES.map((category) => {
    const templateCategory = DEFAULT_MONTHLY_BUDGET_TEMPLATE.categories.find((entry) => entry.key === category.key);

    return {
      key: category.key,
      label: category.label,
      allocatedAmount: Number(templateCategory?.allocatedAmount) || 0,
      notes: templateCategory?.notes || ''
    };
  })
});

const startOfMonth = (periodMonth) => {
  const [year, month] = String(periodMonth).split('-').map(Number);
  return new Date(year, month - 1, 1, 0, 0, 0, 0);
};

const endOfMonth = (periodMonth) => {
  const start = startOfMonth(periodMonth);
  return new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
};

const getPeriodMonth = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const year = safeDate.getFullYear();
  const month = String(safeDate.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const getMonthRange = (periodMonth) => ({
  start: startOfMonth(periodMonth),
  end: endOfMonth(periodMonth)
});

const getProcurementAmount = (request) => (
  Number(request.quote?.quotedTotal)
  || ((Number(request.quote?.quotedUnitPrice) || 0) * (Number(request.requestedQuantity) || 0))
  || 0
);

const getBudgetUsage = async (periodMonth) => {
  const { start, end } = getMonthRange(periodMonth);
  const budget = await FinanceBudget.findOne({ periodMonth }).lean();
  const requests = await ProcurementRequest.find({
    neededBy: { $gte: start, $lte: end },
    status: { $in: PROCUREMENT_BUDGET_STATUSES }
  }).lean();

  const categoryRows = FINANCE_BUDGET_CATEGORIES.map((category) => {
    const budgetCategory = budget?.categories?.find((entry) => entry.key === category.key);
    const categoryRequests = requests.filter((request) => request.department === category.key);
    const pendingAmount = categoryRequests
      .filter((request) => request.status === 'awaiting_accounting_approval')
      .reduce((sum, request) => sum + getProcurementAmount(request), 0);
    const committedAmount = categoryRequests
      .filter((request) => ['approved', 'proof_submitted', 'proof_needs_revision'].includes(request.status))
      .reduce((sum, request) => sum + getProcurementAmount(request), 0);
    const spentAmount = categoryRequests
      .filter((request) => request.status === 'fulfilled' || request.fulfillment?.confirmationStatus === 'confirmed')
      .reduce((sum, request) => sum + getProcurementAmount(request), 0);
    const allocatedAmount = Number(budgetCategory?.allocatedAmount) || 0;
    const usedAmount = committedAmount + spentAmount;

    return {
      key: category.key,
      label: category.label,
      allocatedAmount,
      pendingAmount,
      committedAmount,
      spentAmount,
      usedAmount,
      availableAmount: allocatedAmount - usedAmount,
      utilizationPercent: allocatedAmount > 0 ? Math.round((usedAmount / allocatedAmount) * 100) : 0,
      notes: budgetCategory?.notes || ''
    };
  });

  return {
    budget,
    periodMonth,
    categories: categoryRows,
    requests,
    totals: {
      allocatedAmount: categoryRows.reduce((sum, row) => sum + row.allocatedAmount, 0),
      pendingAmount: categoryRows.reduce((sum, row) => sum + row.pendingAmount, 0),
      committedAmount: categoryRows.reduce((sum, row) => sum + row.committedAmount, 0),
      spentAmount: categoryRows.reduce((sum, row) => sum + row.spentAmount, 0),
      usedAmount: categoryRows.reduce((sum, row) => sum + row.usedAmount, 0),
      availableAmount: categoryRows.reduce((sum, row) => sum + row.availableAmount, 0)
    }
  };
};

// Builds a data-derived budget suggestion: each department's allocation is the
// trailing 3-month average of its confirmed procurement spend. Categories with
// no tracked spend history (kitchen, logistics, banquet, contingency, admin -
// procurement only records creative/linen/stockroom) fall back to the standard
// template amount. This gives Accounting a defensible answer to "what basis?".
const getSuggestedMonthlyBudget = async (periodMonth, lookbackMonths = 3) => {
  const { start } = getMonthRange(periodMonth);
  const windowStart = new Date(start.getFullYear(), start.getMonth() - lookbackMonths, 1, 0, 0, 0, 0);
  const windowEnd = new Date(start.getTime() - 1); // just before the target month

  const spendRequests = await ProcurementRequest.find({
    neededBy: { $gte: windowStart, $lte: windowEnd },
    $or: [
      { status: 'fulfilled' },
      { 'fulfillment.confirmationStatus': 'confirmed' }
    ]
  }).lean();

  const spendByDepartment = spendRequests.reduce((totals, request) => {
    totals[request.department] = (totals[request.department] || 0) + getProcurementAmount(request);
    return totals;
  }, {});

  const template = getDefaultMonthlyBudgetTemplate();
  const monthLabel = (date) => new Intl.DateTimeFormat('en-PH', { month: 'short', year: 'numeric' }).format(date);
  const basisWindowLabel = `${monthLabel(windowStart)} - ${monthLabel(windowEnd)}`;
  const derivedDepartments = ['creative', 'linen', 'stockroom'];

  const categories = template.categories.map((category) => {
    const templateAmount = Number(category.allocatedAmount) || 0;
    if (derivedDepartments.includes(category.key) && spendByDepartment[category.key] > 0) {
      const average = Math.ceil((spendByDepartment[category.key] / lookbackMonths) / 100) * 100; // round up to nearest 100
      return {
        key: category.key,
        label: category.label,
        allocatedAmount: average,
        notes: `Trailing ${lookbackMonths}-month average confirmed spend (${basisWindowLabel}).`
      };
    }

    return {
      key: category.key,
      label: category.label,
      allocatedAmount: templateAmount,
      notes: 'Standard template amount (no tracked procurement spend for this category).'
    };
  });

  const totalBudget = categories.reduce((sum, category) => sum + category.allocatedAmount, 0);

  return {
    periodMonth,
    status: 'active',
    sourceOfFunds: 'monthly_allocation',
    lookbackMonths,
    basisWindow: basisWindowLabel,
    totalBudget,
    notes: `Suggested from the trailing ${lookbackMonths}-month average of confirmed procurement spend (${basisWindowLabel}). Creative, linen, and stockroom are derived from actual spend; other categories use the standard template amount. Review and adjust before saving.`,
    categories
  };
};

const getBudgetCheckForRequest = async (request) => {
  const periodMonth = getPeriodMonth(request.neededBy || new Date());
  const usage = await getBudgetUsage(periodMonth);
  const amount = getProcurementAmount(request);
  const category = usage.categories.find((entry) => entry.key === request.department);
  const hasActiveBudget = usage.budget?.status === 'active';

  if (!hasActiveBudget) {
    return {
      canApprove: false,
      periodMonth,
      amount,
      category,
      message: `No active finance budget is set for ${periodMonth}. Set and activate the monthly budget before approving this request.`
    };
  }

  if (!category || category.allocatedAmount <= 0) {
    return {
      canApprove: false,
      periodMonth,
      amount,
      category,
      message: `${category?.label || request.department} has no allocated budget for ${periodMonth}.`
    };
  }

  if (amount <= 0) {
    return {
      canApprove: false,
      periodMonth,
      amount,
      category,
      message: 'This request does not have a valid quoted total for budget approval.'
    };
  }

  if (category.availableAmount < amount) {
    return {
      canApprove: false,
      periodMonth,
      amount,
      category,
      message: `Insufficient ${category.label} budget. Available budget is ${category.availableAmount}, but this request needs ${amount}.`
    };
  }

  return {
    canApprove: true,
    periodMonth,
    amount,
    category,
    remainingAfterApproval: category.availableAmount - amount,
    message: `${category.label} has enough available budget for this request.`
  };
};

module.exports = {
  DEFAULT_MONTHLY_BUDGET_TEMPLATE,
  FINANCE_BUDGET_CATEGORIES,
  getDefaultMonthlyBudgetTemplate,
  getSuggestedMonthlyBudget,
  getBudgetUsage,
  getBudgetCheckForRequest,
  getMonthRange,
  getPeriodMonth,
  getProcurementAmount
};
