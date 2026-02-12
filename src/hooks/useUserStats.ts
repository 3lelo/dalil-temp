import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface UserStats {
  algorithmsCompleted: number;
  problemsSolved: number;
  totalPoints: number;
  currentLevel: number;
  progressToNextLevel: number;
  dailyPoints: number;
  weeklyPoints: number;
}

const POINTS_PER_ALGORITHM = 10;
const POINTS_PER_PROBLEM = 2;
const POINTS_PER_LEVEL = 100;

export function useUserStats(userId?: string) {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const targetUserId = userId || user?.id;

  useEffect(() => {
    const fetchStats = async () => {
      if (!targetUserId) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch algorithm completions count
        const { count: algoCount } = await supabase
          .from('algorithm_completions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', targetUserId);

        // Fetch problem completions count
        const { count: problemCount } = await supabase
          .from('algorithm_problem_completions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', targetUserId);

        // Fetch leaderboard data for daily/weekly points
        const { data: dailyData } = await supabase
          .from('leaderboard_daily')
          .select('points')
          .eq('user_id', targetUserId)
          .maybeSingle();

        const { data: weeklyData } = await supabase
          .from('leaderboard_weekly')
          .select('points')
          .eq('user_id', targetUserId)
          .maybeSingle();

        const algorithmsCompleted = algoCount || 0;
        const problemsSolved = problemCount || 0;
        const totalPoints = (algorithmsCompleted * POINTS_PER_ALGORITHM) + (problemsSolved * POINTS_PER_PROBLEM);
        const currentLevel = Math.floor(totalPoints / POINTS_PER_LEVEL) + 1;
        const progressToNextLevel = totalPoints % POINTS_PER_LEVEL;

        setStats({
          algorithmsCompleted,
          problemsSolved,
          totalPoints,
          currentLevel,
          progressToNextLevel,
          dailyPoints: dailyData?.points || 0,
          weeklyPoints: weeklyData?.points || 0,
        });
      } catch (error) {
        console.error('Error fetching user stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [targetUserId]);

  return { stats, isLoading };
}

export function usePublicUserStats(userId: string) {
  const [stats, setStats] = useState<{ algorithmsCompleted: number; problemsSolved: number; level: number; points: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch algorithm completions count
        const { count: algoCount } = await supabase
          .from('algorithm_completions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        // Fetch problem completions count
        const { count: problemCount } = await supabase
          .from('algorithm_problem_completions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        const algorithmsCompleted = algoCount || 0;
        const problemsSolved = problemCount || 0;
        const points = (algorithmsCompleted * POINTS_PER_ALGORITHM) + (problemsSolved * POINTS_PER_PROBLEM);
        const level = Math.floor(points / POINTS_PER_LEVEL) + 1;

        setStats({
          algorithmsCompleted,
          problemsSolved,
          level,
          points,
        });
      } catch (error) {
        console.error('Error fetching public user stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  return { stats, isLoading };
}
