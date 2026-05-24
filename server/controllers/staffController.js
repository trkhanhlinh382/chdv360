const User = require('../models/User');

// @desc    Get all staff
// @route   GET /api/staff
// @access  Private/Admin
exports.getStaff = async (req, res, next) => {
  try {
    const staff = await User.find({ role: 'staff' }).populate('assignedBuildings');
    res.status(200).json({
      success: true,
      count: staff.length,
      data: staff
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a staff member
// @route   POST /api/staff
// @access  Private/Admin
exports.createStaff = async (req, res, next) => {
  try {
    const { name, phone, password, assignedBuildings } = req.body;

    if (!name || !phone || !password) {
      res.status(400);
      throw new Error('Please fill in name, phone, and password');
    }

    // Check if phone number is already registered
    const userExists = await User.findOne({ phone });
    if (userExists) {
      res.status(400);
      throw new Error('Phone number is already registered.');
    }

    const staff = await User.create({
      name,
      phone,
      password,
      role: 'staff',
      assignedBuildings: assignedBuildings || []
    });

    res.status(201).json({
      success: true,
      data: staff
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a staff member
// @route   PUT /api/staff/:id
// @access  Private/Admin
exports.updateStaff = async (req, res, next) => {
  try {
    const { name, phone, password, assignedBuildings, active } = req.body;
    let staff = await User.findById(req.params.id);

    if (!staff) {
      res.status(404);
      throw new Error('Staff member not found.');
    }

    // Check phone unique
    if (phone && phone !== staff.phone) {
      const userExists = await User.findOne({ phone });
      if (userExists) {
        res.status(400);
        throw new Error('Phone number is already taken.');
      }
      staff.phone = phone;
    }

    if (name) staff.name = name;
    if (assignedBuildings) staff.assignedBuildings = assignedBuildings;
    if (active !== undefined) staff.active = active;
    
    // Hash password if modified
    if (password) {
      staff.password = password; // pre-save hook will hash it
    }

    await staff.save();
    
    const updatedStaff = await User.findById(req.params.id).populate('assignedBuildings');

    res.status(200).json({
      success: true,
      data: updatedStaff
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a staff member
// @route   DELETE /api/staff/:id
// @access  Private/Admin
exports.deleteStaff = async (req, res, next) => {
  try {
    const staff = await User.findById(req.params.id);

    if (!staff) {
      res.status(404);
      throw new Error('Staff member not found.');
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Staff member deleted.'
    });
  } catch (error) {
    next(error);
  }
};
