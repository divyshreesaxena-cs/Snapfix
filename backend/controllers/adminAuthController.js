const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { signToken } = require('../services/authService');
const { createAuditLog } = require('../services/auditService');

const sanitizeAdmin = (adminDoc) => ({
  _id: adminDoc._id,
  name: adminDoc.name,
  email: adminDoc.email,
  role: adminDoc.role,
  isActive: adminDoc.isActive,
  isApproved: adminDoc.isApproved,
  lastLoginAt: adminDoc.lastLoginAt,
  createdAt: adminDoc.createdAt,
  updatedAt: adminDoc.updatedAt,
});

const adminLogin = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!email || !password) {
    throw new AppError('Email and password are required', 400, 'LOGIN_INPUT_REQUIRED');
  }

  const allowedAdminEmails = String(process.env.ADMIN_ALLOWED_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowedAdminEmails.length > 0 && !allowedAdminEmails.includes(email)) {
    throw new AppError('This email is not allowed for admin access', 403, 'ADMIN_EMAIL_NOT_ALLOWED');
  }

  const admin = await Admin.findOne({ email }).select('+passwordHash');
  if (!admin) throw new AppError('Invalid credentials', 401, 'LOGIN_INVALID');
  if (!admin.isActive) throw new AppError('Admin account is inactive', 403, 'ADMIN_INACTIVE');
  if (!admin.isApproved) throw new AppError('Admin account is not approved', 403, 'ADMIN_NOT_APPROVED');

  const isMatch = await bcrypt.compare(password, admin.passwordHash);
  if (!isMatch) throw new AppError('Invalid credentials', 401, 'LOGIN_INVALID');

  admin.lastLoginAt = new Date();
  await admin.save();

  const token = signToken(admin, 'admin');

  await createAuditLog({
    actorType: 'admin',
    actorId: admin._id,
    action: 'auth.admin.login',
    entityType: 'Admin',
    entityId: admin._id,
    metadata: {},
    req,
  });

  res.status(200).json({
    success: true,
    message: 'Admin login successful',
    token,
    tokenType: 'Bearer',
    expiresIn: process.env.JWT_EXPIRE || process.env.JWT_EXPIRES_IN || '12h',
    admin: sanitizeAdmin(admin),
  });
});

const getAdminMe = asyncHandler(async (req, res) => {
  const admin = req.admin;
  if (!admin) throw new AppError('Admin not found', 404, 'ADMIN_NOT_FOUND');

  res.status(200).json({
    success: true,
    data: sanitizeAdmin(admin),
  });
});

module.exports = { adminLogin, getAdminMe };