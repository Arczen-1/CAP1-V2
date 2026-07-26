const express = require('express');
const Contract = require('../models/Contract');
const MenuTasting = require('../models/MenuTasting');
const ProcurementRequest = require('../models/ProcurementRequest');
const Incident = require('../models/Incident');
const User = require('../models/User');
const CreativeInventory = require('../models/CreativeInventory');
const LinenInventory = require('../models/LinenInventory');
const StockroomInventory = require('../models/StockroomInventory');
const KitchenInventory = require('../models/KitchenInventory');
const BanquetStaff = require('../models/BanquetStaff');
const Supplier = require('../models/Supplier');
const { Driver, Truck } = require('../models/Logistics');
const { auth } = require('../middleware/auth');

const router = express.Router();

const ROLE_LABELS = {
  sales: 'Sales',
  accounting: 'Accounting',
  logistics: 'Logistics',
  banquet_supervisor: 'Banquet',
  kitchen: 'Kitchen',
  purchasing: 'Purchasing',
  stockroom: 'Stockroom',
  creative: 'Creative',
  linen: 'Linen',
  admin: 'Admin'
};

const ROLE_INCIDENT_DEPARTMENTS = {
  sales: ['sales', 'all'],
  accounting: ['accounting', 'all'],
  logistics: ['logistics', 'all'],
  banquet_supervisor: ['banquet', 'all'],
  kitchen: ['kitchen', 'all'],
  purchasing: ['purchasing', 'all'],
  stockroom: ['logistics', 'all'],
  creative: ['creative', 'all'],
  linen: ['linen', 'all']
};

const PROCUREMENT_DEPARTMENT_BY_ROLE = {
  creative: 'creative',
  linen: 'linen',
  stockroom: 'stockroom',
  logistics: 'stockroom'
};

const CONTRACT_SELECT = [
  'contractNumber',
  'clientName',
  'clientType',
  'eventDate',
  'status',
  'packageSelected',
  'totalPacks',
  'totalContractValue',
  'paymentStatus',
  'payments',
  'clientSigned',
  'clientSignedAt',
  'venue',
  'menuDetails',
  'ingredientStatus',
  'creativeAssets',
  'linenRequirements',
  'equipmentChecklist',
  'logisticsAssignment',
  'banquetAssignment',
  'departmentProgress',
  'sectionConfirmations',
  'createdAt',
  'updatedAt'
].join(' ');

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const numberFormatter = new Intl.NumberFormat('en-PH');

const startOfDay = (date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const endOfDay = (date) => {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
};

const getDateRange = (query = {}) => {
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const parsedStart = query.startDate ? new Date(query.startDate) : defaultStart;
  const parsedEnd = query.endDate ? new Date(query.endDate) : now;
  const startDate = Number.isNaN(parsedStart.getTime()) ? defaultStart : parsedStart;
  const endDate = Number.isNaN(parsedEnd.getTime()) ? now : parsedEnd;

  return {
    start: startOfDay(startDate),
    end: endOfDay(endDate)
  };
};

const formatDateInput = (value) => new Date(value).toISOString().slice(0, 10);

const formatDateLabel = (value) => {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value));
};

const formatCurrency = (value) => currencyFormatter.format(Number(value) || 0);
const formatNumber = (value) => numberFormatter.format(Number(value) || 0);
const formatPercent = (value) => `${Math.round((Number(value) || 0) * 100)}%`;

const titleCase = (value) => String(value || 'Not set')
  .replace(/_/g, ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const safeArray = (value) => Array.isArray(value) ? value : [];

const countBy = (items, getKey) => items.reduce((counts, item) => {
  const key = getKey(item) || 'Not set';
  counts[key] = (counts[key] || 0) + 1;
  return counts;
}, {});

const sumBy = (items, getValue) => items.reduce((total, item) => total + (Number(getValue(item)) || 0), 0);

const uniqueById = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = String(item?._id || item?.requestNumber || JSON.stringify(item));
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const getTotalPaid = (contract) => sumBy(
  safeArray(contract.payments).filter((payment) => payment.status === 'completed'),
  (payment) => payment.amount
);

const MONEY_EPSILON = 0.005;
const addMonths = (value, months) => {
  const date = new Date(value);
  date.setMonth(date.getMonth() + months);
  return date;
};

// Ages an outstanding balance by the milestone currently owed: the down payment
// (40% due 2 months after booking) if it is not yet satisfied, otherwise the
// final balance (due 2 months before the event). This mirrors the collection
// rules the compliance sweep enforces, so the aging report is defensible.
const getReceivableAging = (contract, now = new Date()) => {
  const total = Number(contract.totalContractValue) || 0;
  const paid = getTotalPaid(contract);
  const balance = Math.max(0, total - paid);
  const rawDown = Number(contract.downPaymentPercent);
  const rawFinal = Number(contract.finalPaymentPercent);
  const fullPaymentPlan = rawDown >= 100 || rawFinal <= 0;
  const downPercent = fullPaymentPlan
    ? 100
    : (Number.isFinite(rawDown) && rawDown > 0 && rawDown < 100 ? rawDown : 40);
  const requiredDown = Math.round(total * downPercent) / 100;
  const downSatisfied = paid + MONEY_EPSILON >= requiredDown;
  const bookingDate = contract.bookingDate || contract.createdAt || now;
  const fortyDueDate = addMonths(bookingDate, 2);
  const finalDueDate = addMonths(new Date(contract.eventDate || now), -2);
  const dueDate = downSatisfied ? finalDueDate : fortyDueDate;
  const stage = downSatisfied
    ? 'Final balance'
    : (fullPaymentPlan ? 'Full payment' : `${downPercent}% down payment`);
  const daysOverdue = Math.floor((startOfDay(now).getTime() - startOfDay(dueDate).getTime()) / (1000 * 60 * 60 * 24));

  return { balance, stage, dueDate, daysOverdue };
};

const AGING_BUCKETS = [
  { key: 'not_due', label: 'Not Yet Due', test: (days) => days <= 0 },
  { key: '1_30', label: '1-30 Days', test: (days) => days >= 1 && days <= 30 },
  { key: '31_60', label: '31-60 Days', test: (days) => days >= 31 && days <= 60 },
  { key: '61_90', label: '61-90 Days', test: (days) => days >= 61 && days <= 90 },
  { key: 'over_90', label: 'Over 90 Days', test: (days) => days > 90 }
];

const getAgingBucketLabel = (daysOverdue) => (
  AGING_BUCKETS.find((bucket) => bucket.test(daysOverdue)) || AGING_BUCKETS[0]
).label;

const buildAgingSummary = (contracts, now = new Date()) => {
  const owing = contracts
    .map((contract) => ({ contract, aging: getReceivableAging(contract, now) }))
    .filter((entry) => entry.aging.balance > MONEY_EPSILON);

  const buckets = AGING_BUCKETS.map((bucket) => {
    const rows = owing.filter((entry) => bucket.test(entry.aging.daysOverdue));
    return {
      key: bucket.key,
      label: bucket.label,
      count: rows.length,
      amount: sumBy(rows, (row) => row.aging.balance)
    };
  });

  return {
    owing,
    buckets,
    totalOutstanding: sumBy(owing, (entry) => entry.aging.balance),
    overdueAmount: sumBy(buckets.filter((bucket) => bucket.key !== 'not_due'), (bucket) => bucket.amount),
    overdueCount: buckets.filter((bucket) => bucket.key !== 'not_due').reduce((sum, bucket) => sum + bucket.count, 0)
  };
};

const buildAgingRows = (owing, limit = 15) => owing
  .slice()
  .sort((left, right) => right.aging.daysOverdue - left.aging.daysOverdue)
  .slice(0, limit)
  .map(({ contract, aging }) => ({
    contractNumber: contract.contractNumber,
    clientName: contract.clientName,
    stage: aging.stage,
    dueDate: formatDateLabel(aging.dueDate),
    daysOverdue: aging.daysOverdue > 0 ? `${aging.daysOverdue} days` : 'Not yet due',
    balance: formatCurrency(aging.balance),
    bucket: getAgingBucketLabel(aging.daysOverdue)
  }));

// Trailing-N-month collection series so the report shows a trend, not just a
// single-period total. Months with no collections are kept so the timeline is
// continuous.
const buildCollectionsTrend = (payments, end, months = 6) => {
  const anchor = new Date(end.getFullYear(), end.getMonth(), 1);
  const series = [];

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const monthStart = new Date(anchor.getFullYear(), anchor.getMonth() - offset, 1);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999);
    const collected = safeArray(payments)
      .filter((payment) => payment.status === 'completed')
      .filter((payment) => {
        const date = payment.date ? new Date(payment.date) : null;
        return date && date >= monthStart && date <= monthEnd;
      })
      .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);

    series.push({
      label: new Intl.DateTimeFormat('en-PH', { month: 'short', year: '2-digit' }).format(monthStart),
      value: Math.round(collected)
    });
  }

  return series;
};

// Generic trailing-N-month series: counts (or sums) rows by month so every
// department can see workload/demand as a trend instead of a single total.
const buildMonthlySeries = (rows, getDate, end, months = 6, getValue = () => 1) => {
  const anchor = new Date(end.getFullYear(), end.getMonth(), 1);
  const series = [];

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const monthStart = new Date(anchor.getFullYear(), anchor.getMonth() - offset, 1);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999);
    const total = safeArray(rows).reduce((sum, row) => {
      const raw = getDate(row);
      const date = raw ? new Date(raw) : null;
      return date && date >= monthStart && date <= monthEnd ? sum + (Number(getValue(row)) || 0) : sum;
    }, 0);

    series.push({
      label: new Intl.DateTimeFormat('en-PH', { month: 'short', year: '2-digit' }).format(monthStart),
      value: Math.round(total)
    });
  }

  return series;
};

// Decision insights: short, data-driven callouts ranked warning-first so the
// reader sees what needs action before the raw tables.
const makeInsight = (tone, title, detail) => ({ tone, title, detail });
const rankInsights = (insights) => {
  const order = { warning: 0, info: 1, positive: 2 };
  return insights.filter(Boolean).sort((left, right) => (order[left.tone] ?? 3) - (order[right.tone] ?? 3));
};

const getProcurementAmount = (request) => (
  Number(request.quote?.quotedTotal)
  || ((Number(request.quote?.quotedUnitPrice) || 0) * (Number(request.requestedQuantity) || 0))
  || 0
);

