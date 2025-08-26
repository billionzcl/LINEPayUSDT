const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const logger = require('./utils/logger');
const DatabaseService = require('./database/databaseService');
const BlockchainIndexer = require('./indexer/blockchainIndexer');
const createRoutes = require('./routes/api');

class Server {
  constructor() {
    this.app = express();
    this.databaseService = null;
    this.indexer = null;
    this.server = null;
  }

  async initialize() {
    try {
      logger.info('Initializing LINEPayUSDT backend server...');

      // Initialize database service
      this.databaseService = new DatabaseService();
      await this.databaseService.initialize();

      // Initialize blockchain indexer if enabled
      if (config.features.enableIndexer) {
        this.indexer = new BlockchainIndexer();
        
        // Set up indexer event handlers
        this.setupIndexerHandlers();
        
        // Start indexer
        await this.indexer.start();
      }

      // Set up Express middleware
      this.setupMiddleware();

      // Set up routes
      this.setupRoutes();

      // Set up error handling
      this.setupErrorHandling();

      // Seed demo data in development
      if (config.server.env === 'development') {
        await this.databaseService.seedDemoData();
      }

      logger.info('Server initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize server:', error);
      throw error;
    }
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.server.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: {
        error: 'Too many requests from this IP, please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    if (config.server.env === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Request ID middleware
    this.app.use((req, res, next) => {
      req.id = Math.random().toString(36).substr(2, 9);
      res.setHeader('X-Request-ID', req.id);
      next();
    });

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`[${req.id}] ${req.method} ${req.url}`);
      next();
    });
  }

  setupRoutes() {
    // API routes
    this.app.use('/api', createRoutes(this.databaseService, this.indexer));

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'LINEPayUSDT Backend API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/api/health',
          payments: '/api/payments',
          merchants: '/api/merchants',
          products: '/api/products',
        },
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method,
      });
    });
  }

  setupErrorHandling() {
    // Global error handler
    this.app.use((error, req, res, next) => {
      logger.error(`[${req.id}] Unhandled error:`, error);

      // Don't expose internal errors in production
      const message = config.server.env === 'development' 
        ? error.message 
        : 'Internal server error';

      res.status(error.status || 500).json({
        error: message,
        requestId: req.id,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      this.shutdown();
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      this.shutdown();
    });
  }

  setupIndexerHandlers() {
    if (!this.indexer) return;

    // Handle indexer events and store in database
    this.indexer.on('paymentCreated', async (data) => {
      try {
        await this.databaseService.createPayment(data);
        logger.info(`Payment ${data.paymentId} stored in database`);
      } catch (error) {
        logger.error('Error storing payment in database:', error);
      }
    });

    this.indexer.on('paymentReleased', async (data) => {
      try {
        await this.databaseService.updatePaymentReleased(data);
        
        // Update merchant sales
        const payment = await this.databaseService.getPayment(data.paymentId);
        if (payment) {
          await this.databaseService.updateMerchantSales(payment.merchant, payment.amount);
        }
        
        logger.info(`Payment ${data.paymentId} marked as released in database`);
      } catch (error) {
        logger.error('Error updating payment release in database:', error);
      }
    });

    this.indexer.on('paymentRefunded', async (data) => {
      try {
        await this.databaseService.updatePaymentRefunded(data);
        logger.info(`Payment ${data.paymentId} marked as refunded in database`);
      } catch (error) {
        logger.error('Error updating payment refund in database:', error);
      }
    });

    this.indexer.on('merchantRegistered', async (data) => {
      try {
        await this.databaseService.createMerchant(data);
        logger.info(`Merchant ${data.merchant} stored in database`);
      } catch (error) {
        logger.error('Error storing merchant in database:', error);
      }
    });

    this.indexer.on('productAdded', async (data) => {
      try {
        await this.databaseService.createProduct(data);
        logger.info(`Product ${data.productId} stored in database`);
      } catch (error) {
        logger.error('Error storing product in database:', error);
      }
    });
  }

  async start() {
    try {
      await this.initialize();

      const port = config.server.port;
      
      this.server = this.app.listen(port, () => {
        logger.info(`LINEPayUSDT backend server running on port ${port}`);
        logger.info(`Environment: ${config.server.env}`);
        logger.info(`API endpoints available at http://localhost:${port}/api`);
      });

      return this.server;

    } catch (error) {
      logger.error('Failed to start server:', error);
      throw error;
    }
  }

  async shutdown() {
    logger.info('Shutting down server...');

    try {
      // Stop indexer
      if (this.indexer) {
        await this.indexer.stop();
      }

      // Close server
      if (this.server) {
        this.server.close((error) => {
          if (error) {
            logger.error('Error closing server:', error);
          } else {
            logger.info('Server closed successfully');
          }
          process.exit(error ? 1 : 0);
        });
      } else {
        process.exit(0);
      }

    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

module.exports = Server;