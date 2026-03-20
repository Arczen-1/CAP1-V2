const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Contract = require('../models/Contract');
const Incident = require('../models/Incident');
const MenuTasting = require('../models/MenuTasting');
const Notification = require('../models/Notification');
const ProcurementRequest = require('../models/ProcurementRequest');
const CreativeInventory = require('../models/CreativeInventory');
const LinenInventory = require('../models/LinenInventory');
const StockroomInventory = require('../models/StockroomInventory');
const BanquetStaff = require('../models/BanquetStaff');
const User = require('../models/User');
const { Driver, Truck } = require('../models/Logistics');
const { auth, requireRole } = require('../middleware/auth');

const ACTIVE_CONTRACT_STATUSES = ['draft', 'pending_client_signature', 'submitted', 'accounting_review', 'approved'];
const REQUIRED_DOWN_PAYMENT_RATE = 0.6;
const PAYMENT_METHODS = ['cash', 'check', 'bank_transfer', 'credit_card', 'gcash', 'ewallet'];
const PRE_EVENT_CHECKLIST_STATUSES = ['pending', 'prepared'];
const POST_EVENT_CHECKLIST_STATUSES = ['pending_check', 'checked_ok', 'incident_reported'];
const MAX_SIGNATURE_IMAGE_LENGTH = 2_000_000;
const MAX_INCIDENT_ATTACHMENT_LENGTH = 3_000_000;
const INVENTORY_DRAFT_EDITOR_FIELDS = {
  creative: ['creativeAssets'],
  linen: ['linenRequirements'],
  purchasing: ['equipmentChecklist'],
  stockroom: ['equipmentChecklist']
};
const PRE_SIGNATURE_CONFIRMATION_KEYS = ['payments', 'creative', 'linen', 'stockroom'];
const PRE_PAYMENT_INVENTORY_CONFIRMATION_KEYS = ['creative', 'linen', 'stockroom'];
const BANQUET_ASSIGNMENT_ROLES = [
  'head_captain',
  'service_staff',
  'food_runner',
  'busser',
  'bartender',
  'setup_crew'
];
const BANQUET_ROLE_LABELS = {
  head_captain: 'Head Captain',
  service_staff: 'Service Staff',
  food_runner: 'Food Runner',
  busser: 'Busser',
  bartender: 'Bartender',
  setup_crew: 'Setup Crew'
};
const BANQUET_ROLE_ELIGIBILITY = {
  head_captain: ['head_captain'],
  service_staff: ['waiter', 'waitress'],
  food_runner: ['food_runner'],
  busser: ['busser'],
  bartender: ['bartender'],
  setup_crew: ['setup_crew']
};
const LEGACY_CHECKLIST_STATUS_MAP = {
  staged: 'prepared',
  setup: 'prepared',
  loaded: 'prepared',
  dispatched: 'prepared',
  returned: 'prepared'
};
const INVENTORY_STATUS_RULES = {
  creativeAssets: {
    allowedRoles: ['creative', 'admin'],
    allowedStatuses: PRE_EVENT_CHECKLIST_STATUSES,
    postEventAllowedStatuses: ['pending_check', 'checked_ok'],
    progressKey: 'creative',
    readyStatuses: ['prepared'],
    incidentDepartment: 'creative'
  },
  linenRequirements: {
    allowedRoles: ['linen', 'admin'],
    allowedStatuses: PRE_EVENT_CHECKLIST_STATUSES,
    postEventAllowedStatuses: ['pending_check', 'checked_ok'],
    progressKey: 'linen',
    readyStatuses: ['prepared'],
    incidentDepartment: 'linen'
  },
  equipmentChecklist: {
    allowedRoles: ['purchasing', 'stockroom', 'logistics', 'admin'],
    allowedStatuses: PRE_EVENT_CHECKLIST_STATUSES,
    postEventAllowedStatuses: ['pending_check', 'checked_ok'],
    progressKey: 'logistics',
    readyStatuses: ['prepared'],
    incidentDepartment: 'logistics'
  }
};

const SECTION_CONFIRMATION_RULES = {
  details: {
    label: 'contract details',
    allowedRoles: ['sales', 'admin'],
    required: () => true,
    ready: (contract) => Boolean(
      contract.clientName
      && contract.clientContact
      && contract.clientEmail
      && contract.eventDate
      && contract.venue?.name
      && contract.venue?.address
    ),
    missingDataMessage: 'Complete the contract details before confirming this section.'
  },
  menu: {
    label: 'menu',
    allowedRoles: ['sales', 'admin'],
    required: () => true,
    ready: (contract) => (contract.menuDetails || []).length > 0,
    missingDataMessage: 'Add at least one menu item before sending the contract for signature.'
  },
  preferences: {
    label: 'event preferences',
    allowedRoles: ['sales', 'admin'],
    required: () => true,
    ready: () => true,
    missingDataMessage: 'Review the event preferences before confirming this section.'
  },
  payments: {
    label: 'payment arrangement',
    allowedRoles: ['sales', 'admin'],
    required: () => true,
    ready: (contract) => {
      const downPaymentPercent = Number(contract.downPaymentPercent);
      const finalPaymentPercent = Number(contract.finalPaymentPercent);

      return (
        (downPaymentPercent === 60 && finalPaymentPercent === 40)
        || (downPaymentPercent === 100 && finalPaymentPercent === 0)
      );
    },
    missingDataMessage: 'Choose the agreed payment term before confirming the payment arrangement.'
  },
  creative: {
    label: 'creative items',
    allowedRoles: ['creative', 'admin'],
    required: (contract) => (contract.creativeAssets || []).length > 0,
    ready: (contract) => (contract.creativeAssets || []).length > 0,
    missingDataMessage: 'Add creative items before confirming the creative section.'
  },
  linen: {
    label: 'linen items',
    allowedRoles: ['linen', 'admin'],
    required: (contract) => (contract.linenRequirements || []).length > 0,
    ready: (contract) => (contract.linenRequirements || []).length > 0,
    missingDataMessage: 'Add linen items before confirming the linen section.'
  },
  stockroom: {
    label: 'stockroom and equipment items',
    allowedRoles: ['purchasing', 'stockroom', 'admin'],
    required: (contract) => (contract.equipmentChecklist || []).length > 0,
    ready: (contract) => (contract.equipmentChecklist || []).length > 0,
    missingDataMessage: 'Add stockroom or equipment items before confirming this section.'
  },
  logistics: {
    label: 'logistics plan',
    allowedRoles: ['logistics', 'admin'],
    required: () => true,
    ready: (contract) => Boolean(contract.eventDate && contract.venue?.name),
    missingDataMessage: 'Complete the event date and venue before confirming logistics.'
  }
};

const CONTRACT_PACKAGE_LIMITS = {
  basic: { mains: 3, sides: 2, desserts: 1, drinks: 1 },
  standard: { mains: 4, sides: 3, desserts: 2, drinks: 2 },
  premium: { mains: 5, sides: 3, desserts: 2, drinks: 2 },
  deluxe: { mains: 6, sides: 4, desserts: 3, drinks: 3 }
};

const MAIN_MENU_CATEGORIES = new Set(['beef', 'pork', 'chicken', 'fish', 'seafood']);
const SIDE_MENU_CATEGORIES = new Set(['pasta', 'vegetables', 'rice']);
const PROCUREMENT_COVERAGE_STATUSES = ['requested', 'awaiting_accounting_approval', 'approved', 'fulfilled'];
const PLANNING_VALIDATION_FIELDS = new Set([
  'eventDate',
  'venue',
  'packageSelected',
  'totalPacks',
  'menuDetails',
  'creativeAssets',
  'linenRequirements',
  'equipmentChecklist'
]);
const INVENTORY_SECTION_TO_PROCUREMENT_META = {
  creativeAssets: { label: 'creative', department: 'creative' },
  linenRequirements: { label: 'linen', department: 'linen' },
  equipmentChecklist: { label: 'stockroom', department: 'stockroom' }
};

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const isValidSignatureImage = (value) => (
  value === undefined
  || value === null
  || value === ''
  || (typeof value === 'string' && value.startsWith('data:image/') && value.length <= MAX_SIGNATURE_IMAGE_LENGTH)
);

const endOfDay = (value) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const normalizeKey = (...parts) => {
  const candidate = parts.find(part => part !== undefined && part !== null && String(part).trim());
  return candidate ? String(candidate).trim() : '';
};

const computeDimensionsVolume = (dimensions) => {
  if (!dimensions) return 0;

  if (dimensions.volume && Number(dimensions.volume) > 0) {
    return Number(dimensions.volume);
  }

  if (dimensions.length && dimensions.width && dimensions.height) {
    return (Number(dimensions.length) * Number(dimensions.width) * Number(dimensions.height)) / 1000000;
  }

  return 0;
};

const roundToTwo = (value) => {
  return Math.round((value || 0) * 100) / 100;
};

const formatDateLabel = (value) => new Date(value).toLocaleDateString('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric'
});

const normalizeVenueKey = (value) => String(value || '')
  .trim()
  .replace(/\s+/g, ' ')
  .toLowerCase();

const pluralize = (count, singular, plural = `${singular}s`) => (
  Math.abs(Number(count) || 0) === 1 ? singular : plural
);

const getMenuCategoryType = (category) => {
  const normalizedCategory = String(category || '').trim().toLowerCase();

  if (MAIN_MENU_CATEGORIES.has(normalizedCategory)) {
    return 'main';
  }

  if (SIDE_MENU_CATEGORIES.has(normalizedCategory)) {
    return 'side';
  }

  if (normalizedCategory === 'dessert') {
    return 'dessert';
  }

  if (normalizedCategory === 'drinks') {
    return 'drinks';
  }

  return 'other';
};

const countMenuSelections = (menuDetails = []) => menuDetails.reduce((counts, item) => {
  const categoryType = getMenuCategoryType(item?.category);
  counts[categoryType] = (counts[categoryType] || 0) + 1;
  return counts;
}, {
  main: 0,
  side: 0,
  dessert: 0,
  drinks: 0,
  other: 0
});

