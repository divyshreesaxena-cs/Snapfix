const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: true
  },
  hoursWorked: {
    type: Number,
    required: true,
    min: 0.5
  },
  pricePerHour: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    default: 'Simulated'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Completed'
  },
  transactionId: {
    type: String,
    unique: true
  },
  paidAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index
paymentSchema.index({ booking: 1 });
paymentSchema.index({ user: 1, paidAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
