const express = require('express');
const router = express.Router();
const {
  createBooking,
  getBookings,
  getBooking,
  updateBookingStatus
} = require('../controllers/bookingsController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', protect, upload.array('images', 3), createBooking);
router.get('/', protect, getBookings);
router.get('/:id', protect, getBooking);
router.put('/:id/status', protect, updateBookingStatus);

module.exports = router;