const buildMenuSelectionIssues = (contract) => {
  const packageLimits = CONTRACT_PACKAGE_LIMITS[contract.packageSelected];

  if (!packageLimits) {
    return [];
  }

  const counts = countMenuSelections(contract.menuDetails || []);
  const issues = [];
  const selectionChecks = [
    { key: 'main', label: 'main dish', required: packageLimits.mains },
    { key: 'side', label: 'side dish', required: packageLimits.sides },
    { key: 'dessert', label: 'dessert', required: packageLimits.desserts },
    { key: 'drinks', label: 'drink', required: packageLimits.drinks }
  ];

  selectionChecks.forEach(({ key, label, required }) => {
    const selected = counts[key] || 0;
    if (selected !== required) {
      issues.push(
        `Package ${contract.packageSelected} requires exactly ${required} ${pluralize(required, label)}, but this contract has ${selected}.`
      );
    }
  });

  return issues;
};

const buildVenueConflictIssues = async (contract) => {
  if (!contract?.eventDate || !contract?.venue?.name) {
    return [];
  }

  const eventStart = startOfDay(contract.eventDate);
  const eventEnd = endOfDay(contract.eventDate);
  const normalizedVenue = normalizeVenueKey(contract.venue.name);

  if (!normalizedVenue) {
    return [];
  }

  const sameDayContracts = await Contract.find({
    _id: { $ne: contract._id },
    status: { $in: ACTIVE_CONTRACT_STATUSES },
    eventDate: {
      $gte: eventStart,
      $lte: eventEnd
    }
  }).select('contractNumber clientName venue');

  const venueConflict = sameDayContracts.find((entry) => normalizeVenueKey(entry.venue?.name) === normalizedVenue);

  if (!venueConflict) {
    return [];
  }

  const contractLabel = venueConflict.contractNumber
    ? ` under contract ${venueConflict.contractNumber}`
    : venueConflict.clientName
      ? ` for ${venueConflict.clientName}`
      : '';

  return [
    `${contract.venue.name} is already booked on ${formatDateLabel(contract.eventDate)}${contractLabel}. Choose a different venue, hall, or date before saving.`
  ];
};

const buildInventoryConflictIssues = async (contract) => {
  const operationsSummary = await buildOperationsSummary(contract);
  const shortageIssues = operationsSummary.inventory.shortages.map((item) => {
    const itemLabel = item.itemName || item.itemCode || 'Inventory item';
    const availableQuantity = Math.max(0, Number(item.availableQuantity) || 0);
    const requestedQuantity = Math.max(0, Number(item.requestedQuantity) || 0);

    if (item.sameDayConflict) {
      return `${itemLabel} only has ${availableQuantity} available on ${formatDateLabel(contract.eventDate)} because ${item.reservedOnDate} ${pluralize(item.reservedOnDate, 'unit')} ${item.reservedOnDate === 1 ? 'is' : 'are'} already reserved for another same-day contract. ${item.requestAction}`;
    }

    return `${itemLabel} only has ${availableQuantity} available on ${formatDateLabel(contract.eventDate)}, but this contract needs ${requestedQuantity}. ${item.requestAction}`;
  });

  return {
    operationsSummary,
    issues: shortageIssues
  };
};

const validateContractPlanning = async (contract) => {
  return {
    issues: [
    ...buildMenuSelectionIssues(contract),
    ...await buildVenueConflictIssues(contract)
    ]
  };
};

const shouldValidatePlanningPayload = (payload = {}) => Object.keys(payload).some((key) => (
  PLANNING_VALIDATION_FIELDS.has(key)
));

const buildPlanningValidationResponse = (issues = []) => {
  if (!issues.length) {
    return {
      message: '',
      issues: []
    };
  }

  return {
    message: issues.length === 1
      ? issues[0]
      : `Fix ${issues.length} contract issue(s) before saving. ${issues[0]}`,
    issues
  };
};

const buildProcurementCoverageKey = (sectionKey, itemId, itemName) => (
  `${String(sectionKey || '').trim()}::${normalizeKey(itemId, itemName).toLowerCase()}`
);

const getProcurementCoverageQuantity = (request) => Math.max(
  Number(request?.requestedQuantity) || 0,
  Number(request?.shortageQuantity) || 0
);

const getApprovalProcurementIssues = async (contract) => {
  const inventoryValidation = await buildInventoryConflictIssues(contract);
  const shortageItems = inventoryValidation.operationsSummary.inventory.shortages.filter((item) => (
    Number(item.shortageQuantity) > 0
  ));

  if (!shortageItems.length) {
    return [];
  }

  const activeRequests = await ProcurementRequest.find({
    contract: contract._id,
    status: { $in: PROCUREMENT_COVERAGE_STATUSES }
  }).select('sourceSection inventoryItem itemName requestedQuantity shortageQuantity');

  const coverageByKey = activeRequests.reduce((coverageMap, request) => {
    const key = buildProcurementCoverageKey(
      request.sourceSection,
      request.inventoryItem ? String(request.inventoryItem) : '',
      request.itemName
    );
    coverageMap.set(key, (coverageMap.get(key) || 0) + getProcurementCoverageQuantity(request));
    return coverageMap;
  }, new Map());

  return shortageItems.reduce((issues, item) => {
    const meta = INVENTORY_SECTION_TO_PROCUREMENT_META[item.sectionKey];
    const shortageQuantity = Number(item.shortageQuantity) || 0;

    if (!meta) {
      return issues;
    }

    if (!item.itemId) {
      issues.push(
        `${item.itemName} is short by ${shortageQuantity} for ${formatDateLabel(contract.eventDate)} and must be linked to ${meta.label} inventory before approval.`
      );
      return issues;
    }

    const coverageKey = buildProcurementCoverageKey(item.sectionKey, item.itemId, item.itemName);
    const coveredQuantity = coverageByKey.get(coverageKey) || 0;
    const uncoveredQuantity = Math.max(0, shortageQuantity - coveredQuantity);

    if (uncoveredQuantity > 0) {
      issues.push(
        `${item.itemName} is still short by ${shortageQuantity} for ${formatDateLabel(contract.eventDate)}. Create purchasing or rental request(s) for ${uncoveredQuantity} more ${pluralize(uncoveredQuantity, 'item')} before approving this contract.`
      );
    }

    return issues;
  }, []);
};

const buildInventoryShortageDetails = ({ inventoryItem, itemLabel, requiredQuantity, effectiveAvailable, reservedOnDate }) => {
  const shortageQuantity = Math.max(0, requiredQuantity - effectiveAvailable);
  const sameDayConflict = shortageQuantity > 0 && reservedOnDate > 0;
  const trimmedItemLabel = String(itemLabel || 'item').trim();

  if (!inventoryItem) {
    return {
      shortageQuantity,
      sameDayConflict: false,
      requestAction: shortageQuantity > 0
        ? `Link this item to inventory or request purchasing/rental for ${shortageQuantity} ${trimmedItemLabel} for this event date.`
        : ''
    };
  }

  if (shortageQuantity <= 0) {
    return {
      shortageQuantity: 0,
      sameDayConflict: false,
      requestAction: ''
    };
  }

  return {
    shortageQuantity,
    sameDayConflict,
    requestAction: sameDayConflict
      ? `Same-day stock is already committed. Request purchasing/rental for ${shortageQuantity} more ${trimmedItemLabel} for this event date.`
      : `Request purchasing/rental for ${shortageQuantity} more ${trimmedItemLabel} for this event date.`
  };
};

const createEmptyBanquetStaffingPlan = () => BANQUET_ASSIGNMENT_ROLES.reduce((plan, role) => {
  plan[role] = 0;
  return plan;
}, {});

const sanitizeBanquetStaffingPlan = (value = {}) => BANQUET_ASSIGNMENT_ROLES.reduce((plan, role) => {
  const nextValue = Number(value?.[role]);
  plan[role] = Number.isFinite(nextValue) && nextValue > 0 ? Math.floor(nextValue) : 0;
  return plan;
}, createEmptyBanquetStaffingPlan());

const getSuggestedBanquetStaffingPlan = (guestCount) => {
  const normalizedGuestCount = Math.max(0, Number(guestCount) || 0);

  if (normalizedGuestCount === 0) {
    return createEmptyBanquetStaffingPlan();
  }

  return {
    head_captain: 1,
    service_staff: Math.max(2, Math.ceil(normalizedGuestCount / 30)),
    food_runner: normalizedGuestCount >= 80 ? Math.max(1, Math.ceil(normalizedGuestCount / 120)) : 0,
    busser: normalizedGuestCount >= 120 ? Math.max(1, Math.ceil(normalizedGuestCount / 150)) : 0,
    bartender: normalizedGuestCount >= 150 ? Math.max(1, Math.ceil(normalizedGuestCount / 200)) : 0,
    setup_crew: Math.max(2, Math.ceil(normalizedGuestCount / 120))
  };
};

const getBanquetPlanCount = (plan = {}) => BANQUET_ASSIGNMENT_ROLES.reduce(
  (sum, role) => sum + (Number(plan?.[role]) || 0),
  0
);

const getEstimatedBanquetGuestCount = (contract) => {
  const explicitCount = Number(contract?.banquetAssignment?.serviceGuestCount);
  if (Number.isFinite(explicitCount) && explicitCount > 0) {
    return Math.floor(explicitCount);
  }

  const totalPacks = Math.max(0, Number(contract?.totalPacks) || 0);
  const estimatedSeatedGuests = Math.max(0, totalPacks - 25);

  return estimatedSeatedGuests || totalPacks;
};

const toBanquetStaffSummary = (staff, meta = {}) => ({
  _id: String(staff._id),
  employeeId: staff.employeeId,
  fullName: staff.fullName,
  role: staff.role,
  status: staff.status,
  employmentType: staff.employmentType,
  rating: staff.rating,
  totalEventsWorked: staff.totalEventsWorked || 0,
  ...meta
});

