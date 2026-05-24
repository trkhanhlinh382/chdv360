const Building = require('../models/Building');

// @desc    Get all buildings
// @route   GET /api/buildings
// @access  Private
exports.getBuildings = async (req, res, next) => {
  try {
    let query = {};

    // If Staff, filter by assigned buildings
    if (req.user.role === 'staff') {
      query = { _id: { $in: req.user.assignedBuildings } };
    }

    const buildings = await Building.find(query);
    res.status(200).json({
      success: true,
      count: buildings.length,
      data: buildings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single building
// @route   GET /api/buildings/:id
// @access  Private
exports.getBuildingById = async (req, res, next) => {
  try {
    const building = await Building.findById(req.params.id);

    if (!building) {
      res.status(404);
      throw new Error('Building not found.');
    }

    // Role check for staff
    if (req.user.role === 'staff' && !req.user.assignedBuildings.includes(building._id.toString())) {
      res.status(403);
      throw new Error('You do not have permission to access this building.');
    }

    res.status(200).json({
      success: true,
      data: building
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create building
// @route   POST /api/buildings
// @access  Private/Admin
exports.createBuilding = async (req, res, next) => {
  try {
    const building = await Building.create(req.body);
    res.status(201).json({
      success: true,
      data: building
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update building
// @route   PUT /api/buildings/:id
// @access  Private/Admin
exports.updateBuilding = async (req, res, next) => {
  try {
    let building = await Building.findById(req.params.id);

    if (!building) {
      res.status(404);
      throw new Error('Building not found.');
    }

    building = await Building.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: building
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete building
// @route   DELETE /api/buildings/:id
// @access  Private/Admin
exports.deleteBuilding = async (req, res, next) => {
  try {
    const building = await Building.findById(req.params.id);

    if (!building) {
      res.status(404);
      throw new Error('Building not found.');
    }

    // Check if there are apartments in this building
    const Apartment = require('../models/Apartment');
    const hasApartments = await Apartment.findOne({ buildingId: req.params.id });
    if (hasApartments) {
      res.status(400);
      throw new Error('Cannot delete building with active apartments. Please delete all apartments in this building first.');
    }

    await Building.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Building deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