const getProcurementFinancials = (requests = []) => {
  const pendingBudgetRequests = requests.filter((request) => request.status === 'awaiting_accounting_approval');
  const approvedCommitments = requests.filter((request) => ['approved', 'proof_submitted', 'proof_needs_revision'].includes(request.status));
  const confirmedExpenses = requests.filter((request) => request.status === 'fulfilled' || request.fulfillment?.confirmationStatus === 'confirmed');
  const rejectedRequests = requests.filter((request) => request.status === 'rejected');

  return {
    pendingBudgetRequests,
    approvedCommitments,
    confirmedExpenses,
    rejectedRequests,
    pendingBudgetAmount: sumBy(pendingBudgetRequests, getProcurementAmount),
    approvedCommitmentAmount: sumBy(approvedCommitments, getProcurementAmount),
    confirmedExpenseAmount: sumBy(confirmedExpenses, getProcurementAmount),
    rejectedAmount: sumBy(rejectedRequests, getProcurementAmount)
  };
};

const buildReceivableRows = (contracts, limit = 15) => contracts
  .slice()
  .sort((left, right) => new Date(left.eventDate).getTime() - new Date(right.eventDate).getTime())
  .slice(0, limit)
  .map((contract) => {
    const contractValue = Number(contract.totalContractValue) || 0;
    const paidAmount = getTotalPaid(contract);
    const balance = Math.max(0, contractValue - paidAmount);

    return {
      contractNumber: contract.contractNumber,
      clientName: contract.clientName,
      eventDate: formatDateLabel(contract.eventDate),
      contractValue: formatCurrency(contractValue),
      collected: formatCurrency(paidAmount),
      balance: formatCurrency(balance),
      paymentStatus: titleCase(contract.paymentStatus)
    };
  });

const buildProcurementBudgetRows = (requests, limit = 15) => requests
  .slice()
  .sort((left, right) => new Date(left.neededBy || left.createdAt).getTime() - new Date(right.neededBy || right.createdAt).getTime())
  .slice(0, limit)
  .map((request) => ({
    requestNumber: request.requestNumber,
    department: titleCase(request.department),
    itemName: request.itemName,
    status: titleCase(request.status),
    budgetAmount: getProcurementAmount(request) ? formatCurrency(getProcurementAmount(request)) : 'No quote yet',
    neededBy: formatDateLabel(request.neededBy)
  }));

const buildFinancialPositionRows = ({
  contractValue,
  totalCollected,
  outstandingBalance,
  collectionRate,
  procurementFinancials,
  availableOperatingBudget
}) => ([
  {
    account: 'Projected Contract Revenue',
    amount: formatCurrency(contractValue),
    classification: 'Revenue',
    explanation: 'Total value of contracts with event dates in the selected period'
  },
  {
    account: 'Cash Collections Received',
    amount: formatCurrency(totalCollected),
    classification: 'Cash Inflow',
    explanation: 'Completed client payments posted in the selected period'
  },
  {
    account: 'Accounts Receivable',
    amount: formatCurrency(outstandingBalance),
    classification: outstandingBalance > 0 ? 'Collectible Balance' : 'Settled',
    explanation: 'Uncollected balance from contracts in the selected period'
  },
  {
    account: 'Collection Rate',
    amount: formatPercent(collectionRate),
    classification: 'Performance',
    explanation: 'Collected amount compared with projected contract revenue'
  },
  {
    account: 'Pending Budget Requests',
    amount: formatCurrency(procurementFinancials.pendingBudgetAmount),
    classification: 'For Approval',
    explanation: 'Purchasing requests waiting for accounting budget approval'
  },
  {
    account: 'Approved Procurement Commitments',
    amount: formatCurrency(procurementFinancials.approvedCommitmentAmount),
    classification: 'Committed Budget',
    explanation: 'Approved or proof-submitted purchasing amounts not yet fully closed'
  },
  {
    account: 'Confirmed Procurement Expenses',
    amount: formatCurrency(procurementFinancials.confirmedExpenseAmount),
    classification: 'Expense',
    explanation: 'Purchasing expenses confirmed or fulfilled in the system'
  },
  {
    account: 'Available Operating Budget Estimate',
    amount: formatCurrency(availableOperatingBudget),
    classification: availableOperatingBudget >= 0 ? 'Available' : 'Over-Allocated',
    explanation: 'Collections less confirmed expenses and approved open commitments'
  }
]);

const getPaymentsInRange = (contracts, start, end) => contracts.flatMap((contract) => (
  safeArray(contract.payments)
    .filter((payment) => {
      const paymentDate = payment.date ? new Date(payment.date) : null;
      return paymentDate && paymentDate >= start && paymentDate <= end;
    })
    .map((payment) => ({
      contractNumber: contract.contractNumber,
      clientName: contract.clientName,
      amount: Number(payment.amount) || 0,
      date: payment.date,
      method: payment.method,
      receiptNumber: payment.receiptNumber,
      status: payment.status
    }))
));

const mapToChartItems = (counts) => Object.entries(counts)
  .map(([label, value]) => ({ label: titleCase(label), value }))
  .sort((left, right) => right.value - left.value);

const makeCard = (label, value, helper = '', tone = 'default') => ({
  label,
  value: String(value),
  helper,
  tone
});

// kind: 'breakdown' renders as a composition (donut + bars); 'trend' renders as a
// month-by-month timeline. Trend charts keep zero months so the timeline is
// continuous and dips are visible.
const makeChart = (id, title, items, description = '', kind = 'breakdown') => ({
  id,
  title,
  description,
  kind,
  items: kind === 'trend' ? items : items.filter((item) => Number(item.value) > 0)
});

const makeSection = (id, title, description, columns, rows, emptyMessage = 'No records found for the selected date range.') => ({
  id,
  title,
  description,
  columns,
  rows,
  emptyMessage
});

const contractColumns = [
  { key: 'contractNumber', label: 'Contract' },
  { key: 'clientName', label: 'Client' },
  { key: 'eventDate', label: 'Event Date' },
  { key: 'status', label: 'Status' },
  { key: 'value', label: 'Value' }
];

const buildContractRows = (contracts, limit = 12) => contracts
  .slice()
  .sort((left, right) => new Date(left.eventDate).getTime() - new Date(right.eventDate).getTime())
  .slice(0, limit)
  .map((contract) => ({
    contractNumber: contract.contractNumber,
    clientName: contract.clientName,
    eventDate: formatDateLabel(contract.eventDate),
    status: titleCase(contract.status),
    value: formatCurrency(contract.totalContractValue)
  }));

const getContractSummary = (contracts) => {
  const totalValue = sumBy(contracts, (contract) => contract.totalContractValue);
  const signedCount = contracts.filter((contract) => contract.clientSigned).length;
  const approvedCount = contracts.filter((contract) => ['approved', 'completed'].includes(contract.status)).length;

  return {
    totalValue,
    signedCount,
    approvedCount,
    averageValue: contracts.length ? totalValue / contracts.length : 0
  };
};

const getInventorySnapshot = async (model, config) => {
  const items = await model.find().lean();
  const totalQuantity = sumBy(items, (item) => item.quantity);
  const availableQuantity = sumBy(items, (item) => item.availableQuantity);
  const lowStockItems = items.filter(config.isLowStock);
  const attentionItems = items.filter(config.needsAttention);

  return {
    label: config.label,
    items,
    totalItems: items.length,
    totalQuantity,
    availableQuantity,
    lowStockItems,
    attentionItems,
    statusChart: mapToChartItems(countBy(items, (item) => item.status)),
    categoryChart: mapToChartItems(countBy(items, (item) => item.category))
  };
};

const getInventoryConfigs = () => ({
  creative: {
    label: 'Creative',
    model: CreativeInventory,
    isLowStock: (item) => Number(item.availableQuantity) <= 0,
    needsAttention: (item) => ['needs_repair', 'damaged'].includes(item.condition) || ['maintenance', 'retired'].includes(item.status)
  },
  linen: {
    label: 'Linen',
    model: LinenInventory,
    isLowStock: (item) => Number(item.availableQuantity) <= Number(item.minimumStock || 10),
    needsAttention: (item) => ['stained', 'damaged', 'needs_replacement'].includes(item.condition) || ['laundry', 'maintenance', 'retired'].includes(item.status)
  },
  stockroom: {
    label: 'Stockroom',
    model: StockroomInventory,
    isLowStock: (item) => Number(item.availableQuantity) <= Number(item.minimumStock || 10),
    needsAttention: (item) => ['poor', 'damaged'].includes(item.condition) || ['maintenance', 'retired'].includes(item.status)
  },
  kitchen: {
    label: 'Kitchen',
    model: KitchenInventory,
    isLowStock: (item) => Number(item.availableQuantity) <= Number(item.minimumStock || 5),
    needsAttention: (item) => ['poor', 'damaged'].includes(item.condition) || ['maintenance', 'retired'].includes(item.status)
  }
});

const buildInventoryTableRows = (items, limit = 12) => items
  .slice(0, limit)
  .map((item) => ({
    itemCode: item.itemCode || 'No code',
    name: item.name,
    category: titleCase(item.category),
    available: `${formatNumber(item.availableQuantity)} / ${formatNumber(item.quantity)}`,
    status: titleCase(item.status),
    condition: titleCase(item.condition)
  }));

const buildProcurementRows = (requests, limit = 12) => requests
  .slice()
  .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
  .slice(0, limit)
  .map((request) => ({
    requestNumber: request.requestNumber,
    department: titleCase(request.department),
    itemName: request.itemName,
    status: titleCase(request.status),
    neededBy: formatDateLabel(request.neededBy),
    amount: request.quote?.quotedTotal ? formatCurrency(request.quote.quotedTotal) : 'No quote yet'
  }));

const buildIncidentRows = (incidents, limit = 12) => incidents
  .slice()
  .sort((left, right) => new Date(right.reportedAt || right.createdAt).getTime() - new Date(left.reportedAt || left.createdAt).getTime())
  .slice(0, limit)
  .map((incident) => ({
    type: titleCase(incident.incidentType),
    department: titleCase(incident.department),
    severity: titleCase(incident.severity),
    status: titleCase(incident.status),
    reportedAt: formatDateLabel(incident.reportedAt || incident.createdAt),
    item: incident.inventoryItemName || 'General'
  }));

