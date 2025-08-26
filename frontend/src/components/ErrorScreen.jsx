import React from 'react';
import { useNavigate } from 'react-router-dom';

const ErrorScreen = ({ 
  error = 'An unexpected error occurred', 
  onRetry,
  showTopUp = false,
  title = 'Oops!',
  type = 'general' // 'general', 'insufficient_balance', 'network', 'wallet'
}) => {
  const navigate = useNavigate();

  const getErrorIcon = () => {
    switch (type) {
      case 'insufficient_balance':
        return (
          <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'network':
        return (
          <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536M9.172 9.172L5.636 5.636M15.536 15.536l3.536 3.536M4.222 4.222l15.556 15.556M12 2v4m0 12v4m10-10h-4M6 12H2" />
          </svg>
        );
      case 'wallet':
        return (
          <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
    }
  };

  const getErrorActions = () => {
    switch (type) {
      case 'insufficient_balance':
        return (
          <div className="space-y-3">
            <button
              onClick={() => {/* TODO: Implement top-up */}}
              className="w-full btn-primary"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Top Up USDT
            </button>
            <button
              onClick={() => navigate('/merchants')}
              className="w-full btn-secondary"
            >
              Back to Products
            </button>
          </div>
        );
      case 'network':
        return (
          <div className="space-y-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full btn-primary"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Switch Network
              </button>
            )}
            <button
              onClick={() => navigate('/')}
              className="w-full btn-secondary"
            >
              Go Home
            </button>
          </div>
        );
      case 'wallet':
        return (
          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full btn-primary"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Connect Wallet
            </button>
          </div>
        );
      default:
        return (
          <div className="space-y-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full btn-primary"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
            )}
            <button
              onClick={() => navigate('/')}
              className="w-full btn-secondary"
            >
              Go Home
            </button>
          </div>
        );
    }
  };

  // Special case for insufficient balance
  if (type === 'insufficient_balance') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            {/* Error Icon */}
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            
            {/* Title */}
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Insufficient USDT Balance
            </h2>
            
            {/* Error Message */}
            <p className="text-gray-600 mb-6 leading-relaxed">
              You don't have enough USDT in your wallet for this payment. Please top up your balance to continue.
            </p>

            {/* Top Up Info */}
            <div className="mb-6 p-4 bg-blue-50 rounded-xl text-left">
              <h4 className="font-medium text-blue-900 mb-2">How to get USDT:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Transfer from another wallet</li>
                <li>• Buy from a crypto exchange</li>
                <li>• Use a fiat on-ramp service</li>
              </ul>
            </div>

            {getErrorActions()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          {/* Error Icon */}
          <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            {getErrorIcon()}
          </div>
          
          {/* Title */}
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            {title}
          </h2>
          
          {/* Error Message */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            {error}
          </p>

          {/* Actions */}
          {getErrorActions()}

          {/* Help Link */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-2">Still having trouble?</p>
            <button
              onClick={() => {/* TODO: Implement support */}}
              className="text-sm text-line-green hover:text-green-600 font-medium"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorScreen;