const express = require('express');
const router = express.Router();
const {
  getDashboardSummary,
  getBuildings,
  getBuildingById,
  getApartments,
  getApartmentById,
  getApartmentsByBuilding
} = require('../controllers/publicController');

router.get('/dashboard-summary', getDashboardSummary);
router.get('/buildings', getBuildings);
router.get('/buildings/:id', getBuildingById);
router.get('/apartments', getApartments);
router.get('/apartments/:id', getApartmentById);
router.get('/buildings/:buildingId/apartments', getApartmentsByBuilding);

module.exports = router;
