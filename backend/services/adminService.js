const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Worker = require('../models/Worker');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Feedback = require('../models/Feedback');
const AppError = require('../utils/AppError');
const { createAuditLog } = require('./auditService');

const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return null;
};

const buildRegex = (q) => (q ? new RegExp(String(q).trim(), 'i') : null);

const getDashboard = async () => {
  const [
    totalCustomers,
    totalWorkers,
    verifiedWorkers,
    totalBookings,
    completedBookings,
    cancelledBookings,
    pendingPayments,
    completedPayments,
    totalFeedback,
    revenueAgg,
    recentBookings,
  ] = await Promise.all([
    User.countDocuments(),
    Worker.countDocuments(),
    Worker.countDocuments({ isVerified: true }),
    Booking.countDocuments(),
    Booking.countDocuments({ status: 'Completed' }),
    Booking.countDocuments({ status: 'Cancelled' }),
    Payment.countDocuments({ paymentStatus: 'Pending' }),
    Payment.countDocuments({ paymentStatus: 'Completed' }),
    Feedback.countDocuments(),
    Payment.aggregate([
      { $match: { paymentStatus: 'Completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
    ]),
    Booking.find()
      .populate('user', 'fullName phone')
      .populate('worker', 'name phone serviceCategory workerId')
      .sort({ createdAt: -1 })
      .limit(5),
  ]);

  return {
    metrics: {
      totalCustomers,
      totalWorkers,
      verifiedWorkers,
      totalBookings,
      completedBookings,
      cancelledBookings,
      pendingPayments,
      completedPayments,
      totalFeedback,
      totalRevenue: revenueAgg[0]?.totalRevenue || 0,
    },
    recentBookings,
  };
};

const getCustomers = async (query) => {
  const regex = buildRegex(query.q);
  const filter = regex
    ? {
        $or: [
          { fullName: regex },
          { username: regex },
          { phone: regex },
          { city: regex },
          { state: regex },
        ],
      }
    : {};

  return User.find(filter).sort({ createdAt: -1 });
};

const getWorkers = async (query) => {
  const regex = buildRegex(query.q);
  const verified = parseBoolean(query.verified);
  const blocked = parseBoolean(query.blocked);

  const filter = {};
  if (regex) {
    filter.$or = [
      { name: regex },
      { phone: regex },
      { workerId: regex },
      { serviceCategory: regex },
      { 'location.city': regex },
      { 'location.state': regex },
    ];
  }
  if (verified !== null) filter.isVerified = verified;
  if (blocked !== null) filter.isBlocked = blocked;

  return Worker.find(filter).sort({ createdAt: -1 });
};

const getBookings = async (query) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.workerStatus) filter.workerStatus = query.workerStatus;

  return Booking.find(filter)
    .populate('user', 'fullName phone city state')
    .populate('worker', 'name phone serviceCategory workerId')
    .sort({ createdAt: -1 });
};

const getPayments = async () =>
  Payment.find()
    .populate('user', 'fullName phone')
    .populate('worker', 'name phone serviceCategory workerId')
    .populate('booking', 'status scheduledDate scheduledTime serviceCategory')
    .sort({ createdAt: -1 });

const getFeedbacks = async () =>
  Feedback.find()
    .populate('user', 'fullName phone')
    .populate('worker', 'name phone serviceCategory workerId')
    .populate('booking', 'status serviceCategory scheduledDate')
    .sort({ createdAt: -1 });

const setCustomerBlocked = async ({ customerId, isBlocked, admin, req }) => {
  const parsed = parseBoolean(isBlocked);
  if (parsed === null) {
    throw new AppError('isBlocked must be true or false', 400, 'INVALID_BOOLEAN');
  }

  const update = { isBlocked: parsed };
  if (parsed) {
    update.$inc = { tokenVersion: 1 };
  }

  const customer = await User.findByIdAndUpdate(
    customerId,
    update,
    {
      new: true,
      runValidators: false,
    }
  );

  if (!customer) {
    throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
  }

  await createAuditLog({
    actorType: 'admin',
    actorId: admin._id,
    action: 'admin.customer.block',
    entityType: 'User',
    entityId: customer._id,
    metadata: { isBlocked: parsed },
    req,
  });

  return customer;
};

const setWorkerBlocked = async ({ workerId, isBlocked, admin, req }) => {
  const parsed = parseBoolean(isBlocked);
  if (parsed === null) {
    throw new AppError('isBlocked must be true or false', 400, 'INVALID_BOOLEAN');
  }

  const update = { isBlocked: parsed };
  if (parsed) {
    update.$inc = { tokenVersion: 1 };
  }

  const worker = await Worker.findByIdAndUpdate(
    workerId,
    update,
    {
      new: true,
      runValidators: false,
    }
  );

  if (!worker) {
    throw new AppError('Worker not found', 404, 'WORKER_NOT_FOUND');
  }

  await createAuditLog({
    actorType: 'admin',
    actorId: admin._id,
    action: 'admin.worker.block',
    entityType: 'Worker',
    entityId: worker._id,
    metadata: { isBlocked: parsed },
    req,
  });

  return worker;
};

