import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLiffStore } from '../stores/liffStore';
import toast from 'react-hot-toast';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { createShareContent, shareTargetPicker, isInClient } = useLiffStore();

  const { paymentId, product, amount, orderId, txHash } = location.state || {};

  useEffect(() => {
    if (!paymentId || !product) {
      navigate('/merchants');
    }
  }, [paymentId, product, navigate]);

  const handleShare = async () => {
    try {
      if (isInClient) {
        const shareContent = createShareContent({
          id: paymentId,
          amount: amount,
          orderId: orderId,
          released: false // Payment just created, not released yet
        });
        
        await shareTargetPicker(shareContent);
        toast.success('Receipt shared successfully!');
      } else {
        // Fallback for non-LINE clients
        const shareText = `I just made a payment of ${amount} USDT using LINEPayUSDT! Order: ${orderId}`;
        if (navigator.share) {
          await navigator.share({
            title: 'LINEPayUSDT Payment Receipt',
            text: shareText,
            url: window.location.origin
          });
        } else {
          // Copy to clipboard fallback
          await navigator.clipboard.writeText(shareText);
          toast.success('Receipt details copied to clipboard!');
        }
      }
    } catch (error) {
      console.error('Share failed:', error);
      toast.error('Failed to share receipt');
    }
  };

  const handleViewOnExplorer = () => {
    const explorerUrl = `https://baobab.klaytnscope.com/tx/${txHash}`;
    window.open(explorerUrl, '_blank');
  };

  if (!paymentId || !product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-8 max-w-md mx-auto">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center animate-scale-in">
            <svg className="w-10 h-10 text-line-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Released</h1>
          <p className="text-gray-600 text-center">
            Your payment has been successfully processed and held in escrow
          </p>
        </div>

        {/* Payment Receipt */}
        <div className="card mb-6">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Payment Receipt</h2>
            <p className="text-sm text-gray-500">Order #{orderId}</p>
          </div>

          {/* Product Details */}
          <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="text-3xl">{product.image}</div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-500">{product.description}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">{amount.toFixed(2)}</p>
              <p className="text-sm text-gray-500">USDT</p>
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Payment ID</span>
              <span className="text-gray-900 font-mono">#{paymentId}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Status</span>
              <span className="badge-warning">Escrowed</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Amount</span>
              <span className="text-gray-900 font-semibold">{amount.toFixed(2)} USDT</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Merchant</span>
              <span className="text-gray-900">LINE Café</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Date</span>
              <span className="text-gray-900">{new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Transaction Hash */}
          <button
            onClick={handleViewOnExplorer}
            className="w-full p-3 bg-blue-50 rounded-xl text-left hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">View on Blockchain</p>
                <p className="text-xs text-blue-600 font-mono truncate">{txHash}</p>
              </div>
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          </button>
        </div>

        {/* Next Steps */}
        <div className="card mb-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">What happens next?</h3>
          <div className="space-y-2 text-sm text-blue-700">
            <div className="flex items-start space-x-2">
              <span className="text-blue-500 mt-1">1.</span>
              <span>Your payment is safely held in escrow</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-500 mt-1">2.</span>
              <span>Merchant will prepare and deliver your order</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-500 mt-1">3.</span>
              <span>Payment is automatically released after delivery</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-500 mt-1">4.</span>
              <span>You can request a refund if there are any issues</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleShare}
            className="w-full btn-primary"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            Share Receipt
          </button>

          <button
            onClick={() => navigate('/merchants')}
            className="w-full btn-outline"
          >
            Continue Shopping
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full btn-secondary"
          >
            View Payment History
          </button>
        </div>

        {/* Support */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-2">Need help with your order?</p>
          <button
            onClick={() => toast.info('Support feature coming soon!')}
            className="text-sm text-line-green hover:text-green-600 font-medium"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;