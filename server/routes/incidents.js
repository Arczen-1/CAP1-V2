const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Incident = require('../models/Incident');
const { auth, requireRole } = require('../middleware/auth');
const MAX_INCIDENT_ATTACHMENT_LENGTH = 3_000_000;

// Get all incidents
router.get('/', auth, async (req, res) => {
  try {
    const incidents = await Incident.find()
      .populate('contract', 'contractNumber clientName eventDate')
      .populate('reportedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get incidents by contract
router.get('/contract/:contractId', auth, async (req, res) => {
  try {
    const incidents = await Incident.find({ contract: req.params.contractId })
      .populate('reportedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create incident
router.post('/', auth, [
  body('contract').notEmpty(),
  body('department').optional().isIn([
    'sales', 'accounting', 'logistics', 'banquet', 'kitchen', 'purchasing', 'creative', 'linen', 'all'
  ]),
  body('incidentType').isIn([
    'burnt_cloth', 'damaged_equipment', 'missing_item', 'food_spoilage',
    'vehicle_breakdown', 'staff_issue', 'client_complaint', 'other'
  ]),
  body('description').notEmpty(),
  body('eventDate').isISO8601(),
  body('affectedQuantity').optional({ values: 'falsy' }).isInt({ min: 1 }),
  body('attachments').optional().isArray({ max: 3 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const normalizedAttachments = Array.isArray(req.body.attachments)
      ? req.body.attachments
        .filter((value) => typeof value === 'string' && value.trim())
        .map((value) => value.trim())
      : [];

    if (normalizedAttachments.some((value) => value.length > MAX_INCIDENT_ATTACHMENT_LENGTH)) {
      return res.status(400).json({ message: 'Damage reference image is too large' });
    }

    const incident = new Incident({
      ...req.body,
      attachments: normalizedAttachments,
      department: req.body.department || 'all',
      reportedBy: req.user._id
    });

    await incident.save();
    
    await incident.populate('contract', 'contractNumber clientName');
    await incident.populate('reportedBy', 'name');

    res.status(201).json(incident);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update incident
router.put('/:id', auth, async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    Object.assign(incident, req.body);
    
    if (req.body.status === 'resolved' && !incident.resolvedAt) {
      incident.resolvedAt = new Date();
      incident.resolvedBy = req.user._id;
    }

    await incident.save();
    
    await incident.populate('contract', 'contractNumber clientName');
    await incident.populate('reportedBy', 'name');

    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete incident
router.delete('/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    await Incident.findByIdAndDelete(req.params.id);
    res.json({ message: 'Incident deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
