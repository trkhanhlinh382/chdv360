const express = require('express');
const router = express.Router();
const { getTenants, getTenantById, createTenant, updateTenant, deleteTenant } = require('../controllers/tenantController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getTenants)
  .post(createTenant);

router.route('/:id')
  .get(getTenantById)
  .put(updateTenant)
  .delete(deleteTenant);

module.exports = router;
