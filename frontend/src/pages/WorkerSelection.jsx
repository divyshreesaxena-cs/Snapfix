import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Award, Briefcase, IndianRupee, Calendar } from 'lucide-react';
import { workersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Loading from '../components/Loading';
import { motion } from 'framer-motion';

const WorkerSelection = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [rateInfo, setRateInfo] = useState(null);

  useEffect(() => {
    fetchWorkers();
    fetchRateInsights();
  }, [category]);

  const fetchRateInsights = async () => {
    try {
      const res = await workersAPI.getRateInsights(category);
      setRateInfo(res.data.data);
    } catch (e) {
      setRateInfo(null);
    }
  };

  const fetchWorkers = async () => {
    try {
      const bookingDetails = JSON.parse(sessionStorage.getItem('bookingDetails') || '{}');
      const pincodeToUse = bookingDetails?.address?.pincode || user?.pincode;

      const response = await workersAPI.getWorkers(category, pincodeToUse);
      setWorkers(response.data.data);
    } catch (error) {
      toast.error('Failed to load workers');
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkerSelect = (worker) => {
    setSelectedWorker(worker);
  };

  const handleContinue = () => {
    if (!selectedWorker) {
      toast.error('Please select a worker');
      return;
    }

    // Store selected worker and navigate to scheduling
    const bookingDetails = JSON.parse(sessionStorage.getItem('bookingDetails') || '{}');
    bookingDetails.workerId = selectedWorker._id;
    sessionStorage.setItem('bookingDetails', JSON.stringify(bookingDetails));

    navigate(`/schedule/${selectedWorker._id}`);
  };

  if (loading) return <Loading fullScreen />;

  if (workers.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-display text-dark-900 mb-2">No Workers Available</h2>
          <p className="text-dark-600 mb-6">
            Sorry, no workers are available in this category near your location right now.
          </p>
          <button onClick={() => navigate('/home')} className="btn-primary">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-orange-600 hover:text-orange-700 font-medium mb-4 flex items-center gap-2"
          >
            ← Back
          </button>

          <h1 className="text-4xl font-display gradient-text mb-2">{category} Professionals</h1>
          <p className="text-dark-600 text-lg">Choose the best professional for your service</p>
        </motion.div>

        {/* Rate info */}
        {rateInfo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8"
          >
            <h3 className="text-lg font-display text-blue-900 mb-2 flex items-center gap-2">
              <IndianRupee className="w-5 h-5" />
              Price Insights
            </h3>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-blue-700 font-semibold">Typical Range</p>
                <p className="text-blue-900">
                  ₹{rateInfo?.typicalRange?.min ?? '-'} - ₹{rateInfo?.typicalRange?.max ?? '-'} / hr
                </p>
              </div>
              <div>
                <p className="text-blue-700 font-semibold">Recommended</p>
                <p className="text-blue-900">₹{rateInfo?.recommendedMedian ?? '-'} / hr</p>
              </div>
              <div>
                <p className="text-blue-700 font-semibold">Policy Bounds</p>
                <p className="text-blue-900">
                  ₹{rateInfo?.policyBounds?.min ?? '-'} - ₹{rateInfo?.policyBounds?.max ?? '-'} / hr
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Workers Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {workers.map((worker) => (
            <motion.div
              key={worker._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              className={`card p-6 cursor-pointer transition-all duration-300 ${
                selectedWorker?._id === worker._id
                  ? 'ring-4 ring-orange-500 bg-orange-50'
                  : 'hover:shadow-xl'
              }`}
              onClick={() => handleWorkerSelect(worker)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-2xl font-display">
                    {worker.name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-display text-dark-900 mb-1">{worker.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-dark-600">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-semibold">{worker.rating || 4.5}</span>
                      <span>({worker.completedJobs || 0} jobs)</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-display text-orange-600 mb-1">
                    ₹{worker.pricePerHour}
                  </div>
                  <div className="text-sm text-dark-600">per hour</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-white rounded-xl border border-dark-200">
                  <Award className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-dark-900">{worker.experience || 2}+</div>
                  <div className="text-xs text-dark-600">Years</div>
                </div>
                <div className="text-center p-3 bg-white rounded-xl border border-dark-200">
                  <Briefcase className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-dark-900">{worker.completedJobs || 0}</div>
                  <div className="text-xs text-dark-600">Jobs</div>
                </div>
                <div className="text-center p-3 bg-white rounded-xl border border-dark-200">
                  <Calendar className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-dark-900">
                    {worker.availability ? 'Available' : 'Busy'}
                  </div>
                  <div className="text-xs text-dark-600">Status</div>
                </div>
              </div>

              {selectedWorker?._id === worker._id && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-semibold">
                    Selected
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Continue Button */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <button
            onClick={handleContinue}
            disabled={!selectedWorker}
            className="btn-primary px-12 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Schedule
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default WorkerSelection;
