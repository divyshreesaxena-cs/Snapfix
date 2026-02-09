const mongoose = require("mongoose");

const pincodeCacheSchema = new mongoose.Schema(
  {
    pincode: { type: String, required: true, unique: true, match: /^[0-9]{6}$/ },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "India" },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL
  },
  { timestamps: true }
);

// IMPORTANT: don't add pincodeCacheSchema.index({ pincode: 1 }) because unique:true already creates an index

module.exports = mongoose.model("PincodeCache", pincodeCacheSchema);
