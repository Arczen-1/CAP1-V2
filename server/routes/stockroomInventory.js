const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const StockroomInventory = require('../models/StockroomInventory');
const { auth, requireRole } = require('../middleware/auth');

// Get all stockroom items
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
    
    let itemsQuery = StockroomInventory.find(query).sort({ category: 1, name: 1 });
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
    const item = await StockroomInventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new item
router.post('/', auth, requireRole(['logistics', 'admin']), [
  body('name').trim().notEmpty().withMessage('Item name is required'),
  body('category').isIn(['Chair', 'Table', 'Tent', 'Equipment', 'Tool', 'Decor', 'Other']).withMessage('Invalid category'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    
    const item = new StockroomInventory(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: Object.values(error.errors).map(e => ({ field: e.path, message: e.message }))
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update item
router.put('/:id', auth, requireRole(['logistics', 'admin']), async (req, res) => {
  try {
    const item = await StockroomInventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    Object.assign(item, req.body);
    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete item
router.delete('/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const item = await StockroomInventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    await StockroomInventory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reserve items for event
router.post('/:id/reserve', auth, requireRole(['sales', 'logistics', 'admin']), async (req, res) => {
  try {
    const { quantity } = req.body;
    const item = await StockroomInventory.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    if (item.availableQuantity < quantity) {
      return res.status(400).json({ 
        message: 'Not enough items available',
        available: item.availableQuantity,
        requested: quantity
      });
    }
    
    item.reservedQuantity += quantity;
    item.updateAvailable();
    await item.save();
    
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Release reserved items
router.post('/:id/release', auth, requireRole(['sales', 'logistics', 'admin']), async (req, res) => {
  try {
    const { quantity } = req.body;
    const item = await StockroomInventory.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    item.reservedQuantity = Math.max(0, item.reservedQuantity - quantity);
    item.updateAvailable();
    await item.save();
    
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const stats = {
      total: await StockroomInventory.countDocuments(),
      totalQuantity: await StockroomInventory.aggregate([
        { $group: { _id: null, total: { $sum: '$quantity' } } }
      ]).then(r => r[0]?.total || 0),
      availableQuantity: await StockroomInventory.aggregate([
        { $group: { _id: null, total: { $sum: '$availableQuantity' } } }
      ]).then(r => r[0]?.total || 0),
      byCategory: await StockroomInventory.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 }, quantity: { $sum: '$quantity' } } }
      ]),
      lowStock: await StockroomInventory.countDocuments({
        $expr: { $lte: ['$availableQuantity', '$minimumStock'] }
      }),
      inMaintenance: await StockroomInventory.countDocuments({ status: 'maintenance' })
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
