const { body, param } = require('express-validator');

const allowedCategories = ['Electrician', 'Plumbing', 'Painting', 'Carpenter'];
const allowedStatuses = ['Cancelled'];

const createBookingValidation = [
  body('workerId')
    .trim()
    .notEmpty().withMessage('Please select a worker')
    .isMongoId().withMessage('Selected worker is invalid'),

  body('serviceCategory')
    .trim()
    .notEmpty().withMessage('Service category is required')
    .isIn(allowedCategories).withMessage('Invalid service category'),

  body('problemType')
    .trim()
    .notEmpty().withMessage('Problem type is required')
    .isLength({ min: 2, max: 100 }).withMessage('Problem type must be between 2 and 100 characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Please describe the issue')
    .isLength({ min: 5, max: 1000 }).withMessage('Description must be at least 5 characters'),

  body('scheduledDate')
    .notEmpty().withMessage('Please select a date')
    .isISO8601().withMessage('Scheduled date must be valid'),

  body('scheduledTime')
    .trim()
    .notEmpty().withMessage('Please select a time slot')
    .matches(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i).withMessage('Time must be in format like 10:00 AM'),

  body('addressFullAddress')
    .trim()
    .notEmpty().withMessage('Full address is required')
    .isLength({ min: 5, max: 300 }).withMessage('Full address must be at least 5 characters'),

  body('addressPincode')
    .trim()
    .notEmpty().withMessage('Pincode is required')
    .matches(/^[0-9]{6}$/).withMessage('Pincode must be 6 digits'),

  body('addressCity')
    .trim()
    .notEmpty().withMessage('City is required')
    .isLength({ min: 2, max: 80 }).withMessage('City must be between 2 and 80 characters'),

  body('addressState')
    .trim()
    .notEmpty().withMessage('State is required')
    .isLength({ min: 2, max: 80 }).withMessage('State must be between 2 and 80 characters'),
];

const updateBookingStatusValidation = [
  param('id')
    .isMongoId().withMessage('Booking id must be valid'),

  body('status')
    .trim()
    .notEmpty().withMessage('Status is required')
    .isIn(allowedStatuses).withMessage('Only cancellation is allowed from customer side'),

  body('cancellationReason')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('Cancellation reason cannot exceed 300 characters'),
];

module.exports = {
  createBookingValidation,
  updateBookingStatusValidation,
};