const buildSalesReport = ({ contracts, menuTastings, paymentContracts, bookingTrendContracts = [], start, end }) => {
  const summary = getContractSummary(contracts);
  const payments = getPaymentsInRange(paymentContracts, start, end).filter((payment) => payment.status === 'completed');
  const convertedTastings = menuTastings.filter((tasting) => tasting.contractCreated || tasting.contract).length;
  const conversionRate = menuTastings.length > 0 ? convertedTastings / menuTastings.length : null;
  const unsignedNearEvent = contracts.filter((contract) => {
    if (contract.clientSigned || ['completed', 'cancelled'].includes(contract.status)) {
      return false;
    }
    const daysToEvent = Math.ceil((new Date(contract.eventDate).getTime() - Date.now()) / 86400000);
    return daysToEvent >= 0 && daysToEvent <= 60;
  });
  const bookingTrend = buildMonthlySeries(bookingTrendContracts, (contract) => contract.createdAt, end);
  const bookedValueTrend = buildMonthlySeries(bookingTrendContracts, (contract) => contract.createdAt, end, 6, (contract) => contract.totalContractValue);
  const latestBookings = bookingTrend[bookingTrend.length - 1]?.value || 0;
  const previousBookings = bookingTrend[bookingTrend.length - 2]?.value || 0;

  return {
    title: 'Sales Report',
    subtitle: 'Booking momentum, tasting-to-contract conversion, pipeline health, and sales value to guide selling priorities.',
    insights: rankInsights([
      unsignedNearEvent.length > 0
        ? makeInsight('warning', `${unsignedNearEvent.length} unsigned contract(s) with events inside 60 days`, `Chase signatures first: ${unsignedNearEvent.slice(0, 3).map((contract) => contract.contractNumber).join(', ')}${unsignedNearEvent.length > 3 ? '…' : ''}. Payments cannot be collected until the client signs.`)
        : makeInsight('positive', 'No unsigned contracts near their event date', 'Every event inside the next 60 days already has a signed contract.'),
      conversionRate !== null
        ? (conversionRate < 0.5
          ? makeInsight('warning', `Tasting conversion is ${formatPercent(conversionRate)}`, 'Fewer than half of tastings become contracts. Review follow-up timing and pricing objections raised during tastings.')
          : makeInsight('positive', `Tasting conversion is ${formatPercent(conversionRate)}`, `${convertedTastings} of ${menuTastings.length} tastings in this period became contracts.`))
        : null,
      latestBookings < previousBookings
        ? makeInsight('info', 'Bookings dipped versus last month', `${latestBookings} contract(s) booked this month vs ${previousBookings} last month. Consider pushing tasting invitations to refill the pipeline.`)
        : makeInsight('info', 'Booking momentum is steady or growing', `${latestBookings} contract(s) booked this month vs ${previousBookings} last month.`),
    ]),
    summaryCards: [
      makeCard('Contracts In Range', contracts.length, 'Contracts with event dates in this period'),
      makeCard('Signed Contracts', `${summary.signedCount}/${contracts.length}`, 'Client signature already recorded', summary.signedCount === contracts.length && contracts.length > 0 ? 'success' : 'default'),
      makeCard('Contract Value', formatCurrency(summary.totalValue), `Average ${formatCurrency(summary.averageValue)} per contract`, 'success'),
      makeCard('Tasting Conversion', conversionRate !== null ? formatPercent(conversionRate) : 'No tastings', `${convertedTastings} of ${menuTastings.length} tastings became contracts`, conversionRate !== null && conversionRate < 0.5 ? 'warning' : 'default')
    ],
    charts: [
      makeChart('booking-trend', 'Contracts Booked Per Month', bookingTrend, 'New contracts created each month (trailing 6 months) - the leading indicator of future revenue.', 'trend'),
      makeChart('booked-value-trend', 'Booked Value Per Month (PHP)', bookedValueTrend, 'Total value of contracts created each month (trailing 6 months).', 'trend'),
      makeChart('sales-funnel', 'Pipeline Funnel', [
        { label: 'Tastings Held', value: menuTastings.length },
        { label: 'Contracts Created', value: contracts.length },
        { label: 'Signed', value: summary.signedCount },
        { label: 'Approved For Prep', value: summary.approvedCount }
      ], 'Where prospects drop off between tasting and an approved event.'),
      makeChart('event-type', 'Event Type Mix', mapToChartItems(countBy(contracts, (contract) => contract.clientType)), 'Which market segments drive this period.'),
      makeChart('package-mix', 'Package Mix', mapToChartItems(countBy(contracts, (contract) => contract.packageSelected)), 'Which packages sell - guides pricing and promo focus.')
    ],
    sections: [
      makeSection('contracts', 'Contract Pipeline', 'Contracts handled by Sales within the selected event date range.', contractColumns, buildContractRows(contracts)),
      makeSection('menu-tastings', 'Menu Tasting Bookings', 'Bookings scheduled in the selected date range.', [
        { key: 'tastingNumber', label: 'Booking' },
        { key: 'clientName', label: 'Client' },
        { key: 'tastingDate', label: 'Tasting Date' },
        { key: 'status', label: 'Status' },
        { key: 'contractCreated', label: 'Contract' }
      ], menuTastings.slice(0, 12).map((tasting) => ({
        tastingNumber: tasting.tastingNumber,
        clientName: tasting.clientName,
        tastingDate: `${formatDateLabel(tasting.tastingDate)} ${tasting.tastingTime || ''}`.trim(),
        status: titleCase(tasting.status),
        contractCreated: tasting.contractCreated ? 'Created' : 'Not yet'
      }))),
      makeSection('payments', 'Payments Posted', 'Payments recorded during the selected date range.', [
        { key: 'contractNumber', label: 'Contract' },
        { key: 'clientName', label: 'Client' },
        { key: 'date', label: 'Date' },
        { key: 'amount', label: 'Amount' },
        { key: 'method', label: 'Method' }
      ], payments.slice(0, 12).map((payment) => ({
        ...payment,
        date: formatDateLabel(payment.date),
        amount: formatCurrency(payment.amount),
        method: titleCase(payment.method)
      })))
    ]
  };
};

const buildAccountingReport = ({ contracts, procurementRequests, paymentContracts, receivableContracts = [], trendPayments = [], start, end }) => {
  const payments = getPaymentsInRange(paymentContracts, start, end);
  const completedPayments = payments.filter((payment) => payment.status === 'completed');
  const totalCollected = sumBy(completedPayments, (payment) => payment.amount);
  const contractValue = sumBy(contracts, (contract) => contract.totalContractValue);
  const totalPaidOnContracts = sumBy(contracts, getTotalPaid);
  const outstandingBalance = Math.max(0, contractValue - totalPaidOnContracts);
  const collectionRate = contractValue > 0 ? totalPaidOnContracts / contractValue : 0;
  const approvalQueue = contracts.filter((contract) => ['submitted', 'accounting_review'].includes(contract.status));
  const procurementFinancials = getProcurementFinancials(procurementRequests);
  const budgetQueue = procurementFinancials.pendingBudgetRequests;
  const expenseQueue = procurementRequests.filter((request) => request.status === 'proof_submitted');
  const availableOperatingBudget = totalCollected
    - procurementFinancials.confirmedExpenseAmount
    - procurementFinancials.approvedCommitmentAmount;
  const aging = buildAgingSummary(receivableContracts);
  const collectionsTrend = buildCollectionsTrend(trendPayments, end);

  const worstBucket = [...aging.buckets].reverse().find((bucket) => bucket.key !== 'not_due' && bucket.amount > 0);
  const latestCollections = collectionsTrend[collectionsTrend.length - 1]?.value || 0;
  const previousCollections = collectionsTrend[collectionsTrend.length - 2]?.value || 0;

  return {
    title: 'Accounting / Finance Report',
    subtitle: 'Financial position, collections trend, receivables aging, budget commitments, procurement expenses, and accounting action items.',
    insights: rankInsights([
      aging.overdueAmount > 0
        ? makeInsight('warning', `${formatCurrency(aging.overdueAmount)} is past due across ${aging.overdueCount} account(s)`, `Oldest exposure sits in the ${worstBucket?.label || 'overdue'} bucket. Start collection follow-ups from the top of the aging schedule below.`)
        : makeInsight('positive', 'No receivable is past its milestone due date', 'All outstanding balances are still within their collection windows.'),
      collectionRate < 0.6 && contractValue > 0
        ? makeInsight('warning', `Collection rate is ${formatPercent(collectionRate)}`, 'Less than 60% of projected revenue in this period has been collected. Prioritize the 40% and final-balance milestones before event dates lock preparation.')
        : null,
      budgetQueue.length > 0
        ? makeInsight('info', `${budgetQueue.length} budget request(s) waiting for approval`, `${formatCurrency(procurementFinancials.pendingBudgetAmount)} in purchasing is blocked until Accounting decides. Departments cannot buy until released.`)
        : null,
      latestCollections < previousCollections
        ? makeInsight('info', 'Cash collections dipped versus last month', `${formatCurrency(latestCollections)} collected this month vs ${formatCurrency(previousCollections)} last month.`)
        : null,
      availableOperatingBudget < 0
        ? makeInsight('warning', 'Commitments exceed collections', `The operating position is ${formatCurrency(availableOperatingBudget)}. Slow down new budget approvals or accelerate collections.`)
        : null,
    ]),
    summaryCards: [
      makeCard('Contract Revenue', formatCurrency(contractValue), 'Projected revenue from contracts in range', 'success'),
      makeCard('Cash Collected', formatCurrency(totalCollected), `${formatPercent(collectionRate)} collection rate`, 'success'),
      makeCard('Accounts Receivable', formatCurrency(outstandingBalance), 'Uncollected client balance', outstandingBalance ? 'warning' : 'success'),
      makeCard('Overdue A/R', formatCurrency(aging.overdueAmount), `${aging.overdueCount} contract(s) past a milestone due date`, aging.overdueAmount ? 'warning' : 'success'),
      makeCard('Available Budget Est.', formatCurrency(availableOperatingBudget), 'Collections less confirmed expenses and open commitments', availableOperatingBudget < 0 ? 'warning' : 'success')
    ],
    charts: [
      makeChart('collections-trend', 'Monthly Collections Trend (PHP)', collectionsTrend, 'Completed client payments collected per month (trailing 6 months).', 'trend'),
      makeChart('ar-aging', 'Accounts Receivable Aging', aging.buckets.map((bucket) => ({ label: bucket.label, value: Math.round(bucket.amount) })), 'Outstanding balance grouped by how overdue each milestone is.'),
      makeChart('finance-position', 'Financial Position', [
        { label: 'Collected', value: Math.round(totalCollected) },
        { label: 'Receivable', value: Math.round(outstandingBalance) },
        { label: 'Confirmed Expenses', value: Math.round(procurementFinancials.confirmedExpenseAmount) },
        { label: 'Open Commitments', value: Math.round(procurementFinancials.approvedCommitmentAmount) }
      ]),
      makeChart('payment-status', 'Payment Status', mapToChartItems(countBy(contracts, (contract) => contract.paymentStatus))),
      makeChart('contract-status', 'Contract Approval Status', mapToChartItems(countBy(contracts, (contract) => contract.status))),
      makeChart('procurement-status', 'Budget Request Status', mapToChartItems(countBy(procurementRequests, (request) => request.status)))
    ],
    sections: [
      makeSection('ar-aging', 'Accounts Receivable Aging Schedule', 'Outstanding balances aged by the milestone currently owed (40% due 2 months after booking; final balance due 2 months before the event). Oldest balances first.', [
        { key: 'contractNumber', label: 'Contract' },
        { key: 'clientName', label: 'Client' },
        { key: 'stage', label: 'Owed Milestone' },
        { key: 'dueDate', label: 'Due Date' },
        { key: 'daysOverdue', label: 'Days Overdue' },
        { key: 'balance', label: 'Balance' },
        { key: 'bucket', label: 'Aging Bucket' }
      ], buildAgingRows(aging.owing), 'No outstanding receivables.'),
      makeSection('financial-position', 'Financial Position Summary', 'Accounting summary based on contract receivables, collections, procurement commitments, and confirmed purchasing expenses.', [
        { key: 'account', label: 'Account / Line Item' },
        { key: 'amount', label: 'Amount' },
        { key: 'classification', label: 'Classification' },
        { key: 'explanation', label: 'Basis / Explanation' }
      ], buildFinancialPositionRows({
        contractValue,
        totalCollected,
        outstandingBalance,
        collectionRate,
        procurementFinancials,
        availableOperatingBudget
      })),
      makeSection('receivables', 'Accounts Receivable Schedule', 'Contract balances that Accounting can use for collection monitoring and payment follow-up.', [
        { key: 'contractNumber', label: 'Contract' },
        { key: 'clientName', label: 'Client' },
        { key: 'eventDate', label: 'Event Date' },
        { key: 'contractValue', label: 'Contract Value' },
        { key: 'collected', label: 'Collected' },
        { key: 'balance', label: 'Balance' },
        { key: 'paymentStatus', label: 'Payment Status' }
      ], buildReceivableRows(contracts)),
      makeSection('payment-ledger', 'Payment Ledger', 'Payments posted during the selected date range.', [
        { key: 'contractNumber', label: 'Contract' },
        { key: 'clientName', label: 'Client' },
        { key: 'date', label: 'Date' },
        { key: 'amount', label: 'Amount' },
        { key: 'status', label: 'Status' }
      ], payments.slice(0, 15).map((payment) => ({
        ...payment,
        date: formatDateLabel(payment.date),
        amount: formatCurrency(payment.amount),
        status: titleCase(payment.status)
      }))),
      makeSection('approval-queue', 'Contract Approval Queue', 'Signed contracts that Accounting can review.', contractColumns, buildContractRows(approvalQueue)),
      makeSection('procurement-budget', 'Procurement Budget Register', 'Purchasing requests that affect budget approval, committed costs, and expense confirmation.', [
        { key: 'requestNumber', label: 'Request' },
        { key: 'department', label: 'Department' },
        { key: 'itemName', label: 'Item' },
        { key: 'status', label: 'Status' },
        { key: 'budgetAmount', label: 'Budget Amount' },
        { key: 'neededBy', label: 'Needed By' }
      ], buildProcurementBudgetRows(uniqueById([
        ...budgetQueue,
        ...procurementFinancials.approvedCommitments,
        ...expenseQueue,
        ...procurementFinancials.confirmedExpenses
      ])))
    ]
  };
};

