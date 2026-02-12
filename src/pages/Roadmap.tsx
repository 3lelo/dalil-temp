import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Lock, ChevronLeft, ChevronRight, CheckCircle2, Compass, ChevronDown, ChevronUp, Info, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useAlgorithms, getDifficultyColor, Algorithm } from '@/hooks/useAlgorithms';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export default function Roadmap() {
  const [searchParams] = useSearchParams();
  const { t, lang, dir } = useI18n();
  const { user, profile } = useAuth();

  const { algorithms, isLoading: algorithmsLoading } = useAlgorithms();
  const [completedAlgorithms, setCompletedAlgorithms] = useState<Set<string>>(new Set());
  const [solvedProblemsMap, setSolvedProblemsMap] = useState<Map<string, number>>(new Map());
  const [totalProblemsMap, setTotalProblemsMap] = useState<Map<string, number>>(new Map());
  const [isCompletionsLoading, setIsCompletionsLoading] = useState(true);
  const [isOnboardingDrawerOpen, setIsOnboardingDrawerOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());

  const hasCompletedIQ = user && profile?.onboarding_stage === 'ready';
  const defaultTab = searchParams.get('tab') || (hasCompletedIQ ? 'personal' : 'public');
  const isPersonalLocked = !user || profile?.onboarding_stage !== 'ready';
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  // Helper function to get difficulty text with fallback
  const getDifficultyText = (difficultyAr: string, difficultyEn?: string) => {
    if (lang === 'en') {
      if (difficultyEn) return difficultyEn;
      const difficultyMap: Record<string, string> = {
        'مبتدئ': 'Beginner',
        'مبتدئ-متوسط': 'Beginner-Intermediate',
        'متوسط': 'Intermediate',
        'متوسط-متقدم': 'Intermediate-Advanced',
        'سهل': 'Easy',
        'صعب': 'Hard',
        'متقدم': 'Advanced'
      };
      return difficultyMap[difficultyAr] || difficultyAr;
    }
    return difficultyAr;
  };

  // Fetch user's completed algorithms + problem counts
  useEffect(() => {
    const fetchCompletions = async () => {
      if (!user) {
        setIsCompletionsLoading(false);
        return;
      }

      try {
        const [completionsRes, solvedRes, totalRes] = await Promise.all([
          supabase
            .from('algorithm_completions')
            .select('algorithm_id')
            .eq('user_id', user.id),
          supabase
            .from('algorithm_problem_completions')
            .select('algorithm_id')
            .eq('user_id', user.id),
          supabase
            .from('algorithm_problems')
            .select('algorithm_id')
        ]);

        if (completionsRes.data) {
          setCompletedAlgorithms(new Set(completionsRes.data.map((c: any) => c.algorithm_id)));
        }

        // Count solved problems per algorithm
        const solvedMap = new Map<string, number>();
        solvedRes.data?.forEach((r: any) => {
          solvedMap.set(r.algorithm_id, (solvedMap.get(r.algorithm_id) || 0) + 1);
        });
        setSolvedProblemsMap(solvedMap);

        // Count total problems per algorithm
        const totalMap = new Map<string, number>();
        totalRes.data?.forEach((r: any) => {
          totalMap.set(r.algorithm_id, (totalMap.get(r.algorithm_id) || 0) + 1);
        });
        setTotalProblemsMap(totalMap);
      } catch (err) {
        console.error('Error fetching completions:', err);
      } finally {
        setIsCompletionsLoading(false);
      }
    };
    fetchCompletions();
  }, [user]);

  // Determine algorithm status
  const getAlgorithmStatus = useCallback((algoId: string): 'completed' | 'in-progress' | 'not-started' => {
    if (completedAlgorithms.has(algoId)) return 'completed';
    const solved = solvedProblemsMap.get(algoId) || 0;
    if (solved > 0) return 'in-progress';
    return 'not-started';
  }, [completedAlgorithms, solvedProblemsMap]);

  // Group PUBLIC algorithms by category
  const groupedAlgorithms = useMemo(() => {
    return algorithms.reduce((acc, algo) => {
      const categoryKey = lang === 'ar' ? algo.category_ar : algo.category_en;
      if (!acc[categoryKey]) acc[categoryKey] = [];
      acc[categoryKey].push(algo);
      return acc;
    }, {} as Record<string, Algorithm[]>);
  }, [algorithms, lang]);

  // --- PERSONAL ROADMAP: extract plan_ids safely
  const personalPlanIds: string[] = useMemo(() => {
    const pr: any = profile?.personal_roadmap;
    const ids = pr?.plan_ids;
    return Array.isArray(ids) ? ids.filter((x) => typeof x === 'string') : [];
  }, [profile?.personal_roadmap]);

  const personalAlgorithms = useMemo(() => {
    if (!personalPlanIds.length) return [];
    const set = new Set(personalPlanIds);
    return algorithms.filter((a) => set.has(a.id));
  }, [algorithms, personalPlanIds]);

  const groupedPersonal = useMemo(() => {
    return personalAlgorithms.reduce((acc, algo) => {
      const categoryKey = lang === 'ar' ? algo.category_ar : algo.category_en;
      if (!acc[categoryKey]) acc[categoryKey] = [];
      acc[categoryKey].push(algo);
      return acc;
    }, {} as Record<string, Algorithm[]>);
  }, [personalAlgorithms, lang]);

  const isLoading = algorithmsLoading || isCompletionsLoading;

  // Auto-scroll to first in-progress or last completed algorithm
  useEffect(() => {
    if (isLoading || hasScrolled || !user || algorithms.length === 0) return;

    // Find first in-progress
    let scrollTargetId: string | null = null;
    for (const algo of algorithms) {
      if (getAlgorithmStatus(algo.id) === 'in-progress') {
        scrollTargetId = algo.id;
        break;
      }
    }

    // If no in-progress, find last completed
    if (!scrollTargetId) {
      for (let i = algorithms.length - 1; i >= 0; i--) {
        if (getAlgorithmStatus(algorithms[i].id) === 'completed') {
          scrollTargetId = algorithms[i].id;
          break;
        }
      }
    }

    if (scrollTargetId) {
      // Delay to let DOM render
      setTimeout(() => {
        const el = cardRefs.current.get(scrollTargetId!);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
    setHasScrolled(true);
  }, [isLoading, hasScrolled, user, algorithms, getAlgorithmStatus]);

  // Ref callback for algorithm cards
  const setCardRef = useCallback((algoId: string) => (el: HTMLElement | null) => {
    if (el) {
      cardRefs.current.set(algoId, el);
    } else {
      cardRefs.current.delete(algoId);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Compass className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderAlgorithmCard = (algo: Algorithm) => {
    const status = getAlgorithmStatus(algo.id);
    const isCompleted = status === 'completed';
    const isInProgress = status === 'in-progress';
    const title = lang === 'ar' ? algo.title_ar : algo.title_en;
    const description = lang === 'ar' ? algo.description_ar : algo.description_en;
    const difficulty = getDifficultyText(algo.difficulty_ar, algo.difficulty_en);
    const solved = solvedProblemsMap.get(algo.id) || 0;
    const total = totalProblemsMap.get(algo.id) || 0;

    // Tooltip text for the circle
    const tooltipText = isCompleted
      ? t('roadmap.tooltip.completed')
      : isInProgress
        ? t('roadmap.tooltip.inProgress').replace('{solved}', String(solved)).replace('{total}', String(total))
        : t('roadmap.tooltip.notStarted');

    return (
      <Link
        key={algo.id}
        to={`/algorithm/${algo.id}`}
        ref={setCardRef(algo.id) as any}
        className={cn(
          "flex items-center gap-3 p-4 rounded-lg border transition-all hover:shadow-md group",
          isCompleted
            ? "bg-green-500/5 border-green-500/20"
            : isInProgress
              ? "bg-yellow-500/5 border-yellow-500/20"
              : "bg-card hover:bg-muted hover:border-primary/30"
        )}
      >
        {user && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isInProgress
                        ? "bg-yellow-500 text-white"
                        : "border-2 border-muted-foreground/30"
                  )}
                >
                  {isCompleted && <CheckCircle2 className="h-4 w-4" />}
                  {isInProgress && <Loader2 className="h-3.5 w-3.5" />}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p>{tooltipText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                "font-medium transition-colors",
                isCompleted
                  ? "text-green-600 dark:text-green-400"
                  : isInProgress
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "group-hover:text-primary"
              )}
            >
              {title}
            </span>
            {user && total > 0 && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0 h-5",
                  isCompleted
                    ? "border-green-500/30 text-green-600 dark:text-green-400"
                    : isInProgress
                      ? "border-yellow-500/30 text-yellow-600 dark:text-yellow-400"
                      : "text-muted-foreground"
                )}
              >
                {solved}/{total}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {description}
          </p>
        </div>

        <Badge
          variant="outline"
          className={cn("flex-shrink-0", getDifficultyColor(algo.difficulty_ar))}
        >
          {difficulty}
        </Badge>

        <ArrowIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </Link>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl" dir={dir}>
      <h1 className="text-3xl font-bold mb-6">{t('roadmap.title')}</h1>

      <Tabs defaultValue={defaultTab} dir={dir}>
        <TabsList className="mb-6">
          <TabsTrigger value="public">{t('roadmap.public')}</TabsTrigger>
          <TabsTrigger value="personal">{t('roadmap.personal')}</TabsTrigger>
        </TabsList>

        {/* =================== PUBLIC =================== */}
        <TabsContent value="public" className="space-y-6">
          {/* Onboarding Steps Drawer */}
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setIsOnboardingDrawerOpen(!isOnboardingDrawerOpen)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-semibold">
                    {t('roadmap.onboardingSteps.title')}
                  </CardTitle>
                  <Badge variant="outline" className="bg-primary/10 text-primary">
                    {t('roadmap.onboardingSteps.badge')}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  {isOnboardingDrawerOpen ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {t('roadmap.onboardingSteps.hint')}
              </p>
            </CardHeader>
            
            {isOnboardingDrawerOpen && (
              <CardContent className="space-y-6 pt-0">
                {/* Step 1 */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">1</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{t('roadmap.onboardingSteps.step1.title')}</h3>
                      <p className="text-sm text-muted-foreground">{t('roadmap.onboardingSteps.step1.description')}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* C++ */}
                    <div className="space-y-2 p-3 border rounded-md">
                      <h4 className="font-medium">{t('roadmap.onboardingSteps.step1.languages.cpp.title')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('roadmap.onboardingSteps.step1.languages.cpp.description')}
                      </p>
                      <Button onClick={() => window.open("https://www.youtube.com/playlist?list=PLDoPjvoNmBAwy-rS6WKudwVeb_x63EzgS", "_blank")} className="link-btn">
                        {t('roadmap.onboardingSteps.step1.languages.cpp.link')}
                      </Button>
                    </div>
                    
                    {/* Python */}
                    <div className="space-y-2 p-3 border rounded-md">
                      <h4 className="font-medium">{t('roadmap.onboardingSteps.step1.languages.python.title')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('roadmap.onboardingSteps.step1.languages.python.description')}
                      </p>
                      <Button onClick={() => window.open("https://www.youtube.com/playlist?list=PLDoPjvoNmBAyE_gei5d18qkfIe-Z8mocs", "_blank")} className="link-btn">
                        {t('roadmap.onboardingSteps.step1.languages.python.link')}
                      </Button>
                    </div>
                    
                    {/* Java */}
                    <div className="space-y-2 p-3 border rounded-md">
                      <h4 className="font-medium">{t('roadmap.onboardingSteps.step1.languages.java.title')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('roadmap.onboardingSteps.step1.languages.java.description')}
                      </p>
                      <Button onClick={() => window.open("https://www.youtube.com/watch?v=mNvJipMTKSM&list=PLCInYL3l2AajYlZGzU_LVrHdoouf8W6ZN", "_blank")} className="link-btn">
                        {t('roadmap.onboardingSteps.step1.languages.java.link')}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">2</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{t('roadmap.onboardingSteps.step2.title')}</h3>
                      <p className="text-sm text-muted-foreground">{t('roadmap.onboardingSteps.step2.description')}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center mt-0.5">
                        <span className="text-xs">✓</span>
                      </div>
                      <div>
                        <strong>{t('roadmap.onboardingSteps.step2.basics.env.title')}:</strong>
                        <span className="text-sm text-muted-foreground ml-2">
                          {t('roadmap.onboardingSteps.step2.basics.env.description')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center mt-0.5">
                        <span className="text-xs">✓</span>
                      </div>
                      <div>
                        <strong>{t('roadmap.onboardingSteps.step2.basics.concepts.title')}:</strong>
                        <span className="text-sm text-muted-foreground ml-2">
                          {t('roadmap.onboardingSteps.step2.basics.concepts.description')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center mt-0.5">
                        <span className="text-xs">✓</span>
                      </div>
                      <div>
                        <strong>{t('roadmap.onboardingSteps.step2.basics.functions.title')}:</strong>
                        <span className="text-sm text-muted-foreground ml-2">
                          {t('roadmap.onboardingSteps.step2.basics.functions.description')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center mt-0.5">
                        <span className="text-xs">✓</span>
                      </div>
                      <div>
                        <strong>{t('roadmap.onboardingSteps.step2.basics.arrays.title')}:</strong>
                        <span className="text-sm text-muted-foreground ml-2">
                          {t('roadmap.onboardingSteps.step2.basics.arrays.description')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">3</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{t('roadmap.onboardingSteps.step3.title')}</h3>
                      <p className="text-sm text-muted-foreground">{t('roadmap.onboardingSteps.step3.description')}</p>
                    </div>
                  </div>
                  
                  {/* Assiut Sheets */}
                  <div className="space-y-3 p-3 border rounded-md">
                    <h4 className="font-medium">{t('roadmap.onboardingSteps.step3.assiut.title')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('roadmap.onboardingSteps.step3.assiut.description')}
                    </p>
                    <Button onClick={() => window.open("https://codeforces.com/group/MWSDmqGsZm/contests", "_blank")} className="link-btn">
                      {t('roadmap.onboardingSteps.step3.assiut.link')} {dir === 'rtl' ? <ArrowLeft /> : <ArrowRight />}
                    </Button>
                    
                    <div className="mt-3 pt-3 border-t">
                      <h5 className="text-sm font-medium mb-2">
                        {t('roadmap.onboardingSteps.step3.assiut.tips.title')}
                      </h5>
                      <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
                        <li>{t('roadmap.onboardingSteps.step3.assiut.tips.tip1')}</li>
                        <li>{t('roadmap.onboardingSteps.step3.assiut.tips.tip2')}</li>
                        <li>{t('roadmap.onboardingSteps.step3.assiut.tips.tip3')}</li>
                        <li>{t('roadmap.onboardingSteps.step3.assiut.tips.tip4')}</li>
                        <li>{t('roadmap.onboardingSteps.step3.assiut.tips.tip5')}</li>
                        <li>{t('roadmap.onboardingSteps.step3.assiut.tips.tip6')}</li>
                        <li>{t('roadmap.onboardingSteps.step3.assiut.tips.tip7')}</li>
                        <li>{t('roadmap.onboardingSteps.step3.assiut.tips.tip8')}</li>
                      </ol>
                    </div>
                  </div>
                  
                  {/* Extra Resources */}
                  <div className="space-y-3 p-3 border rounded-md">
                    <h4 className="font-medium">{t('roadmap.onboardingSteps.step3.resources.title')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('roadmap.onboardingSteps.step3.resources.description')}
                    </p>
                    
                    <div className="space-y-2">
                      <a 
                        href="https://www.hackerrank.com/domains/tutorials/30-days-of-code"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-primary underline hover:no-underline"
                      >
                        <strong>HackerRank:</strong> {t('roadmap.onboardingSteps.step3.resources.hackerrank')}
                      </a>
                      <a 
                        href="https://codeforces.com/problemset"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-primary underline hover:no-underline"
                      >
                        <strong>Codeforces:</strong> {t('roadmap.onboardingSteps.step3.resources.codeforces')}
                      </a>
                      <a 
                        href="https://www.codechef.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-primary underline hover:no-underline"
                      >
                        <strong>CodeChef:</strong> {t('roadmap.onboardingSteps.step3.resources.codechef')}
                      </a>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-muted-foreground">
                        <strong>{t('roadmap.onboardingSteps.step3.resources.note.title')}</strong>
                        {' '}
                        <a 
                          href="https://www.youtube.com/watch?v=XFNz0YSP4jQ"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline hover:no-underline"
                        >
                          {t('roadmap.onboardingSteps.step3.resources.note.link')}
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* FlowChart Section Card */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-purple-500/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold mb-2">
                    {t('flowchart.title')}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {t('flowchart.description')}
                  </p>
                </div>
                <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                  {t('flowchart.badge')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/flowchart">
                  {t('flowchart.cta')}
                  <ArrowIcon className={cn("h-4 w-4", dir === 'rtl' ? 'mr-2' : 'ml-2')} />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Progress summary */}
          {user && (
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span className="font-medium">{t('roadmap.progress')}</span>
                  </div>
                  <Badge variant="secondary">
                    {completedAlgorithms.size} / {algorithms.length}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {Object.entries(groupedAlgorithms).map(([category, algos]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{category}</span>
                  <Badge variant="outline">{algos.length}</Badge>
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  {algos.map(renderAlgorithmCard)}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* =================== PERSONAL =================== */}
        <TabsContent value="personal">
          {isPersonalLocked ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">{t('roadmap.locked')}</p>
                <Button asChild>
                  <Link to={user ? '/iq' : '/auth'}>
                    {user ? t('roadmap.completeIq') : t('roadmap.signinCta')}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      {t('roadmap.personalCount').replace('{count}', personalAlgorithms.length.toString())}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{t('roadmap.personalMessage')}</p>
                </CardContent>
              </Card>

              {!profile?.personal_roadmap ? (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground">
                    {t('roadmap.noPersonalRoadmap')}
                  </CardContent>
                </Card>
              ) : personalPlanIds.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center">
                    <p className="text-muted-foreground">{t('roadmap.personalEmpty')}</p>
                  </CardContent>
                </Card>
              ) : (
                Object.entries(groupedPersonal).map(([category, algos]) => (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{category}</span>
                        <Badge variant="outline">{algos.length}</Badge>
                      </CardTitle>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-3">
                        {algos.map(renderAlgorithmCard)}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
