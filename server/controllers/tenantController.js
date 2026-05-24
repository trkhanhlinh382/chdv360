const Tenant = require('../models/Tenant');
const Apartment = require('../models/Apartment');
const Building = require('../models/Building');

// Helper to check building access for an apartment
const getApartmentWithAccessCheck = async (apartmentId, user) => {
  const apartment = await Apartment.findById(apartmentId);
  if (!apartment) return null;

  if (user.role === 'staff') {
    const hasAccess = user.assignedBuildings.map(id => id.toString()).includes(apartment.buildingId.toString());
    if (!hasAccess) return null;
  }
  return apartment;
};

// Helper to check parking capacity status for a building
const calculateParkingCapacityWarning = async (buildingId, currentTenantId = null, extraVehiclesCount = 0) => {
  const building = await Building.findById(buildingId);
  if (!building) return { warning: null };

  const apartments = await Apartment.find({ buildingId: building._id });
  const apartmentIds = apartments.map(apt => apt._id);

  // Find all active tenants in this building
  const query = { apartmentId: { $in: apartmentIds }, status: 'Active' };
  if (currentTenantId) {
    query._id = { $ne: currentTenantId }; // Exclude current tenant if updating
  }

  const tenants = await Tenant.find(query);
  
  // Calculate total vehicles already registered
  let totalVehicles = tenants.reduce((total, t) => {
    return total + (t.vehicles ? t.vehicles.length : 0);
  }, 0);

  totalVehicles += extraVehiclesCount;

  if (totalVehicles > building.parkingCapacity) {
    return {
      warning: `Bãi xe tòa nhà '${building.name}' đã vượt quá sức chứa (${totalVehicles}/${building.parkingCapacity} xe).`,
      total: totalVehicles,
      capacity: building.parkingCapacity
    };
  }

  return { warning: null, total: totalVehicles, capacity: building.parkingCapacity };
};

// @desc    Get all tenants
// @route   GET /api/tenants
// @access  Private
exports.getTenants = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'staff') {
      const assignedApartments = await Apartment.find({ buildingId: { $in: req.user.assignedBuildings } });
      const apartmentIds = assignedApartments.map(apt => apt._id);
      query = { apartmentId: { $in: apartmentIds } };
    }

    const tenants = await Tenant.find(query)
      .populate({
        path: 'apartmentId',
        select: 'name code floor price buildingId',
        populate: {
          path: 'buildingId',
          select: 'name code address defaultFees parkingCapacity'
        }
      });

    res.status(200).json({
      success: true,
      count: tenants.length,
      data: tenants
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single tenant
// @route   GET /api/tenants/:id
// @access  Private
exports.getTenantById = async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.params.id)
      .populate({
        path: 'apartmentId',
        select: 'name code floor price buildingId',
        populate: {
          path: 'buildingId',
          select: 'name code address defaultFees'
        }
      });

    if (!tenant) {
      res.status(404);
      throw new Error('Tenant not found.');
    }

    // Staff access check
    const apartment = await getApartmentWithAccessCheck(tenant.apartmentId._id, req.user);
    if (!apartment) {
      res.status(403);
      throw new Error('You do not have permission to view this tenant.');
    }

    res.status(200).json({
      success: true,
      data: tenant
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create tenant
// @route   POST /api/tenants
// @access  Private
exports.createTenant = async (req, res, next) => {
  try {
    const { apartmentId, vehicles, name } = req.body;

    if (!apartmentId) {
      res.status(400);
      throw new Error('Please specify apartmentId.');
    }

    // Verify apartment access
    const apartment = await getApartmentWithAccessCheck(apartmentId, req.user);
    if (!apartment) {
      res.status(403);
      throw new Error('Apartment not found or access denied.');
    }

    if (apartment.status === 'Occupied') {
      res.status(400);
      throw new Error('Apartment is already occupied.');
    }

    // Check parking capacity
    const newVehiclesCount = vehicles ? vehicles.length : 0;
    const parkingStatus = await calculateParkingCapacityWarning(apartment.buildingId, null, newVehiclesCount);

    // Create tenant
    const tenant = await Tenant.create(req.body);

    // Set apartment status to Occupied
    apartment.status = 'Occupied';
    await apartment.save();

    res.status(201).json({
      success: true,
      data: tenant,
      parkingWarning: parkingStatus.warning
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update tenant
// @route   PUT /api/tenants/:id
// @access  Private
exports.updateTenant = async (req, res, next) => {
  try {
    let tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      res.status(404);
      throw new Error('Tenant not found.');
    }

    // Verify apartment access
    const apartment = await getApartmentWithAccessCheck(tenant.apartmentId, req.user);
    if (!apartment) {
      res.status(403);
      throw new Error('Access denied.');
    }

    // Check parking capacity if vehicles changed
    const newVehiclesCount = req.body.vehicles ? req.body.vehicles.length : 0;
    const parkingStatus = await calculateParkingCapacityWarning(apartment.buildingId, tenant._id, newVehiclesCount);

    tenant = await Tenant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: tenant,
      parkingWarning: parkingStatus.warning
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete tenant
// @route   DELETE /api/tenants/:id
// @access  Private
exports.deleteTenant = async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      res.status(404);
      throw new Error('Tenant not found.');
    }

    // Verify apartment access
    const apartment = await getApartmentWithAccessCheck(tenant.apartmentId, req.user);
    if (!apartment) {
      res.status(403);
      throw new Error('Access denied.');
    }

    // Delete associated active contracts first, if any
    const Contract = require('../models/Contract');
    await Contract.deleteOne({ apartmentId: tenant.apartmentId });

    // Set apartment status back to Vacant
    apartment.status = 'Vacant';
    await apartment.save();

    await Tenant.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Tenant and associated contract deleted successfully, apartment status reverted to Vacant.'
    });
  } catch (error) {
    next(error);
  }
};
