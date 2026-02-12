import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

// Types for algorithm data from Supabase
export interface Algorithm {
  id: string;
  title_ar: string;
  title_en: string;
  category_ar: string;
  category_en: string;
  difficulty_ar: string;
  difficulty_en: string;
  description_ar: string;
  description_en: string;
  what_ar: string;
  what_en: string;
  why_ar: string;
  why_en: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlgorithmPrerequisite {
  id: string;
  algorithm_id: string;
  text_ar: string;
  text_en: string;
  sort_order: number;
}

export interface AlgorithmRelated {
  algorithm_id: string;
  related_algorithm_id: string;
  sort_order: number;
  // Joined data
  related_title_ar?: string;
  related_title_en?: string;
}

export interface AlgorithmResource {
  id: string;
  algorithm_id: string;
  title_ar: string;
  title_en: string;
  url: string;
  type: 'video' | 'article' | 'course' | 'other';
  language: 'ar' | 'en';
  difficulty_ar: string;
  difficulty_en: string;
  sort_order: number;
}

export interface AlgorithmProblem {
  id: string;
  algorithm_id: string;
  title: string;
  platform: string;
  difficulty_ar: string;
  difficulty_en: string;
  url: string;
  sort_order: number;
}

export interface FullAlgorithm extends Algorithm {
  prerequisites: AlgorithmPrerequisite[];
  related: (AlgorithmRelated & { title_ar: string; title_en: string })[];
  resources: AlgorithmResource[];
  problems: AlgorithmProblem[];
}

// Hook to fetch all algorithms (for roadmap, lists) - ordered by roadmap_order.sort_order
export function useAlgorithms() {
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAlgorithms = async () => {
      try {
        // Fetch algorithms and roadmap_order in parallel
        const [algoResult, orderResult] = await Promise.all([
          supabase
            .from('algorithms')
            .select('*')
            .eq('is_active', true),
          supabase
            .from('roadmap_order')
            .select('algorithm_id, sort_order')
        ]);

        if (algoResult.error) throw algoResult.error;

        const algos = algoResult.data || [];
        const orderMap = new Map(
          (orderResult.data || []).map(r => [r.algorithm_id, r.sort_order])
        );

        // Sort algorithms by roadmap_order.sort_order, then by created_at for any without order
        const sortedAlgos = algos.sort((a, b) => {
          const orderA = orderMap.get(a.id) ?? 999999;
          const orderB = orderMap.get(b.id) ?? 999999;
          if (orderA !== orderB) return orderA - orderB;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

        setAlgorithms(sortedAlgos);
      } catch (err) {
        console.error('Error fetching algorithms:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlgorithms();
  }, []);

  return { algorithms, isLoading, error };
}

// Hook to fetch a single algorithm with all related data
export function useAlgorithm(algorithmId: string | undefined) {
  const [algorithm, setAlgorithm] = useState<FullAlgorithm | null>(null);
  const [allAlgorithms, setAllAlgorithms] = useState<Algorithm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!algorithmId) {
      setIsLoading(false);
      return;
    }

    const fetchAlgorithm = async () => {
      setIsLoading(true);
      try {
        // Fetch algorithm, all algorithms (for related), prerequisites, resources, problems in parallel
        const [
          algoResult,
          allAlgosResult,
          prereqResult,
          relatedResult,
          resourcesResult,
          problemsResult
        ] = await Promise.all([
          supabase
            .from('algorithms')
            .select('*')
            .eq('id', algorithmId)
            .eq('is_active', true)
            .maybeSingle(),
          supabase
            .from('algorithms')
            .select('*')
            .eq('is_active', true),
          supabase
            .from('algorithm_prerequisites')
            .select('*')
            .eq('algorithm_id', algorithmId)
            .order('sort_order'),
          supabase
            .from('algorithm_related')
            .select('*')
            .eq('algorithm_id', algorithmId)
            .order('sort_order'),
          supabase
            .from('algorithm_resources')
            .select('*')
            .eq('algorithm_id', algorithmId)
            .order('sort_order'),
          supabase
            .from('algorithm_problems')
            .select('*')
            .eq('algorithm_id', algorithmId)
            .order('sort_order')
        ]);

        const algoData = algoResult.data as Algorithm | null;
        const algoError = algoResult.error;
        const allAlgosData = (allAlgosResult.data || []) as Algorithm[];
        const prereqData = prereqResult.data || [];
        const relatedData = relatedResult.data || [];
        const resourcesData = resourcesResult.data || [];
        const problemsData = problemsResult.data || [];

        if (algoError) throw algoError;

        setAllAlgorithms(allAlgosData || []);

        if (!algoData) {
          setAlgorithm(null);
          return;
        }

        // Map related algorithm IDs to their titles
        const relatedWithTitles = (relatedData || []).map(rel => {
          const relatedAlgo = (allAlgosData || []).find(a => a.id === rel.related_algorithm_id);
          return {
            ...rel,
            title_ar: relatedAlgo?.title_ar || rel.related_algorithm_id,
            title_en: relatedAlgo?.title_en || rel.related_algorithm_id
          };
        });

        setAlgorithm({
          ...algoData,
          prerequisites: prereqData || [],
          related: relatedWithTitles,
          resources: resourcesData || [],
          problems: problemsData || []
        });
      } catch (err) {
        console.error('Error fetching algorithm:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlgorithm();
  }, [algorithmId]);

  return { algorithm, allAlgorithms, isLoading, error };
}

// Utility function for difficulty color mapping (consistent across the app)
export function getDifficultyColor(difficulty: string): string {
  const d = (difficulty || '').toLowerCase();

  // 1. Check for combined strings first (most specific)
  // Medium-Hard / Intermediate-Advanced -> Orange
  if (d.includes('متوسط-متقدم') || d.includes('intermediate-advanced')) {
    return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
  }

  // Easy-Medium / Beginner-Intermediate -> Cyan (distinct from Green/Yellow)
  if (d.includes('مبتدئ-متوسط') || d.includes('beginner-intermediate')) {
    return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
  }

  // 2. Then check for single keywords
  // Hard / Advanced -> Red
  if (d.includes('متقدم') || d.includes('صعب') || d.includes('advanced') || d.includes('hard')) {
    return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
  }

  // Medium / Intermediate -> Yellow
  if (d.includes('متوسط') || d.includes('medium') || d.includes('intermediate')) {
    return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
  }

  // Easy / Beginner -> Green
  if (d.includes('مبتدئ') || d.includes('سهل') || d.includes('beginner') || d.includes('easy')) {
    return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
  }

  return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
}

// Level calculation utility
export const POINTS_PER_ALGORITHM = 10;
export const POINTS_PER_PROBLEM = 2;
export const POINTS_PER_LEVEL = 100;

export function calculateLevel(points: number): number {
  return Math.floor(points / POINTS_PER_LEVEL) + 1;
}

export function calculatePoints(algorithmsCompleted: number, problemsSolved: number): number {
  return (algorithmsCompleted * POINTS_PER_ALGORITHM) + (problemsSolved * POINTS_PER_PROBLEM);
}
