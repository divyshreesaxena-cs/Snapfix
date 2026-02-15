// backend/controllers/workerAuthController.js
const bcrypt = require('bcryptjs');
const Worker = require('../models/Worker');
const OTP = require('../models/OTP');
const { generateToken, getOTPExpiry } = require('../utils/helpers');
const twoFactor = require('../services/twoFactorService');

// -----------------------------
// 1) OTP LOGIN (Worker) - Send
// -----------------------------
const sendWorkerOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit phone number',
      });
    }

    await OTP.deleteMany({ phone, purpose: 'worker' });

    const { sessionId } = await twoFactor.sendOTP(phone);
    const expiresAt = getOTPExpiry();

    await OTP.create({
      phone,
      purpose: 'worker',
      provider: '2factor',
      sessionId,
      expiresAt,
      verified: false,
    });

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    console.error('❌ sendWorkerOTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error sending OTP',
    });
  }
};

// -----------------------------
// 2) OTP LOGIN (Worker) - Verify
// -----------------------------
const verifyWorkerOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide phone and OTP',
      });
    }

    const otpRecord = await OTP.findOne({
      phone,
      purpose: 'worker',
      provider: '2factor',
      verified: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please request a new one.',
      });
    }

    const enteredOtp = otp.toString().trim();
    const isValid = await twoFactor.verifyOTP(otpRecord.sessionId, enteredOtp);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please request a new one.',
      });
    }

    otpRecord.verified = true;
    await otpRecord.save();

    let worker = await Worker.findOne({ phone });
    let isNewWorker = false;

    if (!worker) {
      const workerId =
        'WRK' + Date.now() + Math.random().toString(36).slice(2, 6).toUpperCase();

      // ✅ Create minimal worker (profile incomplete)
      worker = await Worker.create({
        phone,
        workerId,
        name: '',
        servicesProvided: ['Electrician'], // safe default
        availability: true,
        isProfileComplete: false,
        authProvider: 'otp',
      });

      isNewWorker = true;
    }

    const token = generateToken(worker._id, 'worker');

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      token,
      worker: {
        id: worker._id,
        workerId: worker.workerId,
        phone: worker.phone,
        username: worker.username || null,
        name: worker.name,
        idProofNumber: worker.idProofNumber || '',
        servicesProvided:
          worker.servicesProvided && worker.servicesProvided.length
            ? worker.servicesProvided
            : worker.serviceCategory
            ? [worker.serviceCategory]
            : [],
        serviceCategory: worker.serviceCategory || '',
        pricePerHour: worker.pricePerHour ?? 0,
        experience: worker.experience ?? 0,
        location: worker.location || {},
        isProfileComplete: worker.isProfileComplete,
        authProvider: worker.authProvider || 'otp',
      },
      isNewWorker,
    });
  } catch (error) {
    console.error('❌ verifyWorkerOTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying OTP',
      error: error.message,
    });
  }
};

// --------------------------------------
// 3) REGISTER (Worker) - Username/Password
// --------------------------------------
const registerWorker = async (req, res) => {
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

    const existingByPhone = await Worker.findOne({ phone });
    if (existingByPhone) {
      return res.status(400).json({ success: false, message: 'Phone already registered. Please login.' });
    }

    const existingByUsername = await Worker.findOne({ username: normalizedUsername });
    if (existingByUsername) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }

    // ✅ Always auto-generate workerId (do not accept from client)
    const finalWorkerId =
      'WRK' + Date.now() + Math.random().toString(36).slice(2, 6).toUpperCase();

    const passwordHash = await bcrypt.hash(password, 10);

    const worker = await Worker.create({
      phone,
      username: normalizedUsername,
      passwordHash,
      workerId: finalWorkerId,
      name: '',
      servicesProvided: ['Electrician'], // default
      availability: true,
      isProfileComplete: false,
      authProvider: 'password',
    });

    const token = generateToken(worker._id, 'worker');

    return res.status(201).json({
      success: true,
      message: 'Registered successfully',
      token,
      worker: {
        id: worker._id,
        workerId: worker.workerId,
        phone: worker.phone,
        username: worker.username,
        name: worker.name,
        isProfileComplete: worker.isProfileComplete,
        role: 'worker',
        authProvider: worker.authProvider,
      },
      isNewWorker: true,
    });
  } catch (error) {
    console.error('❌ registerWorker error:', error);
    return res.status(500).json({ success: false, message: 'Error registering worker' });
  }
};

