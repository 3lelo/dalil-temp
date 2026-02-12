import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserStats } from '@/hooks/useUserStats';
import { supabase, PublicProfile } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { LevelBadge } from '@/components/ui/level-badge';
import StreakHeatmap from '@/components/streak/StreakHeatmap';
import { SolvedProblems } from '@/components/dashboard/SolvedProblems';
import { 
  Search, 
  Code2, 
  Target, 
  Trophy, 
  Star,
  TrendingUp,
  Calendar,
  Compass,
  ChevronLeft,
  ChevronRight,
  Settings
} from 'lucide-react';

export default function Dashboard() {
  const { t, dir } = useI18n();
  const { user, profile, userRole } = useAuth();
  const { stats, isLoading: statsLoading } = useUserStats();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PublicProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const ArrowIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;
  const isPrivileged = userRole === 'admin' || userRole === 'algorithm_editor';

  // Search users (exclude admins via is_admin filter on public_profiles)
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        // Query public_profiles view and explicitly exclude admins
        const { data } = await supabase
          .from('public_profiles')
          .select('id, username, avatar_url, iq_level, created_at, is_admin')
          .ilike('username', `%${searchQuery}%`)
          .eq('is_admin', false)
          .limit(10);
        
        setSearchResults(data || []);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Admin Dashboard View
  if (isPrivileged) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl font-bold mb-8">{t('admin.dashboardTitle')}</h1>
        
        {/* Profile Card - Admin */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="text-2xl">{profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <CardTitle className="text-2xl">{profile?.username}</CardTitle>
                <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                  {t('admin.adminBadge')}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
            </div>
          </CardHeader>
        </Card>

        {/* Admin Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t('admin.quickActions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Link to="/admin" className="block">
                <Card className="hover:bg-muted transition-colors cursor-pointer">
                  <CardContent className="pt-6">
                    <p className="font-medium">{t('admin.goToPanel')}</p>
                    <p className="text-sm text-muted-foreground">{t('admin.goToPanelDesc')}</p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/roadmap" className="block">
                <Card className="hover:bg-muted transition-colors cursor-pointer">
                  <CardContent className="pt-6">
                    <p className="font-medium">{t('nav.roadmap')}</p>
                    <p className="text-sm text-muted-foreground">{t('admin.viewRoadmap')}</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Search Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              {t('dashboard.searchUsers')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('dashboard.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10"
              />
            </div>

            {isSearching && (
              <div className="flex justify-center py-4">
                <Compass className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}

            {!isSearching && searchQuery && searchResults.length === 0 && (
              <p className="text-center text-muted-foreground py-4">{t('dashboard.noResults')}</p>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <Link
                    key={result.id}
                    to={`/u/${result.username}`}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={result.avatar_url || ''} />
                      <AvatarFallback>{result.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{result.username}</p>
                      {result.iq_level && (
                        <p className="text-sm text-muted-foreground">{result.iq_level}</p>
                      )}
                    </div>
                    <ArrowIcon className="h-5 w-5 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Regular Learner Dashboard
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8">{t('dashboard.title')}</h1>
      
      {/* Profile Card */}
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="text-2xl">{profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <CardTitle className="text-2xl">{profile?.username}</CardTitle>
              {profile?.iq_level && (
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  {profile.iq_level}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Level Card */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Star className="h-5 w-5 text-primary" />
              <span className="text-3xl font-bold text-primary">
                {statsLoading ? '...' : stats?.currentLevel || 1}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{t('dashboard.level')}</p>
            {stats && (
              <div className="mt-3">
                <Progress value={stats.progressToNextLevel} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.progressToNextLevel}/100 {t('dashboard.toNextLevel')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Points */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="text-3xl font-bold">
                {statsLoading ? '...' : stats?.totalPoints || 0}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{t('dashboard.totalPoints')}</p>
          </CardContent>
        </Card>

        {/* Algorithms Completed */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Code2 className="h-5 w-5 text-blue-500" />
              <span className="text-3xl font-bold">
                {statsLoading ? '...' : stats?.algorithmsCompleted || 0}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{t('dashboard.algorithmsCompleted')}</p>
          </CardContent>
        </Card>

        {/* Problems Solved */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-green-500" />
              <span className="text-3xl font-bold">
                {statsLoading ? '...' : stats?.problemsSolved || 0}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{t('dashboard.problemsSolved')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard Points */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.dailyPoints || 0}</p>
                <p className="text-sm text-muted-foreground">{t('dashboard.dailyPoints')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.weeklyPoints || 0}</p>
                <p className="text-sm text-muted-foreground">{t('dashboard.weeklyPoints')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Streak Heatmap */}
      <StreakHeatmap className="mb-8" />

      {/* Solved Problems */}
      <SolvedProblems className="mb-8" />

      {/* Search Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {t('dashboard.searchUsers')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('dashboard.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10"
            />
          </div>

          {isSearching && (
            <div className="flex justify-center py-4">
              <Compass className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {!isSearching && searchQuery && searchResults.length === 0 && (
            <p className="text-center text-muted-foreground py-4">{t('dashboard.noResults')}</p>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((result) => (
                <Link
                  key={result.id}
                  to={`/u/${result.username}`}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={result.avatar_url || ''} />
                    <AvatarFallback>{result.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{result.username}</p>
                    {result.iq_level && (
                      <p className="text-sm text-muted-foreground">{result.iq_level}</p>
                    )}
                  </div>
                  <ArrowIcon className="h-5 w-5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
