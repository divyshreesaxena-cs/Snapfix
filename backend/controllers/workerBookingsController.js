const Booking = require('../models/Booking');
const Worker = require('../models/Worker');

// @desc    Get bookings assigned to logged-in worker
// @route   GET /api/worker/bookings
// @access  Private (Worker)
const getWorkerBookings = async (req, res) => {
  try {
    const { status } = req.query;

    const query = { worker: req.worker.id };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('user', 'fullName phone pincode city state')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching worker bookings' });
  }
};

// @desc    Accept / Reject a booking
// @route   PUT /api/worker/bookings/:id/respond
// @access  Private (Worker)
const respondToBooking = async (req, res) => {
  try {
    const { workerStatus } = req.body; // 'Accepted' | 'Rejected'

    if (!workerStatus || !['Accepted', 'Rejected'].includes(workerStatus)) {
      return res.status(400).json({ success: false, message: 'workerStatus must be Accepted or Rejected' });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.worker.toString() !== req.worker.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this booking' });
    }

    // Only allow response when pending
    if (booking.workerStatus !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Booking already responded' });
    }

    booking.workerStatus = workerStatus;
    booking.status = workerStatus === 'Accepted' ? 'Accepted' : 'Rejected';

    await booking.save();

    res.status(200).json({
      success: true,
      message: `Booking ${workerStatus.toLowerCase()}`,
      data: booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error responding to booking' });
  }
};

// @desc    Start job (set In Progress)
// @route   PUT /api/worker/bookings/:id/start
// @access  Private (Worker)
const startJob = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (booking.worker.toString() !== req.worker.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (booking.workerStatus !== 'Accepted' || booking.status !== 'Accepted') {
      return res.status(400).json({ success: false, message: 'Booking must be accepted before starting' });
    }

    booking.status = 'In Progress';
    await booking.save();

    res.status(200).json({ success: true, message: 'Job started', data: booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error starting job' });
  }
};

// @desc    Initiate completion (sets booking to Completed so customer can pay)
// @route   PUT /api/worker/bookings/:id/initiate-completion
// @access  Private (Worker)
const initiateCompletion = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (booking.worker.toString() !== req.worker.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (!['Accepted', 'In Progress'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Only active bookings can be completed' });
    }

    booking.status = 'Completed';
    booking.completionInitiatedBy = 'Worker';
    await booking.save();

    // Increment completed jobs counter (payment will still be processed separately)
    await Worker.findByIdAndUpdate(req.worker.id, { $inc: { completedJobs: 1 } });

    res.status(200).json({ success: true, message: 'Completion initiated. Customer can pay now.', data: booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error initiating completion' });
  }
};

module.exports = { getWorkerBookings, respondToBooking, startJob, initiateCompletion };
