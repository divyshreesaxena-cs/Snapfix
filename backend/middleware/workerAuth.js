const jwt = require('jsonwebtoken');
const Worker = require('../models/Worker');

const workerProtect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // ✅ ROLE CHECK (worker only)
      if (decoded.role !== 'worker') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: worker token required'
        });
      }

      // Get worker from token
      req.worker = await Worker.findById(decoded.id).select('-__v');

      if (!req.worker) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, worker not found'
        });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

module.exports = { protectWorker: workerProtect };

