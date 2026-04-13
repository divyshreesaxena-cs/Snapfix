const asyncHandler = require('../utils/asyncHandler');
const bookingService = require('../services/bookingService');

const createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.createBooking({
    payload: req.body,
    files: req.files,
    userId: req.user.id,
    req,
  });

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: booking,
  });
});

const getBookings = asyncHandler(async (req, res) => {
  const bookings = await bookingService.getUserBookings(req.user.id);
  res.status(200).json({ success: true, data: bookings });
});

const getBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.getUserBookingById(req.params.id, req.user.id);
  res.status(200).json({ success: true, data: booking });
});

const updateBookingStatus = asyncHandler(async (req, res) => {
  const booking = await bookingService.updateCustomerBookingStatus({
    bookingId: req.params.id,
    userId: req.user.id,
    status: req.body.status,
    cancellationReason: req.body.cancellationReason,
    req,
  });

  res.status(200).json({
    success: true,
    message: 'Booking status updated',
    data: booking,
  });
});

module.exports = {
  createBooking,
  getBookings,
  getBooking,
  updateBookingStatus,
};