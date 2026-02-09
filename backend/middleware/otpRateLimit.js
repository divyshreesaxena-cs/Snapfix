const rateLimit = require('express-rate-limit');

// Limit OTP send requests (per IP)
const otpSendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 requests per 10 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again after 10 minutes.',
  },
});

// Limit OTP verify attempts (per IP)
const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // 10 verify attempts per 10 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP verification attempts. Please try again after 10 minutes.',
  },
});

module.exports = {
  otpSendLimiter,
  otpVerifyLimiter,
};
