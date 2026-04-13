const router = require("express").Router();
const { lookupPincodeController } = require("../controllers/locationController");

router.get("/pincode/:pincode", lookupPincodeController);

module.exports = router;
