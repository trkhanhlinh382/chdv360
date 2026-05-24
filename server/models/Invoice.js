const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  apartmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Apartment',
    required: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  billingMonth: {
    type: String,
    required: true // Format: "YYYY-MM" (e.g. "2026-05")
  },
  roomPrice: {
    type: Number,
    required: true
  },
  electricity: {
    oldIndex: {
      type: Number,
      required: true
    },
    newIndex: {
      type: Number,
      required: true
    },
    consumption: {
      type: Number,
      required: true
    },
    unitPrice: {
      type: Number,
      required: true
    },
    total: {
      type: Number,
      required: true
    }
  },
  water: {
    oldIndex: {
      type: Number,
      required: true
    },
    newIndex: {
      type: Number,
      required: true
    },
    consumption: {
      type: Number,
      required: true
    },
    unitPrice: {
      type: Number,
      required: true
    },
    total: {
      type: Number,
      required: true
    }
  },
  serviceFee: {
    type: Number,
    default: 0
  },
  parkingFee: {
    type: Number,
    default: 0
  },
  otherFees: [{
    description: String,
    amount: Number
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Unpaid', 'Paid'],
    default: 'Unpaid'
  },
  paymentDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to prevent duplicate invoices for the same room in the same month
InvoiceSchema.index({ apartmentId: 1, billingMonth: 1 }, { unique: true });

module.exports = mongoose.model('Invoice', InvoiceSchema);
