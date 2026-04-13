import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, User, Phone, Home, Clock } from 'lucide-react';
import { bookingsAPI } from '../services/api';
import Loading from '../components/Loading';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const BookingConfirmed = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const response = await bookingsAPI.getBooking(bookingId);
      setBooking(response.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading fullScreen />;

  const isPendingApproval =
    booking?.status === 'Pending' && booking?.workerStatus === 'Pending';

  const isAccepted =
    booking?.status === 'Accepted' && booking?.workerStatus === 'Accepted';

  const heading = isPendingApproval
    ? 'Booking Request Submitted'
    : isAccepted
    ? 'Booking Confirmed!'
    : booking?.status === 'Rejected'
    ? 'Booking Request Rejected'
    : 'Booking Status Updated';

  const subheading = isPendingApproval
    ? 'Your request has been sent to the professional and is awaiting approval.'
    : isAccepted
    ? 'Your service has been confirmed by the professional.'
    : booking?.status === 'Rejected'
    ? 'The selected professional could not accept this booking.'
    : 'Your booking status has been updated.';

  const nextSteps = isPendingApproval
    ? [
        'The professional will review your request.',
        'You will see the booking as confirmed once the worker accepts it.',
        'If the worker rejects the request, you can choose another professional.',
        'Please do not make payment until the work is completed.',
      ]
    : isAccepted
    ? [
        'The professional accepted your booking request.',
        'You may receive a call before arrival for coordination.',
        'Track the booking status from My Bookings.',
        'Make payment and provide feedback after the work is completed.',
      ]
    : booking?.status === 'Rejected'
    ? [
        'This professional did not accept the request.',
        'Please return to the worker list and choose another professional.',
        'You can also try another time slot if needed.',
      ]
    : [
        'Please check My Bookings for the latest status.',
      ];

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>

          <h1 className="text-4xl font-display text-dark-900 mb-3">
            {heading}
          </h1>
          <p className="text-lg text-dark-600">
            {subheading}
          </p>
        </motion.div>

        {booking && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-8 space-y-6"
          >
            <div>
              <h2 className="text-xl font-display text-dark-900 mb-4">
                Booking Details
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-xl">
                  <Calendar className="w-6 h-6 text-orange-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-dark-600 mb-1">Date & Time</p>
                    <p className="font-semibold text-dark-900">
                      {format(new Date(booking.scheduledDate), 'EEEE, MMMM d, yyyy')}
                    </p>
                    <p className="text-orange-600 font-medium">{booking.scheduledTime}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl">
                  <User className="w-6 h-6 text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-dark-600 mb-1">Professional</p>
                    <p className="font-semibold text-dark-900">{booking.worker?.name}</p>
                    <p className="text-sm text-dark-600 flex items-center gap-1 mt-1">
                      <Phone className="w-4 h-4" />
                      {booking.worker?.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-xl">
                  <Home className="w-6 h-6 text-purple-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-dark-600 mb-1">Service</p>
                    <p className="font-semibold text-dark-900">{booking.serviceCategory}</p>
                    <p className="text-sm text-dark-600">{booking.problemType}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl">
                  <Clock className="w-6 h-6 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-dark-600 mb-1">Approval Status</p>
                    <p className="font-semibold text-dark-900">
                      Worker: {booking.workerStatus}
                    </p>
                    <p className="text-sm text-dark-600">
                      Booking: {booking.status}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <span className="badge badge-info text-base px-6 py-2">
                Status: {booking.status}
              </span>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => navigate('/bookings')}
                className="btn-secondary flex-1"
              >
                View All Bookings
              </button>
              <button
                onClick={() => navigate('/home')}
                className="btn-primary flex-1"
              >
                Back to Home
              </button>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 p-6 bg-amber-50 border-2 border-amber-200 rounded-xl"
        >
          <h3 className="font-display text-lg text-amber-900 mb-2">
            What's Next?
          </h3>
          <ul className="space-y-2 text-amber-800">
            {nextSteps.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-600">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default BookingConfirmed;