import { useEffect, useState } from 'react';
import { useWalletStore } from '../stores/walletStore';
import { useLiffStore } from '../stores/liffStore';

/**
 * Custom hook for LIFF and wallet integration
 */
export const useLiffWallet = () => {
  const {
    isConnected,
    address,
    connectionType,
    isDappPortalAvailable,
    initializeWallet,
    connectLineDappPortal,
    connectMetaMask,
    disconnect,
    isConnecting,
    error: walletError,
    usdtBalance,
    balance
  } = useWalletStore();

  const {
    isInitialized,
    isInClient,
    isLoggedIn,
    user,
    initializeLiff,
    login,
    logout,
    sendMessage,
    shareTargetPicker,
    isLoading: liffLoading,
    error: liffError
  } = useLiffStore();

  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize LIFF and attempt auto-connection
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsInitializing(true);
        
        if (!isInitialized) {
          await initializeLiff();
        }
        
        if (!isConnected && (isLoggedIn || !isInClient)) {
          try {
            await initializeWallet();
          } catch (error) {
            console.log('Auto-connect failed:', error.message);
          }
        }
      } catch (error) {
        console.error('LIFF initialization failed:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, [isInitialized, isLoggedIn, isInClient, isConnected]);

  // Enhanced connection method
  const connect = async () => {
    try {
      if (isInClient && !isLoggedIn) {
        await login();
        return { success: false, message: 'Please complete LINE login first' };
      }

      if (isInClient && isDappPortalAvailable) {
        await connectLineDappPortal();
        return { success: true, method: 'line_dapp_portal' };
      } else {
        await connectMetaMask();
        return { success: true, method: 'metamask' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return {
    // Connection state
    isConnected,
    isLoggedIn,
    isInClient,
    isInitializing: isInitializing || liffLoading,
    isConnecting,
    connectionType,
    
    // User data
    user,
    address,
    balances: { kaia: balance, usdt: usdtBalance },
    
    // Actions
    connect,
    disconnect,
    loginLine: login,
    logoutLine: logout,
    sendMessage,
    shareTargetPicker,
    
    // Errors
    error: walletError || liffError
  };
};

export default useLiffWallet;