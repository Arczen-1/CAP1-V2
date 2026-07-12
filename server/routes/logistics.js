const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Driver, Truck } = require('../models/Logistics');
const { auth, requireRole } = require('../middleware/auth');

// Access: Logistics and Admin only
const requireLogisticsAccess = requireRole(['logistics', 'admin']);

// ==================== DRIVERS ====================

// Get all drivers
router.get('/drivers', auth, requireLogisticsAccess, async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};
    
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { driverId: { $regex: search, $options: 'i' } },
        { licenseNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    const drivers = await Driver.find(query)
      .populate('assignedTrucks', 'plateNumber truckType')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single driver
router.get('/drivers/:id', auth, requireLogisticsAccess, async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id)
      .populate('assignedTrucks')
      .populate('createdBy', 'name');
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    res.json(driver);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create driver
router.post('/drivers', auth, requireLogisticsAccess, [
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('phone').notEmpty(),
  body('licenseNumber').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const driver = new Driver({
      ...req.body,
      createdBy: req.user._id
    });
    
    await driver.save();
    res.status(201).json(driver);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'License number already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update driver
router.put('/drivers/:id', auth, requireLogisticsAccess, async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    Object.assign(driver, req.body, { updatedBy: req.user._id });
    await driver.save();
    
    res.json(driver);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete driver
router.delete('/drivers/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    await Driver.findByIdAndDelete(req.params.id);
    res.json({ message: 'Driver deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== TRUCKS ====================

// Get all trucks
router.get('/trucks', auth, requireLogisticsAccess, async (req, res) => {
  try {
    const { status, truckType, search } = req.query;
    let query = {};
    
    if (status) query.status = status;
    if (truckType) query.truckType = truckType;
    if (search) {
      query.$or = [
        { plateNumber: { $regex: search, $options: 'i' } },
        { truckId: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }
    
    const trucks = await Truck.find(query)
      .populate('assignedDriver', 'firstName lastName fullName driverId')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json(trucks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single truck
router.get('/trucks/:id', auth, requireLogisticsAccess, async (req, res) => {
  try {
    const truck = await Truck.findById(req.params.id)
      .populate('assignedDriver')
      .populate('createdBy', 'name');
    
    if (!truck) {
      return res.status(404).json({ message: 'Truck not found' });
    }
    
    res.json(truck);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create truck
router.post('/trucks', auth, requireLogisticsAccess, [
  body('plateNumber').notEmpty().trim().toUpperCase(),
  body('truckType').isIn(['closed_van', 'open_truck', 'refrigerated', 'wing_van', 'flatbed', 'mini_truck', 'lorry', 'other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const truck = new Truck({
      ...req.body,
      createdBy: req.user._id
    });
    
    await truck.save();
    res.status(201).json(truck);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Plate number already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update truck
router.put('/trucks/:id', auth, requireLogisticsAccess, async (req, res) => {
  try {
    const truck = await Truck.findById(req.params.id);
    
    if (!truck) {
      return res.status(404).json({ message: 'Truck not found' });
    }
    
    Object.assign(truck, req.body, { updatedBy: req.user._id });
    await truck.save();
    
    res.json(truck);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete truck
router.delete('/trucks/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    await Truck.findByIdAndDelete(req.params.id);
    res.json({ message: 'Truck deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Assign driver to truck
router.post('/trucks/:id/assign-driver', auth, requireLogisticsAccess, async (req, res) => {
  try {
    const { driverId } = req.body;
    const truck = await Truck.findById(req.params.id);
    
    if (!truck) {
      return res.status(404).json({ message: 'Truck not found' });
    }
    
    truck.assignedDriver = driverId;
    await truck.save();
    
    // Add truck to driver's assigned trucks
    if (driverId) {
      await Driver.findByIdAndUpdate(driverId, {
        $addToSet: { assignedTrucks: truck._id }
      });
    }
    
    res.json(truck);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get truck types
router.get('/trucks/types/list', auth, requireLogisticsAccess, async (req, res) => {
  try {
    const types = [
      { value: 'closed_van', label: 'Closed Van' },
      { value: 'open_truck', label: 'Open Truck' },
      { value: 'refrigerated', label: 'Refrigerated Truck' },
      { value: 'wing_van', label: 'Wing Van' },
      { value: 'flatbed', label: 'Flatbed' },
      { value: 'mini_truck', label: 'Mini Truck' },
      { value: 'lorry', label: 'Lorry' },
      { value: 'other', label: 'Other' }
    ];
    res.json(types);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get stats
router.get('/stats/overview', auth, requireLogisticsAccess, async (req, res) => {
  try {
    const stats = {
      drivers: {
        total: await Driver.countDocuments(),
        active: await Driver.countDocuments({ status: 'active' }),
        byType: await Driver.aggregate([
          { $group: { _id: '$employmentType', count: { $sum: 1 } } }
        ])
      },
      trucks: {
        total: await Truck.countDocuments(),
        available: await Truck.countDocuments({ status: 'available' }),
        inUse: await Truck.countDocuments({ status: 'in_use' }),
        maintenance: await Truck.countDocuments({ status: 'maintenance' }),
        byType: await Truck.aggregate([
          { $group: { _id: '$truckType', count: { $sum: 1 } } }
        ])
      }
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
