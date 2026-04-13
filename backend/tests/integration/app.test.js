const request = require('supertest');
const bcrypt = require('bcryptjs');
const createApp = require('../../app');
const { connectTestDb, cleanupDb, disconnectTestDb } = require('../helpers/testDb');
const { createUser, createWorker, createAdmin, createBooking } = require('../helpers/seeds');
const User = require('../../models/User');
const Booking = require('../../models/Booking');
const Payment = require('../../models/Payment');
const AuditLog = require('../../models/AuditLog');

jest.mock('../../services/twoFactorService', () => ({
  sendOTP: jest.fn(async () => ({ sessionId: 'session-123' })),
  verifyOTP: jest.fn(async () => true),
}));

describe('SnapFix integration tests', () => {
  let app;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.NODE_ENV = 'test';
    await connectTestDb();
    app = createApp({ connectDatabase: false });
  });

  afterEach(async () => {
    await cleanupDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  test('registers and logs in a customer', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ phone: '7777777777', username: 'newuser', password: 'Password123' });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.token).toBeTruthy();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'newuser', password: 'Password123' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.role).toBe('customer');
  });

  test('creates booking and rejects conflicting slot booking', async () => {
    const user = await createUser();
    const worker = await createWorker();
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ identifier: user.username, password: 'Password123' });

    const token = loginRes.body.token;

    const payload = {
      workerId: worker._id.toString(),
      serviceCategory: 'Electrician',
      problemType: 'Fan not working',
      description: 'Need urgent fix',
      scheduledDate: '2030-01-01',
      scheduledTime: '10:00 AM',
      addressFullAddress: '123 Main Street',
      addressPincode: '302001',
      addressCity: 'Jaipur',
      addressState: 'Rajasthan',
    };

    const firstRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .field(payload);

    expect(firstRes.status).toBe(201);

    const secondUser = await createUser({ phone: '6666666666', username: 'customer2' });
    const secondLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ identifier: secondUser.username, password: 'Password123' });

    const secondRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${secondLoginRes.body.token}`)
      .field(payload);

    expect(secondRes.status).toBe(409);
  });

  test('blocks invalid customer booking transition', async () => {
    const user = await createUser();
    const worker = await createWorker();
    const booking = await createBooking({ user, worker, overrides: { status: 'Completed' } });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ identifier: user.username, password: 'Password123' });

    const res = await request(app)
      .put(`/api/bookings/${booking._id}/status`)
      .set('Authorization', `Bearer ${loginRes.body.token}`)
      .send({ status: 'Cancelled' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_BOOKING_TRANSITION');
  });

  test('creates and confirms a payment for a completed booking', async () => {
    const user = await createUser();
    const worker = await createWorker();
    const booking = await createBooking({ user, worker, overrides: { status: 'Completed' } });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ identifier: user.username, password: 'Password123' });
    const token = loginRes.body.token;

    const createRes = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookingId: booking._id.toString(), hoursWorked: 2 });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.paymentStatus).toBe('Pending');

    const confirmRes = await request(app)
      .post(`/api/payments/${createRes.body.data._id}/confirm`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.paymentStatus).toBe('Completed');
  });

  test('admin can login and block a customer with audit trail', async () => {
    const user = await createUser();
    await createAdmin();

    const adminLoginRes = await request(app)
      .post('/api/admin-auth/login')
      .send({ email: 'admin@test.com', password: 'Admin12345' });

    expect(adminLoginRes.status).toBe(200);

    const blockRes = await request(app)
      .patch(`/api/admin/customers/${user._id}/block`)
      .set('Authorization', `Bearer ${adminLoginRes.body.token}`)
      .send({ isBlocked: true });

    expect(blockRes.status).toBe(200);

    const updatedUser = await User.findById(user._id);
    expect(updatedUser.isBlocked).toBe(true);

    const auditLog = await AuditLog.findOne({ action: 'admin.customer.block', entityId: user._id });
    expect(auditLog).toBeTruthy();
  });
});
