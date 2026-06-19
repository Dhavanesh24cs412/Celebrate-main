import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState = ({ message = 'Loading...' }: { message?: string }) => {
  return (
    <div className="min-h-screen bg-[#FFF8F5] flex flex-col items-center justify-center p-4">
      <Loader2 className="w-12 h-12 text-[#5B2A86] animate-spin mb-4" />
      <p className="text-[#1F2937] font-medium font-inter">{message}</p>
    </div>
  );
};
