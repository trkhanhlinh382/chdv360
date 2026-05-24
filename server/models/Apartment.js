const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['New', 'Good', 'Degraded', 'Broken'],
    default: 'Good'
  },
  serialNumber: {
    type: String
  }
});

const ApartmentSchema = new mongoose.Schema({
  buildingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  floor: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  area: {
    type: Number,
    required: true
  },
  maxTenants: {
    type: Number,
    default: 2
  },
  deposit: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Vacant', 'Occupied', 'Maintenance'],
    default: 'Vacant'
  },
  amenities: [{
    type: String
  }],
  assets: [AssetSchema],
  images: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Apartment', ApartmentSchema);
