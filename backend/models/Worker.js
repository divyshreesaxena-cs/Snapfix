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
    },
    workerId: {
      type: String,
      required: true,
      unique: true,
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
          // If profile not complete, skip validation
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
      baseRate: { type: Number, default: null }, // reserved for future price rules
      busyMultiplierEnabled: { type: Boolean, default: false },
      busyHourMultiplier: { type: Number, default: 1 }, // reserved for future "Busy hours" feature
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

    skills: [
      {
        type: String,
      },
    ],

    completedJobs: {
      type: Number,
      default: 0,
    },

    isProfileComplete: {
      type: Boolean,
      default: false,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ✅ Keep pricing.baseRate in sync with pricePerHour for now (future-proofing)
workerSchema.pre('save', function (next) {
  // Only sync baseRate if a real price exists
  if (typeof this.pricePerHour === 'number' && this.pricing) {
    if (this.pricing.baseRate === null || this.pricing.baseRate === undefined) {
      this.pricing.baseRate = this.pricePerHour;
    }
  }
  next();
});

// Indexes
workerSchema.index({ serviceCategory: 1, availability: 1, rating: -1 });
workerSchema.index({ 'location.pincode': 1 });

module.exports = mongoose.model('Worker', workerSchema);
