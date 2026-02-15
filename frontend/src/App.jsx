import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import Navbar from './components/Navbar';
import Welcome from './pages/Welcome';

// Pages
import Login from './pages/Login';
import ProfileSetup from './pages/ProfileSetup';
import Home from './pages/Home';
import ServiceRequest from './pages/ServiceRequest';
import WorkerSelection from './pages/WorkerSelection';
import ScheduleBooking from './pages/ScheduleBooking';
import BookingConfirmed from './pages/BookingConfirmed';
import MyBookings from './pages/MyBookings';
import BookingDetails from './pages/BookingDetails';
import Payment from './pages/Payment';
import Feedback from './pages/Feedback';

// Worker Pages
import WorkerDashboard from './pages/worker/WorkerDashboard';
import WorkerBookings from './pages/worker/WorkerBookings';
import WorkerProfileSetup from './pages/worker/WorkerProfileSetup';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Navbar />
          
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route path="/profile-setup" element={
              <RoleProtectedRoute allow={['customer']}>
                <ProfileSetup />
              </RoleProtectedRoute>
            } />
            
            <Route path="/home" element={
              <RoleProtectedRoute allow={['customer']}>
                <Home />
              </RoleProtectedRoute>
            } />
            
            <Route path="/service/:category" element={
              <RoleProtectedRoute allow={['customer']}>
                <ServiceRequest />
              </RoleProtectedRoute>
            } />
            
            <Route path="/workers/:category" element={
              <RoleProtectedRoute allow={['customer']}>
                <WorkerSelection />
              </RoleProtectedRoute>
            } />
            
            <Route path="/schedule/:workerId" element={
              <RoleProtectedRoute allow={['customer']}>
                <ScheduleBooking />
              </RoleProtectedRoute>
            } />
            
            <Route path="/booking-confirmed/:bookingId" element={
              <RoleProtectedRoute allow={['customer']}>
                <BookingConfirmed />
              </RoleProtectedRoute>
            } />
            
            <Route path="/bookings" element={
              <RoleProtectedRoute allow={['customer']}>
                <MyBookings />
              </RoleProtectedRoute>
            } />
            
            <Route path="/booking-details/:bookingId" element={
              <RoleProtectedRoute allow={['customer']}>
                <BookingDetails />
              </RoleProtectedRoute>
            } />

            <Route path="/payment/:bookingId" element={
              <RoleProtectedRoute allow={['customer']}>
                <Payment />
              </RoleProtectedRoute>
            } />
            
            <Route path="/feedback/:bookingId" element={
              <RoleProtectedRoute allow={['customer']}>
                <Feedback />
              </RoleProtectedRoute>
            } />
            

            {/* Worker Portal Routes */}
            <Route path="/worker/dashboard" element={
              <RoleProtectedRoute allow={['worker']}>
                <WorkerDashboard />
              </RoleProtectedRoute>
            } />

            <Route path="/worker/bookings" element={
              <RoleProtectedRoute allow={['worker']}>
                <WorkerBookings />
              </RoleProtectedRoute>
            } />

            <Route path="/worker/profile-setup" element={
              <RoleProtectedRoute allow={['worker']}>
                <WorkerProfileSetup />
              </RoleProtectedRoute>
            } />
            
            {/* 404 Route */}
            <Route path="*" element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-6xl font-display gradient-text mb-4">404</h1>
                  <p className="text-xl text-dark-600 mb-6">Page not found</p>
                  <a href="/home" className="btn-primary">Go Home</a>
                </div>
              </div>
            } />
          </Routes>
          
          {/* Toast Notifications */}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#fff',
                color: '#0f172a',
                padding: '16px',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                fontWeight: '500',
              },
              success: {
                iconTheme: {
                  primary: '#f97316',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
