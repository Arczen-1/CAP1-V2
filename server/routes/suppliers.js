const express = require('express');
const Supplier = require('../models/Supplier');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

const parseCsvList = (value) => (
  String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
);

const normalizeList = (value) => {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry || '').trim()).filter(Boolean);
  }

  return parseCsvList(value);
};

const sanitizeSupplierPayload = (body = {}) => ({
  name: String(body.name || '').trim(),
  contactPerson: String(body.contactPerson || '').trim(),
  phone: String(body.phone || '').trim(),
  email: String(body.email || '').trim(),
  address: String(body.address || '').trim(),
  city: String(body.city || '').trim(),
  province: String(body.province || '').trim(),
  serviceAreas: normalizeList(body.serviceAreas),
  departments: normalizeList(body.departments).filter((value) => ['creative', 'linen', 'stockroom'].includes(value)),
  requestTypes: normalizeList(body.requestTypes).filter((value) => ['purchase', 'rental'].includes(value)),
  supportedCategories: normalizeList(body.supportedCategories),
  supportedKeywords: normalizeList(body.supportedKeywords),
  isPreferred: Boolean(body.isPreferred),
  priority: Number.isFinite(Number(body.priority)) ? Number(body.priority) : 0,
  notes: String(body.notes || '').trim(),
  isActive: body.isActive !== undefined ? Boolean(body.isActive) : true
});

router.get('/', auth, requireRole(['purchasing', 'accounting', 'admin']), async (req, res) => {
  try {
    const query = {};

    if (req.query.department) {
      query.departments = req.query.department;
    }

    if (req.query.requestType) {
      query.requestTypes = req.query.requestType;
    }

    if (req.query.active === 'true') {
      query.isActive = true;
    }

    const suppliers = await Supplier.find(query).sort({ isPreferred: -1, priority: -1, name: 1 });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/', auth, requireRole(['purchasing', 'admin']), async (req, res) => {
  try {
    const payload = sanitizeSupplierPayload(req.body);

    if (!payload.name) {
      return res.status(400).json({ message: 'Supplier name is required' });
    }

    if (!payload.departments.length) {
      return res.status(400).json({ message: 'Select at least one supported department' });
    }

    if (!payload.requestTypes.length) {
      return res.status(400).json({ message: 'Select at least one request type' });
    }

    const supplier = await Supplier.create(payload);
    res.status(201).json(supplier);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A supplier with this name already exists' });
    }

    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id', auth, requireRole(['purchasing', 'admin']), async (req, res) => {
  try {
    const payload = sanitizeSupplierPayload(req.body);

    if (!payload.name) {
      return res.status(400).json({ message: 'Supplier name is required' });
    }

    if (!payload.departments.length) {
      return res.status(400).json({ message: 'Select at least one supported department' });
    }

    if (!payload.requestTypes.length) {
      return res.status(400).json({ message: 'Select at least one request type' });
    }

    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    );

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A supplier with this name already exists' });
    }

    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', auth, requireRole(['purchasing', 'admin']), async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
