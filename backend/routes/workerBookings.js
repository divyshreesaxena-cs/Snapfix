const express = require('express');
const router = express.Router();
const { protectWorker } = require('../middleware/workerAuth');
const { getWorkerBookings, respondToBooking, startJob, initiateCompletion } = require('../controllers/workerBookingsController');

router.get('/', protectWorker, getWorkerBookings);
router.put('/:id/respond', protectWorker, respondToBooking);
router.put('/:id/start', protectWorker, startJob);
router.put('/:id/initiate-completion', protectWorker, initiateCompletion);

module.exports = router;
