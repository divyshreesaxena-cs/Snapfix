// backend/controllers/workerAuthController.js
const Worker = require('../models/Worker');
const OTP = require('../models/OTP');
const { generateToken, generateOTP, getOTPExpiry } = require('../utils/helpers');
const twoFactor = require('../services/twoFactorService');

// @desc    Send OTP (Worker)
// @route   POST /api/worker-auth/send-otp
// @access  Public
const sendWorkerOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    // Validate phone
    if (!phone || !/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit phone number'
      });
    }

    // Remove previous WORKER OTPs for this phone
    await OTP.deleteMany({ phone, purpose: 'worker' });

    // Send OTP using 2Factor + store sessionId
    const { sessionId } = await twoFactor.sendOTP(phone);
    const expiresAt = getOTPExpiry(); // must return Date

    // Create new WORKER OTP session
    await OTP.create({
      phone,
      purpose: 'worker',
      provider: '2factor',
      sessionId,
      expiresAt,
      verified: false
    });

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error sending OTP'
    });
  }
};

// @desc    Verify OTP and login/register (Worker)
// @route   POST /api/worker-auth/verify-otp
// @access  Public
const verifyWorkerOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide phone and OTP'
      });
    }

    // Find latest WORKER 2Factor OTP session
    const otpRecord = await OTP.findOne({
      phone,
      purpose: 'worker',
      provider: '2factor',
      verified: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please request a new one.'
      });
    }

    // Verify with 2Factor using sessionId
    const enteredOtp = otp.toString().trim();
    const isValid = await twoFactor.verifyOTP(otpRecord.sessionId, enteredOtp);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please request a new one.'
      });
    }

    // Mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    

    // Find or create worker
    let worker = await Worker.findOne({ phone });
    let isNewWorker = false;

    if (!worker) {
      
      const workerId = 'WRK' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();
      
      worker = await Worker.create({ 
        phone,
        workerId,
        name: '',
        serviceCategory: 'Electrician',
        servicesProvided: ['Electrician'],
        idProofNumber: '',
        pricePerHour: 0,
        isProfileComplete: false
      });
      
      isNewWorker = true;
      
    } else {
      // If worker exists but profile is incomplete, update to complete
    }

    // Generate token
    const token = generateToken(worker._id, 'worker');


    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      token,
      worker: {
        id: worker._id,
        workerId: worker.workerId,
        phone: worker.phone,
        name: worker.name,
        idProofNumber: worker.idProofNumber || '',
        servicesProvided: worker.servicesProvided && worker.servicesProvided.length ? worker.servicesProvided : [worker.serviceCategory],
        serviceCategory: worker.serviceCategory,
        pricePerHour: worker.pricePerHour,
        experience: worker.experience,
        location: worker.location,
        isProfileComplete: worker.isProfileComplete
      },
      isNewWorker
    });

    

  } catch (error) {
    console.error('❌ Error in verifyWorkerOTP:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error verifying OTP',
      error: error.message 
    });
  }
};

module.exports = {
  sendWorkerOTP,
  verifyWorkerOTP
};
