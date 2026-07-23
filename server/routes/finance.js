const express = require('express');
const Contract = require('../models/Contract');
const FinanceBudget = require('../models/FinanceBudget');
const ProcurementRequest = require('../models/ProcurementRequest');
const { auth, requireRole } = require('../middleware/auth');
const {
  FINANCE_BUDGET_CATEGORIES,
  getBudgetCheckForRequest,
  getDefaultMonthlyBudgetTemplate,
  getSuggestedMonthlyBudget,
  getBudgetUsage,
  getMonthRange,
  getPeriodMonth,
  getProcurementAmount
} = require('../utils/financeBudgeting');

const router = express.Router();

const parseMoney = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
};

const formatPeriodLabel = (periodMonth) => {
  const { start } = getMonthRange(periodMonth);
  return new Intl.DateTimeFormat('en-PH', {
    month: 'long',
    year: 'numeric'
  }).format(start);
};

const getCompletedPayments = (contracts) => contracts.flatMap((contract) => (
  (contract.payments || [])
    .filter((payment) => payment.status === 'completed')
    .map((payment) => ({
      ...payment,
      contractId: contract._id,
      contractNumber: contract.contractNumber,
      clientName: contract.clientName,
      eventDate: contract.eventDate
    }))
));

const getTotalPaid = (contract) => (contract.payments || [])
  .filter((payment) => payment.status === 'completed')
  .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);

const normalizeCategories = (categories = []) => {
  const categoryByKey = new Map(
    (Array.isArray(categories) ? categories : [])
      .map((category) => [category.key, category])
  );

  return FINANCE_BUDGET_CATEGORIES.map((category) => {
    const submittedCategory = categoryByKey.get(category.key) || {};
    return {
      key: category.key,
      label: category.label,
      allocatedAmount: parseMoney(submittedCategory.allocatedAmount),
      notes: String(submittedCategory.notes || '').trim()
    };
  });
};

