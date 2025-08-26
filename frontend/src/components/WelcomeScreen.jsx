import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '../stores/walletStore';
import { useLiffStore } from '../stores/liffStore';
import toast from 'react-hot-toast';

const WelcomeScreen = () => {
  const navigate = useNavigate();
  const { connectWallet, isConnecting } = useWalletStore();
  const { isInClient, user, login, isLoggedIn } = useLiffStore();
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);

  const handleConnectWallet = async () => {
    try {
      setIsConnectingWallet(true);
      
      // If not logged in to LINE, login first
      if (isInClient && !isLoggedIn) {
        await login();
        return;
      }

      await connectWallet();
      toast.success('Wallet connected successfully!');
      navigate('/merchants');
    } catch (error) {
      toast.error(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnectingWallet(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-line-green to-green-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Main Welcome Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center animate-scale-in">
          {/* Logo and Branding */}
          <div className="mb-8">
            {/* Logo Icon */}
            <div className="w-20 h-20 mx-auto mb-4 bg-line-green rounded-full flex items-center justify-center shadow-lg">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-line-green">K</span>
              </div>
            </div>
            
            {/* App Name */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              LINEPayUSDT
            </h1>
            
            {/* Tagline */}
            <p className="text-gray-600 text-sm leading-relaxed">
              Fast, secure USDT payments<br />
              on Kaia blockchain for LINE users
            </p>
          </div>

          {/* Wallet Connection Section */}
          <div className="mb-8">
            {/* Wallet Icon */}
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-line-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>

            {/* User Info (if logged in) */}
            {isLoggedIn && user && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-center space-x-3">
                  <img 
                    src={user.pictureUrl} 
                    alt={user.displayName}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{user.displayName}</p>
                    <p className="text-sm text-gray-500">Logged in via LINE</p>
                  </div>
                </div>
              </div>
            )}

            {/* Connect Wallet Button */}
            <button
              onClick={handleConnectWallet}
              disabled={isConnecting || isConnectingWallet}
              className="w-full btn-primary h-14 text-lg font-semibold relative overflow-hidden group"
            >
              {isConnecting || isConnectingWallet ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-5 h-5 loading-spinner"></div>
                  <span>Connecting...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center space-x-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Connect Wallet</span>
                </span>
              )}
              
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-line-green transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
            </button>
          </div>

          {/* Features Preview */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center space-x-3 text-left">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-line-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Fast Payments</p>
                <p className="text-gray-500 text-xs">Low-fee USDT transfers on Kaia</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-left">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Secure Escrow</p>
                <p className="text-gray-500 text-xs">Protected transactions with refunds</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-left">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">LINE Native</p>
                <p className="text-gray-500 text-xs">Seamless Mini DApp experience</p>
              </div>
            </div>
          </div>

          {/* Environment Badge */}
          {import.meta.env.DEV && (
            <div className="mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Development Mode
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-2">
              Powered by Kaia Blockchain
            </p>
            <div className="flex items-center justify-center space-x-4">
              <span className="text-xs text-gray-400">v1.0.0</span>
              <span className="text-xs text-gray-300">•</span>
              <span className="text-xs text-gray-400">Testnet</span>
            </div>
          </div>
        </div>

        {/* Bottom Action Hint */}
        <div className="mt-6 text-center">
          <p className="text-white text-sm opacity-75">
            Connect your wallet to start making secure USDT payments
          </p>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white opacity-5 rounded-full"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white opacity-5 rounded-full"></div>
      </div>
    </div>
  );
};

export default WelcomeScreen;