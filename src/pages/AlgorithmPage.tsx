import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useAlgorithm, getDifficultyColor } from '@/hooks/useAlgorithms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Lightbulb, 
  ListChecks,
  Link2,
  Video,
  FileText,
  ExternalLink,
  CheckCircle2,
  Compass,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function AlgorithmPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang, dir } = useI18n();
  const { user, profile, userRole } = useAuth();
  
  const { algorithm, isLoading } = useAlgorithm(id);
  const [isAlgorithmCompleted, setIsAlgorithmCompleted] = useState(false);
  const [completedProblems, setCompletedProblems] = useState<Set<string>>(new Set());
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);

  const isPrivileged = userRole === 'admin' || userRole === 'algorithm_editor';

  // Helper function to get field based on language
  const getField = (ar: string, en?: string) => {
    if (lang === 'en') {
      return en || ar;
    }
    return ar;
  };

  // Simple markdown-ish renderer for matching bold text (**text**) and newlines
  const renderRichText = (text: string) => {
    if (!text) return null;
    
    // Split by bold pattern **...**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
      }
      
      // Handle newlines within non-bold parts
      const subparts = part.split('\n');
      return subparts.map((line, j) => (
        <React.Fragment key={`${i}-${j}`}>
          {line}
          {j < subparts.length - 1 && <br />}
        </React.Fragment>
      ));
    });
  };

  // Helper function for difficulty translation
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

  // Fetch user's completion status
  useEffect(() => {
    const fetchCompletionStatus = async () => {
      if (!user || !id) return;

      const [algoCompletion, problemCompletions] = await Promise.all([
        supabase
          .from('algorithm_completions')
          .select('id')
          .eq('user_id', user.id)
          .eq('algorithm_id', id)
          .maybeSingle(),
        supabase
          .from('algorithm_problem_completions')
          .select('problem_url')
          .eq('user_id', user.id)
          .eq('algorithm_id', id)
      ]);

      setIsAlgorithmCompleted(!!algoCompletion.data);

      if (problemCompletions.data) {
        setCompletedProblems(new Set(problemCompletions.data.map(p => p.problem_url)));
      }
    };

    fetchCompletionStatus();
  }, [user, id]);

  const handleMarkAlgorithmComplete = async () => {
    if (!user) {
      toast.error(t('algorithm.signInRequired'));
      return;
    }

    // Check if all problems are solved
    if (algorithm && algorithm.problems.length > 0) {
      const allProblemsSolved = algorithm.problems.every(problem => 
        completedProblems.has(problem.url)
      );
      
      if (!allProblemsSolved) {
        toast.error(t('algorithm.requiredSolve'));
        return;
      }
    }

    setIsMarkingComplete(true);
    try {
      const { error } = await supabase
        .from('algorithm_completions')
        .insert({ 
          user_id: user.id, 
          algorithm_id: id 
        });

      if (error) {
        if (error.code === '23505') {
          toast.info(t('algorithm.alreadyCompleted'));
        } else {
          throw error;
        }
      } else {
        setIsAlgorithmCompleted(true);
        toast.success(t('algorithm.completed'));
      }
    } catch (error) {
      console.error('Error marking algorithm complete:', error);
      toast.error(t('common.error'));
    } finally {
      setIsMarkingComplete(false);
    }
  };

  const handleToggleProblem = async (problemUrl: string) => {
    if (!user) {
      toast.error(t('algorithm.signInRequired'));
      return;
    }

    const isCompleted = completedProblems.has(problemUrl);

    try {
      if (isCompleted) {
        await supabase
          .from('algorithm_problem_completions')
          .delete()
          .eq('user_id', user.id)
          .eq('problem_url', problemUrl);

        setCompletedProblems(prev => {
          const newSet = new Set(prev);
          newSet.delete(problemUrl);
          return newSet;
        });
      } else {
        const { error } = await supabase
          .from('algorithm_problem_completions')
          .insert({ user_id: user.id, algorithm_id: id, problem_url: problemUrl });

        if (error && error.code !== '23505') throw error;

        setCompletedProblems(prev => new Set([...prev, problemUrl]));
        toast.success(t('algorithm.problemSolved'));
      }
    } catch (error) {
      console.error('Error toggling problem:', error);
      toast.error(t('common.error'));
    }
  };

  const BackIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'article': return <FileText className="h-4 w-4" />;
      default: return <Link2 className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Compass className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!algorithm) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-xl text-muted-foreground">{t('algorithm.notFound')}</p>
        <Button asChild className="mt-4">
          <Link to="/roadmap">{t('common.back')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back button */}
      <Link 
        to="/roadmap" 
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <BackIcon className="h-4 w-4" />
        {t('roadmap.title')}
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Badge variant="outline" className="text-sm">
            {getField(algorithm.category_ar, algorithm.category_en)}
          </Badge>
          <Badge variant="outline" className={cn("text-sm", getDifficultyColor(algorithm.difficulty_ar))}>
            {getDifficultyText(algorithm.difficulty_ar, algorithm.difficulty_en)}
          </Badge>
          {isAlgorithmCompleted && (
            <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
              <CheckCircle2 className="h-3 w-3 me-1" />
              {t('algorithm.completedBadge')}
            </Badge>
          )}
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          {getField(algorithm.title_ar, algorithm.title_en)}
        </h1>
        
        <div className="text-lg text-muted-foreground">
          {renderRichText(getField(algorithm.description_ar, algorithm.description_en))}
        </div>

        {/* Mark as Complete button - hidden for admins */}
        {user && !isAlgorithmCompleted && !isPrivileged && (
          <Button 
            onClick={handleMarkAlgorithmComplete} 
            disabled={isMarkingComplete}
            className="mt-4"
          >
            {isMarkingComplete ? (
              <Compass className="h-4 w-4 animate-spin me-2" />
            ) : (
              <CheckCircle2 className="h-4 w-4 me-2" />
            )}
            {t('algorithm.markComplete')}
          </Button>
        )}

        {/* Progress indicator */}
        {algorithm.problems.length > 0 && (
          <div className="mt-2 text-sm text-muted-foreground">
            {completedProblems.size === algorithm.problems.length ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>{t('algorithm.allProblemsSolved')}</span>
              </div>
            ) : (
              <div>
                {t('algorithm.problemsProgress')
                  .replace('{solved}', completedProblems.size.toString())
                  .replace('{total}', algorithm.problems.length.toString())}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {/* What is it? */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {t('algorithm.whatIsIt')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground leading-relaxed">
              {renderRichText(getField(algorithm.what_ar, algorithm.what_en))}
            </div>
          </CardContent>
        </Card>

        {/* Why it matters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              {t('algorithm.whyItMatters')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground leading-relaxed">
              {renderRichText(getField(algorithm.why_ar, algorithm.why_en))}
            </div>
          </CardContent>
        </Card>

        {/* Prerequisites */}
        {algorithm.prerequisites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-blue-500" />
                {t('algorithm.prerequisites')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {algorithm.prerequisites.map((prereq) => (
                  <li key={prereq.id}>
                    {getField(prereq.text_ar, prereq.text_en)}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Related Algorithms */}
        {algorithm.related.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-purple-500" />
                {t('algorithm.relatedTopics')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {algorithm.related.map((rel) => (
                  <Link key={rel.related_algorithm_id} to={`/algorithm/${rel.related_algorithm_id}`}>
                    <Badge 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {getField(rel.title_ar, rel.title_en)}
                      <ArrowIcon className="h-3 w-3 ms-1" />
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resources */}
        {algorithm.resources.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('algorithm.resources')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {algorithm.resources.map((resource) => (
                  <a
                    key={resource.id}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {getResourceIcon(resource.type)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {getField(resource.title_ar, resource.title_en)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {resource.type} • {resource.language.toUpperCase()}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Problems */}
        {algorithm.problems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t('algorithm.practiceProblems')}</span>
                <Badge variant="outline">
                  {completedProblems.size}/{algorithm.problems.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {(user && !isPrivileged) && <TableHead className="w-12 text-center">{t('algorithm.table.status')}</TableHead>}
                      <TableHead className={`${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('algorithm.table.problem')}</TableHead>
                      <TableHead className="text-center w-32">{t('algorithm.table.difficulty')}</TableHead>
                      <TableHead className="text-center w-24">{t('algorithm.table.link')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {algorithm.problems.map((problem) => {
                      const isCompleted = completedProblems.has(problem.url);
                      return (
                        <TableRow key={problem.id} className={isCompleted ? "bg-green-500/5 hover:bg-green-500/10" : ""}>
                          {(user && !isPrivileged) && (
                            <TableCell className="text-center">
                              <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex">
                                      <Checkbox
                                        checked={isCompleted}
                                        disabled={isCompleted}
                                        onCheckedChange={() => handleToggleProblem(problem.url)}
                                        className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 translate-y-[2px]"
                                      />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-xs">
                                    <p>{isCompleted ? t('roadmap.tooltip.completed') : t('roadmap.tooltip.markSolved')}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="flex flex-col">
                              <a className="font-medium">{problem.title}</a>
                              <span className="text-xs text-muted-foreground">{problem.platform}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant="outline" 
                              className={getDifficultyColor(problem.difficulty_ar)}
                            >
                              {getDifficultyText(problem.difficulty_ar, problem.difficulty_en)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <a
                              href={problem.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex p-2 rounded-lg hover:primary transition-colors"
                            >
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            </a>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
