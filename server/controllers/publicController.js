const Building = require('../models/Building');
const Apartment = require('../models/Apartment');

// Helper to map Building to client expectations
const mapBuildingForClient = (b) => {
  if (!b) return null;
  return {
    id: String(b._id),
    _id: b._id,
    code: b.code,
    name: b.name,
    region: b.region,
    address: b.address,
    images: b.images && b.images.length > 0 ? b.images : [
      'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=800&q=80'
    ],
    fees: [
      { id: '1', name: 'Tiền điện', price: b.defaultFees?.electricPrice || 4000, unit: 'kWh' },
      { id: '2', name: 'Tiền nước', price: b.defaultFees?.waterPrice || 30000, unit: 'm³' },
      { id: '3', name: 'Phí dịch vụ', price: b.defaultFees?.serviceFee || 150000, unit: 'phòng/tháng' },
      { id: '4', name: 'Phí giữ xe', price: b.defaultFees?.parkingFee || 100000, unit: 'xe/tháng' }
    ],
    amenities: [
      `${b.numberOfFloors || 1} tầng`,
      `Bãi xe sức chứa ${b.parkingCapacity || 20} xe`,
      'Bảo vệ an ninh 24/7'
    ],
    coordinates: { lat: 10.762622, lng: 106.660172 },
    active: b.active
  };
};

// Helper to map Apartment to client expectations
const mapApartmentForClient = (a) => {
  if (!a) return null;
  
  // Resolve building fees if populated
  const bFees = a.buildingId?.defaultFees || {
    electricPrice: 4000,
    waterPrice: 30000,
    serviceFee: 150000
  };

  return {
    id: String(a._id),
    _id: a._id,
    buildingId: String(a.buildingId?._id || a.buildingId),
    title: `${a.name} - ${a.type}`,
    code: a.code,
    area: a.area,
    maxTenants: a.maxTenants,
    deposit: a.deposit,
    status: {
      id: a.status === 'Occupied' ? '2' : '1',
      title: a.status === 'Occupied' ? 'Đã thuê' : 'Trống'
    },
    floor: { name: a.floor },
    type: { name: a.type },
    apartment: { name: a.buildingId?.name || 'Tòa nhà' },
    price: {
      base: a.price,
      electric: bFees.electricPrice,
      water: bFees.waterPrice,
      service: bFees.serviceFee
    },
    amenities: a.amenities && a.amenities.length > 0 ? a.amenities : ['Máy lạnh', 'Tủ quần áo', 'Giường nệm'],
    images: a.images && a.images.length > 0 ? a.images : [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'
    ],
    contact: {
      phone: '0927 360 360',
      zalo: 'https://zalo.me/0927360360'
    }
  };
};

