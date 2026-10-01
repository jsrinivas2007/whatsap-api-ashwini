import React, { ButtonHTMLAttributes } from 'react';
import { ButtonLoader } from './Loader';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 rounded-[8px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50';

  const variants = {
    primary:
      'bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm',
    secondary:
      'bg-secondary text-secondary-foreground hover:bg-secondary/80 font-semibold',
    outline:
      'border border-border bg-card text-foreground hover:bg-muted font-medium',
    ghost:
      'text-foreground hover:bg-muted font-medium',
  };

  const sizes = {
    sm: 'h-8 px-3 text-[12px]',
    md: 'h-10 px-6 text-[13px]',
    lg: 'h-12 px-8 text-[15px]',
  };

  const styles = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button className={styles} disabled={disabled || isLoading} {...props}>
      {isLoading && <ButtonLoader className={variant === 'primary' ? 'text-primary-foreground' : 'text-foreground'} />}
      {children}
    </button>
  );
}
