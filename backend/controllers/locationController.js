const { lookupPincode } = require("../services/pincodeService");

// NOTE: We export BOTH names so whatever your routes file uses will work.
const lookupPincodeController = async (req, res) => {
  try {
    const pincode = String(req.params.pincode || "").trim();

    const result = await lookupPincode(pincode);

    if (!result.ok) {
      return res.status(result.status || 500).json({
        success: false,
        message: result.message || "Lookup failed",
      });
    }

    return res.json({
      success: true,
      source: result.source, // memory | mongo | indiaPost
      data: result.data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error in pincode lookup",
    });
  }
};

module.exports = {
  lookupPincodeController,
  // alias (in case your route expects this older name)
  getLocationByPincode: lookupPincodeController,
};
