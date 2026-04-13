const Booking = require('../models/Booking');
const Feedback = require('../models/Feedback');
const Payment = require('../models/Payment');
const Worker = require('../models/Worker');
const AppError = require('../utils/AppError');
const { canCustomerTransition, normalizeStatus, getCancellationPenalty } = require('../utils/bookingState');
const { findWorkerSlotConflict } = require('../utils/slotConflicts');
const { uploadImages } = require('./uploadService');
const { createAuditLog } = require('./auditService');

const createBooking = async ({ payload, files, userId, req }) => {
  const {
    workerId,
    serviceCategory,
    problemType,
    description,
    scheduledDate,
    scheduledTime,
    addressFullAddress,
    addressPincode,
    addressCity,
    addressState,
  } = payload;

  const worker = await Worker.findById(workerId);
  if (!worker) throw new AppError('Worker not found', 404, 'WORKER_NOT_FOUND');
  if (worker.isBlocked || !worker.isVerified) {
    throw new AppError('Selected worker is not available for booking', 400, 'WORKER_UNAVAILABLE');
  }
  if (worker.serviceCategory !== serviceCategory) {
    throw new AppError('Selected worker does not match the chosen service category', 400, 'WORKER_CATEGORY_MISMATCH');
  }

  const conflictingBooking = await findWorkerSlotConflict({ workerId, scheduledDate, scheduledTime });
  if (conflictingBooking) {
    throw new AppError('This worker is already booked for the selected slot', 409, 'SLOT_CONFLICT');
  }

  const uploadResults = await uploadImages(files, { folder: 'snapfix/bookings' });

  const booking = await Booking.create({
    user: userId,
    worker: workerId,
    serviceCategory,
    problemType,
    description: description.trim(),
    images: uploadResults.map((result) => result.url),
    scheduledDate,
    scheduledTime,
    status: 'Pending',
    workerStatus: 'Pending',
    statusHistory: [
      {
        from: null,
        to: 'Pending',
        changedByRole: 'Customer',
        changedBy: userId,
        note: 'Customer submitted booking request. Waiting for worker approval.',
        changedAt: new Date(),
      },
    ],
    address: {
      pincode: addressPincode.trim(),
      city: addressCity.trim(),
      state: addressState.trim(),
      fullAddress: addressFullAddress.trim(),
    },
  });

  await booking.populate('worker', 'name phone serviceCategory pricePerHour rating');
  await createAuditLog({
    actorType: 'customer',
    actorId: userId,
    action: 'booking.create',
    entityType: 'Booking',
    entityId: booking._id,
    metadata: {
      workerId,
      serviceCategory,
      scheduledDate,
      scheduledTime,
      initialStatus: 'Pending',
      initialWorkerStatus: 'Pending',
    },
    req,
  });

  return booking;
};

const getUserBookings = async (userId) => {
  const bookings = await Booking.find({ user: userId })
    .populate('worker', 'name phone serviceCategory pricePerHour rating profileImage')
    .sort({ createdAt: -1 });

  const bookingIds = bookings.map((b) => b._id);
  const [payments, feedbacks] = await Promise.all([
    Payment.find({ booking: { $in: bookingIds }, paymentStatus: 'Completed' }).select('booking'),
    Feedback.find({ booking: { $in: bookingIds } }).select('booking'),
  ]);

  const paidSet = new Set(payments.map((p) => String(p.booking)));
  const feedbackSet = new Set(feedbacks.map((f) => String(f.booking)));

  return bookings.map((b) => {
    const obj = b.toObject();
    obj.hasPaid = paidSet.has(String(b._id));
    obj.hasFeedback = feedbackSet.has(String(b._id));
    return obj;
  });
};

const getUserBookingById = async (bookingId, userId) => {
  const booking = await Booking.findById(bookingId)
    .populate('worker', 'name phone serviceCategory pricePerHour rating profileImage')
    .populate('user', 'fullName phone pincode city state');

  if (!booking) throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
  if (booking.user._id.toString() !== userId) throw new AppError('Not authorized', 403, 'BOOKING_FORBIDDEN');

  const [payment, feedback] = await Promise.all([
    Payment.findOne({ booking: booking._id, paymentStatus: 'Completed' }).select('_id paymentStatus'),
    Feedback.findOne({ booking: booking._id }).select('_id'),
  ]);

  const obj = booking.toObject();
  obj.hasPaid = !!payment;
  obj.hasFeedback = !!feedback;
  return obj;
};

const updateCustomerBookingStatus = async ({ bookingId, userId, status, cancellationReason, req }) => {
  const nextStatus = normalizeStatus(status);
  const booking = await Booking.findById(bookingId);

  if (!booking) throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
  if (booking.user.toString() !== userId) throw new AppError('Not authorized', 403, 'BOOKING_FORBIDDEN');

  if (!canCustomerTransition(booking.status, nextStatus)) {
    throw new AppError(`Cannot change booking status from ${booking.status} to ${nextStatus}`, 400, 'INVALID_BOOKING_TRANSITION');
  }

  const previousStatus = booking.status;

  if (nextStatus === 'Cancelled') {
    const penalty = getCancellationPenalty({ booking });
    booking.cancellationPenalty = penalty;
    booking.cancellationReason = String(cancellationReason || '').trim();
    booking.cancelledAt = new Date();
    booking.cancelledBy = 'Customer';
  }

  booking.status = nextStatus;
  booking.statusHistory.push({
    from: previousStatus,
    to: nextStatus,
    changedByRole: 'Customer',
    changedBy: userId,
    note: nextStatus === 'Cancelled'
      ? `Customer cancelled booking${booking.cancellationPenalty?.applied ? ` with ₹${booking.cancellationPenalty.amount} penalty` : ''}`
      : 'Customer updated booking status',
    changedAt: new Date(),
  });

  await booking.save();

  await createAuditLog({
    actorType: 'customer',
    actorId: userId,
    action: 'booking.status.update',
    entityType: 'Booking',
    entityId: booking._id,
    metadata: {
      from: previousStatus,
      to: nextStatus,
      cancellationPenalty: booking.cancellationPenalty || null,
      cancellationReason: booking.cancellationReason || '',
    },
    req,
  });

  return booking;
};

module.exports = {
  createBooking,
  getUserBookings,
  getUserBookingById,
  updateCustomerBookingStatus,
};