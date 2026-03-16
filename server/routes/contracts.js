const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Contract = require('../models/Contract');
const Notification = require('../models/Notification');
const CreativeInventory = require('../models/CreativeInventory');
const LinenInventory = require('../models/LinenInventory');
const StockroomInventory = require('../models/StockroomInventory');
const { Driver, Truck } = require('../models/Logistics');
const { auth, requireRole } = require('../middleware/auth');

const ACTIVE_CONTRACT_STATUSES = ['draft', 'pending_client_signature', 'submitted', 'accounting_review', 'approved'];
const REQUIRED_DOWN_PAYMENT_RATE = 0.6;
const PAYMENT_METHODS = ['cash', 'check', 'bank_transfer', 'credit_card', 'gcash', 'ewallet'];
const SIMPLE_CHECKLIST_STATUSES = ['pending', 'prepared', 'returned'];
const MAX_SIGNATURE_IMAGE_LENGTH = 2_000_000;
const LEGACY_CHECKLIST_STATUS_MAP = {
  staged: 'prepared',
  setup: 'prepared',
  loaded: 'prepared',
  dispatched: 'prepared'
};
const INVENTORY_STATUS_RULES = {
  creativeAssets: {
    allowedRoles: ['creative', 'admin'],
    allowedStatuses: SIMPLE_CHECKLIST_STATUSES,
    progressKey: 'creative',
    readyStatuses: ['prepared', 'returned']
  },
  linenRequirements: {
    allowedRoles: ['linen', 'admin'],
    allowedStatuses: SIMPLE_CHECKLIST_STATUSES,
    progressKey: 'linen',
    readyStatuses: ['prepared', 'returned']
  },
  equipmentChecklist: {
    allowedRoles: ['logistics', 'admin'],
    allowedStatuses: SIMPLE_CHECKLIST_STATUSES,
    progressKey: 'logistics',
    readyStatuses: ['prepared', 'returned']
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
    allowedRoles: ['logistics', 'admin'],
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

const normalizeChecklistStatus = (value) => {
  if (value === undefined || value === null || value === '') {
    return 'pending';
  }

  if (SIMPLE_CHECKLIST_STATUSES.includes(value)) {
    return value;
  }

  return LEGACY_CHECKLIST_STATUS_MAP[value] || value;
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

  if (normalizedStatuses.every(status => status === 'returned')) {
    return 'returned';
  }

  if (normalizedStatuses.every(status => ['prepared', 'returned'].includes(status))) {
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
    resetSectionConfirmation(contract, 'logistics');
  }

  if ('linenRequirements' in payload) {
    resetSectionConfirmation(contract, 'linen');
  }

  if ('equipmentChecklist' in payload) {
    resetSectionConfirmation(contract, 'stockroom');
    resetSectionConfirmation(contract, 'logistics');
  }
};

const getRequiredConfirmationKeys = (contract) => {
  return Object.entries(SECTION_CONFIRMATION_RULES)
    .filter(([, rule]) => rule.required(contract))
    .map(([key]) => key);
};

const getFinalizationChecklist = (contract) => {
  const sectionConfirmations = contract.sectionConfirmations || {};
  const issues = [];
  const detailsRule = SECTION_CONFIRMATION_RULES.details;
  const menuRule = SECTION_CONFIRMATION_RULES.menu;
  const paymentsRule = SECTION_CONFIRMATION_RULES.payments;

  if (!detailsRule.ready(contract)) {
    issues.push('Complete the contract details before sending the contract for signature.');
  }

  if (!menuRule.ready(contract)) {
    issues.push(menuRule.missingDataMessage);
  }

  if (!paymentsRule.ready(contract)) {
    issues.push(paymentsRule.missingDataMessage);
  }

  if (!sectionConfirmations.payments?.confirmed) {
    issues.push('Confirm the payment arrangement before sending the contract for signature.');
  }

  return {
    requiredSections: ['payments'],
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

  const creativePending = (contract.creativeAssets || []).filter(item => item.status !== 'returned');
  if (creativePending.length) {
    issues.push(`Creative returns are still pending for ${creativePending.length} item(s).`);
  }

  const linenPending = (contract.linenRequirements || []).filter(item => item.status !== 'returned');
  if (linenPending.length) {
    issues.push(`Linen returns are still pending for ${linenPending.length} item(s).`);
  }

  const stockroomPending = (contract.equipmentChecklist || []).filter(item => item.status !== 'returned');
  if (stockroomPending.length) {
    issues.push(`Stockroom returns are still pending for ${stockroomPending.length} item(s).`);
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
  }).select('creativeAssets linenRequirements equipmentChecklist logisticsAssignment eventDate contractNumber');

  const creativeReservations = buildReservationMap(sameDayContracts, 'creativeAssets');
  const linenReservations = buildReservationMap(sameDayContracts, 'linenRequirements');
  const stockroomReservations = buildReservationMap(sameDayContracts, 'equipmentChecklist');

  const creativeIds = filterValidObjectIds((contract.creativeAssets || []).map(item => item.itemId));
  const linenIds = filterValidObjectIds((contract.linenRequirements || []).map(item => item.itemId));
  const stockroomIds = filterValidObjectIds((contract.equipmentChecklist || []).map(item => item.itemId));

  const [creativeInventory, linenInventory, stockroomInventory, activeDrivers, activeTrucks] = await Promise.all([
    creativeIds.length ? CreativeInventory.find({ _id: { $in: creativeIds } }) : [],
    linenIds.length ? LinenInventory.find({ _id: { $in: linenIds } }) : [],
    stockroomIds.length ? StockroomInventory.find({ _id: { $in: stockroomIds } }) : [],
    Driver.find({ status: 'active' }).sort({ fullName: 1 }),
    Truck.find({ status: { $in: ['available', 'in_use'] } })
      .populate('assignedDriver', 'driverId fullName status phone')
      .sort({ plateNumber: 1 })
  ]);

  const creativeById = new Map(creativeInventory.map(item => [String(item._id), item]));
  const creativeByCode = new Map(creativeInventory.map(item => [item.itemCode, item]));
  const linenById = new Map(linenInventory.map(item => [String(item._id), item]));
  const linenByCode = new Map(linenInventory.map(item => [item.itemCode, item]));
  const stockroomById = new Map(stockroomInventory.map(item => [String(item._id), item]));
  const stockroomByCode = new Map(stockroomInventory.map(item => [item.itemCode, item]));

  let totalEstimatedVolume = 0;

  const creativeItems = (contract.creativeAssets || []).map(item => {
    const inventoryItem = creativeById.get(String(item.itemId || '')) || creativeByCode.get(item.itemCode);
    const lookupKey = normalizeKey(item.itemId, item.itemCode, item.item);
    const reservedOnDate = creativeReservations.get(lookupKey) || 0;
    const effectiveAvailable = Math.max(0, (inventoryItem?.availableQuantity || 0) - reservedOnDate);
    const requiredQuantity = Number(item.quantity) || 0;
    const enoughStock = inventoryItem ? effectiveAvailable >= requiredQuantity : false;
    const estimatedVolume = roundToTwo((computeDimensionsVolume(inventoryItem?.dimensions) || 0) * requiredQuantity);
    const normalizedStatus = normalizeChecklistStatus(item.status);
    totalEstimatedVolume += estimatedVolume;

    return {
      itemId: item.itemId || null,
      itemName: item.item,
      itemCode: item.itemCode || inventoryItem?.itemCode || '',
      category: item.category || inventoryItem?.category || '',
      requestedQuantity: requiredQuantity,
      availableQuantity: inventoryItem ? effectiveAvailable : null,
      reservedOnDate,
      inventoryStatus: inventoryItem?.status || 'not_linked',
      itemStatus: normalizedStatus,
      enoughStock,
      readyForDispatch: enoughStock && INVENTORY_STATUS_RULES.creativeAssets.readyStatuses.includes(normalizedStatus),
      imageUrl: item.imageUrl || inventoryItem?.images?.find(image => image.isPrimary)?.url || inventoryItem?.images?.[0]?.url || '',
      notes: item.notes || '',
      blockers: [
        !inventoryItem ? 'Item is not linked to creative inventory.' : '',
        inventoryItem && inventoryItem.status !== 'available' ? `Inventory status is ${inventoryItem.status}.` : '',
        inventoryItem && effectiveAvailable < requiredQuantity ? `Needs ${requiredQuantity - effectiveAvailable} more item(s) for this event date.` : ''
      ].filter(Boolean)
    };
  });

  const linenItems = (contract.linenRequirements || []).map(item => {
    const inventoryItem = linenById.get(String(item.itemId || '')) || linenByCode.get(item.itemCode);
    const lookupKey = normalizeKey(item.itemId, item.itemCode, item.type);
    const reservedOnDate = linenReservations.get(lookupKey) || 0;
    const effectiveAvailable = Math.max(0, (inventoryItem?.availableQuantity || 0) - reservedOnDate);
    const requiredQuantity = Number(item.quantity) || 0;
    const enoughStock = inventoryItem ? effectiveAvailable >= requiredQuantity : false;
    const normalizedStatus = normalizeChecklistStatus(item.status);

    return {
      itemId: item.itemId || null,
      itemName: item.type,
      itemCode: item.itemCode || inventoryItem?.itemCode || '',
      category: item.category || inventoryItem?.category || '',
      requestedQuantity: requiredQuantity,
      availableQuantity: inventoryItem ? effectiveAvailable : null,
      reservedOnDate,
      inventoryStatus: inventoryItem?.status || 'not_linked',
      itemStatus: normalizedStatus,
      enoughStock,
      readyForDispatch: enoughStock && INVENTORY_STATUS_RULES.linenRequirements.readyStatuses.includes(normalizedStatus),
      imageUrl: item.imageUrl || inventoryItem?.images?.find(image => image.isPrimary)?.url || inventoryItem?.images?.[0]?.url || '',
      notes: item.notes || '',
      blockers: [
        !inventoryItem ? 'Item is not linked to linen inventory.' : '',
        inventoryItem && inventoryItem.status !== 'available' ? `Inventory status is ${inventoryItem.status}.` : '',
        inventoryItem && effectiveAvailable < requiredQuantity ? `Needs ${requiredQuantity - effectiveAvailable} more item(s) for this event date.` : ''
      ].filter(Boolean)
    };
  });

  const stockroomItems = (contract.equipmentChecklist || []).map(item => {
    const inventoryItem = stockroomById.get(String(item.itemId || '')) || stockroomByCode.get(item.itemCode);
    const lookupKey = normalizeKey(item.itemId, item.itemCode, item.item);
    const reservedOnDate = stockroomReservations.get(lookupKey) || 0;
    const effectiveAvailable = Math.max(0, (inventoryItem?.availableQuantity || 0) - reservedOnDate);
    const requiredQuantity = Number(item.quantity) || 0;
    const enoughStock = inventoryItem ? effectiveAvailable >= requiredQuantity : false;
    const estimatedVolume = roundToTwo((computeDimensionsVolume(inventoryItem?.dimensions) || 0) * requiredQuantity);
    const normalizedStatus = normalizeChecklistStatus(item.status);
    totalEstimatedVolume += estimatedVolume;

    return {
      itemId: item.itemId || null,
      itemName: item.item,
      itemCode: item.itemCode || inventoryItem?.itemCode || '',
      category: item.category || inventoryItem?.category || '',
      requestedQuantity: requiredQuantity,
      availableQuantity: inventoryItem ? effectiveAvailable : null,
      reservedOnDate,
      inventoryStatus: inventoryItem?.status || 'not_linked',
      itemStatus: normalizedStatus,
      enoughStock,
      readyForDispatch: enoughStock && INVENTORY_STATUS_RULES.equipmentChecklist.readyStatuses.includes(normalizedStatus),
      imageUrl: item.imageUrl || inventoryItem?.images?.find(image => image.isPrimary)?.url || inventoryItem?.images?.[0]?.url || '',
      notes: item.notes || '',
      blockers: [
        !inventoryItem ? 'Item is not linked to stockroom inventory.' : '',
        inventoryItem && inventoryItem.status !== 'available' ? `Inventory status is ${inventoryItem.status}.` : '',
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
        // Banquet supervisors only see assigned contracts
        query.assignedSupervisor = req.user._id;
        break;
      case 'kitchen':
      case 'purchasing':
        query.status = { $in: ['approved', 'completed'] };
        break;
      case 'logistics':
      case 'creative':
      case 'linen':
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
    res.status(500).json({ message: 'Server error', error: error.message });
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

    // Check permissions based on role and status
    if (req.user.role === 'sales' && contract.status !== 'draft') {
      return res.status(403).json({ message: 'Cannot modify submitted contract' });
    }

    resetSectionConfirmationsForPayload(contract, req.body);
    Object.assign(contract, req.body);
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

    if (driverId) {
      const driver = await Driver.findById(driverId);
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      if (driver.status !== 'active') {
        return res.status(400).json({ message: 'Selected driver is not active' });
      }
    }

    if (truckId) {
      const truck = await Truck.findById(truckId);
      if (!truck) {
        return res.status(404).json({ message: 'Truck not found' });
      }

      if (!['available', 'in_use'].includes(truck.status)) {
        return res.status(400).json({ message: 'Selected truck is not available for dispatch' });
      }
    }

    const driverConflict = driverId && conflictingContracts.find(entry => String(entry.logisticsAssignment?.driver || '') === String(driverId));
    if (driverConflict) {
      return res.status(400).json({ message: `Driver is already assigned to ${driverConflict.contractNumber} on this event date` });
    }

    const truckConflict = truckId && conflictingContracts.find(entry => String(entry.logisticsAssignment?.truck || '') === String(truckId));
    if (truckConflict) {
      return res.status(400).json({ message: `Truck is already assigned to ${truckConflict.contractNumber} on this event date` });
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

    items[itemIndex].status = normalizeChecklistStatus(status);
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
router.delete('/:id', auth, requireRole(['sales', 'admin']), async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    await Contract.findByIdAndDelete(req.params.id);
    res.json({ message: 'Contract deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
