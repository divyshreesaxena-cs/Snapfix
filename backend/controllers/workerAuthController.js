const bcrypt = require('bcryptjs');
const Worker = require('../models/Worker');
const OTP = require('../models/OTP');
const { generateToken, getOTPExpiry, getTokenExpiry } = require('../utils/helpers');
const twoFactor = require('../services/twoFactorService');
const { createAuditLog } = require('../services/auditService');

const PHONE_REGEX = /^[0-9]{10}$/;
const MIN_PASSWORD_LENGTH = 8;
const OTP_COOLDOWN_MS = 60 * 1000;
const OTP_LOCK_MS = 10 * 60 * 1000;
const MAX_OTP_VERIFY_ATTEMPTS = 5;

const validatePassword = (password) => {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return null;
};

const getLatestActiveOtp = async (phone, purpose) =>
  OTP.findOne({
    phone,
    purpose,
    provider: '2factor',
    verified: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

const ensureOtpCanBeSent = async (phone, purpose) => {
  const existing = await getLatestActiveOtp(phone, purpose);
  if (!existing) return null;

  if (existing.lockedUntil && existing.lockedUntil > new Date()) {
    return 'Too many OTP attempts. Please wait before requesting a new OTP.';
  }

  if (
    existing.lastSentAt &&
    Date.now() - new Date(existing.lastSentAt).getTime() < OTP_COOLDOWN_MS
  ) {
    return 'Please wait at least 60 seconds before requesting another OTP.';
  }

  return null;
};

const registerOtpSession = async ({ phone, purpose, sessionId }) => {
  await OTP.deleteMany({ phone, purpose });

  return OTP.create({
    phone,
    purpose,
    provider: '2factor',
    sessionId,
    expiresAt: getOTPExpiry(),
    verified: false,
    verifyAttempts: 0,
    maxVerifyAttempts: MAX_OTP_VERIFY_ATTEMPTS,
    lockedUntil: null,
    lastSentAt: new Date(),
  });
};

const verifyOtpSession = async ({ phone, purpose, otp }) => {
  const otpRecord = await getLatestActiveOtp(phone, purpose);

  if (!otpRecord) {
    return {
      ok: false,
      status: 400,
      message: 'Invalid or expired OTP. Please request a new one.',
    };
  }

  if (otpRecord.lockedUntil && otpRecord.lockedUntil > new Date()) {
    return {
      ok: false,
      status: 429,
      message: 'Too many invalid OTP attempts. Please request a new OTP later.',
    };
  }

  const isValid = await twoFactor.verifyOTP(otpRecord.sessionId, String(otp).trim());

  if (!isValid) {
    otpRecord.verifyAttempts += 1;
    if (otpRecord.verifyAttempts >= (otpRecord.maxVerifyAttempts || MAX_OTP_VERIFY_ATTEMPTS)) {
      otpRecord.lockedUntil = new Date(Date.now() + OTP_LOCK_MS);
    }
    await otpRecord.save();

    return {
      ok: false,
      status: 400,
      message: 'Invalid or expired OTP. Please request a new one.',
    };
  }

  otpRecord.verified = true;
  otpRecord.verifyAttempts = 0;
  otpRecord.lockedUntil = null;
  await otpRecord.save();

  return { ok: true };
};

const buildWorkerAuthResponse = (worker, token, isNewWorker = false) => ({
  success: true,
  token,
  tokenType: 'Bearer',
  expiresIn: getTokenExpiry(),
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
    role: 'worker',
    authProvider: worker.authProvider || 'otp',
  },
  isNewWorker,
});

const sendWorkerOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !PHONE_REGEX.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit phone number',
      });
    }

    const blockReason = await ensureOtpCanBeSent(phone, 'worker');
    if (blockReason) {
      return res.status(429).json({ success: false, message: blockReason });
    }

    const { sessionId } = await twoFactor.sendOTP(phone);
    await registerOtpSession({ phone, purpose: 'worker', sessionId });

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    console.error('sendWorkerOTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error sending OTP',
    });
  }
};

const verifyWorkerOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide phone and OTP',
      });
    }

    const verification = await verifyOtpSession({
      phone,
      purpose: 'worker',
      otp,
    });

    if (!verification.ok) {
      return res.status(verification.status).json({
        success: false,
        message: verification.message,
      });
    }

    let worker = await Worker.findOne({ phone });
    let isNewWorker = false;

    if (!worker) {
      worker = await Worker.create({
        phone,
        name: '',
        servicesProvided: ['Electrician'],
        availability: true,
        isProfileComplete: false,
        authProvider: 'otp',
      });
      isNewWorker = true;
    }

    worker.lastLoginAt = new Date();
    await worker.save();

    const token = generateToken(worker._id, 'worker', worker.tokenVersion || 0);

    await createAuditLog({
      actorType: 'worker',
      actorId: worker._id,
      action: 'auth.worker.otp.verify',
      entityType: 'Worker',
      entityId: worker._id,
      metadata: { isNewWorker },
      req,
    });

    return res.status(200).json({
      ...buildWorkerAuthResponse(worker, token, isNewWorker),
      message: 'OTP verified successfully',
    });
  } catch (error) {
    console.error('verifyWorkerOTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying OTP',
    });
  }
};

