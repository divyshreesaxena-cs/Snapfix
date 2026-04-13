// backend/models/OTP.js
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/
    },
    purpose: {
      type: String,
      enum: ['customer', 'worker', 'forgot_password_customer', 'forgot_password_worker'],
      required: true
    },
    provider: {
      type: String,
      enum: ['local', '2factor'],
      required: true,
      default: 'local'
    },
    otp: {
      type: String,
      required: function () {
        return this.provider === 'local';
      }
    },
    sessionId: {
      type: String,
      required: function () {
        return this.provider === '2factor';
      }
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
    },
    verified: {
      type: Boolean,
      default: false
    },
    verifyAttempts: {
      type: Number,
      default: 0,
    },
    maxVerifyAttempts: {
      type: Number,
      default: 5,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
    lastSentAt: {
      type: Date,
      default: Date.now,
    }
  },
  {
    timestamps: true
  }
);

otpSchema.index({ phone: 1, purpose: 1, createdAt: -1 });

module.exports = mongoose.model('OTP', otpSchema);
