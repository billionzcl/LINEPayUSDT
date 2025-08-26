const logger = require('../utils/logger');

class MerchantController {
  constructor(databaseService) {
    this.db = databaseService;
  }

  // Get merchant profile
  async getMerchantProfile(req, res) {
    try {
      const { address } = req.params;

      if (!address) {
        return res.status(400).json({
          error: 'Merchant address is required',
        });
      }

      const merchant = await this.db.getMerchant(address);

      if (!merchant) {
        return res.status(404).json({
          error: 'Merchant not found',
        });
      }

      res.json({
        success: true,
        data: merchant,
      });

    } catch (error) {
      logger.error('Error getting merchant profile:', error);
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  // Get all merchants
  async getAllMerchants(req, res) {
    try {
      const merchants = await this.db.getAllMerchants();

      res.json({
        success: true,
        data: merchants,
      });

    } catch (error) {
      logger.error('Error getting all merchants:', error);
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  // Get merchant statistics
  async getMerchantStats(req, res) {
    try {
      const { address } = req.params;

      if (!address) {
        return res.status(400).json({
          error: 'Merchant address is required',
        });
      }

      const stats = await this.db.getMerchantStats(address);

      res.json({
        success: true,
        data: stats,
      });

    } catch (error) {
      logger.error('Error getting merchant stats:', error);
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  // Get merchant products
  async getMerchantProducts(req, res) {
    try {
      const { address } = req.params;

      if (!address) {
        return res.status(400).json({
          error: 'Merchant address is required',
        });
      }

      const products = await this.db.getProductsByMerchant(address);

      res.json({
        success: true,
        data: products,
      });

    } catch (error) {
      logger.error('Error getting merchant products:', error);
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  // Get all products
  async getAllProducts(req, res) {
    try {
      const products = await this.db.getAllProducts();

      res.json({
        success: true,
        data: products,
      });

    } catch (error) {
      logger.error('Error getting all products:', error);
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  // Get merchant dashboard data
  async getDashboardData(req, res) {
    try {
      const { address } = req.params;

      if (!address) {
        return res.status(400).json({
          error: 'Merchant address is required',
        });
      }

      // Get merchant profile
      const merchant = await this.db.getMerchant(address);
      if (!merchant) {
        return res.status(404).json({
          error: 'Merchant not found',
        });
      }

      // Get merchant statistics
      const stats = await this.db.getMerchantStats(address);

      // Get recent payments
      const payments = await this.db.getPaymentsByMerchant(address);
      const recentPayments = payments.slice(0, 10);

      // Get pending payments
      const pendingPayments = payments.filter(p => !p.released && !p.refunded);

      // Get merchant products
      const products = await this.db.getProductsByMerchant(address);

      const dashboardData = {
        merchant,
        stats: stats,
        recentPayments,
        pendingPayments,
        products,
        summary: {
          totalPayments: stats.totalPayments,
          totalVolume: stats.totalVolume,
          pendingCount: pendingPayments.length,
          productCount: products.length,
        },
      };

      res.json({
        success: true,
        data: dashboardData,
      });

    } catch (error) {
      logger.error('Error getting merchant dashboard data:', error);
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  // Export merchant transactions (CSV format)
  async exportTransactions(req, res) {
    try {
      const { address } = req.params;
      const { format = 'csv' } = req.query;

      if (!address) {
        return res.status(400).json({
          error: 'Merchant address is required',
        });
      }

      const payments = await this.db.getPaymentsByMerchant(address);

      if (format === 'csv') {
        // Generate CSV
        const csvHeader = 'Payment ID,Payer,Amount,Status,Order ID,Description,Created At,Released At,Transaction Hash\n';
        const csvRows = payments.map(payment => 
          `${payment.id},${payment.payer},${payment.amount},${payment.status},${payment.orderId},"${payment.description}",${payment.createdAt.toISOString()},${payment.releasedAt ? payment.releasedAt.toISOString() : ''},${payment.transactionHash}`
        ).join('\n');

        const csv = csvHeader + csvRows;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="merchant-${address}-transactions.csv"`);
        res.send(csv);
      } else {
        // Return JSON
        res.json({
          success: true,
          data: payments,
        });
      }

    } catch (error) {
      logger.error('Error exporting merchant transactions:', error);
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  // Get merchant analytics
  async getAnalytics(req, res) {
    try {
      const { address } = req.params;
      const { period = '30d' } = req.query;

      if (!address) {
        return res.status(400).json({
          error: 'Merchant address is required',
        });
      }

      const payments = await this.db.getPaymentsByMerchant(address);

      // Calculate period start date
      const now = new Date();
      let startDate;
      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Filter payments by period
      const periodPayments = payments.filter(p => p.createdAt >= startDate);

      // Calculate analytics
      const analytics = {
        period,
        totalPayments: periodPayments.length,
        totalVolume: periodPayments.reduce((sum, p) => sum + p.amount, 0),
        releasedPayments: periodPayments.filter(p => p.released).length,
        pendingPayments: periodPayments.filter(p => !p.released && !p.refunded).length,
        refundedPayments: periodPayments.filter(p => p.refunded).length,
        averageAmount: periodPayments.length > 0 ? 
          periodPayments.reduce((sum, p) => sum + p.amount, 0) / periodPayments.length : 0,
        
        // Daily breakdown
        dailyStats: this.calculateDailyStats(periodPayments, startDate, now),
        
        // Top products (mock data for demo)
        topProducts: [
          { name: 'Coffee', sales: 45, revenue: 112.50 },
          { name: 'Croissant', sales: 32, revenue: 99.20 },
          { name: 'Tea', sales: 28, revenue: 53.20 },
          { name: 'Cake', sales: 15, revenue: 63.00 },
        ],
      };

      res.json({
        success: true,
        data: analytics,
      });

    } catch (error) {
      logger.error('Error getting merchant analytics:', error);
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  // Helper method to calculate daily stats
  calculateDailyStats(payments, startDate, endDate) {
    const dailyStats = [];
    const msPerDay = 24 * 60 * 60 * 1000;
    
    for (let date = new Date(startDate); date <= endDate; date.setTime(date.getTime() + msPerDay)) {
      const dayStart = new Date(date);
      const dayEnd = new Date(date.getTime() + msPerDay);
      
      const dayPayments = payments.filter(p => 
        p.createdAt >= dayStart && p.createdAt < dayEnd
      );
      
      dailyStats.push({
        date: dayStart.toISOString().split('T')[0],
        payments: dayPayments.length,
        volume: dayPayments.reduce((sum, p) => sum + p.amount, 0),
        released: dayPayments.filter(p => p.released).length,
      });
    }
    
    return dailyStats;
  }
}

module.exports = MerchantController;