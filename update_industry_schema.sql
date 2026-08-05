-- Supabase Schema Update for 'industry' table
-- Adds the daily and monthly reuse target columns with a default value of 0.

ALTER TABLE industry
ADD COLUMN IF NOT EXISTS daily_reuse_target numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_reuse_target numeric DEFAULT 0;
