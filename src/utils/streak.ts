/**
 * Streak calculation utilities for GitHub-style heatmap
 */

export interface HeatmapCell {
  date: string; // ISO format YYYY-MM-DD
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  isActive: boolean;
  count: number;
  level: 0 | 1 | 2 | 3;
  isCurrentMonth?: boolean;
}

export interface HeatmapWeek {
  weekIndex: number;
  cells: (HeatmapCell | null)[];
}

/**
 * Build a heatmap grid for a given year
 * Returns an array of weeks, each containing 7 day cells (Sunday to Saturday)
 */
export function buildHeatmapGrid(year: number, activeDays: Map<string, number>): HeatmapWeek[] {
  const weeks: HeatmapWeek[] = [];

  // Start from January 1st of the year
  const startDate = new Date(year, 0, 1);
  // End at December 31st of the year
  const endDate = new Date(year, 11, 31);

  // Find the first Sunday on or before January 1st
  const firstSunday = new Date(startDate);
  firstSunday.setDate(startDate.getDate() - startDate.getDay());

  // Find the last Saturday on or after December 31st
  const lastSaturday = new Date(endDate);
  lastSaturday.setDate(endDate.getDate() + (6 - endDate.getDay()));

  let currentDate = new Date(firstSunday);
  let weekIndex = 0;

  while (currentDate <= lastSaturday) {
    const week: HeatmapWeek = {
      weekIndex,
      cells: [],
    };

    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const dateStr = formatDateISO(currentDate);
      const currentYear = currentDate.getFullYear();

      // Only include days that belong to the selected year
      if (currentYear === year) {
        const count = activeDays.get(dateStr) || 0;
        let level: 0 | 1 | 2 | 3 = 0;

        if (count > 0) {
          if (count <= 5) level = 1;
          else if (count <= 10) level = 2;
          else level = 3;
        }

        week.cells.push({
          date: dateStr,
          dayOfWeek,
          isActive: count > 0,
          count,
          level,
          isCurrentMonth: true,
        });
      } else {
        // Outside the year range - push null
        week.cells.push(null);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    weeks.push(week);
    weekIndex++;
  }

  return weeks;
}

/**
 * Get month labels with their starting week positions
 */
export function getMonthLabels(year: number): { month: number; name: string; weekIndex: number }[] {
  const months: { month: number; name: string; weekIndex: number }[] = [];

  const startDate = new Date(year, 0, 1);
  const firstSunday = new Date(startDate);
  firstSunday.setDate(startDate.getDate() - startDate.getDay());

  for (let month = 0; month < 12; month++) {
    const monthStart = new Date(year, month, 1);
    // Calculate week index based on days since first Sunday
    const daysDiff = Math.floor((monthStart.getTime() - firstSunday.getTime()) / (1000 * 60 * 60 * 24));
    const weekIndex = Math.floor(daysDiff / 7);

    months.push({
      month,
      name: getMonthName(month),
      weekIndex,
    });
  }

  return months;
}

/**
 * Get Arabic month name
 */
function getMonthName(month: number): string {
  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  return arabicMonths[month];
}

/**
 * Get English month name
 */
export function getMonthNameEn(month: number): string {
  const englishMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return englishMonths[month];
}

/**
 * Compute the maximum consecutive streak from an array of dates
 */
export function computeMaxStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  // Sort dates chronologically
  const sortedDates = [...dates].sort();

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);

    // Calculate difference in days
    const diffTime = currDate.getTime() - prevDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else if (diffDays > 1) {
      // Gap in dates, reset streak
      currentStreak = 1;
    }
    // diffDays === 0 means duplicate date, ignore
  }

  return maxStreak;
}

/**
 * Compute the maximum consecutive streak within a date range
 */
export function computeMaxStreakInRange(dates: string[], startISO: string, endISO: string): number {
  const startDate = new Date(startISO);
  const endDate = new Date(endISO);

  const filteredDates = dates.filter(d => {
    const date = new Date(d);
    return date >= startDate && date <= endDate;
  });

  return computeMaxStreak(filteredDates);
}

/**
 * Get the start and end of last calendar month
 */
export function getLastMonthRange(): { start: string; end: string } {
  const now = new Date();
  const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayLastMonth = new Date(firstDayCurrentMonth);
  lastDayLastMonth.setDate(lastDayLastMonth.getDate() - 1);
  const firstDayLastMonth = new Date(lastDayLastMonth.getFullYear(), lastDayLastMonth.getMonth(), 1);

  return {
    start: formatDateISO(firstDayLastMonth),
    end: formatDateISO(lastDayLastMonth),
  };
}

/**
 * Format a date as ISO string (YYYY-MM-DD)
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get years available for selection (from user created_at to current year)
 */
export function getAvailableYears(createdAt: string): number[] {
  const startYear = new Date(createdAt).getFullYear();
  const currentYear = new Date().getFullYear();
  const years: number[] = [];

  for (let year = currentYear; year >= startYear; year--) {
    years.push(year);
  }

  return years;
}
