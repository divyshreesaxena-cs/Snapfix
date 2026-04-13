const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array().map((error) => ({
    field: error.path,
    message: error.msg,
    value: error.value,
  }))));
};

module.exports = { handleValidationErrors };