const registerWorker = async (req, res) => {
  try {
    const { phone, username, password } = req.body;

    if (!phone || !PHONE_REGEX.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit phone number',
      });
    }

    if (!username || username.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters',
      });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    const normalizedUsername = username.trim().toLowerCase();

    const existingByPhone = await Worker.findOne({ phone });
    if (existingByPhone) {
      return res.status(400).json({
        success: false,
        message: 'Phone already registered. Please login.',
      });
    }

    const existingByUsername = await Worker.findOne({ username: normalizedUsername });
    if (existingByUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username already taken',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const worker = await Worker.create({
      phone,
      username: normalizedUsername,
      passwordHash,
      name: '',
      servicesProvided: ['Electrician'],
      availability: true,
      isProfileComplete: false,
      authProvider: 'password',
      lastLoginAt: new Date(),
    });

    const token = generateToken(worker._id, 'worker', worker.tokenVersion || 0);

    await createAuditLog({
      actorType: 'worker',
      actorId: worker._id,
      action: 'auth.worker.register',
      entityType: 'Worker',
      entityId: worker._id,
      metadata: {},
      req,
    });

    return res.status(201).json({
      ...buildWorkerAuthResponse(worker, token, true),
      message: 'Registered successfully',
    });
  } catch (error) {
    console.error('registerWorker error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error registering worker',
    });
  }
};

const loginWorker = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username/phone and password',
      });
    }

    const isPhone = PHONE_REGEX.test(identifier.trim());
    const query = isPhone
      ? { phone: identifier.trim() }
      : { username: identifier.trim().toLowerCase() };

    const worker = await Worker.findOne(query).select('+passwordHash');

    if (!worker || !worker.passwordHash) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (worker.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Worker account is blocked',
      });
    }

    const ok = await bcrypt.compare(password, worker.passwordHash);
    if (!ok) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (worker.authProvider !== 'password') {
      worker.authProvider = 'password';
    }

    worker.lastLoginAt = new Date();
    await worker.save();

    const token = generateToken(worker._id, 'worker', worker.tokenVersion || 0);

    await createAuditLog({
      actorType: 'worker',
      actorId: worker._id,
      action: 'auth.worker.login',
      entityType: 'Worker',
      entityId: worker._id,
      metadata: {},
      req,
    });

    return res.status(200).json({
      ...buildWorkerAuthResponse(worker, token, false),
      message: 'Logged in successfully',
    });
  } catch (error) {
    console.error('loginWorker error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error logging in',
    });
  }
};

const forgotPasswordSendOTPWorker = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !PHONE_REGEX.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit phone number',
      });
    }

    const worker = await Worker.findOne({ phone });
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'No worker account found for this phone',
      });
    }

    const blockReason = await ensureOtpCanBeSent(phone, 'forgot_password_worker');
    if (blockReason) {
      return res.status(429).json({ success: false, message: blockReason });
    }

    const { sessionId } = await twoFactor.sendOTP(phone);
    await registerOtpSession({ phone, purpose: 'forgot_password_worker', sessionId });

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    console.error('forgotPasswordSendOTPWorker error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error sending OTP',
    });
  }
};

const forgotPasswordVerifyOTPWorker = async (req, res) => {
  try {
    const { phone, otp, newPassword } = req.body;

    if (!phone || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide phone, otp, and newPassword',
      });
    }

    if (!PHONE_REGEX.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit phone number',
      });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    const verification = await verifyOtpSession({
      phone,
      purpose: 'forgot_password_worker',
      otp,
    });

    if (!verification.ok) {
      return res.status(verification.status).json({
        success: false,
        message: verification.message,
      });
    }

    const worker = await Worker.findOne({ phone }).select('+passwordHash');
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'No worker account found for this phone',
      });
    }

    worker.passwordHash = await bcrypt.hash(newPassword, 10);
    worker.authProvider = 'password';
    worker.tokenVersion = (worker.tokenVersion || 0) + 1;
    worker.lastLoginAt = null;
    await worker.save();

    await createAuditLog({
      actorType: 'worker',
      actorId: worker._id,
      action: 'auth.worker.password_reset',
      entityType: 'Worker',
      entityId: worker._id,
      metadata: {},
      req,
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. Please login again.',
    });
  } catch (error) {
    console.error('forgotPasswordVerifyOTPWorker error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error resetting password',
    });
  }
};

module.exports = {
  sendWorkerOTP,
  verifyWorkerOTP,
  registerWorker,
  loginWorker,
  forgotPasswordSendOTPWorker,
  forgotPasswordVerifyOTPWorker,
};