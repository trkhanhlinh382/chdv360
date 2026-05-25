const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  ownerName: {
    type: String
  },
  brand: {
    type: String
  },
  color: {
    type: String
  },
  licensePlate: {
    type: String,
    required: true
  }
});

const CoResidentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  identityCard: {
    type: String
  },
  relationship: {
    type: String
  }
});

const TenantSchema = new mongoose.Schema({
  apartmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Apartment',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  identityCard: {
    type: String,
    required: true
  },
  identityCardFront: {
    type: String
  },
  identityCardBack: {
    type: String
  },
  birthDate: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['Nam', 'Nữ', 'Khác'],
    default: 'Nam'
  },
  permanentAddress: {
    type: String
  },
  occupation: {
    type: String
  },
  companyOrSchool: {
    type: String
  },
  vehicles: [VehicleSchema],
  coResidents: [CoResidentSchema],
  depositPaid: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Tenant', TenantSchema);
