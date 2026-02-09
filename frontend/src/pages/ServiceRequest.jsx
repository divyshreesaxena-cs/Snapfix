import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, X, FileText, AlertCircle, MapPin, Search } from 'lucide-react';
import { servicesAPI, workersAPI, locationAPI } from '../services/api';
import toast from 'react-hot-toast';
import Loading from '../components/Loading';
import { motion } from 'framer-motion';

const ServiceRequest = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchingPincode, setSearchingPincode] = useState(false);

  const [formData, setFormData] = useState({
    problemType: '',
    description: '',
    images: [],

    // ✅ Address collected BEFORE showing workers
    fullAddress: '',
    pincode: '',
    city: '',
    state: '',
  });

  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    fetchProblems();
  }, [category]);

  const fetchProblems = async () => {
    try {
      const response = await servicesAPI.getProblems(category);
      setProblems(response.data.data.problems);
    } catch (error) {
      toast.error('Failed to load problem types');
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  const handlePincodeSearch = async (pincode) => {
    if (pincode.length !== 6) return;

    setSearchingPincode(true);
    try {
      const response = await locationAPI.getLocationByPincode(pincode);
      const { city, state } = response.data.data;

      setFormData((prev) => ({
        ...prev,
        city,
        state,
      }));

      toast.success('Location found!');
    } catch (error) {
      toast.error('Location not found. Please enter city/state manually.');
    } finally {
      setSearchingPincode(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (formData.images.length + files.length > 3) {
      toast.error('Maximum 3 images allowed');
      return;
    }

    const newImages = [...formData.images, ...files];
    setFormData({ ...formData, images: newImages });

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.problemType || !formData.description) {
      toast.error('Please fill all required fields');
      return;
    }

    // ✅ Address required BEFORE showing nearby professionals
    if (!formData.fullAddress || !formData.pincode || !formData.city || !formData.state) {
      toast.error('Please enter your service address');
      return;
    }

    // Store booking details in sessionStorage and navigate to worker selection
    sessionStorage.setItem(
      'bookingDetails',
      JSON.stringify({
        serviceCategory: category,
        problemType: formData.problemType,
        description: formData.description,
        images: formData.images,
        address: {
          fullAddress: formData.fullAddress,
          pincode: formData.pincode,
          city: formData.city,
          state: formData.state,
        },
      })
    );

    navigate(`/workers/${category}`);
  };

  if (loading) return <Loading fullScreen />;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button
            onClick={() => navigate('/home')}
            className="text-orange-600 hover:text-orange-700 font-medium mb-4 flex items-center gap-2"
          >
            ← Back to Services
          </button>

          <h1 className="text-4xl font-display gradient-text mb-2">{category} Service</h1>
          <p className="text-dark-600 text-lg">Tell us about your problem</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="card p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Problem Type */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-dark-700">What's the problem? *</label>
              <select
                value={formData.problemType}
                onChange={(e) => setFormData({ ...formData, problemType: e.target.value })}
                className="input"
                required
              >
                <option value="">Select a problem</option>
                {problems.map((problem) => (
                  <option key={problem} value={problem}>
                    {problem}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-dark-700">Describe the issue in detail *</label>
              <div className="relative">
                <FileText className="absolute left-4 top-4 w-5 h-5 text-dark-400" />
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Please provide as much detail as possible about the problem..."
                  className="input pl-12 min-h-[120px] resize-none"
                  required
                />
              </div>
              <p className="text-xs text-dark-500">Include details like when the problem started, what you've tried, etc.</p>
            </div>

            {/* ✅ Address BEFORE Workers */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-dark-700 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-500" />
                Service Address *
              </label>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-dark-600">Full address *</label>
                <textarea
                  value={formData.fullAddress}
                  onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
                  placeholder="House/Flat no, building, street, area"
                  className="input min-h-[90px] resize-none"
                  required
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-dark-600">Pincode *</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setFormData((prev) => ({ ...prev, pincode: value }));
                        if (value.length === 6) handlePincodeSearch(value);
                      }}
                      className="input pl-12"
                      placeholder="6-digit pincode"
                      required
                    />
                    {searchingPincode && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-dark-600">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="input"
                    placeholder="City"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-dark-600">State *</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="input"
                    placeholder="State"
                    required
                  />
                </div>
              </div>

              <p className="text-xs text-dark-500">Enter pincode to auto-fill city &amp; state.</p>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-dark-700">Upload Photos (Optional)</label>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-xl border-2 border-dark-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {imagePreviews.length < 3 && (
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-dark-300 rounded-xl p-8 text-center hover:border-orange-400 hover:bg-orange-50 transition-all duration-300">
                    <Camera className="w-12 h-12 text-dark-400 mx-auto mb-3" />
                    <p className="text-sm font-medium text-dark-700 mb-1">Click to upload images</p>
                    <p className="text-xs text-dark-500">PNG, JPG, WEBP (Max 3 images, 5MB each)</p>
                  </div>
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Next Steps:</p>
                <p>We will show professionals near the address pincode you entered.</p>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Processing...' : 'Find Available Professionals'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ServiceRequest;
