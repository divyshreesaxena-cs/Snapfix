const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const Admin = require('../models/Admin');

dotenv.config();

const run = async () => {
  try {
    await connectDB();

    const email = String(process.env.ADMIN_SEED_EMAIL || '').trim().toLowerCase();
    const password = String(process.env.ADMIN_SEED_PASSWORD || '');
    const name = String(process.env.ADMIN_SEED_NAME || 'Super Admin').trim();

    if (!email || !password) {
      throw new Error('ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD are required');
    }

    const existing = await Admin.findOne({ email });
    if (existing) {
      console.log(`Admin already exists for ${email}`);
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await Admin.create({
      name,
      email,
      passwordHash,
      role: 'admin',
      isActive: true,
      isApproved: true,
    });

    console.log(`Admin created successfully for ${email}`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed admin:', error);
    process.exit(1);
  }
};

run();