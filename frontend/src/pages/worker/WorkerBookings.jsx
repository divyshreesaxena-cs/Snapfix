import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, MapPin, Phone, CheckCircle2, XCircle, PlayCircle, CreditCard } from 'lucide-react';
import { workerBookingsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import Loading from '../../components/Loading';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const statusBadge = (status) => {
  const map = {
    'Pending': 'badge-warning',
    'Accepted': 'badge-success',
    'Rejected': 'badge-danger',
    'In Progress': 'badge-info',
    'Completed': 'badge-success',
    'Cancelled': 'badge-danger'
  };
  return map[status] || 'badge-info';
};

const WorkerBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await workerBookingsAPI.getBookings();
      setBookings(response.data.data || []);
    } catch (e) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return bookings;
    if (filter === 'pending') return bookings.filter(b => b.workerStatus === 'Pending');
    if (filter === 'active') return bookings.filter(b => ['Accepted', 'In Progress'].includes(b.status));
    if (filter === 'completed') return bookings.filter(b => b.status === 'Completed');
    return bookings;
  }, [bookings, filter]);

  const handleRespond = async (id, workerStatus) => {
    try {
      await workerBookingsAPI.respond(id, workerStatus);
      toast.success(`Booking ${workerStatus.toLowerCase()}!`);
      fetchBookings();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update booking');
    }
  };

  const handleStart = async (id) => {
    try {
      await workerBookingsAPI.start(id);
      toast.success('Job started');
      fetchBookings();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to start job');
    }
  };

  const handleInitiateCompletion = async (id) => {
    try {
      await workerBookingsAPI.initiateCompletion(id);
      toast.success('Completion initiated. Customer can pay now.');
      fetchBookings();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to initiate completion');
    }
  };

  if (loading) return <Loading fullScreen />;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-4xl font-display gradient-text mb-3">My Jobs</h1>
          <p className="text-dark-600 text-lg">Accept/reject new bookings, start work, and initiate completion.</p>
        </motion.div>

        <div className="flex gap-2 flex-wrap mb-6">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending Requests' },
            { key: 'active', label: 'Active' },
            { key: 'completed', label: 'Completed' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filter === t.key ? 'bg-orange-600 text-white shadow-lg' : 'bg-white text-dark-600 hover:bg-dark-50 border border-dark-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-dark-600">No jobs to show.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filtered.map((b) => (
              <motion.div key={b._id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="card p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-xl font-display text-dark-800">{b.serviceCategory} • {b.problemType}</h3>
                    <p className="text-dark-500 text-sm mt-1">Booking ID: {b._id.slice(-8)}</p>
                  </div>
                  <span className={`${statusBadge(b.status)} text-xs`}>{b.status}</span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-dark-700">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    <span>{format(new Date(b.scheduledDate), 'PPP')} • {b.scheduledTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-dark-700">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    <span>{b.address?.city || b.user?.city || '-'}, {b.address?.state || b.user?.state || '-'} ({b.address?.pincode || b.user?.pincode || '-'})</span>
                  </div>
                  <div className="flex items-center gap-2 text-dark-700">
                    <Phone className="w-4 h-4 text-orange-600" />
                    <span>{b.user?.fullName || 'Customer'} • {b.user?.phone || '-'}</span>
                  </div>
                  <div className="mt-3">
                    <p className="text-dark-500">Description</p>
                    <p className="text-dark-700 mt-1">{b.description}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {b.workerStatus === 'Pending' && b.status === 'Pending' && (
                    <>
                      <button onClick={() => handleRespond(b._id, 'Accepted')} className="btn-primary flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" /> Accept
                      </button>
                      <button onClick={() => handleRespond(b._id, 'Rejected')} className="btn-secondary flex items-center gap-2">
                        <XCircle className="w-5 h-5" /> Reject
                      </button>
                    </>
                  )}

                  {b.status === 'Accepted' && (
                    <button onClick={() => handleStart(b._id)} className="btn-primary flex items-center gap-2">
                      <PlayCircle className="w-5 h-5" /> Start Job
                    </button>
                  )}

                  {b.status === 'In Progress' && (
                    <button onClick={() => handleInitiateCompletion(b._id)} className="btn-primary flex items-center gap-2">
                      <CreditCard className="w-5 h-5" /> Initiate Completion
                    </button>
                  )}

                  {b.status === 'Completed' && (
                    <div className="px-4 py-2 rounded-xl bg-green-50 text-green-700 font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Waiting for / Completed Payment
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerBookings;
