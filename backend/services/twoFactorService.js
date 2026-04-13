const axios = require('axios');

const {
  TWOFACTOR_API_KEY,
  TWOFACTOR_BASE_URL,
  TWOFACTOR_COUNTRY_CODE,
} = process.env;

const sendOTP = async (phone) => {
  const url = `${TWOFACTOR_BASE_URL}/${TWOFACTOR_API_KEY}/SMS/+${TWOFACTOR_COUNTRY_CODE}${phone}/AUTOGEN`;

  const response = await axios.get(url);

  console.log('2FA SEND RESPONSE:', response.data);

  if (response.data.Status !== 'Success') {
    throw new Error(response.data.Details || 'Failed to send OTP');
  }

  return {
    sessionId: response.data.Details,
  };
};

const verifyOTP = async (sessionId, otp) => {
  const url = `${TWOFACTOR_BASE_URL}/${TWOFACTOR_API_KEY}/SMS/VERIFY/${sessionId}/${otp}`;

  const response = await axios.get(url);

  console.log('2FA VERIFY RESPONSE:', response.data);

  if (response.data.Status !== 'Success') {
    return false;
  }

  if (response.data.Details !== 'OTP Matched') {
    return false;
  }

  return true;
};

module.exports = {
  sendOTP,
  verifyOTP,
};