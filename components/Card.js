'use client';

import { cn } from '@/lib/utils';

export function Card({ children, className, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-6 shadow-sm',
        hover && 'transition-all duration-200 hover:shadow-md hover:border-primary/50',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }) {
  return (
    <h3 className={cn('text-lg font-semibold text-foreground', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className, ...props }) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className, ...props }) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div className={cn('mt-4 pt-4 border-t border-border', className)} {...props}>
      {children}
    </div>
  );
}
