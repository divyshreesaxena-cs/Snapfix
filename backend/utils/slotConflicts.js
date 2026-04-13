const Booking = require('../models/Booking');

const ACTIVE_SLOT_STATUSES = ['Pending', 'Accepted', 'In Progress'];

const findWorkerSlotConflict = async ({ workerId, scheduledDate, scheduledTime, excludeBookingId = null, statuses = ACTIVE_SLOT_STATUSES }) => {
  const query = {
    worker: workerId,
    scheduledDate: new Date(scheduledDate),
    scheduledTime,
    status: { $in: statuses },
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  return Booking.findOne(query).select('_id status scheduledDate scheduledTime');
};

module.exports = {
  ACTIVE_SLOT_STATUSES,
  findWorkerSlotConflict,
};
