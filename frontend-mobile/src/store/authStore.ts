/**
 * Auth state management using Zustand (React Native)
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { STORAGE_KEYS } from '../constants/config';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  setLoading: (loading) =>
    set({
      isLoading: loading,
    }),

  logout: async () => {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER,
    ]);
    set({
      user: null,
      isAuthenticated: false,
    });
  },

  checkAuth: async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);

      if (token && userJson) {
        const user = JSON.parse(userJson);
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return false;
      }
    } catch (error) {
      console.error('Auth check error:', error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return false;
    }
  },
}));
