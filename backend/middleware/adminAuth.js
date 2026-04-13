const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const AppError = require('../utils/AppError');

const extractBearerToken = (req) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};

const adminProtect = async (req, res, next) => {
  try {
    const token = extractBearerToken(req);
    if (!token) throw new AppError('Not authorized, no token', 401, 'AUTH_TOKEN_MISSING');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') throw new AppError('Access denied: admin token required', 403, 'AUTH_ROLE_INVALID');

    req.admin = await Admin.findById(decoded.id).select('-__v');
    if (!req.admin) throw new AppError('Not authorized, admin not found', 401, 'AUTH_ADMIN_NOT_FOUND');
    if (!req.admin.isActive) throw new AppError('Admin account is inactive', 403, 'ADMIN_INACTIVE');
    if ((req.admin.tokenVersion || 0) !== (decoded.tokenVersion || 0)) {
      throw new AppError('Session expired. Please login again.', 401, 'AUTH_SESSION_EXPIRED');
    }

    next();
  } catch (error) {
    next(error.isOperational ? error : new AppError('Not authorized, token failed', 401, 'AUTH_TOKEN_INVALID'));
  }
};

module.exports = { adminProtect };
