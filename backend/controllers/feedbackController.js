const Feedback = require('../models/Feedback');
const Booking = require('../models/Booking');
const Worker = require('../models/Worker');

// @desc    Create feedback
// @route   POST /api/feedback
// @access  Private
const createFeedback = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    // Validate
    if (!bookingId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Please provide booking ID and rating'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Get booking
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify booking belongs to user
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check if booking is completed
    if (booking.status !== 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only provide feedback for completed bookings'
      });
    }

    // Check if feedback already exists
    const existingFeedback = await Feedback.findOne({ booking: bookingId });
    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'Feedback already submitted for this booking'
      });
    }

    // Create feedback
    const feedback = await Feedback.create({
      booking: bookingId,
      user: req.user.id,
      worker: booking.worker,
      rating,
      comment: comment || ''
    });

    // Update worker rating
    const worker = await Worker.findById(booking.worker);
    const totalRatings = worker.totalRatings || 0;
    const currentRating = worker.rating || 0;
    
    const newTotalRatings = totalRatings + 1;
    const newRating = ((currentRating * totalRatings) + rating) / newTotalRatings;

    worker.rating = Math.round(newRating * 10) / 10; // Round to 1 decimal
    worker.totalRatings = newTotalRatings;
    worker.totalReviews = newTotalRatings;
    
    await worker.save();

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error submitting feedback'
    });
  }
};

// @desc    Get feedback by booking
// @route   GET /api/feedback/booking/:bookingId
// @access  Private
const getFeedbackByBooking = async (req, res) => {
  try {
    const feedback = await Feedback.findOne({ booking: req.params.bookingId })
      .populate('worker', 'name serviceCategory');

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback'
    });
  }
};

// @desc    Get worker feedbacks
// @route   GET /api/feedback/worker/:workerId
// @access  Public
const getWorkerFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ worker: req.params.workerId })
      .populate('user', 'fullName')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      count: feedbacks.length,
      data: feedbacks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feedbacks'
    });
  }
};

module.exports = {
  createFeedback,
  getFeedbackByBooking,
  getWorkerFeedbacks
};
