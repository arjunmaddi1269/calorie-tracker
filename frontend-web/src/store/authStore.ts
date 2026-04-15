/**
 * Auth state management using Zustand
 */
import { create } from 'zustand';
import type { User } from '../types/index';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setLoading: (loading) =>
    set({
      isLoading: loading,
    }),

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({
      user: null,
      isAuthenticated: false,
    });
  },
}));
