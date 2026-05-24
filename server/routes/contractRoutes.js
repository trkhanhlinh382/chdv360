const express = require('express');
const router = express.Router();
const { getContracts, getContractById, createContract, updateContract, deleteContract } = require('../controllers/contractController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getContracts)
  .post(createContract);

router.route('/:id')
  .get(getContractById)
  .put(updateContract)
  .delete(deleteContract);

module.exports = router;
