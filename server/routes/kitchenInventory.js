const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const KitchenInventory = require('../models/KitchenInventory');
const { auth, requireRole } = require('../middleware/auth');
const requireKitchenInventoryAccess = requireRole(['kitchen', 'purchasing', 'admin']);

// Get all kitchen items
router.get('/', auth, async (req, res) => {
  try {
    const { category, status, search, lowStock } = req.query;
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
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$availableQuantity', '$minimumStock'] };
    }
    
    const items = await KitchenInventory.find(query).sort({ category: 1, name: 1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single item
router.get('/:id', auth, async (req, res) => {
  try {
    const item = await KitchenInventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new item
router.post('/', auth, requireKitchenInventoryAccess, [
  body('name').trim().notEmpty().withMessage('Item name is required'),
  body('category').isIn(['Utensil', 'Cookware', 'Serveware', 'Appliance', 'Tool', 'Container', 'Ingredient', 'Other']).withMessage('Invalid category'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a positive number'),
  body('purchasePrice').isFloat({ gt: 0 }).withMessage('Price per unit is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    
    const item = new KitchenInventory(req.body);
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
router.put('/:id', auth, requireKitchenInventoryAccess, async (req, res) => {
  try {
    const item = await KitchenInventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const purchasePrice = req.body?.purchasePrice !== undefined
      ? Number(req.body.purchasePrice || 0)
      : Number(item.purchasePrice || 0);

    if (purchasePrice <= 0) {
      return res.status(400).json({ message: 'Price per unit is required' });
    }
    
    Object.assign(item, req.body);
    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete item
router.delete('/:id', auth, requireKitchenInventoryAccess, async (req, res) => {
  try {
    const item = await KitchenInventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    await KitchenInventory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reserve items for event
router.post('/:id/reserve', auth, requireRole(['kitchen', 'admin']), async (req, res) => {
  try {
    const { quantity } = req.body;
    const item = await KitchenInventory.findById(req.params.id);
    
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
router.post('/:id/release', auth, requireRole(['kitchen', 'admin']), async (req, res) => {
  try {
    const { quantity } = req.body;
    const item = await KitchenInventory.findById(req.params.id);
    
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
      total: await KitchenInventory.countDocuments(),
      totalQuantity: await KitchenInventory.aggregate([
        { $group: { _id: null, total: { $sum: '$quantity' } } }
      ]).then(r => r[0]?.total || 0),
      availableQuantity: await KitchenInventory.aggregate([
        { $group: { _id: null, total: { $sum: '$availableQuantity' } } }
      ]).then(r => r[0]?.total || 0),
      byCategory: await KitchenInventory.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 }, quantity: { $sum: '$quantity' } } }
      ]),
      lowStock: await KitchenInventory.countDocuments({
        $expr: { $lte: ['$availableQuantity', '$minimumStock'] }
      }),
      expiringSoon: await KitchenInventory.countDocuments({
        expiryDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), $gte: new Date() }
      })
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