router.get('/overview', auth, requireRole(['accounting', 'admin']), async (req, res) => {
  try {
    const periodMonth = /^\d{4}-\d{2}$/.test(String(req.query.month || ''))
      ? String(req.query.month)
      : getPeriodMonth();
    const { start, end } = getMonthRange(periodMonth);
    const usage = await getBudgetUsage(periodMonth);

    const [
      eventContracts,
      paymentContracts,
      procurementRequests
    ] = await Promise.all([
      Contract.find({ eventDate: { $gte: start, $lte: end } })
        .select('contractNumber clientName eventDate status totalContractValue paymentStatus payments')
        .lean(),
      Contract.find({ 'payments.date': { $gte: start, $lte: end } })
        .select('contractNumber clientName eventDate totalContractValue paymentStatus payments')
        .lean(),
      ProcurementRequest.find({ neededBy: { $gte: start, $lte: end } })
        .select('requestNumber status department requestType neededBy itemName requestedQuantity quote accounting fulfillment contract createdAt updatedAt')
        .populate('contract', 'contractNumber clientName eventDate')
        .lean()
    ]);

    const payments = getCompletedPayments(paymentContracts)
      .filter((payment) => {
        const date = new Date(payment.date);
        return date >= start && date <= end;
      });
    const contractRevenue = eventContracts.reduce((sum, contract) => sum + (Number(contract.totalContractValue) || 0), 0);
    const totalCollected = payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
    const totalPaidOnEventContracts = eventContracts.reduce((sum, contract) => sum + getTotalPaid(contract), 0);
    const accountsReceivable = Math.max(0, contractRevenue - totalPaidOnEventContracts);
    const pendingApprovalRequests = procurementRequests.filter((request) => request.status === 'awaiting_accounting_approval');
    const approvalQueue = await Promise.all(pendingApprovalRequests.map(async (request) => {
      const check = await getBudgetCheckForRequest(request);
      return {
        _id: request._id,
        requestNumber: request.requestNumber,
        department: request.department,
        requestType: request.requestType,
        itemName: request.itemName,
        neededBy: request.neededBy,
        contract: request.contract,
        amount: getProcurementAmount(request),
        canApprove: check.canApprove,
        budgetMessage: check.message,
        availableBudget: check.category?.availableAmount || 0,
        remainingAfterApproval: check.remainingAfterApproval ?? null
      };
    }));

    const budget = usage.budget ? {
      _id: usage.budget._id,
      periodMonth: usage.budget.periodMonth,
      status: usage.budget.status,
      totalBudget: usage.budget.totalBudget,
      sourceOfFunds: usage.budget.sourceOfFunds,
      notes: usage.budget.notes,
      categories: usage.budget.categories,
      approvedAt: usage.budget.approvedAt,
      updatedAt: usage.budget.updatedAt
    } : null;
    const budgetTemplate = getDefaultMonthlyBudgetTemplate();
    const budgetSuggestion = await getSuggestedMonthlyBudget(periodMonth);

    res.json({
      periodMonth,
      periodLabel: formatPeriodLabel(periodMonth),
      dateRange: { startDate: start.toISOString(), endDate: end.toISOString() },
      budget,
      budgetTemplate,
      budgetSuggestion,
      defaultCategories: FINANCE_BUDGET_CATEGORIES,
      summary: {
        contractRevenue,
        totalCollected,
        accountsReceivable,
        collectionRate: contractRevenue > 0 ? totalPaidOnEventContracts / contractRevenue : 0,
        totalBudget: Number(budget?.totalBudget) || 0,
        allocatedBudget: usage.totals.allocatedAmount,
        unallocatedBudget: Math.max(0, (Number(budget?.totalBudget) || 0) - usage.totals.allocatedAmount),
        pendingBudgetRequests: usage.totals.pendingAmount,
        openCommitments: usage.totals.committedAmount,
        confirmedExpenses: usage.totals.spentAmount,
        remainingAllocatedBudget: usage.totals.availableAmount,
        cashAfterExpensesAndCommitments: totalCollected - usage.totals.spentAmount - usage.totals.committedAmount
      },
      departmentBudgets: usage.categories,
      approvalQueue,
      recentPayments: payments
        .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
        .slice(0, 8),
      recentExpenses: procurementRequests
        .filter((request) => request.status === 'fulfilled' || request.fulfillment?.confirmationStatus === 'confirmed')
        .sort((left, right) => new Date(right.updatedAt || right.createdAt).getTime() - new Date(left.updatedAt || left.createdAt).getTime())
        .slice(0, 8)
        .map((request) => ({
          _id: request._id,
          requestNumber: request.requestNumber,
          department: request.department,
          itemName: request.itemName,
          amount: getProcurementAmount(request),
          reference: request.fulfillment?.invoiceReference,
          confirmedAt: request.fulfillment?.confirmedAt,
          neededBy: request.neededBy
        }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load finance overview', error: error.message });
  }
});

router.put('/budget/:periodMonth', auth, requireRole(['accounting', 'admin']), async (req, res) => {
  try {
    const periodMonth = String(req.params.periodMonth || '').trim();
    if (!/^\d{4}-\d{2}$/.test(periodMonth)) {
      return res.status(400).json({ message: 'Budget month must use YYYY-MM format' });
    }

    const totalBudget = parseMoney(req.body?.totalBudget);
    const categories = normalizeCategories(req.body?.categories);
    const allocatedTotal = categories.reduce((sum, category) => sum + category.allocatedAmount, 0);

    if (allocatedTotal > totalBudget) {
      return res.status(400).json({
        message: 'Department allocations cannot exceed the total monthly budget',
        issues: [{ allocatedTotal, totalBudget }]
      });
    }

    const status = ['draft', 'active', 'closed'].includes(req.body?.status)
      ? req.body.status
      : 'active';
    const sourceOfFunds = ['client_collections', 'monthly_allocation', 'management_approved', 'mixed'].includes(req.body?.sourceOfFunds)
      ? req.body.sourceOfFunds
      : 'monthly_allocation';

    let budget = await FinanceBudget.findOne({ periodMonth });
    if (!budget) {
      budget = new FinanceBudget({ periodMonth, preparedBy: req.user._id });
    }

    budget.totalBudget = totalBudget;
    budget.status = status;
    budget.sourceOfFunds = sourceOfFunds;
    budget.categories = categories;
    budget.notes = String(req.body?.notes || '').trim();
    budget.preparedBy = budget.preparedBy || req.user._id;

    if (status === 'active') {
      budget.approvedBy = req.user._id;
      budget.approvedAt = budget.approvedAt || new Date();
    }

    await budget.save();

    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: 'Failed to save monthly finance budget', error: error.message });
  }
});

module.exports = router;
