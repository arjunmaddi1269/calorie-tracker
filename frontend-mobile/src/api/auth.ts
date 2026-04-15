/**
 * Authentication API service
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './client';
import { LoginRequest, RegisterRequest, TokenResponse, User } from '../types';
import { STORAGE_KEYS } from '../constants/config';

export const authApi = {
  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register', data);
    return response.data;
  },

  /**
   * Login with email and password
   */
  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/login', data);
    return response.data;
  },

  /**
   * Refresh access token
   */
  refreshToken: async (refreshToken: string): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  /**
   * Logout (client-side token deletion)
   */
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER,
    ]);
  },

  /**
   * Get current user
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/users/me');
    return response.data;
  },
};
