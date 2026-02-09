const axios = require('axios');

const {
  TWOFACTOR_API_KEY,
  TWOFACTOR_BASE_URL,
  TWOFACTOR_COUNTRY_CODE,
} = process.env;

/**
 * Send OTP using 2Factor
 * @param {string} phone - 10 digit phone number
 * @returns {Promise<{sessionId: string}>}
 */
const sendOTP = async (phone) => {
  const url = `${TWOFACTOR_BASE_URL}/${TWOFACTOR_API_KEY}/SMS/+${TWOFACTOR_COUNTRY_CODE}${phone}/AUTOGEN`;

  const response = await axios.get(url);

  if (response.data.Status !== 'Success') {
    throw new Error(response.data.Details || 'Failed to send OTP');
  }

  return {
    sessionId: response.data.Details,
  };
};

/**
 * Verify OTP using 2Factor
 * @param {string} sessionId
 * @param {string} otp
 * @returns {Promise<boolean>}
 */
const verifyOTP = async (sessionId, otp) => {
  const url = `${TWOFACTOR_BASE_URL}/${TWOFACTOR_API_KEY}/SMS/VERIFY/${sessionId}/${otp}`;

  const response = await axios.get(url);

  if (response.data.Status !== 'Success') {
    return false;
  }

  return true;
};

module.exports = {
  sendOTP,
  verifyOTP,
};
