const CUSTOMER_ALLOWED_TRANSITIONS = {
  Pending: ['Cancelled'],
  Accepted: ['Cancelled'],
  Rejected: [],
  'In Progress': [],
  Completed: [],
  Cancelled: [],
};

const WORKER_ALLOWED_ACTIONS = {
  respond: {
    allowedCurrentStatus: ['Pending'],
    allowedCurrentWorkerStatus: ['Pending'],
    toBookingStatus: { Accepted: 'Accepted', Rejected: 'Rejected' },
  },
  start: {
    allowedCurrentStatus: ['Accepted'],
    allowedCurrentWorkerStatus: ['Accepted'],
    nextStatus: 'In Progress',
  },
  complete: {
    allowedCurrentStatus: ['Accepted', 'In Progress'],
    allowedCurrentWorkerStatus: ['Accepted'],
    nextStatus: 'Completed',
  },
};

function canCustomerTransition(currentStatus, nextStatus) {
  return (CUSTOMER_ALLOWED_TRANSITIONS[currentStatus] || []).includes(nextStatus);
}

function normalizeStatus(status) {
  return typeof status === 'string' ? status.trim() : status;
}

function getCancellationPenalty({ booking }) {
  const scheduledAt = new Date(booking.scheduledDate);
  const timeStr = String(booking.scheduledTime || '').trim();

  const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const meridiem = timeMatch[3].toUpperCase();

    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;

    scheduledAt.setHours(hours, minutes, 0, 0);
  }

  const now = new Date();
  const diffMs = scheduledAt.getTime() - now.getTime();
  const hoursBeforeService = diffMs / (1000 * 60 * 60);

  let amount = 0;
  let reason = 'No cancellation penalty';

  if (hoursBeforeService < 0) {
    amount = 250;
    reason = 'Booking cancelled after the scheduled service time';
  } else if (booking.status === 'Accepted' && hoursBeforeService < 3) {
    amount = 200;
    reason = 'Very late cancellation after worker acceptance';
  } else if (booking.status === 'Accepted' && hoursBeforeService < 12) {
    amount = 100;
    reason = 'Late cancellation after worker acceptance';
  } else if (hoursBeforeService < 6) {
    amount = 75;
    reason = 'Late cancellation close to service time';
  }

  return {
    amount,
    currency: 'INR',
    reason,
    hoursBeforeService: Math.round(hoursBeforeService * 100) / 100,
    applied: amount > 0,
  };
}

module.exports = {
  CUSTOMER_ALLOWED_TRANSITIONS,
  WORKER_ALLOWED_ACTIONS,
  canCustomerTransition,
  normalizeStatus,
  getCancellationPenalty,
};