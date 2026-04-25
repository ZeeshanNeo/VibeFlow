import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials, clearCredentials } from '../store/slices/authSlice';
import authService from '../services/authService';

export const useAuth = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.auth.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const userData = await authService.login(email, password);
      console.log(userData,"userData")
      dispatch(setCredentials(userData));
      return userData;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Login failed';
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  const register = useCallback(async (email: string, password: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      const userData = await authService.register(email, password, name);
      dispatch(setCredentials(userData));
      return userData;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Registration failed';
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  const logout = useCallback(() => {
    authService.logout();
    dispatch(clearCredentials());
  }, [dispatch]);

  const checkAuth = useCallback(async () => {
    try {
      const userData = await authService.getProfile();
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      dispatch(setCredentials({ user: userData, token }));
      return userData;
    } catch (err) {
      dispatch(clearCredentials());
      throw err;
    }
  }, [dispatch]);

  const updateProfile = useCallback(async (name: string, email: string) => {
    setLoading(true);
    setError(null);
    try {
      const userData = await authService.updateProfile(name, email);
      dispatch(setCredentials(userData));
      return userData;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Update failed';
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  return {
    user,
    login,
    register,
    logout,
    checkAuth,
    updateProfile,
    loading,
    error,
  };
};