-- Daily Progress Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/hhtlpemplccavvimgzxr/sql

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  weight_unit TEXT DEFAULT 'lb' CHECK (weight_unit IN ('lb', 'kg')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DAILY METRICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  weight DECIMAL(5,2),
  steps INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ============================================
-- WORKOUTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EXERCISES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WORKOUT SETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE NOT NULL,
  note TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date ON daily_metrics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON workouts(user_id, date);
CREATE INDEX IF NOT EXISTS idx_exercises_workout ON exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise ON workout_sets(exercise_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only access their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Daily Metrics: users can only access their own metrics
CREATE POLICY "Users can view own metrics"
  ON daily_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metrics"
  ON daily_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own metrics"
  ON daily_metrics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own metrics"
  ON daily_metrics FOR DELETE
  USING (auth.uid() = user_id);

-- Workouts: users can only access their own workouts
CREATE POLICY "Users can view own workouts"
  ON workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts"
  ON workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts"
  ON workouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts"
  ON workouts FOR DELETE
  USING (auth.uid() = user_id);

-- Exercises: users can access exercises for their own workouts
CREATE POLICY "Users can view own exercises"
  ON exercises FOR SELECT
  USING (workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own exercises"
  ON exercises FOR INSERT
  WITH CHECK (workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own exercises"
  ON exercises FOR UPDATE
  USING (workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own exercises"
  ON exercises FOR DELETE
  USING (workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid()));

-- Workout Sets: users can access sets for their own exercises
CREATE POLICY "Users can view own sets"
  ON workout_sets FOR SELECT
  USING (exercise_id IN (
    SELECT e.id FROM exercises e
    JOIN workouts w ON e.workout_id = w.id
    WHERE w.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own sets"
  ON workout_sets FOR INSERT
  WITH CHECK (exercise_id IN (
    SELECT e.id FROM exercises e
    JOIN workouts w ON e.workout_id = w.id
    WHERE w.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own sets"
  ON workout_sets FOR UPDATE
  USING (exercise_id IN (
    SELECT e.id FROM exercises e
    JOIN workouts w ON e.workout_id = w.id
    WHERE w.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own sets"
  ON workout_sets FOR DELETE
  USING (exercise_id IN (
    SELECT e.id FROM exercises e
    JOIN workouts w ON e.workout_id = w.id
    WHERE w.user_id = auth.uid()
  ));

-- ============================================
-- FUNCTION: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FUNCTION: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_daily_metrics_updated_at
  BEFORE UPDATE ON daily_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_workouts_updated_at
  BEFORE UPDATE ON workouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
