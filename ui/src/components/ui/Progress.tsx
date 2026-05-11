import { cn } from '../../lib/utils';

export function ScoreBadge({ score, size = 'md', className }: { score: number; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const getColors = (s: number) => {
    if (s >= 90) return 'text-signal-green border-signal-green/30 bg-signal-green/5';
    if (s >= 75) return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5';
    return 'text-burn-orange border-burn-orange/30 bg-burn-orange/5';
  };

  const sizes = {
    sm: 'text-[10px] w-8 h-8',
    md: 'text-sm w-12 h-12',
    lg: 'text-xl w-16 h-16',
  };

  return (
    <div
      className={cn(
        'rounded-full border flex items-center justify-center font-display font-bold',
        getColors(score),
        sizes[size],
        className
      )}
    >
      {score}
    </div>
  );
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-1.5 w-full bg-graphite-800 rounded-full overflow-hidden', className)}>
      <div
        className="h-full bg-signal-green transition-all duration-500 ease-out"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
