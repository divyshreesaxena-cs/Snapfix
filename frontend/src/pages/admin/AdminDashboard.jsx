import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const StatCard = ({ label, value }) => (
  <div className="bg-white rounded-2xl border border-dark-100 p-5 shadow-sm">
    <div className="text-sm text-dark-500">{label}</div>
    <div className="text-3xl font-bold text-dark-900 mt-2">{value}</div>
  </div>
);

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getDashboard();
      setData(res.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return <div className="p-6">Loading admin dashboard...</div>;
  }

  const metrics = data?.metrics || {};

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display gradient-text">Admin Dashboard</h1>
          <p className="text-dark-500 mt-2">Monitor customers, workers, bookings, payments, and feedback.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/users" className="px-4 py-2 rounded-xl bg-white border border-dark-200 font-medium">Manage Users</Link>
          <Link to="/admin/workers" className="px-4 py-2 rounded-xl bg-white border border-dark-200 font-medium">Manage Workers</Link>
          <Link to="/admin/bookings" className="px-4 py-2 rounded-xl bg-orange-500 text-white font-medium">Manage Bookings</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard label="Customers" value={metrics.totalCustomers || 0} />
        <StatCard label="Workers" value={metrics.totalWorkers || 0} />
        <StatCard label="Verified Workers" value={metrics.verifiedWorkers || 0} />
        <StatCard label="Bookings" value={metrics.totalBookings || 0} />
        <StatCard label="Revenue" value={`₹${metrics.totalRevenue || 0}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Completed Bookings" value={metrics.completedBookings || 0} />
        <StatCard label="Cancelled Bookings" value={metrics.cancelledBookings || 0} />
        <StatCard label="Pending Payments" value={metrics.pendingPayments || 0} />
        <StatCard label="Feedback Entries" value={metrics.totalFeedback || 0} />
      </div>

      <div className="bg-white rounded-2xl border border-dark-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-100 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-dark-900">Recent Bookings</h2>
          <button onClick={loadDashboard} className="text-orange-600 font-medium">Refresh</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dark-50 text-dark-600">
              <tr>
                <th className="text-left px-6 py-3">Customer</th>
                <th className="text-left px-6 py-3">Worker</th>
                <th className="text-left px-6 py-3">Service</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-left px-6 py-3">Scheduled</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentBookings || []).map((booking) => (
                <tr key={booking._id} className="border-t border-dark-100">
                  <td className="px-6 py-4">{booking.user?.fullName || booking.user?.phone || 'Unknown'}</td>
                  <td className="px-6 py-4">{booking.worker?.name || booking.worker?.phone || 'Unknown'}</td>
                  <td className="px-6 py-4">{booking.serviceCategory}</td>
                  <td className="px-6 py-4">{booking.status}</td>
                  <td className="px-6 py-4">{new Date(booking.scheduledDate).toLocaleDateString()} • {booking.scheduledTime}</td>
                </tr>
              ))}
              {!data?.recentBookings?.length && (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-dark-500">No recent bookings found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
