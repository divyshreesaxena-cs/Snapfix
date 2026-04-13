const asyncHandler = require('../utils/asyncHandler');
const paymentService = require('../services/paymentService');

const createPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.createPaymentIntent({
    bookingId: req.body.bookingId,
    hoursWorked: req.body.hoursWorked,
    userId: req.user.id,
    req,
  });

  res.status(201).json({
    success: true,
    message: 'Payment intent created. Confirm to complete the payment.',
    data: payment,
  });
});

const confirmPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.confirmPayment({
    paymentId: req.params.id,
    userId: req.user.id,
    req,
  });

  res.status(200).json({
    success: true,
    message: 'Payment successful',
    data: payment,
  });
});

const getPaymentByBooking = asyncHandler(async (req, res) => {
  const payment = await paymentService.getPaymentByBooking({
    bookingId: req.params.bookingId,
    userId: req.user.id,
  });
  res.status(200).json({ success: true, data: payment });
});

const getPayments = asyncHandler(async (req, res) => {
  const payments = await paymentService.listPaymentsForUser(req.user.id);
  res.status(200).json({ success: true, count: payments.length, data: payments });
});

module.exports = {
  createPayment,
  confirmPayment,
  getPaymentByBooking,
  getPayments,
};
