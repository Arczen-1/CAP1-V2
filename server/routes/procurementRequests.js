const express = require('express');
const mongoose = require('mongoose');
const ProcurementRequest = require('../models/ProcurementRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Contract = require('../models/Contract');
const CreativeInventory = require('../models/CreativeInventory');
const LinenInventory = require('../models/LinenInventory');
const StockroomInventory = require('../models/StockroomInventory');
const Supplier = require('../models/Supplier');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

const DEPARTMENT_CONFIG = {
  creative: {
    label: 'Creative',
    inventoryModel: 'CreativeInventory',
    model: CreativeInventory,
    ownerRoles: ['creative']
  },
  linen: {
    label: 'Linen',
    inventoryModel: 'LinenInventory',
    model: LinenInventory,
    ownerRoles: ['linen']
  },
  stockroom: {
    label: 'Stockroom',
    inventoryModel: 'StockroomInventory',
    model: StockroomInventory,
    ownerRoles: ['logistics', 'stockroom']
  }
};

const ROLE_DEPARTMENT_MAP = {
  creative: 'creative',
  linen: 'linen',
  logistics: 'stockroom',
  stockroom: 'stockroom'
};

const CREATE_ACCESS_ROLES = ['creative', 'linen', 'logistics', 'stockroom', 'sales', 'purchasing', 'admin'];

const populateProcurementRequest = (query) => query
  .populate('contract', 'contractNumber clientName eventDate venue')
  .populate('createdBy', 'name role department')
  .populate('updatedBy', 'name role department')
  .populate('quote.supplier', 'name contactPerson phone email address city province serviceAreas departments requestTypes supportedCategories supportedKeywords isPreferred priority notes isActive')
  .populate('quote.submittedBy', 'name role department')
  .populate('accounting.reviewedBy', 'name role department')
  .populate('fulfillment.fulfilledBy', 'name role department')
  .populate('inventoryItem');

const isValidDate = (value) => value && !Number.isNaN(new Date(value).getTime());

const appendNote = (existingValue, nextLine) => {
  const cleanedExisting = String(existingValue || '').trim();
  const cleanedNext = String(nextLine || '').trim();

  if (!cleanedNext) {
    return cleanedExisting;
  }

  return cleanedExisting ? `${cleanedExisting}\n${cleanedNext}` : cleanedNext;
};

const formatDateLabel = (value) => (
  new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value))
);

const notifyRoles = async (roles, payload) => {
  const recipients = await User.find({
    role: { $in: roles },
    isActive: true
  }).select('_id');

  if (!recipients.length) {
    return;
  }

  await Notification.insertMany(recipients.map((recipient) => ({
    ...payload,
    recipient: recipient._id
  })));
};

const notifyUserIds = async (userIds, payload) => {
  const uniqueIds = [...new Set(
    (userIds || [])
      .filter(Boolean)
      .map((value) => String(value))
      .filter((value) => mongoose.isValidObjectId(value))
  )];

  if (!uniqueIds.length) {
    return;
  }

  await Notification.insertMany(uniqueIds.map((recipient) => ({
    ...payload,
    recipient
  })));
};

const normalizeDepartmentFromRole = (role) => ROLE_DEPARTMENT_MAP[role] || null;

const getDepartmentConfig = (department) => DEPARTMENT_CONFIG[department];

const parseQuantity = (value, fallback = null) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsedValue = Number(value);
  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
};

const normalizeReviewChecklist = (value = {}) => ({
  inventoryNeedValidated: Boolean(value.inventoryNeedValidated),
  supplierVerified: Boolean(value.supplierVerified),
  pricingReviewed: Boolean(value.pricingReviewed),
  timelineConfirmed: Boolean(value.timelineConfirmed)
});

const normalizeAttachmentList = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry) => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter((entry) => entry.startsWith('data:image/') || entry.startsWith('data:application/pdf'))
    .slice(0, 1);
};

