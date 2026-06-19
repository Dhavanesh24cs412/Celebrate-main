import React from 'react';

export const Card = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div 
      className={`bg-surface rounded-[16px] shadow-sm border border-gray-100 overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
