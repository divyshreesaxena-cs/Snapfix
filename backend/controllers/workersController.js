const Worker = require('../models/Worker');
const { getRateBounds } = require('../utils/ratePolicy');

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
      $or: [
        { serviceCategory: category },
        { servicesProvided: category }
      ]
    };

    // Lightweight "nearby" filter by pincode (works well for MVP)
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



// @desc    Get rate insights for a service category (median + typical range)
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
      $or: [{ serviceCategory: category }, { servicesProvided: category }],
      pricePerHour: { $gte: minAllowed, $lte: maxAllowed }
    }).select('pricePerHour');

    const prices = workers
      .map((w) => w.pricePerHour)
      .filter((n) => typeof n === 'number' && Number.isFinite(n))
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

    const median = percentile(prices, 0.5);
    const p25 = percentile(prices, 0.25);
    const p75 = percentile(prices, 0.75);

    const recommendedRate = median ?? Math.round((minAllowed + maxAllowed) / 2);
    const typicalLow = p25 ?? Math.round(minAllowed + (maxAllowed - minAllowed) * 0.35);
    const typicalHigh = p75 ?? Math.round(minAllowed + (maxAllowed - minAllowed) * 0.65);

    return res.status(200).json({
      success: true,
      data: {
        category,
        recommendedRate,
        typicalRange: { low: typicalLow, high: typicalHigh },
        allowedRange: { min: minAllowed, max: maxAllowed },
        sampleSize: prices.length
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