const buildInventoryDepartmentReport = ({ contracts, procurementRequests, incidents, inventorySnapshot, department }) => {
  const sectionKey = department === 'creative'
    ? 'creativeAssets'
    : department === 'linen'
      ? 'linenRequirements'
      : 'equipmentChecklist';
  const inventoryContracts = contracts.filter((contract) => safeArray(contract[sectionKey]).length > 0);
  const assignedItems = inventoryContracts.flatMap((contract) => safeArray(contract[sectionKey]));
  const preparedItems = assignedItems.filter((item) => item.status === 'prepared').length;
  const pendingItems = assignedItems.filter((item) => item.status !== 'prepared').length;
  const fulfilledRequests = procurementRequests.filter((request) => request.status === 'fulfilled').length;
  const preparedRate = assignedItems.length > 0 ? preparedItems / assignedItems.length : null;
  const lowStockCount = inventorySnapshot.lowStockItems.length;
  // Which items events keep demanding: the restock/expansion signal for this department.
  const demandByItem = assignedItems.reduce((counts, item) => {
    const name = item.item || item.type || 'Unnamed item';
    counts[name] = (counts[name] || 0) + (Number(item.quantity) || 1);
    return counts;
  }, {});
  const topDemand = Object.entries(demandByItem)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }));
  const pendingNearEvent = inventoryContracts.filter((contract) => {
    const daysToEvent = Math.ceil((new Date(contract.eventDate).getTime() - Date.now()) / 86400000);
    return daysToEvent >= 0 && daysToEvent <= 7
      && safeArray(contract[sectionKey]).some((item) => item.status !== 'prepared');
  });

  return {
    title: `${inventorySnapshot.label} Report`,
    subtitle: 'Preparation risk, item demand, stock health, and procurement status to plan restocking and prep work.',
    insights: rankInsights([
      pendingNearEvent.length > 0
        ? makeInsight('warning', `${pendingNearEvent.length} event(s) within 7 days still have unprepared items`, `Prepare these first: ${pendingNearEvent.slice(0, 3).map((contract) => contract.contractNumber).join(', ')}${pendingNearEvent.length > 3 ? '…' : ''}. The material freeze locks these reservations to their events.`)
        : makeInsight('positive', 'No unprepared items inside the event-week window', 'Everything due in the next 7 days is already marked prepared.'),
      lowStockCount > 0
        ? makeInsight('warning', `${lowStockCount} item(s) are at or below minimum stock`, 'Cross-check the demand chart: if a low-stock item is also a top-demand item, raise a purchasing request now rather than per event.')
        : makeInsight('positive', 'No items are below minimum stock', 'Current stock levels cover the usual demand.'),
      topDemand.length > 0
        ? makeInsight('info', `Highest event demand: ${topDemand[0].label}`, `${formatNumber(topDemand[0].value)} unit(s) requested across events in this period. Top-demand items are the strongest candidates for permanent stock expansion instead of repeat rentals.`)
        : null,
    ]),
    summaryCards: [
      makeCard('Events With Assigned Items', inventoryContracts.length, 'Contracts requiring this department'),
      makeCard('Preparation Rate', preparedRate !== null ? formatPercent(preparedRate) : 'No items', `${preparedItems} prepared / ${pendingItems} pending`, preparedRate !== null && preparedRate < 1 ? 'warning' : 'success'),
      makeCard('Low/Attention Stock', lowStockCount + inventorySnapshot.attentionItems.length, 'Current inventory records needing review', lowStockCount ? 'warning' : 'success'),
      makeCard('Requests Fulfilled', `${fulfilledRequests}/${procurementRequests.length}`, 'Purchasing requests completed in this period')
    ],
    charts: [
      makeChart('item-demand', 'Most Requested Items (units)', topDemand, 'Total units events required per item in this period - restock and buy-vs-rent decisions start here.'),
      makeChart('inventory-status', 'Inventory Status', inventorySnapshot.statusChart, 'Health of the current stock records.'),
      makeChart('procurement-status', 'Purchasing Requests', mapToChartItems(countBy(procurementRequests, (request) => request.status)), 'Where this department\'s purchase/rental requests stand.')
    ],
    sections: [
      makeSection('event-items', 'Event Inventory Workload', 'Contracts in the date range that need this department.', [
        { key: 'contractNumber', label: 'Contract' },
        { key: 'clientName', label: 'Client' },
        { key: 'eventDate', label: 'Event Date' },
        { key: 'assignedItems', label: 'Assigned Items' },
        { key: 'prepared', label: 'Prepared' }
      ], inventoryContracts.slice(0, 12).map((contract) => {
        const items = safeArray(contract[sectionKey]);
        return {
          contractNumber: contract.contractNumber,
          clientName: contract.clientName,
          eventDate: formatDateLabel(contract.eventDate),
          assignedItems: formatNumber(items.length),
          prepared: `${formatNumber(items.filter((item) => item.status === 'prepared').length)} / ${formatNumber(items.length)}`
        };
      })),
      makeSection('low-stock', 'Inventory Items Needing Attention', 'Current low stock, damaged, repair, maintenance, or unavailable records.', [
        { key: 'itemCode', label: 'Code' },
        { key: 'name', label: 'Item' },
        { key: 'category', label: 'Category' },
        { key: 'available', label: 'Available' },
        { key: 'status', label: 'Status' },
        { key: 'condition', label: 'Condition' }
      ], buildInventoryTableRows([...inventorySnapshot.lowStockItems, ...inventorySnapshot.attentionItems])),
      makeSection('procurement', 'Purchasing Requests', 'Requests created for this department during the selected period.', [
        { key: 'requestNumber', label: 'Request' },
        { key: 'itemName', label: 'Item' },
        { key: 'status', label: 'Status' },
        { key: 'neededBy', label: 'Needed By' },
        { key: 'amount', label: 'Quoted Amount' }
      ], buildProcurementRows(procurementRequests)),
      makeSection('incidents', 'Incident Reports', 'Incidents related to this department in the selected period.', [
        { key: 'type', label: 'Type' },
        { key: 'severity', label: 'Severity' },
        { key: 'status', label: 'Status' },
        { key: 'reportedAt', label: 'Reported' },
        { key: 'item', label: 'Item' }
      ], buildIncidentRows(incidents))
    ]
  };
};

