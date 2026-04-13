const Booking = require('../models/Booking');
const Worker = require('../models/Worker');
const { WORKER_ALLOWED_ACTIONS } = require('../utils/bookingState');
const { findWorkerSlotConflict } = require('../utils/slotConflicts');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { createAuditLog } = require('../services/auditService');

const appendStatusHistory = (booking, from, to, workerId, note) => {
  booking.statusHistory.push({
    from,
    to,
    changedByRole: 'Worker',
    changedBy: workerId,
    note,
    changedAt: new Date(),
  });
};

const getWorkerBookings = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = { worker: req.worker.id };
  if (status) query.status = status;

  const bookings = await Booking.find(query)
    .populate('user', 'fullName phone pincode city state')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: bookings.length, data: bookings });
});

const respondToBooking = asyncHandler(async (req, res) => {
  const { workerStatus } = req.body;
  const actionRules = WORKER_ALLOWED_ACTIONS.respond;

  if (!workerStatus || !['Accepted', 'Rejected'].includes(workerStatus)) {
    throw new AppError('workerStatus must be Accepted or Rejected', 400, 'INVALID_WORKER_STATUS');
  }

  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
  if (booking.worker.toString() !== req.worker.id) throw new AppError('Not authorized to update this booking', 403, 'BOOKING_FORBIDDEN');
  if (!actionRules.allowedCurrentStatus.includes(booking.status) || !actionRules.allowedCurrentWorkerStatus.includes(booking.workerStatus)) {
    throw new AppError('Booking already responded or is no longer active', 400, 'BOOKING_ALREADY_RESPONDED');
  }

  if (workerStatus === 'Accepted') {
    const conflict = await findWorkerSlotConflict({
      workerId: req.worker.id,
      scheduledDate: booking.scheduledDate,
      scheduledTime: booking.scheduledTime,
      excludeBookingId: booking._id,
      statuses: ['Accepted', 'In Progress'],
    });
    if (conflict) throw new AppError('You already have another active booking in this time slot', 409, 'SLOT_CONFLICT');
  }

  const previousStatus = booking.status;
  booking.workerStatus = workerStatus;
  booking.status = actionRules.toBookingStatus[workerStatus];
  appendStatusHistory(booking, previousStatus, booking.status, req.worker.id, `Worker ${workerStatus.toLowerCase()} the booking`);
  await booking.save();
  await createAuditLog({ actorType: 'worker', actorId: req.worker._id, action: 'worker.booking.respond', entityType: 'Booking', entityId: booking._id, metadata: { workerStatus, from: previousStatus, to: booking.status }, req });

  res.status(200).json({ success: true, message: `Booking ${workerStatus.toLowerCase()}`, data: booking });
});

const startJob = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  const actionRules = WORKER_ALLOWED_ACTIONS.start;
  if (!booking) throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
  if (booking.worker.toString() !== req.worker.id) throw new AppError('Not authorized', 403, 'BOOKING_FORBIDDEN');
  if (!actionRules.allowedCurrentStatus.includes(booking.status) || !actionRules.allowedCurrentWorkerStatus.includes(booking.workerStatus)) {
    throw new AppError('Booking must be accepted before starting', 400, 'INVALID_BOOKING_TRANSITION');
  }

  const conflict = await findWorkerSlotConflict({
    workerId: req.worker.id,
    scheduledDate: booking.scheduledDate,
    scheduledTime: booking.scheduledTime,
    excludeBookingId: booking._id,
    statuses: ['In Progress'],
  });
  if (conflict) throw new AppError('Another job is already in progress in this slot', 409, 'SLOT_CONFLICT');

  const previousStatus = booking.status;
  booking.status = actionRules.nextStatus;
  appendStatusHistory(booking, previousStatus, booking.status, req.worker.id, 'Worker started the job');
  await booking.save();
  await createAuditLog({ actorType: 'worker', actorId: req.worker._id, action: 'worker.booking.start', entityType: 'Booking', entityId: booking._id, metadata: { from: previousStatus, to: booking.status }, req });

  res.status(200).json({ success: true, message: 'Job started', data: booking });
});

const initiateCompletion = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  const actionRules = WORKER_ALLOWED_ACTIONS.complete;
  if (!booking) throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
  if (booking.worker.toString() !== req.worker.id) throw new AppError('Not authorized', 403, 'BOOKING_FORBIDDEN');
  if (!actionRules.allowedCurrentStatus.includes(booking.status) || !actionRules.allowedCurrentWorkerStatus.includes(booking.workerStatus)) {
    throw new AppError('Only active accepted bookings can be completed', 400, 'INVALID_BOOKING_TRANSITION');
  }

  const previousStatus = booking.status;
  booking.status = actionRules.nextStatus;
  booking.completionInitiatedBy = 'Worker';
  appendStatusHistory(booking, previousStatus, booking.status, req.worker.id, 'Worker marked the job as completed');
  await booking.save();

  await Worker.findByIdAndUpdate(req.worker.id, { $inc: { completedJobs: 1 } });
  await createAuditLog({ actorType: 'worker', actorId: req.worker._id, action: 'worker.booking.complete', entityType: 'Booking', entityId: booking._id, metadata: { from: previousStatus, to: booking.status }, req });

  res.status(200).json({ success: true, message: 'Completion initiated. Customer can pay now.', data: booking });
});

module.exports = { getWorkerBookings, respondToBooking, startJob, initiateCompletion };
