const express = require('express');
const router = express.Router();
const { loginLimiter } = require('../middleware/otpRateLimit');
const { adminLogin, getAdminMe } = require('../controllers/adminAuthController');
const { adminProtect } = require('../middleware/adminAuth');

router.post('/login', loginLimiter, adminLogin);
router.get('/me', adminProtect, getAdminMe);

module.exports = router;