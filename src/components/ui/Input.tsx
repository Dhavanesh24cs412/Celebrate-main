import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-text font-inter">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full bg-white border ${error ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-primary focus:ring-primary/20'} rounded-[12px] px-4 py-3 text-base font-inter text-text placeholder-gray-400 outline-none transition-all duration-200 focus:ring-4 ${className}`}
          {...props}
        />
        {error && <span className="text-sm text-red-500 font-inter">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
