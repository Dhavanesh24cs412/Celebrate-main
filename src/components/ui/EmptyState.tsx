import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({ title = 'No data found', message, children }: { title?: string, message?: string, children?: React.ReactNode }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-gray-100">
      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
        <Inbox className="w-6 h-6 text-gray-400" />
      </div>
      <h3 className="text-[#1F2937] font-semibold font-poppins mb-1">{title}</h3>
      {message && <p className="text-gray-500 text-sm font-inter mb-4">{message}</p>}
      {children}
    </div>
  );
};
