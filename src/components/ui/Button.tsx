import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', fullWidth = false, children, ...props }, ref) => {
    const baseStyles = 'font-inter font-semibold rounded-[12px] transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-primary text-white hover:opacity-90 shadow-sm',
      secondary: 'bg-secondary text-primary hover:opacity-90',
      outline: 'bg-transparent border-2 border-primary text-primary hover:bg-primary/5',
      danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm'
    };

    const sizes = {
      sm: 'py-2 px-4 text-sm min-h-[40px]',
      md: 'py-3 px-6 text-base min-h-[48px]',
      lg: 'py-4 px-8 text-lg min-h-[56px]',
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
