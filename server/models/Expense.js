const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  buildingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building',
    required: true
  },
  title: {
    type: String,
    required: true // e.g. "Bảo trì thang máy", "Sửa đường ống nước", "Thay bóng đèn hành lang"
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  category: {
    type: String,
    enum: ['Maintenance', 'Operating', 'Administrative', 'Others'],
    default: 'Maintenance'
  },
  description: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Expense', ExpenseSchema);
