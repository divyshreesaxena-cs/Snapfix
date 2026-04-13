const Worker = require('../models/Worker');
const { getRateBounds } = require('../utils/ratePolicy');
const serviceRateBenchmarks = require('../data/serviceRateBenchmarks');

// @desc    Get workers by service category (optionally near a pincode)
// @route   GET /api/workers?category=Electrician&pincode=560001
// @access  Public
const getWorkers = async (req, res) => {
  try {
    const { category, pincode } = req.query;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a service category'
      });
    }

    const query = {
      availability: true,
      isBlocked: { $ne: true },
      isVerified: true,
      isProfileComplete: true,
      $or: [
        { serviceCategory: category },
        { servicesProvided: category }
      ]
    };

    if (pincode) {
      query['location.pincode'] = pincode;
    }

    const workers = await Worker.find(query).sort({ rating: -1, completedJobs: -1 });

    res.status(200).json({
      success: true,
      count: workers.length,
      data: workers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workers'
    });
  }
};

// @desc    Get single worker
// @route   GET /api/workers/:id
// @access  Public
const getWorker = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    res.status(200).json({
      success: true,
      data: worker
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching worker'
    });
  }
};

// @desc    Get rate insights for a service category
// @route   GET /api/workers/rates/insights?category=Electrician
// @access  Public
const getRateInsights = async (req, res) => {
  try {
    const { category } = req.query;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a service category'
      });
    }

    const { min: minAllowed, max: maxAllowed } = getRateBounds(category);

    const workers = await Worker.find({
      availability: true,
      isBlocked: { $ne: true },
      isVerified: true,
      isProfileComplete: true,
      $or: [{ serviceCategory: category }, { servicesProvided: category }],
      pricePerHour: { $gte: minAllowed, $lte: maxAllowed }
    }).select('pricePerHour');

    const prices = workers
      .map((w) => Number(w.pricePerHour))
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((a, b) => a - b);

    const percentile = (arr, p) => {
      if (!arr.length) return null;
      const idx = (arr.length - 1) * p;
      const lo = Math.floor(idx);
      const hi = Math.ceil(idx);
      if (lo === hi) return arr[lo];
      const weight = idx - lo;
      return Math.round(arr[lo] * (1 - weight) + arr[hi] * weight);
    };

    let typicalMin;
    let typicalMax;
    let recommended;
    let policyMin;
    let policyMax;
    let source = 'live_workers';

    if (prices.length >= 3) {
      typicalMin = percentile(prices, 0.25);
      typicalMax = percentile(prices, 0.75);
      recommended = percentile(prices, 0.5);
      policyMin = minAllowed;
      policyMax = maxAllowed;
    } else {
      const fallback = serviceRateBenchmarks[category];

      if (fallback) {
        typicalMin = fallback.typicalMin;
        typicalMax = fallback.typicalMax;
        recommended = fallback.recommended;
        policyMin = fallback.policyMin;
        policyMax = fallback.policyMax;
        source = 'benchmark_fallback';
      } else {
        typicalMin = Math.round(minAllowed + (maxAllowed - minAllowed) * 0.25);
        typicalMax = Math.round(minAllowed + (maxAllowed - minAllowed) * 0.75);
        recommended = Math.round((minAllowed + maxAllowed) / 2);
        policyMin = minAllowed;
        policyMax = maxAllowed;
        source = 'policy_fallback';
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        category,
        typicalRange: {
          min: typicalMin,
          max: typicalMax,
        },
        recommendedMedian: recommended,
        policyBounds: {
          min: policyMin,
          max: policyMax,
        },
        sampleSize: prices.length,
        source,
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching rate insights'
    });
  }
};

module.exports = {
  getWorkers,
  getWorker,
  getRateInsights
};