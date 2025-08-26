import React from 'react';

const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-line-green to-green-600 flex items-center justify-center p-4">
      <div className="text-center">
        {/* Logo */}
        <div className="w-20 h-20 mx-auto mb-6 bg-white rounded-full flex items-center justify-center shadow-lg animate-pulse-slow">
          <div className="w-12 h-12 bg-line-green rounded-full flex items-center justify-center">
            <span className="text-xl font-bold text-white">K</span>
          </div>
        </div>

        {/* App Name */}
        <h1 className="text-2xl font-bold text-white mb-6 animate-fade-in">
          LINEPayUSDT
        </h1>

        {/* Loading Spinner */}
        <div className="w-8 h-8 mx-auto mb-4">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>

        {/* Loading Message */}
        <p className="text-white opacity-90 text-sm animate-fade-in">
          {message}
        </p>

        {/* Progress dots */}
        <div className="flex justify-center space-x-1 mt-6">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;