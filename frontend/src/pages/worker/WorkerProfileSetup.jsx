import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { workerProfileAPI, locationAPI, workersAPI } from "../../services/api";

const SERVICE_OPTIONS = ["Electrician", "Plumbing", "Painting", "Carpenter"];

export default function WorkerProfileSetup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    workerId: "",
    phone: "",
    idProofNumber: "",
    servicesProvided: ["Electrician"],
    serviceCategory: "Electrician",
    pricePerHour: 500,
    experience: 0,
    pincode: "",
    city: "",
    state: "",
    country: "India",
    profileImage: null,
    availability: true,
  });

  const [loading, setLoading] = useState(false);
  const [searchingPincode, setSearchingPincode] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // -----------------------------
  // Rate insights (recommended + typical range + allowed bounds)
  // -----------------------------
  const [rateInfo, setRateInfo] = useState(null);
  const [loadingRate, setLoadingRate] = useState(false);

  const selectedCategory = useMemo(() => {
    return formData.serviceCategory || formData.servicesProvided?.[0] || "Electrician";
  }, [formData.serviceCategory, formData.servicesProvided]);

  const allowedMin = rateInfo?.allowedRange?.min ?? 200;
  const allowedMax = rateInfo?.allowedRange?.max ?? 2000;

  const numericRate = Number(formData.pricePerHour || 0);

  // highlight extremes (still allowed)
  const lowExtreme = rateInfo
    ? numericRate <= allowedMin + (allowedMax - allowedMin) * 0.1
    : false;
  const highExtreme = rateInfo
    ? numericRate >= allowedMax - (allowedMax - allowedMin) * 0.1
    : false;

  useEffect(() => {
    let alive = true;

    async function fetchInsights() {
      setLoadingRate(true);
      try {
        const res = await workersAPI.getRateInsights(selectedCategory);
        if (!alive) return;

        const data = res?.data?.data || null;
        setRateInfo(data);

        // Clamp current rate into allowed bounds if out-of-range
        const min = data?.allowedRange?.min;
        const max = data?.allowedRange?.max;

        if (typeof min === "number" && typeof max === "number") {
          const current = Number(formData.pricePerHour);
          if (!Number.isNaN(current) && (current < min || current > max)) {
            setFormData((prev) => ({
              ...prev,
              pricePerHour: Math.min(Math.max(current, min), max),
            }));
          }
        }
      } catch (e) {
        setRateInfo(null);
      } finally {
        setLoadingRate(false);
      }
    }

    fetchInsights();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  // -----------------------------
  // Pincode autofill (via backend)
  // -----------------------------
  useEffect(() => {
    const pin = (formData.pincode || "").trim();
    if (!/^[0-9]{6}$/.test(pin)) return;

    let alive = true;
    const t = setTimeout(async () => {
      setSearchingPincode(true);
      try {
        const res = await locationAPI.lookupPincode(pin);
        if (!alive) return;

        const data = res?.data?.data || {};
        setFormData((prev) => ({
          ...prev,
          city: data.city || prev.city,
          state: data.state || prev.state,
          country: data.country || prev.country || "India",
        }));
      } catch (e) {
        // user can type manually
      } finally {
        setSearchingPincode(false);
      }
    }, 400);

    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [formData.pincode]);

  function setField(name, value) {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleServiceChange(value) {
    setFormData((prev) => ({
      ...prev,
      serviceCategory: value,
      servicesProvided: [value],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!formData.name.trim()) return setError("Please enter your name.");
    if (!formData.workerId.trim()) return setError("Please enter your Worker ID.");
    if (!formData.serviceCategory) return setError("Please select a service category.");

    if (!Number.isFinite(Number(formData.pricePerHour))) {
      return setError("Please enter a valid hourly rate.");
    }

    if (numericRate < allowedMin || numericRate > allowedMax) {
      return setError(`Hourly rate must be between ₹${allowedMin} and ₹${allowedMax}.`);
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        pricePerHour: Number(formData.pricePerHour),
        experience: Number(formData.experience || 0),
      };

      // ✅ FIX: use existing API method
      const res = await workerProfileAPI.updateProfile(payload);

      if (res?.data?.success) {
        setSuccessMsg("Profile saved successfully!");
        // ✅ FIX: redirect to an existing route
        setTimeout(() => navigate("/worker/dashboard"), 400);
      } else {
        setError(res?.data?.message || "Failed to save profile.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Server error while saving profile.");
    } finally {
      setLoading(false);
    }
  }

  const typicalLow = rateInfo?.typicalRange?.min;
  const typicalHigh = rateInfo?.typicalRange?.max;
  const recommended = rateInfo?.recommendedMedian;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900">Worker Profile Setup</h1>
        <p className="text-gray-600 mt-1">Complete your profile to start receiving bookings.</p>

        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {error ? (
            <div className="mb-4 rounded-lg bg-red-50 text-red-700 px-4 py-3 border border-red-100">
              {error}
            </div>
          ) : null}

          {successMsg ? (
            <div className="mb-4 rounded-lg bg-green-50 text-green-700 px-4 py-3 border border-green-100">
              {successMsg}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                value={formData.name}
                onChange={(e) => setField("name", e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 outline-none focus:ring-2 focus:ring-green-200"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Worker ID</label>
              <input
                value={formData.workerId}
                onChange={(e) => setField("workerId", e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 outline-none focus:ring-2 focus:ring-green-200"
                placeholder="e.g. WKR12345"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">ID Proof Number (optional)</label>
              <input
                value={formData.idProofNumber}
                onChange={(e) => setField("idProofNumber", e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 outline-none focus:ring-2 focus:ring-green-200"
                placeholder="Aadhaar/PAN etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Service Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => handleServiceChange(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 outline-none focus:ring-2 focus:ring-green-200"
              >
                {SERVICE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Hourly Rate (₹/hr)</label>
                <span className="text-xs text-gray-500">Allowed: ₹{allowedMin}–₹{allowedMax}</span>
              </div>

              <input
                type="number"
                min={allowedMin}
                max={allowedMax}
                value={formData.pricePerHour}
                onChange={(e) => setField("pricePerHour", Number(e.target.value))}
                className={`mt-1 w-full rounded-xl border px-4 py-2 outline-none focus:ring-2 ${
                  lowExtreme || highExtreme
                    ? "border-yellow-300 focus:ring-yellow-200"
                    : "border-gray-200 focus:ring-green-200"
                }`}
                placeholder="e.g. 550"
              />

              <div className="mt-2 text-sm text-gray-600 space-y-1">
                {loadingRate ? (
                  <div className="text-xs text-gray-500">Loading recommended rates…</div>
                ) : rateInfo ? (
                  <>
                    {typeof typicalLow === "number" && typeof typicalHigh === "number" ? (
                      <div className="text-xs text-gray-600">
                        Most workers charge <b>₹{typicalLow}–₹{typicalHigh}/hr</b>
                      </div>
                    ) : null}

                    {typeof recommended === "number" ? (
                      <div className="text-xs text-gray-600">
                        Recommended rate (median): <b>₹{recommended}/hr</b>
                      </div>
                    ) : null}

                    {lowExtreme ? (
                      <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
                        You picked a rate near the low end. Allowed, but you may get more bookings with a typical rate.
                      </div>
                    ) : null}
                    {highExtreme ? (
                      <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
                        You picked a rate near the high end. Allowed, but customers may compare prices.
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="text-xs text-gray-500">
                    (Couldn’t load recommendations right now — you can still set your rate within allowed range.)
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Experience (years)</label>
              <input
                type="number"
                value={formData.experience}
                onChange={(e) => setField("experience", Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 outline-none focus:ring-2 focus:ring-green-200"
                placeholder="0"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Pincode</label>
                <input
                  value={formData.pincode}
                  onChange={(e) => setField("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 outline-none focus:ring-2 focus:ring-green-200"
                  placeholder="6-digit pincode"
                />
                {searchingPincode ? (
                  <div className="text-xs text-gray-500 mt-1">Fetching city/state…</div>
                ) : null}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  value={formData.city}
                  onChange={(e) => setField("city", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 outline-none focus:ring-2 focus:ring-green-200"
                  placeholder="City"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
                <input
                  value={formData.state}
                  onChange={(e) => setField("state", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 outline-none focus:ring-2 focus:ring-green-200"
                  placeholder="State"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <input
                  value={formData.country}
                  onChange={(e) => setField("country", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 outline-none focus:ring-2 focus:ring-green-200"
                  placeholder="India"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={!!formData.availability}
                onChange={(e) => setField("availability", e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm text-gray-700">Available for bookings</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-green-600 text-white py-3 font-semibold hover:bg-green-700 disabled:opacity-60"
            >
              {loading ? "Saving…" : "Save Profile"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
