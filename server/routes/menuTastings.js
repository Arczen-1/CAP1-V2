const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Contract = require('../models/Contract');
const MenuTasting = require('../models/MenuTasting');
const { auth, requireRole } = require('../middleware/auth');

// Validation rules
const tastingValidation = [
  body('clientName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 characters'),
  body('clientEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('clientPhone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
  body('clientAddress.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  body('clientAddress.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('clientAddress.province')
    .trim()
    .notEmpty()
    .withMessage('Province is required'),
  body('clientAddress.zipCode')
    .matches(/^\d{4,6}$/)
    .withMessage('Please enter a valid ZIP code (4-6 digits)'),
  body('eventType')
    .isIn(['wedding', 'corporate', 'birthday', 'debut', 'anniversary', 'other'])
    .withMessage('Please select a valid event type'),
  body('expectedGuests')
    .isInt({ min: 1, max: 5000 })
    .withMessage('Expected guests must be between 1 and 5000'),
  body('preferredEventDate')
    .isISO8601()
    .withMessage('Please select a valid event date'),
  body('tastingDate')
    .isISO8601()
    .withMessage('Please select a valid tasting date'),
  body('tastingTime')
    .notEmpty()
    .withMessage('Please select a tasting time'),
  body('numberOfPax')
    .isInt({ min: 1, max: 10 })
    .withMessage('Tasting pax must be between 1 and 10')
];

const getLinkedContractId = (tasting) => {
  if (!tasting?.contract) {
    return '';
  }

  if (typeof tasting.contract === 'object' && tasting.contract._id) {
    return String(tasting.contract._id);
  }

  return String(tasting.contract);
};

const clearStaleContractLink = async (tasting) => {
  tasting.contract = null;
  tasting.contractCreated = false;
  await tasting.save();
  return tasting;
};

const repairPopulatedTastingContractLinks = async (tastings = []) => {
  const staleIds = tastings
    .filter((tasting) => tasting?.contractCreated && !getLinkedContractId(tasting))
    .map((tasting) => tasting._id);

  if (!staleIds.length) {
    return tastings;
  }

  await MenuTasting.updateMany({
    _id: { $in: staleIds }
  }, {
    $set: {
      contract: null,
      contractCreated: false
    }
  });

  tastings.forEach((tasting) => {
    if (staleIds.some((id) => String(id) === String(tasting._id))) {
      tasting.contract = null;
      tasting.contractCreated = false;
    }
  });

  return tastings;
};

const ensureTastingContractLinkIsValid = async (tasting) => {
  if (!tasting?.contractCreated) {
    return tasting;
  }

  const linkedContractId = getLinkedContractId(tasting);
  if (!linkedContractId) {
    return clearStaleContractLink(tasting);
  }

  const contractExists = await Contract.exists({ _id: linkedContractId });
  if (!contractExists) {
    return clearStaleContractLink(tasting);
  }

  return tasting;
};

// Get all menu tastings
router.get('/', auth, async (req, res) => {
  try {
    const { status, fromDate, toDate } = req.query;
    let query = {};
    
    if (status) query.status = status;
    if (fromDate || toDate) {
      query.tastingDate = {};
      if (fromDate) query.tastingDate.$gte = new Date(fromDate);
      if (toDate) query.tastingDate.$lte = new Date(toDate);
    }
    
    const tastings = await MenuTasting.find(query)
      .populate('contract', 'contractNumber status')
      .populate('assignedStaff', 'name')
      .sort({ tastingDate: 1, tastingTime: 1 });

    await repairPopulatedTastingContractLinks(tastings);
    
    res.json(tastings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single menu tasting
router.get('/:id', auth, async (req, res) => {
  try {
    const tasting = await MenuTasting.findById(req.params.id)
      .populate('contract')
      .populate('assignedStaff', 'name email');
    
    if (!tasting) {
      return res.status(404).json({ message: 'Menu tasting not found' });
    }

    await ensureTastingContractLinkIsValid(tasting);
    
    res.json(tasting);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new menu tasting booking
router.post('/', auth, requireRole(['sales', 'admin']), tastingValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }
    
    // Check for duplicate email bookings
    const existingBooking = await MenuTasting.findOne({
      clientEmail: req.body.clientEmail,
      status: { $in: ['booked', 'confirmed'] },
      tastingDate: { $gte: new Date() }
    });
    
    if (existingBooking) {
      return res.status(400).json({
        message: 'This email already has an active tasting booking'
      });
    }
    
    const tasting = new MenuTasting(req.body);
    await tasting.save();
    
    res.status(201).json(tasting);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: Object.values(error.errors).map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update menu tasting
router.put('/:id', auth, requireRole(['sales', 'admin']), async (req, res) => {
  try {
    const tasting = await MenuTasting.findById(req.params.id);
    
    if (!tasting) {
      return res.status(404).json({ message: 'Menu tasting not found' });
    }

    await ensureTastingContractLinkIsValid(tasting);
    
    // Don't allow updates if contract already created
    if (tasting.contractCreated) {
      return res.status(400).json({
        message: 'Cannot modify tasting - contract already created'
      });
    }
    
    Object.assign(tasting, req.body);
    await tasting.save();
    
    res.json(tasting);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update tasting feedback
router.post('/:id/feedback', auth, async (req, res) => {
  try {
    const tasting = await MenuTasting.findById(req.params.id);
    
    if (!tasting) {
      return res.status(404).json({ message: 'Menu tasting not found' });
    }
    
    tasting.feedback = req.body;
    tasting.status = 'completed';
    await tasting.save();
    
    res.json(tasting);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Link contract to tasting
router.post('/:id/link-contract', auth, requireRole(['sales', 'admin']), async (req, res) => {
  try {
    const { contractId } = req.body;

    const linkedContract = await Contract.findById(contractId).select('_id');
    if (!linkedContract) {
      return res.status(404).json({ message: 'Linked contract not found' });
    }
    
    const tasting = await MenuTasting.findById(req.params.id);
    if (!tasting) {
      return res.status(404).json({ message: 'Menu tasting not found' });
    }
    
    tasting.contract = contractId;
    tasting.contractCreated = true;
    await tasting.save();
    
    res.json(tasting);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get available tasting slots
router.get('/slots/available', auth, async (req, res) => {
  try {
    const { date } = req.query;
    const selectedDate = new Date(date);
    
    const timeSlots = [
      '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', 
      '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
    ];
    
    // Find booked slots for the date
    const bookedTastings = await MenuTasting.find({
      tastingDate: {
        $gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
        $lt: new Date(selectedDate.setHours(23, 59, 59, 999))
      },
      status: { $in: ['booked', 'confirmed'] }
    });
    
    const bookedSlots = bookedTastings.map(t => t.tastingTime);
    const availableSlots = timeSlots.filter(slot => !bookedSlots.includes(slot));
    
    res.json({
      date: selectedDate,
      allSlots: timeSlots,
      bookedSlots,
      availableSlots
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get tasting statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const stats = {
      total: await MenuTasting.countDocuments(),
      upcoming: await MenuTasting.countDocuments({
        tastingDate: { $gte: today },
        status: { $in: ['booked', 'confirmed'] }
      }),
      today: await MenuTasting.countDocuments({
        tastingDate: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        },
        status: { $in: ['booked', 'confirmed'] }
      }),
      completed: await MenuTasting.countDocuments({ status: 'completed' }),
      converted: await MenuTasting.countDocuments({ contractCreated: true }),
      conversionRate: 0
    };
    
    if (stats.completed > 0) {
      stats.conversionRate = Math.round((stats.converted / stats.completed) * 100);
    }
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete tasting (only if no contract)
router.delete('/:id', auth, requireRole(['sales', 'admin']), async (req, res) => {
  try {
    const tasting = await MenuTasting.findById(req.params.id);
    
    if (!tasting) {
      return res.status(404).json({ message: 'Menu tasting not found' });
    }

    await ensureTastingContractLinkIsValid(tasting);
    
    if (tasting.contractCreated) {
      return res.status(400).json({
        message: 'Cannot delete tasting - contract already created'
      });
    }
    
    await MenuTasting.findByIdAndDelete(req.params.id);
    res.json({ message: 'Menu tasting deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