// @desc    Get public dashboard summary
// @route   GET /api/public/dashboard-summary
// @access  Public
exports.getDashboardSummary = async (req, res, next) => {
  try {
    const buildings = await Building.find({ active: true }).select('_id').lean();
    const apartments = await Apartment.find().select('status maxTenants').lean();

    const totalBuildings = buildings.length;
    const totalApartments = apartments.length;
    const occupiedCount = apartments.filter(apt => apt.status === 'Occupied').length;
    
    const totalBeds = apartments.reduce((sum, apt) => {
      if (apt.status === 'Vacant') {
        return sum + (apt.maxTenants || 2);
      }
      return sum;
    }, 0);

    const occupancyRate = totalApartments > 0
      ? Math.round((occupiedCount / totalApartments) * 100)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalBuildings,
        totalApartments,
        totalBeds,
        occupancyRate
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active buildings for public listing
// @route   GET /api/public/buildings
// @access  Public
exports.getBuildings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    let query = { active: true };

    let total = await Building.countDocuments(query);
    let buildingsQuery = Building.find(query);

    if (page && limit) {
      const skip = (page - 1) * limit;
      buildingsQuery = buildingsQuery.skip(skip).limit(limit);
    } else if (limit) {
      buildingsQuery = buildingsQuery.limit(limit);
    }

    const buildings = await buildingsQuery.lean();

    res.status(200).json({
      success: true,
      total,
      page: page || 1,
      limit: limit || total,
      data: buildings.map(mapBuildingForClient)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get building by ID
// @route   GET /api/public/buildings/:id
// @access  Public
exports.getBuildingById = async (req, res, next) => {
  try {
    const building = await Building.findById(req.params.id).lean();

    if (!building || !building.active) {
      res.status(404);
      throw new Error('Building not found or is inactive.');
    }

    res.status(200).json({
      success: true,
      data: mapBuildingForClient(building)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all vacant/active apartments
// @route   GET /api/public/apartments
// @access  Public
exports.getApartments = async (req, res, next) => {
  try {
    const { buildingId, status, page, limit, keyword, priceRange, areaRange, sort, area } = req.query;
    let query = {};

    // 1. Get all active building IDs
    const activeBuildings = await Building.find({ active: true }).select('_id').lean();
    const activeBuildingIds = activeBuildings.map(b => b._id);

    // 2. Set buildingId filter and verify active status
    if (buildingId) {
      if (activeBuildingIds.some(id => String(id) === String(buildingId))) {
        query.buildingId = buildingId;
      } else {
        query.buildingId = null; // Inactive or invalid building matches nothing
      }
    } else {
      query.buildingId = { $in: activeBuildingIds };
    }

    // 3. Set area (region) filter on MongoDB level
    if (area) {
      const buildingsInRegion = await Building.find({ region: area, active: true }).select('_id').lean();
      const regionBuildingIds = buildingsInRegion.map(b => b._id);
      
      if (query.buildingId && query.buildingId !== null) {
        // If a specific building filter is set, ensure it belongs to the selected region
        const specificBuildingId = String(query.buildingId?.$in ? '' : query.buildingId);
        const isMatched = regionBuildingIds.some(id => String(id) === specificBuildingId);
        if (!isMatched) {
          query.buildingId = null;
        }
      } else {
        query.buildingId = { $in: regionBuildingIds };
      }
    }
    
    if (status) {
      query.status = status;
    }

    // 4. Advanced keyword matching building names and addresses directly
    if (keyword) {
      const regex = new RegExp(keyword.trim(), 'i');
      const matchingBuildings = await Building.find({
        $or: [
          { name: regex },
          { address: regex }
        ],
        active: true
      }).select('_id').lean();
      
      const matchingBuildingIds = matchingBuildings.map(b => b._id);
      
      query.$or = [
        { name: regex },
        { code: regex },
        { floor: regex },
        { type: regex },
        { buildingId: { $in: matchingBuildingIds } }
      ];
    }

    if (priceRange) {
      if (priceRange === 'under-5') query.price = { $lt: 5000000 };
      else if (priceRange === '5-8') query.price = { $gte: 5000000, $lte: 8000000 };
      else if (priceRange === '8-12') query.price = { $gt: 8000000, $lte: 12000000 };
      else if (priceRange === 'over-12') query.price = { $gt: 12000000 };
    }

    if (areaRange) {
      if (areaRange === 'under-20') query.area = { $lt: 20 };
      else if (areaRange === '20-30') query.area = { $gte: 20, $lte: 30 };
      else if (areaRange === '30-45') query.area = { $gt: 30, $lte: 45 };
      else if (areaRange === 'over-45') query.area = { $gt: 45 };
    }

    let sortOption = {};
    if (sort === 'price-desc') {
      sortOption.price = -1;
    } else {
      sortOption.price = 1; // Default
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // 5. Query counts and paginated results directly in DB with allowDiskUse
    const total = await Apartment.countDocuments(query);
    
    let apartmentsQuery = Apartment.find(query)
      .populate('buildingId')
      .sort(sortOption)
      .allowDiskUse();

    if (pageNum && limitNum) {
      const skip = (pageNum - 1) * limitNum;
      apartmentsQuery = apartmentsQuery.skip(skip).limit(limitNum);
    } else if (limitNum) {
      apartmentsQuery = apartmentsQuery.limit(limitNum);
    }

    const apartments = await apartmentsQuery.lean();

    res.status(200).json({
      success: true,
      total,
      page: pageNum || 1,
      limit: limitNum || total,
      data: apartments.map(mapApartmentForClient)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get apartment by ID
// @route   GET /api/public/apartments/:id
// @access  Public
exports.getApartmentById = async (req, res, next) => {
  try {
    const apartment = await Apartment.findById(req.params.id).populate('buildingId').lean();

    if (!apartment || !apartment.buildingId || !apartment.buildingId.active) {
      res.status(404);
      throw new Error('Apartment not found.');
    }

    res.status(200).json({
      success: true,
      data: mapApartmentForClient(apartment)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get apartments in a building
// @route   GET /api/public/buildings/:buildingId/apartments
// @access  Public
exports.getApartmentsByBuilding = async (req, res, next) => {
  try {
    const building = await Building.findById(req.params.buildingId).lean();
    if (!building || !building.active) {
      res.status(404);
      throw new Error('Building not found.');
    }

    const apartments = await Apartment.find({ buildingId: req.params.buildingId }).populate('buildingId').lean();
    res.status(200).json({
      success: true,
      data: apartments.map(mapApartmentForClient)
    });
  } catch (error) {
    next(error);
  }
};
