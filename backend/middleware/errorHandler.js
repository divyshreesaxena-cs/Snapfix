const multer = require('multer');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || (err instanceof multer.MulterError ? 400 : 500);
  const code = err.code || (statusCode >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST');
  const message = err.message || 'Internal Server Error';

  logger.error('Unhandled request error', {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    code,
    error: err,
  });

  const payload = {
    success: false,
    message,
    code,
    requestId: req.requestId,
  };

  if (err.details) payload.details = err.details;
  if (process.env.NODE_ENV === 'development') payload.stack = err.stack;

  res.status(statusCode).json(payload);
};

module.exports = errorHandler;
