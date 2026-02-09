const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};


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
  generateOTP,
  getOTPExpiry,
  generateTransactionId
};
