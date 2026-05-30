const Contract = require('../models/Contract');
const Apartment = require('../models/Apartment');
const Tenant = require('../models/Tenant');

// Helper to check building access for an apartment
const checkApartmentAccess = async (apartmentId, user) => {
  const apartment = await Apartment.findById(apartmentId);
  if (!apartment) return false;

  if (user.role === 'staff') {
    return user.assignedBuildings.map(id => id.toString()).includes(apartment.buildingId.toString());
  }
  return true;
};

// @desc    Get all contracts
// @route   GET /api/contracts
// @access  Private
exports.getContracts = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'staff') {
      const assignedApartments = await Apartment.find({ buildingId: { $in: req.user.assignedBuildings } });
      const apartmentIds = assignedApartments.map(apt => apt._id);
      query = { apartmentId: { $in: apartmentIds } };
    }

    if (req.query.apartmentId) {
      query.apartmentId = req.query.apartmentId;
    }

    const contracts = await Contract.find(query)
      .populate('tenantId', 'name phone identityCard')
      .populate({
        path: 'apartmentId',
        select: 'name code floor price buildingId',
        populate: {
          path: 'buildingId',
          select: 'name code address'
        }
      })
      .lean();

    res.status(200).json({
      success: true,
      count: contracts.length,
      data: contracts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single contract
// @route   GET /api/contracts/:id
// @access  Private
exports.getContractById = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('tenantId', 'name phone identityCard')
      .populate({
        path: 'apartmentId',
        select: 'name code floor price buildingId',
        populate: {
          path: 'buildingId',
          select: 'name code address defaultFees'
        }
      })
      .lean();

    if (!contract) {
      res.status(404);
      throw new Error('Contract not found.');
    }

    // Staff access check
    const hasAccess = await checkApartmentAccess(contract.apartmentId._id, req.user);
    if (!hasAccess) {
      res.status(403);
      throw new Error('You do not have permission to view this contract.');
    }

    res.status(200).json({
      success: true,
      data: contract
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create contract
// @route   POST /api/contracts
// @access  Private
exports.createContract = async (req, res, next) => {
  try {
    const { apartmentId, tenantId } = req.body;

    if (!apartmentId || !tenantId) {
      res.status(400);
      throw new Error('Please specify apartmentId and tenantId.');
    }

    // Verify access to apartment
    const hasAccess = await checkApartmentAccess(apartmentId, req.user);
    if (!hasAccess) {
      res.status(403);
      throw new Error('Access denied to this apartment.');
    }

    // Verify tenant exists and is assigned to the apartment
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      res.status(404);
      throw new Error('Tenant not found.');
    }

    if (tenant.apartmentId.toString() !== apartmentId.toString()) {
      res.status(400);
      throw new Error('This tenant does not belong to the selected apartment.');
    }

    // Check if contract already exists for the apartment
    const contractExists = await Contract.findOne({ apartmentId });
    if (contractExists) {
      res.status(400);
      throw new Error('An active contract already exists for this apartment.');
    }

    const contract = await Contract.create(req.body);

    res.status(201).json({
      success: true,
      data: contract
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update contract
// @route   PUT /api/contracts/:id
// @access  Private
exports.updateContract = async (req, res, next) => {
  try {
    let contract = await Contract.findById(req.params.id);

    if (!contract) {
      res.status(404);
      throw new Error('Contract not found.');
    }

    // Verify access
    const hasAccess = await checkApartmentAccess(contract.apartmentId, req.user);
    if (!hasAccess) {
      res.status(403);
      throw new Error('Access denied.');
    }

    contract = await Contract.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: contract
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete contract
// @route   DELETE /api/contracts/:id
// @access  Private
exports.deleteContract = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      res.status(404);
      throw new Error('Contract not found.');
    }

    // Verify access
    const hasAccess = await checkApartmentAccess(contract.apartmentId, req.user);
    if (!hasAccess) {
      res.status(403);
      throw new Error('Access denied.');
    }

    await Contract.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Contract deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
