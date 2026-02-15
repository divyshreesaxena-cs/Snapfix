import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  ArrowRight,
  Sparkles,
  Wrench,
  Zap,
  Users,
  Briefcase,
  Lock,
  User as UserIcon,
  KeyRound
} from 'lucide-react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  const [step, setStep] = useState('role'); // 'role', 'auth', 'otp'
  const [role, setRole] = useState(''); // 'customer' or 'worker'

  // 'password_login' | 'register' | 'otp_login' | 'forgot_send' | 'forgot_verify'
  const [mode, setMode] = useState('password_login');

  // password login/register
  const [usernameOrPhone, setUsernameOrPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // forgot password
  const [forgotPhone, setForgotPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [devOTP, setDevOTP] = useState('');

  const navigate = useNavigate();
  const { login, isAuthenticated, role: currentRole } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(currentRole === 'worker' ? '/worker/dashboard' : '/home');
    }
  }, [isAuthenticated, currentRole, navigate]);

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep('auth');
    localStorage.setItem('userRole', selectedRole);

    // ✅ default mode for BOTH roles should be password login
    setMode('password_login');

    // reset inputs for clean UX
    setPhone('');
    setOtp('');
    setDevOTP('');
    setUsernameOrPhone('');
    setUsername('');
    setPassword('');
    setForgotPhone('');
    setNewPassword('');
  };

  // -------------------------
  // OTP flow (existing) — for login (both roles)
  // -------------------------
  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (phone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      const endpoint = role === 'worker' ? 'worker-auth' : 'auth';
      const response = await authAPI.sendOTP(phone, endpoint);
      toast.success('OTP sent successfully!');

      if (response.data.otp) {
        setDevOTP(response.data.otp);
        toast.success(`Dev Mode - OTP: ${response.data.otp}`, { duration: 10000 });
      }

      setStep('otp');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const endpoint = role === 'worker' ? 'worker-auth' : 'auth';
      const response = await authAPI.verifyOTP(phone, otp, endpoint);
      const { token, user, worker, isNewUser, isNewWorker } = response.data;

      const userData = role === 'worker' ? worker : user;
      login(userData, token, role);
      toast.success('Login successful!');

      if ((isNewUser || !user?.isProfileComplete) && role === 'customer') {
        navigate('/profile-setup');
      } else if ((isNewWorker || !worker?.isProfileComplete) && role === 'worker') {
        navigate('/worker/profile-setup');
      } else {
        navigate(role === 'worker' ? '/worker/dashboard' : '/home');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // Password login/register (Customer)
  // -------------------------
  const handlePasswordLogin = async (e) => {
    e.preventDefault();

    if (!usernameOrPhone.trim() || !password) {
      toast.error('Enter username/phone and password');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.login(
        {
          username: usernameOrPhone.trim(), // safest for your current customer controller
          password,
        },
        'auth'
      );

      const { token, user } = res.data;
      login(user, token, 'customer');
      toast.success('Login successful!');

      if (!user?.isProfileComplete) navigate('/profile-setup');
      else navigate('/home');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const p = phone.trim();
    const u = username.trim();

    if (p.length !== 10) return toast.error('Enter a valid 10-digit phone');
    if (u.length < 3) return toast.error('Username must be at least 3 characters');
    if (!password || password.length < 6) return toast.error('Password must be at least 6 characters');

    setLoading(true);
    try {
      const res = await authAPI.register(
        {
          phone: p,
          username: u,
          password,
        },
        'auth'
      );

      const { token, user } = res.data;
      login(user, token, 'customer');
      toast.success('Registered successfully!');

      navigate('/profile-setup');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // Forgot password via OTP (Customer)
  // -------------------------
  const handleForgotSend = async (e) => {
    e.preventDefault();

    if (forgotPhone.trim().length !== 10) {
      toast.error('Enter a valid 10-digit phone');
      return;
    }

    setLoading(true);
    try {
      await authAPI.forgotPasswordSendOTP(forgotPhone.trim(), 'auth');
      toast.success('OTP sent for password reset');
      setStep('otp');
      setPhone(forgotPhone.trim());
      setDevOTP('');
      setOtp('');
      setMode('forgot_verify');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotVerify = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) return toast.error('Enter a valid 6-digit OTP');
    if (!newPassword || newPassword.length < 6) return toast.error('New password must be at least 6 characters');

    setLoading(true);
    try {
      await authAPI.forgotPasswordVerifyOTP(
        {
          phone: phone.trim(),
          otp: otp.trim(),
          newPassword,
        },
        'auth'
      );

      toast.success('Password reset successful! Login with your password.');
      setStep('auth');
      setMode('password_login');
      setPassword('');
      setNewPassword('');
      setOtp('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // Password login/register (Worker)
  // -------------------------
  const handleWorkerPasswordLogin = async (e) => {
    e.preventDefault();

    if (!usernameOrPhone.trim() || !password) {
      toast.error('Enter username/phone and password');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.login(
        {
          identifier: usernameOrPhone.trim(), // worker controller uses identifier
          password,
        },
        'worker-auth'
      );

      const { token, worker, isNewWorker } = res.data;

      login(worker, token, 'worker');
      toast.success('Login successful!');

      if (isNewWorker || !worker?.isProfileComplete) navigate('/worker/profile-setup');
      else navigate('/worker/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkerRegister = async (e) => {
    e.preventDefault();

    const p = phone.trim();
    const u = username.trim();

    if (p.length !== 10) return toast.error('Enter a valid 10-digit phone');
    if (u.length < 3) return toast.error('Username must be at least 3 characters');
    if (!password || password.length < 6) return toast.error('Password must be at least 6 characters');

    setLoading(true);
    try {
      const res = await authAPI.register(
        {
          phone: p,
          username: u,
          password,
        },
        'worker-auth'
      );

      const { token, worker } = res.data;
      login(worker, token, 'worker');
      toast.success('Registered successfully!');
      navigate('/worker/profile-setup');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkerForgotSend = async (e) => {
    e.preventDefault();

    if (forgotPhone.trim().length !== 10) {
      toast.error('Enter a valid 10-digit phone');
      return;
    }

    setLoading(true);
    try {
      await authAPI.forgotPasswordSendOTP(forgotPhone.trim(), 'worker-auth');
      toast.success('OTP sent for password reset');
      setStep('otp');
      setPhone(forgotPhone.trim());
      setDevOTP('');
      setOtp('');
      setMode('forgot_verify');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkerForgotVerify = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) return toast.error('Enter a valid 6-digit OTP');
    if (!newPassword || newPassword.length < 6) return toast.error('New password must be at least 6 characters');

    setLoading(true);
    try {
      await authAPI.forgotPasswordVerifyOTP(
        {
          phone: phone.trim(),
          otp: otp.trim(),
          newPassword,
        },
        'worker-auth'
      );

      toast.success('Password reset successful! Login with your password.');
      setStep('auth');
      setMode('password_login');
      setPassword('');
      setNewPassword('');
      setOtp('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // UI helpers
  // -------------------------
  const resetToRole = () => {
    setStep('role');
    setRole('');
    setMode('password_login');
    setPhone('');
    setOtp('');
    setDevOTP('');
    setUsernameOrPhone('');
    setUsername('');
    setPassword('');
    setForgotPhone('');
    setNewPassword('');
  };

  const otpSubmitHandler =
    mode === 'forgot_verify'
      ? (role === 'worker' ? handleWorkerForgotVerify : handleForgotVerify)
      : handleVerifyOTP;

  const backFromOtp = () => {
    setStep('auth');
    setOtp('');
    setDevOTP('');
    if (mode === 'forgot_verify') setMode('password_login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -left-40 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -right-40 w-80 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl mb-6 shadow-2xl transform hover:rotate-6 transition-transform">
            <Wrench className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-display gradient-text mb-3">SnapFix</h1>
          <p className="text-dark-600 text-lg flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            Your Home Repair Partner
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="card p-8 glass"
        >
          {/* STEP: ROLE */}
          {step === 'role' ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display text-dark-900 mb-2">Welcome!</h2>
                <p className="text-dark-600">Choose how you want to continue</p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => handleRoleSelect('customer')}
                  className="w-full p-6 rounded-xl border-2 border-dark-200 hover:border-orange-500 hover:bg-orange-50 transition-all duration-200 text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <Users className="w-7 h-7 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-display text-dark-900 mb-1">I'm a Customer</h3>
                      <p className="text-sm text-dark-600">Book home repair services</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-dark-400 group-hover:text-orange-600 transition-all" />
                  </div>
                </button>

                <button
                  onClick={() => handleRoleSelect('worker')}
                  className="w-full p-6 rounded-xl border-2 border-dark-200 hover:border-orange-500 hover:bg-orange-50 transition-all duration-200 text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                      <Briefcase className="w-7 h-7 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-display text-dark-900 mb-1">I'm a Professional</h3>
                      <p className="text-sm text-dark-600">Find work and manage bookings</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-dark-400 group-hover:text-orange-600 transition-all" />
                  </div>
                </button>
              </div>
            </div>
          ) : step === 'auth' ? (
            <div className="space-y-6">
              <div>
                <button
                  type="button"
                  onClick={resetToRole}
                  className="text-orange-600 hover:text-orange-700 font-medium mb-4 flex items-center gap-2 text-sm"
                >
                  ← Change Role
                </button>

                <h2 className="text-2xl font-display text-dark-900 mb-2">
                  {role === 'worker' ? 'Professional Access' : 'Customer Access'}
                </h2>
                <p className="text-dark-600">
                  Login with password, or use OTP if needed.
                </p>
              </div>

              {/* Tabs for BOTH roles */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode('password_login')}
                  className={`flex-1 px-4 py-2 rounded-xl border-2 font-semibold transition ${
                    mode === 'password_login'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-dark-200 text-dark-700 hover:border-orange-300'
                  }`}
                >
                  Password Login
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`flex-1 px-4 py-2 rounded-xl border-2 font-semibold transition ${
                    mode === 'register'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-dark-200 text-dark-700 hover:border-orange-300'
                  }`}
                >
                  Register
                </button>
              </div>

              {/* PASSWORD LOGIN (Customer or Worker) */}
              {mode === 'password_login' && (
                <form
                  onSubmit={role === 'worker' ? handleWorkerPasswordLogin : handlePasswordLogin}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-dark-700">Username or Phone</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                      <input
                        value={usernameOrPhone}
                        onChange={(e) => setUsernameOrPhone(e.target.value)}
                        placeholder="e.g. worker2 or 9999988888"
                        className="input pl-12"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-dark-700">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="input pl-12"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      <>
                        Login
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => setMode('forgot_send')}
                      className="text-orange-600 hover:text-orange-700 font-semibold"
                    >
                      Forgot password?
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMode('otp_login');
                        setPhone('');
                        setOtp('');
                        setDevOTP('');
                      }}
                      className="text-dark-600 hover:text-dark-800 font-semibold"
                    >
                      Login with OTP
                    </button>
                  </div>
                </form>
              )}

              {/* REGISTER (Customer or Worker) */}
              {mode === 'register' && (
                <form
                  onSubmit={role === 'worker' ? handleWorkerRegister : handleRegister}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-dark-700">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="Enter 10-digit number"
                        className="input pl-12"
                        required
                        maxLength={10}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-dark-700">Username</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                      <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Choose a username"
                        className="input pl-12"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-dark-700">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password"
                        className="input pl-12"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        Register
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <div className="text-sm text-center">
                    <button
                      type="button"
                      onClick={() => setMode('password_login')}
                      className="text-dark-600 hover:text-dark-800 font-semibold"
                    >
                      Already have an account? Login
                    </button>
                  </div>
                </form>
              )}

              {/* OTP LOGIN (Customer or Worker) */}
              {mode === 'otp_login' && (
                <form onSubmit={handleSendOTP} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-dark-700">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="Enter 10-digit number"
                        className="input pl-12"
                        required
                        maxLength={10}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || phone.length !== 10}
                    className="btn-primary w-full flex items-center justify-center gap-2 group"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        Send OTP
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('password_login')}
                    className="w-full btn-secondary"
                    disabled={loading}
                  >
                    Back to Password Login
                  </button>
                </form>
              )}

              {/* FORGOT PASSWORD (Send OTP) - Customer or Worker */}
              {mode === 'forgot_send' && (
                <form
                  onSubmit={role === 'worker' ? handleWorkerForgotSend : handleForgotSend}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-dark-700">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                      <input
                        type="tel"
                        value={forgotPhone}
                        onChange={(e) => setForgotPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="Enter your registered phone"
                        className="input pl-12"
                        required
                        maxLength={10}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || forgotPhone.length !== 10}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        Send Reset OTP
                        <KeyRound className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('password_login')}
                    className="w-full btn-secondary"
                    disabled={loading}
                  >
                    Back to Login
                  </button>
                </form>
              )}
            </div>
          ) : (
            // STEP: OTP verify (used for OTP login or forgot password verify)
            <form onSubmit={otpSubmitHandler} className="space-y-6">
              <div>
                <h2 className="text-2xl font-display text-dark-900 mb-2">Enter OTP</h2>
                <p className="text-dark-600">
                  We've sent a code to{' '}
                  <span className="font-semibold text-orange-600">{phone}</span>
                </p>
              </div>

              {devOTP && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4"
                >
                  <p className="text-sm font-medium text-orange-800 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Dev Mode - Your OTP: <span className="font-bold text-lg">{devOTP}</span>
                  </p>
                </motion.div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-dark-700">6-Digit OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter OTP"
                  className="input text-center text-2xl tracking-widest font-bold"
                  required
                  maxLength={6}
                  autoFocus
                />
              </div>

              {mode === 'forgot_verify' && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-dark-700">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="input pl-12"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={backFromOtp}
                  className="btn-secondary flex-1"
                  disabled={loading}
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    mode === 'forgot_verify' ? 'Reset Password' : 'Verify & Login'
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-6 text-sm text-dark-600"
        >
          By continuing, you agree to our Terms & Privacy Policy
        </motion.p>
      </div>
    </div>
  );
};

export default Login;
