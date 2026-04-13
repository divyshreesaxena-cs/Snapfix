import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const loadBookings = async (selectedStatus = status) => {
    try {
      setLoading(true);
      const res = await adminAPI.getBookings(selectedStatus ? { status: selectedStatus } : {});
      setBookings(res.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings('');
  }, []);

  const cancelBooking = async (bookingId) => {
    const reason = window.prompt('Optional reason for admin cancellation:') || '';
    try {
      await adminAPI.cancelBooking(bookingId, reason);
      toast.success('Booking cancelled by admin');
      loadBookings(status);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display gradient-text">Bookings</h1>
          <p className="text-dark-500 mt-2">Review all bookings and cancel problematic ones when necessary.</p>
        </div>
        <div className="flex gap-3">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-4 py-3 rounded-xl border border-dark-200">
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button onClick={() => loadBookings(status)} className="px-4 py-3 rounded-xl bg-orange-500 text-white font-medium">Apply</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-dark-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dark-50 text-dark-600">
              <tr>
                <th className="text-left px-6 py-3">Customer</th>
                <th className="text-left px-6 py-3">Worker</th>
                <th className="text-left px-6 py-3">Service</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-left px-6 py-3">Scheduled</th>
                <th className="text-left px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking._id} className="border-t border-dark-100 align-top">
                  <td className="px-6 py-4">{booking.user?.fullName || booking.user?.phone || 'Unknown'}</td>
                  <td className="px-6 py-4">{booking.worker?.name || booking.worker?.phone || 'Unknown'}</td>
                  <td className="px-6 py-4">{booking.serviceCategory}<div className="text-xs text-dark-500 mt-1">{booking.problemType}</div></td>
                  <td className="px-6 py-4">{booking.status}</td>
                  <td className="px-6 py-4">{new Date(booking.scheduledDate).toLocaleDateString()}<div className="text-xs text-dark-500 mt-1">{booking.scheduledTime}</div></td>
                  <td className="px-6 py-4">
                    {booking.status !== 'Completed' && booking.status !== 'Cancelled' ? (
                      <button onClick={() => cancelBooking(booking._id)} className="px-4 py-2 rounded-xl bg-red-50 text-red-700 font-medium">Cancel</button>
                    ) : (
                      <span className="text-dark-400">No action</span>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && !bookings.length && (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-dark-500">No bookings found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminBookings;
