const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth, generateToken } = require('../middleware/auth');
const PASSWORD_RESET_WINDOW_MINUTES = 15;

const buildPasswordResetResponse = () => ({
  message: 'If the email is registered, a password reset code has been generated.'
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Forgot password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const response = buildPasswordResetResponse();
    const user = await User.findOne({ email });

    if (!user || !user.isActive) {
      return res.json(response);
    }

    const resetCode = String(Math.floor(100000 + Math.random() * 900000));
    user.passwordResetToken = crypto.createHash('sha256').update(resetCode).digest('hex');
    user.passwordResetExpiresAt = new Date(Date.now() + PASSWORD_RESET_WINDOW_MINUTES * 60 * 1000);
    await user.save();

    const payload = {
      ...response
    };

    if (process.env.NODE_ENV !== 'production') {
      payload.resetCode = resetCode;
      payload.expiresInMinutes = PASSWORD_RESET_WINDOW_MINUTES;
    }

    res.json(payload);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reset password
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail(),
  body('resetCode').isLength({ min: 6, max: 6 }).withMessage('Enter the 6-digit reset code'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, resetCode, newPassword } = req.body;
    const hashedResetCode = crypto.createHash('sha256').update(resetCode).digest('hex');

    const user = await User.findOne({
      email,
      passwordResetToken: hashedResetCode,
      passwordResetExpiresAt: { $gt: new Date() }
    });

    if (!user || !user.isActive) {
      return res.status(400).json({ message: 'The reset code is invalid or has expired' });
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();

    res.json({
      message: 'Password updated successfully. You can now sign in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        department: req.user.department
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Seed initial users (for development)
router.post('/seed', async (req, res) => {
  try {
    const users = [
      { name: 'Sales Manager', email: 'sales@juancarlos.com', password: 'password123', role: 'sales', department: 'Sales' },
      { name: 'Accounting Manager', email: 'accounting@juancarlos.com', password: 'password123', role: 'accounting', department: 'Accounting' },
      { name: 'Logistics Manager', email: 'logistics@juancarlos.com', password: 'password123', role: 'logistics', department: 'Logistics' },
      { name: 'Banquet Supervisor', email: 'banquet@juancarlos.com', password: 'password123', role: 'banquet_supervisor', department: 'Banquet Operations' },
      { name: 'Kitchen Manager', email: 'kitchen@juancarlos.com', password: 'password123', role: 'kitchen', department: 'Kitchen' },
      { name: 'Purchasing Manager', email: 'purchasing@juancarlos.com', password: 'password123', role: 'purchasing', department: 'Purchasing' },
      { name: 'Creative Manager', email: 'creative@juancarlos.com', password: 'password123', role: 'creative', department: 'Creative' },
      { name: 'Linen Manager', email: 'linen@juancarlos.com', password: 'password123', role: 'linen', department: 'Linen' },
      { name: 'Admin', email: 'admin@juancarlos.com', password: 'admin123', role: 'admin', department: 'Admin' }
    ];

    await User.deleteMany({});
    await User.insertMany(users);

    res.json({ message: 'Users seeded successfully' });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
