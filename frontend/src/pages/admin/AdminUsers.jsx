import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const loadUsers = async (search = '') => {
    try {
      setLoading(true);
      const res = await adminAPI.getCustomers(search);
      setUsers(res.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const toggleBlock = async (user) => {
    try {
      await adminAPI.setCustomerBlocked(user._id, !user.isBlocked);
      toast.success(`Customer ${user.isBlocked ? 'unblocked' : 'blocked'} successfully`);
      loadUsers(query);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update customer');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display gradient-text">Customers</h1>
          <p className="text-dark-500 mt-2">Search, review, and block customer accounts.</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); loadUsers(query); }} className="flex gap-3">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, phone, city" className="px-4 py-3 rounded-xl border border-dark-200 min-w-[260px]" />
          <button className="px-4 py-3 rounded-xl bg-orange-500 text-white font-medium">Search</button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-dark-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dark-50 text-dark-600">
              <tr>
                <th className="text-left px-6 py-3">Name</th>
                <th className="text-left px-6 py-3">Phone</th>
                <th className="text-left px-6 py-3">Location</th>
                <th className="text-left px-6 py-3">Blocked</th>
                <th className="text-left px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-t border-dark-100">
                  <td className="px-6 py-4">{user.fullName || user.username || 'Unnamed User'}</td>
                  <td className="px-6 py-4">{user.phone}</td>
                  <td className="px-6 py-4">{[user.city, user.state].filter(Boolean).join(', ') || '—'}</td>
                  <td className="px-6 py-4">{user.isBlocked ? 'Yes' : 'No'}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleBlock(user)} className={`px-4 py-2 rounded-xl font-medium ${user.isBlocked ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {user.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && !users.length && (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-dark-500">No customers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
