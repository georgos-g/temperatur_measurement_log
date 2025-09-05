import { cn } from '@/lib/utils';
import * as React from 'react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] transform',
          {
            'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md':
              variant === 'default',
            'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-md':
              variant === 'destructive',
            'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:shadow-sm':
              variant === 'outline',
            'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-sm':
              variant === 'secondary',
            'hover:bg-accent hover:text-accent-foreground hover:scale-[1.02]':
              variant === 'ghost',
            'text-primary underline-offset-4 hover:underline hover:text-primary/80':
              variant === 'link',
          },
          {
            'h-9 px-4 py-2': size === 'default',
            'h-8 rounded-md px-3 text-xs': size === 'sm',
            'h-10 rounded-md px-8': size === 'lg',
            'h-9 w-9': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
