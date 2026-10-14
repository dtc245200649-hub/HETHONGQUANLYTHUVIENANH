import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const checkAuth = async () => {
    const token = api.getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        api.logout();
        setUser(null);
      }
    } catch (err) {
      console.warn('Session expired or invalid:', err.message);
      api.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const res = await api.login(username, password);
      if (res.success && res.user) {
        setUser(res.user);
        addToast(`Chào mừng trở lại, ${res.user.full_name || res.user.username}!`, 'success');
        return { success: true };
      }
      return { success: false, message: res.message || 'Đăng nhập thất bại' };
    } catch (err) {
      addToast(err.message || 'Lỗi đăng nhập', 'error');
      return { success: false, message: err.message };
    }
  };

  const register = async (username, email, password, full_name) => {
    try {
      const res = await api.register(username, email, password, full_name);
      if (res.success && res.user) {
        setUser(res.user);
        addToast('Đăng ký tài khoản thành công!', 'success');
        return { success: true };
      }
      return { success: false, message: res.message || 'Đăng ký thất bại' };
    } catch (err) {
      addToast(err.message || 'Lỗi đăng ký', 'error');
      return { success: false, message: err.message };
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
    addToast('Đã đăng xuất khỏi tài khoản', 'info');
  };

  const updateUser = (updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
  };

  const isAdmin = user && user.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