const getBanquetCoverageProgress = (supervisorId, staffingPlan, assignments = []) => {
  const requiredAssignments = getBanquetPlanCount(staffingPlan);
  const totalSteps = requiredAssignments + 1;

  if (totalSteps === 0) {
    return 0;
  }

  const assignmentCounts = assignments.reduce((counts, assignment) => {
    const key = assignment.assignmentRole;
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});

  const coveredAssignments = BANQUET_ASSIGNMENT_ROLES.reduce((sum, role) => (
    sum + Math.min(Number(staffingPlan?.[role]) || 0, assignmentCounts[role] || 0)
  ), 0);

  const completedSteps = coveredAssignments + (supervisorId ? 1 : 0);

  return Math.round((completedSteps / totalSteps) * 100);
};

const normalizeChecklistStatus = (value) => {
  if (value === undefined || value === null || value === '') {
    return 'pending';
  }

  if (PRE_EVENT_CHECKLIST_STATUSES.includes(value)) {
    return value;
  }

  return LEGACY_CHECKLIST_STATUS_MAP[value] || 'pending';
};

const normalizePostEventStatus = (value, legacyStatus) => {
  if (POST_EVENT_CHECKLIST_STATUSES.includes(value)) {
    return value;
  }

  if (legacyStatus === 'returned') {
    return 'checked_ok';
  }

  return 'pending_check';
};

const hasCompletedPostEventCheck = (item) => ['checked_ok', 'incident_reported'].includes(
  normalizePostEventStatus(item?.postEventStatus, item?.status)
);

const countPendingPostEventChecks = (items = []) => items.filter((item) => !hasCompletedPostEventCheck(item)).length;

const ensurePostEventStatus = (item = {}) => {
  const legacyStatus = item.status;
  item.status = normalizeChecklistStatus(item.status);
  item.postEventStatus = normalizePostEventStatus(item.postEventStatus, legacyStatus);
  return item;
};

const filterValidObjectIds = (values = []) => {
  return [...new Set(
    values
      .filter(value => value && mongoose.isValidObjectId(value))
      .map(value => String(value))
  )];
};

const buildReservationMap = (contracts, section) => {
  const reservations = new Map();

  contracts.forEach(contract => {
    (contract[section] || []).forEach(item => {
      const key = normalizeKey(item.itemId, item.itemCode, item.item, item.type);
      if (!key) return;

      reservations.set(key, (reservations.get(key) || 0) + (Number(item.quantity) || 0));
    });
  });

  return reservations;
};

const calculateProgressFromItems = (items, readyStatuses) => {
  if (!items?.length) {
    return 0;
  }

  const completed = items.filter(item => readyStatuses.includes(normalizeChecklistStatus(item.status))).length;
  return Math.round((completed / items.length) * 100);
};

const getAggregateChecklistStatus = (items = []) => {
  if (!items.length) {
    return 'pending';
  }

  const normalizedStatuses = items.map(item => normalizeChecklistStatus(item.status));

  if (normalizedStatuses.every(status => status === 'prepared')) {
    return 'prepared';
  }

  return 'pending';
};

const resetSectionConfirmation = (contract, sectionKey) => {
  contract.sectionConfirmations = contract.sectionConfirmations || {};
  contract.sectionConfirmations[sectionKey] = {
    confirmed: false,
    confirmedAt: null,
    confirmedBy: null
  };
};

const resetSectionConfirmationsForPayload = (contract, payload) => {
  if ('clientName' in payload || 'clientContact' in payload || 'clientEmail' in payload || 'eventDate' in payload || 'venue' in payload || 'packageSelected' in payload || 'totalPacks' in payload) {
    resetSectionConfirmation(contract, 'details');
    resetSectionConfirmation(contract, 'logistics');
  }

  if ('menuDetails' in payload) {
    resetSectionConfirmation(contract, 'menu');
  }

  if ('preferredColor' in payload || 'napkinType' in payload || 'tableSetup' in payload || 'backdropRequirements' in payload || 'specialRequests' in payload) {
    resetSectionConfirmation(contract, 'preferences');
  }

  if (
    'packageSelected' in payload
    || 'totalPacks' in payload
    || 'packagePrice' in payload
    || 'totalContractValue' in payload
    || 'downPaymentPercent' in payload
    || 'finalPaymentPercent' in payload
  ) {
    resetSectionConfirmation(contract, 'payments');
  }

  if ('creativeAssets' in payload) {
    resetSectionConfirmation(contract, 'creative');
    resetSectionConfirmation(contract, 'payments');
    resetSectionConfirmation(contract, 'logistics');
  }

  if ('linenRequirements' in payload) {
    resetSectionConfirmation(contract, 'linen');
    resetSectionConfirmation(contract, 'payments');
  }

  if ('equipmentChecklist' in payload) {
    resetSectionConfirmation(contract, 'stockroom');
    resetSectionConfirmation(contract, 'payments');
    resetSectionConfirmation(contract, 'logistics');
  }
};

const getRequiredConfirmationKeys = (contract) => {
  return Object.entries(SECTION_CONFIRMATION_RULES)
    .filter(([, rule]) => rule.required(contract))
    .map(([key]) => key);
};

const getAllowedDraftUpdateFieldsForRole = (role) => (
  INVENTORY_DRAFT_EDITOR_FIELDS[role] || []
);

const getDisallowedDraftUpdateFields = (payload = {}, allowedFields = []) => (
  Object.keys(payload).filter((key) => !allowedFields.includes(key))
);

const getPendingInventoryConfirmationLabels = (contract) => {
  const sectionConfirmations = contract.sectionConfirmations || {};

  return getRequiredConfirmationKeys(contract)
    .filter((key) => PRE_PAYMENT_INVENTORY_CONFIRMATION_KEYS.includes(key))
    .filter((key) => !sectionConfirmations[key]?.confirmed)
    .map((key) => SECTION_CONFIRMATION_RULES[key]?.label)
    .filter(Boolean);
};

const getFinalizationChecklist = (contract) => {
  const sectionConfirmations = contract.sectionConfirmations || {};
  const issues = [];
  const detailsRule = SECTION_CONFIRMATION_RULES.details;
  const menuRule = SECTION_CONFIRMATION_RULES.menu;
  const paymentsRule = SECTION_CONFIRMATION_RULES.payments;
  const requiredPreSignatureConfirmations = getRequiredConfirmationKeys(contract)
    .filter((key) => PRE_SIGNATURE_CONFIRMATION_KEYS.includes(key));
  const pendingInventoryConfirmationLabels = getPendingInventoryConfirmationLabels(contract);

  if (!detailsRule.ready(contract)) {
    issues.push('Complete the contract details before sending the contract for signature.');
  }

  if (!menuRule.ready(contract)) {
    issues.push(menuRule.missingDataMessage);
  }

  if (pendingInventoryConfirmationLabels.length > 0) {
    issues.push(`Confirm ${pendingInventoryConfirmationLabels.join(', ')} before confirming the payment arrangement.`);
  } else {
    if (!paymentsRule.ready(contract)) {
      issues.push(paymentsRule.missingDataMessage);
    }

    if (!sectionConfirmations.payments?.confirmed) {
      issues.push('Confirm the payment arrangement before sending the contract for signature.');
    }
  }

  requiredPreSignatureConfirmations
    .filter((key) => !['payments', ...PRE_PAYMENT_INVENTORY_CONFIRMATION_KEYS].includes(key))
    .forEach((key) => {
      const rule = SECTION_CONFIRMATION_RULES[key];
      if (!rule || sectionConfirmations[key]?.confirmed) {
        return;
      }

      issues.push(`Confirm the ${rule.label} before sending the contract for signature.`);
    });

  return {
    requiredSections: requiredPreSignatureConfirmations,
    issues
  };
};

const getPaymentMilestones = (contract) => {
  const totalContractValue = Number(contract.totalContractValue) || 0;
  const downPaymentRate = Math.max(
    REQUIRED_DOWN_PAYMENT_RATE,
    (Number(contract.downPaymentPercent) || REQUIRED_DOWN_PAYMENT_RATE * 100) / 100
  );
  const totalPaid = (contract.payments || [])
    .filter(payment => payment.status === 'completed')
    .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  const requiredDownPayment = Math.round(totalContractValue * downPaymentRate * 100) / 100;
  const remainingBalance = Math.max(0, totalContractValue - totalPaid);

  return {
    totalPaid,
    downPaymentRate,
    requiredDownPayment,
    remainingBalance,
    downPaymentSatisfied: totalPaid >= requiredDownPayment,
    fullyPaid: totalPaid >= totalContractValue
  };
};

const getFinalPaymentDueDate = (contract) => {
  const dueDate = new Date(contract.eventDate || new Date());
  dueDate.setMonth(dueDate.getMonth() - 1);
  return dueDate;
};

const getContractClosureChecklist = (contract) => {
  const issues = [];
  const paymentMilestones = getPaymentMilestones(contract);
  const now = new Date();

  if (!contract.eventDate || now <= endOfDay(contract.eventDate)) {
    issues.push('The contract can only be closed after the event date has passed.');
  }

  if (!paymentMilestones.fullyPaid) {
    issues.push(`Outstanding balance of ${paymentMilestones.remainingBalance.toFixed(2)} must be settled before closing the contract.`);
  }

  const hasLogisticsBooking = Boolean(
    contract.logisticsAssignment?.driver
    || contract.logisticsAssignment?.truck
    || (contract.logisticsAssignment?.assignmentStatus && contract.logisticsAssignment.assignmentStatus !== 'pending')
  );

  if (hasLogisticsBooking && contract.logisticsAssignment?.assignmentStatus !== 'completed') {
    issues.push('Logistics booking must be marked completed before the contract can be closed.');
  }

  const creativePending = countPendingPostEventChecks(contract.creativeAssets || []);
  if (creativePending) {
    issues.push(`Creative post-event checks are still pending for ${creativePending} item(s).`);
  }

  const linenPending = countPendingPostEventChecks(contract.linenRequirements || []);
  if (linenPending) {
    issues.push(`Linen post-event checks are still pending for ${linenPending} item(s).`);
  }

  const stockroomPending = countPendingPostEventChecks(contract.equipmentChecklist || []);
  if (stockroomPending) {
    issues.push(`Stockroom post-event checks are still pending for ${stockroomPending} item(s).`);
  }

  return {
    issues,
    paymentMilestones,
    canClose: issues.length === 0
  };
};

