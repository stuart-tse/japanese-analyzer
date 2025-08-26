'use client';

import React from 'react';
import { cn } from '../../utils/cn';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm',
          'ring-offset-surface placeholder:text-on-surface-variant',
          'focus:outline-none focus:ring-2 focus:ring-grammar-verb focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors duration-200',
          className
        )}
        style={{ 
          backgroundColor: 'var(--surface)', 
          borderColor: 'var(--outline)',
          color: 'var(--on-surface)'
        }}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };