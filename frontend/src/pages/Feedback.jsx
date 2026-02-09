import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Send, CheckCircle } from 'lucide-react';
import { bookingsAPI, feedbackAPI } from '../services/api';
import toast from 'react-hot-toast';
import Loading from '../components/Loading';
import { motion } from 'framer-motion';

const Feedback = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchBooking();
    checkExistingFeedback();
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

  const checkExistingFeedback = async () => {
    try {
      const response = await feedbackAPI.getFeedbackByBooking(bookingId);
      if (response.data.data) {
        toast.success('Feedback already submitted!');
        navigate('/bookings');
      }
    } catch (error) {
      // No feedback found, continue
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Please provide a rating');
      return;
    }

    setSubmitting(true);
    try {
      await feedbackAPI.createFeedback({
        bookingId: booking._id,
        rating,
        comment,
      });

      toast.success('Thank you for your feedback! 🌟');
      navigate('/bookings');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading fullScreen />;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Star className="w-10 h-10 text-white fill-white" />
          </div>
          
          <h1 className="text-4xl font-display gradient-text mb-2">
            Rate Your Experience
          </h1>
          <p className="text-dark-600 text-lg">
            Help us serve you better
          </p>
        </motion.div>

        {booking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Worker Info */}
            <div className="card p-6 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center text-white text-3xl font-display mx-auto mb-4 shadow-lg">
                {booking.worker.name.charAt(0)}
              </div>
              <h2 className="text-2xl font-display text-dark-900 mb-1">
                {booking.worker.name}
              </h2>
              <p className="text-dark-600">{booking.serviceCategory}</p>
            </div>

            {/* Feedback Form */}
            <form onSubmit={handleSubmit} className="card p-8 space-y-6">
              {/* Star Rating */}
              <div className="space-y-4 text-center">
                <label className="block text-lg font-display text-dark-900">
                  How was your experience? *
                </label>
                
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      type="button"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                      className="focus:outline-none transition-all duration-200"
                    >
                      <Star
                        className={`w-12 h-12 transition-colors duration-200 ${
                          star <= (hover || rating)
                            ? 'text-orange-500 fill-orange-500'
                            : 'text-dark-300'
                        }`}
                      />
                    </motion.button>
                  ))}
                </div>

                {rating > 0 && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-lg font-semibold text-orange-600"
                  >
                    {rating === 5 && '🌟 Excellent!'}
                    {rating === 4 && '😊 Great!'}
                    {rating === 3 && '👍 Good'}
                    {rating === 2 && '😐 Fair'}
                    {rating === 1 && '😞 Poor'}
                  </motion.p>
                )}
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-dark-700">
                  Share your experience (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about your experience with this professional..."
                  className="input min-h-[120px] resize-none"
                  rows={5}
                />
              </div>

              {/* Info */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Your feedback helps us maintain quality standards and helps other users make informed decisions.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || rating === 0}
                className="btn-primary w-full text-lg py-4 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Feedback
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/bookings')}
                className="btn-ghost w-full"
              >
                Skip for Now
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Feedback;