// --------------------------------------
// 4) LOGIN (Worker) - Username OR Phone + Password
// --------------------------------------
const loginWorker = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    // identifier = username OR phone

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username/phone and password' });
    }

    const isPhone = /^[0-9]{10}$/.test(identifier.trim());
    const query = isPhone
      ? { phone: identifier.trim() }
      : { username: identifier.trim().toLowerCase() };

    const worker = await Worker.findOne(query).select('+passwordHash');
    if (!worker || !worker.passwordHash) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, worker.passwordHash);
    if (!ok) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // ensure authProvider marked as password once they use password login
    if (worker.authProvider !== 'password') {
      worker.authProvider = 'password';
      await worker.save();
    }

    const token = generateToken(worker._id, 'worker');

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      worker: {
        id: worker._id,
        workerId: worker.workerId,
        phone: worker.phone,
        username: worker.username || null,
        name: worker.name,
        isProfileComplete: worker.isProfileComplete,
        role: 'worker',
        authProvider: worker.authProvider,
      },
    });
  } catch (error) {
    console.error('❌ loginWorker error:', error);
    return res.status(500).json({ success: false, message: 'Error logging in' });
  }
};

// --------------------------------------
// 5) FORGOT PASSWORD (Worker) - Send OTP
// --------------------------------------
const forgotPasswordSendOTPWorker = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit phone number' });
    }

    const worker = await Worker.findOne({ phone });
    if (!worker) {
      return res.status(404).json({ success: false, message: 'No worker account found for this phone' });
    }

    await OTP.deleteMany({ phone, purpose: 'forgot_password_worker' });

    const { sessionId } = await twoFactor.sendOTP(phone);
    const expiresAt = getOTPExpiry();

    await OTP.create({
      phone,
      purpose: 'forgot_password_worker',
      provider: '2factor',
      sessionId,
      expiresAt,
      verified: false,
    });

    return res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('❌ forgotPasswordSendOTPWorker error:', error);
    return res.status(500).json({ success: false, message: 'Error sending OTP' });
  }
};

// --------------------------------------
// 6) FORGOT PASSWORD (Worker) - Verify OTP + Reset
// --------------------------------------
const forgotPasswordVerifyOTPWorker = async (req, res) => {
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

    const otpRecord = await OTP.findOne({
      phone,
      purpose: 'forgot_password_worker',
      provider: '2factor',
      verified: false,
      expiresAt: { $gt: new Date() },
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

    const worker = await Worker.findOne({ phone }).select('+passwordHash');
    if (!worker) {
      return res.status(404).json({ success: false, message: 'No worker account found for this phone' });
    }

    // If worker never created username before, you MUST keep their existing username OR create flow in UI.
    // Here we just reset passwordHash.
    const passwordHash = await bcrypt.hash(newPassword, 10);
    worker.passwordHash = passwordHash;
    worker.authProvider = 'password';
    await worker.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. Please login with username/phone + new password.',
    });
  } catch (error) {
    console.error('❌ forgotPasswordVerifyOTPWorker error:', error);
    return res.status(500).json({ success: false, message: 'Error resetting password' });
  }
};

module.exports = {
  // OTP login
  sendWorkerOTP,
  verifyWorkerOTP,

  // Password auth
  registerWorker,
  loginWorker,

  // Forgot password
  forgotPasswordSendOTPWorker,
  forgotPasswordVerifyOTPWorker,
};
