const Booking = require('../models/Booking');
const Worker = require('../models/Worker');
const Payment = require('../models/Payment');
const Feedback = require('../models/Feedback');

// @desc    Create booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
  try {
    const {
      workerId,
      serviceCategory,
      problemType,
      description,
      scheduledDate,
      scheduledTime,

      // ✅ from frontend (ServiceRequest -> stored -> sent in ScheduleBooking)
      addressFullAddress,
      addressPincode,
      addressCity,
      addressState,
    } = req.body;

    // Validate required fields
    if (
      !workerId ||
      !serviceCategory ||
      !problemType ||
      !description ||
      !scheduledDate ||
      !scheduledTime ||
      !addressFullAddress ||
      !addressPincode ||
      !addressCity ||
      !addressState
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Verify worker exists
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found',
      });
    }

    // Get images from request (if uploaded)
    const images = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];

    // Create booking
    const booking = await Booking.create({
      user: req.user.id,
      worker: workerId,
      serviceCategory,
      problemType,
      description,
      images,
      scheduledDate,
      scheduledTime,
      address: {
        pincode: addressPincode,
        city: addressCity,
        state: addressState,
        fullAddress: addressFullAddress,
      },
    });

    // Populate worker details
    await booking.populate('worker', 'name phone serviceCategory pricePerHour rating');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
    });
  }
};

// @desc    Get user bookings
// @route   GET /api/bookings
// @access  Private
const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('worker', 'name phone serviceCategory pricePerHour rating profileImage')
      .sort({ createdAt: -1 });

    const bookingIds = bookings.map((b) => b._id);

    const payments = await Payment.find({
      booking: { $in: bookingIds },
      paymentStatus: 'Completed',
    }).select('booking');

    const feedbacks = await Feedback.find({
      booking: { $in: bookingIds },
    }).select('booking');

    const paidSet = new Set(payments.map((p) => String(p.booking)));
    const feedbackSet = new Set(feedbacks.map((f) => String(f.booking)));

    const enriched = bookings.map((b) => {
      const obj = b.toObject();
      obj.hasPaid = paidSet.has(String(b._id));
      obj.hasFeedback = feedbackSet.has(String(b._id));
      return obj;
    });

    res.status(200).json({
      success: true,
      data: enriched,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error getting bookings',
    });
  }
};

// @desc    Get booking details
// @route   GET /api/bookings/:id
// @access  Private
const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('worker', 'name phone serviceCategory pricePerHour rating profileImage')
      .populate('user', 'fullName phone pincode city state');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const payment = await Payment.findOne({
      booking: booking._id,
      paymentStatus: 'Completed',
    }).select('_id');

    const feedback = await Feedback.findOne({ booking: booking._id }).select('_id');

    const obj = booking.toObject();
    obj.hasPaid = !!payment;
    obj.hasFeedback = !!feedback;

    res.status(200).json({
      success: true,
      data: obj,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error getting booking',
    });
  }
};

// @desc    Update booking status (customer actions like cancel)
// @route   PUT /api/bookings/:id/status
// @access  Private
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    booking.status = status;
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking status updated',
      data: booking,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking status',
    });
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBooking,
  updateBookingStatus,
};
