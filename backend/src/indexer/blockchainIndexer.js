const { ethers } = require('ethers');
const config = require('../config');
const logger = require('../utils/logger');
const EventEmitter = require('events');

// Contract ABIs
const PAYMENT_ESCROW_ABI = [
  "event PaymentCreated(uint256 indexed paymentId, address indexed payer, address indexed merchant, uint256 amount, string orderId, string description)",
  "event PaymentReleased(uint256 indexed paymentId, address indexed merchant, uint256 merchantAmount, uint256 platformFeeAmount)",
  "event PaymentRefunded(uint256 indexed paymentId, address indexed payer, uint256 amount)",
  "function getPayment(uint256 paymentId) external view returns (tuple(uint256 id, address payer, address merchant, uint256 amount, uint256 platformFeeAmount, uint256 merchantAmount, uint256 createdAt, uint256 releasedAt, bool released, bool refunded, string orderId, string description))",
];

const MERCHANT_REGISTRY_ABI = [
  "event MerchantRegistered(address indexed merchant, string businessName, uint256 timestamp)",
  "event MerchantUpdated(address indexed merchant)",
  "event ProductAdded(uint256 indexed productId, address indexed merchant, string name, uint256 price)",
  "event ProductUpdated(uint256 indexed productId)",
  "event SaleRecorded(address indexed merchant, uint256 amount, uint256 timestamp)",
  "event RatingUpdated(address indexed merchant, uint8 newRating, uint256 ratingCount)",
];

class BlockchainIndexer extends EventEmitter {
  constructor() {
    super();
    this.provider = null;
    this.paymentEscrowContract = null;
    this.merchantRegistryContract = null;
    this.isRunning = false;
    this.lastProcessedBlock = 0;
  }

  async initialize() {
    try {
      logger.info('Initializing blockchain indexer...');

      // Initialize provider
      this.provider = new ethers.providers.JsonRpcProvider(config.blockchain.rpcUrl);
      
      // Test connection
      const network = await this.provider.getNetwork();
      logger.info(`Connected to blockchain network: ${network.name} (${network.chainId})`);

      // Initialize contracts
      this.paymentEscrowContract = new ethers.Contract(
        config.blockchain.contracts.paymentEscrow,
        PAYMENT_ESCROW_ABI,
        this.provider
      );

      this.merchantRegistryContract = new ethers.Contract(
        config.blockchain.contracts.merchantRegistry,
        MERCHANT_REGISTRY_ABI,
        this.provider
      );

      // Get starting block
      if (config.blockchain.indexer.startBlock === 'latest') {
        this.lastProcessedBlock = await this.provider.getBlockNumber();
      } else {
        this.lastProcessedBlock = config.blockchain.indexer.startBlock;
      }

      logger.info(`Indexer initialized, starting from block: ${this.lastProcessedBlock}`);
      
    } catch (error) {
      logger.error('Failed to initialize blockchain indexer:', error);
      throw error;
    }
  }

  async start() {
    if (this.isRunning) {
      logger.warn('Indexer is already running');
      return;
    }

    try {
      await this.initialize();
      this.isRunning = true;
      
      logger.info('Starting blockchain indexer...');
      
      // Start event listeners
      this.setupEventListeners();
      
      // Start block polling
      this.startPolling();
      
      logger.info('Blockchain indexer started successfully');
      
    } catch (error) {
      logger.error('Failed to start blockchain indexer:', error);
      this.isRunning = false;
      throw error;
    }
  }

  async stop() {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping blockchain indexer...');
    
    this.isRunning = false;
    
    // Remove all listeners
    this.provider.removeAllListeners();
    this.paymentEscrowContract.removeAllListeners();
    this.merchantRegistryContract.removeAllListeners();
    
    logger.info('Blockchain indexer stopped');
  }

  setupEventListeners() {
    // Payment Escrow Events
    this.paymentEscrowContract.on('PaymentCreated', async (paymentId, payer, merchant, amount, orderId, description, event) => {
      try {
        await this.handlePaymentCreated({
          paymentId: paymentId.toString(),
          payer,
          merchant,
          amount: ethers.utils.formatUnits(amount, 6), // USDT has 6 decimals
          orderId,
          description,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          timestamp: await this.getBlockTimestamp(event.blockNumber),
        });
      } catch (error) {
        logger.error('Error handling PaymentCreated event:', error);
      }
    });

    this.paymentEscrowContract.on('PaymentReleased', async (paymentId, merchant, merchantAmount, platformFeeAmount, event) => {
      try {
        await this.handlePaymentReleased({
          paymentId: paymentId.toString(),
          merchant,
          merchantAmount: ethers.utils.formatUnits(merchantAmount, 6),
          platformFeeAmount: ethers.utils.formatUnits(platformFeeAmount, 6),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          timestamp: await this.getBlockTimestamp(event.blockNumber),
        });
      } catch (error) {
        logger.error('Error handling PaymentReleased event:', error);
      }
    });

    this.paymentEscrowContract.on('PaymentRefunded', async (paymentId, payer, amount, event) => {
      try {
        await this.handlePaymentRefunded({
          paymentId: paymentId.toString(),
          payer,
          amount: ethers.utils.formatUnits(amount, 6),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          timestamp: await this.getBlockTimestamp(event.blockNumber),
        });
      } catch (error) {
        logger.error('Error handling PaymentRefunded event:', error);
      }
    });

    // Merchant Registry Events
    this.merchantRegistryContract.on('MerchantRegistered', async (merchant, businessName, timestamp, event) => {
      try {
        await this.handleMerchantRegistered({
          merchant,
          businessName,
          timestamp: timestamp.toNumber(),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
        });
      } catch (error) {
        logger.error('Error handling MerchantRegistered event:', error);
      }
    });

    this.merchantRegistryContract.on('ProductAdded', async (productId, merchant, name, price, event) => {
      try {
        await this.handleProductAdded({
          productId: productId.toString(),
          merchant,
          name,
          price: ethers.utils.formatUnits(price, 6),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          timestamp: await this.getBlockTimestamp(event.blockNumber),
        });
      } catch (error) {
        logger.error('Error handling ProductAdded event:', error);
      }
    });

    logger.info('Event listeners set up successfully');
  }

