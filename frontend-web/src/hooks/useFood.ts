/**
 * Custom hook for food logging operations
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { foodApi } from '../api/food';
import type { FoodLogCreate, FoodLogUpdate } from '../types/index';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export const useFood = () => {
  const queryClient = useQueryClient();

  // Get daily summary
  const useDailySummary = (date?: string) => {
    return useQuery({
      queryKey: ['dailySummary', date],
      queryFn: () => foodApi.getDailySummary(date),
      staleTime: 1 * 60 * 1000, // 1 minute
    });
  };

  // Get food logs
  const useFoodLogs = (params?: {
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
  }) => {
    return useQuery({
      queryKey: ['foodLogs', params],
      queryFn: () => foodApi.getFoodLogs(params),
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };

  // Get recent foods
  const useRecentFoods = (limit: number = 10) => {
    return useQuery({
      queryKey: ['recentFoods', limit],
      queryFn: () => foodApi.getRecentFoods(limit),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Get frequent foods
  const useFrequentFoods = (limit: number = 10) => {
    return useQuery({
      queryKey: ['frequentFoods', limit],
      queryFn: () => foodApi.getFrequentFoods(limit),
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  };

  // Analyze photo mutation
  const analyzePhotoMutation = useMutation({
    mutationFn: foodApi.analyzePhoto,
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to analyze photo');
    },
  });

  // Create food log mutation
  const createFoodLogMutation = useMutation({
    mutationFn: foodApi.createFoodLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailySummary'] });
      queryClient.invalidateQueries({ queryKey: ['foodLogs'] });
      queryClient.invalidateQueries({ queryKey: ['recentFoods'] });
      toast.success('Food logged successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to log food');
    },
  });

  // Log with photo mutation
  const logWithPhotoMutation = useMutation({
    mutationFn: ({ file, mealType }: { file: File; mealType: string }) =>
      foodApi.logWithPhoto(file, mealType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailySummary'] });
      queryClient.invalidateQueries({ queryKey: ['foodLogs'] });
      queryClient.invalidateQueries({ queryKey: ['recentFoods'] });
      toast.success('Food logged successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to log food with photo');
    },
  });

  // Update food log mutation
  const updateFoodLogMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FoodLogUpdate }) =>
      foodApi.updateFoodLog(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailySummary'] });
      queryClient.invalidateQueries({ queryKey: ['foodLogs'] });
      toast.success('Food log updated!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update food log');
    },
  });

  // Delete food log mutation
  const deleteFoodLogMutation = useMutation({
    mutationFn: foodApi.deleteFoodLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailySummary'] });
      queryClient.invalidateQueries({ queryKey: ['foodLogs'] });
      toast.success('Food log deleted!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete food log');
    },
  });

  return {
    useDailySummary,
    useFoodLogs,
    useRecentFoods,
    useFrequentFoods,
    analyzePhoto: (file: File) => analyzePhotoMutation.mutateAsync(file),
    createFoodLog: (data: FoodLogCreate) => createFoodLogMutation.mutate(data),
    logWithPhoto: (file: File, mealType: string) =>
      logWithPhotoMutation.mutate({ file, mealType }),
    updateFoodLog: (id: string, data: FoodLogUpdate) =>
      updateFoodLogMutation.mutate({ id, data }),
    deleteFoodLog: (id: string) => deleteFoodLogMutation.mutate(id),
    isAnalyzing: analyzePhotoMutation.isPending,
    isLogging: createFoodLogMutation.isPending || logWithPhotoMutation.isPending,
  };
};
