const express = require('express');
const router = express.Router();
const { otpSendLimiter, otpVerifyLimiter } = require('../middleware/otpRateLimit');

const { sendOTP, verifyOTP } = require('../controllers/authController');

router.post('/send-otp', otpSendLimiter, sendOTP);
router.post('/verify-otp', otpVerifyLimiter, verifyOTP);


module.exports = router;
