const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @desc    Auth user & get token (Admin & Staff)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      res.status(400);
      throw new Error('Please provide phone number and password');
    }

    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

    // 1. Check if matches env Admin credentials
    if (phone === adminUsername && password === adminPassword) {
      const token = jwt.sign(
        { id: 'admin', role: 'admin' },
        process.env.JWT_SECRET || 'supersecretjwtkeychdv360plusforpropertymanagement',
        { expiresIn: '30d' }
      );

      return res.status(200).json({
        success: true,
        token,
        user: {
          id: 'admin',
          name: 'System Admin',
          phone: adminUsername,
          role: 'admin',
          assignedBuildings: []
        }
      });
    }

    // 2. Check Database for Staff users
    const user = await User.findOne({ phone }).populate('assignedBuildings');
    if (!user) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    if (!user.active) {
      res.status(401);
      throw new Error('Your account has been deactivated.');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'supersecretjwtkeychdv360plusforpropertymanagement',
      { expiresIn: '30d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        assignedBuildings: user.assignedBuildings
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};
