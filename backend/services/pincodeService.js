const axios = require("axios");
const PincodeCache = require("../models/PincodeCache");

const memoryCache = new Map(); // pincode -> { data, expiresAt }
const TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

function normalize(str) {
  return (str || "").toString().trim();
}

async function fetchFromIndiaPost(pincode) {
  const url = `https://api.postalpincode.in/pincode/${pincode}`;
  const resp = await axios.get(url, { timeout: 8000 });

  const arr = resp.data;
  if (!Array.isArray(arr) || !arr[0] || arr[0].Status !== "Success") {
    return null;
  }

  const po = arr[0]?.PostOffice?.[0];
  if (!po) return null;

  return {
    pincode,
    city: normalize(po.District),
    state: normalize(po.State),
    country: "India",
  };
}

async function lookupPincode(pincode) {
  // Validate
  if (!/^[0-9]{6}$/.test(pincode)) {
    return { ok: false, status: 400, message: "Invalid pincode. Must be 6 digits." };
  }

  // 1) In-memory cache
  const mem = memoryCache.get(pincode);
  if (mem && mem.expiresAt > Date.now()) {
    return { ok: true, source: "memory", data: mem.data };
  }

  // 2) Mongo cache
  const cached = await PincodeCache.findOne({ pincode }).lean();
  if (cached && cached.expiresAt && cached.expiresAt.getTime() > Date.now()) {
    const data = {
      pincode,
      city: cached.city || "",
      state: cached.state || "",
      country: cached.country || "India",
    };
    memoryCache.set(pincode, { data, expiresAt: Date.now() + TTL_MS });
    return { ok: true, source: "mongo", data };
  }

  // 3) India Post API (source of truth)
  const fresh = await fetchFromIndiaPost(pincode);
  if (!fresh) {
    return { ok: false, status: 404, message: "Pincode not found." };
  }

  const expiresAt = new Date(Date.now() + TTL_MS);

  // upsert into Mongo cache
  await PincodeCache.updateOne(
    { pincode },
    { $set: { ...fresh, expiresAt } },
    { upsert: true }
  );

  // store in memory
  memoryCache.set(pincode, { data: fresh, expiresAt: Date.now() + TTL_MS });

  return { ok: true, source: "indiaPost", data: fresh };
}

module.exports = { lookupPincode };
