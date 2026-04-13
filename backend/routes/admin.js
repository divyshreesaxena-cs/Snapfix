const express = require('express');
const router = express.Router();
const { adminProtect } = require('../middleware/adminAuth');
const {
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
} = require('../controllers/adminController');

router.use(adminProtect);

router.get('/dashboard', getDashboard);
router.get('/customers', getCustomers);
router.get('/workers', getWorkers);
router.get('/bookings', getBookings);
router.get('/payments', getPayments);
router.get('/feedback', getFeedbacks);
router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);
router.patch('/customers/:id/block', setCustomerBlocked);
router.patch('/workers/:id/block', setWorkerBlocked);
router.patch('/workers/:id/verify', setWorkerVerification);
router.patch('/bookings/:id/cancel', cancelBooking);
router.delete('/feedback/:id', deleteFeedback);

module.exports = router;
