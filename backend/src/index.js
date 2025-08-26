const Server = require('./server');
const logger = require('./utils/logger');

async function main() {
  try {
    logger.info('Starting LINEPayUSDT Backend...');

    const server = new Server();
    await server.start();

    logger.info('LINEPayUSDT Backend started successfully!');

  } catch (error) {
    logger.error('Failed to start LINEPayUSDT Backend:', error);
    process.exit(1);
  }
}

// Start the application
if (require.main === module) {
  main();
}

module.exports = main;