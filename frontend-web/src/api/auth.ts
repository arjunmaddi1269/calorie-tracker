/**
 * Authentication API service
 */
import apiClient from './client';
import type { LoginRequest, RegisterRequest, TokenResponse, User } from '../types/index';

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
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  /**
   * Get current user
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/users/me');
    return response.data;
  },

  /**
   * Authenticate with Google OAuth
   */
  googleAuth: async (idToken: string): Promise<TokenResponse & { is_new_user: boolean }> => {
    const response = await apiClient.post('/oauth/google', {
      id_token: idToken,
    });
    return response.data;
  },
};
