import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, LogOut, Menu, X, Wrench, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { user, logout, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = role === 'worker'
    ? [
        { path: '/worker/dashboard', label: 'Home', icon: Home },
        { path: '/worker/bookings', label: 'My Jobs', icon: ClipboardList },
        { path: '/worker/profile-setup', label: 'Profile', icon: Calendar }, // quick access
      ]
    : [
        { path: '/home', label: 'Home', icon: Home },
        { path: '/bookings', label: 'My Bookings', icon: Calendar },
      ];

  const homePath = role === 'worker' ? '/worker/dashboard' : '/home';

  const isActive = (path) => location.pathname === path;

  if (!isAuthenticated) return null;

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-dark-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to={homePath} className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-300 shadow-lg">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="text-2xl font-display gradient-text">SnapFix</span>
              <div className="text-xs text-dark-500 -mt-1">{role === 'worker' ? 'Worker Portal' : 'Customer'}</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-dark-600 hover:bg-dark-50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-dark-800">
                {role === 'worker' ? (user?.name || 'Worker') : (user?.fullName || 'User')}
              </p>
              <p className="text-xs text-dark-500">{user?.phone}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200 font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-dark-50 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-dark-700" />
            ) : (
              <Menu className="w-6 h-6 text-dark-700" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-dark-100 bg-white"
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-dark-600 hover:bg-dark-50'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
              <div className="pt-4 border-t border-dark-100">
                <div className="px-4 py-2">
                  <p className="text-sm font-semibold text-dark-800">
                    {role === 'worker' ? (user?.name || 'Worker') : (user?.fullName || 'User')}
                  </p>
                  <p className="text-xs text-dark-500">{user?.phone}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full mt-2 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200 font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
