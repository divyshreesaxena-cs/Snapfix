const Worker = require('../models/Worker');

// @desc    Get worker profile
// @route   GET /api/worker/profile
// @access  Private (Worker)
const getWorkerProfile = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: req.worker
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching worker profile' });
  }
};

// @desc    Update worker profile (complete profile on first-time)
// @route   POST /api/worker/profile
// @access  Private (Worker)
const updateWorkerProfile = async (req, res) => {
  try {
    const {
      name,
      idProofNumber,
      servicesProvided,
      serviceCategory,
      pricePerHour,
      experience,
      skills,
      pincode,
      city,
      state,
      country,
      latitude,
      longitude
    } = req.body;

    const worker = await Worker.findById(req.worker.id);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    if (typeof name === 'string') worker.name = name.trim();
    if (typeof idProofNumber === 'string') worker.idProofNumber = idProofNumber.trim();

    // Services: accept array or single
    const normalizedServices = Array.isArray(servicesProvided)
      ? servicesProvided
      : (typeof servicesProvided === 'string' && servicesProvided ? [servicesProvided] : []);

    if (normalizedServices.length) {
      worker.servicesProvided = normalizedServices;
      // Keep backward compatibility: set primary category
      worker.serviceCategory = normalizedServices[0];
    } else if (serviceCategory) {
      worker.serviceCategory = serviceCategory;
      worker.servicesProvided = [serviceCategory];
    } else if (!worker.servicesProvided?.length && worker.serviceCategory) {
      worker.servicesProvided = [worker.serviceCategory];
    }

    if (pricePerHour !== undefined) worker.pricePerHour = Number(pricePerHour);
    if (experience !== undefined) worker.experience = Number(experience) || 0;

    if (Array.isArray(skills)) worker.skills = skills;

    // Location
    worker.location = worker.location || {};
    if (pincode) worker.location.pincode = pincode;
    if (city) worker.location.city = city;
    if (state) worker.location.state = state;
    if (latitude !== undefined) worker.location.latitude = Number(latitude);
    if (longitude !== undefined) worker.location.longitude = Number(longitude);

    // Basic profile complete rule for MVP
    worker.isProfileComplete = Boolean(worker.name && worker.phone && worker.workerId && worker.servicesProvided?.length && worker.location?.pincode);

    await worker.save();

    res.status(200).json({
      success: true,
      message: 'Worker profile updated',
      data: worker
    });
  } catch (error) {
    console.error(error);

    // Friendly validation error for rate bounds etc.
    if (error && error.name === 'ValidationError') {
      const firstKey = Object.keys(error.errors || {})[0];
      const msg = (firstKey && error.errors[firstKey] && error.errors[firstKey].message) || 'Validation failed';
      return res.status(400).json({ success: false, message: msg });
    }

    res.status(500).json({ success: false, message: 'Error updating worker profile' });
  }
};

module.exports = { getWorkerProfile, updateWorkerProfile };
