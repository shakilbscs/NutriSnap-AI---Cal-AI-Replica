/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
}

export interface UserProfile {
  user_id: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height_cm: number;
  weight_kg: number;
  goal: 'lose' | 'maintain' | 'gain';
  activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fat: number;
  theme_color?: string;
}

export interface FoodLog {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  created_at: string;
}

export interface WeightLog {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  weight_kg: number;
}

export interface WaterLog {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  glasses_count: number;
}

export interface ProgressPhoto {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  photo_url: string;
  label?: string;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}
