import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, CheckCircle } from 'lucide-react';
import { bookingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { format, addDays } from 'date-fns';

const ScheduleBooking = () => {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    scheduledDate: '',
    scheduledTime: '',
  });

  // Generate next 7 days
  const availableDates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  // Time slots
  const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.scheduledDate || !formData.scheduledTime) {
      toast.error('Please select date and time');
      return;
    }

    setLoading(true);
    try {
      // Get booking details from sessionStorage
      const bookingDetails = JSON.parse(sessionStorage.getItem('bookingDetails') || '{}');

      // ✅ Address must be present (collected before workers)
      const addr = bookingDetails?.address;
      if (!addr?.fullAddress || !addr?.pincode || !addr?.city || !addr?.state) {
        toast.error('Address missing. Please go back and enter address.');
        setLoading(false);
        return;
      }

      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('workerId', workerId);
      formDataToSend.append('serviceCategory', bookingDetails.serviceCategory);
      formDataToSend.append('problemType', bookingDetails.problemType);
      formDataToSend.append('description', bookingDetails.description);
      formDataToSend.append('scheduledDate', formData.scheduledDate);
      formDataToSend.append('scheduledTime', formData.scheduledTime);

      // ✅ Send address fields to backend
      formDataToSend.append('addressFullAddress', addr.fullAddress);
      formDataToSend.append('addressPincode', addr.pincode);
      formDataToSend.append('addressCity', addr.city);
      formDataToSend.append('addressState', addr.state);

      // Append images if any
      if (bookingDetails.images && bookingDetails.images.length > 0) {
        bookingDetails.images.forEach((image) => {
          formDataToSend.append('images', image);
        });
      }

      const response = await bookingsAPI.createBooking(formDataToSend);

      // Clear sessionStorage
      sessionStorage.removeItem('bookingDetails');

      toast.success('Booking confirmed successfully!');
      navigate(`/booking-confirmed/${response.data.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-orange-600 hover:text-orange-700 font-medium mb-4 flex items-center gap-2"
          >
            ← Back
          </button>

          <h1 className="text-4xl font-display gradient-text mb-2">Schedule Your Service</h1>
          <p className="text-dark-600 text-lg">Pick a convenient date and time</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="card p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Date Selection */}
            <div className="space-y-4">
              <label className="block text-lg font-display text-dark-900 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-orange-500" />
                Select Date
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {availableDates.map((date) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const isSelected = formData.scheduledDate === dateStr;
                  const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                  return (
                    <motion.button
                      key={dateStr}
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFormData({ ...formData, scheduledDate: dateStr })}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50 shadow-lg'
                          : 'border-dark-200 hover:border-orange-300 hover:bg-orange-50'
                      }`}
                    >
                      <div className={`text-xs font-semibold mb-1 ${isSelected ? 'text-orange-600' : 'text-dark-600'}`}>
                        {isToday ? 'Today' : format(date, 'EEE')}
                      </div>
                      <div className={`text-2xl font-display ${isSelected ? 'text-orange-600' : 'text-dark-900'}`}>
                        {format(date, 'd')}
                      </div>
                      <div className={`text-xs ${isSelected ? 'text-orange-600' : 'text-dark-600'}`}>
                        {format(date, 'MMM')}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Time Selection */}
            <div className="space-y-4">
              <label className="block text-lg font-display text-dark-900 flex items-center gap-2">
                <Clock className="w-6 h-6 text-orange-500" />
                Select Time Slot
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {timeSlots.map((time) => {
                  const isSelected = formData.scheduledTime === time;

                  return (
                    <motion.button
                      key={time}
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFormData({ ...formData, scheduledTime: time })}
                      className={`p-4 rounded-xl border-2 font-semibold transition-all duration-200 ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-lg'
                          : 'border-dark-200 text-dark-700 hover:border-orange-300 hover:bg-orange-50'
                      }`}
                    >
                      {time}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            {formData.scheduledDate && formData.scheduledTime && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border-2 border-green-200 rounded-xl p-6"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-display text-lg text-green-900 mb-2">Booking Summary</h3>
                    <p className="text-green-800 mb-1">
                      <span className="font-semibold">Date:</span>{' '}
                      {format(new Date(formData.scheduledDate), 'EEEE, MMMM d, yyyy')}
                    </p>
                    <p className="text-green-800 mb-1">
                      <span className="font-semibold">Time:</span> {formData.scheduledTime}
                    </p>
                    <p className="text-green-800">
                      <span className="font-semibold">Address:</span>{' '}
                      {(JSON.parse(sessionStorage.getItem('bookingDetails') || '{}')?.address?.city) || user?.city},{' '}
                      {(JSON.parse(sessionStorage.getItem('bookingDetails') || '{}')?.address?.state) || user?.state} -{' '}
                      {(JSON.parse(sessionStorage.getItem('bookingDetails') || '{}')?.address?.pincode) || user?.pincode}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !formData.scheduledDate || !formData.scheduledTime}
              className="btn-primary w-full text-lg py-4"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Confirming Booking...
                </div>
              ) : (
                'Confirm Booking'
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ScheduleBooking;
