import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { bookingsAPI } from '../services/api';
import toast from 'react-hot-toast';
import Loading from '../components/Loading';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Phone, User, Briefcase, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
const BASE_URL = import.meta.env.VITE_API_URL.replace('/api', '');

const BookingDetails = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const res = await bookingsAPI.getBooking(bookingId);
      setBooking(res.data.data);
    } catch (e) {
      toast.error('Booking not found');
      navigate('/bookings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading fullScreen />;
  if (!booking) return null;

  const canPay = booking.status === 'Completed' && !booking.hasPaid;
  const canFeedback = booking.status === 'Completed' && booking.hasPaid && !booking.hasFeedback;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button
            onClick={() => navigate('/bookings')}
            className="text-orange-600 hover:text-orange-700 font-medium mb-4 flex items-center gap-2"
          >
            ← Back to Bookings
          </button>

          <h1 className="text-4xl font-display gradient-text">Booking Details</h1>
          <p className="text-dark-600 mt-1">Track the full information for this booking.</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: summary */}
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-dark-500 mb-1">Service</div>
                  <div className="text-2xl font-display text-dark-900">{booking.serviceCategory}</div>
                  <div className="text-dark-600 mt-1">{booking.problemType}</div>
                </div>
                <span className={`badge ${booking.status === 'Completed' ? 'badge-success' : booking.status === 'In Progress' ? 'badge-warning' : 'badge-info'}`}>
                  {booking.status}
                </span>
              </div>

              <div className="mt-6 grid sm:grid-cols-2 gap-4 text-dark-700">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  <div>
                    <div className="text-sm text-dark-500">Date</div>
                    <div className="font-semibold">{format(new Date(booking.scheduledDate), 'PPP')}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <div>
                    <div className="text-sm text-dark-500">Time</div>
                    <div className="font-semibold">{booking.scheduledTime}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:col-span-2">
                  <MapPin className="w-5 h-5 text-orange-500" />
                  <div>
                    <div className="text-sm text-dark-500">Address</div>
                    <div className="font-semibold">
                      {booking.address?.fullAddress || ''} {booking.address?.city ? `, ${booking.address.city}` : ''}{' '}
                      {booking.address?.state ? `, ${booking.address.state}` : ''}{' '}
                      {booking.address?.pincode ? `- ${booking.address.pincode}` : ''}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-sm text-dark-500 mb-2">Description</div>
                <div className="bg-dark-50 border-2 border-dark-200 rounded-xl p-4 text-dark-700">
                  {booking.description}
                </div>
              </div>
            </div>

            {booking.images?.length > 0 && (
              <div className="card p-6">
                <div className="text-xl font-display text-dark-900 mb-4">Uploaded Images</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {booking.images.map((img, i) => (
  <a key={i} href={`${BASE_URL}${img}`} target="_blank" rel="noreferrer">
    <img
      src={`${BASE_URL}${img}`}
      alt={`Booking ${i + 1}`}
      className="w-full h-28 object-cover rounded-2xl border-2 border-dark-200 hover:border-orange-300 transition"
    />
  </a>
))}

                </div>
              </div>
            )}
          </motion.div>

          {/* Right: worker + actions */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="card p-6">
              <div className="text-xl font-display text-dark-900 mb-4">Professional</div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <div className="font-semibold text-dark-900">{booking.worker?.name}</div>
                  <div className="text-sm text-dark-600 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    {booking.worker?.serviceCategory}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-dark-700">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-dark-500" />
                  <span className="font-semibold">{booking.worker?.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-dark-500" />
                  <span className="font-semibold">{booking.worker?.pricePerHour}/hour</span>
                </div>
              </div>
            </div>

            <div className="card p-6 space-y-3">
              <div className="text-xl font-display text-dark-900">Next steps</div>

              {canPay && (
                <button onClick={() => navigate(`/payment/${booking._id}`)} className="btn-primary w-full">
                  Pay Now
                </button>
              )}

              {canFeedback && (
                <button onClick={() => navigate(`/feedback/${booking._id}`)} className="btn-secondary w-full">
                  Give Feedback
                </button>
              )}

              {!canPay && !canFeedback && booking.status === 'Completed' && (
                <div className="text-center text-sm font-semibold bg-green-50 border-2 border-green-200 rounded-xl py-3 text-green-700">
                  All done ✅
                </div>
              )}

              {booking.status !== 'Completed' && (
                <div className="text-sm text-dark-600">
                  Payment becomes available after the worker completes the job.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;
