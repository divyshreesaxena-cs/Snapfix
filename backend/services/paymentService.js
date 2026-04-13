const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const AppError = require('../utils/AppError');
const { generateTransactionId } = require('../utils/helpers');
const { createAuditLog } = require('./auditService');

const createPaymentIntent = async ({ bookingId, hoursWorked, userId, req }) => {
  const booking = await Booking.findById(bookingId).populate('worker');
  if (!booking) throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
  if (booking.user.toString() !== userId) throw new AppError('Not authorized', 403, 'PAYMENT_FORBIDDEN');
  if (booking.status !== 'Completed') throw new AppError('Booking must be completed before payment', 400, 'BOOKING_NOT_COMPLETED');

  const existingPayment = await Payment.findOne({ booking: bookingId });
  if (existingPayment) {
    throw new AppError(
      existingPayment.paymentStatus === 'Pending' ? 'A payment is already pending for this booking' : 'Payment already processed for this booking',
      400,
      'PAYMENT_ALREADY_EXISTS'
    );
  }

  const pricePerHour = booking.worker.pricePerHour;
  const normalizedHours = Number(hoursWorked);
  const totalAmount = Number((pricePerHour * normalizedHours).toFixed(2));

  const payment = await Payment.create({
    booking: bookingId,
    user: userId,
    worker: booking.worker._id,
    hoursWorked: normalizedHours,
    pricePerHour,
    totalAmount,
    transactionId: generateTransactionId(),
    paymentStatus: 'Pending',
    paymentMethod: 'Simulated',
    paidAt: null,
  });

  await createAuditLog({
    actorType: 'customer',
    actorId: userId,
    action: 'payment.intent.create',
    entityType: 'Payment',
    entityId: payment._id,
    metadata: { bookingId, totalAmount, hoursWorked: normalizedHours },
    req,
  });

  return payment;
};

const confirmPayment = async ({ paymentId, userId, req }) => {
  const payment = await Payment.findById(paymentId).populate({
    path: 'booking',
    populate: { path: 'worker', select: 'name serviceCategory pricePerHour' },
  });

  if (!payment) throw new AppError('Payment not found', 404, 'PAYMENT_NOT_FOUND');
  if (payment.user.toString() !== userId) throw new AppError('Not authorized', 403, 'PAYMENT_FORBIDDEN');
  if (payment.paymentStatus !== 'Pending') {
    throw new AppError(`Payment is already ${payment.paymentStatus.toLowerCase()}`, 400, 'PAYMENT_ALREADY_FINALIZED');
  }

  payment.paymentStatus = 'Completed';
  payment.paidAt = new Date();
  await payment.save();

  await createAuditLog({
    actorType: 'customer',
    actorId: userId,
    action: 'payment.confirm',
    entityType: 'Payment',
    entityId: payment._id,
    metadata: { bookingId: payment.booking?._id, totalAmount: payment.totalAmount },
    req,
  });

  return payment;
};

const getPaymentByBooking = async ({ bookingId, userId }) => {
  const payment = await Payment.findOne({ booking: bookingId })
    .populate('booking')
    .populate('worker', 'name serviceCategory');
  if (!payment) throw new AppError('Payment not found', 404, 'PAYMENT_NOT_FOUND');
  if (payment.user.toString() !== userId) throw new AppError('Not authorized', 403, 'PAYMENT_FORBIDDEN');
  return payment;
};

const listPaymentsForUser = async (userId) => Payment.find({ user: userId })
  .populate('booking')
  .populate('worker', 'name serviceCategory')
  .sort({ createdAt: -1 });

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getPaymentByBooking,
  listPaymentsForUser,
};
