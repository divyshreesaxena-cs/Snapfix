// backend/controllers/authController.js
const User = require('../models/User');
const OTP = require('../models/OTP');
const { generateToken, generateOTP, getOTPExpiry } = require('../utils/helpers');
const twoFactor = require('../services/twoFactorService');

// @desc    Send OTP (Customer)
// @route   POST /api/auth/send-otp
// @access  Public
const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    // Validate phone number
    if (!phone || !/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit phone number',
      });
    }

    // Delete existing CUSTOMER OTPs for this phone only
    await OTP.deleteMany({ phone, purpose: 'customer' });

    // Send OTP using 2Factor + store sessionId
    const { sessionId } = await twoFactor.sendOTP(phone);
    const expiresAt = getOTPExpiry(); // should return a Date

    await OTP.create({
      phone,
      purpose: 'customer',
      provider: '2factor',
      sessionId,
      expiresAt,
      verified: false,
    });

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error sending OTP',
    });
  }
};

// @desc    Verify OTP and login/register (Customer)
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Validate input
    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide phone and OTP',
      });
    }

    const enteredOtp = otp.toString().trim();

    // Find latest valid CUSTOMER 2Factor OTP session
    const otpRecord = await OTP.findOne({
      phone,
      purpose: 'customer',
      provider: '2factor',
      expiresAt: { $gt: new Date() },
      verified: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    // Verify with 2Factor using sessionId
    const isValid = await twoFactor.verifyOTP(otpRecord.sessionId, enteredOtp);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    // Mark OTP as verified (single-use)
    otpRecord.verified = true;
    await otpRecord.save();

    // Find or create user
    let user = await User.findOne({ phone });
    let isNewUser = false;

    if (!user) {
      user = await User.create({ phone });
      isNewUser = true;
    }

    // Generate token
    const token = generateToken(user._id, 'customer');


    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      token,
      user: {
        id: user._id,
        phone: user.phone,
        fullName: user.fullName,
        isProfileComplete: user.isProfileComplete,
      },
      isNewUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error verifying OTP',
    });
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
};