const buildKitchenReport = ({ contracts, incidents, inventorySnapshot, end }) => {
  const kitchenContracts = contracts.filter((contract) => safeArray(contract.menuDetails).length > 0);
  const menuItems = kitchenContracts.flatMap((contract) => safeArray(contract.menuDetails));
  const confirmedItems = menuItems.filter((item) => item.confirmed).length;
  const preparedEvents = kitchenContracts.filter((contract) => contract.ingredientStatus === 'prepared').length;
  // Dish popularity: what the kitchen actually cooks most, weighted by contract count
  // (each contract counts a dish once - quantity is pax, not dish frequency).
  const dishPopularity = Object.entries(menuItems.reduce((counts, item) => {
    const name = item.item || 'Unnamed dish';
    counts[name] = (counts[name] || 0) + 1;
    return counts;
  }, {}))
    .sort((left, right) => right[1] - left[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }));
  const paxWorkloadTrend = buildMonthlySeries(kitchenContracts, (contract) => contract.eventDate, end, 6, (contract) => contract.totalPacks);
  const unpreparedNearEvent = kitchenContracts.filter((contract) => {
    const daysToEvent = Math.ceil((new Date(contract.eventDate).getTime() - Date.now()) / 86400000);
    return daysToEvent >= 0 && daysToEvent <= 7 && contract.ingredientStatus !== 'prepared';
  });
  const foodIncidents = incidents.filter((incident) => incident.incidentType === 'food_spoilage');

  return {
    title: 'Kitchen Report',
    subtitle: 'Preparation risk, dish popularity, guest-volume workload, and kitchen stock to plan cooking capacity and buying.',
    insights: rankInsights([
      unpreparedNearEvent.length > 0
        ? makeInsight('warning', `${unpreparedNearEvent.length} event(s) within 7 days are not kitchen-ready`, `Confirm menus and prepare ingredients for: ${unpreparedNearEvent.slice(0, 3).map((contract) => contract.contractNumber).join(', ')}${unpreparedNearEvent.length > 3 ? '…' : ''}.`)
        : makeInsight('positive', 'Every event inside the next 7 days is kitchen-ready', 'All near-term events have confirmed menus and prepared ingredients.'),
      inventorySnapshot.lowStockItems.length > 0
        ? makeInsight('warning', `${inventorySnapshot.lowStockItems.length} kitchen item(s) at or below minimum stock`, 'Restock before the next peak month shown in the guest-volume trend.')
        : null,
      dishPopularity.length > 0
        ? makeInsight('info', `Most ordered dish: ${dishPopularity[0].label}`, `Chosen by ${dishPopularity[0].value} event(s) in this period. Popular dishes drive ingredient buying; rarely chosen dishes are candidates to rotate off the menu.`)
        : null,
      foodIncidents.length > 0
        ? makeInsight('warning', `${foodIncidents.length} food spoilage incident(s) reported`, 'Review storage and transport handling for the affected events.')
        : null,
    ]),
    summaryCards: [
      makeCard('Events With Menu', kitchenContracts.length, 'Contracts with menu details'),
      makeCard('Menu Confirmation', menuItems.length > 0 ? formatPercent(confirmedItems / menuItems.length) : 'No items', `${confirmedItems} of ${menuItems.length} dishes confirmed`),
      makeCard('Kitchen-Ready Events', `${preparedEvents}/${kitchenContracts.length}`, 'Ingredient status marked prepared', preparedEvents === kitchenContracts.length && kitchenContracts.length > 0 ? 'success' : 'default'),
      makeCard('Low Kitchen Stock', inventorySnapshot.lowStockItems.length, 'Items at or below minimum stock', inventorySnapshot.lowStockItems.length ? 'warning' : 'success')
    ],
    charts: [
      makeChart('pax-workload', 'Guest Volume Per Month (pax)', paxWorkloadTrend, 'Total guests to feed per month (trailing 6 months) - sets ingredient buying and staffing capacity.', 'trend'),
      makeChart('dish-popularity', 'Most Ordered Dishes (events)', dishPopularity, 'How many events chose each dish - guides bulk ingredient purchasing and menu rotation.'),
      makeChart('ingredient-status', 'Ingredient Status By Event', mapToChartItems(countBy(kitchenContracts, (contract) => contract.ingredientStatus)), 'Where each event sits in kitchen preparation.')
    ],
    sections: [
      makeSection('menu-events', 'Menu Preparation Events', 'Events in the selected range that include menu work.', [
        { key: 'contractNumber', label: 'Contract' },
        { key: 'clientName', label: 'Client' },
        { key: 'eventDate', label: 'Event Date' },
        { key: 'menuItems', label: 'Menu Items' },
        { key: 'ingredientStatus', label: 'Ingredient Status' }
      ], kitchenContracts.slice(0, 12).map((contract) => ({
        contractNumber: contract.contractNumber,
        clientName: contract.clientName,
        eventDate: formatDateLabel(contract.eventDate),
        menuItems: formatNumber(safeArray(contract.menuDetails).length),
        ingredientStatus: titleCase(contract.ingredientStatus)
      }))),
      makeSection('low-stock', 'Kitchen Stock Needing Attention', 'Low stock, damaged, or maintenance items.', [
        { key: 'itemCode', label: 'Code' },
        { key: 'name', label: 'Item' },
        { key: 'category', label: 'Category' },
        { key: 'available', label: 'Available' },
        { key: 'status', label: 'Status' },
        { key: 'condition', label: 'Condition' }
      ], buildInventoryTableRows([...inventorySnapshot.lowStockItems, ...inventorySnapshot.attentionItems])),
      makeSection('incidents', 'Kitchen Incidents', 'Food spoilage or kitchen-related issues reported in the selected period.', [
        { key: 'type', label: 'Type' },
        { key: 'severity', label: 'Severity' },
        { key: 'status', label: 'Status' },
        { key: 'reportedAt', label: 'Reported' },
        { key: 'item', label: 'Item' }
      ], buildIncidentRows(incidents))
    ]
  };
};

const buildBanquetReport = ({ contracts, banquetStaff, incidents, end }) => {
  const banquetContracts = contracts.filter((contract) => ['approved', 'completed'].includes(contract.status));
  const assignedEvents = banquetContracts.filter((contract) => safeArray(contract.banquetAssignment?.assignments).length > 0);
  const assignmentCount = sumBy(banquetContracts, (contract) => safeArray(contract.banquetAssignment?.assignments).length);
  const activeStaff = banquetStaff.filter((staff) => staff.status === 'active');
  // Appendix H: 1 waiter per 25 guests. Compare required headcount against the
  // active pool to spot months where hiring/on-call staff are needed.
  const requiredStaffFor = (contract) => Math.ceil((Number(contract.banquetAssignment?.serviceGuestCount) || Number(contract.totalPacks) || 0) / 25);
  const staffDemandTrend = buildMonthlySeries(banquetContracts, (contract) => contract.eventDate, end, 6, requiredStaffFor);
  const peakDemand = Math.max(0, ...staffDemandTrend.map((month) => month.value));
  const unstaffedNearEvent = banquetContracts.filter((contract) => {
    const daysToEvent = Math.ceil((new Date(contract.eventDate).getTime() - Date.now()) / 86400000);
    return daysToEvent >= 0 && daysToEvent <= 7 && safeArray(contract.banquetAssignment?.assignments).length === 0;
  });

  return {
    title: 'Banquet Report',
    subtitle: 'Staffing demand versus pool capacity, roster completion risk, and workload to plan hiring and assignments.',
    insights: rankInsights([
      unstaffedNearEvent.length > 0
        ? makeInsight('warning', `${unstaffedNearEvent.length} event(s) within 7 days have no staff assigned`, `Assign teams now: ${unstaffedNearEvent.slice(0, 3).map((contract) => contract.contractNumber).join(', ')}${unstaffedNearEvent.length > 3 ? '…' : ''}. Rosters should be frozen one week before the event.`)
        : makeInsight('positive', 'All events inside the next 7 days have staff assigned', 'No roster gaps in the freeze window.'),
      peakDemand > activeStaff.length
        ? makeInsight('warning', `Peak month needs ~${peakDemand} staff but the active pool is ${activeStaff.length}`, 'At 1 waiter per 25 guests, the busiest month exceeds the current pool. Line up on-call staff or stagger event acceptance.')
        : makeInsight('positive', `Active pool (${activeStaff.length}) covers the peak month (~${peakDemand} needed)`, 'Staffing capacity is sufficient for the busiest month in view.'),
      banquetContracts.length > assignedEvents.length
        ? makeInsight('info', `${banquetContracts.length - assignedEvents.length} approved event(s) still need a staffing plan`, 'Draft plans early - the suggestion engine pre-fills 1 waiter per 25 guests.')
        : null,
    ]),
    summaryCards: [
      makeCard('Approved Events', banquetContracts.length, 'Events ready for banquet planning'),
      makeCard('Staffed Events', `${assignedEvents.length}/${banquetContracts.length}`, 'Events with assigned banquet staff', assignedEvents.length === banquetContracts.length && banquetContracts.length > 0 ? 'success' : 'warning'),
      makeCard('Peak Staff Demand', `~${peakDemand}`, 'Busiest month at 1 waiter per 25 guests', peakDemand > activeStaff.length ? 'warning' : 'default'),
      makeCard('Active Staff Pool', activeStaff.length, 'Available active banquet staff')
    ],
    charts: [
      makeChart('staff-demand', 'Required Staff Per Month (1 per 25 guests)', staffDemandTrend, 'Headcount each month\'s events require - compare against the active pool to plan hiring.', 'trend'),
      makeChart('staff-roles', 'Staff Pool By Role', mapToChartItems(countBy(banquetStaff, (staff) => staff.role)), 'Composition of the pool - reveals role shortages (e.g. bartenders).'),
      makeChart('event-staffing', 'Event Staffing Status', [
        { label: 'With Staff Plan', value: assignedEvents.length },
        { label: 'No Staff Plan Yet', value: Math.max(0, banquetContracts.length - assignedEvents.length) }
      ], 'How many approved events still need a roster.')
    ],
    sections: [
      makeSection('events', 'Banquet Event Workload', 'Approved events in the selected range and their staff assignment status.', [
        { key: 'contractNumber', label: 'Contract' },
        { key: 'clientName', label: 'Client' },
        { key: 'eventDate', label: 'Event Date' },
        { key: 'guestCount', label: 'Service Guests' },
        { key: 'assignments', label: 'Assigned Staff' }
      ], banquetContracts.slice(0, 12).map((contract) => ({
        contractNumber: contract.contractNumber,
        clientName: contract.clientName,
        eventDate: formatDateLabel(contract.eventDate),
        guestCount: formatNumber(contract.banquetAssignment?.serviceGuestCount || contract.totalPacks),
        assignments: formatNumber(safeArray(contract.banquetAssignment?.assignments).length)
      }))),
      makeSection('staff', 'Banquet Staff Directory Snapshot', 'Active staff available for event assignment.', [
        { key: 'employeeId', label: 'Employee ID' },
        { key: 'fullName', label: 'Name' },
        { key: 'role', label: 'Role' },
        { key: 'employmentType', label: 'Type' },
        { key: 'rating', label: 'Rating' }
      ], activeStaff.slice(0, 12).map((staff) => ({
        employeeId: staff.employeeId,
        fullName: staff.fullName || `${staff.firstName} ${staff.lastName}`,
        role: titleCase(staff.role),
        employmentType: titleCase(staff.employmentType),
        rating: staff.rating || 'N/A'
      }))),
      makeSection('incidents', 'Banquet Incidents', 'Staffing or service issues reported in the selected period.', [
        { key: 'type', label: 'Type' },
        { key: 'severity', label: 'Severity' },
        { key: 'status', label: 'Status' },
        { key: 'reportedAt', label: 'Reported' },
        { key: 'item', label: 'Reference' }
      ], buildIncidentRows(incidents))
    ]
  };
};

