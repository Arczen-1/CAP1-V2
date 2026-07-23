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

// Only supervisory banquet staff should receive a system login, since the only
// banquet system role is banquet_supervisor. Line staff (waiters, bussers, etc.)
// are managed as records, not login users.
const ACCOUNT_ELIGIBLE_STAFF_ROLES = ['event_manager', 'supervisor', 'head_captain', 'coordinator'];

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

    if (!ACCOUNT_ELIGIBLE_STAFF_ROLES.includes(staff.role)) {
      return res.status(400).json({
        message: `Only supervisory banquet staff (${ACCOUNT_ELIGIBLE_STAFF_ROLES.join(', ')}) can be given a supervisor login. ${staff.fullName || 'This staff member'} is a ${staff.role}.`
      });
    }

    const password = String(req.body.password || '').trim();
    if (password.length < 6) {
      return res.status(400).json({ message: 'Set a password of at least 6 characters for the new account' });
    }

    const email = String(req.body.email || staff.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ message: 'An email address is required to create the account' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'A user account with this email already exists' });
    }

    const user = new User({
      name: staff.fullName,
      email,
      password,
      role: 'banquet_supervisor',
      department: 'Banquet Operations'
    });

    await user.save();

    staff.hasAccount = true;
    staff.accountEmail = user.email;
    await staff.save();

    const safeUser = user.toObject();
    delete safeUser.password;

    res.json({ message: 'Account created', user: safeUser, staff });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A user account with this email already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
