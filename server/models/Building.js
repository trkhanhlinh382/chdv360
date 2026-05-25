const mongoose = require('mongoose');

const BuildingSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  region: {
    type: String,
    required: true
  },
  numberOfFloors: {
    type: Number,
    default: 1
  },
  parkingCapacity: {
    type: Number,
    default: 20
  },
  description: {
    type: String
  },
  images: [{
    type: String
  }],
  amenities: [{
    type: String
  }],
  defaultFees: {
    electricPrice: {
      type: Number,
      default: 4000 // VND per kWh
    },
    waterPrice: {
      type: Number,
      default: 30000 // VND per m3 or flat price
    },
    serviceFee: {
      type: Number,
      default: 150000 // VND per room per month
    },
    parkingFee: {
      type: Number,
      default: 100000 // VND per vehicle per month
    }
  },
  services: [{
    name: { type: String, required: true },
    fee: { type: Number, required: true },
    unit: { type: String, default: 'phòng/tháng' },
    active: { type: Boolean, default: true }
  }],
  active: {

    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Building', BuildingSchema);
