import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWalletStore } from '../stores/walletStore';
import { CONTRACT_ADDRESSES } from '../constants/config';
import toast from 'react-hot-toast';

const PaymentConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    address, 
    usdtBalance, 
    approveUSDT, 
    checkUSDTAllowance, 
    createPayment 
  } = useWalletStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState('approval'); // 'approval' | 'payment' | 'complete'
  const [allowance, setAllowance] = useState('0');
  const [needsApproval, setNeedsApproval] = useState(true);

  // Get product data from navigation state
  const { product, amount, merchantAddress } = location.state || {};

  // Platform fee calculation (1%)
  const platformFeePercent = 1;
  const platformFee = amount * (platformFeePercent / 100);
  const merchantAmount = amount - platformFee;

  useEffect(() => {
    if (!product || !amount || !merchantAddress) {
      toast.error('Invalid payment data');
      navigate('/merchants');
      return;
    }

    checkAllowance();
  }, [product, amount, merchantAddress]);

  const checkAllowance = async () => {
    try {
      const currentAllowance = await checkUSDTAllowance(CONTRACT_ADDRESSES.PAYMENT_ESCROW);
      setAllowance(currentAllowance);
      setNeedsApproval(parseFloat(currentAllowance) < amount);
    } catch (error) {
      console.error('Failed to check allowance:', error);
    }
  };

  const handleApproval = async () => {
    try {
      setIsProcessing(true);
      setCurrentStep('approval');

      toast.loading('Requesting USDT approval...', { id: 'approval' });

      const tx = await approveUSDT(CONTRACT_ADDRESSES.PAYMENT_ESCROW, amount);
      
      toast.loading('Waiting for approval confirmation...', { id: 'approval' });
      await tx.wait();

      toast.success('USDT approved successfully!', { id: 'approval' });
      
      // Recheck allowance
      await checkAllowance();
      
      if (!needsApproval) {
        setCurrentStep('payment');
      }
    } catch (error) {
      console.error('Approval failed:', error);
      toast.error(error.message || 'Approval failed', { id: 'approval' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      setCurrentStep('payment');

      // Generate unique order ID
      const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      toast.loading('Creating payment...', { id: 'payment' });

      const tx = await createPayment(
        merchantAddress,
        amount,
        orderId,
        `Payment for ${product.name}`
      );

      toast.loading('Confirming payment...', { id: 'payment' });
      const receipt = await tx.wait();

      toast.success('Payment created successfully!', { id: 'payment' });

      // Navigate to success page with payment details
      navigate('/payment/success', {
        state: {
          paymentId: receipt.events?.find(e => e.event === 'PaymentCreated')?.args?.paymentId?.toString(),
          product,
          amount,
          orderId,
          txHash: receipt.transactionHash
        }
      });

    } catch (error) {
      console.error('Payment failed:', error);
      toast.error(error.message || 'Payment failed', { id: 'payment' });
      setCurrentStep('approval');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveAndPay = async () => {
    if (needsApproval) {
      await handleApproval();
      // After approval, automatically proceed to payment
      if (!needsApproval) {
        setTimeout(() => handlePayment(), 1000);
      }
    } else {
      await handlePayment();
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No product selected</p>
          <button onClick={() => navigate('/merchants')} className="btn-primary mt-4">
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/merchants')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Payment Confirmation</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 max-w-md mx-auto">
        {/* Product Summary */}
        <div className="card mb-6">
          <div className="flex items-center space-x-4">
            <div className="text-4xl">{product.image}</div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-500">{product.description}</p>
              <p className="text-sm text-gray-500">LINE Café</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">{amount.toFixed(2)}</p>
              <p className="text-sm text-gray-500">USDT</p>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="card mb-6">
          <h4 className="font-semibold text-gray-900 mb-4">Payment Details</h4>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">{amount.toFixed(2)} USDT</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Platform Fee ({platformFeePercent}%)</span>
              <span className="text-gray-900">{platformFee.toFixed(2)} USDT</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Merchant Receives</span>
              <span className="text-gray-900">{merchantAmount.toFixed(2)} USDT</span>
            </div>
            
            <div className="line-divider my-3"></div>
            
            <div className="flex justify-between font-semibold">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">{amount.toFixed(2)} USDT</span>
            </div>
          </div>
        </div>

        {/* Escrow Information */}
        <div className="card mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Escrowed Release</h4>
              <p className="text-sm text-blue-700 leading-relaxed">
                Your payment will be held securely in escrow until the merchant confirms delivery. 
                You can request a refund if needed.
              </p>
            </div>
          </div>
        </div>

        {/* Balance Check */}
        <div className="card mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Your USDT Balance</span>
            <span className={`font-semibold ${
              parseFloat(usdtBalance) >= amount ? 'text-green-600' : 'text-red-600'
            }`}>
              {parseFloat(usdtBalance || '0').toFixed(2)} USDT
            </span>
          </div>
          
          {parseFloat(usdtBalance) < amount && (
            <div className="mt-3 p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-700">Insufficient balance for this payment</p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="space-y-4">
          <button
            onClick={handleApproveAndPay}
            disabled={isProcessing || parseFloat(usdtBalance) < amount}
            className="w-full btn-primary h-14 text-lg font-semibold"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center space-x-3">
                <div className="w-5 h-5 loading-spinner"></div>
                <span>
                  {currentStep === 'approval' && 'Approving USDT...'}
                  {currentStep === 'payment' && 'Creating Payment...'}
                </span>
              </div>
            ) : needsApproval ? (
              'Approve & Pay'
            ) : (
              'Pay Now'
            )}
          </button>

          {/* Step indicator */}
          {(needsApproval || isProcessing) && (
            <div className="flex justify-center space-x-8 text-xs">
              <div className={`flex items-center space-x-2 ${
                currentStep === 'approval' ? 'text-line-green' : 'text-gray-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  currentStep === 'approval' ? 'bg-line-green' : 'bg-gray-300'
                }`}></div>
                <span>Approve</span>
              </div>
              
              <div className={`flex items-center space-x-2 ${
                currentStep === 'payment' ? 'text-line-green' : 'text-gray-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  currentStep === 'payment' ? 'bg-line-green' : 'bg-gray-300'
                }`}></div>
                <span>Pay</span>
              </div>
            </div>
          )}

          {/* Cancel button */}
          <button
            onClick={() => navigate('/merchants')}
            disabled={isProcessing}
            className="w-full btn-secondary"
          >
            Cancel
          </button>
        </div>

        {/* Security info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
            <span>Secured by Kaia blockchain smart contracts</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmation;