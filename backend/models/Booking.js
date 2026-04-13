const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
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
  serviceCategory: {
    type: String,
    required: true,
    enum: ['Electrician', 'Plumbing', 'Painting', 'Carpenter']
  },
  problemType: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  images: [{
    type: String
  }],
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  workerStatus: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected'],
    default: 'Pending'
  },
  completionInitiatedBy: {
    type: String,
    enum: ['Customer', 'Worker', null],
    default: null
  },
  cancellationReason: {
    type: String,
    default: ''
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  cancelledBy: {
    type: String,
    enum: ['Customer', 'Worker', 'Admin', null],
    default: null
  },
  cancellationPenalty: {
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    reason: {
      type: String,
      default: ''
    },
    hoursBeforeService: {
      type: Number,
      default: null
    },
    applied: {
      type: Boolean,
      default: false
    }
  },
  address: {
    pincode: String,
    city: String,
    state: String,
    fullAddress: String
  },
  distance: {
    type: Number,
    default: null
  },
  statusHistory: [{
    from: { type: String },
    to: { type: String, required: true },
    changedByRole: { type: String, enum: ['Customer', 'Worker', 'System', 'Admin'], required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    note: { type: String, default: '' },
    changedAt: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ worker: 1, status: 1 });
bookingSchema.index({ worker: 1, workerStatus: 1 });
bookingSchema.index({ worker: 1, scheduledDate: 1, scheduledTime: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);