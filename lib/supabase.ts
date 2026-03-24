import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Create a real client only when configured; otherwise a dummy that won't be called
export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as unknown as ReturnType<typeof createClient>;

export interface UserReview {
  id?: string;
  kite_slug: string;
  author_name: string;
  rating: number;       // 1-5
  experience_level: string;
  riding_style: string;
  review_text: string;
  created_at?: string;
}

/*
  Supabase SQL to create the reviews table:

  CREATE TABLE reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kite_slug TEXT NOT NULL,
    author_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    experience_level TEXT NOT NULL,
    riding_style TEXT NOT NULL,
    review_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Enable Row Level Security
  ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

  -- Allow anyone to read reviews
  CREATE POLICY "Reviews are viewable by everyone"
    ON reviews FOR SELECT
    USING (true);

  -- Allow anyone to insert reviews (no auth required)
  CREATE POLICY "Anyone can submit a review"
    ON reviews FOR INSERT
    WITH CHECK (true);

  -- Create index for fast lookup by kite
  CREATE INDEX idx_reviews_kite_slug ON reviews(kite_slug);
*/
