const express = require('express');
const router = express.Router();
const { sendWorkerOTP, verifyWorkerOTP } = require('../controllers/workerAuthController');
const { otpSendLimiter, otpVerifyLimiter } = require('../middleware/otpRateLimit');

router.post('/send-otp', otpSendLimiter, sendWorkerOTP);
router.post('/verify-otp', otpVerifyLimiter, verifyWorkerOTP);

module.exports = router;