import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Star, IndianRupee, Clock, ChevronRight } from 'lucide-react';
import { bookingsAPI } from '../services/api';
import toast from 'react-hot-toast';
import Loading from '../components/Loading';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active'); // all, scheduled, completed
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await bookingsAPI.getBookings();
      setBookings(response.data.data);
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = (bookingId) => {
    navigate(`/payment/${bookingId}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled':
        return 'badge-info';
      case 'In Progress':
        return 'badge-warning';
      case 'Completed':
        return 'badge-success';
      default:
        return 'badge-info';
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    if (filter === 'active') return !['Completed', 'Cancelled', 'Rejected'].includes(booking.status);
    if (filter === 'completed') return booking.status === 'Completed';
    return true;
  });

  if (loading) return <Loading fullScreen />;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-display gradient-text mb-4">
            My Bookings
          </h1>

          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'All Bookings' },
              { key: 'active', label: 'Active' },
              { key: 'completed', label: 'Completed' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-6 py-2 rounded-xl font-semibold transition-all duration-200 ${
                  filter === key
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'bg-white text-dark-700 hover:bg-orange-50 border-2 border-dark-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </motion.div>

        {filteredBookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-12 text-center"
          >
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-display text-dark-900 mb-2">
              No Bookings Found
            </h2>
            <p className="text-dark-600 mb-6">
              {filter === 'all' 
                ? "You haven't made any bookings yet"
                : `No ${filter} bookings found`
              }
            </p>
            <button onClick={() => navigate('/home')} className="btn-primary">
              Book a Service
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {filteredBookings.map((booking, index) => (
              <motion.div
                key={booking._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card p-6 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Worker Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-2xl font-display flex-shrink-0 shadow-lg">
                      {booking.worker.name.charAt(0)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-display text-dark-900">
                            {booking.worker.name}
                          </h3>
                          <p className="text-dark-600">{booking.serviceCategory}</p>
                        </div>
                        <span className={`badge ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm text-dark-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-orange-500" />
                          <span>{format(new Date(booking.scheduledDate), 'MMM d, yyyy')}</span>
                          <Clock className="w-4 h-4 text-orange-500 ml-2" />
                          <span>{booking.scheduledTime}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-orange-500" />
                          <span>{booking.worker.rating.toFixed(1)} Rating</span>
                          <span className="text-dark-400">•</span>
                          <IndianRupee className="w-4 h-4 text-orange-500" />
                          <span>₹{booking.worker.pricePerHour}/hr</span>
                        </div>

                        <p className="text-dark-700 mt-2">
                          <span className="font-semibold">Problem:</span> {booking.problemType}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 lg:w-48">
                    {/* Payment / Feedback actions (auto-hide once done) */}
                    {booking.status === 'Completed' && !booking.hasPaid && (
                      <button
                        onClick={() => handlePayNow(booking._id)}
                        className="btn-primary w-full text-sm py-2 flex items-center justify-center gap-2"
                      >
                        <IndianRupee className="w-4 h-4" />
                        Pay Now
                      </button>
                    )}

                    {booking.status === 'Completed' && booking.hasPaid && !booking.hasFeedback && (
                      <button
                        onClick={() => navigate(`/feedback/${booking._id}`)}
                        className="btn-secondary w-full text-sm py-2 flex items-center justify-center gap-2"
                      >
                        <Star className="w-4 h-4" />
                        Give Feedback
                      </button>
                    )}

                    {booking.status === 'Completed' && booking.hasPaid && booking.hasFeedback && (
                      <div className="w-full text-center text-sm font-semibold bg-green-50 border-2 border-green-200 rounded-xl py-2 text-green-700">
                        Completed ✓ Paid ✓ Feedback ✓
                      </div>
                    )}

<button
                      onClick={() => navigate(`/booking-details/${booking._id}`)}
                      className="btn-ghost w-full text-sm py-2 flex items-center justify-center gap-2"
                    >
                      View Details
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
