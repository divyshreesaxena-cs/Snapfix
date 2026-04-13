import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Shield, Mail, Lock } from 'lucide-react';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, role } = useAuth();

  useEffect(() => {
    if (isAuthenticated && role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.error('Enter admin email and password');
      return;
    }

    setLoading(true);
    try {
      const res = await adminAPI.login({
        email: email.trim().toLowerCase(),
        password,
      });

      const adminData = res.data.admin || res.data.data || null;
      const token = res.data.token;

      if (!token || !adminData) {
        throw new Error('Invalid admin login response');
      }

      login(adminData, token, 'admin');
      toast.success('Admin login successful');

      const redirectTo = location.state?.from?.pathname || '/admin/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-50 via-white to-orange-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-dark-100 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-display gradient-text mb-2">Admin Access</h1>
          <p className="text-dark-500">Login to manage the SnapFix platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-dark-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="admin@snapfix.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-dark-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Enter password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white font-semibold shadow-lg"
          >
            {loading ? 'Signing in...' : 'Login as Admin'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-dark-500">
          Customer or worker? <Link to="/login" className="text-orange-600 font-semibold">Go to standard login</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;