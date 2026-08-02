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

// Keeps only well-formed dish rows: a non-empty item name, trimmed strings, and
// a boolean selected flag. Silently drops junk so a bad payload never fails a booking.
const sanitizeMenuItems = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => ({
      category: typeof item?.category === 'string' ? item.category.trim() : '',
      itemName: typeof item?.itemName === 'string' ? item.itemName.trim() : '',
      selected: item?.selected !== false,
      notes: typeof item?.notes === 'string' ? item.notes.trim() : ''
    }))
    .filter((item) => item.itemName.length > 0)
    .slice(0, 60);
};

// The sub-document field is `itemName`. Posting `name` (or any other spelling)
// used to be silently discarded and still return 201, so the caller believed
// the dishes were saved. Name the dropped entries instead of losing them.
const describeDroppedMenuItems = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      const hasItemName = typeof item?.itemName === 'string' && item.itemName.trim().length > 0;
      if (hasItemName) {
        return null;
      }
      // Only complain about entries that clearly meant to name a dish.
      const alias = ['name', 'dish', 'dishName', 'item', 'title', 'label']
        .find((key) => typeof item?.[key] === 'string' && item[key].trim().length > 0);
      if (!alias) {
        return null;
      }
      return `entry ${index + 1} used "${alias}" instead of "itemName" (value: ${String(item[alias]).trim()})`;
    })
    .filter(Boolean);
};

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

    // Prevent double-booking the same date + time slot (the slots/available list
    // is advisory only; enforce it here so two clients can't take the same slot).
    if (req.body.tastingDate && req.body.tastingTime) {
      const slotDay = new Date(req.body.tastingDate);
      const slotTaken = await MenuTasting.findOne({
        tastingTime: req.body.tastingTime,
        status: { $in: ['booked', 'confirmed'] },
        tastingDate: {
          $gte: new Date(new Date(slotDay).setHours(0, 0, 0, 0)),
          $lte: new Date(new Date(slotDay).setHours(23, 59, 59, 999)),
        },
      });
      if (slotTaken) {
        return res.status(400).json({
          message: `The ${req.body.tastingTime} slot on that date is already booked. Please choose another slot.`,
        });
      }
    }

    const droppedMenuItems = describeDroppedMenuItems(req.body.menuItems);
    if (droppedMenuItems.length) {
      return res.status(400).json({
        message: `${droppedMenuItems.length} menu item(s) could not be read. Each dish must use the field "itemName".`,
        errors: droppedMenuItems.map((detail) => ({ field: 'menuItems', message: detail }))
      });
    }

    const tasting = new MenuTasting({
      ...req.body,
      menuItems: sanitizeMenuItems(req.body.menuItems),
      clientNotes: typeof req.body.clientNotes === 'string' ? req.body.clientNotes.trim() : undefined
    });
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

    // Once a contract exists the booking details are locked, but the booking
    // status may still move (e.g. confirming attendance or recording a no-show).
    if (tasting.contractCreated) {
      const disallowedFields = Object.keys(req.body).filter((key) => key !== 'status');
      if (disallowedFields.length > 0) {
        return res.status(400).json({
          message: 'Cannot modify tasting details - contract already created'
        });
      }

      if (req.body.status !== undefined && !['booked', 'confirmed', 'no_show'].includes(req.body.status)) {
        return res.status(400).json({
          message: 'Only booking status updates are allowed after the contract is created'
        });
      }
    }

    Object.assign(tasting, req.body);
    await tasting.save();
    
    res.json(tasting);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Record tasting feedback and mark the booking completed
router.post('/:id/feedback', auth, requireRole(['sales', 'admin']), [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comments')
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Comments cannot exceed 2000 characters'),
  body('itemsLiked')
    .optional({ nullable: true })
    .isArray()
    .withMessage('Items liked must be a list'),
  body('itemsToChange')
    .optional({ nullable: true })
    .isArray()
    .withMessage('Items to change must be a list')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tasting = await MenuTasting.findById(req.params.id);

    if (!tasting) {
      return res.status(404).json({ message: 'Menu tasting not found' });
    }

    if (['cancelled', 'no_show'].includes(tasting.status)) {
      return res.status(400).json({
        message: 'Feedback cannot be recorded for a cancelled or no-show booking'
      });
    }

    const toTrimmedList = (value) => (Array.isArray(value)
      ? value.map(item => String(item).trim()).filter(Boolean)
      : []);

    tasting.feedback = {
      rating: req.body.rating,
      comments: typeof req.body.comments === 'string' ? req.body.comments.trim() : '',
      itemsLiked: toTrimmedList(req.body.itemsLiked),
      itemsToChange: toTrimmedList(req.body.itemsToChange)
    };

    // Per-dish notes captured during the tasting are merged onto the existing
    // dish list (matched by name) so the kitchen checklist can print them.
    // Merging rather than replacing means a partial payload can never drop dishes.
    if (Array.isArray(req.body.menuItems) && (tasting.menuItems || []).length > 0) {
      const notesByName = new Map(
        req.body.menuItems
          .filter((item) => item && typeof item.itemName === 'string')
          .map((item) => [
            item.itemName.trim().toLowerCase(),
            typeof item.notes === 'string' ? item.notes.trim() : ''
          ])
      );

      tasting.menuItems.forEach((dish) => {
        const incomingNote = notesByName.get(String(dish.itemName || '').trim().toLowerCase());
        if (incomingNote !== undefined) {
          dish.notes = incomingNote;
        }
      });
    }

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
