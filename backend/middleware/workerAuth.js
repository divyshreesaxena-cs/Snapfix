const jwt = require('jsonwebtoken');
const Worker = require('../models/Worker');
const AppError = require('../utils/AppError');

const extractBearerToken = (req) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};

const workerProtect = async (req, res, next) => {
  try {
    const token = extractBearerToken(req);
    if (!token) throw new AppError('Not authorized, no token', 401, 'AUTH_TOKEN_MISSING');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'worker') throw new AppError('Access denied: worker token required', 403, 'AUTH_ROLE_INVALID');

    req.worker = await Worker.findById(decoded.id).select('-__v');
    if (!req.worker) throw new AppError('Not authorized, worker not found', 401, 'AUTH_WORKER_NOT_FOUND');
    if (req.worker.isBlocked) throw new AppError('Worker account is blocked', 403, 'ACCOUNT_BLOCKED');
    if ((req.worker.tokenVersion || 0) !== (decoded.tokenVersion || 0)) {
      throw new AppError('Session expired. Please login again.', 401, 'AUTH_SESSION_EXPIRED');
    }

    next();
  } catch (error) {
    next(error.isOperational ? error : new AppError('Not authorized, token failed', 401, 'AUTH_TOKEN_INVALID'));
  }
};

module.exports = { protectWorker: workerProtect };
