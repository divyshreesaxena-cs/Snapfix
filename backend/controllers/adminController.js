const asyncHandler = require('../utils/asyncHandler');
const adminService = require('../services/adminService');

const getDashboard = asyncHandler(async (req, res) => {
  const data = await adminService.getDashboard();
  res.status(200).json({ success: true, data });
});

const getCustomers = asyncHandler(async (req, res) => {
  const customers = await adminService.getCustomers(req.query);
  res.status(200).json({ success: true, count: customers.length, data: customers });
});

const getWorkers = asyncHandler(async (req, res) => {
  const workers = await adminService.getWorkers(req.query);
  res.status(200).json({ success: true, count: workers.length, data: workers });
});

const getBookings = asyncHandler(async (req, res) => {
  const bookings = await adminService.getBookings(req.query);
  res.status(200).json({ success: true, count: bookings.length, data: bookings });
});

const getPayments = asyncHandler(async (req, res) => {
  const payments = await adminService.getPayments();
  res.status(200).json({ success: true, count: payments.length, data: payments });
});

const getFeedbacks = asyncHandler(async (req, res) => {
  const feedbacks = await adminService.getFeedbacks();
  res.status(200).json({ success: true, count: feedbacks.length, data: feedbacks });
});

const setCustomerBlocked = asyncHandler(async (req, res) => {
  const customer = await adminService.setCustomerBlocked({
    customerId: req.params.id,
    isBlocked: req.body.isBlocked,
    admin: req.admin,
    req,
  });
  res.status(200).json({ success: true, message: `Customer ${customer.isBlocked ? 'blocked' : 'unblocked'} successfully`, data: customer });
});

const setWorkerBlocked = asyncHandler(async (req, res) => {
  const worker = await adminService.setWorkerBlocked({
    workerId: req.params.id,
    isBlocked: req.body.isBlocked,
    admin: req.admin,
    req,
  });
  res.status(200).json({ success: true, message: `Worker ${worker.isBlocked ? 'blocked' : 'unblocked'} successfully`, data: worker });
});

const setWorkerVerification = asyncHandler(async (req, res) => {
  const worker = await adminService.setWorkerVerification({
    workerId: req.params.id,
    isVerified: req.body.isVerified,
    admin: req.admin,
    req,
  });
  res.status(200).json({ success: true, message: `Worker ${worker.isVerified ? 'verified' : 'marked unverified'} successfully`, data: worker });
});

const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await adminService.cancelBooking({
    bookingId: req.params.id,
    reason: req.body.reason,
    admin: req.admin,
    req,
  });
  res.status(200).json({ success: true, message: 'Booking cancelled by admin', data: booking });
});

const deleteFeedback = asyncHandler(async (req, res) => {
  await adminService.deleteFeedback({ feedbackId: req.params.id, admin: req.admin, req });
  res.status(200).json({ success: true, message: 'Feedback deleted successfully' });
});

const getAdminProfile = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: req.admin });
});

const updateAdminProfile = asyncHandler(async (req, res) => {
  const admin = await adminService.updateAdminProfile({ adminId: req.admin._id, payload: req.body, req });
  res.status(200).json({
    success: true,
    message: 'Admin profile updated successfully',
    data: {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
      lastLoginAt: admin.lastLoginAt,
      updatedAt: admin.updatedAt,
    },
  });
});

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
  getAdminProfile,
  updateAdminProfile,
};
