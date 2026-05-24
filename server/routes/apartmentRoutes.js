const express = require('express');
const router = express.Router();
const { getApartments, getApartmentById, createApartment, updateApartment, deleteApartment } = require('../controllers/apartmentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getApartments)
  .post(createApartment);

router.route('/:id')
  .get(getApartmentById)
  .put(updateApartment)
  .delete(deleteApartment);

module.exports = router;
