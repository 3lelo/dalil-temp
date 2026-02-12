import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, PublicProfile } from '@/lib/supabase';
import { useI18n } from '@/i18n/I18nContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LevelBadge } from '@/components/ui/level-badge';
import StreakHeatmap from '@/components/streak/StreakHeatmap';
import { SolvedProblems } from '@/components/dashboard/SolvedProblems';
import { Compass, Code2, Target, Star, Trophy, Calendar } from 'lucide-react';

type PublicStats = {
  user_id: string;
  username: string;
  avatar_url: string | null;
  iq_level: string | null;
  algorithms_completed: number;
  problems_solved: number;
  is_admin?: boolean;
  points?: number;
  level?: number;
  created_at?: string;
};

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [stats, setStats] = useState<PublicStats | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  const { t } = useI18n();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setStatsLoading(true);

      try {
        // Load public profile (safe view)
        const { data: prof, error: profErr } = await supabase
          .from('public_profiles')
          .select('*')
          .ilike('username', username || '')
          .maybeSingle();

        if (profErr) console.error(profErr);

        // If profile exists but is admin, treat as not found
        const profileIsAdmin = prof?.is_admin === true;

        if (!cancelled) {
          setProfile(profileIsAdmin ? null : prof);
          setIsLoading(false);
        }

        // If no profile found or is admin, stop here
        if (!prof || profileIsAdmin) {
          if (!cancelled) setStatsLoading(false);
          return;
        }

        // Fetch stats directly from tables using profile.id
        const userId = prof.id;
        
        // Fetch algorithm completions and problem completions counts in parallel
        const [algorithmsResult, problemsResult] = await Promise.all([
          supabase
            .from('algorithm_completions')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId),
          supabase
            .from('algorithm_problem_completions')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
        ]);

        const algorithmsCompleted = algorithmsResult.count || 0;
        const problemsSolved = problemsResult.count || 0;

        if (!cancelled) {
          setStats({
            user_id: userId,
            username: prof.username,
            avatar_url: prof.avatar_url,
            iq_level: prof.iq_level,
            algorithms_completed: algorithmsCompleted,
            problems_solved: problemsSolved,
            created_at: prof.created_at,
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setStatsLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [username, navigate]);

  // Redirect to 404 if profile not found (covers non-existent users AND admins)
  useEffect(() => {
    if (!isLoading && !profile) {
      navigate('/404', { replace: true });
    }
  }, [isLoading, profile, navigate]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Compass className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Safety fallback while redirect happens
  if (!profile) {
    return null;
  }

  const joinDate = new Date(profile.created_at).toLocaleDateString();
  const isAdminProfile = stats?.is_admin === true;

  // For admins: they shouldn't reach here (redirected above), but safety fallback
  if (isAdminProfile) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        {t('profile.notFound', 'الحساب غير موجود')}
      </div>
    );
  }

  const computedPoints = stats ? (stats.algorithms_completed || 0) * 10 + (stats.problems_solved || 0) * 2 : 0;
  const computedLevel = Math.floor(computedPoints / 100) + 1;
  const displayAlgorithms = stats?.algorithms_completed || 0;
  const displayProblems = stats?.problems_solved || 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Profile Header */}
      <Card className="mb-6">
        <CardHeader className="text-center pb-2">
          <Avatar className="h-24 w-24 mx-auto mb-4">
            <AvatarImage src={profile.avatar_url || ''} />
            <AvatarFallback className="text-3xl">
              {profile.username?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex items-center justify-center gap-3 mb-2">
            <CardTitle className="text-2xl">{profile.username}</CardTitle>
            <LevelBadge level={computedLevel} size="md" />
          </div>
        </CardHeader>

        <CardContent className="text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {t('profile.joined', 'تاريخ الانضمام')}: {joinDate}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <Star className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {statsLoading ? '...' : computedLevel}
            </p>
            <p className="text-sm text-muted-foreground">{t('profile.level', 'المستوى')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {statsLoading ? '...' : computedPoints}
            </p>
            <p className="text-sm text-muted-foreground">{t('profile.points', 'النقاط')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <Code2 className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {statsLoading ? '...' : displayAlgorithms}
            </p>
            <p className="text-sm text-muted-foreground">{t('profile.algorithms', 'الخوارزميات')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <Target className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {statsLoading ? '...' : displayProblems}
            </p>
            <p className="text-sm text-muted-foreground">{t('profile.problems', 'المسائل')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Streak Heatmap for public profile */}
      {stats?.user_id && (
        <StreakHeatmap 
          userId={stats.user_id} 
          userCreatedAt={stats.created_at || profile.created_at}
          className="mb-6" 
        />
      )}

      {/* Solved Problems for public profile */}
      {stats?.user_id && (
        <SolvedProblems 
          userId={stats.user_id} 
          className="mb-6" 
        />
      )}
    </div>
  );
}
