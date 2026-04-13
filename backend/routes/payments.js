const express = require('express');
const router = express.Router();
const {
  createPayment,
  confirmPayment,
  getPaymentByBooking,
  getPayments,
} = require('../controllers/paymentsController');
const { protect } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { createPaymentValidation, confirmPaymentValidation } = require('../validators/paymentValidators');

router.post('/', protect, createPaymentValidation, handleValidationErrors, createPayment);
router.post('/:id/confirm', protect, confirmPaymentValidation, handleValidationErrors, confirmPayment);
router.get('/', protect, getPayments);
router.get('/booking/:bookingId', protect, getPaymentByBooking);

module.exports = router;