const getScopedRequestQuery = (req) => {
  const query = {};
  const requestedDepartment = String(req.query.department || '').trim();
  const userRole = req.user.role;

  if (requestedDepartment && DEPARTMENT_CONFIG[requestedDepartment]) {
    query.department = requestedDepartment;
  }

  if (req.query.status) {
    const statuses = String(req.query.status)
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    if (statuses.length) {
      query.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
    }
  }

  if (req.query.requestType) {
    query.requestType = req.query.requestType;
  }

  if (req.query.contractId && mongoose.isValidObjectId(req.query.contractId)) {
    query.contract = req.query.contractId;
  }

  if (['admin', 'purchasing', 'accounting'].includes(userRole)) {
    return query;
  }

  const scopedDepartment = normalizeDepartmentFromRole(userRole);
  if (scopedDepartment) {
    query.department = scopedDepartment;
    return query;
  }

  if (userRole === 'sales') {
    query.$or = [
      { createdBy: req.user._id },
      { contract: { $ne: null } }
    ];
    return query;
  }

  query.createdBy = req.user._id;
  return query;
};

const applyInventoryUpdate = async (request, inventoryItem, receivedQuantity) => {
  const previousQuantity = Number(inventoryItem.quantity) || 0;
  const previousAvailableQuantity = Number(inventoryItem.availableQuantity) || 0;
  const supplierName = request.quote?.supplierName || '';
  const unitPrice = Number(request.quote?.quotedUnitPrice) || 0;
  const totalCost = Number(request.quote?.quotedTotal) || 0;
  const note = request.requestType === 'rental'
    ? `Rental fulfilled via ${request.requestNumber}${request.fulfillment?.rentalEndDate ? `, return due ${formatDateLabel(request.fulfillment.rentalEndDate)}` : ''}.`
    : `Purchased via ${request.requestNumber}.`;

  if (request.department === 'stockroom') {
    inventoryItem.quantity = previousQuantity + receivedQuantity;
    if (request.requestType === 'purchase' && unitPrice > 0) {
      inventoryItem.purchasePrice = unitPrice;
      inventoryItem.purchaseDate = new Date();
    }
    if (request.requestType === 'rental' && unitPrice > 0) {
      inventoryItem.rentalPricePerDay = unitPrice;
    }
    inventoryItem.supplier = {
      ...(inventoryItem.supplier || {}),
      ...(supplierName ? { name: supplierName } : {})
    };
    inventoryItem.notes = appendNote(inventoryItem.notes, note);
    inventoryItem.updateAvailable();
    await inventoryItem.save();
  } else if (request.department === 'creative') {
    inventoryItem.quantity = previousQuantity + receivedQuantity;
    inventoryItem.availableQuantity = previousAvailableQuantity + receivedQuantity;
    inventoryItem.acquisition = {
      ...(inventoryItem.acquisition || {}),
      type: request.requestType === 'rental' ? 'rented' : (inventoryItem.acquisition?.type || 'purchased'),
      date: new Date(),
      cost: totalCost || inventoryItem.acquisition?.cost,
      supplier: supplierName || inventoryItem.acquisition?.supplier
    };
    inventoryItem.notes = appendNote(inventoryItem.notes, note);
    await inventoryItem.save();
  } else if (request.department === 'linen') {
    inventoryItem.quantity = previousQuantity + receivedQuantity;
    inventoryItem.availableQuantity = previousAvailableQuantity + receivedQuantity;
    inventoryItem.acquisition = {
      ...(inventoryItem.acquisition || {}),
      date: new Date(),
      cost: totalCost || inventoryItem.acquisition?.cost,
      supplier: supplierName || inventoryItem.acquisition?.supplier
    };
    inventoryItem.notes = appendNote(inventoryItem.notes, note);
    await inventoryItem.save();
  }

  return {
    previousQuantity,
    previousAvailableQuantity,
    newQuantity: Number(inventoryItem.quantity) || 0,
    newAvailableQuantity: Number(inventoryItem.availableQuantity) || 0
  };
};