  startPolling() {
    const poll = async () => {
      if (!this.isRunning) return;

      try {
        const currentBlock = await this.provider.getBlockNumber();
        
        if (currentBlock > this.lastProcessedBlock) {
          await this.processHistoricalEvents(this.lastProcessedBlock + 1, currentBlock);
          this.lastProcessedBlock = currentBlock;
        }
        
      } catch (error) {
        logger.error('Error during polling:', error);
      }

      // Schedule next poll
      if (this.isRunning) {
        setTimeout(poll, config.blockchain.indexer.pollingInterval);
      }
    };

    // Start polling
    poll();
  }

  async processHistoricalEvents(fromBlock, toBlock) {
    try {
      logger.debug(`Processing historical events from block ${fromBlock} to ${toBlock}`);

      // Process in batches to avoid RPC limits
      const batchSize = config.blockchain.indexer.batchSize;
      
      for (let start = fromBlock; start <= toBlock; start += batchSize) {
        const end = Math.min(start + batchSize - 1, toBlock);
        
        // Get PaymentEscrow events
        const paymentEvents = await this.paymentEscrowContract.queryFilter('*', start, end);
        for (const event of paymentEvents) {
          await this.processEvent(event);
        }

        // Get MerchantRegistry events
        const merchantEvents = await this.merchantRegistryContract.queryFilter('*', start, end);
        for (const event of merchantEvents) {
          await this.processEvent(event);
        }
      }

    } catch (error) {
      logger.error('Error processing historical events:', error);
    }
  }

  async processEvent(event) {
    try {
      const eventName = event.event;
      const args = event.args;

      switch (eventName) {
        case 'PaymentCreated':
          await this.handlePaymentCreated({
            paymentId: args.paymentId.toString(),
            payer: args.payer,
            merchant: args.merchant,
            amount: ethers.utils.formatUnits(args.amount, 6),
            orderId: args.orderId,
            description: args.description,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            timestamp: await this.getBlockTimestamp(event.blockNumber),
          });
          break;
          
        case 'PaymentReleased':
          await this.handlePaymentReleased({
            paymentId: args.paymentId.toString(),
            merchant: args.merchant,
            merchantAmount: ethers.utils.formatUnits(args.merchantAmount, 6),
            platformFeeAmount: ethers.utils.formatUnits(args.platformFeeAmount, 6),
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            timestamp: await this.getBlockTimestamp(event.blockNumber),
          });
          break;
          
        // Add other event handlers as needed
      }

    } catch (error) {
      logger.error('Error processing event:', error);
    }
  }

  async getBlockTimestamp(blockNumber) {
    try {
      const block = await this.provider.getBlock(blockNumber);
      return block.timestamp;
    } catch (error) {
      logger.error('Error getting block timestamp:', error);
      return Math.floor(Date.now() / 1000);
    }
  }

  // Event Handlers
  async handlePaymentCreated(data) {
    logger.info(`Payment created: ${data.paymentId} - ${data.amount} USDT`);
    this.emit('paymentCreated', data);
  }

  async handlePaymentReleased(data) {
    logger.info(`Payment released: ${data.paymentId} - ${data.merchantAmount} USDT`);
    this.emit('paymentReleased', data);
  }

  async handlePaymentRefunded(data) {
    logger.info(`Payment refunded: ${data.paymentId} - ${data.amount} USDT`);
    this.emit('paymentRefunded', data);
  }

  async handleMerchantRegistered(data) {
    logger.info(`Merchant registered: ${data.merchant} - ${data.businessName}`);
    this.emit('merchantRegistered', data);
  }

  async handleProductAdded(data) {
    logger.info(`Product added: ${data.productId} - ${data.name} (${data.price} USDT)`);
    this.emit('productAdded', data);
  }

  // Utility methods
  async getPaymentDetails(paymentId) {
    try {
      const payment = await this.paymentEscrowContract.getPayment(paymentId);
      return {
        id: payment.id.toString(),
        payer: payment.payer,
        merchant: payment.merchant,
        amount: ethers.utils.formatUnits(payment.amount, 6),
        platformFeeAmount: ethers.utils.formatUnits(payment.platformFeeAmount, 6),
        merchantAmount: ethers.utils.formatUnits(payment.merchantAmount, 6),
        createdAt: new Date(payment.createdAt.toNumber() * 1000),
        releasedAt: payment.releasedAt.toNumber() > 0 ? new Date(payment.releasedAt.toNumber() * 1000) : null,
        released: payment.released,
        refunded: payment.refunded,
        orderId: payment.orderId,
        description: payment.description,
      };
    } catch (error) {
      logger.error('Error getting payment details:', error);
      throw error;
    }
  }

  async getCurrentBlock() {
    return await this.provider.getBlockNumber();
  }

  async getNetworkInfo() {
    return await this.provider.getNetwork();
  }

  isHealthy() {
    return this.isRunning && this.provider !== null;
  }
}

module.exports = BlockchainIndexer;