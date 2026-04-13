const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/profileController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getProfile)
  .post(protect, updateProfile);

module.exports = router;
