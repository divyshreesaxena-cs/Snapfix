// backend/controllers/authController.js
const bcrypt = require('bcryptjs');
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
// @desc    Register with username + password (Customer)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { phone, username, password } = req.body;

    if (!phone || !/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit phone number' });
    }
    if (!username || username.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Username must be at least 3 characters' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const normalizedUsername = username.trim().toLowerCase();

    // Ensure phone/username are unique
    const existingByPhone = await User.findOne({ phone });
    if (existingByPhone) {
      return res.status(400).json({ success: false, message: 'Phone already registered. Please login.' });
    }

    const existingByUsername = await User.findOne({ username: normalizedUsername });
    if (existingByUsername) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      phone,
      username: normalizedUsername,
      passwordHash,
      isProfileComplete: false,
    });

    const token = generateToken(user._id, 'customer');

    return res.status(201).json({
      success: true,
      message: 'Registered successfully',
      token,
      user: {
        id: user._id,
        phone: user.phone,
        username: user.username,
        fullName: user.fullName,
        isProfileComplete: user.isProfileComplete,
        role: 'customer',
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error registering user' });
  }
};

// @desc    Login with username + password (Customer)
// @route   POST /api/auth/login
// @access  Public
// @desc    Login with username OR phone + password (Customer)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { identifier, username, phone, password } = req.body;

    const id = (identifier || username || phone || '').toString().trim().toLowerCase();

    if (!id || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username/phone and password',
      });
    }

    // passwordHash is select:false, so explicitly select it
    const user = await User.findOne({
      $or: [
        { username: id },
        { phone: id }
      ]
    }).select('+passwordHash');

    if (!user || !user.passwordHash) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = generateToken(user._id, 'customer');

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        phone: user.phone,
        username: user.username,
        fullName: user.fullName,
        isProfileComplete: user.isProfileComplete,
        role: 'customer',
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error logging in',
    });
  }
};

// @desc    Send OTP for forgot password (Customer)
// @route   POST /api/auth/forgot-password/send-otp
// @access  Public
const forgotPasswordSendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit phone number' });
    }

    // Must exist as a registered user
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found for this phone' });
    }

    // Clear previous forgot-password OTP sessions
    await OTP.deleteMany({ phone, purpose: 'forgot_password_customer' });

    // Send OTP using 2Factor + store sessionId
    const { sessionId } = await twoFactor.sendOTP(phone);
    const expiresAt = getOTPExpiry();

    await OTP.create({
      phone,
      purpose: 'forgot_password_customer',
      provider: '2factor',
      sessionId,
      expiresAt,
      verified: false
    });

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error sending OTP' });
  }
};

// @desc    Verify OTP + reset password (Customer)
// @route   POST /api/auth/forgot-password/verify-otp
// @access  Public
const forgotPasswordVerifyOTP = async (req, res) => {
  try {
    const { phone, otp, newPassword } = req.body;

    if (!phone || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide phone, otp, and newPassword' });
    }
    if (!/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit phone number' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Find latest forgot-password session
    const otpRecord = await OTP.findOne({
      phone,
      purpose: 'forgot_password_customer',
      provider: '2factor',
      verified: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP. Please request a new one.' });
    }

    const enteredOtp = otp.toString().trim();
    const isValid = await twoFactor.verifyOTP(otpRecord.sessionId, enteredOtp);

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }

    otpRecord.verified = true;
    await otpRecord.save();

    // Update password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Select passwordHash because it's select:false in model
    const user = await User.findOne({ phone }).select('+passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found for this phone' });
    }

    user.passwordHash = passwordHash;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. Please login with your username/password.'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error resetting password' });
  }
};
module.exports = {
  sendOTP,
  verifyOTP,
  register,
  login,
  forgotPasswordSendOTP,
  forgotPasswordVerifyOTP,
};

