const bcrypt = require('bcryptjs');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { generateToken, getOTPExpiry, getTokenExpiry } = require('../utils/helpers');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
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
    throw new AppError('Invalid or expired OTP. Please request a new one.', 400, 'OTP_INVALID');
  }

  if (otpRecord.lockedUntil && otpRecord.lockedUntil > new Date()) {
    throw new AppError(
      'Too many invalid OTP attempts. Please request a new OTP later.',
      429,
      'OTP_LOCKED'
    );
  }

  const isValid = await twoFactor.verifyOTP(otpRecord.sessionId, String(otp).trim());

  if (!isValid) {
    otpRecord.verifyAttempts += 1;
    if (otpRecord.verifyAttempts >= (otpRecord.maxVerifyAttempts || MAX_OTP_VERIFY_ATTEMPTS)) {
      otpRecord.lockedUntil = new Date(Date.now() + OTP_LOCK_MS);
    }
    await otpRecord.save();

    throw new AppError('Invalid or expired OTP. Please request a new one.', 400, 'OTP_INVALID');
  }

  otpRecord.verified = true;
  otpRecord.verifyAttempts = 0;
  otpRecord.lockedUntil = null;
  await otpRecord.save();
};

const buildAuthResponse = (user, token, isNewUser = false) => ({
  success: true,
  message: 'Authentication successful',
  token,
  tokenType: 'Bearer',
  expiresIn: getTokenExpiry(),
  user: {
    id: user._id,
    phone: user.phone,
    username: user.username,
    fullName: user.fullName,
    isProfileComplete: user.isProfileComplete,
    role: 'customer',
  },
  isNewUser,
});

const sendOTP = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone || !PHONE_REGEX.test(phone)) {
    throw new AppError('Please provide a valid 10-digit phone number', 400, 'PHONE_INVALID');
  }

  const blockReason = await ensureOtpCanBeSent(phone, 'customer');
  if (blockReason) {
    throw new AppError(blockReason, 429, 'OTP_RATE_LIMITED');
  }

  const { sessionId } = await twoFactor.sendOTP(phone);
  await registerOtpSession({ phone, purpose: 'customer', sessionId });

  await createAuditLog({
    actorType: 'system',
    action: 'auth.customer.otp.send',
    entityType: 'OTP',
    metadata: { phone, provider: '2factor' },
    req,
  });

  res.status(200).json({ success: true, message: 'OTP sent successfully' });
});

const verifyOTP = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    throw new AppError('Please provide phone and OTP', 400, 'OTP_INPUT_REQUIRED');
  }

  await verifyOtpSession({ phone, purpose: 'customer', otp });

  let user = await User.findOne({ phone });
  let isNewUser = false;

  if (!user) {
    user = await User.create({ phone });
    isNewUser = true;
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = generateToken(user._id, 'customer', user.tokenVersion || 0);

  await createAuditLog({
    actorType: 'customer',
    actorId: user._id,
    action: 'auth.customer.otp.verify',
    entityType: 'User',
    entityId: user._id,
    metadata: { isNewUser },
    req,
  });

  res.status(200).json({
    ...buildAuthResponse(user, token, isNewUser),
    message: 'OTP verified successfully',
  });
});

const register = asyncHandler(async (req, res) => {
  const { phone, username, password } = req.body;

  if (!phone || !PHONE_REGEX.test(phone)) {
    throw new AppError('Please provide a valid 10-digit phone number', 400, 'PHONE_INVALID');
  }

  if (!username || username.trim().length < 3) {
    throw new AppError('Username must be at least 3 characters', 400, 'USERNAME_INVALID');
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    throw new AppError(passwordError, 400, 'PASSWORD_INVALID');
  }

  const normalizedUsername = username.trim().toLowerCase();

  if (await User.findOne({ phone })) {
    throw new AppError('Phone already registered. Please login.', 400, 'PHONE_EXISTS');
  }

  if (await User.findOne({ username: normalizedUsername })) {
    throw new AppError('Username already taken', 400, 'USERNAME_EXISTS');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    phone,
    username: normalizedUsername,
    passwordHash,
    isProfileComplete: false,
    lastLoginAt: new Date(),
  });

  const token = generateToken(user._id, 'customer', user.tokenVersion || 0);

  await createAuditLog({
    actorType: 'customer',
    actorId: user._id,
    action: 'auth.customer.register',
    entityType: 'User',
    entityId: user._id,
    metadata: {},
    req,
  });

  res.status(201).json({
    ...buildAuthResponse(user, token, false),
    message: 'Registered successfully',
  });
});

