const { ethers } = require('ethers');

// Validate Ethereum address
const validateAddress = (req, res, next) => {
  const { address } = req.params;
  
  if (!address) {
    return res.status(400).json({
      error: 'Address is required',
    });
  }

  if (!ethers.utils.isAddress(address)) {
    return res.status(400).json({
      error: 'Invalid Ethereum address format',
    });
  }

  next();
};

// Validate pagination parameters
const validatePagination = (req, res, next) => {
  const { limit, offset } = req.query;

  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    return res.status(400).json({
      error: 'Limit must be a number between 1 and 100',
    });
  }

  if (offset && (isNaN(offset) || parseInt(offset) < 0)) {
    return res.status(400).json({
      error: 'Offset must be a non-negative number',
    });
  }

  next();
};

// Validate payment ID
const validatePaymentId = (req, res, next) => {
  const { paymentId } = req.params;
  
  if (!paymentId) {
    return res.status(400).json({
      error: 'Payment ID is required',
    });
  }

  if (isNaN(paymentId) || parseInt(paymentId) < 1) {
    return res.status(400).json({
      error: 'Payment ID must be a positive number',
    });
  }

  next();
};

// Validate webhook payload
const validateWebhook = (req, res, next) => {
  const { type, data } = req.body;

  if (!type) {
    return res.status(400).json({
      error: 'Webhook type is required',
    });
  }

  if (!data) {
    return res.status(400).json({
      error: 'Webhook data is required',
    });
  }

  const validTypes = ['payment_created', 'payment_released', 'payment_refunded'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      error: 'Invalid webhook type',
    });
  }

  next();
};

// Validate query parameters
const validateQuery = (allowedParams) => {
  return (req, res, next) => {
    const queryKeys = Object.keys(req.query);
    const invalidParams = queryKeys.filter(key => !allowedParams.includes(key));

    if (invalidParams.length > 0) {
      return res.status(400).json({
        error: `Invalid query parameters: ${invalidParams.join(', ')}`,
        allowed: allowedParams,
      });
    }

    next();
  };
};

module.exports = {
  validateAddress,
  validatePagination,
  validatePaymentId,
  validateWebhook,
  validateQuery,
};