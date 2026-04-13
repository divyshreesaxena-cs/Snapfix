const { body, param } = require('express-validator');
const mongoose = require('mongoose');

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const createPaymentValidation = [
  body('bookingId')
    .trim()
    .notEmpty().withMessage('bookingId is required')
    .custom(isValidObjectId).withMessage('bookingId must be a valid ID'),
  body('hoursWorked')
    .notEmpty().withMessage('hoursWorked is required')
    .isFloat({ min: 0.5, max: 24 }).withMessage('hoursWorked must be between 0.5 and 24')
    .custom((value) => {
      const numeric = Number(value);
      if (!Number.isFinite(numeric) || Math.round(numeric * 2) !== numeric * 2) {
        throw new Error('hoursWorked must be in 0.5 hour increments');
      }
      return true;
    }),
];

const confirmPaymentValidation = [
  param('id').custom(isValidObjectId).withMessage('Payment ID is invalid'),
];

module.exports = {
  createPaymentValidation,
  confirmPaymentValidation,
};
