import React, { useState, useEffect } from 'react';
import { supabase, LeaderboardEntry, WeeklyStreakEntry, WeeklyImprovementEntry, WeeklyChallengesEntry, WeeklyChallenge, WeeklyChallengeProblem } from '@/lib/supabase';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Compass, Trophy, TrendingUp, Target, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import LeaderboardCard from '@/components/leaderboard/LeaderboardCard';

export default function Leaderboard() {
  const { t, dir } = useI18n();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  // Weekly Streak
  const [weeklyStreak, setWeeklyStreak] = useState<WeeklyStreakEntry[]>([]);
  const [isLoadingStreak, setIsLoadingStreak] = useState(true);
  
  // Weekly Improvement
  const [weeklyImprovement, setWeeklyImprovement] = useState<WeeklyImprovementEntry[]>([]);
  const [isLoadingImprovement, setIsLoadingImprovement] = useState(true);
  
  // Weekly Challenges
  const [weeklyChallenges, setWeeklyChallenges] = useState<WeeklyChallengesEntry[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<WeeklyChallenge[]>([]);
  const [activeChallengeProblems, setActiveChallengeProblems] = useState<Record<number, WeeklyChallengeProblem[]>>({});
  const [completedChallenges, setCompletedChallenges] = useState<number[]>([]);
  const [visitedLinks, setVisitedLinks] = useState<Record<number, Set<string>>>({});
  const [isLoadingChallenges, setIsLoadingChallenges] = useState(true);
  
  // Old Leaderboard
  const [daily, setDaily] = useState<LeaderboardEntry[]>([]);
  const [weekly, setWeekly] = useState<LeaderboardEntry[]>([]);
  const [isLoadingOld, setIsLoadingOld] = useState(true);

  // Fetch Weekly Streak
  useEffect(() => {
    const fetchStreak = async () => {
      try {
        const { data, error } = await supabase
          .from('leaderboard_weekly_streak')
          .select('*')
          .order('best_streak', { ascending: false })
          .limit(50);
        
        if (error) throw error;
        setWeeklyStreak(data || []);
      } catch (error) {
        console.error('Error fetching weekly streak:', error);
        setWeeklyStreak([]);
      } finally {
        setIsLoadingStreak(false);
      }
    };
    fetchStreak();
  }, []);

  // Fetch Weekly Improvement
  useEffect(() => {
    const fetchImprovement = async () => {
      try {
        const { data, error } = await supabase
          .from('leaderboard_weekly_improvement')
          .select('*')
          .order('improvement', { ascending: false })
          .limit(50);
        
        if (error) throw error;
        setWeeklyImprovement(data || []);
      } catch (error) {
        console.error('Error fetching weekly improvement:', error);
        setWeeklyImprovement([]);
      } finally {
        setIsLoadingImprovement(false);
      }
    };
    fetchImprovement();
  }, []);

  // Fetch Weekly Challenges
  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const [challengesRes, activeChallengesRes] = await Promise.all([
          supabase
            .from('leaderboard_weekly_challenges')
            .select('*')
            .order('challenges_completed', { ascending: false })
            .limit(50),
          supabase
            .from('weekly_challenges')
            .select('*')
            .eq('is_active', true)
            .gte('end_date', new Date().toISOString().split('T')[0])
            .order('start_date', { ascending: false })
        ]);

        if (challengesRes.error) throw challengesRes.error;
        if (activeChallengesRes.error) throw activeChallengesRes.error;

        const activeChs = activeChallengesRes.data || [];
        setWeeklyChallenges(challengesRes.data || []);
        setActiveChallenges(activeChs);

        // Fetch problems for these active challenges
        if (activeChs.length > 0) {
          const { data: probs, error: probsError } = await supabase
            .from('weekly_challenge_problems')
            .select('*')
            .in('challenge_id', activeChs.map(c => c.id))
            .order('sort_order');
          
          if (!probsError && probs) {
            const grouped = probs.reduce((acc, curr) => {
              if (!acc[curr.challenge_id]) acc[curr.challenge_id] = [];
              acc[curr.challenge_id].push(curr);
              return acc;
            }, {} as Record<number, WeeklyChallengeProblem[]>);
            setActiveChallengeProblems(grouped);
          }
        }

        // Fetch user's completed challenges
        if (user) {
          const { data: completions, error: completionsError } = await supabase
            .from('weekly_challenge_completions')
            .select('challenge_id')
            .eq('user_id', user.id);
          
          if (!completionsError && completions) {
            setCompletedChallenges(completions.map((c: { challenge_id: number }) => c.challenge_id));
          }
        }
      } catch (error) {
        console.error('Error fetching weekly challenges:', error);
        setWeeklyChallenges([]);
        setActiveChallenges([]);
      } finally {
        setIsLoadingChallenges(false);
      }
    };
    fetchChallenges();
  }, [user]);

  useEffect(() => {
    const fetchOld = async () => {
      try {
        const [d, w] = await Promise.all([
          supabase.from('leaderboard_daily').select('*').gt('points', 0).limit(50),
          supabase.from('leaderboard_weekly').select('*').gt('points', 0).limit(50),
        ]);
        setDaily(d.data || []);
        setWeekly(w.data || []);
      } catch (error) {
        console.error('Error fetching old leaderboard:', error);
        setDaily([]);
        setWeekly([]);
      } finally {
        setIsLoadingOld(false);
      }
    };
    fetchOld();
  }, []);

  // Complete Challenge
  const handleCompleteChallenge = async (challengeId: number) => {
    if (!user) {
      toast.error(t('leaderboard.signInToComplete'));
      return;
    }

    if (completedChallenges.includes(challengeId)) {
      toast.info(t('leaderboard.challengeAlreadyCompleted'));
      return;
    }

    try {
      const { error } = await supabase
        .from('weekly_challenge_completions')
        .insert({
          user_id: user.id,
          challenge_id: challengeId,
        });

      if (error) throw error;

      setCompletedChallenges([...completedChallenges, challengeId]);
      toast.success(t('leaderboard.challengeCompleted'));

      // Refresh challenges leaderboard
      const { data } = await supabase
        .from('leaderboard_weekly_challenges')
        .select('*')
        .order('challenges_completed', { ascending: false })
        .limit(50);
      
      if (data) setWeeklyChallenges(data);
    } catch (error) {
      console.error('Error completing challenge:', error);
      toast.error(t('common.error'));
    }
  };

  // Render Weekly Streak Table
  const renderStreakTable = () => {
    if (isMobile) {
      return (
        <div className="space-y-2">
          {weeklyStreak.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">{t('leaderboard.empty')}</p>
          ) : (
            weeklyStreak.map((entry, i) => (
              <LeaderboardCard
                key={entry.user_id}
                rank={i + 1}
                username={entry.username}
                avatarUrl={entry.avatar_url}
                primaryValue={entry.best_streak}
                primaryLabel={t('leaderboard.streak')}
              />
            ))
          )}
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">{t('leaderboard.rank')}</TableHead>
              <TableHead>{t('leaderboard.user')}</TableHead>
              <TableHead className="text-center">{t('leaderboard.streak')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weeklyStreak.map((entry, i) => (
              <TableRow key={entry.user_id}>
                <TableCell className="font-medium">{i + 1}</TableCell>
                <TableCell>
                  <Link to={`/u/${entry.username}`} className="flex items-center gap-2 hover:text-primary" style={{ justifyContent: 'center' }}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={entry.avatar_url || ''} />
                      <AvatarFallback>{entry.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {entry.username}
                  </Link>
                </TableCell>
                <TableCell className="text-center font-semibold text-orange-600">{entry.best_streak}</TableCell>
              </TableRow>
            ))}
            {weeklyStreak.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  {t('leaderboard.empty')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Render Weekly Improvement Table
  const renderImprovementTable = () => {
    if (isMobile) {
      return (
        <div className="space-y-2">
          {weeklyImprovement.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">{t('leaderboard.empty')}</p>
          ) : (
            weeklyImprovement.map((entry, i) => (
              <LeaderboardCard
                key={entry.user_id}
                rank={i + 1}
                username={entry.username}
                avatarUrl={entry.avatar_url}
                primaryValue={entry.improvement}
                primaryLabel={t('leaderboard.improvement')}
                secondaryValue={entry.points_this_week}
                secondaryLabel={t('leaderboard.pointsThisWeek')}
                isPositive={entry.improvement >= 0}
              />
            ))
          )}
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">{t('leaderboard.rank')}</TableHead>
              <TableHead>{t('leaderboard.user')}</TableHead>
              <TableHead className="text-center">{t('leaderboard.improvement')}</TableHead>
              <TableHead className="text-center">{t('leaderboard.pointsThisWeek')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weeklyImprovement.map((entry, i) => (
              <TableRow key={entry.user_id}>
                <TableCell className="font-medium">{i + 1}</TableCell>
                <TableCell>
                  <Link to={`/u/${entry.username}`} className="flex items-center gap-2 hover:text-primary" style={{ justifyContent: 'center' }}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={entry.avatar_url || ''} />
                      <AvatarFallback>{entry.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {entry.username}
                  </Link>
                </TableCell>
                <TableCell className={cn("text-center font-semibold", entry.improvement >= 0 ? "text-green-600" : "text-red-600")}>
                  {entry.improvement >= 0 ? '+' : ''}{entry.improvement}
                </TableCell>
                <TableCell className="text-center">{entry.points_this_week}</TableCell>
              </TableRow>
            ))}
            {weeklyImprovement.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  {t('leaderboard.empty')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Render Weekly Challenges Tab
  const renderChallengesTab = () => {
    const challengesLeaderboard = isMobile ? (
      <div className="space-y-2">
        {weeklyChallenges.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">{t('leaderboard.empty')}</p>
        ) : (
          weeklyChallenges.map((entry, i) => (
            <LeaderboardCard
              key={entry.user_id}
              rank={i + 1}
              username={entry.username}
              avatarUrl={entry.avatar_url}
              primaryValue={entry.challenges_completed}
              primaryLabel={t('leaderboard.challengesCompleted')}
            />
          ))
        )}
      </div>
    ) : (
      <div className="overflow-x-auto" dir={dir}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">{t('leaderboard.rank')}</TableHead>
              <TableHead>{t('leaderboard.user')}</TableHead>
              <TableHead className="text-center">{t('leaderboard.challengesCompleted')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weeklyChallenges.map((entry, i) => (
              <TableRow key={entry.user_id}>
                <TableCell className="font-medium">{i + 1}</TableCell>
                <TableCell>
                  <Link to={`/u/${entry.username}`} className="flex items-center gap-2 hover:text-primary" style={{ justifyContent: 'center' }}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={entry.avatar_url || ''} />
                      <AvatarFallback>{entry.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {entry.username}
                  </Link>
                </TableCell>
                <TableCell className="text-center font-semibold text-primary">{entry.challenges_completed}</TableCell>
              </TableRow>
            ))}
            {weeklyChallenges.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  {t('leaderboard.empty')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );

    const handleVisitLink = (challengeId: number, url: string) => {
      setVisitedLinks(prev => {
        const current = new Set(prev[challengeId] || []);
        current.add(url);
        return { ...prev, [challengeId]: current };
      });
    };
    
    return (
      <Tabs defaultValue="ranking" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 max-w-sm mx-auto">
          <TabsTrigger value="active">{t('leaderboard.activeChallenges')}</TabsTrigger>
          <TabsTrigger value="ranking">{t('leaderboard.ranking')}</TabsTrigger>
        </TabsList>

        <TabsContent value="active" dir={dir}>
          {activeChallenges.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {activeChallenges.map((challenge) => {
                const isCompleted = completedChallenges.includes(challenge.id);
                const title = dir === 'rtl' ? challenge.title_ar : challenge.title_en;
                const description = dir === 'rtl' ? challenge.description_ar : challenge.description_en;
                const probs = activeChallengeProblems[challenge.id] || [];
                const visited = visitedLinks[challenge.id] || new Set();
                const allVisited = probs.length > 0 && probs.every(p => visited.has(p.problem_url));
                
                return (
                  <Card key={challenge.id} className={cn("overflow-hidden border-2 transition-all", isCompleted ? "border-green-500/20 shadow-sm" : "border-primary/5 hover:border-primary/20",)}>
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center justify-between text-xl">
                        <span>{title}</span>
                        {isCompleted && (
                          <Badge variant="default" className="gap-1 bg-green-500 hover:bg-green-600">
                            <Award className="h-3 w-3" />
                            {t('algorithm.completedBadge')}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-base">{description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold opacity-70 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          {t('admin.challengeProblems')}
                        </Label>
                        <div className="space-y-2">
                          {probs.map((p, idx) => (
                            <a 
                              key={p.problem_url}
                              href={p.problem_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => handleVisitLink(challenge.id, p.problem_url)}
                              className={cn(
                                "flex items-center gap-3 p-2 rounded-md transition-colors border text-sm group",
                                visited.has(p.problem_url) 
                                  ? "bg-green-500/5 border-green-500/20 text-green-700 dark:text-green-400" 
                                  : "bg-muted/50 border-transparent hover:bg-muted"
                              )}
                            >
                              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-background border text-xs font-bold shrink-0">
                                {idx + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate underline-offset-4 group-hover:underline">{p.title}</p>
                                <p className="text-[10px] opacity-60 uppercase tracking-wider">{p.topic}</p>
                              </div>
                              {visited.has(p.problem_url) && <Award className="h-4 w-4 text-green-500 shrink-0" />}
                            </a>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={() => handleCompleteChallenge(challenge.id)}
                        disabled={isCompleted || !allVisited}
                        className="w-full relative h-11"
                        variant={isCompleted ? "secondary" : (allVisited ? "default" : "outline")}
                      >
                        {isCompleted 
                          ? t('leaderboard.challengeAlreadyCompleted') 
                          : (allVisited ? t('leaderboard.completeChallenge') : t('leaderboard.visitAllProblems'))}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-20 text-muted-foreground bg-muted/5 rounded-xl border-2 border-dashed">
              {t('admin.noChallenges')}
            </p>
          )}
        </TabsContent>

        <TabsContent value="ranking">
          {challengesLeaderboard}
        </TabsContent>
      </Tabs>
    );
  };

  // Render Old Leaderboard Table
  const renderOldTable = (data: LeaderboardEntry[]) => {
    if (isMobile) {
      return (
        <div className="space-y-2">
          {data.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">{t('leaderboard.empty')}</p>
          ) : (
            data.map((entry, i) => (
              <LeaderboardCard
                key={entry.user_id}
                rank={i + 1}
                username={entry.username}
                avatarUrl={entry.avatar_url}
                primaryValue={entry.points}
                primaryLabel={t('leaderboard.points')}
                secondaryValue={entry.completions_count}
                secondaryLabel={t('leaderboard.completions')}
                points={entry.points}
              />
            ))
          )}
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">{t('leaderboard.rank')}</TableHead>
              <TableHead>{t('leaderboard.user')}</TableHead>
              <TableHead className="text-center">{t('leaderboard.completions')}</TableHead>
              <TableHead className="text-center">{t('leaderboard.points')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((entry, i) => (
              <TableRow key={entry.user_id}>
                <TableCell className="font-medium">{i + 1}</TableCell>
                <TableCell>
                  <Link to={`/u/${entry.username}`} className="flex items-center gap-2 hover:text-primary" style={{ justifyContent: 'center' }}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={entry.avatar_url || ''} />
                      <AvatarFallback>{entry.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {entry.username}
                  </Link>
                </TableCell>
                <TableCell className="text-center">{entry.completions_count}</TableCell>
                <TableCell className="text-center font-semibold text-primary">{Math.round(entry.points)}</TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {t('leaderboard.empty')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  const isLoading = isLoadingStreak || isLoadingImprovement || isLoadingChallenges || isLoadingOld;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Compass className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl" dir={dir}>
      <h1 className="text-3xl font-bold mb-6">{t('leaderboard.title')}</h1>
      
      <Tabs defaultValue="streak" className="w-full" dir={dir}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6 h-auto gap-1">
          <TabsTrigger value="streak" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2">
            <Trophy className="h-3 w-3 md:h-4 md:w-4" />
            <span className="truncate">{isMobile ? t('leaderboard.streak') : t('leaderboard.weeklyStreak')}</span>
          </TabsTrigger>
          <TabsTrigger value="improvement" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2">
            <TrendingUp className="h-3 w-3 md:h-4 md:w-4" />
            <span className="truncate">{isMobile ? t('leaderboard.improvement') : t('leaderboard.weeklyImprovement')}</span>
          </TabsTrigger>
          <TabsTrigger value="challenges" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2">
            <Target className="h-3 w-3 md:h-4 md:w-4" />
            <span className="truncate">{isMobile ? t('leaderboard.challengesCompleted') : t('leaderboard.weeklyChallenges')}</span>
          </TabsTrigger>
          <TabsTrigger value="old" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2">
            <Award className="h-3 w-3 md:h-4 md:w-4" />
            <span className="truncate">{t('leaderboard.oldLeaderboard')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="streak" className="space-y-4">
          <p className="text-muted-foreground mb-4">{t('leaderboard.weeklyStreakDesc')}</p>
          {isLoadingStreak ? (
            <div className="flex justify-center py-12">
              <Compass className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            renderStreakTable()
          )}
        </TabsContent>

        <TabsContent value="improvement" className="space-y-4">
          <p className="text-muted-foreground mb-4">{t('leaderboard.weeklyImprovementDesc')}</p>
          {isLoadingImprovement ? (
            <div className="flex justify-center py-12">
              <Compass className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            renderImprovementTable()
          )}
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          <p className="text-muted-foreground mb-4">{t('leaderboard.weeklyChallengesDesc')}</p>
          {isLoadingChallenges ? (
            <div className="flex justify-center py-12">
              <Compass className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            renderChallengesTab()
          )}
        </TabsContent>

        <TabsContent value="old" className="space-y-4">
          <p className="text-muted-foreground mb-4">{t('leaderboard.oldLeaderboardDesc')}</p>
          <Tabs defaultValue="daily" dir={dir}>
            <TabsList className="mb-6">
              <TabsTrigger value="daily">{t('leaderboard.daily')}</TabsTrigger>
              <TabsTrigger value="weekly">{t('leaderboard.weekly')}</TabsTrigger>
            </TabsList>
            <TabsContent value="daily">
              {isLoadingOld ? (
                <div className="flex justify-center py-12">
                  <Compass className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                renderOldTable(daily)
              )}
            </TabsContent>
            <TabsContent value="weekly">
              {isLoadingOld ? (
                <div className="flex justify-center py-12">
                  <Compass className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                renderOldTable(weekly)
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}