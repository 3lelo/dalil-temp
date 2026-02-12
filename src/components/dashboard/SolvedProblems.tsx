import React, { useState, useMemo, useEffect } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { useSolvedProblems } from '@/hooks/useSolvedProblems';
import { getDifficultyColor } from '@/hooks/useAlgorithms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle2, ExternalLink, Filter, Compass, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface SolvedProblemsProps {
  userId?: string;
  className?: string;
}

const ITEMS_PER_PAGE = 10;

export function SolvedProblems({ userId, className }: SolvedProblemsProps) {
  const { t, lang, dir } = useI18n();
  const { problems, platforms, algorithms, isLoading } = useSolvedProblems(userId);
  
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [algorithmFilter, setAlgorithmFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredProblems = useMemo(() => {
    return problems.filter(p => {
      if (platformFilter !== 'all' && p.problem_platform !== platformFilter) {
        return false;
      }
      if (algorithmFilter !== 'all' && p.algorithm_id !== algorithmFilter) {
        return false;
      }
      return true;
    });
  }, [problems, platformFilter, algorithmFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [platformFilter, algorithmFilter]);

  const totalPages = Math.ceil(filteredProblems.length / ITEMS_PER_PAGE);
  const paginatedProblems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProblems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProblems, currentPage]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: lang === 'ar' ? ar : enUS,
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-12 flex justify-center">
          <Compass className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            {t('dashboard.solvedProblems')}
            <Badge variant="secondary" className="ms-2">
              {filteredProblems.length}
            </Badge>
          </CardTitle>
          
          {problems.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground" />
              
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="w-[140px] h-8 text-sm">
                  <SelectValue placeholder={t('dashboard.filterPlatform')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className='dash-item' style={{cursor: 'pointer'}}>{t('dashboard.allPlatforms')}</SelectItem>
                  {platforms.map(platform => (
                    <SelectItem key={platform} value={platform} className='dash-item' style={{cursor: 'pointer'}}>
                      {platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={algorithmFilter} onValueChange={setAlgorithmFilter}>
                <SelectTrigger className="w-[160px] h-8 text-sm">
                  <SelectValue placeholder={t('dashboard.filterAlgorithm')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className='dash-item' style={{cursor: 'pointer'}}>{t('dashboard.allAlgorithms')}</SelectItem>
                  {algorithms.map(algo => (
                    <SelectItem key={algo.id} value={algo.id} className='dash-item' style={{cursor: 'pointer'}}>
                      {lang === 'ar' ? algo.title_ar : algo.title_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {problems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>{t('dashboard.noSolvedProblems')}</p>
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Filter className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>{t('dashboard.noMatchingProblems')}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('dashboard.problemTitle')}</TableHead>
                    <TableHead>{t('dashboard.platform')}</TableHead>
                    <TableHead>{t('dashboard.algorithm')}</TableHead>
                    <TableHead>{t('dashboard.difficulty')}</TableHead>
                    <TableHead className={dir === 'rtl' ? 'text-left' : 'text-right'}>
                      {t('dashboard.completedAt')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProblems.map(problem => (
                    <TableRow key={problem.id}>
                      <TableCell className="font-medium">
                        <a
                          href={problem.problem_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          {problem.problem_title}
                          <ExternalLink className="h-3 w-3 opacity-50" />
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{problem.problem_platform}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {lang === 'ar' ? problem.algorithm_title_ar : problem.algorithm_title_en}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getDifficultyColor(
                            lang === 'ar' ? problem.problem_difficulty_ar : problem.problem_difficulty_en
                          )}
                        >
                          {lang === 'ar' ? problem.problem_difficulty_ar : problem.problem_difficulty_en}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-sm text-muted-foreground ${dir === 'rtl' ? 'text-left' : 'text-right'}`}>
                        {formatDate(problem.completed_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {paginatedProblems.map(problem => (
                <div
                  key={problem.id}
                  className="border rounded-lg p-4 bg-card"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <a
                      href={problem.problem_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      {problem.problem_title}
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </a>
                    <Badge
                      variant="outline"
                      className={getDifficultyColor(
                        lang === 'ar' ? problem.problem_difficulty_ar : problem.problem_difficulty_en
                      )}
                    >
                      {lang === 'ar' ? problem.problem_difficulty_ar : problem.problem_difficulty_en}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">{problem.problem_platform}</Badge>
                    <span>•</span>
                    <span>{lang === 'ar' ? problem.algorithm_title_ar : problem.algorithm_title_en}</span>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDate(problem.completed_at)}
                  </p>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.showingPage', 'الصفحة {{current}} من {{total}}'
                    .replace('{{current}}', String(currentPage))
                    .replace('{{total}}', String(totalPages)))}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-md border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label={t('dashboard.previousPage', 'الصفحة السابقة')}
                  >
                    {dir === 'rtl' ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                  </button>
                  <span className="text-sm font-medium min-w-[3rem] text-center">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-md border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label={t('dashboard.nextPage', 'الصفحة التالية')}
                  >
                    {dir === 'rtl' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
