import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AdminWorkers = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const loadWorkers = async (search = '') => {
    try {
      setLoading(true);
      const res = await adminAPI.getWorkers({ q: search });
      setWorkers(res.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load workers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  const toggleBlock = async (worker) => {
    try {
      await adminAPI.setWorkerBlocked(worker._id, !worker.isBlocked);
      toast.success(`Worker ${worker.isBlocked ? 'unblocked' : 'blocked'} successfully`);
      loadWorkers(query);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update worker');
    }
  };

  const toggleVerify = async (worker) => {
    try {
      await adminAPI.setWorkerVerified(worker._id, !worker.isVerified);
      toast.success(`Worker ${worker.isVerified ? 'marked unverified' : 'verified'} successfully`);
      loadWorkers(query);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update verification');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display gradient-text">Workers</h1>
          <p className="text-dark-500 mt-2">Verify workers, review service details, and block accounts when needed.</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); loadWorkers(query); }} className="flex gap-3">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, phone, service" className="px-4 py-3 rounded-xl border border-dark-200 min-w-[260px]" />
          <button className="px-4 py-3 rounded-xl bg-orange-500 text-white font-medium">Search</button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {workers.map((worker) => (
          <div key={worker._id} className="bg-white rounded-2xl border border-dark-100 shadow-sm p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-dark-900">{worker.name || worker.phone}</h2>
                <p className="text-dark-500">{worker.workerId} • {worker.serviceCategory || 'No primary service yet'}</p>
                <p className="text-sm text-dark-500 mt-1">{worker.phone}</p>
              </div>
              <div className="text-right text-sm">
                <div className={`font-semibold ${worker.isVerified ? 'text-emerald-600' : 'text-amber-600'}`}>{worker.isVerified ? 'Verified' : 'Unverified'}</div>
                <div className={`${worker.isBlocked ? 'text-red-600' : 'text-dark-500'}`}>{worker.isBlocked ? 'Blocked' : 'Active'}</div>
              </div>
            </div>
            <div className="text-sm text-dark-600 space-y-1">
              <p><span className="font-medium">Location:</span> {[worker.location?.city, worker.location?.state, worker.location?.pincode].filter(Boolean).join(', ') || '—'}</p>
              <p><span className="font-medium">Rate:</span> {worker.pricePerHour ? `₹${worker.pricePerHour}/hr` : '—'}</p>
              <p><span className="font-medium">Completed Jobs:</span> {worker.completedJobs || 0}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => toggleVerify(worker)} className={`px-4 py-2 rounded-xl font-medium ${worker.isVerified ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {worker.isVerified ? 'Mark Unverified' : 'Verify Worker'}
              </button>
              <button onClick={() => toggleBlock(worker)} className={`px-4 py-2 rounded-xl font-medium ${worker.isBlocked ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {worker.isBlocked ? 'Unblock Worker' : 'Block Worker'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {!loading && !workers.length && (
        <div className="bg-white rounded-2xl border border-dark-100 shadow-sm p-10 text-center text-dark-500">No workers found.</div>
      )}
    </div>
  );
};

export default AdminWorkers;