const buildLogisticsReport = ({ contracts, drivers, trucks, incidents, end }) => {
  const logisticsContracts = contracts.filter((contract) => ['approved', 'completed'].includes(contract.status));
  const scheduledAssignments = logisticsContracts.filter((contract) => contract.logisticsAssignment?.truck || contract.logisticsAssignment?.driver);
  const dispatched = logisticsContracts.filter((contract) => ['ready_for_dispatch', 'dispatched', 'completed'].includes(contract.logisticsAssignment?.assignmentStatus));
  const operationalTrucks = trucks.filter((truck) => ['available', 'in_use'].includes(truck.status));
  const fleetUtilization = operationalTrucks.length > 0
    ? trucks.filter((truck) => truck.status === 'in_use').length / operationalTrucks.length
    : null;
  const outOfServiceTrucks = trucks.filter((truck) => ['maintenance', 'repair'].includes(truck.status));
  const transportDemandTrend = buildMonthlySeries(logisticsContracts, (contract) => contract.eventDate, end);
  // Appendix H: transport must be arranged 3 days before the event.
  const unbookedNearEvent = logisticsContracts.filter((contract) => {
    const daysToEvent = Math.ceil((new Date(contract.eventDate).getTime() - Date.now()) / 86400000);
    return daysToEvent >= 0 && daysToEvent <= 3 && !contract.logisticsAssignment?.truck;
  });
  const vehicleIncidents = incidents.filter((incident) => incident.incidentType === 'vehicle_breakdown');

  return {
    title: 'Logistics Report',
    subtitle: 'Transport demand, lead-time compliance, fleet utilization, and dispatch status to plan vehicle allocation.',
    insights: rankInsights([
      unbookedNearEvent.length > 0
        ? makeInsight('warning', `${unbookedNearEvent.length} event(s) within 3 days have no truck booked`, `Appendix H requires transport arranged 3 days ahead. Book now: ${unbookedNearEvent.slice(0, 3).map((contract) => contract.contractNumber).join(', ')}${unbookedNearEvent.length > 3 ? '…' : ''}.`)
        : makeInsight('positive', 'Every event inside the 3-day lead window has a truck booked', 'Transport lead-time rule (Appendix H) is being met.'),
      outOfServiceTrucks.length > 0
        ? makeInsight('info', `${outOfServiceTrucks.length} truck(s) in maintenance/repair`, `Effective fleet is ${operationalTrucks.length} vehicle(s). Schedule repairs away from the peak month in the demand trend.`)
        : null,
      fleetUtilization !== null && fleetUtilization >= 0.8
        ? makeInsight('warning', `Fleet utilization is ${formatPercent(fleetUtilization)}`, 'The fleet is nearly fully deployed. Same-day double bookings become likely - consider rentals for overlapping event dates.')
        : null,
      vehicleIncidents.length > 0
        ? makeInsight('warning', `${vehicleIncidents.length} vehicle breakdown(s) reported`, 'Review the affected units before assigning them to upcoming events.')
        : null,
    ]),
    summaryCards: [
      makeCard('Approved Events', logisticsContracts.length, 'Events needing transport coordination'),
      makeCard('Booked Events', `${scheduledAssignments.length}/${logisticsContracts.length}`, 'Events with truck or driver assigned', scheduledAssignments.length === logisticsContracts.length && logisticsContracts.length > 0 ? 'success' : 'warning'),
      makeCard('Fleet Utilization', fleetUtilization !== null ? formatPercent(fleetUtilization) : 'No fleet', `${trucks.filter((truck) => truck.status === 'in_use').length} of ${operationalTrucks.length} operational trucks deployed`, fleetUtilization !== null && fleetUtilization >= 0.8 ? 'warning' : 'default'),
      makeCard('Ready/Dispatched', dispatched.length, 'Assignments marked ready, dispatched, or completed')
    ],
    charts: [
      makeChart('transport-demand', 'Events Needing Transport Per Month', transportDemandTrend, 'Monthly transport workload (trailing 6 months) - schedule maintenance in the quiet months.', 'trend'),
      makeChart('assignment-status', 'Assignment Status', mapToChartItems(countBy(logisticsContracts, (contract) => contract.logisticsAssignment?.assignmentStatus || 'pending')), 'Where each event sits in the dispatch pipeline.'),
      makeChart('truck-status', 'Fleet Status', mapToChartItems(countBy(trucks, (truck) => truck.status)), 'Deployment vs downtime across the fleet.')
    ],
    sections: [
      makeSection('events', 'Logistics Event Workload', 'Approved events in the selected range and current dispatch status.', [
        { key: 'contractNumber', label: 'Contract' },
        { key: 'clientName', label: 'Client' },
        { key: 'eventDate', label: 'Event Date' },
        { key: 'venue', label: 'Venue' },
        { key: 'status', label: 'Dispatch Status' }
      ], logisticsContracts.slice(0, 12).map((contract) => ({
        contractNumber: contract.contractNumber,
        clientName: contract.clientName,
        eventDate: formatDateLabel(contract.eventDate),
        venue: contract.venue?.name || 'No venue',
        status: titleCase(contract.logisticsAssignment?.assignmentStatus || 'pending')
      }))),
      makeSection('fleet', 'Fleet Snapshot', 'Truck availability and current condition/status.', [
        { key: 'truckId', label: 'Truck ID' },
        { key: 'plateNumber', label: 'Plate' },
        { key: 'truckType', label: 'Type' },
        { key: 'status', label: 'Status' },
        { key: 'ownership', label: 'Ownership' }
      ], trucks.slice(0, 12).map((truck) => ({
        truckId: truck.truckId,
        plateNumber: truck.plateNumber,
        truckType: titleCase(truck.truckType),
        status: titleCase(truck.status),
        ownership: titleCase(truck.ownership)
      }))),
      makeSection('incidents', 'Logistics Incidents', 'Vehicle, delivery, or equipment transport issues in the selected period.', [
        { key: 'type', label: 'Type' },
        { key: 'severity', label: 'Severity' },
        { key: 'status', label: 'Status' },
        { key: 'reportedAt', label: 'Reported' },
        { key: 'item', label: 'Reference' }
      ], buildIncidentRows(incidents))
    ]
  };
};

