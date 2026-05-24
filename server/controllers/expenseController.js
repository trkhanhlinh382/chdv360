const Expense = require('../models/Expense');
const Building = require('../models/Building');

// Helper to check building access for staff
const checkBuildingAccess = (buildingId, user) => {
  if (user.role === 'staff') {
    return user.assignedBuildings.map(id => id.toString()).includes(buildingId.toString());
  }
  return true;
};

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
exports.getExpenses = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'staff') {
      query.buildingId = { $in: req.user.assignedBuildings };
    }

    if (req.query.buildingId) {
      if (!checkBuildingAccess(req.query.buildingId, req.user)) {
        res.status(403);
        throw new Error('Access denied to this building.');
      }
      query.buildingId = req.query.buildingId;
    }

    if (req.query.category) {
      query.category = req.query.category;
    }

    const expenses = await Expense.find(query)
      .populate('buildingId', 'name code address')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
exports.getExpenseById = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id).populate('buildingId', 'name code address');

    if (!expense) {
      res.status(404);
      throw new Error('Expense not found.');
    }

    if (!checkBuildingAccess(expense.buildingId._id, req.user)) {
      res.status(403);
      throw new Error('Access denied to this building.');
    }

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create expense
// @route   POST /api/expenses
// @access  Private
exports.createExpense = async (req, res, next) => {
  try {
    const { buildingId, title, amount, category, date, description } = req.body;

    if (!buildingId || !title || !amount) {
      res.status(400);
      throw new Error('Please specify buildingId, title, and amount.');
    }

    if (!checkBuildingAccess(buildingId, req.user)) {
      res.status(403);
      throw new Error('Access denied to this building.');
    }

    const expense = await Expense.create({
      buildingId,
      title,
      amount,
      category,
      date: date || new Date(),
      description
    });

    res.status(201).json({
      success: true,
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
exports.updateExpense = async (req, res, next) => {
  try {
    let expense = await Expense.findById(req.params.id);

    if (!expense) {
      res.status(404);
      throw new Error('Expense not found.');
    }

    if (!checkBuildingAccess(expense.buildingId, req.user)) {
      res.status(403);
      throw new Error('Access denied to this building.');
    }

    // If changing building, check access for new building
    if (req.body.buildingId && !checkBuildingAccess(req.body.buildingId, req.user)) {
      res.status(403);
      throw new Error('Access denied to the target building.');
    }

    expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
exports.deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      res.status(404);
      throw new Error('Expense not found.');
    }

    if (!checkBuildingAccess(expense.buildingId, req.user)) {
      res.status(403);
      throw new Error('Access denied to this building.');
    }

    await Expense.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
