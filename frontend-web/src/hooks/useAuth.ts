/**
 * Custom hook for authentication
 */
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import type { LoginRequest, RegisterRequest } from '../types/index';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setUser, logout: logoutStore } = useAuthStore();

  // Get current user query
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getCurrentUser,
    enabled: !!localStorage.getItem('access_token'),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Set user in store when loaded
  useEffect(() => {
    if (user) {
      setUser(user);
    }
  }, [user, setUser]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Logged in successfully!');
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Login failed');
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      toast.success('Registration successful! Please log in.');
      navigate('/login');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Registration failed');
    },
  });

  // Logout function
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logoutStore();
      queryClient.clear();
      navigate('/login');
      toast.success('Logged out successfully');
    }
  };

  return {
    user,
    isLoading,
    login: (data: LoginRequest) => loginMutation.mutate(data),
    register: (data: RegisterRequest) => registerMutation.mutate(data),
    logout,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
  };
};
