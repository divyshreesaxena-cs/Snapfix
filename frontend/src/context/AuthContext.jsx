import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
const [user, setUser] = useState(null);
const [token, setToken] = useState(null);
const [role, setRole] = useState(null);
const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user and token from localStorage on mount
const storedToken = localStorage.getItem('token');
const storedUser = localStorage.getItem('user');
const storedRole = localStorage.getItem('userRole');

    if (storedToken && storedUser) {
  setToken(storedToken);
  setUser(JSON.parse(storedUser));
  setRole(storedRole || 'customer');
}
    setLoading(false);
  }, []);

  const login = (userData, authToken, userRole = 'customer') => {
  setUser(userData);
  setToken(authToken);
  setRole(userRole);
  localStorage.setItem('token', authToken);
  localStorage.setItem('user', JSON.stringify(userData));
  localStorage.setItem('userRole', userRole);
};

  const logout = () => {
  setUser(null);
  setToken(null);
  setRole(null);
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userRole');
};

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
  user,
  token,
  role,
  loading,
  login,
  logout,
  updateUser,
  isAuthenticated: !!token,
  isWorker: role === 'worker',
  isCustomer: role === 'customer',
};

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
