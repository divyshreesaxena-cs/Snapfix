// Service categories and their problem types
const serviceData = {
  Electrician: {
    icon: '⚡',
    problems: [
      'Fan not working',
      'Switchboard issue',
      'Light fixture repair',
      'Wiring problem',
      'Power socket repair',
      'Inverter installation',
      'Electrical appliance repair',
      'Other'
    ]
  },
  Plumbing: {
    icon: '🔧',
    problems: [
      'Leaking tap',
      'Blocked drain',
      'Toilet repair',
      'Pipe leakage',
      'Water heater issue',
      'Basin installation',
      'Water pressure problem',
      'Other'
    ]
  },
  Painting: {
    icon: '🎨',
    problems: [
      'Wall painting',
      'Ceiling painting',
      'Door/Window painting',
      'Exterior painting',
      'Interior decoration',
      'Texture work',
      'Waterproofing',
      'Other'
    ]
  },
  Carpenter: {
    icon: '🔨',
    problems: [
      'Furniture repair',
      'Door repair',
      'Window repair',
      'Cabinet installation',
      'Bed repair',
      'Table/Chair repair',
      'Wardrobe installation',
      'Other'
    ]
  }
};

// @desc    Get all service categories
// @route   GET /api/services
// @access  Public
const getServices = async (req, res) => {
  try {
    const services = Object.keys(serviceData).map(category => ({
      category,
      icon: serviceData[category].icon,
      problemCount: serviceData[category].problems.length
    }));

    res.status(200).json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching services'
    });
  }
};

// @desc    Get problem types for a service category
// @route   GET /api/services/:category/problems
// @access  Public
const getProblems = async (req, res) => {
  try {
    const { category } = req.params;

    if (!serviceData[category]) {
      return res.status(404).json({
        success: false,
        message: 'Service category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        category,
        problems: serviceData[category].problems
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching problems'
    });
  }
};

module.exports = {
  getServices,
  getProblems
};
