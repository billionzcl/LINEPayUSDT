const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/linepayusdt',
    ssl: process.env.NODE_ENV === 'production',
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    ttl: parseInt(process.env.REDIS_TTL) || 3600, // 1 hour
  },

  // Blockchain Configuration
  blockchain: {
    rpcUrl: process.env.KAIA_RPC_URL || 'https://api.baobab.klaytn.net:8651',
    chainId: parseInt(process.env.CHAIN_ID) || 1001,
    privateKey: process.env.PRIVATE_KEY,
    
    // Contract Addresses
    contracts: {
      paymentEscrow: process.env.PAYMENT_ESCROW_ADDRESS || '0x0000000000000000000000000000000000000000',
      merchantRegistry: process.env.MERCHANT_REGISTRY_ADDRESS || '0x0000000000000000000000000000000000000000',
      usdtToken: process.env.USDT_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000',
    },

    // Indexer Configuration
    indexer: {
      startBlock: parseInt(process.env.START_BLOCK) || 'latest',
      batchSize: parseInt(process.env.BATCH_SIZE) || 1000,
      pollingInterval: parseInt(process.env.POLLING_INTERVAL) || 5000, // 5 seconds
      confirmations: parseInt(process.env.CONFIRMATIONS) || 3,
    },
  },

  // LINE Configuration
  line: {
    channelSecret: process.env.LINE_CHANNEL_SECRET,
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    liffId: process.env.LIFF_ID,
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filename: process.env.LOG_FILENAME || 'logs/app.log',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
  },

  // Feature Flags
  features: {
    enableIndexer: process.env.ENABLE_INDEXER !== 'false',
    enableCache: process.env.ENABLE_CACHE !== 'false',
    enableWebhooks: process.env.ENABLE_WEBHOOKS === 'true',
    enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
  },

  // Webhook Configuration
  webhooks: {
    paymentCreated: process.env.WEBHOOK_PAYMENT_CREATED,
    paymentReleased: process.env.WEBHOOK_PAYMENT_RELEASED,
    paymentRefunded: process.env.WEBHOOK_PAYMENT_REFUNDED,
  },
};