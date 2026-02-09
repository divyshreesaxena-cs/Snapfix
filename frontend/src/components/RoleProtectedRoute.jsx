import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

const RoleProtectedRoute = ({ children, allow = ['customer', 'worker'] }) => {
  const { isAuthenticated, loading, role } = useAuth();

  if (loading) return <Loading fullScreen />;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allow && !allow.includes(role)) {
    return <Navigate to={role === 'worker' ? '/worker/dashboard' : '/home'} replace />;
  }

  return children;
};

export default RoleProtectedRoute;