const login = asyncHandler(async (req, res) => {
  const { identifier, username, phone, password } = req.body;
  const id = (identifier || username || phone || '').toString().trim().toLowerCase();

  if (!id || !password) {
    throw new AppError('Please provide username/phone and password', 400, 'LOGIN_INPUT_REQUIRED');
  }

  const user = await User.findOne({
    $or: [{ username: id }, { phone: id }],
  }).select('+passwordHash');

  if (!user || !user.passwordHash) {
    throw new AppError('Invalid credentials', 400, 'LOGIN_INVALID');
  }

  if (user.isBlocked) {
    throw new AppError('Account is blocked', 403, 'ACCOUNT_BLOCKED');
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new AppError('Invalid credentials', 400, 'LOGIN_INVALID');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = generateToken(user._id, 'customer', user.tokenVersion || 0);

  await createAuditLog({
    actorType: 'customer',
    actorId: user._id,
    action: 'auth.customer.login',
    entityType: 'User',
    entityId: user._id,
    metadata: {},
    req,
  });

  res.status(200).json({
    ...buildAuthResponse(user, token, false),
    message: 'Logged in successfully',
  });
});

const forgotPasswordSendOTP = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone || !PHONE_REGEX.test(phone)) {
    throw new AppError('Please provide a valid 10-digit phone number', 400, 'PHONE_INVALID');
  }

  const user = await User.findOne({ phone });
  if (!user) {
    throw new AppError('No account found for this phone', 404, 'ACCOUNT_NOT_FOUND');
  }

  const blockReason = await ensureOtpCanBeSent(phone, 'forgot_password_customer');
  if (blockReason) {
    throw new AppError(blockReason, 429, 'OTP_RATE_LIMITED');
  }

  const { sessionId } = await twoFactor.sendOTP(phone);
  await registerOtpSession({ phone, purpose: 'forgot_password_customer', sessionId });

  await createAuditLog({
    actorType: 'customer',
    actorId: user._id,
    action: 'auth.customer.password_reset_otp.send',
    entityType: 'User',
    entityId: user._id,
    metadata: { provider: '2factor' },
    req,
  });

  res.status(200).json({ success: true, message: 'OTP sent successfully' });
});

const forgotPasswordVerifyOTP = asyncHandler(async (req, res) => {
  const { phone, otp, newPassword } = req.body;

  if (!phone || !otp || !newPassword) {
    throw new AppError('Please provide phone, otp, and newPassword', 400, 'RESET_INPUT_REQUIRED');
  }

  if (!PHONE_REGEX.test(phone)) {
    throw new AppError('Please provide a valid 10-digit phone number', 400, 'PHONE_INVALID');
  }

  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    throw new AppError(passwordError, 400, 'PASSWORD_INVALID');
  }

  await verifyOtpSession({ phone, purpose: 'forgot_password_customer', otp });

  const user = await User.findOne({ phone }).select('+passwordHash');
  if (!user) {
    throw new AppError('No account found for this phone', 404, 'ACCOUNT_NOT_FOUND');
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  user.lastLoginAt = null;
  await user.save();

  await createAuditLog({
    actorType: 'customer',
    actorId: user._id,
    action: 'auth.customer.password_reset',
    entityType: 'User',
    entityId: user._id,
    metadata: {},
    req,
  });

  res.status(200).json({
    success: true,
    message: 'Password reset successful. Please login again.',
  });
});

module.exports = {
  sendOTP,
  verifyOTP,
  register,
  login,
  forgotPasswordSendOTP,
  forgotPasswordVerifyOTP,
};