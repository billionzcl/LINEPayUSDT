// Network configurations
export const NETWORKS = {
  KAIA_TESTNET: {
    chainId: '0x3e9', // 1001 in hex
    chainName: 'Kaia Kairos Testnet',
    nativeCurrency: {
      name: 'KAIA',
      symbol: 'KAIA',
      decimals: 18,
    },
    rpcUrls: ['https://api.baobab.klaytn.net:8651'],
    blockExplorerUrls: ['https://baobab.klaytnscope.com'],
  },
  KAIA_MAINNET: {
    chainId: '0x2019', // 8217 in hex
    chainName: 'Kaia Mainnet',
    nativeCurrency: {
      name: 'KAIA',
      symbol: 'KAIA',
      decimals: 18,
    },
    rpcUrls: ['https://api.cypress.klaytn.net:8651'],
    blockExplorerUrls: ['https://klaytnscope.com'],
  },
};

// Current network based on environment
export const CURRENT_NETWORK = import.meta.env.VITE_NETWORK === 'mainnet' 
  ? NETWORKS.KAIA_MAINNET 
  : NETWORKS.KAIA_TESTNET;

// Contract addresses (to be updated after deployment)
export const CONTRACT_ADDRESSES = {
  PAYMENT_ESCROW: import.meta.env.VITE_PAYMENT_ESCROW_ADDRESS || '0x0000000000000000000000000000000000000000',
  MERCHANT_REGISTRY: import.meta.env.VITE_MERCHANT_REGISTRY_ADDRESS || '0x0000000000000000000000000000000000000000',
  USDT_TOKEN: import.meta.env.VITE_USDT_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000',
};

// LIFF configuration
export const LIFF_CONFIG = {
  LIFF_ID: import.meta.env.VITE_LIFF_ID || '',
  APP_NAME: 'LINEPayUSDT',
};

// API endpoints
export const API_ENDPOINTS = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  INDEXER: '/api/indexer',
  MERCHANTS: '/api/merchants',
  PAYMENTS: '/api/payments',
  PRODUCTS: '/api/products',
};

// Application constants
export const APP_CONFIG = {
  APP_NAME: 'LINEPayUSDT',
  APP_VERSION: '1.0.0',
  SUPPORTED_CHAINS: [CURRENT_NETWORK.chainId],
  DEFAULT_SLIPPAGE: 0.5, // 0.5%
  TRANSACTION_DEADLINE: 20, // 20 minutes
  AUTO_RELEASE_DELAY: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

// USDT token configuration
export const USDT_CONFIG = {
  DECIMALS: 6,
  SYMBOL: 'USDT',
  NAME: 'Tether USD',
  MIN_AMOUNT: 0.01, // Minimum payment amount in USDT
  MAX_AMOUNT: 10000, // Maximum payment amount in USDT
};

// UI constants
export const UI_CONFIG = {
  NOTIFICATION_TIMEOUT: 5000, // 5 seconds
  LOADING_TIMEOUT: 30000, // 30 seconds
  REFRESH_INTERVAL: 10000, // 10 seconds
  PAGINATION_SIZE: 20,
};

// Transaction status
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

// Payment status
export const PAYMENT_STATUS = {
  CREATED: 'created',
  RELEASED: 'released',
  REFUNDED: 'refunded',
  DISPUTED: 'disputed',
};

// Error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet first',
  INSUFFICIENT_BALANCE: 'Insufficient USDT balance',
  NETWORK_MISMATCH: 'Please switch to the correct network',
  TRANSACTION_REJECTED: 'Transaction was rejected by user',
  LIFF_INIT_FAILED: 'Failed to initialize LINE LIFF',
  CONTRACT_INTERACTION_FAILED: 'Failed to interact with smart contract',
  INVALID_AMOUNT: 'Please enter a valid amount',
  MERCHANT_NOT_FOUND: 'Merchant not found',
  PRODUCT_NOT_FOUND: 'Product not found',
  PAYMENT_NOT_FOUND: 'Payment not found',
};

// Success messages
export const SUCCESS_MESSAGES = {
  PAYMENT_CREATED: 'Payment created successfully!',
  PAYMENT_RELEASED: 'Payment released successfully!',
  PAYMENT_REFUNDED: 'Payment refunded successfully!',
  MERCHANT_REGISTERED: 'Merchant registered successfully!',
  PRODUCT_ADDED: 'Product added successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
};

// Feature flags
export const FEATURES = {
  MERCHANT_REGISTRATION: true,
  PAYMENT_ESCROW: true,
  QR_PAYMENTS: true,
  MERCHANT_DASHBOARD: true,
  RATING_SYSTEM: true,
  ANALYTICS: true,
  NOTIFICATIONS: true,
};

// Social media links
export const SOCIAL_LINKS = {
  TWITTER: 'https://twitter.com/linepayusdt',
  TELEGRAM: 'https://t.me/linepayusdt',
  DISCORD: 'https://discord.gg/linepayusdt',
  GITHUB: 'https://github.com/linepayusdt',
};

// Help and documentation
export const HELP_LINKS = {
  USER_GUIDE: '/docs/user-guide',
  MERCHANT_GUIDE: '/docs/merchant-guide',
  API_DOCS: '/docs/api',
  FAQ: '/docs/faq',
  SUPPORT: 'https://support.linepayusdt.com',
};