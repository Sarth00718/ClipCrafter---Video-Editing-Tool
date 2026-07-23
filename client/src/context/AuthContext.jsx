import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/index.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cc_user') || 'null'); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  // Rehydrate on mount
  useEffect(() => {
    const token = localStorage.getItem('cc_token');
    if (!token) {
      // Use setTimeout to avoid synchronous setState-in-effect lint warning
      setTimeout(() => setLoading(false), 0);
      return;
    }
    authService.getMe()
      .then((res) => {
        setUser(res.data.data);
        localStorage.setItem('cc_user', JSON.stringify(res.data.data));
      })
      .catch(() => {
        localStorage.removeItem('cc_token');
        localStorage.removeItem('cc_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback((token, userData, refreshToken) => {
    localStorage.setItem('cc_token', token);
    localStorage.setItem('cc_user', JSON.stringify(userData));
    if (refreshToken) {
      localStorage.setItem('cc_refresh_token', refreshToken);
    }
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('cc_token');
      localStorage.removeItem('cc_user');
      localStorage.removeItem('cc_refresh_token');
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((data) => {
    const updated = { ...user, ...data };
    localStorage.setItem('cc_user', JSON.stringify(updated));
    setUser(updated);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
