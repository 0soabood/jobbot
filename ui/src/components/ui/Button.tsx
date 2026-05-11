import * as React from 'react';
import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-signal-green text-graphite-950 hover:bg-signal-green/90 glow-green active:scale-[0.98]',
      secondary: 'bg-burn-orange text-mercury hover:bg-burn-orange/90 glow-orange active:scale-[0.98]',
      outline: 'border border-graphite-700 bg-transparent hover:bg-graphite-800 text-mercury',
      ghost: 'bg-transparent hover:bg-graphite-800 text-mercury',
      danger: 'bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500/20',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
      icon: 'p-2',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
