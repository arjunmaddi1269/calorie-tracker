/**
 * User profile API service
 */
import apiClient from './client';
import { UserProfile, OnboardingData } from '../types';

export const userApi = {
  /**
   * Get user profile
   */
  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>('/users/profile');
    return response.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
    const response = await apiClient.put<UserProfile>('/users/profile', data);
    return response.data;
  },

  /**
   * Complete onboarding
   */
  completeOnboarding: async (data: OnboardingData): Promise<UserProfile> => {
    const response = await apiClient.post<UserProfile>('/users/onboarding', data);
    return response.data;
  },

  /**
   * Get calorie and macro goals
   */
  getGoals: async (): Promise<{
    daily_calorie_target: number;
    daily_protein_target: number;
    daily_carbs_target: number;
    daily_fat_target: number;
  }> => {
    const response = await apiClient.get('/users/goals');
    return response.data;
  },
};
