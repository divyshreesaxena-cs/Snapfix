const express = require('express');
const router = express.Router();
const {
  createBooking,
  getBookings,
  getBooking,
  updateBookingStatus,
} = require('../controllers/bookingsController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { handleValidationErrors } = require('../middleware/validation');
const { createBookingValidation, updateBookingStatusValidation } = require('../validators/bookingValidators');

router.post('/', protect, upload.array('images', 3), createBookingValidation, handleValidationErrors, createBooking);
router.get('/', protect, getBookings);
router.get('/:id', protect, getBooking);
router.put('/:id/status', protect, updateBookingStatusValidation, handleValidationErrors, updateBookingStatus);

module.exports = router;