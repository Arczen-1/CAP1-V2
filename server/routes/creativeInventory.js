const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const CreativeInventory = require('../models/CreativeInventory');
const { auth, requireRole } = require('../middleware/auth');

const requireCreativeAccess = requireRole(['creative', 'admin']);

// Read access is open to authenticated staff so contract/client workflows can browse references.
router.get('/', auth, async (req, res) => {
  try {
    const { category, status, search, limit } = req.query;
    let query = {};
    
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { itemCode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    let itemsQuery = CreativeInventory.find(query)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .sort({ createdAt: -1 });

    if (limit) {
      const parsedLimit = Math.min(parseInt(limit, 10) || 24, 100);
      itemsQuery = itemsQuery.limit(parsedLimit);
    }

    const items = await itemsQuery;
    
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single item
router.get('/:id', auth, async (req, res) => {
  try {
    const item = await CreativeInventory.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new item
router.post('/', auth, requireCreativeAccess, [
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('category').isIn(['Backdrop', 'Table Decor', 'Lighting', 'Floral', 'Signage', 'Props', 'Drapery', 'Centerpiece', 'Other']),
  body('quantity').isInt({ min: 0 }),
  body().custom((_, { req }) => {
    const purchasePrice = Number(req.body?.pricePerItem || 0);
    const rentalPricePerDay = Number(req.body?.rentalPricePerDay || 0);

    if (purchasePrice <= 0 && rentalPricePerDay <= 0) {
      throw new Error('Set a purchase price or rental price per day');
    }

    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const purchasePrice = Number(req.body.pricePerItem || 0);
    const rentalPricePerDay = Number(req.body.rentalPricePerDay || 0);
    
    const payload = {
      ...req.body,
      pricePerItem: purchasePrice,
      rentalPricePerDay,
      acquisition: {
        ...(req.body.acquisition || {}),
        cost: purchasePrice
      },
      createdBy: req.user._id
    };

    const item = new CreativeInventory(payload);
    
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update item
router.put('/:id', auth, requireCreativeAccess, async (req, res) => {
  try {
    const item = await CreativeInventory.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    const nextPurchasePrice = req.body.pricePerItem !== undefined
      ? Number(req.body.pricePerItem || 0)
      : Number(item.pricePerItem || 0);
    const nextRentalPrice = req.body.rentalPricePerDay !== undefined
      ? Number(req.body.rentalPricePerDay || 0)
      : Number(item.rentalPricePerDay || 0);

    if (nextPurchasePrice <= 0 && nextRentalPrice <= 0) {
      return res.status(400).json({ message: 'Set a purchase price or rental price per day' });
    }

    const payload = {
      ...req.body,
      updatedBy: req.user._id,
      pricePerItem: nextPurchasePrice,
      rentalPricePerDay: nextRentalPrice,
      acquisition: {
        ...(item.acquisition?.toObject?.() || item.acquisition || {}),
        ...(req.body.acquisition || {}),
        cost: nextPurchasePrice
      }
    };

    Object.assign(item, payload);
    await item.save();
    
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete item
router.delete('/:id', auth, requireCreativeAccess, async (req, res) => {
  try {
    await CreativeInventory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get categories
router.get('/categories/list', auth, async (req, res) => {
  try {
    const categories = ['Backdrop', 'Table Decor', 'Lighting', 'Floral', 'Signage', 'Props', 'Drapery', 'Centerpiece', 'Other'];
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get stats
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const stats = {
      total: await CreativeInventory.countDocuments(),
      available: await CreativeInventory.countDocuments({ status: 'available' }),
      inUse: await CreativeInventory.countDocuments({ status: 'in_use' }),
      maintenance: await CreativeInventory.countDocuments({ status: 'maintenance' }),
      byCategory: await CreativeInventory.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ])
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
