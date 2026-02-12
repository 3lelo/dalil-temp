import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

export type Profile = {
  id: string;
  email?: string;
  username: string | null;
  avatar_url: string | null;
  onboarding_stage: 'profile' | 'iq' | 'ready';
  iq_score: number | null;
  iq_level: string | null;
  personal_roadmap: unknown | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

export type PublicProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
  iq_level: string | null;
  created_at: string;
};

export type IQQuestion = {
  id: number;
  order_index: number;
  question_ar: string;
  choices_ar: string[];
  correct_index: number;
  weight: number;
  is_active: boolean;
};

export type LeaderboardEntry = {
  user_id: string;
  username: string;
  avatar_url: string | null;
  iq_level: string | null;
  completions_count: number;
  points: number;
};

// Educational leaderboard types
export type WeeklyStreakEntry = {
  user_id: string;
  username: string;
  avatar_url: string | null;
  best_streak: number;
};

export type WeeklyImprovementEntry = {
  user_id: string;
  username: string;
  avatar_url: string | null;
  improvement: number;
  points_this_week: number;
};

export type WeeklyChallengesEntry = {
  user_id: string;
  username: string;
  avatar_url: string | null;
  challenges_completed: number;
};

export type WeeklyChallenge = {
  id: number;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
};

export type WeeklyChallengeProblem = {
  challenge_id: number;
  problem_url: string;
  title: string;
  topic: string;
  sort_order: number;
};

export type WeeklyChallengeCompletion = {
  id: number;
  user_id: string;
  challenge_id: number;
  completed_at: string;
};