const buildPurchasingReport = ({ procurementRequests, suppliers }) => {
  const openRequests = procurementRequests.filter((request) => !['fulfilled', 'cancelled'].includes(request.status));
  const quotedTotal = sumBy(procurementRequests, (request) => request.quote?.quotedTotal);
  const preferredSuppliers = suppliers.filter((supplier) => supplier.isPreferred);
  // Cycle time: how long accounting decisions take after a quote is submitted.
  const reviewedRequests = procurementRequests.filter((request) => request.quote?.submittedAt && request.accounting?.reviewedAt);
  const averageApprovalDays = reviewedRequests.length > 0
    ? reviewedRequests.reduce((sum, request) => sum + Math.max(0, (new Date(request.accounting.reviewedAt).getTime() - new Date(request.quote.submittedAt).getTime()) / 86400000), 0) / reviewedRequests.length
    : null;
  const spendByDepartment = getProcurementFinancials(procurementRequests).confirmedExpenses
    .reduce((totals, request) => {
      totals[request.department] = (totals[request.department] || 0) + getProcurementAmount(request);
      return totals;
    }, {});
  const spendBySupplier = procurementRequests
    .filter((request) => request.quote?.supplierName && ['approved', 'proof_submitted', 'fulfilled'].includes(request.status))
    .reduce((totals, request) => {
      totals[request.quote.supplierName] = (totals[request.quote.supplierName] || 0) + getProcurementAmount(request);
      return totals;
    }, {});
  const topSuppliers = Object.entries(spendBySupplier)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([label, value]) => ({ label, value: Math.round(value) }));
  const emergencyCount = procurementRequests.filter((request) => request.requisitionType === 'emergency_requisition').length;
  const emergencyRate = procurementRequests.length > 0 ? emergencyCount / procurementRequests.length : null;
  const stalePending = openRequests.filter((request) => {
    const ageDays = (Date.now() - new Date(request.createdAt).getTime()) / 86400000;
    return request.status === 'awaiting_accounting_approval' && ageDays > 3;
  });

  return {
    title: 'Purchasing Report',
    subtitle: 'Approval cycle time, spend concentration, supplier reliance, and SLA discipline to negotiate better and unblock requests.',
    insights: rankInsights([
      stalePending.length > 0
        ? makeInsight('warning', `${stalePending.length} request(s) stuck in budget approval for over 3 days`, `Follow up with Accounting on: ${stalePending.slice(0, 3).map((request) => request.requestNumber).join(', ')}${stalePending.length > 3 ? '…' : ''}.`)
        : null,
      averageApprovalDays !== null
        ? makeInsight(averageApprovalDays > 3 ? 'warning' : 'positive', `Average budget approval takes ${averageApprovalDays.toFixed(1)} day(s)`, averageApprovalDays > 3 ? 'Approval turnaround eats into the 7-day requisition lead time. Submit quotes earlier or escalate reviews.' : 'Approval turnaround leaves comfortable room inside the 7-day lead-time rule.')
        : null,
      emergencyRate !== null && emergencyRate > 0.25
        ? makeInsight('warning', `${formatPercent(emergencyRate)} of requests are emergency requisitions`, 'Heavy emergency use signals departments are requesting too late. Reinforce the 7-day standard lead time.')
        : null,
      topSuppliers.length > 0
        ? makeInsight('info', `Largest supplier by spend: ${topSuppliers[0].label}`, `${formatCurrency(topSuppliers[0].value)} committed/spent this period. Concentrated spend is leverage for discounts - and a risk if that supplier fails.`)
        : null,
    ]),
    summaryCards: [
      makeCard('Requests In Range', procurementRequests.length, `${emergencyCount} emergency requisition(s)`),
      makeCard('Open Requests', openRequests.length, 'Requests not yet fulfilled or cancelled', openRequests.length ? 'warning' : 'success'),
      makeCard('Avg Approval Turnaround', averageApprovalDays !== null ? `${averageApprovalDays.toFixed(1)} day(s)` : 'No reviews yet', 'Quote submission to accounting decision', averageApprovalDays !== null && averageApprovalDays > 3 ? 'warning' : 'default'),
      makeCard('Quoted Total', formatCurrency(quotedTotal), `${preferredSuppliers.length} preferred supplier(s) available`)
    ],
    charts: [
      makeChart('spend-department', 'Confirmed Spend By Department (PHP)', mapToChartItems(Object.fromEntries(Object.entries(spendByDepartment).map(([key, value]) => [key, Math.round(value)]))), 'Where the purchasing budget actually goes - the basis for next month\'s allocations.'),
      makeChart('top-suppliers', 'Top Suppliers By Committed Spend (PHP)', topSuppliers, 'Supplier concentration - negotiation leverage and single-source risk.'),
      makeChart('request-status', 'Request Pipeline', mapToChartItems(countBy(procurementRequests, (request) => request.status)), 'Where requests sit in the approval-to-fulfillment flow.'),
      makeChart('requisition-mix', 'Requisition Type Mix', mapToChartItems(countBy(procurementRequests, (request) => request.requisitionType || 'unspecified')), 'Standard vs emergency discipline against the 7-day lead-time rule.')
    ],
    sections: [
      makeSection('requests', 'Procurement Request Register', 'Purchasing activity created during the selected period.', [
        { key: 'requestNumber', label: 'Request' },
        { key: 'department', label: 'Department' },
        { key: 'itemName', label: 'Item' },
        { key: 'status', label: 'Status' },
        { key: 'neededBy', label: 'Needed By' },
        { key: 'amount', label: 'Quoted Amount' }
      ], buildProcurementRows(procurementRequests, 15)),
      makeSection('suppliers', 'Supplier Directory Summary', 'Saved supplier database and areas covered.', [
        { key: 'name', label: 'Supplier' },
        { key: 'location', label: 'Location' },
        { key: 'departments', label: 'Departments' },
        { key: 'requestTypes', label: 'Service Type' },
        { key: 'status', label: 'Status' }
      ], suppliers.slice(0, 15).map((supplier) => ({
        name: supplier.name,
        location: [supplier.city, supplier.province].filter(Boolean).join(', ') || 'No location',
        departments: safeArray(supplier.departments).map(titleCase).join(', ') || 'Not tagged',
        requestTypes: safeArray(supplier.requestTypes).map(titleCase).join(', ') || 'Not tagged',
        status: supplier.isActive === false ? 'Inactive' : supplier.isPreferred ? 'Preferred' : 'Active'
      })))
    ]
  };
};

const buildAdminReport = ({ contracts, menuTastings, procurementRequests, incidents, paymentContracts, receivableContracts = [], trendPayments = [], bookingTrendContracts = [], inventories, users, banquetStaff, drivers, trucks, suppliers, start, end }) => {
  const contractSummary = getContractSummary(contracts);
  const payments = getPaymentsInRange(paymentContracts, start, end).filter((payment) => payment.status === 'completed');
  const collectedAmount = sumBy(payments, (payment) => payment.amount);
  const totalPaidOnContracts = sumBy(contracts, getTotalPaid);
  const outstandingBalance = Math.max(0, contractSummary.totalValue - totalPaidOnContracts);
  const collectionRate = contractSummary.totalValue > 0 ? totalPaidOnContracts / contractSummary.totalValue : 0;
  const aging = buildAgingSummary(receivableContracts);
  const collectionsTrend = buildCollectionsTrend(trendPayments, end);
  const procurementFinancials = getProcurementFinancials(procurementRequests);
  const budgetQueue = procurementFinancials.pendingBudgetRequests;
  const expenseQueue = procurementRequests.filter((request) => request.status === 'proof_submitted');
  const availableOperatingBudget = collectedAmount
    - procurementFinancials.confirmedExpenseAmount
    - procurementFinancials.approvedCommitmentAmount;
  const inventoryTotals = Object.values(inventories).reduce((summary, snapshot) => ({
    totalItems: summary.totalItems + snapshot.totalItems,
    lowStock: summary.lowStock + snapshot.lowStockItems.length,
    attention: summary.attention + snapshot.attentionItems.length
  }), { totalItems: 0, lowStock: 0, attention: 0 });

  const bookingTrend = buildMonthlySeries(bookingTrendContracts, (contract) => contract.createdAt, end);
  const convertedTastings = menuTastings.filter((tasting) => tasting.contractCreated || tasting.contract).length;
  const unresolvedHighIncidents = incidents.filter((incident) => ['high', 'critical'].includes(incident.severity) && incident.status !== 'resolved');

  return {
    title: 'Admin Reports',
    subtitle: 'Cross-department health check: revenue and cash trends, pipeline, workload, risks, and operational capacity in one view.',
    insights: rankInsights([
      aging.overdueAmount > 0
        ? makeInsight('warning', `${formatCurrency(aging.overdueAmount)} in receivables is past due`, `${aging.overdueCount} account(s) are overdue - the single biggest cash risk in view. Direct Accounting to the aging schedule.`)
        : makeInsight('positive', 'No overdue receivables', 'All outstanding balances are within their collection windows.'),
      unresolvedHighIncidents.length > 0
        ? makeInsight('warning', `${unresolvedHighIncidents.length} unresolved high/critical incident(s)`, 'Losses may be charged if unresolved - review the incident register before closing the affected contracts.')
        : null,
      inventoryTotals.lowStock > 0
        ? makeInsight('info', `${inventoryTotals.lowStock} inventory item(s) below minimum stock`, 'Check the department snapshots to see which sections need restocking budget.')
        : null,
      budgetQueue.length > 0
        ? makeInsight('info', `${budgetQueue.length} procurement request(s) waiting for budget approval`, `${formatCurrency(procurementFinancials.pendingBudgetAmount)} in purchases is blocked pending Accounting review.`)
        : null,
      collectionRate < 0.6 && contractSummary.totalValue > 0
        ? makeInsight('warning', `Overall collection rate is ${formatPercent(collectionRate)}`, 'Under 60% of projected revenue in range has been collected.')
        : null,
    ]),
    summaryCards: [
      makeCard('Contracts', contracts.length, `${formatCurrency(contractSummary.totalValue)} total contract value`, 'success'),
      makeCard('Payments Collected', formatCurrency(collectedAmount), `${formatPercent(collectionRate)} of projected revenue collected`),
      makeCard('Overdue A/R', formatCurrency(aging.overdueAmount), `${aging.overdueCount} account(s) past due`, aging.overdueAmount ? 'warning' : 'success'),
      makeCard('Inventory Alerts', inventoryTotals.lowStock + inventoryTotals.attention, 'Low stock or attention items', inventoryTotals.lowStock ? 'warning' : 'success')
    ],
    charts: [
      makeChart('collections-trend', 'Monthly Collections Trend (PHP)', collectionsTrend, 'Completed client payments collected per month (trailing 6 months).', 'trend'),
      makeChart('booking-trend', 'Contracts Booked Per Month', bookingTrend, 'New contracts created per month (trailing 6 months) - the leading revenue indicator.', 'trend'),
      makeChart('business-funnel', 'Business Funnel', [
        { label: 'Tastings Held', value: menuTastings.length },
        { label: 'Converted To Contracts', value: convertedTastings },
        { label: 'Signed', value: contractSummary.signedCount },
        { label: 'Approved For Prep', value: contractSummary.approvedCount }
      ], 'End-to-end conversion from tasting to approved event.'),
      makeChart('ar-aging', 'Accounts Receivable Aging', aging.buckets.map((bucket) => ({ label: bucket.label, value: Math.round(bucket.amount) })), 'Outstanding balance grouped by how overdue each milestone is.'),
      makeChart('finance-position', 'Finance Position', [
        { label: 'Collected', value: Math.round(collectedAmount) },
        { label: 'Receivable', value: Math.round(outstandingBalance) },
        { label: 'Confirmed Expenses', value: Math.round(procurementFinancials.confirmedExpenseAmount) },
        { label: 'Open Commitments', value: Math.round(procurementFinancials.approvedCommitmentAmount) }
      ], 'Cash in vs money owed vs money committed.'),
      makeChart('incident-severity', 'Incidents By Severity', mapToChartItems(countBy(incidents, (incident) => incident.severity)), 'Operational risk reported in this period.')
    ],
    sections: [
      makeSection('contracts', 'Contract Register', 'Contracts with event dates in the selected range.', contractColumns, buildContractRows(contracts, 15)),
      makeSection('finance', 'Accounting / Finance Summary', 'Financial position, collection performance, receivables, procurement commitments, and estimated available operating budget.', [
        { key: 'account', label: 'Account / Line Item' },
        { key: 'amount', label: 'Amount' },
        { key: 'classification', label: 'Classification' },
        { key: 'explanation', label: 'Basis / Explanation' }
      ], buildFinancialPositionRows({
        contractValue: contractSummary.totalValue,
        totalCollected: collectedAmount,
        outstandingBalance,
        collectionRate,
        procurementFinancials,
        availableOperatingBudget
      })),
      makeSection('finance-receivables', 'Finance Receivables Schedule', 'Contract balances and collection status for management review.', [
        { key: 'contractNumber', label: 'Contract' },
        { key: 'clientName', label: 'Client' },
        { key: 'eventDate', label: 'Event Date' },
        { key: 'contractValue', label: 'Contract Value' },
        { key: 'collected', label: 'Collected' },
        { key: 'balance', label: 'Balance' },
        { key: 'paymentStatus', label: 'Payment Status' }
      ], buildReceivableRows(contracts)),
      makeSection('ar-aging', 'Accounts Receivable Aging Schedule', 'All outstanding balances aged by the milestone currently owed (40% due 2 months after booking; final balance due 2 months before the event). Oldest balances first.', [
        { key: 'contractNumber', label: 'Contract' },
        { key: 'clientName', label: 'Client' },
        { key: 'stage', label: 'Owed Milestone' },
        { key: 'dueDate', label: 'Due Date' },
        { key: 'daysOverdue', label: 'Days Overdue' },
        { key: 'balance', label: 'Balance' },
        { key: 'bucket', label: 'Aging Bucket' }
      ], buildAgingRows(aging.owing), 'No outstanding receivables.'),
      makeSection('finance-procurement', 'Finance Procurement Budget Register', 'Purchasing requests that affect budget allocation, committed costs, and confirmed expenses.', [
        { key: 'requestNumber', label: 'Request' },
        { key: 'department', label: 'Department' },
        { key: 'itemName', label: 'Item' },
        { key: 'status', label: 'Status' },
        { key: 'budgetAmount', label: 'Budget Amount' },
        { key: 'neededBy', label: 'Needed By' }
      ], buildProcurementBudgetRows(uniqueById([
        ...budgetQueue,
        ...procurementFinancials.approvedCommitments,
        ...expenseQueue,
        ...procurementFinancials.confirmedExpenses
      ]))),
      makeSection('users', 'User Access Summary', 'Current system user accounts by department and role.', [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Role' },
        { key: 'department', label: 'Department' },
        { key: 'status', label: 'Status' }
      ], users.slice(0, 15).map((user) => ({
        name: user.name,
        email: user.email,
        role: titleCase(user.role),
        department: user.department,
        status: user.isActive ? 'Active' : 'Inactive'
      }))),
      makeSection('inventory', 'Inventory Department Snapshot', 'Current inventory totals and item alerts by department.', [
        { key: 'department', label: 'Department' },
        { key: 'items', label: 'Item Records' },
        { key: 'quantity', label: 'Total Qty' },
        { key: 'available', label: 'Available Qty' },
        { key: 'alerts', label: 'Alerts' }
      ], Object.values(inventories).map((snapshot) => ({
        department: snapshot.label,
        items: formatNumber(snapshot.totalItems),
        quantity: formatNumber(snapshot.totalQuantity),
        available: formatNumber(snapshot.availableQuantity),
        alerts: formatNumber(snapshot.lowStockItems.length + snapshot.attentionItems.length)
      }))),
      makeSection('operations', 'Operations Snapshot', 'Current staffing, logistics, supplier, and booking records.', [
        { key: 'area', label: 'Area' },
        { key: 'total', label: 'Total' },
        { key: 'active', label: 'Active/Available' },
        { key: 'notes', label: 'Notes' }
      ], [
        { area: 'Menu Tastings', total: formatNumber(menuTastings.length), active: formatNumber(menuTastings.filter((item) => ['booked', 'confirmed'].includes(item.status)).length), notes: 'Bookings in selected range' },
        { area: 'Banquet Staff', total: formatNumber(banquetStaff.length), active: formatNumber(banquetStaff.filter((staff) => staff.status === 'active').length), notes: 'Current staff pool' },
        { area: 'Drivers', total: formatNumber(drivers.length), active: formatNumber(drivers.filter((driver) => driver.status === 'active').length), notes: 'Current driver records' },
        { area: 'Trucks', total: formatNumber(trucks.length), active: formatNumber(trucks.filter((truck) => truck.status === 'available').length), notes: 'Available trucks' },
        { area: 'Suppliers', total: formatNumber(suppliers.length), active: formatNumber(suppliers.filter((supplier) => supplier.isActive !== false).length), notes: 'Supplier directory' }
      ]),
      makeSection('incidents', 'Incident Register', 'Incidents reported in the selected range.', [
        { key: 'type', label: 'Type' },
        { key: 'department', label: 'Department' },
        { key: 'severity', label: 'Severity' },
        { key: 'status', label: 'Status' },
        { key: 'reportedAt', label: 'Reported' }
      ], buildIncidentRows(incidents, 15))
    ]
  };
};

