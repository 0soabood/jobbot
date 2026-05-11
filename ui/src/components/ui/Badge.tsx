import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps {
  variant?: 'default' | 'outline' | 'success' | 'warning' | 'orange';
  className?: string;
  children?: React.ReactNode;
}

export function Badge({ className, variant = 'default', children }: React.PropsWithChildren<BadgeProps>) {
  const variants = {
    default: 'bg-graphite-800 text-mercury border-transparent',
    outline: 'bg-transparent text-steel border-graphite-700',
    success: 'bg-signal-green/10 text-signal-green border-signal-green/20',
    warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    orange: 'bg-burn-orange/10 text-burn-orange border-burn-orange/20',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variants[variant],
        className
      )}
    >
      {children}
    </div>
  );
}
