import React from 'react';
import { Loader2 } from 'lucide-react';

const Loading = ({ fullScreen = false, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
        <div className="text-center">
          <Loader2 className={`${sizeClasses.xl} text-orange-500 animate-spin mx-auto`} />
          <p className="mt-4 text-dark-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center p-8">
      <Loader2 className={`${sizeClasses[size]} text-orange-500 animate-spin`} />
    </div>
  );
};

export default Loading;
