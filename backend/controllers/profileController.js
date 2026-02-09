const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
};

// @desc    Create/Update user profile
// @route   POST /api/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { fullName, pincode, city, state, country } = req.body;

    // Validate required fields
    if (!fullName || !pincode || !city || !state) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user
    user.fullName = fullName;
    user.pincode = pincode;
    user.city = city;
    user.state = state;
    user.country = country || 'India';
    user.isProfileComplete = true;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile
};
