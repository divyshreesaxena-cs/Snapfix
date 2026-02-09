const express = require('express');
const router = express.Router();
const {
  createPayment,
  getPaymentByBooking,
  getPayments
} = require('../controllers/paymentsController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createPayment);
router.get('/', protect, getPayments);
router.get('/booking/:bookingId', protect, getPaymentByBooking);

module.exports = router;
