import React, { useEffect, useState, useMemo } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Flame, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  buildHeatmapGrid,
  getMonthLabels,
  getMonthNameEn,
  computeMaxStreak,
  computeMaxStreakInRange,
  getAvailableYears,
  formatDateISO,
} from '@/utils/streak';

export interface StreakHeatmapProps {
  className?: string;
  userId?: string;
  userCreatedAt?: string;
}

export default function StreakHeatmap({ className, userId, userCreatedAt }: StreakHeatmapProps) {
  const { t, dir, lang } = useI18n();
  const { user, profile } = useAuth();
  
  // Use provided userId/userCreatedAt or fall back to current user
  const targetUserId = userId || user?.id;
  const targetCreatedAt = userCreatedAt || profile?.created_at;
  
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [activityMap, setActivityMap] = useState<Map<string, number>>(new Map());
  const [allActivityDays, setAllActivityDays] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get available years based on user registration
  const availableYears = useMemo(() => {
    if (!targetCreatedAt) return [new Date().getFullYear()];
    return getAvailableYears(targetCreatedAt);
  }, [targetCreatedAt]);
  
  // Fetch activity days for selected year
  useEffect(() => {
    const fetchActivityDays = async () => {
      if (!targetUserId) return;
      
      setIsLoading(true);
      try {
        const startOfYear = `${selectedYear}-01-01`;
        const endOfYear = `${selectedYear}-12-31`;
        
        // Fetch algorithm completions (10 points each)
        const { data: algoData, error: algoError } = await supabase
          .from('algorithm_completions')
          .select('completed_at')
          .eq('user_id', targetUserId)
          .gte('completed_at', startOfYear)
          .lte('completed_at', endOfYear);

        if (algoError) throw algoError;

        // Fetch problem completions (2 points each)
        const { data: probData, error: probError } = await supabase
          .from('algorithm_problem_completions')
          .select('completed_at')
          .eq('user_id', targetUserId)
          .gte('completed_at', startOfYear)
          .lte('completed_at', endOfYear);
          
        if (probError) throw probError;
        
        const map = new Map<string, number>();

        // Process algorithm completions
        algoData?.forEach(item => {
          const date = item.completed_at.split('T')[0];
          map.set(date, (map.get(date) || 0) + 10);
        });

        // Process problem completions
        probData?.forEach(item => {
          const date = item.completed_at.split('T')[0];
          map.set(date, (map.get(date) || 0) + 2);
        });

        setActivityMap(map);
      } catch (error) {
        console.error('Error fetching activity days:', error);
        setActivityMap(new Map());
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchActivityDays();
  }, [targetUserId, selectedYear]);
  
  // Fetch all activity days for overall streak calculation
  // We still use user_activity_days for the overall streak because it is efficient
  useEffect(() => {
    const fetchAllActivityDays = async () => {
      if (!targetUserId) return;
      
      try {
        const { data, error } = await supabase
          .from('user_activity_days')
          .select('day')
          .eq('user_id', targetUserId);
        
        if (error) throw error;
        
        setAllActivityDays(data?.map(d => d.day) || []);
      } catch (error) {
        console.error('Error fetching all activity days:', error);
        setAllActivityDays([]);
      }
    };
    
    fetchAllActivityDays();
  }, [targetUserId]);
  
  // Build heatmap grid
  const heatmapGrid = useMemo(() => buildHeatmapGrid(selectedYear, activityMap), [selectedYear, activityMap]);
  const monthLabels = useMemo(() => getMonthLabels(selectedYear), [selectedYear]);
  
  // Calculate streak metrics
  const maxStreakOverall = useMemo(() => computeMaxStreak(allActivityDays), [allActivityDays]);
  
  // Calculate max streak for the current month (not past month)
  const maxStreakThisMonth = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed (0 = January)
    
    // Get first day of current month
    const start = new Date(currentYear, currentMonth, 1);
    // Get last day of current month
    const end = new Date(currentYear, currentMonth + 1, 0);
    
    return computeMaxStreakInRange(
      allActivityDays, 
      formatDateISO(start), 
      formatDateISO(end)
    );
  }, [allActivityDays]);
  
  // Day of week labels
  const dayLabels = lang === 'ar' 
    ? ['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Helper to get color class based on level
  const getColorClass = (level: number) => {
    switch (level) {
      case 0: return "bg-muted dark:bg-muted/50";
      case 1: return "bg-emerald-200 dark:bg-emerald-800";
      case 2: return "bg-emerald-400 dark:bg-emerald-600";
      case 3: return "bg-emerald-600 dark:bg-emerald-400";
      default: return "bg-muted dark:bg-muted/50";
    }
  };
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            {t('dashboard.streak.title')}
          </CardTitle>
          
          <Select
            value={String(selectedYear)}
            onValueChange={(val) => setSelectedYear(Number(val))}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={String(year)} className='dash-item' style={{cursor: 'pointer'}}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Streak Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-lg p-4 border border-orange-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">{t('dashboard.streak.maxOverall')}</span>
            </div>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {maxStreakOverall} <span className="text-sm font-normal">{t('dashboard.streak.days')}</span>
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-lg p-4 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-muted-foreground">{t('dashboard.streak.maxThisMonth')}</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {maxStreakThisMonth} <span className="text-sm font-normal">{t('dashboard.streak.days')}</span>
            </p>
          </div>
        </div>
        
        {/* Heatmap Grid */}
        <div className="overflow-x-auto pb-2 scrollbar-thin">
          <TooltipProvider delayDuration={100}>
            <div className="min-w-max">
              {/* Month Labels */}
              <div className="flex mb-2" style={{ paddingInlineStart: '32px' }}>
                {monthLabels.map((m, idx) => {
                  // Calculate the width for this month
                  const nextMonth = monthLabels[idx + 1];
                  const weeksSpan = nextMonth 
                    ? nextMonth.weekIndex - m.weekIndex 
                    : heatmapGrid.length - m.weekIndex;
                  
                  return (
                    <div 
                      key={m.month}
                      className="text-xs text-muted-foreground"
                      style={{ 
                        width: `${weeksSpan * 14}px`,
                        minWidth: weeksSpan > 2 ? 'auto' : '0px',
                        overflow: 'hidden',
                      }}
                    >
                      {weeksSpan > 2 && (lang === 'ar' ? m.name : getMonthNameEn(m.month))}
                    </div>
                  );
                })}
              </div>
              
              {/* Grid with day labels */}
              <div className="flex">
                {/* Day of week labels */}
                <div className="flex flex-col gap-[2px] me-1" style={{ paddingTop: '0px' }}>
                  {dayLabels.map((label, i) => (
                    <div 
                      key={i} 
                      className="h-[12px] text-[9px] text-muted-foreground flex items-center justify-end"
                      style={{ width: '24px' }}
                    >
                      {i % 2 === 1 ? label : ''}
                    </div>
                  ))}
                </div>
                
                {/* Weeks */}
                <div className="flex gap-[2px]">
                  {heatmapGrid.map((week) => (
                    <div key={week.weekIndex} className="flex flex-col gap-[2px]">
                      {week.cells.map((cell, dayIdx) => {
                        if (!cell) {
                          return (
                            <div 
                              key={dayIdx} 
                              className="w-[12px] h-[12px]"
                            />
                          );
                        }
                        
                        return (
                          <Tooltip key={cell.date}>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  "w-[12px] h-[12px] rounded-[2px] transition-colors cursor-default",
                                  getColorClass(cell.level)
                                )}
                              />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              <p className="font-medium">{cell.date}</p>
                              <p className={cell.isActive ? "text-emerald-500" : "text-muted-foreground"}>
                                {cell.isActive 
                                  ? `${cell.count} ${t('profile.points', 'points')}` 
                                  : t('dashboard.streak.inactive')}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
                <span>{t('dashboard.streak.less')}</span>
                <div className="flex gap-[2px]">
                  <div className={cn("w-[12px] h-[12px] rounded-[2px]", getColorClass(0))} />
                  <div className={cn("w-[12px] h-[12px] rounded-[2px]", getColorClass(1))} />
                  <div className={cn("w-[12px] h-[12px] rounded-[2px]", getColorClass(2))} />
                  <div className={cn("w-[12px] h-[12px] rounded-[2px]", getColorClass(3))} />
                </div>
                <span>{t('dashboard.streak.more')}</span>
              </div>
            </div>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}