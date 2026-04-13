import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const AdminProfile = () => {
  const { updateUser, logout } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', currentPassword: '', newPassword: '' });
  const [meta, setMeta] = useState({ role: 'admin', lastLoginAt: null, createdAt: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getProfile();
      const admin = res.data.data;
      setForm((prev) => ({ ...prev, name: admin.name || '', email: admin.email || '', currentPassword: '', newPassword: '' }));
      setMeta({ role: admin.role, lastLoginAt: admin.lastLoginAt, createdAt: admin.createdAt });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load admin profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminAPI.updateProfile(form);
      updateUser(res.data.data);
      toast.success(res.data.message || 'Profile updated');
      const passwordChanged = Boolean(form.newPassword);
      setForm((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
      await loadProfile();
      if (passwordChanged) {
        toast('Password changed. Please login again.', { icon: '🔒' });
        setTimeout(() => logout(), 800);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading admin profile...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-display gradient-text">Admin Profile</h1>
        <p className="text-dark-500 mt-2">Update admin identity details and change the password securely.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-dark-100 shadow-sm p-6 space-y-3">
          <div>
            <div className="text-sm text-dark-500">Role</div>
            <div className="font-semibold text-dark-900 capitalize">{meta.role}</div>
          </div>
          <div>
            <div className="text-sm text-dark-500">Last Login</div>
            <div className="font-semibold text-dark-900">{meta.lastLoginAt ? new Date(meta.lastLoginAt).toLocaleString() : '—'}</div>
          </div>
          <div>
            <div className="text-sm text-dark-500">Admin Since</div>
            <div className="font-semibold text-dark-900">{meta.createdAt ? new Date(meta.createdAt).toLocaleDateString() : '—'}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white rounded-2xl border border-dark-100 shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">Name</label>
            <input name="name" value={form.name} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-dark-200" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-dark-200" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">Current Password</label>
              <input name="currentPassword" type="password" value={form.currentPassword} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-dark-200" placeholder="Required to change password" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">New Password</label>
              <input name="newPassword" type="password" value={form.newPassword} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-dark-200" placeholder="Leave blank to keep current" />
            </div>
          </div>
          <button disabled={saving} className="px-5 py-3 rounded-xl bg-orange-500 text-white font-medium disabled:opacity-70">{saving ? 'Saving...' : 'Save Profile'}</button>
        </form>
      </div>
    </div>
  );
};

export default AdminProfile;
