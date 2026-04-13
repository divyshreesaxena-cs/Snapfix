const express = require('express');
const router = express.Router();
const {
  createFeedback,
  getFeedbackByBooking,
  getWorkerFeedbacks
} = require('../controllers/feedbackController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createFeedback);
router.get('/booking/:bookingId', protect, getFeedbackByBooking);
router.get('/worker/:workerId', getWorkerFeedbacks);

module.exports = router;
