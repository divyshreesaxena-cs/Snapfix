const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const extractBearerToken = (req) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};

const protect = async (req, res, next) => {
  try {
    const token = extractBearerToken(req);
    if (!token) throw new AppError('Not authorized, no token', 401, 'AUTH_TOKEN_MISSING');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'customer') throw new AppError('Access denied: customer token required', 403, 'AUTH_ROLE_INVALID');

    req.user = await User.findById(decoded.id).select('-__v');
    if (!req.user) throw new AppError('Not authorized, user not found', 401, 'AUTH_USER_NOT_FOUND');
    if (req.user.isBlocked) throw new AppError('Account is blocked', 403, 'ACCOUNT_BLOCKED');
    if ((req.user.tokenVersion || 0) !== (decoded.tokenVersion || 0)) {
      throw new AppError('Session expired. Please login again.', 401, 'AUTH_SESSION_EXPIRED');
    }

    next();
  } catch (error) {
    next(error.isOperational ? error : new AppError('Not authorized, token failed', 401, 'AUTH_TOKEN_INVALID'));
  }
};

module.exports = { protect, extractBearerToken };
