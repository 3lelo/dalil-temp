import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface SolvedProblem {
  id: string;
  problem_url: string;
  algorithm_id: string;
  completed_at: string;
  // Joined from algorithm_problems
  problem_title: string;
  problem_platform: string;
  problem_difficulty_ar: string;
  problem_difficulty_en: string;
  // Joined from algorithms
  algorithm_title_ar: string;
  algorithm_title_en: string;
}

export function useSolvedProblems(userId?: string) {
  const { user } = useAuth();
  const [problems, setProblems] = useState<SolvedProblem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const targetUserId = userId || user?.id;

  useEffect(() => {
    const fetchSolvedProblems = async () => {
      if (!targetUserId) {
        setIsLoading(false);
        return;
      }

      try {
        // First get user's completions
        const { data: completions, error: completionsError } = await supabase
          .from('algorithm_problem_completions')
          .select('id, problem_url, algorithm_id, completed_at')
          .eq('user_id', targetUserId)
          .order('completed_at', { ascending: false });

        if (completionsError) throw completionsError;

        if (!completions || completions.length === 0) {
          setProblems([]);
          setIsLoading(false);
          return;
        }

        // Get unique algorithm IDs
        const algorithmIds = [...new Set(completions.map(c => c.algorithm_id))];
        const problemUrls = completions.map(c => c.problem_url);

        // Fetch algorithms and problems in parallel
        const [algorithmsResult, problemsResult] = await Promise.all([
          supabase
            .from('algorithms')
            .select('id, title_ar, title_en')
            .in('id', algorithmIds),
          supabase
            .from('algorithm_problems')
            .select('url, title, platform, difficulty_ar, difficulty_en, algorithm_id')
            .in('url', problemUrls)
        ]);

        const algorithmsMap = new Map(
          (algorithmsResult.data || []).map(a => [a.id, a])
        );
        const problemsMap = new Map(
          (problemsResult.data || []).map(p => [p.url, p])
        );

        // Combine the data
        const solvedProblems: SolvedProblem[] = completions.map(c => {
          const algo = algorithmsMap.get(c.algorithm_id);
          const prob = problemsMap.get(c.problem_url);
          
          return {
            id: c.id,
            problem_url: c.problem_url,
            algorithm_id: c.algorithm_id,
            completed_at: c.completed_at,
            problem_title: prob?.title || c.problem_url,
            problem_platform: prob?.platform || 'Unknown',
            problem_difficulty_ar: prob?.difficulty_ar || 'غير محدد',
            problem_difficulty_en: prob?.difficulty_en || 'Unknown',
            algorithm_title_ar: algo?.title_ar || c.algorithm_id,
            algorithm_title_en: algo?.title_en || c.algorithm_id,
          };
        });

        setProblems(solvedProblems);
      } catch (err) {
        console.error('Error fetching solved problems:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSolvedProblems();
  }, [targetUserId]);

  // Extract unique platforms and algorithms for filtering
  const platforms = useMemo(() => {
    return [...new Set(problems.map(p => p.problem_platform))].sort();
  }, [problems]);

  const algorithms = useMemo(() => {
    const algos = new Map<string, { ar: string; en: string }>();
    problems.forEach(p => {
      if (!algos.has(p.algorithm_id)) {
        algos.set(p.algorithm_id, {
          ar: p.algorithm_title_ar,
          en: p.algorithm_title_en,
        });
      }
    });
    return Array.from(algos.entries()).map(([id, titles]) => ({
      id,
      title_ar: titles.ar,
      title_en: titles.en,
    }));
  }, [problems]);

  return { problems, platforms, algorithms, isLoading, error };
}
