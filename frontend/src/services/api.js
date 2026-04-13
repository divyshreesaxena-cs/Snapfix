import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const currentPath = window.location.pathname;
    const role = localStorage.getItem('userRole');

    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');

      const isAdminPath = currentPath.startsWith('/admin');
      window.location.href = isAdminPath || role === 'admin' ? '/admin/login' : '/login';
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  sendOTP: (phone, endpoint = 'auth') =>
    api.post(`/${endpoint}/send-otp`, { phone }),

  verifyOTP: (phone, otp, endpoint = 'auth') =>
    api.post(`/${endpoint}/verify-otp`, { phone, otp }),

  register: (payload, endpoint = 'auth') =>
    api.post(`/${endpoint}/register`, payload),

  login: (payload, endpoint = 'auth') =>
    api.post(`/${endpoint}/login`, payload),

  forgotPasswordSendOTP: (arg, endpoint = 'auth') => {
    const phone = typeof arg === 'string' ? arg : arg?.phone;
    return api.post(`/${endpoint}/forgot-password/send-otp`, { phone });
  },

  forgotPasswordVerifyOTP: (payload, endpoint = 'auth') =>
    api.post(`/${endpoint}/forgot-password/verify-otp`, payload),
};

export const profileAPI = {
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.post('/profile', data),
};

export const workerProfileAPI = {
  getProfile: () => api.get('/worker/profile'),
  updateProfile: (data) => api.post('/worker/profile', data),
  completeProfile: (data) => api.post('/worker/profile', data),
};

export const workerBookingsAPI = {
  getBookings: (params) => api.get('/worker/bookings', { params }),
  respond: (id, workerStatus) => api.put(`/worker/bookings/${id}/respond`, { workerStatus }),
  start: (id) => api.put(`/worker/bookings/${id}/start`),
  initiateCompletion: (id) => api.put(`/worker/bookings/${id}/initiate-completion`),
};

export const servicesAPI = {
  getServices: () => api.get('/services'),
  getProblems: (category) => api.get(`/services/${category}/problems`),
};

export const workersAPI = {
  getWorkers: (category, pincode) =>
    api.get('/workers', { params: { category, ...(pincode ? { pincode } : {}) } }),
  getWorker: (id) => api.get(`/workers/${id}`),
  getRateInsights: (category) => api.get('/workers/rates/insights', { params: { category } }),
};

export const bookingsAPI = {
  createBooking: (formData) => {
    return api.post('/bookings', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getBookings: () => api.get('/bookings'),
  getBooking: (id) => api.get(`/bookings/${id}`),
  updateStatus: (id, status, cancellationReason = '') =>
    api.put(`/bookings/${id}/status`, { status, cancellationReason }),
};

export const paymentsAPI = {
  createPayment: (data) => api.post('/payments', data),
  confirmPayment: (id) => api.post(`/payments/${id}/confirm`),
  getPaymentByBooking: (bookingId) => api.get(`/payments/booking/${bookingId}`),
  getPayments: () => api.get('/payments'),
};

export const feedbackAPI = {
  createFeedback: (data) => api.post('/feedback', data),
  getFeedbackByBooking: (bookingId) => api.get(`/feedback/booking/${bookingId}`),
  getWorkerFeedbacks: (workerId) => api.get(`/feedback/worker/${workerId}`),
};

export const locationAPI = {
  lookupPincode: (pincode) => api.get(`/location/pincode/${pincode}`),
  getLocationByPincode: (pincode) => api.get(`/location/pincode/${pincode}`),
};

export const adminAPI = {
  login: (data) => api.post('/admin-auth/login', data),
  me: () => api.get('/admin-auth/me'),
  getDashboard: () => api.get('/admin/dashboard'),
  getCustomers: (q = '') => api.get('/admin/customers', { params: q ? { q } : {} }),
  getWorkers: (params = {}) => api.get('/admin/workers', { params }),
  getBookings: (params = {}) => api.get('/admin/bookings', { params }),
  getPayments: () => api.get('/admin/payments'),
  getFeedback: () => api.get('/admin/feedback'),
  setCustomerBlocked: (id, isBlocked) => api.patch(`/admin/customers/${id}/block`, { isBlocked }),
  setWorkerBlocked: (id, isBlocked) => api.patch(`/admin/workers/${id}/block`, { isBlocked }),
  setWorkerVerified: (id, isVerified) => api.patch(`/admin/workers/${id}/verify`, { isVerified }),
  cancelBooking: (id, reason = '') => api.patch(`/admin/bookings/${id}/cancel`, { reason }),
  deleteFeedback: (id) => api.delete(`/admin/feedback/${id}`),
  getProfile: () => api.get('/admin/profile'),
  updateProfile: (data) => api.put('/admin/profile', data),
};

export default api;