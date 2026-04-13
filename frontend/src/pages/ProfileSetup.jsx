import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Search } from 'lucide-react';
import { profileAPI, locationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const ProfileSetup = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    pincode: '',
    city: '',
    state: '',
    country: 'India',
  });
  const [loading, setLoading] = useState(false);
  const [searchingPincode, setSearchingPincode] = useState(false);
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const handlePincodeSearch = async (pincode) => {
    if (pincode.length !== 6) return;

    setSearchingPincode(true);
    try {
      const response = await locationAPI.getLocationByPincode(pincode);
      const { city, state, country } = response.data.data;
      
      setFormData(prev => ({
        ...prev,
        city,
        state,
        country: country || 'India',
      }));
      
      toast.success('Location found!');
    } catch (error) {
      toast.error('Location not found. Please enter manually.');
    } finally {
      setSearchingPincode(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.pincode || !formData.city || !formData.state) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await profileAPI.updateProfile(formData);
      updateUser(response.data.data);
      toast.success('Profile setup complete!');
      navigate('/home');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'pincode' && value.length === 6) {
      handlePincodeSearch(value);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl mb-6 shadow-2xl"
          >
            <User className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-4xl font-display gradient-text mb-2">
            Complete Your Profile
          </h1>
          <p className="text-dark-600 text-lg">
            Help us serve you better
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="card p-8 glass"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-dark-700">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="input pl-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-dark-700">
                Pincode *
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="Enter 6-digit pincode"
                  className="input pl-12 pr-12"
                  required
                  maxLength={6}
                />
                {searchingPincode && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Search className="w-5 h-5 text-orange-500 animate-pulse" />
                  </div>
                )}
              </div>
              <p className="text-xs text-dark-500">
                We'll auto-fill your city and state
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-dark-700">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                  className="input"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-dark-700">
                  State *
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State"
                  className="input"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-dark-700">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="Country"
                className="input"
                readOnly
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Setting up...
                </>
              ) : (
                'Continue to SnapFix'
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ProfileSetup;
