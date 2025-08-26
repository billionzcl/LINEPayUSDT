const config = require('../config');
const logger = require('../utils/logger');

// In-memory database for demo (replace with real database in production)
class DatabaseService {
  constructor() {
    this.payments = new Map();
    this.merchants = new Map();
    this.products = new Map();
    this.events = [];
  }

  async initialize() {
    logger.info('Initializing database service...');
    // In production, this would connect to PostgreSQL
    // For demo, we use in-memory storage
    logger.info('Database service initialized (in-memory)');
  }

  // Payment operations
  async createPayment(paymentData) {
    try {
      const payment = {
        id: paymentData.paymentId,
        payer: paymentData.payer,
        merchant: paymentData.merchant,
        amount: parseFloat(paymentData.amount),
        orderId: paymentData.orderId,
        description: paymentData.description,
        status: 'created',
        createdAt: new Date(paymentData.timestamp * 1000),
        updatedAt: new Date(),
        blockNumber: paymentData.blockNumber,
        transactionHash: paymentData.transactionHash,
        released: false,
        refunded: false,
        releasedAt: null,
        platformFeeAmount: null,
        merchantAmount: null,
      };

      this.payments.set(payment.id, payment);
      
      // Log event
      this.events.push({
        type: 'payment_created',
        paymentId: payment.id,
        timestamp: new Date(),
        data: payment,
      });

      logger.info(`Payment created in database: ${payment.id}`);
      return payment;
    } catch (error) {
      logger.error('Error creating payment in database:', error);
      throw error;
    }
  }

  async updatePaymentReleased(paymentData) {
    try {
      const payment = this.payments.get(paymentData.paymentId);
      if (!payment) {
        throw new Error(`Payment not found: ${paymentData.paymentId}`);
      }

      payment.status = 'released';
      payment.released = true;
      payment.releasedAt = new Date(paymentData.timestamp * 1000);
      payment.platformFeeAmount = parseFloat(paymentData.platformFeeAmount);
      payment.merchantAmount = parseFloat(paymentData.merchantAmount);
      payment.updatedAt = new Date();

      this.payments.set(payment.id, payment);

      // Log event
      this.events.push({
        type: 'payment_released',
        paymentId: payment.id,
        timestamp: new Date(),
        data: paymentData,
      });

      logger.info(`Payment released in database: ${payment.id}`);
      return payment;
    } catch (error) {
      logger.error('Error updating payment release in database:', error);
      throw error;
    }
  }

  async updatePaymentRefunded(paymentData) {
    try {
      const payment = this.payments.get(paymentData.paymentId);
      if (!payment) {
        throw new Error(`Payment not found: ${paymentData.paymentId}`);
      }

      payment.status = 'refunded';
      payment.refunded = true;
      payment.updatedAt = new Date();

      this.payments.set(payment.id, payment);

      // Log event
      this.events.push({
        type: 'payment_refunded',
        paymentId: payment.id,
        timestamp: new Date(),
        data: paymentData,
      });

      logger.info(`Payment refunded in database: ${payment.id}`);
      return payment;
    } catch (error) {
      logger.error('Error updating payment refund in database:', error);
      throw error;
    }
  }

  async getPayment(paymentId) {
    return this.payments.get(paymentId);
  }

