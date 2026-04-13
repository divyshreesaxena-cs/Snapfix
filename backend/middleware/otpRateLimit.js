const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

// FIXED key generator (IPv6 safe)
const phoneAwareKeyGenerator = (req) => {
  const phone = (req.body?.phone || req.body?.identifier || 'anonymous')
    .toString()
    .trim();

  return `${ipKeyGenerator(req)}:${phone}`;
};

const otpSendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  keyGenerator: phoneAwareKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests for this number. Please try again after 10 minutes.',
  },
});

const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyGenerator: phoneAwareKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP verification attempts for this number. Please try again after 10 minutes.',
  },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 7,
  keyGenerator: phoneAwareKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
});

module.exports = {
  otpSendLimiter,
  otpVerifyLimiter,
  loginLimiter,
};