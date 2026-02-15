// backend/models/OTP.js
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/
    },

    // Differentiate OTP usage to avoid customer/worker clashes
    purpose: {
      type: String,
      enum: ['customer', 'worker', 'forgot_password_customer', 'forgot_password_worker'],
      required: true
    },

    // OTP provider (local DB otp vs 2Factor session-based OTP)
    provider: {
      type: String,
      enum: ['local', '2factor'],
      required: true,
      default: 'local'
    },

    // For local OTP only (stored in DB for dev/testing)
    otp: {
      type: String,
      required: function () {
        return this.provider === 'local';
      }
    },

    // For 2Factor OTP only (store sessionId returned by 2Factor)
    sessionId: {
      type: String,
      required: function () {
        return this.provider === '2factor';
      }
    },

    // TTL index: MongoDB auto-deletes documents after expiresAt
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
    },

    verified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Helpful index for fast lookups of latest OTP by phone + purpose
otpSchema.index({ phone: 1, purpose: 1, createdAt: -1 });

module.exports = mongoose.model('OTP', otpSchema);
