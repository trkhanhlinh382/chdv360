const Apartment = require('../models/Apartment');
const Building = require('../models/Building');

// Helper to check if staff has access to a building
const checkBuildingAccess = (user, buildingId) => {
  if (user.role === 'admin') return true;
  return user.assignedBuildings.map(id => id.toString()).includes(buildingId.toString());
};

// @desc    Get all apartments
// @route   GET /api/apartments
// @access  Private
exports.getApartments = async (req, res, next) => {
  try {
    let query = {};
    const { buildingId } = req.query;

    if (buildingId) {
      query.buildingId = buildingId;
      // Staff access check for specific building filter
      if (req.user.role === 'staff' && !checkBuildingAccess(req.user, buildingId)) {
        res.status(403);
        throw new Error('You do not have permission to access apartments in this building.');
      }
    } else if (req.user.role === 'staff') {
      // General staff filter: only apartments in assigned buildings
      query.buildingId = { $in: req.user.assignedBuildings };
    }

    const apartments = await Apartment.find(query)
      .select('-images -assets')
      .populate('buildingId', 'name code address')
      .lean();
    res.status(200).json({
      success: true,
      count: apartments.length,
      data: apartments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single apartment
// @route   GET /api/apartments/:id
// @access  Private
exports.getApartmentById = async (req, res, next) => {
  try {
    const apartment = await Apartment.findById(req.params.id)
      .populate('buildingId', 'name code address defaultFees')
      .lean();

    if (!apartment) {
      res.status(404);
      throw new Error('Apartment not found.');
    }

    // Staff access check
    if (req.user.role === 'staff' && !checkBuildingAccess(req.user, apartment.buildingId._id)) {
      res.status(403);
      throw new Error('You do not have permission to view this apartment.');
    }

    res.status(200).json({
      success: true,
      data: apartment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create apartment
// @route   POST /api/apartments
// @access  Private
exports.createApartment = async (req, res, next) => {
  try {
    const { buildingId } = req.body;

    if (!buildingId) {
      res.status(400);
      throw new Error('Please specify buildingId.');
    }

    const building = await Building.findById(buildingId);
    if (!building) {
      res.status(404);
      throw new Error('Building not found.');
    }

    // Staff access check
    if (!checkBuildingAccess(req.user, buildingId)) {
      res.status(403);
      throw new Error('You do not have permission to add apartments to this building.');
    }

    const apartment = await Apartment.create(req.body);
    res.status(201).json({
      success: true,
      data: apartment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update apartment
// @route   PUT /api/apartments/:id
// @access  Private
exports.updateApartment = async (req, res, next) => {
  try {
    let apartment = await Apartment.findById(req.params.id);

    if (!apartment) {
      res.status(404);
      throw new Error('Apartment not found.');
    }

    // Staff access check
    if (!checkBuildingAccess(req.user, apartment.buildingId)) {
      res.status(403);
      throw new Error('You do not have permission to modify this apartment.');
    }

    apartment = await Apartment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: apartment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete apartment
// @route   DELETE /api/apartments/:id
// @access  Private
exports.deleteApartment = async (req, res, next) => {
  try {
    const apartment = await Apartment.findById(req.params.id);

    if (!apartment) {
      res.status(404);
      throw new Error('Apartment not found.');
    }

    // Staff access check
    if (!checkBuildingAccess(req.user, apartment.buildingId)) {
      res.status(403);
      throw new Error('You do not have permission to delete this apartment.');
    }

    // Verify if occupied
    if (apartment.status === 'Occupied') {
      res.status(400);
      throw new Error('Cannot delete an occupied apartment. Please terminate the contract and remove the tenant first.');
    }

    await Apartment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Apartment deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
