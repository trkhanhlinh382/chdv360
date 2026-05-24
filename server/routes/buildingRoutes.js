const express = require('express');
const router = express.Router();
const { getBuildings, getBuildingById, createBuilding, updateBuilding, deleteBuilding } = require('../controllers/buildingController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getBuildings)
  .post(authorize('admin'), createBuilding);

router.route('/:id')
  .get(getBuildingById)
  .put(authorize('admin'), updateBuilding)
  .delete(authorize('admin'), deleteBuilding);

module.exports = router;
