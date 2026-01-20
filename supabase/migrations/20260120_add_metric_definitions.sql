-- Migration: Add customizable metric definitions
-- Run this in Supabase SQL editor

-- 1. Create metric_definitions table
CREATE TABLE metric_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- 2. Add RLS policies for metric_definitions
ALTER TABLE metric_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own metric definitions"
  ON metric_definitions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metric definitions"
  ON metric_definitions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own metric definitions"
  ON metric_definitions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own metric definitions"
  ON metric_definitions FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Add custom_metrics JSONB column to daily_metrics
ALTER TABLE daily_metrics
ADD COLUMN custom_metrics JSONB DEFAULT '{}';

-- 4. Create "Weight" metric_definition for all existing users who have profiles
INSERT INTO metric_definitions (user_id, name, order_index, is_active)
SELECT id, 'Weight', 0, true
FROM profiles
ON CONFLICT (user_id, name) DO NOTHING;

-- 5. Create trigger to auto-create Weight metric for new users
CREATE OR REPLACE FUNCTION create_default_metric_definitions()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO metric_definitions (user_id, name, order_index, is_active)
  VALUES (NEW.id, 'Weight', 0, true)
  ON CONFLICT (user_id, name) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't block user creation if this fails
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_add_metrics
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_default_metric_definitions();

-- 6. Create index for faster queries
CREATE INDEX idx_metric_definitions_user_id ON metric_definitions(user_id);
CREATE INDEX idx_daily_metrics_custom_metrics ON daily_metrics USING GIN (custom_metrics);
