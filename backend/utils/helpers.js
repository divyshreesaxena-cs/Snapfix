const jwt = require('jsonwebtoken');

const getAccessTokenTtl = () => process.env.JWT_EXPIRE || '12h';

// Generate JWT Token
const generateToken = (id, role, tokenVersion = 0) => {
  return jwt.sign({ id, role, tokenVersion }, process.env.JWT_SECRET, {
    expiresIn: getAccessTokenTtl(),
  });
};

const getTokenExpiry = () => getAccessTokenTtl();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Calculate OTP expiry time
const getOTPExpiry = () => {
  const minutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
  return new Date(Date.now() + minutes * 60 * 1000);
};

// Generate unique transaction ID
const generateTransactionId = () => {
  return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
};

module.exports = {
  generateToken,
  getTokenExpiry,
  generateOTP,
  getOTPExpiry,
  generateTransactionId
};
