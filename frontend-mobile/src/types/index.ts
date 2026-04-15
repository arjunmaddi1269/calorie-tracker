/**
 * TypeScript types for API data models
 */

// User types
export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  email_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  date_of_birth: string | null;
  sex: 'male' | 'female' | 'other' | null;
  height_cm: number | null;
  current_weight_kg: number | null;
  target_weight_kg: number | null;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null;
  goal_type: 'lose_weight' | 'maintain' | 'gain_muscle' | null;
  daily_calorie_target: number | null;
  daily_protein_target: number | null;
  daily_carbs_target: number | null;
  daily_fat_target: number | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Food log types
export interface FoodLog {
  id: string;
  user_id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | null;
  food_name: string;
  serving_size: number | null;
  serving_unit: string | null;
  calories: number;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  photo_url: string | null;
  photo_s3_key: string | null;
  ai_confidence: number | null;
  ai_detected_foods: Array<{ name: string; portion: string; calories: number }> | null;
  logged_at: string;
  date: string;
  created_at: string;
  updated_at: string;
  is_manual_entry: boolean;
}

export interface FoodLogCreate {
  meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_name: string;
  serving_size?: number;
  serving_unit?: string;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  date?: string;
  photo_s3_key?: string;
  ai_confidence?: number;
  ai_detected_foods?: Array<{ name: string; portion: string; calories: number }>;
  is_manual_entry?: boolean;
}

export interface FoodLogUpdate {
  meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_name?: string;
  serving_size?: number;
  serving_unit?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
}

export interface DailySummary {
  date: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  total_fiber_g: number;
  meal_count: number;
  calorie_target: number | null;
  protein_target: number | null;
  carbs_target: number | null;
  fat_target: number | null;
  calories_remaining: number | null;
}

export interface AIFoodAnalysis {
  food_name: string;
  confidence: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  serving_size: number;
  serving_unit: string;
  detected_items: Array<{ name: string; portion: string; calories: number }>;
}

// Onboarding types
export interface OnboardingData {
  date_of_birth: string;
  sex: 'male' | 'female' | 'other';
  height_cm: number;
  current_weight_kg: number;
  target_weight_kg: number;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal_type: 'lose_weight' | 'maintain' | 'gain_muscle';
}

// Paginated list types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

// Weight log types
export interface WeightLog {
  id: string;
  user_id: string;
  weight_kg: number;
  date: string;
  notes: string | null;
  created_at: string;
}

export interface WeightLogCreate {
  weight_kg: number;
  date: string;
  notes?: string;
}
