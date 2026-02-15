import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { workerProfileAPI, locationAPI, workersAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const SERVICE_OPTIONS = ["Electrician", "Plumbing", "Painting", "Carpenter"];

export default function WorkerProfileSetup() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
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

  const [workerId, setWorkerId] = useState(""); // ✅ read-only display

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

  const lowExtreme = rateInfo
    ? numericRate <= allowedMin + (allowedMax - allowedMin) * 0.1
    : false;
  const highExtreme = rateInfo
    ? numericRate >= allowedMax - (allowedMax - allowedMin) * 0.1
    : false;

  // ✅ Load existing worker profile so fields + workerId show up
  useEffect(() => {
    let alive = true;

    async function loadProfile() {
      setError("");
      try {
        const res = await workerProfileAPI.getProfile();
        const w = res?.data?.data || res?.data?.worker || res?.data;

        if (!alive || !w) return;

        setWorkerId(w.workerId || "");
        setFormData((prev) => ({
          ...prev,
          name: w.name || "",
          phone: w.phone || "",
          idProofNumber: w.idProofNumber || "",
          servicesProvided: w.servicesProvided?.length ? w.servicesProvided : prev.servicesProvided,
          serviceCategory:
            w.serviceCategory ||
            (w.servicesProvided?.length ? w.servicesProvided[0] : prev.serviceCategory),
          pricePerHour: w.pricePerHour ?? prev.pricePerHour,
          experience: w.experience ?? prev.experience,
          pincode: w.location?.pincode || "",
          city: w.location?.city || "",
          state: w.location?.state || "",
          country: w.location?.country || prev.country,
          availability: w.availability ?? prev.availability,
        }));
      } catch (err) {
        // if token missing/expired, interceptor may redirect; otherwise show message
        setError(err?.response?.data?.message || "Failed to load worker profile.");
      }
    }

    loadProfile();
    return () => {
      alive = false;
    };
  }, []);

  // Fetch rate insights when category changes
  useEffect(() => {
    let alive = true;

    async function fetchInsights() {
      setLoadingRate(true);
      try {
        const res = await workersAPI.getRateInsights(selectedCategory);
        if (!alive) return;
        setRateInfo(res?.data?.data || res?.data || null);
      } catch (e) {
        if (!alive) return;
        setRateInfo(null);
      } finally {
        if (alive) setLoadingRate(false);
      }
    }

    fetchInsights();
    return () => {
      alive = false;
    };
  }, [selectedCategory]);

  // Pincode lookup
  useEffect(() => {
    let alive = true;

    async function lookup() {
      if (!formData.pincode || formData.pincode.length !== 6) return;

      setSearchingPincode(true);
      try {
        const res = await locationAPI.lookupPincode(formData.pincode);
        const data = res?.data?.data;

        if (!alive || !data) return;

        setFormData((prev) => ({
          ...prev,
          city: data.city || prev.city,
          state: data.state || prev.state,
          country: data.country || prev.country,
        }));
      } catch (err) {
        // silent
      } finally {
        if (alive) setSearchingPincode(false);
      }
    }

    lookup();
    return () => {
      alive = false;
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
    if (!formData.serviceCategory) return setError("Please select a service category.");

    if (!Number.isFinite(Number(formData.pricePerHour))) {
      return setError("Please enter a valid hourly rate.");
    }

    if (numericRate < allowedMin || numericRate > allowedMax) {
      return setError(`Hourly rate must be between ₹${allowedMin} and ₹${allowedMax}.`);
    }

    setLoading(true);
    try {
      // ✅ Do NOT send workerId/phone from UI; backend already has them
      const { workerId: _w, phone: _p, ...rest } = formData;

      const payload = {
        ...rest,
        pricePerHour: Number(formData.pricePerHour),
        experience: Number(formData.experience || 0),
      };

      const res = await workerProfileAPI.updateProfile(payload);

      if (res?.data?.success) {
        const updated = res?.data?.data || res?.data?.worker;

        if (updated) {
          // ✅ IMPORTANT: update local auth user so route guards stop redirecting back
          updateUser(updated);
        }

        setSuccessMsg("Profile saved successfully!");

        // ✅ Only go to dashboard if profile is complete
        if (updated?.isProfileComplete) {
          navigate("/worker/dashboard");
        }
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

          {/* ✅ Worker ID (read-only) */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700">Worker ID</label>
            <div className="mt-1 w-full rounded-xl border px-4 py-2 bg-gray-50 text-gray-800">
              {workerId || "—"}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                value={formData.name}
                onChange={(e) => setField("name", e.target.value)}
                className="mt-1 w-full rounded-xl border px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">ID Proof Number (optional)</label>
              <input
                value={formData.idProofNumber}
                onChange={(e) => setField("idProofNumber", e.target.value)}
                className="mt-1 w-full rounded-xl border px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Service Category</label>
              <select
                value={formData.serviceCategory}
                onChange={(e) => handleServiceChange(e.target.value)}
                className="mt-1 w-full rounded-xl border px-4 py-2"
              >
                {SERVICE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Hourly Rate (₹/hr)</label>
              <input
                type="number"
                value={formData.pricePerHour}
                onChange={(e) => setField("pricePerHour", e.target.value)}
                className={`mt-1 w-full rounded-xl border px-4 py-2 ${
                  lowExtreme ? "border-yellow-300" : highExtreme ? "border-yellow-300" : ""
                }`}
              />
              <div className="text-xs text-gray-500 mt-2">
                {loadingRate ? (
                  "Loading rate insights…"
                ) : rateInfo ? (
                  <>
                    Allowed: ₹{allowedMin} - ₹{allowedMax}
                    {recommended ? ` • Recommended: ~₹${recommended}` : ""}
                    {typicalLow && typicalHigh ? ` • Typical: ₹${typicalLow}-₹${typicalHigh}` : ""}
                  </>
                ) : (
                  `Allowed: ₹${allowedMin} - ₹${allowedMax}`
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Experience (years)</label>
              <input
                type="number"
                value={formData.experience}
                onChange={(e) => setField("experience", e.target.value)}
                className="mt-1 w-full rounded-xl border px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Pincode</label>
              <input
                value={formData.pincode}
                onChange={(e) => setField("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="mt-1 w-full rounded-xl border px-4 py-2"
              />
              {searchingPincode ? (
                <div className="text-xs text-gray-500 mt-1">Detecting city/state…</div>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input
                value={formData.city}
                onChange={(e) => setField("city", e.target.value)}
                className="mt-1 w-full rounded-xl border px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">State</label>
              <input
                value={formData.state}
                onChange={(e) => setField("state", e.target.value)}
                className="mt-1 w-full rounded-xl border px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Country</label>
              <input
                value={formData.country}
                onChange={(e) => setField("country", e.target.value)}
                className="mt-1 w-full rounded-xl border px-4 py-2"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-green-600 text-white py-3 font-semibold"
            >
              {loading ? "Saving…" : "Save Profile"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
