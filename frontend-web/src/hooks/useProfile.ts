/**
 * Custom hook for user profile operations
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../api/user';
import type { OnboardingData } from '../types/index';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const useProfile = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Get user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: userApi.getProfile,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get goals
  const { data: goals } = useQuery({
    queryKey: ['userGoals'],
    queryFn: userApi.getGoals,
    enabled: !!profile,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Complete onboarding mutation
  const onboardingMutation = useMutation({
    mutationFn: userApi.completeOnboarding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userGoals'] });
      toast.success('Profile setup complete!');
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to complete onboarding');
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userGoals'] });
      toast.success('Profile updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    },
  });

  return {
    profile,
    goals,
    isLoading,
    completeOnboarding: (data: OnboardingData) => onboardingMutation.mutate(data),
    updateProfile: (data: Partial<OnboardingData>) => updateProfileMutation.mutate(data),
    isOnboarding: onboardingMutation.isPending,
    isUpdating: updateProfileMutation.isPending,
  };
};
