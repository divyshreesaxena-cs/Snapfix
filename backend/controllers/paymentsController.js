const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Worker = require('../models/Worker');
const { generateTransactionId } = require('../utils/helpers');

// @desc    Create payment
// @route   POST /api/payments
// @access  Private
const createPayment = async (req, res) => {
  try {
    const { bookingId, hoursWorked } = req.body;

    // Validate
    if (!bookingId || !hoursWorked) {
      return res.status(400).json({
        success: false,
        message: 'Please provide booking ID and hours worked'
      });
    }

    if (hoursWorked < 0.5) {
      return res.status(400).json({
        success: false,
        message: 'Minimum hours worked should be 0.5'
      });
    }

    // Get booking
    const booking = await Booking.findById(bookingId).populate('worker');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify booking belongs to user
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check if booking is completed
    if (booking.status !== 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Booking must be completed before payment'
      });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ booking: bookingId });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Payment already processed for this booking'
      });
    }

    // Calculate amount
    const pricePerHour = booking.worker.pricePerHour;
    const totalAmount = pricePerHour * hoursWorked;

    // Create payment
    const payment = await Payment.create({
      booking: bookingId,
      user: req.user.id,
      worker: booking.worker._id,
      hoursWorked,
      pricePerHour,
      totalAmount,
      transactionId: generateTransactionId(),
      paymentStatus: 'Completed'
    });

    res.status(201).json({
      success: true,
      message: 'Payment successful',
      data: payment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment'
    });
  }
};

// @desc    Get payment by booking ID
// @route   GET /api/payments/booking/:bookingId
// @access  Private
const getPaymentByBooking = async (req, res) => {
  try {
    const payment = await Payment.findOne({ booking: req.params.bookingId })
      .populate('booking')
      .populate('worker', 'name serviceCategory');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Verify payment belongs to user
    if (payment.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment'
    });
  }
};

// @desc    Get all user payments
// @route   GET /api/payments
// @access  Private
const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate('booking')
      .populate('worker', 'name serviceCategory')
      .sort({ paidAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payments'
    });
  }
};

module.exports = {
  createPayment,
  getPaymentByBooking,
  getPayments
};
