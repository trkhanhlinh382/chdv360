const Building = require('../models/Building');
const Apartment = require('../models/Apartment');
const Tenant = require('../models/Tenant');
const Contract = require('../models/Contract');
const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');


// @desc    Get dashboard statistics for Admin or Staff
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    let buildingQuery = {};
    let apartmentQuery = {};

    // 1. Filter by assigned buildings for Staff
    if (req.user.role === 'staff') {
      buildingQuery = { _id: { $in: req.user.assignedBuildings } };
      apartmentQuery = { buildingId: { $in: req.user.assignedBuildings } };
    }

    // 2. Fetch Buildings & Apartments (Optimized with projection and lean)
    const buildings = await Building.find(buildingQuery)
      .select('name code parkingCapacity')
      .lean();
    const apartments = await Apartment.find(apartmentQuery)
      .select('buildingId status name code')
      .lean();
    const apartmentIds = apartments.map(apt => apt._id);

    const totalBuildingsCount = buildings.length;
    const totalApartmentsCount = apartments.length;

    // Status breakdowns
    const vacantCount = apartments.filter(apt => apt.status === 'Vacant').length;
    const occupiedCount = apartments.filter(apt => apt.status === 'Occupied').length;
    const maintenanceCount = apartments.filter(apt => apt.status === 'Maintenance').length;
    const occupancyRate = totalApartmentsCount > 0 
      ? Math.round((occupiedCount / totalApartmentsCount) * 100)
      : 0;

    // 3. Fetch Tenant Stats (Active tenants under these apartments - Optimized with projection and lean)
    const tenants = await Tenant.find({ apartmentId: { $in: apartmentIds }, status: 'Active' })
      .select('apartmentId coResidents vehicles')
      .lean();
    const totalPrimaryTenants = tenants.length;
    const totalCoResidents = tenants.reduce((sum, t) => sum + (t.coResidents ? t.coResidents.length : 0), 0);
    const totalResidents = totalPrimaryTenants + totalCoResidents;

    // 4. Fetch Vehicle Stats & Parking Capacity Alerts
    const totalVehicles = tenants.reduce((sum, t) => sum + (t.vehicles ? t.vehicles.length : 0), 0);
    const totalParkingCapacity = buildings.reduce((sum, b) => sum + (b.parkingCapacity || 0), 0);

    // Calculate vehicle counts per building to detect parking limit issues
    const parkingStatusAlerts = [];
    const buildingBreakdowns = [];

    for (const building of buildings) {
      const bApartments = apartments.filter(apt => apt.buildingId && apt.buildingId.toString() === building._id.toString());
      const bApartmentIds = bApartments.map(apt => apt._id);
      
      const bTenants = tenants.filter(t => t.apartmentId && bApartmentIds.map(id => id.toString()).includes(t.apartmentId.toString()));
      const bVehiclesCount = bTenants.reduce((sum, t) => sum + (t.vehicles ? t.vehicles.length : 0), 0);
      
      const bOccupiedCount = bApartments.filter(apt => apt.status === 'Occupied').length;
      const bVacantCount = bApartments.filter(apt => apt.status === 'Vacant').length;
      const bRate = bApartments.length > 0 ? Math.round((bOccupiedCount / bApartments.length) * 100) : 0;
      
      const usagePercent = building.parkingCapacity > 0
        ? Math.round((bVehiclesCount / building.parkingCapacity) * 100)
        : 0;

      buildingBreakdowns.push({
        buildingId: building._id,
        name: building.name,
        code: building.code,
        totalRooms: bApartments.length,
        occupiedRooms: bOccupiedCount,
        vacantRooms: bVacantCount,
        occupancyRate: bRate,
        registeredVehicles: bVehiclesCount,
        parkingCapacity: building.parkingCapacity,
        parkingUsagePercent: usagePercent
      });

      // Add parking alerts for building above 80% parking capacity
      if (usagePercent >= 80) {
        parkingStatusAlerts.push({
          buildingName: building.name,
          buildingCode: building.code,
          registeredVehicles: bVehiclesCount,
          capacity: building.parkingCapacity,
          percentage: usagePercent
        });
      }
    }

    // 5. Projected Monthly Revenue (Sum of rent in active contracts - Optimized with projection and lean)
    const contracts = await Contract.find({ apartmentId: { $in: apartmentIds }, status: 'Active' })
      .select('apartmentId rentalPrice')
      .lean();
    const projectedMonthlyRevenue = contracts.reduce((sum, c) => sum + (c.rentalPrice || 0), 0);

    // 6. Realized Cash Flow & Unpaid Debts (Based on monthly invoices)
    // We check invoices generated for the current calendar month
    const currentDate = new Date();
    const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Optimized with projection and lean
    const invoices = await Invoice.find({ apartmentId: { $in: apartmentIds } })
      .select('apartmentId billingMonth status totalAmount')
      .lean();
    const currentMonthInvoices = invoices.filter(inv => inv.billingMonth === currentMonthStr);

    const collectedRevenue = invoices
      .filter(inv => inv.status === 'Paid')
      .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

    const outstandingDebt = invoices
      .filter(inv => inv.status === 'Unpaid')
      .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

    // 7. Expiring Contracts (Within next 30 days - Optimized with projection and lean)
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const expiringContracts = await Contract.find({
      apartmentId: { $in: apartmentIds },
      status: 'Active',
      endDate: { $gte: new Date(), $lte: thirtyDaysFromNow }
    })
    .select('contractNumber endDate tenantId apartmentId')
    .populate('tenantId', 'name phone')
    .populate({
      path: 'apartmentId',
      select: 'name code buildingId',
      populate: { path: 'buildingId', select: 'name code' }
    })
    .sort({ endDate: 1 })
    .lean();

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalBuildings: totalBuildingsCount,
          totalApartments: totalApartmentsCount,
          vacantApartments: vacantCount,
          occupiedApartments: occupiedCount,
          maintenanceApartments: maintenanceCount,
          occupancyRate,
          totalPrimaryTenants,
          totalCoResidents,
          totalResidents,
          totalVehicles,
          totalParkingCapacity,
          projectedMonthlyRevenue,
          collectedRevenue,
          outstandingDebt
        },
        parkingStatusAlerts,
        buildingBreakdowns,
        expiringContracts: expiringContracts.map(c => ({
          contractId: c._id,
          contractNumber: c.contractNumber,
          tenantName: c.tenantId?.name || 'N/A',
          tenantPhone: c.tenantId?.phone || 'N/A',
          apartmentName: c.apartmentId?.name || 'N/A',
          apartmentCode: c.apartmentId?.code || 'N/A',
          buildingName: c.apartmentId?.buildingId?.name || 'N/A',
          endDate: c.endDate,
          daysRemaining: Math.ceil((new Date(c.endDate) - new Date()) / (1000 * 60 * 60 * 24))
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complete cash flow & financial stats
// @route   GET /api/dashboard/financials
// @access  Private
exports.getFinancialStats = async (req, res, next) => {
  try {
    let buildingQuery = {};
    let apartmentQuery = {};
    let expenseQuery = {};

    // 1. Filter by assigned buildings for Staff
    if (req.user.role === 'staff') {
      buildingQuery = { _id: { $in: req.user.assignedBuildings } };
      apartmentQuery = { buildingId: { $in: req.user.assignedBuildings } };
      expenseQuery = { buildingId: { $in: req.user.assignedBuildings } };
    }

    // Optimized with projection and lean
    const buildings = await Building.find(buildingQuery)
      .select('name code')
      .lean();
    const apartments = await Apartment.find(apartmentQuery)
      .select('buildingId status price name code')
      .lean();
    const apartmentIds = apartments.map(apt => apt._id);

    // Fetch Invoices and Expenses (Optimized with projection and lean)
    const invoices = await Invoice.find({ apartmentId: { $in: apartmentIds } })
      .select('apartmentId status totalAmount')
      .populate({
        path: 'apartmentId',
        select: 'name code buildingId'
      })
      .lean();
      
    const expenses = await Expense.find(expenseQuery)
      .select('buildingId title amount category date description')
      .populate('buildingId', 'name code')
      .lean();

    // Overall summary metrics
    const totalCollected = invoices
      .filter(inv => inv.status === 'Paid')
      .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

    const totalUnpaid = invoices
      .filter(inv => inv.status === 'Unpaid')
      .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

    // Opportunity Cost of Vacant Rooms
    const vacantRooms = apartments.filter(apt => apt.status === 'Vacant');
    const totalVacantOpportunityCost = vacantRooms.reduce((sum, apt) => sum + (apt.price || 0), 0);

    const netProfit = totalCollected - totalExpenses;

    // Building breakdowns
    const buildingBreakdowns = [];

    for (const b of buildings) {
      const bApartments = apartments.filter(apt => apt.buildingId && apt.buildingId.toString() === b._id.toString());
      const bApartmentIds = bApartments.map(apt => apt._id.toString());

      // Filter invoices for apartments in this building
      const bInvoices = invoices.filter(inv => inv.apartmentId && inv.apartmentId._id && bApartmentIds.includes(inv.apartmentId._id.toString()));
      const bExpenses = expenses.filter(exp => exp.buildingId && exp.buildingId._id && exp.buildingId._id.toString() === b._id.toString());

      const collected = bInvoices
        .filter(inv => inv.status === 'Paid')
        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

      const unpaid = bInvoices
        .filter(inv => inv.status === 'Unpaid')
        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

      const expensesSum = bExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

      const vacant = bApartments.filter(apt => apt.status === 'Vacant');
      const vacantCost = vacant.reduce((sum, apt) => sum + (apt.price || 0), 0);

      const bNetProfit = collected - expensesSum;

      buildingBreakdowns.push({
        buildingId: b._id,
        name: b.name,
        code: b.code,
        collected,
        unpaid,
        expenses: expensesSum,
        vacantOpportunityCost: vacantCost,
        netProfit: bNetProfit
      });
    }

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalCollected,
          totalUnpaid,
          totalExpenses,
          totalVacantOpportunityCost,
          netProfit
        },
        buildingBreakdowns,
        expenses: expenses.map(exp => ({
          _id: exp._id,
          buildingName: exp.buildingId?.name || 'N/A',
          buildingCode: exp.buildingId?.code || 'N/A',
          title: exp.title,
          amount: exp.amount,
          category: exp.category,
          date: exp.date,
          description: exp.description
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

