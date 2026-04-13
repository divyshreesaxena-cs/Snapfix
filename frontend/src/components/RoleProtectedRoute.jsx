import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

const RoleProtectedRoute = ({ children, allow = ['customer', 'worker'] }) => {
  const { isAuthenticated, loading, role } = useAuth();
  const location = useLocation();

  if (loading) return <Loading fullScreen />;

  const isAdminRoute = allow.includes('admin');

  if (!isAuthenticated) {
    return (
      <Navigate
        to={isAdminRoute ? '/admin/login' : '/login'}
        replace
        state={{ from: location }}
      />
    );
  }

  if (!role) {
    return <Loading fullScreen />;
  }

  if (allow && !allow.includes(role)) {
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'worker') return <Navigate to="/worker/dashboard" replace />;
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default RoleProtectedRoute;