const buildOperationsSummary = async (contract) => {
  const eventStart = startOfDay(contract.eventDate);
  const eventEnd = endOfDay(contract.eventDate);

  const sameDayContracts = await Contract.find({
    _id: { $ne: contract._id },
    status: { $in: ACTIVE_CONTRACT_STATUSES },
    eventDate: {
      $gte: eventStart,
      $lte: eventEnd
    }
  }).select('creativeAssets linenRequirements equipmentChecklist logisticsAssignment banquetAssignment assignedSupervisor eventDate contractNumber');

  const creativeReservations = buildReservationMap(sameDayContracts, 'creativeAssets');
  const linenReservations = buildReservationMap(sameDayContracts, 'linenRequirements');
  const stockroomReservations = buildReservationMap(sameDayContracts, 'equipmentChecklist');

  const creativeIds = filterValidObjectIds((contract.creativeAssets || []).map(item => item.itemId));
  const linenIds = filterValidObjectIds((contract.linenRequirements || []).map(item => item.itemId));
  const stockroomIds = filterValidObjectIds((contract.equipmentChecklist || []).map(item => item.itemId));
  const assignedBanquetStaffIds = filterValidObjectIds((contract.banquetAssignment?.assignments || []).map(item => item.staff));

  const banquetStaffQuery = assignedBanquetStaffIds.length
    ? {
        $or: [
          { status: 'active' },
          { _id: { $in: assignedBanquetStaffIds } }
        ]
      }
    : { status: 'active' };

  const [creativeInventory, linenInventory, stockroomInventory, activeDrivers, activeTrucks, banquetStaffRoster, banquetSupervisors] = await Promise.all([
    creativeIds.length ? CreativeInventory.find({ _id: { $in: creativeIds } }) : [],
    linenIds.length ? LinenInventory.find({ _id: { $in: linenIds } }) : [],
    stockroomIds.length ? StockroomInventory.find({ _id: { $in: stockroomIds } }) : [],
    Driver.find({ status: 'active' }).sort({ fullName: 1 }),
    Truck.find({ status: { $in: ['available', 'in_use'] } })
      .populate('assignedDriver', 'driverId fullName status phone')
      .sort({ plateNumber: 1 }),
    BanquetStaff.find(banquetStaffQuery).sort({ totalEventsWorked: 1, fullName: 1 }),
    User.find({ role: 'banquet_supervisor' }).sort({ name: 1 })
  ]);

  const creativeById = new Map(creativeInventory.map(item => [String(item._id), item]));
  const creativeByCode = new Map(creativeInventory.map(item => [item.itemCode, item]));
  const linenById = new Map(linenInventory.map(item => [String(item._id), item]));
  const linenByCode = new Map(linenInventory.map(item => [item.itemCode, item]));
  const stockroomById = new Map(stockroomInventory.map(item => [String(item._id), item]));
  const stockroomByCode = new Map(stockroomInventory.map(item => [item.itemCode, item]));

  let totalEstimatedVolume = 0;

  const creativeItems = (contract.creativeAssets || []).map((rawItem) => {
    const item = ensurePostEventStatus(rawItem);
    const inventoryItem = creativeById.get(String(item.itemId || '')) || creativeByCode.get(item.itemCode);
    const lookupKey = normalizeKey(item.itemId, item.itemCode, item.item);
    const reservedOnDate = creativeReservations.get(lookupKey) || 0;
    const effectiveAvailable = Math.max(0, (inventoryItem?.availableQuantity || 0) - reservedOnDate);
    const requiredQuantity = Number(item.quantity) || 0;
    const enoughStock = inventoryItem ? effectiveAvailable >= requiredQuantity : false;
    const shortageMeta = buildInventoryShortageDetails({
      inventoryItem,
      itemLabel: item.item,
      requiredQuantity,
      effectiveAvailable,
      reservedOnDate
    });
    const estimatedVolume = roundToTwo((computeDimensionsVolume(inventoryItem?.dimensions) || 0) * requiredQuantity);
    const normalizedStatus = normalizeChecklistStatus(item.status);
    totalEstimatedVolume += estimatedVolume;

    return {
      sectionKey: 'creativeAssets',
      itemId: item.itemId || null,
      itemName: item.item,
      itemCode: item.itemCode || inventoryItem?.itemCode || '',
      category: item.category || inventoryItem?.category || '',
      requestedQuantity: requiredQuantity,
      availableQuantity: inventoryItem ? effectiveAvailable : null,
      reservedOnDate,
      inventoryStatus: inventoryItem?.status || 'not_linked',
      itemStatus: normalizedStatus,
      postEventStatus: item.postEventStatus,
      postEventNotes: item.postEventNotes || '',
      enoughStock,
      shortageQuantity: shortageMeta.shortageQuantity,
      sameDayConflict: shortageMeta.sameDayConflict,
      requestAction: shortageMeta.requestAction,
      readyForDispatch: enoughStock && INVENTORY_STATUS_RULES.creativeAssets.readyStatuses.includes(normalizedStatus),
      imageUrl: item.imageUrl || inventoryItem?.images?.find(image => image.isPrimary)?.url || inventoryItem?.images?.[0]?.url || '',
      notes: item.notes || '',
      blockers: [
        !inventoryItem ? 'Item is not linked to creative inventory.' : '',
        inventoryItem && inventoryItem.status !== 'available' ? `Inventory status is ${inventoryItem.status}.` : '',
        shortageMeta.sameDayConflict ? `${reservedOnDate} item(s) are already reserved for another same-day event.` : '',
        inventoryItem && effectiveAvailable < requiredQuantity ? `Needs ${requiredQuantity - effectiveAvailable} more item(s) for this event date.` : ''
      ].filter(Boolean)
    };
  });

  const linenItems = (contract.linenRequirements || []).map((rawItem) => {
    const item = ensurePostEventStatus(rawItem);
    const inventoryItem = linenById.get(String(item.itemId || '')) || linenByCode.get(item.itemCode);
    const lookupKey = normalizeKey(item.itemId, item.itemCode, item.type);
    const reservedOnDate = linenReservations.get(lookupKey) || 0;
    const effectiveAvailable = Math.max(0, (inventoryItem?.availableQuantity || 0) - reservedOnDate);
    const requiredQuantity = Number(item.quantity) || 0;
    const enoughStock = inventoryItem ? effectiveAvailable >= requiredQuantity : false;
    const shortageMeta = buildInventoryShortageDetails({
      inventoryItem,
      itemLabel: item.type,
      requiredQuantity,
      effectiveAvailable,
      reservedOnDate
    });
    const normalizedStatus = normalizeChecklistStatus(item.status);

    return {
      sectionKey: 'linenRequirements',
      itemId: item.itemId || null,
      itemName: item.type,
      itemCode: item.itemCode || inventoryItem?.itemCode || '',
      category: item.category || inventoryItem?.category || '',
      requestedQuantity: requiredQuantity,
      availableQuantity: inventoryItem ? effectiveAvailable : null,
      reservedOnDate,
      inventoryStatus: inventoryItem?.status || 'not_linked',
      itemStatus: normalizedStatus,
      postEventStatus: item.postEventStatus,
      postEventNotes: item.postEventNotes || '',
      enoughStock,
      shortageQuantity: shortageMeta.shortageQuantity,
      sameDayConflict: shortageMeta.sameDayConflict,
      requestAction: shortageMeta.requestAction,
      readyForDispatch: enoughStock && INVENTORY_STATUS_RULES.linenRequirements.readyStatuses.includes(normalizedStatus),
      imageUrl: item.imageUrl || inventoryItem?.images?.find(image => image.isPrimary)?.url || inventoryItem?.images?.[0]?.url || '',
      notes: item.notes || '',
      blockers: [
        !inventoryItem ? 'Item is not linked to linen inventory.' : '',
        inventoryItem && inventoryItem.status !== 'available' ? `Inventory status is ${inventoryItem.status}.` : '',
        shortageMeta.sameDayConflict ? `${reservedOnDate} item(s) are already reserved for another same-day event.` : '',
        inventoryItem && effectiveAvailable < requiredQuantity ? `Needs ${requiredQuantity - effectiveAvailable} more item(s) for this event date.` : ''
      ].filter(Boolean)
    };
  });

  const stockroomItems = (contract.equipmentChecklist || []).map((rawItem) => {
    const item = ensurePostEventStatus(rawItem);
    const inventoryItem = stockroomById.get(String(item.itemId || '')) || stockroomByCode.get(item.itemCode);
    const lookupKey = normalizeKey(item.itemId, item.itemCode, item.item);
    const reservedOnDate = stockroomReservations.get(lookupKey) || 0;
    const effectiveAvailable = Math.max(0, (inventoryItem?.availableQuantity || 0) - reservedOnDate);
    const requiredQuantity = Number(item.quantity) || 0;
    const enoughStock = inventoryItem ? effectiveAvailable >= requiredQuantity : false;
    const shortageMeta = buildInventoryShortageDetails({
      inventoryItem,
      itemLabel: item.item,
      requiredQuantity,
      effectiveAvailable,
      reservedOnDate
    });
    const estimatedVolume = roundToTwo((computeDimensionsVolume(inventoryItem?.dimensions) || 0) * requiredQuantity);
    const normalizedStatus = normalizeChecklistStatus(item.status);
    totalEstimatedVolume += estimatedVolume;

    return {
      sectionKey: 'equipmentChecklist',
      itemId: item.itemId || null,
      itemName: item.item,
      itemCode: item.itemCode || inventoryItem?.itemCode || '',
      category: item.category || inventoryItem?.category || '',
      requestedQuantity: requiredQuantity,
      availableQuantity: inventoryItem ? effectiveAvailable : null,
      reservedOnDate,
      inventoryStatus: inventoryItem?.status || 'not_linked',
      itemStatus: normalizedStatus,
      postEventStatus: item.postEventStatus,
      postEventNotes: item.postEventNotes || '',
      enoughStock,
      shortageQuantity: shortageMeta.shortageQuantity,
      sameDayConflict: shortageMeta.sameDayConflict,
      requestAction: shortageMeta.requestAction,
      readyForDispatch: enoughStock && INVENTORY_STATUS_RULES.equipmentChecklist.readyStatuses.includes(normalizedStatus),
      imageUrl: item.imageUrl || inventoryItem?.images?.find(image => image.isPrimary)?.url || inventoryItem?.images?.[0]?.url || '',
      notes: item.notes || '',
      blockers: [
        !inventoryItem ? 'Item is not linked to stockroom inventory.' : '',
        inventoryItem && inventoryItem.status !== 'available' ? `Inventory status is ${inventoryItem.status}.` : '',
        shortageMeta.sameDayConflict ? `${reservedOnDate} item(s) are already reserved for another same-day event.` : '',
        inventoryItem && effectiveAvailable < requiredQuantity ? `Needs ${requiredQuantity - effectiveAvailable} more item(s) for this event date.` : ''
      ].filter(Boolean)
    };
  });

  const assignedDriverId = contract.logisticsAssignment?.driver ? String(contract.logisticsAssignment.driver) : '';
  const assignedTruckId = contract.logisticsAssignment?.truck ? String(contract.logisticsAssignment.truck) : '';
  const reservedDriverIds = new Set(
    sameDayContracts
      .map(entry => entry.logisticsAssignment?.driver)
      .filter(Boolean)
      .map(value => String(value))
  );
  const reservedTruckIds = new Set(
    sameDayContracts
      .map(entry => entry.logisticsAssignment?.truck)
      .filter(Boolean)
      .map(value => String(value))
  );

  const availableDrivers = activeDrivers.filter(driver => {
    const driverId = String(driver._id);
    return driverId === assignedDriverId || !reservedDriverIds.has(driverId);
  });

  const availableTrucks = activeTrucks.filter(truck => {
    const truckId = String(truck._id);
    return truckId === assignedTruckId || !reservedTruckIds.has(truckId);
  });

  const sortedTrucks = [...availableTrucks].sort((left, right) => {
    const leftVolume = left.capacity?.volume || Number.MAX_SAFE_INTEGER;
    const rightVolume = right.capacity?.volume || Number.MAX_SAFE_INTEGER;
    return leftVolume - rightVolume;
  });

  const recommendedTruck = sortedTrucks.find(truck => (truck.capacity?.volume || 0) >= totalEstimatedVolume) || sortedTrucks[0] || null;
  const recommendedDriver = recommendedTruck?.assignedDriver
    ? availableDrivers.find(driver => String(driver._id) === String(recommendedTruck.assignedDriver._id))
    : availableDrivers[0] || null;

  const logisticsBlockers = [
    availableDrivers.length === 0 ? 'No active driver is available on the event date.' : '',
    availableTrucks.length === 0 ? 'No truck is available on the event date.' : '',
    totalEstimatedVolume > 0 && !recommendedTruck ? 'No truck can be recommended for the estimated load.' : ''
  ].filter(Boolean);

  const banquetStaffById = new Map(banquetStaffRoster.map(staff => [String(staff._id), staff]));
  const reservedBanquetStaffIds = new Set(
    sameDayContracts
      .flatMap(entry => entry.banquetAssignment?.assignments || [])
      .map(assignment => assignment?.staff)
      .filter(Boolean)
      .map(value => String(value))
  );
  const selectedBanquetSupervisorId = contract.assignedSupervisor ? String(contract.assignedSupervisor) : '';
  const selectedBanquetStaffIds = new Set(
    (contract.banquetAssignment?.assignments || [])
      .map(assignment => assignment?.staff)
      .filter(Boolean)
      .map(value => String(value))
  );
  const planningGuestCount = getEstimatedBanquetGuestCount(contract);
  const savedBanquetPlan = sanitizeBanquetStaffingPlan(contract.banquetAssignment?.staffingPlan);
  const banquetPlan = getBanquetPlanCount(savedBanquetPlan) > 0
    ? savedBanquetPlan
    : getSuggestedBanquetStaffingPlan(planningGuestCount);
  const banquetSuggestedPlan = getSuggestedBanquetStaffingPlan(planningGuestCount);

  const availableBanquetStaff = banquetStaffRoster.filter((staff) => {
    const staffId = String(staff._id);
    return selectedBanquetStaffIds.has(staffId) || !reservedBanquetStaffIds.has(staffId);
  });

  const selectedBanquetAssignments = (contract.banquetAssignment?.assignments || []).map((assignment) => {
    const staffId = String(assignment.staff);
    const staff = banquetStaffById.get(staffId);

    return {
      staffId,
      assignmentRole: assignment.assignmentRole,
      staff: staff
        ? toBanquetStaffSummary(staff, { isRecommended: false })
        : {
            _id: staffId,
            employeeId: '',
            fullName: 'Unlinked banquet staff',
            role: 'other',
            status: 'inactive',
            employmentType: '',
            rating: 0,
            totalEventsWorked: 0,
            isRecommended: false
          }
    };
  });

  const banquetAvailableByRole = BANQUET_ASSIGNMENT_ROLES.reduce((pool, role) => {
    const eligibleRoles = BANQUET_ROLE_ELIGIBILITY[role];
    pool[role] = availableBanquetStaff
      .filter((staff) => eligibleRoles.includes(staff.role))
      .map((staff) => {
        const staffId = String(staff._id);
        const isAssigned = selectedBanquetStaffIds.has(staffId);

        return toBanquetStaffSummary(staff, {
          isAssigned,
          isRecommended: false
        });
      });
    return pool;
  }, {});

  const recommendedAssignedStaffIds = new Set();
  const banquetSuggestedAssignments = BANQUET_ASSIGNMENT_ROLES.flatMap((role) => {
    const targetCount = banquetSuggestedPlan[role] || 0;
    const suggestions = [];

    for (const staff of banquetAvailableByRole[role] || []) {
      if (suggestions.length >= targetCount) {
        break;
      }

      if (recommendedAssignedStaffIds.has(staff._id)) {
        continue;
      }

      recommendedAssignedStaffIds.add(staff._id);
      suggestions.push({
        staffId: staff._id,
        assignmentRole: role,
        staff: {
          ...staff,
          isRecommended: true
        }
      });
    }

    return suggestions;
  });

  const banquetBlockers = [];

  if (!selectedBanquetSupervisorId) {
    banquetBlockers.push('Assign a banquet supervisor so the event is owned on the banquet dashboard.');
  }

  if (banquetSupervisors.length === 0) {
    banquetBlockers.push('No banquet supervisor account is available yet.');
  }

  BANQUET_ASSIGNMENT_ROLES.forEach((role) => {
    const required = banquetPlan[role] || 0;
    const availableCount = (banquetAvailableByRole[role] || []).length;

    if (required > availableCount) {
      banquetBlockers.push(`Only ${availableCount} of ${required} ${BANQUET_ROLE_LABELS[role].toLowerCase()} positions are free on this event date.`);
    }
  });

  return {
    logistics: {
      eventDate: contract.eventDate,
      estimatedVolumeCubicMeters: roundToTwo(totalEstimatedVolume),
      assignmentStatus: contract.logisticsAssignment?.assignmentStatus || 'pending',
      notes: contract.logisticsAssignment?.notes || '',
      assignedDriverId,
      assignedTruckId,
      availableDrivers: availableDrivers.map(driver => ({
        _id: driver._id,
        driverId: driver.driverId,
        fullName: driver.fullName,
        phone: driver.phone,
        status: driver.status
      })),
      availableTrucks: availableTrucks.map(truck => ({
        _id: truck._id,
        truckId: truck.truckId,
        plateNumber: truck.plateNumber,
        truckType: truck.truckType,
        status: truck.status,
        capacityVolume: truck.capacity?.volume || 0,
        assignedDriver: truck.assignedDriver
          ? {
              _id: truck.assignedDriver._id,
              fullName: truck.assignedDriver.fullName,
              driverId: truck.assignedDriver.driverId
            }
          : null
      })),
      recommendedTruck: recommendedTruck
        ? {
            _id: recommendedTruck._id,
            truckId: recommendedTruck.truckId,
            plateNumber: recommendedTruck.plateNumber,
            truckType: recommendedTruck.truckType,
            capacityVolume: recommendedTruck.capacity?.volume || 0
          }
        : null,
      recommendedDriver: recommendedDriver
        ? {
            _id: recommendedDriver._id,
            driverId: recommendedDriver.driverId,
            fullName: recommendedDriver.fullName,
            phone: recommendedDriver.phone
          }
        : null,
      blockers: logisticsBlockers
    },
    banquet: {
      planningGuestCount,
      suggestedPlan: banquetSuggestedPlan,
      savedPlan: savedBanquetPlan,
      activePlan: banquetPlan,
      selectedSupervisorId: selectedBanquetSupervisorId,
      supervisorOptions: banquetSupervisors.map((supervisor) => ({
        _id: String(supervisor._id),
        name: supervisor.name,
        email: supervisor.email
      })),
      availableByRole: banquetAvailableByRole,
      suggestedAssignments: banquetSuggestedAssignments,
      selectedAssignments: selectedBanquetAssignments,
      blockers: banquetBlockers,
      coverage: {
        assigned: selectedBanquetAssignments.length,
        planned: getBanquetPlanCount(banquetPlan),
        percent: getBanquetCoverageProgress(selectedBanquetSupervisorId, banquetPlan, selectedBanquetAssignments)
      },
      updatedAt: contract.banquetAssignment?.updatedAt || null
    },
    inventory: {
      creativeAssets: creativeItems,
      linenRequirements: linenItems,
      equipmentChecklist: stockroomItems,
      allItemsReady: [...creativeItems, ...linenItems, ...stockroomItems].every(item => item.readyForDispatch),
      shortages: [...creativeItems, ...linenItems, ...stockroomItems].filter(item => !item.enoughStock)
    }
  };
};