router.get('/', auth, async (req, res) => {
  try {
    const query = getScopedRequestQuery(req);
    const requests = await populateProcurementRequest(
      ProcurementRequest.find(query).sort({ neededBy: 1, createdAt: -1 })
    );

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const request = await populateProcurementRequest(
      ProcurementRequest.findById(req.params.id)
    );

    if (!request) {
      return res.status(404).json({ message: 'Procurement request not found' });
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    if (!CREATE_ACCESS_ROLES.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }

    const {
      department,
      requestType,
      source,
      sourceSection,
      contractId,
      inventoryItemId,
      itemName,
      itemCode,
      itemCategory,
      requestedQuantity,
      shortageQuantity,
      neededBy,
      requestReason,
      requestNotes
    } = req.body || {};

    const departmentConfig = getDepartmentConfig(String(department || '').trim());
    if (!departmentConfig) {
      return res.status(400).json({ message: 'Invalid procurement department' });
    }

    const scopedDepartment = normalizeDepartmentFromRole(req.user.role);
    if (scopedDepartment && scopedDepartment !== department && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only create requests for your department inventory' });
    }

    if (!['purchase', 'rental'].includes(requestType)) {
      return res.status(400).json({ message: 'Request type must be purchase or rental' });
    }

    if (!isValidDate(neededBy)) {
      return res.status(400).json({ message: 'Needed-by date is required' });
    }

    const normalizedRequestedQuantity = parseQuantity(requestedQuantity);
    if (!normalizedRequestedQuantity) {
      return res.status(400).json({ message: 'Requested quantity must be a whole number greater than 0' });
    }

    const normalizedShortageQuantity = parseQuantity(shortageQuantity, 0);
    if (!String(requestReason || '').trim()) {
      return res.status(400).json({ message: 'Request reason is required' });
    }

    let contract = null;
    if (contractId) {
      if (!mongoose.isValidObjectId(contractId)) {
        return res.status(400).json({ message: 'Invalid contract selected' });
      }

      contract = await Contract.findById(contractId).select('contractNumber clientName eventDate');
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }
    }

    let inventoryItem = null;
    if (inventoryItemId) {
      if (!mongoose.isValidObjectId(inventoryItemId)) {
        return res.status(400).json({ message: 'Invalid inventory item selected' });
      }

      inventoryItem = await departmentConfig.model.findById(inventoryItemId);
      if (!inventoryItem) {
        return res.status(404).json({ message: 'Inventory item not found' });
      }
    }

    const resolvedItemName = String(inventoryItem?.name || itemName || '').trim();
    if (!resolvedItemName) {
      return res.status(400).json({ message: 'Item name is required' });
    }

    const request = new ProcurementRequest({
      department,
      requestType,
      source: ['contract_shortage', 'inventory_low_stock', 'manual'].includes(source) ? source : 'manual',
      sourceSection: String(sourceSection || '').trim(),
      contract: contract?._id || null,
      eventDate: contract?.eventDate || null,
      neededBy: new Date(neededBy),
      inventoryModel: departmentConfig.inventoryModel,
      inventoryItem: inventoryItem?._id || null,
      itemName: resolvedItemName,
      itemCode: String(inventoryItem?.itemCode || itemCode || '').trim(),
      itemCategory: String(inventoryItem?.category || itemCategory || '').trim(),
      requestedQuantity: normalizedRequestedQuantity,
      shortageQuantity: normalizedShortageQuantity || normalizedRequestedQuantity,
      requestReason: String(requestReason).trim(),
      requestNotes: String(requestNotes || '').trim(),
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    await request.save();

    await notifyRoles(['purchasing', 'admin'], {
      type: 'task_assigned',
      title: `New ${departmentConfig.label} procurement request`,
      message: `${request.requestNumber} needs ${request.requestedQuantity} ${request.itemName} by ${formatDateLabel(request.neededBy)}.`,
      contract: request.contract || undefined,
      priority: request.source === 'contract_shortage' ? 'high' : 'medium'
    });

    const populatedRequest = await populateProcurementRequest(
      ProcurementRequest.findById(request._id)
    );

    res.status(201).json(populatedRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id/quote', auth, requireRole(['purchasing', 'admin']), async (req, res) => {
  try {
    const request = await ProcurementRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Procurement request not found' });
    }

    if (['approved', 'fulfilled', 'cancelled'].includes(request.status)) {
      return res.status(400).json({ message: 'This procurement request can no longer be quoted' });
    }

    const {
      supplierId,
      supplierName,
      supplierContact,
      supplierEmail,
      quotedUnitPrice,
      expectedFulfillmentDate,
      rentalStartDate,
      rentalEndDate,
      notes
    } = req.body || {};

    let supplier = null;
    if (supplierId) {
      supplier = await Supplier.findById(supplierId);
      if (!supplier) {
        return res.status(404).json({ message: 'Selected supplier was not found' });
      }
    }

    const resolvedSupplierName = String(supplier?.name || supplierName || '').trim();
    if (!resolvedSupplierName) {
      return res.status(400).json({ message: 'Supplier name is required' });
    }

    const parsedUnitPrice = Number(quotedUnitPrice);

    if (!Number.isFinite(parsedUnitPrice) || parsedUnitPrice <= 0) {
      return res.status(400).json({ message: 'Enter a supplier unit price greater than 0' });
    }

    if (request.requestType === 'rental' && rentalEndDate && !isValidDate(rentalEndDate)) {
      return res.status(400).json({ message: 'Invalid rental return date' });
    }

    request.quote = {
      supplier: supplier?._id || null,
      supplierName: resolvedSupplierName,
      supplierContact: String(
        supplierContact
        || [
          supplier?.contactPerson || '',
          supplier?.phone || ''
        ].filter(Boolean).join(' | ')
        || ''
      ).trim(),
      supplierEmail: String(supplier?.email || supplierEmail || '').trim(),
      quotedUnitPrice: parsedUnitPrice,
      quotedTotal: parsedUnitPrice * (request.requestedQuantity || 0),
      expectedFulfillmentDate: isValidDate(expectedFulfillmentDate) ? new Date(expectedFulfillmentDate) : undefined,
      rentalStartDate: isValidDate(rentalStartDate) ? new Date(rentalStartDate) : undefined,
      rentalEndDate: isValidDate(rentalEndDate) ? new Date(rentalEndDate) : undefined,
      notes: String(notes || '').trim(),
      submittedAt: new Date(),
      submittedBy: req.user._id
    };
    request.accounting = {
      status: 'pending',
      reviewedAt: null,
      reviewedBy: null,
      notes: ''
    };
    request.status = 'awaiting_accounting_approval';
    request.updatedBy = req.user._id;

    await request.save();

    await notifyRoles(['accounting', 'admin'], {
      type: 'task_assigned',
      title: `Procurement approval needed`,
      message: `${request.requestNumber} is ready for accounting review.`,
      contract: request.contract || undefined,
      priority: 'high'
    });

    await notifyUserIds([request.createdBy], {
      type: 'task_assigned',
      title: `Purchasing report submitted`,
      message: `${request.requestNumber} has been submitted to accounting for approval.`,
      contract: request.contract || undefined,
      priority: 'medium'
    });

    const populatedRequest = await populateProcurementRequest(
      ProcurementRequest.findById(request._id)
    );

    res.json(populatedRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/accounting-review', auth, requireRole(['accounting', 'admin']), async (req, res) => {
  try {
    const request = await ProcurementRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Procurement request not found' });
    }

    if (request.status !== 'awaiting_accounting_approval') {
      return res.status(400).json({ message: 'This request is not waiting for accounting approval' });
    }

    const decision = String(req.body?.decision || '').trim();
    const notes = String(req.body?.notes || '').trim();
    const rejectionReason = String(req.body?.rejectionReason || '').trim();
    const reviewChecklist = normalizeReviewChecklist(req.body?.reviewChecklist || {});

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be approved or rejected' });
    }

    if (decision === 'approved' && !Object.values(reviewChecklist).every(Boolean)) {
      return res.status(400).json({ message: 'Confirm the accounting review checklist before approving this request' });
    }

    if (decision === 'rejected' && !notes && !rejectionReason) {
      return res.status(400).json({ message: 'Add a rejection reason or note so purchasing knows what to revise' });
    }

    request.accounting = {
      status: decision,
      reviewedAt: new Date(),
      reviewedBy: req.user._id,
      notes,
      rejectionReason,
      reviewChecklist
    };
    request.status = decision;
    request.updatedBy = req.user._id;

    await request.save();

    const decisionTitle = decision === 'approved' ? 'Procurement request approved' : 'Procurement request needs revision';
    const decisionMessage = decision === 'approved'
      ? `${request.requestNumber} is approved and ready for purchasing action.`
      : `${request.requestNumber} was not approved. Review the accounting notes and update the quote.`;

    await notifyRoles(['purchasing', 'admin'], {
      type: 'task_assigned',
      title: decisionTitle,
      message: decisionMessage,
      contract: request.contract || undefined,
      priority: decision === 'approved' ? 'high' : 'medium'
    });

    await notifyUserIds([request.createdBy], {
      type: 'task_assigned',
      title: decisionTitle,
      message: decisionMessage,
      contract: request.contract || undefined,
      priority: decision === 'approved' ? 'high' : 'medium'
    });

    const populatedRequest = await populateProcurementRequest(
      ProcurementRequest.findById(request._id)
    );

    res.json(populatedRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/fulfill', auth, requireRole(['purchasing', 'admin']), async (req, res) => {
  try {
    const request = await ProcurementRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Procurement request not found' });
    }

    if (request.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved procurement requests can be fulfilled' });
    }

    if (!request.inventoryItem) {
      return res.status(400).json({ message: 'Link this request to an inventory item before marking it fulfilled' });
    }

    const departmentConfig = getDepartmentConfig(request.department);
    const inventoryItem = await departmentConfig.model.findById(request.inventoryItem);

    if (!inventoryItem) {
      return res.status(404).json({ message: 'Linked inventory item was not found' });
    }

    const receivedQuantity = parseQuantity(req.body?.receivedQuantity, request.requestedQuantity);
    if (!receivedQuantity) {
      return res.status(400).json({ message: 'Received quantity must be a whole number greater than 0' });
    }

    const rentalStartDate = isValidDate(req.body?.rentalStartDate)
      ? new Date(req.body.rentalStartDate)
      : request.quote?.rentalStartDate || null;
    const rentalEndDate = isValidDate(req.body?.rentalEndDate)
      ? new Date(req.body.rentalEndDate)
      : request.quote?.rentalEndDate || null;

    request.fulfillment = {
      receivedQuantity,
      invoiceReference: String(req.body?.invoiceReference || '').trim(),
      rentalStartDate,
      rentalEndDate,
      notes: String(req.body?.notes || '').trim(),
      attachments: normalizeAttachmentList(req.body?.attachments),
      fulfilledAt: new Date(),
      fulfilledBy: req.user._id,
      inventoryUpdated: false,
      inventoryUpdateSummary: ''
    };

    const updateSnapshot = await applyInventoryUpdate(request, inventoryItem, receivedQuantity);
    request.fulfillment.inventoryUpdated = true;
    request.fulfillment.inventoryUpdateSummary = `${departmentConfig.label} inventory updated from ${updateSnapshot.previousQuantity} to ${updateSnapshot.newQuantity} total units and ${updateSnapshot.previousAvailableQuantity} to ${updateSnapshot.newAvailableQuantity} available units.`;
    request.status = 'fulfilled';
    request.updatedBy = req.user._id;

    await request.save();

    await notifyUserIds([request.createdBy], {
      type: 'task_assigned',
      title: `Procurement completed`,
      message: `${request.requestNumber} has been fulfilled and the inventory count is updated.`,
      contract: request.contract || undefined,
      priority: 'medium'
    });

    const populatedRequest = await populateProcurementRequest(
      ProcurementRequest.findById(request._id)
    );

    res.json(populatedRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
