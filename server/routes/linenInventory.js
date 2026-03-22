const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const LinenInventory = require('../models/LinenInventory');
const { auth, requireRole } = require('../middleware/auth');

// Access: Linen and Admin only
const requireLinenAccess = requireRole(['linen', 'admin']);

// Read access is open to authenticated staff so contract/client workflows can browse references.
router.get('/', auth, async (req, res) => {
  try {
    const { category, status, color, search, limit } = req.query;
    let query = {};
    
    if (category) query.category = category;
    if (status) query.status = status;
    if (color) query.color = color;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { itemCode: { $regex: search, $options: 'i' } },
        { color: { $regex: search, $options: 'i' } }
      ];
    }
    
    let itemsQuery = LinenInventory.find(query)
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
    const item = await LinenInventory.findById(req.params.id)
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
router.post('/', auth, requireLinenAccess, [
  body('name').notEmpty().trim(),
  body('category').isIn(['Tablecloth', 'Napkin', 'Runner', 'Overlay', 'Chair Cover', 'Sash', 'Skirting', 'Other']),
  body('size').notEmpty(),
  body('material').notEmpty(),
  body('color').notEmpty(),
  body('quantity').isInt({ min: 0 }),
  body('pricePerItem').isFloat({ gt: 0 }).withMessage('Price per item is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const payload = {
      ...req.body,
      pricePerItem: Number(req.body.pricePerItem) || 0,
      acquisition: {
        ...(req.body.acquisition || {}),
        cost: Number(req.body.pricePerItem) || 0
      },
      createdBy: req.user._id
    };

    const item = new LinenInventory(payload);
    
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update item
router.put('/:id', auth, requireLinenAccess, async (req, res) => {
  try {
    const item = await LinenInventory.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    const payload = {
      ...req.body,
      updatedBy: req.user._id
    };

    if (req.body.pricePerItem !== undefined) {
      payload.pricePerItem = Number(req.body.pricePerItem) || 0;
      payload.acquisition = {
        ...(item.acquisition?.toObject?.() || item.acquisition || {}),
        ...(req.body.acquisition || {}),
        cost: Number(req.body.pricePerItem) || 0
      };
    }

    Object.assign(item, payload);
    await item.save();
    
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete item
router.delete('/:id', auth, requireLinenAccess, async (req, res) => {
  try {
    await LinenInventory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get categories
router.get('/categories/list', auth, async (req, res) => {
  try {
    const categories = ['Tablecloth', 'Napkin', 'Runner', 'Overlay', 'Chair Cover', 'Sash', 'Skirting', 'Other'];
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get materials
router.get('/materials/list', auth, async (req, res) => {
  try {
    const materials = ['Polyester', 'Satin', 'Cotton', 'Linen', 'Spandex', 'Taffeta', 'Organza', 'Velvet', 'Other'];
    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get stats
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const stats = {
      total: await LinenInventory.countDocuments(),
      available: await LinenInventory.countDocuments({ status: 'available' }),
      inUse: await LinenInventory.countDocuments({ status: 'in_use' }),
      laundry: await LinenInventory.countDocuments({ status: 'laundry' }),
      byCategory: await LinenInventory.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 }, totalQuantity: { $sum: '$quantity' } } }
      ]),
      lowStock: await LinenInventory.find({
        $expr: { $lte: ['$availableQuantity', '$minimumStock'] }
      })
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
