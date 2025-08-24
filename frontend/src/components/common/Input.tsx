import React from 'react';
import { clsx } from 'clsx';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText, 
    required, 
    id, 
    ...props 
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    const baseClasses = 'flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-secondary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
    
    const variantClasses = error
      ? 'border-red-300 bg-red-50 focus-visible:ring-red-500'
      : 'border-secondary-300 bg-white focus-visible:ring-primary-500 hover:border-secondary-400';

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={inputId}
            className={clsx(
              'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
              error ? 'text-red-700' : 'text-secondary-700'
            )}
          >
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        
        <div className="relative">
          <input
            id={inputId}
            className={clsx(
              baseClasses,
              variantClasses,
              error && 'pr-10', // Make room for error icon
              className
            )}
            ref={ref}
            {...props}
          />
          
          {error && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <div className={clsx(
            'text-xs',
            error ? 'text-red-600' : 'text-secondary-500'
          )}>
            {error || helperText}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';