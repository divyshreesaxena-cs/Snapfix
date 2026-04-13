const mongoose = require('mongoose');
const { getRateBounds } = require('../utils/ratePolicy');

const allowedCategories = ['Electrician', 'Plumbing', 'Painting', 'Carpenter'];

function generateWorkerId() {
  const random = Math.floor(10000 + Math.random() * 90000);
  return `WRK${random}`;
}

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

    authProvider: {
      type: String,
      enum: ['otp', 'password'],
      default: 'otp',
    },

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
      sparse: true,
    },

    passwordHash: {
      type: String,
      required: function () {
        return this.authProvider === 'password';
      },
      select: false,
    },

    tokenVersion: {
      type: Number,
      default: 0,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    workerId: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      immutable: true,
      trim: true,
      uppercase: true,
      match: /^WRK\d{5}$/,
    },

    idProofNumber: {
      type: String,
      default: '',
    },

    servicesProvided: [
      {
        type: String,
        enum: allowedCategories,
      },
    ],

    serviceCategory: {
      type: String,
      enum: allowedCategories,
      required: function () {
        return this.isProfileComplete === true;
      },
    },

    profileImage: {
      type: String,
      default: null,
    },

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

workerSchema.pre('save', async function (next) {
  try {
    if (typeof this.pricePerHour === 'number' && this.pricing) {
      if (this.pricing.baseRate === null || this.pricing.baseRate === undefined) {
        this.pricing.baseRate = this.pricePerHour;
      }
    }

    if (!this.workerId) {
      const Worker = this.constructor;
      let candidate;
      let exists = true;

      while (exists) {
        candidate = generateWorkerId();
        exists = await Worker.exists({ workerId: candidate });
      }

      this.workerId = candidate;
    }

    next();
  } catch (error) {
    next(error);
  }
});

workerSchema.index({ serviceCategory: 1, availability: 1, isVerified: 1, rating: -1 });
workerSchema.index({ 'location.pincode': 1 });

module.exports = mongoose.model('Worker', workerSchema);