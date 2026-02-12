import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LevelBadgeProps {
  level: number;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LevelBadge({ level, className, showIcon = true, size = 'md' }: LevelBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-0.5',
    lg: 'text-base px-2.5 py-1'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4'
  };

  // Color based on level tier
  const getLevelColor = () => {
    if (level >= 50) return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    if (level >= 25) return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
    if (level >= 10) return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    return 'bg-primary/10 text-primary border-primary/20';
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-semibold gap-1',
        getLevelColor(),
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Star className={iconSizes[size]} />}
      <span>{level}</span>
    </Badge>
  );
}
