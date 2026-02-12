import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LevelBadge } from '@/components/ui/level-badge';
import { cn } from '@/lib/utils';

interface LeaderboardCardProps {
  rank: number;
  username: string;
  avatarUrl: string | null;
  primaryValue: string | number;
  primaryLabel: string;
  secondaryValue?: string | number;
  secondaryLabel?: string;
  isPositive?: boolean;
  level?: number;
  points?: number;
  className?: string;
}

export default function LeaderboardCard({
  rank,
  username,
  avatarUrl,
  primaryValue,
  primaryLabel,
  secondaryValue,
  secondaryLabel,
  isPositive,
  level,
  points,
  className,
}: LeaderboardCardProps) {
  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
    if (rank === 2) return 'bg-gray-400/20 text-gray-600 dark:text-gray-300 border-gray-400/30';
    if (rank === 3) return 'bg-amber-600/20 text-amber-700 dark:text-amber-400 border-amber-600/30';
    return 'bg-muted text-muted-foreground border-border';
  };

  // Calculate level from points if not provided - only show if we have valid points data
  // Points must be > 0 to show a meaningful level (otherwise everyone shows level 1)
  const displayLevel = level ?? (points && points > 0 ? Math.floor(points / 100) + 1 : undefined);
  
  return (
    <Link
      to={`/u/${username}`}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors",
        className
      )}
    >
      {/* Rank Badge */}
      <Badge 
        variant="outline" 
        className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm p-0", getRankBadge(rank))}
      >
        {rank}
      </Badge>
      
      {/* Avatar */}
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={avatarUrl || ''} />
        <AvatarFallback>{username?.[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>
      
      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{username}</p>
          {displayLevel !== undefined && <LevelBadge level={displayLevel} size="sm" />}
        </div>
        {secondaryValue !== undefined && secondaryLabel && (
          <p className="text-xs text-muted-foreground">
            {secondaryLabel}: {secondaryValue}
          </p>
        )}
      </div>
      
      {/* Primary Value */}
      <div className="text-end shrink-0">
        <p className={cn(
          "font-bold text-lg",
          isPositive === true && "text-emerald-600 dark:text-emerald-400",
          isPositive === false && "text-destructive",
          isPositive === undefined && "text-primary"
        )}>
          {isPositive !== undefined && typeof primaryValue === 'number' && primaryValue >= 0 ? '+' : ''}
          {primaryValue}
        </p>
        <p className="text-xs text-muted-foreground">{primaryLabel}</p>
      </div>
    </Link>
  );
}
