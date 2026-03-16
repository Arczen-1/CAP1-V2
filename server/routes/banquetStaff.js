const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const BanquetStaff = require('../models/BanquetStaff');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');

// Access: Banquet Supervisor and Admin only
const requireBanquetAccess = requireRole(['banquet_supervisor', 'admin']);

// Get all banquet staff
router.get('/', auth, requireBanquetAccess, async (req, res) => {
  try {
    const { role, status, search } = req.query;
    let query = {};
    
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const staff = await BanquetStaff.find(query)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single staff
router.get('/:id', auth, requireBanquetAccess, async (req, res) => {
  try {
    const staff = await BanquetStaff.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');
    
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }
    
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new staff
router.post('/', auth, requireBanquetAccess, [
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('email').isEmail(),
  body('phone').notEmpty(),
  body('role').isIn([
    'waiter', 'waitress', 'event_manager', 'supervisor', 'head_captain',
    'bartender', 'food_runner', 'busser', 'setup_crew', 'coordinator', 'other'
  ])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const staff = new BanquetStaff({
      ...req.body,
      createdBy: req.user._id
    });
    
    await staff.save();
    res.status(201).json(staff);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email or employee ID already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update staff
router.put('/:id', auth, requireBanquetAccess, async (req, res) => {
  try {
    const staff = await BanquetStaff.findById(req.params.id);
    
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }
    
    Object.assign(staff, req.body, { updatedBy: req.user._id });
    await staff.save();
    
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete staff
router.delete('/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    await BanquetStaff.findByIdAndDelete(req.params.id);
    res.json({ message: 'Staff deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create account for staff
router.post('/:id/create-account', auth, requireRole(['admin']), async (req, res) => {
  try {
    const staff = await BanquetStaff.findById(req.params.id);
    
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }
    
    if (staff.hasAccount) {
      return res.status(400).json({ message: 'Staff already has an account' });
    }
    
    // Create user account
    const user = new User({
      name: staff.fullName,
      email: req.body.email || staff.email,
      password: req.body.password || 'password123',
      role: 'banquet_supervisor', // or based on staff role
      department: 'Banquet Operations'
    });
    
    await user.save();
    
    // Update staff record
    staff.hasAccount = true;
    staff.accountEmail = user.email;
    await staff.save();
    
    res.json({ message: 'Account created', user, staff });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get roles list
router.get('/roles/list', auth, requireBanquetAccess, async (req, res) => {
  try {
    const roles = [
      { value: 'waiter', label: 'Waiter' },
      { value: 'waitress', label: 'Waitress' },
      { value: 'event_manager', label: 'Event Manager' },
      { value: 'supervisor', label: 'Supervisor' },
      { value: 'head_captain', label: 'Head Captain' },
      { value: 'bartender', label: 'Bartender' },
      { value: 'food_runner', label: 'Food Runner' },
      { value: 'busser', label: 'Busser' },
      { value: 'setup_crew', label: 'Setup Crew' },
      { value: 'coordinator', label: 'Coordinator' },
      { value: 'other', label: 'Other' }
    ];
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get stats
router.get('/stats/overview', auth, requireBanquetAccess, async (req, res) => {
  try {
    const stats = {
      total: await BanquetStaff.countDocuments(),
      active: await BanquetStaff.countDocuments({ status: 'active' }),
      byRole: await BanquetStaff.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      withAccounts: await BanquetStaff.countDocuments({ hasAccount: true })
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
