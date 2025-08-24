import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'white';
  text?: string;
  centered?: boolean;
}

export const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ 
    className, 
    size = 'md', 
    variant = 'primary', 
    text, 
    centered = false,
    ...props 
  }, ref) => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
      xl: 'h-12 w-12'
    };
    
    const variantClasses = {
      primary: 'text-primary-600',
      secondary: 'text-secondary-600',
      white: 'text-white'
    };
    
    const textSizeClasses = {
      sm: 'text-sm',
      md: 'text-sm',
      lg: 'text-base',
      xl: 'text-lg'
    };

    const containerClasses = clsx(
      'flex items-center',
      centered && 'justify-center',
      text ? 'space-x-2' : '',
      className
    );

    return (
      <div
        className={containerClasses}
        ref={ref}
        {...props}
      >
        <Loader2 
          className={clsx(
            'animate-spin',
            sizeClasses[size],
            variantClasses[variant]
          )} 
        />
        {text && (
          <span 
            className={clsx(
              'font-medium',
              textSizeClasses[size],
              variantClasses[variant]
            )}
          >
            {text}
          </span>
        )}
      </div>
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

// Full-screen loading overlay component
export interface LoadingOverlayProps {
  text?: string;
  variant?: 'primary' | 'secondary' | 'white';
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  text = 'Loading...', 
  variant = 'primary' 
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-4">
        <LoadingSpinner size="xl" variant={variant} />
        <p className={clsx(
          'text-lg font-medium',
          variant === 'primary' && 'text-primary-600',
          variant === 'secondary' && 'text-secondary-600',
          variant === 'white' && 'text-white'
        )}>
          {text}
        </p>
      </div>
    </div>
  );
};

// Inline loading state for content areas
export interface LoadingContentProps {
  text?: string;
  variant?: 'primary' | 'secondary' | 'white';
  className?: string;
}

export const LoadingContent: React.FC<LoadingContentProps> = ({ 
  text = 'Loading...', 
  variant = 'primary',
  className 
}) => {
  return (
    <div className={clsx('flex flex-col items-center justify-center py-12', className)}>
      <LoadingSpinner size="lg" variant={variant} />
      <p className={clsx(
        'mt-4 text-base font-medium',
        variant === 'primary' && 'text-primary-600',
        variant === 'secondary' && 'text-secondary-600',
        variant === 'white' && 'text-white'
      )}>
        {text}
      </p>
    </div>
  );
};