export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          weight_unit: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          weight_unit?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          weight_unit?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      daily_metrics: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          weight: number | null;
          steps: number | null;
          custom_metrics: Record<string, number | null>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          weight?: number | null;
          steps?: number | null;
          custom_metrics?: Record<string, number | null>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          weight?: number | null;
          steps?: number | null;
          custom_metrics?: Record<string, number | null>;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      metric_definitions: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          order_index: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          order_index?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          order_index?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      exercises: {
        Row: {
          id: string;
          workout_id: string;
          name: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          workout_id: string;
          name: string;
          order_index: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          workout_id?: string;
          name?: string;
          order_index?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      workout_sets: {
        Row: {
          id: string;
          exercise_id: string;
          note: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          exercise_id: string;
          note: string;
          order_index: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          exercise_id?: string;
          note?: string;
          order_index?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type DailyMetric = Database['public']['Tables']['daily_metrics']['Row'];
export type DbWorkout = Database['public']['Tables']['workouts']['Row'];
export type DbExercise = Database['public']['Tables']['exercises']['Row'];
export type DbWorkoutSet = Database['public']['Tables']['workout_sets']['Row'];
export type DbMetricDefinition = Database['public']['Tables']['metric_definitions']['Row'];
