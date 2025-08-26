const express = require('express');
const PaymentController = require('../controllers/paymentController');
const MerchantController = require('../controllers/merchantController');
const { validateAddress, validatePagination } = require('../middleware/validation');

function createRoutes(databaseService, indexer) {
  const router = express.Router();
  const paymentController = new PaymentController(databaseService, indexer);
  const merchantController = new MerchantController(databaseService);

  // Health check
  router.get('/health', async (req, res) => {
    try {
      const dbHealth = await databaseService.healthCheck();
      const indexerHealth = indexer ? indexer.isHealthy() : false;

      res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: dbHealth,
          indexer: indexerHealth,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        status: 'unhealthy',
        error: error.message,
      });
    }
  });

  // Payment routes
  router.get('/payments/stats', paymentController.getPaymentStats.bind(paymentController));
  router.get('/payments/events', paymentController.getRecentEvents.bind(paymentController));
  router.get('/payments/:paymentId', paymentController.getPayment.bind(paymentController));
  router.get('/payments', validatePagination, paymentController.getAllPayments.bind(paymentController));
  
  // Payment routes by address
  router.get('/payments/payer/:address', 
    validateAddress, 
    validatePagination, 
    paymentController.getPaymentsByPayer.bind(paymentController)
  );
  
  router.get('/payments/merchant/:address', 
    validateAddress, 
    validatePagination, 
    paymentController.getPaymentsByMerchant.bind(paymentController)
  );

  // Webhook route
  router.post('/webhooks/payment', paymentController.handleWebhook.bind(paymentController));

  // Merchant routes
  router.get('/merchants', merchantController.getAllMerchants.bind(merchantController));
  router.get('/merchants/:address', validateAddress, merchantController.getMerchantProfile.bind(merchantController));
  router.get('/merchants/:address/stats', validateAddress, merchantController.getMerchantStats.bind(merchantController));
  router.get('/merchants/:address/products', validateAddress, merchantController.getMerchantProducts.bind(merchantController));
  router.get('/merchants/:address/dashboard', validateAddress, merchantController.getDashboardData.bind(merchantController));
  router.get('/merchants/:address/analytics', validateAddress, merchantController.getAnalytics.bind(merchantController));
  router.get('/merchants/:address/export', validateAddress, merchantController.exportTransactions.bind(merchantController));

  // Product routes
  router.get('/products', merchantController.getAllProducts.bind(merchantController));

  // Indexer routes (admin/debug)
  router.get('/indexer/status', async (req, res) => {
    try {
      if (!indexer) {
        return res.status(503).json({
          error: 'Indexer not available',
        });
      }

      const currentBlock = await indexer.getCurrentBlock();
      const networkInfo = await indexer.getNetworkInfo();

      res.json({
        success: true,
        data: {
          isRunning: indexer.isRunning,
          currentBlock,
          lastProcessedBlock: indexer.lastProcessedBlock,
          network: networkInfo,
          isHealthy: indexer.isHealthy(),
        },
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get indexer status',
        details: error.message,
      });
    }
  });

  // Demo data route (development only)
  if (process.env.NODE_ENV === 'development') {
    router.post('/demo/seed', async (req, res) => {
      try {
        await databaseService.seedDemoData();
        res.json({
          success: true,
          message: 'Demo data seeded successfully',
        });
      } catch (error) {
        res.status(500).json({
          error: 'Failed to seed demo data',
          details: error.message,
        });
      }
    });
  }

  return router;
}

module.exports = createRoutes;