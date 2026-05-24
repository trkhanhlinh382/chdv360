const Invoice = require('../models/Invoice');
const Apartment = require('../models/Apartment');
const Tenant = require('../models/Tenant');
const Building = require('../models/Building');
const Contract = require('../models/Contract');


// Helper to check building access for an apartment
const checkApartmentAccess = async (apartmentId, user) => {
  const apartment = await Apartment.findById(apartmentId);
  if (!apartment) return false;

  if (user.role === 'staff') {
    return user.assignedBuildings.map(id => id.toString()).includes(apartment.buildingId.toString());
  }
  return true;
};

// Helper to calculate invoice totals mathematically
const calculateInvoiceTotals = async (apartmentId, body) => {
  const apartment = await Apartment.findById(apartmentId).populate('buildingId');
  if (!apartment) throw new Error('Apartment not found');

  const building = apartment.buildingId;
  const tenant = await Tenant.findOne({ apartmentId, status: 'Active' });
  if (!tenant) throw new Error('No active tenant found for this apartment');

  const roomPrice = apartment.price;

  // 1. Electricity calculation
  const elecOld = Number(body.electricity?.oldIndex) || 0;
  const elecNew = Number(body.electricity?.newIndex) || 0;
  if (elecNew < elecOld) {
    throw new Error('New electricity index cannot be lower than the old index.');
  }
  const elecConsumption = elecNew - elecOld;
  const elecUnitPrice = Number(body.electricity?.unitPrice) || building.defaultFees.electricPrice;
  const elecTotal = elecConsumption * elecUnitPrice;

  // 2. Water calculation
  const waterOld = Number(body.water?.oldIndex) || 0;
  const waterNew = Number(body.water?.newIndex) || 0;
  if (waterNew < waterOld) {
    throw new Error('New water index cannot be lower than the old index.');
  }
  const waterConsumption = waterNew - waterOld;
  const waterUnitPrice = Number(body.water?.unitPrice) || building.defaultFees.waterPrice;
  const waterTotal = waterConsumption * waterUnitPrice;

  // 3. Service Fee
  const serviceFee = Number(body.serviceFee) !== undefined && Number(body.serviceFee) >= 0
    ? Number(body.serviceFee)
    : building.defaultFees.serviceFee;

  // 4. Parking Fee
  const vehiclesCount = tenant.vehicles ? tenant.vehicles.length : 0;
  const parkingFee = Number(body.parkingFee) !== undefined && Number(body.parkingFee) >= 0
    ? Number(body.parkingFee)
    : vehiclesCount * building.defaultFees.parkingFee;

  // 5. Other Fees (Dynamic Building Services Sync)
  let otherFees = body.otherFees;
  if (!otherFees || otherFees.length === 0) {
    otherFees = (building.services || [])
      .filter(s => s.active)
      .map(s => ({ description: s.name, amount: s.fee }));
  }
  const otherFeesTotal = otherFees.reduce((sum, fee) => sum + (Number(fee.amount) || 0), 0);


  // 6. Total Amount
  const totalAmount = roomPrice + elecTotal + waterTotal + serviceFee + parkingFee + otherFeesTotal;

  return {
    apartmentId,
    tenantId: tenant._id,
    billingMonth: body.billingMonth,
    roomPrice,
    electricity: {
      oldIndex: elecOld,
      newIndex: elecNew,
      consumption: elecConsumption,
      unitPrice: elecUnitPrice,
      total: elecTotal
    },
    water: {
      oldIndex: waterOld,
      newIndex: waterNew,
      consumption: waterConsumption,
      unitPrice: waterUnitPrice,
      total: waterTotal
    },
    serviceFee,
    parkingFee,
    otherFees,
    totalAmount,
    status: body.status || 'Unpaid',
    paymentDate: body.status === 'Paid' ? (body.paymentDate || new Date()) : null
  };
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
exports.getInvoices = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'staff') {
      const assignedApartments = await Apartment.find({ buildingId: { $in: req.user.assignedBuildings } });
      const apartmentIds = assignedApartments.map(apt => apt._id);
      query = { apartmentId: { $in: apartmentIds } };
    }

    const invoices = await Invoice.find(query)
      .populate('tenantId', 'name phone identityCard')
      .populate({
        path: 'apartmentId',
        select: 'name code floor price buildingId',
        populate: {
          path: 'buildingId',
          select: 'name code address defaultFees'
        }
      })
      .sort({ billingMonth: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
exports.getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('tenantId', 'name phone identityCard vehicles coResidents')
      .populate({
        path: 'apartmentId',
        select: 'name code floor price buildingId assets amenities',
        populate: {
          path: 'buildingId',
          select: 'name code address defaultFees'
        }
      });

    if (!invoice) {
      res.status(404);
      throw new Error('Invoice not found.');
    }

    // Staff access check
    const hasAccess = await checkApartmentAccess(invoice.apartmentId._id, req.user);
    if (!hasAccess) {
      res.status(403);
      throw new Error('You do not have permission to view this invoice.');
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create invoice
// @route   POST /api/invoices
// @access  Private
exports.createInvoice = async (req, res, next) => {
  try {
    const { apartmentId, billingMonth } = req.body;

    if (!apartmentId || !billingMonth) {
      res.status(400);
      throw new Error('Please specify apartmentId and billingMonth.');
    }

    // Verify access
    const hasAccess = await checkApartmentAccess(apartmentId, req.user);
    if (!hasAccess) {
      res.status(403);
      throw new Error('Access denied to this apartment.');
    }

    // Check if invoice already exists for this room & month
    const invoiceExists = await Invoice.findOne({ apartmentId, billingMonth });
    if (invoiceExists) {
      res.status(400);
      throw new Error(`An invoice for this apartment already exists for the month ${billingMonth}.`);
    }

    // Calculate billing values mathematically
    const computedInvoiceData = await calculateInvoiceTotals(apartmentId, req.body);
    const invoice = await Invoice.create(computedInvoiceData);

    res.status(201).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
exports.updateInvoice = async (req, res, next) => {
  try {
    let invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      res.status(404);
      throw new Error('Invoice not found.');
    }

    // Verify access
    const hasAccess = await checkApartmentAccess(invoice.apartmentId, req.user);
    if (!hasAccess) {
      res.status(403);
      throw new Error('Access denied.');
    }

    // Recalculate totals dynamically
    const computedInvoiceData = await calculateInvoiceTotals(invoice.apartmentId, req.body);
    
    invoice = await Invoice.findByIdAndUpdate(req.params.id, computedInvoiceData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private
exports.deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      res.status(404);
      throw new Error('Invoice not found.');
    }

    // Verify access
    const hasAccess = await checkApartmentAccess(invoice.apartmentId, req.user);
    if (!hasAccess) {
      res.status(403);
      throw new Error('Access denied.');
    }

    await Invoice.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get apartments due for invoice generation (due within 3 days or overdue)
// @route   GET /api/invoices/due
// @access  Private
exports.getDueInvoices = async (req, res, next) => {
  try {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentBillingMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    let query = { status: 'Occupied' };

    // Staff access check
    if (req.user.role === 'staff') {
      query.buildingId = { $in: req.user.assignedBuildings };
    }

    const apartments = await Apartment.find(query).populate('buildingId');
    const dueList = [];

    for (const apt of apartments) {
      // Find active contract
      const contract = await Contract.findOne({ apartmentId: apt._id, status: 'Active' });
      if (!contract) continue;

      // Find active tenant
      const tenant = await Tenant.findOne({ apartmentId: apt._id, status: 'Active' });
      if (!tenant) continue;

      // Check if invoice already exists for the current month
      const invoiceExists = await Invoice.findOne({ apartmentId: apt._id, billingMonth: currentBillingMonth });
      if (invoiceExists) continue;

      // Construct billing due date for current month
      const billingDay = contract.billingDate || 5;
      const dueDate = new Date(currentYear, currentMonth - 1, billingDay);

      // Check if due in 3 days or already overdue
      const timeDiff = dueDate.getTime() - today.getTime();
      const diffInDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (diffInDays <= 3) {
        // Find latest invoice to get old index
        const latestInvoice = await Invoice.findOne({ apartmentId: apt._id }).sort({ billingMonth: -1 });
        const elecOldIndex = latestInvoice ? latestInvoice.electricity.newIndex : 0;
        const waterOldIndex = latestInvoice ? latestInvoice.water.newIndex : 0;

        dueList.push({
          apartment: {
            _id: apt._id,
            name: apt.name,
            code: apt.code,
            price: apt.price,
            floor: apt.floor,
            buildingId: apt.buildingId
          },
          tenant: {
            _id: tenant._id,
            name: tenant.name,
            phone: tenant.phone,
            vehiclesCount: tenant.vehicles ? tenant.vehicles.length : 0
          },
          contract: {
            _id: contract._id,
            billingDate: billingDay,
            dueDate: dueDate.toISOString().split('T')[0]
          },
          oldIndices: {
            electricity: elecOldIndex,
            water: waterOldIndex
          },
          daysRemaining: diffInDays,
          status: diffInDays < 0 ? 'Overdue' : 'Due'
        });
      }
    }

    res.status(200).json({
      success: true,
      count: dueList.length,
      data: dueList
    });
  } catch (error) {
    next(error);
  }
};
