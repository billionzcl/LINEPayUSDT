const logger = require('../utils/logger');

class PaymentController {
  constructor(databaseService, indexer) {
    this.db = databaseService;
    this.indexer = indexer;
  }

  // Get payment by ID
  async getPayment(req, res) {
    try {
      const { paymentId } = req.params;
      
      if (!paymentId) {
        return res.status(400).json({
          error: 'Payment ID is required',
        });
      }

      // Try to get from database first
      let payment = await this.db.getPayment(paymentId);
      
      // If not in database, try to get from blockchain
      if (!payment && this.indexer) {
        try {
          const blockchainPayment = await this.indexer.getPaymentDetails(paymentId);
          payment = blockchainPayment;
        } catch (error) {
          logger.warn(`Payment ${paymentId} not found on blockchain:`, error.message);
        }
      }

      if (!payment) {
        return res.status(404).json({
          error: 'Payment not found',
        });
      }

      res.json({
        success: true,
        data: payment,
      });

    } catch (error) {
      logger.error('Error getting payment:', error);
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  // Get payments by payer address
  async getPaymentsByPayer(req, res) {
    try {
      const { address } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      if (!address) {
        return res.status(400).json({
          error: 'Payer address is required',
        });
      }

      const payments = await this.db.getPaymentsByPayer(address);
      
      const paginatedPayments = payments.slice(
        parseInt(offset), 
        parseInt(offset) + parseInt(limit)
      );

      res.json({
        success: true,
        data: {
          payments: paginatedPayments,
          total: payments.length,
          hasMore: parseInt(offset) + parseInt(limit) < payments.length,
        },
      });

    } catch (error) {
      logger.error('Error getting payments by payer:', error);
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  // Get payments by merchant address
  async getPaymentsByMerchant(req, res) {
    try {
      const { address } = req.params;
      const { limit = 20, offset = 0, status } = req.query;

      if (!address) {
        return res.status(400).json({
          error: 'Merchant address is required',
        });
      }

      let payments = await this.db.getPaymentsByMerchant(address);

      // Filter by status if provided
      if (status) {
        payments = payments.filter(payment => payment.status === status);
      }
      
      const paginatedPayments = payments.slice(
        parseInt(offset), 
        parseInt(offset) + parseInt(limit)
      );

      res.json({
        success: true,
        data: {
          payments: paginatedPayments,
          total: payments.length,
          hasMore: parseInt(offset) + parseInt(limit) < payments.length,
        },
      });

    } catch (error) {
      logger.error('Error getting payments by merchant:', error);
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  // Get all payments (admin)
  async getAllPayments(req, res) {
    try {
      const { limit = 20, offset = 0, status } = req.query;

      const result = await this.db.getAllPayments(parseInt(limit), parseInt(offset));
      
      let payments = result.payments;

      // Filter by status if provided
      if (status) {
        payments = payments.filter(payment => payment.status === status);
      }

      res.json({
        success: true,
        data: {
          payments,
          total: result.total,
          hasMore: result.hasMore,
        },
      });

    } catch (error) {
      logger.error('Error getting all payments:', error);
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  // Get payment statistics
  async getPaymentStats(req, res) {
    try {
      const stats = await this.db.getPaymentStats();

      res.json({
        success: true,
        data: stats,
      });

    } catch (error) {
      logger.error('Error getting payment stats:', error);
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  // Get recent payment events
  async getRecentEvents(req, res) {
    try {
      const { limit = 10 } = req.query;

      const events = await this.db.getRecentEvents(parseInt(limit));

      res.json({
        success: true,
        data: events,
      });

    } catch (error) {
      logger.error('Error getting recent events:', error);
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  // Webhook for payment notifications (future enhancement)
  async handleWebhook(req, res) {
    try {
      const { type, data } = req.body;

      logger.info(`Webhook received: ${type}`, data);

      // Process webhook based on type
      switch (type) {
        case 'payment_created':
          // Handle payment created notification
          break;
        case 'payment_released':
          // Handle payment released notification
          break;
        case 'payment_refunded':
          // Handle payment refunded notification
          break;
        default:
          logger.warn(`Unknown webhook type: ${type}`);
      }

      res.json({
        success: true,
        message: 'Webhook processed',
      });

    } catch (error) {
      logger.error('Error handling webhook:', error);
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }
}

module.exports = PaymentController;