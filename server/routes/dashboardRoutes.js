const express = require('express');
const router = express.Router();
const { getDashboardStats, getFinancialStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/financials', getFinancialStats);

module.exports = router;

