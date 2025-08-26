import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '../stores/walletStore';
import toast from 'react-hot-toast';

const MerchantDashboard = () => {
  const navigate = useNavigate();
  const { 
    address, 
    isConnected, 
    getMerchantPayments, 
    releasePayment,
    getUserPayments 
  } = useWalletStore();

  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received'); // 'received' | 'sent'
  const [processingPayments, setProcessingPayments] = useState(new Set());

  // Demo data matching the UX design
  const demoPayments = [
    {
      id: '1',
      payer: 'BDFF...3D22',
      merchant: address,
      amount: '2.50',
      orderId: 'Coffee',
      description: 'Premium coffee blend',
      createdAt: new Date('2024-08-26'),
      released: true,
      refunded: false,
      status: 'Released'
    },
    {
      id: '2',
      payer: 'Retrosk',
      merchant: address,
      amount: '3.10',
      orderId: 'Croissant',
      description: 'Fresh buttery croissant',
      createdAt: new Date('2024-08-25'),
      released: false,
      refunded: false,
      status: 'Pending'
    }
  ];

  useEffect(() => {
    if (isConnected && address) {
      loadPayments();
    }
  }, [isConnected, address, activeTab]);

  const loadPayments = async () => {
    try {
      setIsLoading(true);
      
      // For demo purposes, use static data
      // In production, this would fetch from the smart contract
      setPayments(demoPayments);
      
    } catch (error) {
      console.error('Failed to load payments:', error);
      toast.error('Failed to load payment history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReleasePayment = async (paymentId) => {
    try {
      setProcessingPayments(prev => new Set(prev).add(paymentId));
      
      toast.loading('Releasing payment...', { id: `release-${paymentId}` });
      
      const tx = await releasePayment(paymentId);
      await tx.wait();
      
      toast.success('Payment released successfully!', { id: `release-${paymentId}` });
      
      // Update local state
      setPayments(prev => prev.map(payment => 
        payment.id === paymentId 
          ? { ...payment, released: true, status: 'Released' }
          : payment
      ));
      
    } catch (error) {
      console.error('Failed to release payment:', error);
      toast.error('Failed to release payment', { id: `release-${paymentId}` });
    } finally {
      setProcessingPayments(prev => {
        const next = new Set(prev);
        next.delete(paymentId);
        return next;
      });
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (payment) => {
    if (payment.refunded) {
      return <span className="badge-error">Refunded</span>;
    }
    if (payment.released) {
      return <span className="badge-success">Released</span>;
    }
    return <span className="badge-warning">Pending</span>;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Wallet Not Connected</h2>
          <p className="text-gray-600 mb-4">Please connect your wallet to view dashboard</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/merchants')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500">Payment management</p>
              </div>
            </div>

            {/* Stats */}
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Payments</p>
              <p className="font-semibold text-gray-900">{payments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-100">
        <div className="px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('received')}
              className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'received'
                  ? 'border-line-green text-line-green'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Payments Received
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'sent'
                  ? 'border-line-green text-line-green'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Payments Sent
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card">
                <div className="animate-pulse">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
            <p className="text-gray-500 mb-6">
              {activeTab === 'received' 
                ? "You haven't received any payments yet" 
                : "You haven't made any payments yet"
              }
            </p>
            <button
              onClick={() => navigate('/merchants')}
              className="btn-primary"
            >
              {activeTab === 'received' ? 'Start Selling' : 'Make a Payment'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="card hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    {/* Payer/Merchant Info */}
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {activeTab === 'received' ? payment.payer.charAt(0) : 'M'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {activeTab === 'received' ? payment.payer : 'LINE Café'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(payment.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="mb-3">
                      <p className="font-medium text-gray-900">{payment.orderId}</p>
                      <p className="text-sm text-gray-500">{payment.description}</p>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Status:</span>
                        {getStatusBadge(payment)}
                      </div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right ml-4">
                    <p className="text-lg font-bold text-gray-900">
                      {payment.amount}
                    </p>
                    <p className="text-sm text-gray-500">USDT</p>
                  </div>
                </div>

                {/* Action Buttons */}
                {activeTab === 'received' && !payment.released && !payment.refunded && (
                  <div className="pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleReleasePayment(payment.id)}
                      disabled={processingPayments.has(payment.id)}
                      className="w-full btn-primary"
                    >
                      {processingPayments.has(payment.id) ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 loading-spinner"></div>
                          <span>Releasing...</span>
                        </div>
                      ) : (
                        'Mark as Delivered'
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 space-y-3">
          <button
            onClick={() => navigate('/merchants')}
            className="w-full btn-outline"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Browse Products
          </button>

          <button
            onClick={() => toast.info('Export feature coming soon!')}
            className="w-full btn-secondary"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default MerchantDashboard;