  async getPaymentsByPayer(payerAddress) {
    return Array.from(this.payments.values())
      .filter(payment => payment.payer.toLowerCase() === payerAddress.toLowerCase())
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async getPaymentsByMerchant(merchantAddress) {
    return Array.from(this.payments.values())
      .filter(payment => payment.merchant.toLowerCase() === merchantAddress.toLowerCase())
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async getAllPayments(limit = 50, offset = 0) {
    const payments = Array.from(this.payments.values())
      .sort((a, b) => b.createdAt - a.createdAt);
    
    return {
      payments: payments.slice(offset, offset + limit),
      total: payments.length,
      hasMore: offset + limit < payments.length,
    };
  }

  // Merchant operations
  async createMerchant(merchantData) {
    try {
      const merchant = {
        address: merchantData.merchant,
        businessName: merchantData.businessName,
        registeredAt: new Date(merchantData.timestamp * 1000),
        isActive: true,
        isVerified: false,
        totalSales: 0,
        totalTransactions: 0,
        rating: 5.0,
        ratingCount: 0,
        blockNumber: merchantData.blockNumber,
        transactionHash: merchantData.transactionHash,
      };

      this.merchants.set(merchant.address, merchant);

      // Log event
      this.events.push({
        type: 'merchant_registered',
        merchantAddress: merchant.address,
        timestamp: new Date(),
        data: merchant,
      });

      logger.info(`Merchant created in database: ${merchant.address}`);
      return merchant;
    } catch (error) {
      logger.error('Error creating merchant in database:', error);
      throw error;
    }
  }

  async getMerchant(merchantAddress) {
    return this.merchants.get(merchantAddress);
  }

  async getAllMerchants() {
    return Array.from(this.merchants.values())
      .sort((a, b) => b.registeredAt - a.registeredAt);
  }

  async updateMerchantSales(merchantAddress, amount) {
    try {
      const merchant = this.merchants.get(merchantAddress);
      if (merchant) {
        merchant.totalSales += parseFloat(amount);
        merchant.totalTransactions += 1;
        this.merchants.set(merchantAddress, merchant);
      }
    } catch (error) {
      logger.error('Error updating merchant sales:', error);
    }
  }

  // Product operations
  async createProduct(productData) {
    try {
      const product = {
        id: productData.productId,
        merchant: productData.merchant,
        name: productData.name,
        price: parseFloat(productData.price),
        isActive: true,
        createdAt: new Date(productData.timestamp * 1000),
        blockNumber: productData.blockNumber,
        transactionHash: productData.transactionHash,
      };

      this.products.set(product.id, product);

      // Log event
      this.events.push({
        type: 'product_added',
        productId: product.id,
        timestamp: new Date(),
        data: product,
      });

      logger.info(`Product created in database: ${product.id}`);
      return product;
    } catch (error) {
      logger.error('Error creating product in database:', error);
      throw error;
    }
  }

  async getProduct(productId) {
    return this.products.get(productId);
  }

  async getProductsByMerchant(merchantAddress) {
    return Array.from(this.products.values())
      .filter(product => product.merchant.toLowerCase() === merchantAddress.toLowerCase())
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async getAllProducts() {
    return Array.from(this.products.values())
      .filter(product => product.isActive)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // Analytics operations
  async getPaymentStats() {
    const payments = Array.from(this.payments.values());
    
    const totalPayments = payments.length;
    const totalVolume = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const releasedPayments = payments.filter(p => p.released).length;
    const refundedPayments = payments.filter(p => p.refunded).length;
    const pendingPayments = payments.filter(p => !p.released && !p.refunded).length;

    return {
      totalPayments,
      totalVolume,
      releasedPayments,
      refundedPayments,
      pendingPayments,
      averageAmount: totalPayments > 0 ? totalVolume / totalPayments : 0,
    };
  }

  async getMerchantStats(merchantAddress) {
    const payments = await this.getPaymentsByMerchant(merchantAddress);
    const merchant = await this.getMerchant(merchantAddress);

    const totalPayments = payments.length;
    const totalVolume = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const releasedPayments = payments.filter(p => p.released).length;
    const pendingPayments = payments.filter(p => !p.released && !p.refunded).length;

    return {
      merchant,
      totalPayments,
      totalVolume,
      releasedPayments,
      pendingPayments,
      averageAmount: totalPayments > 0 ? totalVolume / totalPayments : 0,
    };
  }

  // Event operations
  async getRecentEvents(limit = 20) {
    return this.events
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  async getEventsByType(type, limit = 20) {
    return this.events
      .filter(event => event.type === type)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Health check
  async healthCheck() {
    return {
      status: 'healthy',
      payments: this.payments.size,
      merchants: this.merchants.size,
      products: this.products.size,
      events: this.events.length,
    };
  }

  // Demo data seeding
  async seedDemoData() {
    logger.info('Seeding demo data...');

    // Create demo merchant
    await this.createMerchant({
      merchant: '0x1234567890123456789012345678901234567890',
      businessName: 'LINE Café',
      timestamp: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
      blockNumber: 1000,
      transactionHash: '0xdemo1',
    });

    // Create demo products
    await this.createProduct({
      productId: '1',
      merchant: '0x1234567890123456789012345678901234567890',
      name: 'Coffee',
      price: '2.50',
      timestamp: Math.floor(Date.now() / 1000) - 86400,
      blockNumber: 1001,
      transactionHash: '0xdemo2',
    });

    await this.createProduct({
      productId: '2',
      merchant: '0x1234567890123456789012345678901234567890',
      name: 'Croissant',
      price: '3.10',
      timestamp: Math.floor(Date.now() / 1000) - 86400,
      blockNumber: 1002,
      transactionHash: '0xdemo3',
    });

    // Create demo payment
    await this.createPayment({
      paymentId: '1',
      payer: '0xBDFF111122223333444455556666777788883D22',
      merchant: '0x1234567890123456789012345678901234567890',
      amount: '2.50',
      orderId: 'ORDER_123456',
      description: 'Coffee payment',
      timestamp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      blockNumber: 1003,
      transactionHash: '0xdemo4',
    });

    logger.info('Demo data seeded successfully');
  }
}

module.exports = DatabaseService;