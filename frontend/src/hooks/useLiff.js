import { useCallback } from 'react';
import { useLiffStore } from '../stores/liffStore';
import { LIFF_CONFIG } from '../constants/config';

export const useLiff = () => {
  const {
    isInitialized,
    isInClient,
    isLoggedIn,
    user,
    error,
    isLoading,
    context,
    friendship,
    initializeLiff,
    login,
    logout,
    closeLiff,
    openExternalWindow,
    sendMessage,
    shareTargetPicker,
    scanCode,
    getDeviceInfo,
    getAvailableFeatures,
    createShareContent,
    clearError,
  } = useLiffStore();

  // Initialize LIFF with error handling
  const initLiff = useCallback(async () => {
    try {
      await initializeLiff();
    } catch (error) {
      console.error('LIFF initialization failed:', error);
      throw error;
    }
  }, [initializeLiff]);

  // Login with LINE account
  const loginWithLine = useCallback(async () => {
    try {
      if (!isInitialized) {
        throw new Error('LIFF not initialized');
      }
      await login();
    } catch (error) {
      console.error('LINE login failed:', error);
      throw error;
    }
  }, [login, isInitialized]);

  // Logout from LINE account
  const logoutFromLine = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error('LINE logout failed:', error);
      throw error;
    }
  }, [logout]);

  // Send a message to the user (requires friendship)
  const sendLineMessage = useCallback(async (messageContent) => {
    try {
      if (!isInClient) {
        throw new Error('Send message only available in LINE client');
      }

      if (!friendship?.friendFlag) {
        throw new Error('User is not a friend of the official account');
      }

      const message = {
        type: 'text',
        text: messageContent,
      };

      await sendMessage(message);
    } catch (error) {
      console.error('Failed to send LINE message:', error);
      throw error;
    }
  }, [sendMessage, isInClient, friendship]);

  // Share payment receipt via LINE
  const sharePaymentReceipt = useCallback(async (paymentData) => {
    try {
      if (!isInClient) {
        throw new Error('Share only available in LINE client');
      }

      const shareContent = createShareContent(paymentData);
      await shareTargetPicker(shareContent);
    } catch (error) {
      console.error('Failed to share payment receipt:', error);
      throw error;
    }
  }, [shareTargetPicker, createShareContent, isInClient]);

  // Scan QR code for payments
  const scanPaymentQR = useCallback(async () => {
    try {
      if (!isInClient) {
        throw new Error('QR scanning only available in LINE client');
      }

      const result = await scanCode();
      return result;
    } catch (error) {
      console.error('QR code scanning failed:', error);
      throw error;
    }
  }, [scanCode, isInClient]);

  // Open external URL (merchant website, support, etc.)
  const openExternal = useCallback((url) => {
    try {
      openExternalWindow(url);
    } catch (error) {
      console.error('Failed to open external URL:', error);
      // Fallback to regular window.open
      window.open(url, '_blank');
    }
  }, [openExternalWindow]);

  // Close LIFF window
  const closeLiffWindow = useCallback(() => {
    try {
      closeLiff();
    } catch (error) {
      console.error('Failed to close LIFF window:', error);
    }
  }, [closeLiff]);

  // Get user's display language
  const getUserLanguage = useCallback(() => {
    try {
      if (window.liff && isInitialized) {
        return window.liff.getLanguage();
      }
      return navigator.language || 'en';
    } catch (error) {
      console.error('Failed to get user language:', error);
      return 'en';
    }
  }, [isInitialized]);

  // Check if specific features are available
  const checkFeatureAvailability = useCallback(() => {
    return getAvailableFeatures();
  }, [getAvailableFeatures]);

  // Get current environment info
  const getEnvironmentInfo = useCallback(() => {
    const deviceInfo = getDeviceInfo();
    
    return {
      isInClient,
      isLoggedIn,
      isInitialized,
      platform: deviceInfo?.platform || 'unknown',
      version: deviceInfo?.version || 'unknown',
      viewType: deviceInfo?.viewType || 'unknown',
      language: getUserLanguage(),
      features: checkFeatureAvailability(),
    };
  }, [
    isInClient,
    isLoggedIn,
    isInitialized,
    getDeviceInfo,
    getUserLanguage,
    checkFeatureAvailability,
  ]);

  // Send payment notification
  const sendPaymentNotification = useCallback(async (paymentData) => {
    try {
      if (!isInClient || !friendship?.friendFlag) {
        return; // Silently fail if not available
      }

      const message = {
        type: 'flex',
        altText: 'Payment Update',
        contents: {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'Payment Update',
                weight: 'bold',
                size: 'lg',
                color: '#00B900',
              },
              {
                type: 'text',
                text: `Your payment of ${paymentData.amount} USDT has been ${paymentData.status}`,
                wrap: true,
                margin: 'md',
              },
              {
                type: 'text',
                text: `Order: ${paymentData.orderId}`,
                size: 'sm',
                color: '#999999',
                margin: 'sm',
              },
            ],
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'button',
                action: {
                  type: 'uri',
                  label: 'View Details',
                  uri: `${window.location.origin}/payment/${paymentData.id}`,
                },
                style: 'primary',
                color: '#00B900',
              },
            ],
          },
        },
      };

      await sendMessage(message);
    } catch (error) {
      console.error('Failed to send payment notification:', error);
    }
  }, [sendMessage, isInClient, friendship]);

  return {
    // State
    isInitialized,
    isInClient,
    isLoggedIn,
    user,
    error,
    isLoading,
    context,
    friendship,

    // Actions
    initializeLiff: initLiff,
    login: loginWithLine,
    logout: logoutFromLine,
    sendMessage: sendLineMessage,
    sharePaymentReceipt,
    scanPaymentQR,
    openExternal,
    closeLiffWindow,
    sendPaymentNotification,

    // Utilities
    getUserLanguage,
    getEnvironmentInfo,
    checkFeatureAvailability,
    clearError,

    // Configuration
    liffId: LIFF_CONFIG.LIFF_ID,
    appName: LIFF_CONFIG.APP_NAME,
  };
};