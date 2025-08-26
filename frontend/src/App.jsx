import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useWalletStore } from './stores/walletStore';
import { useLiffStore } from './stores/liffStore';

// Components
import WelcomeScreen from './components/WelcomeScreen';
import MerchantSelection from './components/MerchantSelection';
import PaymentConfirmation from './components/PaymentConfirmation';
import PaymentProcessing from './components/PaymentProcessing';
import PaymentSuccess from './components/PaymentSuccess';
import MerchantDashboard from './components/MerchantDashboard';
import ErrorScreen from './components/ErrorScreen';
import LoadingScreen from './components/LoadingScreen';
import LiffWalletTest from './components/LiffWalletTest';

// Hooks
import { useLiff } from './hooks/useLiff';

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const { isConnected } = useWalletStore();
  const { isInitialized, isInClient, user } = useLiffStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize LIFF
  const { initializeLiff } = useLiff();

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        await initializeLiff();
      } catch (err) {
        console.error('App initialization failed:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [initializeLiff]);

  // Show loading screen during initialization
  if (isLoading) {
    return <LoadingScreen message="Initializing LINEPayUSDT..." />;
  }

  // Show error screen if initialization failed
  if (error) {
    return <ErrorScreen error={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          {/* Safe area for mobile devices */}
          <div className="safe-area-top safe-area-bottom">
            <Routes>
              {/* Welcome/Landing Screen - First step in UX flow */}
              <Route 
                path="/" 
                element={
                  !isConnected ? (
                    <WelcomeScreen />
                  ) : (
                    <MerchantSelection />
                  )
                } 
              />
              
              {/* Merchant & Product Selection Screen */}
              <Route path="/merchants" element={<MerchantSelection />} />
              <Route path="/merchant/:merchantAddress" element={<MerchantSelection />} />
              
              {/* Payment Flow Screens */}
              <Route path="/payment/confirm" element={<PaymentConfirmation />} />
              <Route path="/payment/processing" element={<PaymentProcessing />} />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              
              {/* Merchant Dashboard */}
              <Route path="/dashboard" element={<MerchantDashboard />} />
              
              {/* Test Components */}
              <Route path="/test/liff-wallet" element={<LiffWalletTest />} />
              
              {/* Error handling */}
              <Route path="/error" element={<ErrorScreen />} />
              
              {/* Catch all - redirect to home */}
              <Route path="*" element={<WelcomeScreen />} />
            </Routes>
          </div>

          {/* Toast notifications */}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 5000,
              style: {
                background: '#ffffff',
                color: '#1f2937',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: {
                iconTheme: {
                  primary: '#00B900',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#ffffff',
                },
              },
            }}
          />

          {/* LINE Mini DApp specific styles */}
          <style jsx global>{`
            /* Hide scrollbars in LINE client for better UX */
            .line-client-hide-scroll {
              scrollbar-width: none;
              -ms-overflow-style: none;
            }
            .line-client-hide-scroll::-webkit-scrollbar {
              display: none;
            }

            /* LINE-specific viewport adjustments */
            @media screen and (max-width: 480px) {
              .mobile-optimize {
                padding-left: 16px;
                padding-right: 16px;
              }
            }

            /* LINE theme colors */
            :root {
              --line-green: #00B900;
              --line-dark: #1B1B1B;
              --line-gray: #9E9E9E;
              --kaia-orange: #FF6B35;
              --kaia-blue: #4A90E2;
            }

            /* Animation for smooth transitions */
            .page-transition {
              animation: slideInRight 0.3s ease-out;
            }

            @keyframes slideInRight {
              from {
                transform: translateX(100%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }

            /* Loading states */
            .skeleton {
              background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
              background-size: 200% 100%;
              animation: loading 1.5s infinite;
            }

            @keyframes loading {
              0% {
                background-position: 200% 0;
              }
              100% {
                background-position: -200% 0;
              }
            }
          `}</style>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;