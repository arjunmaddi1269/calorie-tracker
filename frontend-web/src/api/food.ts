/**
 * Food logging API service
 */
import apiClient from './client';
import type {
  FoodLog,
  FoodLogCreate,
  FoodLogUpdate,
  DailySummary,
  AIFoodAnalysis,
  PaginatedResponse,
} from '../types/index';

export const foodApi = {
  /**
   * Analyze food photo using AI
   */
  analyzePhoto: async (file: File): Promise<AIFoodAnalysis> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<AIFoodAnalysis>(
      '/food/analyze-photo',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Create a new food log entry
   */
  createFoodLog: async (data: FoodLogCreate): Promise<FoodLog> => {
    const response = await apiClient.post<FoodLog>('/food/log', data);
    return response.data;
  },

  /**
   * Analyze and log food with photo in one step
   */
  logWithPhoto: async (file: File, mealType: string): Promise<FoodLog> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('meal_type', mealType);

    const response = await apiClient.post<FoodLog>(
      '/food/log-with-photo',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Get food logs with pagination
   */
  getFoodLogs: async (params?: {
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<FoodLog>> => {
    const response = await apiClient.get<PaginatedResponse<FoodLog>>(
      '/food/logs',
      { params }
    );
    return response.data;
  },

  /**
   * Get a specific food log by ID
   */
  getFoodLog: async (id: string): Promise<FoodLog> => {
    const response = await apiClient.get<FoodLog>(`/food/logs/${id}`);
    return response.data;
  },

  /**
   * Update a food log entry
   */
  updateFoodLog: async (id: string, data: FoodLogUpdate): Promise<FoodLog> => {
    const response = await apiClient.put<FoodLog>(`/food/logs/${id}`, data);
    return response.data;
  },

  /**
   * Delete a food log entry
   */
  deleteFoodLog: async (id: string): Promise<void> => {
    await apiClient.delete(`/food/logs/${id}`);
  },

  /**
   * Get daily nutrition summary
   */
  getDailySummary: async (date?: string): Promise<DailySummary> => {
    const response = await apiClient.get<DailySummary>('/food/daily-summary', {
      params: { date_param: date },
    });
    return response.data;
  },

  /**
   * Get recently logged foods
   */
  getRecentFoods: async (limit: number = 10): Promise<FoodLog[]> => {
    const response = await apiClient.get<FoodLog[]>('/food/recent', {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Get frequently logged foods
   */
  getFrequentFoods: async (limit: number = 10): Promise<any[]> => {
    const response = await apiClient.get('/food/frequent', {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Search food database
   */
  searchFoods: async (query: string, limit: number = 10): Promise<any[]> => {
    const response = await apiClient.get('/food/search', {
      params: { query, limit },
    });
    return response.data;
  },

  /**
   * Scan barcode
   */
  scanBarcode: async (barcode: string): Promise<any> => {
    const response = await apiClient.post('/food/scan-barcode', { barcode });
    return response.data;
  },
};
