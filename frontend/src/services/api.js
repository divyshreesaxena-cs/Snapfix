import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
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

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  sendOTP: (phone, endpoint = 'auth') => api.post(`/${endpoint}/send-otp`, { phone }),
  verifyOTP: (phone, otp, endpoint = 'auth') => api.post(`/${endpoint}/verify-otp`, { phone, otp }),
};

// Profile APIs
export const profileAPI = {
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.post('/profile', data),
};


// Worker Profile APIs (Worker Portal)
export const workerProfileAPI = {
  getProfile: () => api.get('/worker/profile'),
  updateProfile: (data) => api.post('/worker/profile', data),

  // ✅ Add this so WorkerProfileSetup.jsx works
  completeProfile: (data) => api.post('/worker/profile', data),
};


// Worker Bookings APIs (Worker Portal)
export const workerBookingsAPI = {
  getBookings: (params) => api.get('/worker/bookings', { params }),
  respond: (id, workerStatus) => api.put(`/worker/bookings/${id}/respond`, { workerStatus }),
  start: (id) => api.put(`/worker/bookings/${id}/start`),
  initiateCompletion: (id) => api.put(`/worker/bookings/${id}/initiate-completion`),
};

// Services APIs
export const servicesAPI = {
  getServices: () => api.get('/services'),
  getProblems: (category) => api.get(`/services/${category}/problems`),
};

// Workers APIs
export const workersAPI = {
  getWorkers: (category, pincode) =>
    api.get('/workers', { params: { category, ...(pincode ? { pincode } : {}) } }),
  getWorker: (id) => api.get(`/workers/${id}`),
  getRateInsights: (category) => api.get('/workers/rates/insights', { params: { category } }),
};

// Bookings APIs
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
  updateStatus: (id, status) => api.put(`/bookings/${id}/status`, { status }),
};

// Payments APIs
export const paymentsAPI = {
  createPayment: (data) => api.post('/payments', data),
  getPaymentByBooking: (bookingId) => api.get(`/payments/booking/${bookingId}`),
  getPayments: () => api.get('/payments'),
};

// Feedback APIs
export const feedbackAPI = {
  createFeedback: (data) => api.post('/feedback', data),
  getFeedbackByBooking: (bookingId) => api.get(`/feedback/booking/${bookingId}`),
  getWorkerFeedbacks: (workerId) => api.get(`/feedback/worker/${workerId}`),
};

// ✅ Location APIs (Pincode -> city/state)
export const locationAPI = {
  // preferred name
  lookupPincode: (pincode) => api.get(`/location/pincode/${pincode}`),

  // keep your old method name too so existing code doesn't break
  getLocationByPincode: (pincode) => api.get(`/location/pincode/${pincode}`),
};

export default api;
