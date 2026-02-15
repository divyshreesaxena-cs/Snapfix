// backend/routes/workerAuth.js
const express = require('express');
const router = express.Router();

const {
  sendWorkerOTP,
  verifyWorkerOTP,
  registerWorker,
  loginWorker,
  forgotPasswordSendOTPWorker,
  forgotPasswordVerifyOTPWorker,
} = require('../controllers/workerAuthController');

const { otpSendLimiter, otpVerifyLimiter } = require('../middleware/otpRateLimit');

// ----------------------
// OTP Login
// ----------------------
router.post('/send-otp', otpSendLimiter, sendWorkerOTP);
router.post('/verify-otp', otpVerifyLimiter, verifyWorkerOTP);

// ----------------------
// Username + Password
// ----------------------
router.post('/register', registerWorker);
router.post('/login', loginWorker);

// ----------------------
// Forgot Password (OTP)
// ----------------------
router.post('/forgot-password/send-otp', otpSendLimiter, forgotPasswordSendOTPWorker);
router.post('/forgot-password/verify-otp', otpVerifyLimiter, forgotPasswordVerifyOTPWorker);

module.exports = router;
