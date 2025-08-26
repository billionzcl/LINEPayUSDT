import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '../stores/walletStore';
import toast from 'react-hot-toast';

const MerchantSelection = () => {
  const navigate = useNavigate();
  const { address, isConnected, usdtBalance } = useWalletStore();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Demo products matching the UX design
  const demoProducts = [
    {
      id: 1,
      name: 'Coffee',
      price: 2.50,
      image: '☕',
      description: 'Premium coffee blend',
      merchant: '0x1234...5678',
      merchantName: 'LINE Café',
      category: 'beverages'
    },
    {
      id: 2,
      name: 'Croissant',
      price: 3.10,
      image: '🥐',
      description: 'Fresh buttery croissant',
      merchant: '0x1234...5678',
      merchantName: 'LINE Café',
      category: 'pastries'
    },
    {
      id: 3,
      name: 'Tea',
      price: 1.90,
      image: '🍵',
      description: 'Organic green tea',
      merchant: '0x1234...5678',
      merchantName: 'LINE Café',
      category: 'beverages'
    },
    {
      id: 4,
      name: 'Cake',
      price: 4.20,
      image: '🍰',
      description: 'Chocolate layer cake',
      merchant: '0x1234...5678',
      merchantName: 'LINE Café',
      category: 'desserts'
    }
  ];

  const handleProductSelect = (product) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Check balance
    const balance = parseFloat(usdtBalance || '0');
    if (balance < product.price) {
      toast.error('Insufficient USDT balance');
      return;
    }

    setSelectedProduct(product);
    // Navigate to payment confirmation with product data
    navigate('/payment/confirm', { 
      state: { 
        product,
        amount: product.price,
        merchantAddress: product.merchant
      }
    });
  };

  const formatBalance = (balance) => {
    return parseFloat(balance || '0').toFixed(2);
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
          <p className="text-gray-600 mb-4">Please connect your wallet to continue</p>
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
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-line-green rounded-full flex items-center justify-center">
                <span className="text-white font-bold">L</span>
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">LINE Café</h1>
                <p className="text-sm text-gray-500">Premium coffee & pastries</p>
              </div>
            </div>
            
            {/* User balance */}
            <div className="text-right">
              <p className="text-sm text-gray-500">USDT Balance</p>
              <p className="font-semibold text-gray-900">{formatBalance(usdtBalance)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="px-4 py-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Menu</h2>
          <p className="text-gray-600 text-sm">Select an item to purchase with USDT</p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 gap-4">
          {demoProducts.map((product) => {
            const canAfford = parseFloat(usdtBalance || '0') >= product.price;
            
            return (
              <div
                key={product.id}
                onClick={() => handleProductSelect(product)}
                className={`card-hover transition-all duration-200 ${
                  !canAfford ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'
                }`}
              >
                {/* Product Image/Icon */}
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">{product.image}</div>
                  <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                </div>

                {/* Product Info */}
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{product.description}</p>
                  
                  {/* Price */}
                  <div className="flex items-center justify-center space-x-1">
                    <span className="text-lg font-bold text-gray-900">{product.price}</span>
                    <span className="text-sm text-gray-500 font-medium">USDT</span>
                  </div>

                  {/* Affordability indicator */}
                  {!canAfford && (
                    <div className="mt-2">
                      <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                        Insufficient balance
                      </span>
                    </div>
                  )}
                </div>

                {/* Selection indicator */}
                {selectedProduct?.id === product.id && (
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 bg-line-green rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 space-y-4">
          {/* Merchant Dashboard Link (if user is merchant) */}
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full btn-secondary"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Merchant Dashboard
          </button>

          {/* Add USDT (Top up) */}
          <button
            onClick={() => toast.info('Top-up feature coming soon!')}
            className="w-full btn-outline"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add USDT
          </button>
        </div>

        {/* Info Section */}
        <div className="mt-8 p-4 bg-blue-50 rounded-xl">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">How it works</h4>
              <p className="text-sm text-blue-700 leading-relaxed">
                Select a product → Confirm payment → Funds are held in escrow → Merchant delivers → Payment released automatically
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantSelection;