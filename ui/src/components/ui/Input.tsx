import * as React from 'react';
import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border border-graphite-700 bg-graphite-900 px-3 py-2 text-sm text-mercury ring-offset-graphite-950 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-steel focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-signal-green disabled:cursor-not-allowed disabled:opacity-50 transition-all',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[120px] w-full rounded-lg border border-graphite-700 bg-graphite-900 px-3 py-2 text-sm text-mercury ring-offset-graphite-950 placeholder:text-steel focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-signal-green disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-none',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
