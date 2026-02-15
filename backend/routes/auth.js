const express = require('express');
const { sendOTP, verifyOTP, register, login , forgotPasswordSendOTP , forgotPasswordVerifyOTP } = require('../controllers/authController');
const router = express.Router();
const { otpSendLimiter, otpVerifyLimiter } = require('../middleware/otpRateLimit');



router.post('/send-otp', otpSendLimiter, sendOTP);
router.post('/verify-otp', otpVerifyLimiter, verifyOTP);
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password/send-otp', otpSendLimiter, forgotPasswordSendOTP);
router.post('/forgot-password/verify-otp', otpVerifyLimiter, forgotPasswordVerifyOTP);


module.exports = router;
