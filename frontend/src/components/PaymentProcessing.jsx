import React from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentProcessing = ({ 
  step = 'approval', // 'approval' | 'payment' | 'confirmation'
  progress = 0 
}) => {
  const navigate = useNavigate();

  const steps = [
    { id: 'approval', label: 'Approving USDT', description: 'Authorizing token spend' },
    { id: 'payment', label: 'Creating Payment', description: 'Processing transaction' },
    { id: 'confirmation', label: 'Confirming', description: 'Waiting for blockchain confirmation' }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          {/* Animated Logo */}
          <div className="w-20 h-20 mx-auto mb-6 bg-line-green rounded-full flex items-center justify-center animate-pulse-slow">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-line-green">K</span>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Processing Payment
          </h2>
          
          <p className="text-gray-600 mb-8">
            Please wait while we process your transaction
          </p>

          {/* Progress Steps */}
          <div className="space-y-4 mb-8">
            {steps.map((stepItem, index) => {
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;
              
              return (
                <div key={stepItem.id} className="flex items-center space-x-4">
                  {/* Step Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCompleted 
                      ? 'bg-line-green text-white' 
                      : isActive 
                        ? 'bg-line-green text-white' 
                        : 'bg-gray-200 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : isActive ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 text-left">
                    <p className={`font-medium ${
                      isActive ? 'text-line-green' : isCompleted ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {stepItem.label}
                    </p>
                    <p className="text-sm text-gray-500">{stepItem.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div 
              className="bg-line-green h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStepIndex + 1) * 33.33}%` }}
            ></div>
          </div>

          {/* Current Step Details */}
          {step === 'approval' && (
            <div className="p-4 bg-blue-50 rounded-xl text-left">
              <h4 className="font-medium text-blue-900 mb-2">USDT Approval</h4>
              <p className="text-sm text-blue-700">
                You need to approve the contract to spend your USDT tokens. This is a one-time approval for security.
              </p>
            </div>
          )}

          {step === 'payment' && (
            <div className="p-4 bg-green-50 rounded-xl text-left">
              <h4 className="font-medium text-green-900 mb-2">Creating Payment</h4>
              <p className="text-sm text-green-700">
                Your payment is being processed and will be held securely in escrow until delivery.
              </p>
            </div>
          )}

          {step === 'confirmation' && (
            <div className="p-4 bg-orange-50 rounded-xl text-left">
              <h4 className="font-medium text-orange-900 mb-2">Blockchain Confirmation</h4>
              <p className="text-sm text-orange-700">
                Waiting for the blockchain to confirm your transaction. This usually takes a few seconds.
              </p>
            </div>
          )}

          {/* Cancel Button (only show during approval) */}
          {step === 'approval' && (
            <button
              onClick={() => navigate('/merchants')}
              className="mt-6 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel Payment
            </button>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Don't close this window while processing
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessing;