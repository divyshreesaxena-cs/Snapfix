import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, IndianRupee, Clock } from 'lucide-react';
import { bookingsAPI, paymentsAPI } from '../services/api';
import toast from 'react-hot-toast';
import Loading from '../components/Loading';
import { motion } from 'framer-motion';

const Payment = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [hoursWorked, setHoursWorked] = useState(1);

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const response = await bookingsAPI.getBooking(bookingId);
      setBooking(response.data.data);
    } catch (error) {
      toast.error('Failed to load booking');
      navigate('/bookings');
    } finally {
      setLoading(false);
    }
  };

  const calculateAmount = () => {
    if (!booking) return 0;
    return booking.worker.pricePerHour * hoursWorked;
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    if (hoursWorked < 0.5) {
      toast.error('Minimum 0.5 hours required');
      return;
    }

    setProcessing(true);
    try {
      await paymentsAPI.createPayment({
        bookingId: booking._id,
        hoursWorked: parseFloat(hoursWorked),
      });

      toast.success('Payment successful! 🎉');
      navigate(`/feedback/${booking._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <Loading fullScreen />;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/bookings')}
            className="text-orange-600 hover:text-orange-700 font-medium mb-4 flex items-center gap-2"
          >
            ← Back to Bookings
          </button>
          
          <h1 className="text-4xl font-display gradient-text mb-2">
            Payment
          </h1>
          <p className="text-dark-600 text-lg">
            Complete your payment
          </p>
        </motion.div>

        {booking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Booking Summary */}
            <div className="card p-6">
              <h2 className="text-xl font-display text-dark-900 mb-4">
                Booking Summary
              </h2>
              
              <div className="space-y-3 text-dark-700">
                <div className="flex justify-between">
                  <span>Service:</span>
                  <span className="font-semibold">{booking.serviceCategory}</span>
                </div>
                <div className="flex justify-between">
                  <span>Professional:</span>
                  <span className="font-semibold">{booking.worker.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rate:</span>
                  <span className="font-semibold flex items-center">
                    <IndianRupee className="w-4 h-4" />
                    {booking.worker.pricePerHour}/hour
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <form onSubmit={handlePayment} className="card p-8 space-y-6">
              <h2 className="text-xl font-display text-dark-900 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-orange-500" />
                Payment Details
              </h2>

              {/* Hours Worked */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-dark-700">
                  Hours Worked *
                </label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={hoursWorked}
                    onChange={(e) => setHoursWorked(e.target.value)}
                    className="input pl-12"
                    required
                  />
                </div>
                <p className="text-xs text-dark-500">
                  Minimum 0.5 hours (increments of 0.5)
                </p>
              </div>

              {/* Amount Calculation */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-dark-700">
                    <span>Rate per hour:</span>
                    <span className="font-semibold flex items-center">
                      <IndianRupee className="w-4 h-4" />
                      {booking.worker.pricePerHour}
                    </span>
                  </div>
                  <div className="flex justify-between text-dark-700">
                    <span>Hours worked:</span>
                    <span className="font-semibold">{hoursWorked}</span>
                  </div>
                  <div className="border-t-2 border-orange-200 pt-3 flex justify-between text-lg">
                    <span className="font-display text-dark-900">Total Amount:</span>
                    <span className="font-display text-orange-600 flex items-center text-2xl">
                      <IndianRupee className="w-6 h-6" />
                      {calculateAmount()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method Info */}
              {/* Submit Button */}
              <button
                type="submit"
                disabled={processing}
                className="btn-primary w-full text-lg py-4 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Pay ₹{calculateAmount()}
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Payment;
