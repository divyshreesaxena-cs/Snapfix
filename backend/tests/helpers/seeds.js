const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const Worker = require('../../models/Worker');
const Admin = require('../../models/Admin');
const Booking = require('../../models/Booking');

const createUser = async (overrides = {}) => User.create({
  phone: '9999999999',
  username: 'customer1',
  passwordHash: await bcrypt.hash('Password123', 10),
  fullName: 'Customer One',
  isProfileComplete: true,
  ...overrides,
});

const createWorker = async (overrides = {}) => Worker.create({
  name: 'Worker One',
  phone: String(overrides.phone || '8888888888'),
  authProvider: 'password',
  username: overrides.username || 'worker1',
  passwordHash: await bcrypt.hash('Password123', 10),
  serviceCategory: 'Electrician',
  servicesProvided: ['Electrician'],
  pricePerHour: 300,
  isProfileComplete: true,
  isVerified: true,
  ...overrides,
});

const createAdmin = async (overrides = {}) => Admin.create({
  name: 'Admin User',
  email: 'admin@test.com',
  passwordHash: await bcrypt.hash('Admin12345', 10),
  ...overrides,
});

const createBooking = async ({ user, worker, overrides = {} }) => Booking.create({
  user: user._id,
  worker: worker._id,
  serviceCategory: 'Electrician',
  problemType: 'Fan not working',
  description: 'Ceiling fan stopped working',
  scheduledDate: new Date('2030-01-01'),
  scheduledTime: '10:00 AM',
  address: {
    pincode: '302001', city: 'Jaipur', state: 'Rajasthan', fullAddress: '123 Main Street',
  },
  ...overrides,
});

module.exports = { createUser, createWorker, createAdmin, createBooking };
