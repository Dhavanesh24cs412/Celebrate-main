import React from 'react';
import { AlertCircle } from 'lucide-react';

export const ErrorState = ({ title = 'An error occurred', message, onRetry }: { title?: string, message?: string, onRetry?: () => void }) => {
  return (
    <div className="min-h-screen bg-[#FFF8F5] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-6 rounded-2xl shadow-sm max-w-sm w-full text-center">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-[#1F2937] mb-2 font-poppins">{title}</h3>
        {message && <p className="text-gray-500 mb-6 font-inter text-sm">{message}</p>}
        {onRetry && (
          <button 
            onClick={onRetry}
            className="w-full py-3 px-4 bg-[#5B2A86] text-white rounded-xl font-semibold font-inter hover:bg-[#4A226D] transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};