// Get all contracts (with role-based filtering)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    // Role-based filtering
    switch (req.user.role) {
      case 'sales':
        // Sales sees all contracts they created or all if admin
        break;
      case 'accounting':
        // Accounting sees contracts in review or approved
        query.status = { $in: ['submitted', 'accounting_review', 'approved', 'completed'] };
        break;
      case 'banquet_supervisor':
        // Banquet needs visibility into approved events even before a supervisor is assigned.
        query.$or = [
          { assignedSupervisor: req.user._id },
          { status: { $in: ['approved', 'completed'] } }
        ];
        break;
      case 'kitchen':
        query.status = { $in: ['approved', 'completed'] };
        break;
      case 'purchasing':
      case 'stockroom':
      case 'creative':
      case 'linen':
        query.status = { $in: ['draft', 'pending_client_signature', 'submitted', 'accounting_review', 'approved', 'completed'] };
        break;
      case 'logistics':
        query.status = { $in: ['approved', 'completed'] };
        break;
    }

    const contracts = await Contract.find(query)
      .populate('assignedSupervisor', 'name')
      .sort({ createdAt: -1 });

    res.json(contracts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get dashboard stats
router.get('/stats/dashboard', auth, async (req, res) => {
  try {
    const stats = {
      total: await Contract.countDocuments(),
      draft: await Contract.countDocuments({ status: 'draft' }),
      submitted: await Contract.countDocuments({ status: { $in: ['pending_client_signature', 'submitted'] } }),
      approved: await Contract.countDocuments({ status: 'approved' }),
      completed: await Contract.countDocuments({ status: 'completed' }),
      thisWeek: await Contract.countDocuments({
        eventDate: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      }),
      thisMonth: await Contract.countDocuments({
        eventDate: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      })
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single contract
router.get('/:id', auth, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('assignedSupervisor', 'name email')
      .populate('logisticsAssignment.driver', 'driverId fullName status phone')
      .populate('logisticsAssignment.truck', 'truckId plateNumber truckType status capacity assignedDriver');

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get automated logistics and inventory readiness summary
router.get('/:id/operations-summary', auth, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    const summary = await buildOperationsSummary(contract);
    res.json(summary);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to build automated operations checks for this contract.',
      error: error.message
    });
  }
});

// Create new contract (Sales only)
router.post('/', auth, requireRole(['sales', 'admin']), [
  body('clientName').notEmpty().trim(),
  body('clientType').isIn(['wedding', 'corporate', 'birthday', 'debut', 'anniversary', 'other']),
  body('eventDate').isISO8601(),
  body('venue.name').notEmpty(),
  body('totalPacks').isInt({ min: 1 }),
  body('packageSelected').isIn(['basic', 'standard', 'premium', 'deluxe', 'custom'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const contract = new Contract(req.body);
    const planningValidation = await validateContractPlanning(contract);

    if (planningValidation.issues.length) {
      return res.status(409).json(buildPlanningValidationResponse(planningValidation.issues));
    }

    await contract.save();

    res.status(201).json(contract);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update contract
router.put('/:id', auth, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    // Check permissions based on role, status, and payload scope
    if (req.user.role === 'admin') {
      // Admin can edit across the workflow.
    } else if (req.user.role === 'sales') {
      if (contract.status !== 'draft') {
        return res.status(403).json({ message: 'Cannot modify submitted contract' });
      }
    } else {
      const allowedDraftFields = getAllowedDraftUpdateFieldsForRole(req.user.role);

      if (!allowedDraftFields.length) {
        return res.status(403).json({ message: 'You cannot modify this contract' });
      }

      if (contract.status !== 'draft') {
        return res.status(403).json({ message: 'Inventory validation edits are only available while the contract is still in draft' });
      }

      const disallowedFields = getDisallowedDraftUpdateFields(req.body, allowedDraftFields);
      if (disallowedFields.length > 0) {
        return res.status(403).json({
          message: `You can only update ${allowedDraftFields.join(', ')} on draft contracts for your department.`,
          issues: disallowedFields.map((field) => `Field "${field}" is not editable by ${req.user.role} on draft contracts.`)
        });
      }
    }

    resetSectionConfirmationsForPayload(contract, req.body);
    Object.assign(contract, req.body);

    if (shouldValidatePlanningPayload(req.body)) {
      const planningValidation = await validateContractPlanning(contract);

      if (planningValidation.issues.length) {
        return res.status(409).json(buildPlanningValidationResponse(planningValidation.issues));
      }
    }

    await contract.save();

    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Kitchen menu checklist updates
router.put('/:id/kitchen-menu-item', auth, requireRole(['kitchen', 'admin']), async (req, res) => {
  try {
    const { index, confirmed } = req.body;
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    if (contract.status !== 'approved') {
      return res.status(400).json({ message: 'Kitchen checklist updates are only available on approved contracts' });
    }

    const itemIndex = Number(index);
    if (!Number.isInteger(itemIndex) || itemIndex < 0 || itemIndex >= (contract.menuDetails || []).length) {
      return res.status(400).json({ message: 'Menu checklist item not found' });
    }

    contract.menuDetails[itemIndex].confirmed = Boolean(confirmed);
    await contract.save();

    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Kitchen ingredient preparation status updates
router.put('/:id/kitchen-ingredient-status', auth, requireRole(['kitchen', 'admin']), async (req, res) => {
  try {
    const { status } = req.body;
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    if (contract.status !== 'approved') {
      return res.status(400).json({ message: 'Kitchen preparation updates are only available on approved contracts' });
    }

    if (!['pending', 'procured', 'prepared'].includes(String(status || ''))) {
      return res.status(400).json({ message: 'Invalid ingredient status' });
    }

    if (status === 'prepared' && (contract.menuDetails || []).some((item) => !item.confirmed)) {
      return res.status(400).json({ message: 'Complete the menu checklist before marking kitchen preparation as ready' });
    }

    contract.ingredientStatus = status;
    await contract.save();

    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Confirm or clear a section before client signature
router.put('/:id/section-confirmation', auth, async (req, res) => {
  try {
    const { section, confirmed } = req.body;
    const rule = SECTION_CONFIRMATION_RULES[section];

    if (!rule) {
      return res.status(400).json({ message: 'Invalid contract section' });
    }

    if (!rule.allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You cannot confirm this contract section' });
    }

    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    if (!['draft', 'pending_client_signature'].includes(contract.status)) {
      return res.status(400).json({ message: 'Section confirmations can only be updated before client signature is completed' });
    }

    contract.sectionConfirmations = contract.sectionConfirmations || {};

    if (!confirmed) {
      resetSectionConfirmation(contract, section);
      await contract.save();
      return res.json(contract);
    }

    if (!rule.ready(contract)) {
      return res.status(400).json({ message: rule.missingDataMessage });
    }

    if (section === 'payments') {
      const pendingInventoryConfirmationLabels = getPendingInventoryConfirmationLabels(contract);

      if (pendingInventoryConfirmationLabels.length > 0) {
        return res.status(400).json({
          message: `Confirm ${pendingInventoryConfirmationLabels.join(', ')} first. Inventory changes can still affect the contract total before the payment arrangement is finalized.`
        });
      }
    }

    contract.sectionConfirmations[section] = {
      confirmed: true,
      confirmedAt: new Date(),
      confirmedBy: req.user._id
    };

    await contract.save();
    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send contract for client signature
router.post('/:id/submit', auth, requireRole(['sales', 'admin']), async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    if (contract.status !== 'draft') {
      return res.status(400).json({ message: 'Contract already submitted' });
    }

    const checklist = getFinalizationChecklist(contract);
    if (checklist.issues.length > 0) {
      return res.status(400).json({ message: checklist.issues.join(' ') });
    }

    // Check SLA
    const now = new Date();
    if (now > contract.finalDetailsDeadline) {
      contract.slaWarning = true;
    }

    contract.status = 'pending_client_signature';
    contract.currentDepartment = 'sales';
    contract.departmentProgress.sales = 100;
    
    await contract.save();

    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark contract as signed by client and hand off to accounting
router.post('/:id/client-signature', auth, requireRole(['sales', 'admin']), async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    if (contract.status !== 'pending_client_signature') {
      return res.status(400).json({ message: 'Contract is not waiting for client signature' });
    }

    const checklist = getFinalizationChecklist(contract);
    if (checklist.issues.length > 0) {
      return res.status(400).json({ message: checklist.issues.join(' ') });
    }

    contract.clientSigned = true;
    contract.clientSignedAt = new Date();
    contract.status = 'submitted';
    contract.submittedAt = new Date();
    contract.currentDepartment = 'accounting';

    await contract.save();

    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Save contract e-signature assets
router.put('/:id/signature-assets', auth, requireRole(['sales', 'admin']), async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    if (!['pending_client_signature', 'submitted', 'accounting_review', 'approved'].includes(contract.status)) {
      return res.status(400).json({ message: 'Signature uploads are only available once the contract is in the signing workflow' });
    }

    const { client, staff } = req.body || {};

    if (client === undefined && staff === undefined) {
      return res.status(400).json({ message: 'Add at least one signature to update' });
    }

    if ((client && !isValidSignatureImage(client.imageUrl)) || (staff && !isValidSignatureImage(staff.imageUrl))) {
      return res.status(400).json({ message: 'Signature image must be a valid image upload under 2 MB' });
    }

    contract.signatureAssets = contract.signatureAssets || {};

    if (client !== undefined) {
      contract.signatureAssets.client = {
        signedName: String(client?.signedName || contract.clientName || '').trim(),
        title: String(client?.title || 'Client').trim(),
        imageUrl: client?.imageUrl || '',
        uploadedAt: client?.imageUrl ? new Date() : null,
      };
    }

    if (staff !== undefined) {
      contract.signatureAssets.staff = {
        signedName: String(staff?.signedName || req.user.name || '').trim(),
        title: String(staff?.title || 'Authorized Representative').trim(),
        imageUrl: staff?.imageUrl || '',
        uploadedAt: staff?.imageUrl ? new Date() : null,
      };
    }

    const hasClientSignatureImage = Boolean(contract.signatureAssets.client?.imageUrl);
    const hasStaffSignatureImage = Boolean(contract.signatureAssets.staff?.imageUrl);

    if (!contract.clientSigned && contract.status === 'pending_client_signature' && hasClientSignatureImage && hasStaffSignatureImage) {
      const checklist = getFinalizationChecklist(contract);
      if (checklist.issues.length > 0) {
        return res.status(400).json({ message: checklist.issues.join(' ') });
      }

      contract.clientSigned = true;
      contract.clientSignedAt = new Date();
      contract.status = 'submitted';
      contract.submittedAt = new Date();
      contract.currentDepartment = 'accounting';
    }

    await contract.save();

    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Accounting approval
router.post('/:id/accounting-approve', auth, requireRole(['accounting', 'admin']), async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    if (!contract.clientSigned) {
      return res.status(400).json({ message: 'Client signature is required before accounting review' });
    }

    if (!['submitted', 'accounting_review'].includes(contract.status)) {
      return res.status(400).json({ message: 'Contract is not ready for accounting review' });
    }

    contract.status = 'accounting_review';
    contract.departmentProgress.accounting = 100;
    await contract.save();

    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Final approval
router.post('/:id/approve', auth, requireRole(['accounting', 'admin']), async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    if (!contract.clientSigned) {
      return res.status(400).json({ message: 'Client signature is required before approval' });
    }

    if (!['submitted', 'accounting_review'].includes(contract.status)) {
      return res.status(400).json({ message: 'Contract is not ready for approval' });
    }

    const paymentMilestones = getPaymentMilestones(contract);
    const finalPaymentDueDate = getFinalPaymentDueDate(contract);
    if (!paymentMilestones.downPaymentSatisfied) {
      const fullPaymentRequired = paymentMilestones.downPaymentRate >= 1;
      return res.status(400).json({
        message: fullPaymentRequired
          ? `Full payment (${paymentMilestones.requiredDownPayment.toFixed(2)}) is required before approval for preparation`
          : `At least ${Math.round(paymentMilestones.downPaymentRate * 100)}% payment (${paymentMilestones.requiredDownPayment.toFixed(2)}) or full payment is required before approval for preparation`
      });
    }

    if (!paymentMilestones.fullyPaid && new Date() > endOfDay(finalPaymentDueDate)) {
      return res.status(400).json({
        message: `The remaining balance must be fully settled by ${finalPaymentDueDate.toLocaleDateString('en-PH')} before the event can proceed`
      });
    }

    const procurementApprovalIssues = await getApprovalProcurementIssues(contract);
    if (procurementApprovalIssues.length > 0) {
      return res.status(400).json({
        message: procurementApprovalIssues.length === 1
          ? procurementApprovalIssues[0]
          : `Create the required purchasing or rental requests before approval. ${procurementApprovalIssues[0]}`,
        issues: procurementApprovalIssues
      });
    }

    contract.status = 'approved';
    contract.approvedAt = new Date();
    contract.departmentProgress.accounting = 100;
    await contract.save();

    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/complete', auth, requireRole(['accounting', 'admin']), async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    if (contract.status === 'completed') {
      return res.status(400).json({ message: 'Contract is already closed' });
    }

    if (contract.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved contracts can be closed' });
    }

    const closureChecklist = getContractClosureChecklist(contract);
    if (!closureChecklist.canClose) {
      return res.status(400).json({
        message: closureChecklist.issues[0],
        issues: closureChecklist.issues
      });
    }

    contract.status = 'completed';
    contract.completedAt = new Date();
    contract.currentDepartment = 'all';
    contract.slaWarning = false;
    contract.departmentProgress = {
      sales: 100,
      accounting: 100,
      logistics: 100,
      banquet: 100,
      kitchen: 100,
      purchasing: 100,
      creative: 100,
      linen: 100
    };

    await contract.save();
    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Assign logistics resources to a contract
router.put('/:id/logistics-assignment', auth, requireRole(['logistics', 'admin']), async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    if (contract.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved contracts can update logistics booking' });
    }

    const { driverId, truckId, assignmentStatus, notes } = req.body;
    const eventStart = startOfDay(contract.eventDate);
    const eventEnd = endOfDay(contract.eventDate);
    const eventHasPassed = new Date() > eventEnd;

    if (assignmentStatus === 'completed' && !eventHasPassed) {
      return res.status(400).json({
        message: 'Logistics can only be marked completed during post-event closeout.'
      });
    }

    const conflictFilters = [
      driverId ? { 'logisticsAssignment.driver': driverId } : null,
      truckId ? { 'logisticsAssignment.truck': truckId } : null
    ].filter(Boolean);

    const conflictingContracts = conflictFilters.length
      ? await Contract.find({
          _id: { $ne: contract._id },
          status: { $in: ACTIVE_CONTRACT_STATUSES },
          eventDate: {
            $gte: eventStart,
            $lte: eventEnd
          },
          $or: conflictFilters
        }).select('contractNumber logisticsAssignment')
      : [];

    let driver = null;
    if (driverId) {
      driver = await Driver.findById(driverId);
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      if (driver.status !== 'active') {
        return res.status(400).json({ message: 'Selected driver is not active' });
      }
    }

    let truck = null;
    if (truckId) {
      truck = await Truck.findById(truckId);
      if (!truck) {
        return res.status(404).json({ message: 'Truck not found' });
      }

      if (!['available', 'in_use'].includes(truck.status)) {
        return res.status(400).json({ message: 'Selected truck is not available for dispatch' });
      }
    }

    const driverConflict = driverId && conflictingContracts.find(entry => String(entry.logisticsAssignment?.driver || '') === String(driverId));
    if (driverConflict) {
      return res.status(409).json({
        message: `${driver?.fullName || 'This driver'} is already booked for ${driverConflict.contractNumber} on ${formatDateLabel(contract.eventDate)}. Choose another driver for this event.`
      });
    }

    const truckConflict = truckId && conflictingContracts.find(entry => String(entry.logisticsAssignment?.truck || '') === String(truckId));
    if (truckConflict) {
      return res.status(409).json({
        message: `${truck?.plateNumber ? `Truck ${truck.plateNumber}` : 'This truck'} is already booked for ${truckConflict.contractNumber} on ${formatDateLabel(contract.eventDate)}. Choose another truck for this event.`
      });
    }

    contract.logisticsAssignment = {
      ...(contract.logisticsAssignment ? contract.logisticsAssignment.toObject() : {}),
      driver: driverId || null,
      truck: truckId || null,
      assignmentStatus: assignmentStatus || contract.logisticsAssignment?.assignmentStatus || 'scheduled',
      notes: notes || '',
      checkedAt: new Date(),
      checkedBy: req.user._id
    };

    const logisticsProgressMap = {
      pending: 10,
      scheduled: 50,
      ready_for_dispatch: 80,
      dispatched: 100,
      completed: 100
    };
    contract.departmentProgress.logistics = logisticsProgressMap[contract.logisticsAssignment.assignmentStatus] || 0;

    await contract.save();

    const updatedContract = await Contract.findById(contract._id)
      .populate('logisticsAssignment.driver', 'driverId fullName status phone')
      .populate('logisticsAssignment.truck', 'truckId plateNumber truckType status capacity assignedDriver');

    res.json(updatedContract);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id/banquet-assignment', auth, requireRole(['banquet_supervisor', 'sales', 'admin']), async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    if (!['approved', 'completed'].includes(contract.status)) {
      return res.status(400).json({ message: 'Banquet staffing can only be updated once the contract is approved.' });
    }

    const rawGuestCount = req.body?.serviceGuestCount;
    const serviceGuestCount = rawGuestCount === undefined || rawGuestCount === null || rawGuestCount === ''
      ? getEstimatedBanquetGuestCount(contract)
      : Math.max(0, Math.floor(Number(rawGuestCount) || 0));

    if (!Number.isFinite(serviceGuestCount)) {
      return res.status(400).json({ message: 'Service guest count must be a whole number.' });
    }

    const supervisorId = req.body?.supervisorId ? String(req.body.supervisorId) : '';
    if (supervisorId && !mongoose.isValidObjectId(supervisorId)) {
      return res.status(400).json({ message: 'Invalid banquet supervisor selected.' });
    }

    const staffingPlanInput = sanitizeBanquetStaffingPlan(req.body?.staffingPlan);
    const assignmentsInput = Array.isArray(req.body?.assignments) ? req.body.assignments : [];

    const normalizedAssignments = assignmentsInput.map((assignment) => ({
      staffId: assignment?.staffId ? String(assignment.staffId) : '',
      assignmentRole: assignment?.assignmentRole ? String(assignment.assignmentRole) : ''
    }));

    if (normalizedAssignments.some((assignment) => !assignment.staffId || !mongoose.isValidObjectId(assignment.staffId))) {
      return res.status(400).json({ message: 'Each assigned banquet staff member must be valid.' });
    }

    if (normalizedAssignments.some((assignment) => !BANQUET_ASSIGNMENT_ROLES.includes(assignment.assignmentRole))) {
      return res.status(400).json({ message: 'Banquet assignments include an unsupported role.' });
    }

    const uniqueStaffIds = [...new Set(normalizedAssignments.map((assignment) => assignment.staffId))];
    if (uniqueStaffIds.length !== normalizedAssignments.length) {
      return res.status(400).json({ message: 'A banquet staff member can only be assigned once per event.' });
    }

    const [banquetSupervisors, banquetStaffMembers] = await Promise.all([
      supervisorId ? User.find({ _id: supervisorId, role: 'banquet_supervisor' }) : [],
      uniqueStaffIds.length ? BanquetStaff.find({ _id: { $in: uniqueStaffIds } }) : []
    ]);

    if (supervisorId && banquetSupervisors.length === 0) {
      return res.status(400).json({ message: 'Selected banquet supervisor was not found.' });
    }

    const banquetStaffById = new Map(banquetStaffMembers.map((staff) => [String(staff._id), staff]));

    if (banquetStaffById.size !== uniqueStaffIds.length) {
      return res.status(400).json({ message: 'One or more banquet staff members could not be found.' });
    }

    const invalidRoleAssignment = normalizedAssignments.find((assignment) => {
      const staff = banquetStaffById.get(assignment.staffId);
      const eligibleRoles = BANQUET_ROLE_ELIGIBILITY[assignment.assignmentRole] || [];
      return !staff || !eligibleRoles.includes(staff.role);
    });

    if (invalidRoleAssignment) {
      return res.status(400).json({ message: `Assigned staff does not match the ${BANQUET_ROLE_LABELS[invalidRoleAssignment.assignmentRole]} role.` });
    }

    const eventStart = startOfDay(contract.eventDate);
    const eventEnd = endOfDay(contract.eventDate);
    const conflictingContracts = uniqueStaffIds.length
      ? await Contract.find({
          _id: { $ne: contract._id },
          status: { $in: ACTIVE_CONTRACT_STATUSES },
          eventDate: {
            $gte: eventStart,
            $lte: eventEnd
          },
          'banquetAssignment.assignments.staff': { $in: uniqueStaffIds }
        }).select('contractNumber banquetAssignment.assignments')
      : [];

    const conflictingStaffIds = new Set();
    conflictingContracts.forEach((conflict) => {
      (conflict.banquetAssignment?.assignments || []).forEach((assignment) => {
        const staffId = assignment?.staff ? String(assignment.staff) : '';
        if (uniqueStaffIds.includes(staffId)) {
          conflictingStaffIds.add(staffId);
        }
      });
    });

    if (conflictingStaffIds.size > 0) {
      const conflictingNames = [...conflictingStaffIds]
        .map((staffId) => banquetStaffById.get(staffId)?.fullName)
        .filter(Boolean);
      return res.status(400).json({
        message: `These banquet staff members are already booked on ${eventStart.toLocaleDateString()}: ${conflictingNames.join(', ')}.`
      });
    }

    const assignmentCounts = normalizedAssignments.reduce((counts, assignment) => {
      counts[assignment.assignmentRole] = (counts[assignment.assignmentRole] || 0) + 1;
      return counts;
    }, {});

    const normalizedPlan = BANQUET_ASSIGNMENT_ROLES.reduce((plan, role) => {
      plan[role] = Math.max(staffingPlanInput[role] || 0, assignmentCounts[role] || 0);
      return plan;
    }, createEmptyBanquetStaffingPlan());

    contract.assignedSupervisor = supervisorId || null;
    contract.banquetAssignment = {
      serviceGuestCount,
      staffingPlan: normalizedPlan,
      assignments: normalizedAssignments.map((assignment) => ({
        staff: assignment.staffId,
        assignmentRole: assignment.assignmentRole
      })),
      updatedAt: new Date(),
      updatedBy: req.user._id
    };
    contract.estimatedWaiters = normalizedPlan.service_staff || 0;
    contract.departmentProgress = {
      ...contract.departmentProgress,
      banquet: getBanquetCoverageProgress(supervisorId, normalizedPlan, normalizedAssignments)
    };

    await contract.save();

    const updatedContract = await Contract.findById(contract._id)
      .populate('assignedSupervisor', 'name email');

    res.json(updatedContract);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update inventory checklist status per department
router.put('/:id/inventory-item-status', auth, async (req, res) => {
  try {
    const { section, index, status } = req.body;
    const sectionRules = INVENTORY_STATUS_RULES[section];

    if (!sectionRules) {
      return res.status(400).json({ message: 'Invalid checklist section' });
    }

    if (!sectionRules.allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }

    if (!sectionRules.allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid checklist status' });
    }

    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    if (contract.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved contracts can update checklist statuses' });
    }

    const itemIndex = Number(index);
    const items = contract[section] || [];
    if (Number.isNaN(itemIndex) || itemIndex < 0 || itemIndex >= items.length) {
      return res.status(400).json({ message: 'Checklist item not found' });
    }

    const nextStatus = normalizeChecklistStatus(status);
    items[itemIndex].status = nextStatus;
    contract.departmentProgress[sectionRules.progressKey] = calculateProgressFromItems(items, sectionRules.readyStatuses);

    if (section === 'linenRequirements') {
      contract.linenStatus = getAggregateChecklistStatus(items);
    }

    await contract.save();

    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id/inventory-post-event-status', auth, async (req, res) => {
  try {
    const { section, index, status, notes } = req.body;
    const sectionRules = INVENTORY_STATUS_RULES[section];

    if (!sectionRules) {
      return res.status(400).json({ message: 'Invalid checklist section' });
    }

    if (!sectionRules.allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }

    if (!sectionRules.postEventAllowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid post-event checklist status' });
    }

    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    if (!contract.eventDate || new Date() <= endOfDay(contract.eventDate)) {
      return res.status(400).json({ message: 'Post-event checks are available only after the event date has passed' });
    }

    const itemIndex = Number(index);
    const items = contract[section] || [];
    if (Number.isNaN(itemIndex) || itemIndex < 0 || itemIndex >= items.length) {
      return res.status(400).json({ message: 'Checklist item not found' });
    }

    items[itemIndex].postEventStatus = status;
    if (notes !== undefined) {
      items[itemIndex].postEventNotes = String(notes || '').trim();
    }

    await contract.save();
    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/inventory-incident', auth, async (req, res) => {
  try {
    const { section, index, incidentType, severity, description, affectedQuantity, attachments } = req.body || {};
    const sectionRules = INVENTORY_STATUS_RULES[section];

    if (!sectionRules) {
      return res.status(400).json({ message: 'Invalid checklist section' });
    }

    if (!sectionRules.allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }

    if (![
      'burnt_cloth', 'damaged_equipment', 'missing_item', 'food_spoilage',
      'vehicle_breakdown', 'staff_issue', 'client_complaint', 'other'
    ].includes(incidentType)) {
      return res.status(400).json({ message: 'Invalid incident type' });
    }

    if (!['low', 'medium', 'high', 'critical'].includes(severity)) {
      return res.status(400).json({ message: 'Invalid severity level' });
    }

    if (!String(description || '').trim()) {
      return res.status(400).json({ message: 'Incident description is required' });
    }

    let parsedAffectedQuantity;
    if (affectedQuantity !== undefined && affectedQuantity !== null && affectedQuantity !== '') {
      parsedAffectedQuantity = Number(affectedQuantity);
      if (!Number.isInteger(parsedAffectedQuantity) || parsedAffectedQuantity <= 0) {
        return res.status(400).json({ message: 'Affected quantity must be a whole number greater than 0' });
      }
    }

    const normalizedAttachments = Array.isArray(attachments)
      ? attachments
        .filter((value) => typeof value === 'string' && value.trim())
        .map((value) => value.trim())
      : [];

    if (normalizedAttachments.some((value) => value.length > MAX_INCIDENT_ATTACHMENT_LENGTH)) {
      return res.status(400).json({ message: 'Damage reference image is too large' });
    }

    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    if (!contract.eventDate || new Date() <= endOfDay(contract.eventDate)) {
      return res.status(400).json({ message: 'Incident reporting from inventory is available only after the event date has passed' });
    }

    const itemIndex = Number(index);
    const items = contract[section] || [];
    if (Number.isNaN(itemIndex) || itemIndex < 0 || itemIndex >= items.length) {
      return res.status(400).json({ message: 'Checklist item not found' });
    }

    const item = items[itemIndex];
    const itemName = item.item || item.type || 'Inventory item';

    const incident = new Incident({
      contract: contract._id,
      department: sectionRules.incidentDepartment || 'all',
      incidentType,
      description: String(description).trim(),
      ...(parsedAffectedQuantity ? { affectedQuantity: parsedAffectedQuantity } : {}),
      eventDate: contract.eventDate,
      severity,
      sourceSection: section,
      inventoryItemName: itemName,
      inventoryItemCode: item.itemCode || '',
      reportedBy: req.user._id,
      attachments: normalizedAttachments,
    });

    await incident.save();

    item.postEventStatus = 'incident_reported';
    item.postEventNotes = parsedAffectedQuantity
      ? `${parsedAffectedQuantity} item(s) affected. ${String(description).trim()}`
      : String(description).trim();
    await contract.save();

    await incident.populate('contract', 'contractNumber clientName');
    await incident.populate('reportedBy', 'name');

    res.status(201).json(incident);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add payment
router.post('/:id/payment', auth, requireRole(['accounting', 'admin']), [
  body('amount').isFloat({ gt: 0 }),
  body('method').isIn(PAYMENT_METHODS),
  body('receiptNumber').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const contract = await Contract.findById(req.params.id);
    
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    if (!contract.clientSigned) {
      return res.status(400).json({ message: 'Payments can only be posted after the client has signed the contract' });
    }

    contract.payments.push({
      ...req.body,
      receiptIssuedBy: 'Juan Carlos',
      receiptGeneratedAt: new Date(),
      status: req.body.status || 'completed'
    });
    
    const paymentMilestones = getPaymentMilestones(contract);

    if (paymentMilestones.fullyPaid) {
      contract.paymentStatus = 'paid';
    } else if (paymentMilestones.totalPaid > 0) {
      contract.paymentStatus = 'partially_paid';
    } else {
      contract.paymentStatus = 'unpaid';
    }
    
    await contract.save();
    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update department progress
router.post('/:id/progress/:department', auth, async (req, res) => {
  try {
    const { progress } = req.body;
    const { department } = req.params;
    
    const contract = await Contract.findById(req.params.id);
    
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    contract.departmentProgress[department] = progress;
    await contract.save();

    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete contract
router.delete('/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    await MenuTasting.updateMany({
      $or: [
        { contract: contract._id },
        ...(contract.menuTasting ? [{ _id: contract.menuTasting }] : [])
      ]
    }, {
      $set: {
        contract: null,
        contractCreated: false
      }
    });

    await Contract.findByIdAndDelete(req.params.id);
    res.json({ message: 'Contract deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