const setWorkerVerification = async ({ workerId, isVerified, admin, req }) => {
  const parsed = parseBoolean(isVerified);
  if (parsed === null) {
    throw new AppError('isVerified must be true or false', 400, 'INVALID_BOOLEAN');
  }

  const worker = await Worker.findByIdAndUpdate(
    workerId,
    { $set: { isVerified: parsed } },
    {
      new: true,
      runValidators: false,
    }
  );

  if (!worker) {
    throw new AppError('Worker not found', 404, 'WORKER_NOT_FOUND');
  }

  await createAuditLog({
    actorType: 'admin',
    actorId: admin._id,
    action: 'admin.worker.verify',
    entityType: 'Worker',
    entityId: worker._id,
    metadata: { isVerified: parsed },
    req,
  });

  return worker;
};

const cancelBooking = async ({ bookingId, reason, admin, req }) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
  }
  if (booking.status === 'Completed') {
    throw new AppError('Completed bookings cannot be cancelled by admin', 400, 'BOOKING_COMPLETED');
  }
  if (booking.status === 'Cancelled') {
    throw new AppError('Booking is already cancelled', 400, 'BOOKING_ALREADY_CANCELLED');
  }

  const previousStatus = booking.status;
  booking.status = 'Cancelled';
  booking.statusHistory.push({
    from: previousStatus,
    to: 'Cancelled',
    changedByRole: 'Admin',
    changedBy: admin._id,
    note: reason ? `Admin cancelled booking: ${String(reason).trim()}` : 'Admin cancelled booking',
    changedAt: new Date(),
  });

  if (reason) {
    booking.cancellationReason = String(reason).trim();
  }
  booking.cancelledAt = new Date();
  booking.cancelledBy = 'Admin';

  await booking.save();

  await createAuditLog({
    actorType: 'admin',
    actorId: admin._id,
    action: 'admin.booking.cancel',
    entityType: 'Booking',
    entityId: booking._id,
    metadata: { from: previousStatus, to: 'Cancelled', reason: reason || '' },
    req,
  });

  return booking;
};

const deleteFeedback = async ({ feedbackId, admin, req }) => {
  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) {
    throw new AppError('Feedback not found', 404, 'FEEDBACK_NOT_FOUND');
  }

  await feedback.deleteOne();

  await createAuditLog({
    actorType: 'admin',
    actorId: admin._id,
    action: 'admin.feedback.delete',
    entityType: 'Feedback',
    entityId: feedback._id,
    metadata: {},
    req,
  });

  return feedback;
};

const updateAdminProfile = async ({ adminId, payload, req }) => {
  const admin = await Admin.findById(adminId).select('+passwordHash');
  if (!admin) {
    throw new AppError('Admin not found', 404, 'ADMIN_NOT_FOUND');
  }

  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const currentPassword = String(payload.currentPassword || '');
  const newPassword = String(payload.newPassword || '');

  if (name) admin.name = name;

  if (email && email !== admin.email) {
    const exists = await Admin.findOne({ email, _id: { $ne: admin._id } });
    if (exists) {
      throw new AppError('Email is already in use by another admin', 400, 'EMAIL_IN_USE');
    }
    admin.email = email;
  }

  if (newPassword) {
    if (!currentPassword) {
      throw new AppError('Current password is required to set a new password', 400, 'CURRENT_PASSWORD_REQUIRED');
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 400, 'CURRENT_PASSWORD_INVALID');
    }

    if (newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters long', 400, 'WEAK_PASSWORD');
    }

    admin.passwordHash = await bcrypt.hash(newPassword, 10);
    admin.tokenVersion = (admin.tokenVersion || 0) + 1;
  }

  await admin.save();

  await createAuditLog({
    actorType: 'admin',
    actorId: admin._id,
    action: 'admin.profile.update',
    entityType: 'Admin',
    entityId: admin._id,
    metadata: {
      emailChanged: Boolean(email),
      passwordChanged: Boolean(newPassword),
    },
    req,
  });

  return admin;
};

module.exports = {
  getDashboard,
  getCustomers,
  getWorkers,
  getBookings,
  getPayments,
  getFeedbacks,
  setCustomerBlocked,
  setWorkerBlocked,
  setWorkerVerification,
  cancelBooking,
  deleteFeedback,
  updateAdminProfile,
};