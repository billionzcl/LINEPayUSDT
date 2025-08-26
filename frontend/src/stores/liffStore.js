import { create } from 'zustand';
import { LIFF_CONFIG } from '../constants/config';

export const useLiffStore = create((set, get) => ({
  // State
  isInitialized: false,
  isInClient: false,
  isLoggedIn: false,
  user: null,
  error: null,
  isLoading: false,
  context: null,
  friendship: null,

  // Actions
  initializeLiff: async () => {
    try {
      set({ isLoading: true, error: null });

      if (!window.liff) {
        throw new Error('LIFF SDK not loaded');
      }

      if (!LIFF_CONFIG.LIFF_ID) {
        throw new Error('LIFF ID not configured');
      }

      // Initialize LIFF
      await window.liff.init({ liffId: LIFF_CONFIG.LIFF_ID });

      const isInClient = window.liff.isInClient();
      const isLoggedIn = window.liff.isLoggedIn();
      
      let user = null;
      let context = null;
      let friendship = null;

      if (isLoggedIn) {
        try {
          // Get user profile
          user = await window.liff.getProfile();
          
          // Get context (only available in LINE client)
          if (isInClient) {
            context = window.liff.getContext();
            
            // Check friendship status
            try {
              friendship = await window.liff.getFriendship();
            } catch (err) {
              console.warn('Could not get friendship status:', err);
            }
          }
        } catch (err) {
          console.error('Failed to get user information:', err);
        }
      }

      set({
        isInitialized: true,
        isInClient,
        isLoggedIn,
        user,
        context,
        friendship,
        isLoading: false,
        error: null,
      });

      // Auto-login if not logged in and in LINE client
      if (!isLoggedIn && isInClient) {
        get().login();
      }

    } catch (error) {
      console.error('LIFF initialization failed:', error);
      set({
        isLoading: false,
        error: error.message,
      });
      throw error;
    }
  },

  login: async () => {
    try {
      if (!window.liff || !get().isInitialized) {
        throw new Error('LIFF not initialized');
      }

      if (get().isLoggedIn) {
        return; // Already logged in
      }

      // Redirect to LINE login
      window.liff.login();
    } catch (error) {
      console.error('LOGIN failed:', error);
      set({ error: error.message });
      throw error;
    }
  },

  logout: async () => {
    try {
      if (!window.liff || !get().isInitialized) {
        throw new Error('LIFF not initialized');
      }

      window.liff.logout();
      
      set({
        isLoggedIn: false,
        user: null,
        context: null,
        friendship: null,
      });
    } catch (error) {
      console.error('Logout failed:', error);
      set({ error: error.message });
      throw error;
    }
  },

  // Close LIFF window
  closeLiff: () => {
    try {
      if (window.liff && get().isInClient) {
        window.liff.closeWindow();
      } else {
        // Fallback for external browser
        window.close();
      }
    } catch (error) {
      console.error('Failed to close LIFF window:', error);
    }
  },

  // Open external URL in LINE internal browser
  openExternalWindow: (url) => {
    try {
      if (window.liff) {
        window.liff.openWindow({
          url,
          external: true,
        });
      } else {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Failed to open external window:', error);
      window.open(url, '_blank');
    }
  },

  // Send messages (only available if user is friend with the official account)
  sendMessage: async (message) => {
    try {
      if (!window.liff || !get().isInClient) {
        throw new Error('Send message only available in LINE client');
      }

      if (!get().friendship?.friendFlag) {
        throw new Error('User is not a friend of the official account');
      }

      await window.liff.sendMessages([message]);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  },

  // Share target picker (for sharing with LINE friends)
  shareTargetPicker: async (messages) => {
    try {
      if (!window.liff || !get().isInClient) {
        throw new Error('Share target picker only available in LINE client');
      }

      const result = await window.liff.shareTargetPicker(messages);
      return result;
    } catch (error) {
      console.error('Failed to open share target picker:', error);
      throw error;
    }
  },

  // Scan QR code (only available in LINE client)
  scanCode: async () => {
    try {
      if (!window.liff || !get().isInClient) {
        throw new Error('QR code scanning only available in LINE client');
      }

      const result = await window.liff.scanCode();
      return result;
    } catch (error) {
      console.error('Failed to scan QR code:', error);
      throw error;
    }
  },

  // Get device information
  getDeviceInfo: () => {
    try {
      if (!window.liff || !get().isInitialized) {
        return null;
      }

      const context = get().context;
      if (!context) return null;

      return {
        platform: context.type, // ios, android, etc.
        version: context.version,
        isInClient: get().isInClient,
        language: window.liff.getLanguage(),
        viewType: context.viewType, // full, tall, compact
      };
    } catch (error) {
      console.error('Failed to get device info:', error);
      return null;
    }
  },

  // Check if specific LIFF features are available
  getAvailableFeatures: () => {
    const isInClient = get().isInClient;
    const isLoggedIn = get().isLoggedIn;
    const friendship = get().friendship;

    return {
      shareTargetPicker: isInClient,
      sendMessage: isInClient && isLoggedIn && friendship?.friendFlag,
      scanCode: isInClient,
      closeWindow: isInClient,
      getUserProfile: isLoggedIn,
      getFriendship: isInClient && isLoggedIn,
    };
  },

  // Utility function to create shareable content
  createShareContent: (payment) => {
    const { user } = get();
    
    return [
      {
        type: 'flex',
        altText: 'Payment Receipt',
        contents: {
          type: 'bubble',
          header: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'LINEPayUSDT Receipt',
                weight: 'bold',
                color: '#00B900',
                size: 'lg',
              },
            ],
          },
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: `Payment: ${payment.amount} USDT`,
                weight: 'bold',
              },
              {
                type: 'text',
                text: `Order: ${payment.orderId}`,
                color: '#999999',
                size: 'sm',
              },
              {
                type: 'text',
                text: `Status: ${payment.released ? 'Completed' : 'Pending'}`,
                color: payment.released ? '#00B900' : '#FF6B35',
                size: 'sm',
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
                  uri: `${window.location.origin}/payment/${payment.id}`,
                },
                style: 'primary',
                color: '#00B900',
              },
            ],
          },
        },
      },
    ];
  },

  // Clear error state
  clearError: () => {
    set({ error: null });
  },
}));