const RECEIVABLE_STATUSES = ['submitted', 'accounting_review', 'approved', 'completed'];

const buildContext = async (role, start, end) => {
  const contractQuery = { eventDate: { $gte: start, $lte: end } };
  const procurementQuery = { createdAt: { $gte: start, $lte: end } };
  const incidentQuery = { reportedAt: { $gte: start, $lte: end } };
  // Trailing 6-month window (ending at the report's end date) for the trend.
  const trendStart = new Date(end.getFullYear(), end.getMonth() - 5, 1, 0, 0, 0, 0);

  if (PROCUREMENT_DEPARTMENT_BY_ROLE[role]) {
    procurementQuery.department = PROCUREMENT_DEPARTMENT_BY_ROLE[role];
  } else if (!['admin', 'accounting', 'purchasing'].includes(role)) {
    procurementQuery._id = null;
  }

  if (role !== 'admin' && ROLE_INCIDENT_DEPARTMENTS[role]) {
    incidentQuery.department = { $in: ROLE_INCIDENT_DEPARTMENTS[role] };
  }

  const [
    contracts,
    menuTastings,
    procurementRequests,
    incidents,
    paymentContracts,
    users,
    banquetStaff,
    drivers,
    trucks,
    suppliers,
    receivableContracts,
    trendContracts,
    bookingTrendContracts
  ] = await Promise.all([
    Contract.find(contractQuery).select(CONTRACT_SELECT).lean(),
    ['admin', 'sales'].includes(role)
      ? MenuTasting.find({ tastingDate: { $gte: start, $lte: end } }).lean()
      : [],
    ProcurementRequest.find(procurementQuery).select('requestNumber status department requestType source contract eventDate neededBy itemName itemCode itemCategory requestedQuantity shortageQuantity quote accounting fulfillment createdAt').lean(),
    Incident.find(incidentQuery).select('department incidentType severity status reportedAt createdAt inventoryItemName affectedQuantity eventDate').lean(),
    ['admin', 'sales', 'accounting'].includes(role)
      ? Contract.find({ 'payments.date': { $gte: start, $lte: end } }).select('contractNumber clientName totalContractValue paymentStatus payments').lean()
      : [],
    role === 'admin' ? User.find().select('name email role department isActive createdAt lastLogin').lean() : [],
    ['admin', 'banquet_supervisor'].includes(role) ? BanquetStaff.find().lean() : [],
    ['admin', 'logistics'].includes(role) ? Driver.find().lean() : [],
    ['admin', 'logistics'].includes(role) ? Truck.find().lean() : [],
    ['admin', 'purchasing'].includes(role) ? Supplier.find().lean() : [],
    ['admin', 'accounting'].includes(role)
      ? Contract.find({ status: { $in: RECEIVABLE_STATUSES } })
          .select('contractNumber clientName eventDate bookingDate createdAt totalContractValue paymentStatus payments downPaymentPercent finalPaymentPercent')
          .lean()
      : [],
    ['admin', 'accounting'].includes(role)
      ? Contract.find({ 'payments.date': { $gte: trendStart, $lte: end } })
          .select('payments')
          .lean()
      : [],
    // Booking momentum: contracts by creation date over the trailing window.
    ['admin', 'sales'].includes(role)
      ? Contract.find({ createdAt: { $gte: trendStart, $lte: end } })
          .select('createdAt totalContractValue status clientSigned')
          .lean()
      : []
  ]);

  const trendPayments = safeArray(trendContracts).flatMap((contract) => safeArray(contract.payments));

  const inventoryConfigs = getInventoryConfigs();
  const inventoryKeys = role === 'admin'
    ? ['creative', 'linen', 'stockroom', 'kitchen']
    : role === 'creative'
      ? ['creative']
      : role === 'linen'
        ? ['linen']
        : ['stockroom', 'logistics'].includes(role)
          ? ['stockroom']
          : role === 'kitchen'
            ? ['kitchen']
            : [];

  const inventoryEntries = await Promise.all(inventoryKeys.map(async (key) => {
    const config = inventoryConfigs[key];
    return [key, await getInventorySnapshot(config.model, config)];
  }));

  return {
    start,
    end,
    contracts,
    menuTastings,
    procurementRequests,
    incidents,
    paymentContracts,
    users,
    banquetStaff,
    drivers,
    trucks,
    suppliers,
    receivableContracts,
    trendPayments,
    bookingTrendContracts,
    inventories: Object.fromEntries(inventoryEntries)
  };
};

const buildReportForRole = (role, context) => {
  if (role === 'admin') return buildAdminReport(context);
  if (role === 'sales') return buildSalesReport(context);
  if (role === 'accounting') return buildAccountingReport(context);
  if (role === 'purchasing') return buildPurchasingReport(context);
  if (role === 'kitchen') return buildKitchenReport({ ...context, inventorySnapshot: context.inventories.kitchen });
  if (role === 'banquet_supervisor') return buildBanquetReport(context);
  if (role === 'logistics') return buildLogisticsReport(context);
  if (['creative', 'linen', 'stockroom'].includes(role)) {
    return buildInventoryDepartmentReport({
      ...context,
      inventorySnapshot: context.inventories[role],
      department: role
    });
  }

  return {
    title: 'Department Report',
    subtitle: 'No department-specific report is configured for this role yet.',
    summaryCards: [],
    charts: [],
    sections: []
  };
};

router.get('/department', auth, async (req, res) => {
  try {
    const { start, end } = getDateRange(req.query);
    const role = req.user.role;
    const context = await buildContext(role, start, end);
    const report = buildReportForRole(role, context);

    res.json({
      ...report,
      role,
      departmentLabel: ROLE_LABELS[role] || titleCase(role),
      generatedAt: new Date().toISOString(),
      dateRange: {
        startDate: formatDateInput(start),
        endDate: formatDateInput(end)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to build report', error: error.message });
  }
});

module.exports = router;
