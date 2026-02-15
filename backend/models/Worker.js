// backend/models/Worker.js
const mongoose = require('mongoose');
const { getRateBounds } = require('../utils/ratePolicy');

const workerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^[0-9]{10}$/,
    },

    // ✅ NEW: track how this worker authenticates (OTP-first vs Password)
    authProvider: {
      type: String,
      enum: ['otp', 'password'],
      default: 'otp',
    },

    // ✅ Username + Password Hash (required only for password auth)
    username: {
      type: String,
      required: function () {
        return this.authProvider === 'password';
      },
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      sparse: true, // ✅ allows many docs to have username = undefined
    },

    passwordHash: {
      type: String,
      required: function () {
        return this.authProvider === 'password';
      },
      select: false,
    },

    workerId: {
  type: String,
  unique: true,
  required: true,
  immutable: true, // ✅ once set, cannot be changed
  default: function () {
    // WRK + last 6 digits of timestamp (simple + readable)
    return 'WRK' + Date.now().toString().slice(-6);
  },
},


    idProofNumber: {
      type: String,
      default: '',
    },

    servicesProvided: [
      {
        type: String,
        enum: ['Electrician', 'Plumbing', 'Painting', 'Carpenter'],
      },
    ],

    // ✅ NOT required until profile is complete
    serviceCategory: {
      type: String,
      enum: ['Electrician', 'Plumbing', 'Painting', 'Carpenter'],
      required: function () {
        return this.isProfileComplete === true;
      },
    },

    profileImage: {
      type: String,
      default: null,
    },

    // ✅ NOT required until profile is complete
    pricePerHour: {
      type: Number,
      required: function () {
        return this.isProfileComplete === true;
      },
      validate: {
        validator: function (value) {
          if (!this.isProfileComplete) return true;

          const category =
            this.serviceCategory ||
            (Array.isArray(this.servicesProvided) && this.servicesProvided[0]);

          const { min, max } = getRateBounds(category);
          return typeof value === 'number' && value >= min && value <= max;
        },
        message: function () {
          const category =
            this.serviceCategory ||
            (Array.isArray(this.servicesProvided) && this.servicesProvided[0]);

          const { min, max } = getRateBounds(category);
          return `Hourly rate must be between ₹${min} and ₹${max} for ${category || 'this service'}.`;
        },
      },
    },

    pricing: {
      baseRate: { type: Number, default: null },
      busyMultiplierEnabled: { type: Boolean, default: false },
      busyHourMultiplier: { type: Number, default: 1 },
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalRatings: {
      type: Number,
      default: 0,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },

    experience: {
      type: Number,
      default: 0,
    },

    availability: {
      type: Boolean,
      default: true,
    },

    isOnline: {
      type: Boolean,
      default: false,
    },

    location: {
      city: String,
      state: String,
      pincode: String,
      latitude: Number,
      longitude: Number,
    },

    skills: [{ type: String }],

    completedJobs: {
      type: Number,
      default: 0,
    },

    isProfileComplete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ✅ Keep pricing.baseRate in sync with pricePerHour for now (future-proofing)
workerSchema.pre('save', function (next) {
  if (typeof this.pricePerHour === 'number' && this.pricing) {
    if (this.pricing.baseRate === null || this.pricing.baseRate === undefined) {
      this.pricing.baseRate = this.pricePerHour;
    }
  }
  next();
});

// ✅ Indexes

workerSchema.index({ serviceCategory: 1, availability: 1, rating: -1 });
workerSchema.index({ 'location.pincode': 1 });

module.exports = mongoose.model('Worker', workerSchema);
