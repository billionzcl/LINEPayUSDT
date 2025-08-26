// PaymentEscrow contract ABI (essential functions for frontend)
export const PAYMENT_ESCROW_ABI = [
  // Events
  "event PaymentCreated(uint256 indexed paymentId, address indexed payer, address indexed merchant, uint256 amount, string orderId, string description)",
  "event PaymentReleased(uint256 indexed paymentId, address indexed merchant, uint256 merchantAmount, uint256 platformFeeAmount)",
  "event PaymentRefunded(uint256 indexed paymentId, address indexed payer, uint256 amount)",
  
  // View functions
  "function getPayment(uint256 paymentId) external view returns (tuple(uint256 id, address payer, address merchant, uint256 amount, uint256 platformFeeAmount, uint256 merchantAmount, uint256 createdAt, uint256 releasedAt, bool released, bool refunded, string orderId, string description))",
  "function getPaymentByOrderId(string calldata orderId) external view returns (tuple(uint256 id, address payer, address merchant, uint256 amount, uint256 platformFeeAmount, uint256 merchantAmount, uint256 createdAt, uint256 releasedAt, bool released, bool refunded, string orderId, string description))",
  "function getPayerPayments(address payer) external view returns (uint256[])",
  "function getMerchantPayments(address merchant) external view returns (uint256[])",
  "function getCurrentPaymentId() external view returns (uint256)",
  "function canAutoRelease(uint256 paymentId) external view returns (bool)",
  "function platformFee() external view returns (uint256)",
  "function authorizedMerchants(address merchant) external view returns (bool)",
  
  // Write functions
  "function createPayment(address merchant, uint256 amount, string calldata orderId, string calldata description) external returns (uint256)",
  "function releasePayment(uint256 paymentId) external",
  "function refundPayment(uint256 paymentId) external",
];

// MerchantRegistry contract ABI
export const MERCHANT_REGISTRY_ABI = [
  // Events
  "event MerchantRegistered(address indexed merchant, string businessName, uint256 timestamp)",
  "event MerchantUpdated(address indexed merchant)",
  "event ProductAdded(uint256 indexed productId, address indexed merchant, string name, uint256 price)",
  "event ProductUpdated(uint256 indexed productId)",
  "event SaleRecorded(address indexed merchant, uint256 amount, uint256 timestamp)",
  "event RatingUpdated(address indexed merchant, uint8 newRating, uint256 ratingCount)",
  
  // View functions
  "function getMerchantProfile(address merchant) external view returns (tuple(address merchantAddress, string businessName, string description, string logoUrl, string websiteUrl, string contactEmail, uint256 registeredAt, bool isActive, bool isVerified, uint256 totalSales, uint256 totalTransactions, uint8 rating, uint256 ratingCount))",
  "function getMerchantProducts(address merchant) external view returns (uint256[])",
  "function getProduct(uint256 productId) external view returns (tuple(uint256 id, address merchant, string name, string description, string imageUrl, uint256 price, bool isActive, string category, uint256 createdAt))",
  "function getAllMerchants() external view returns (address[])",
  "function getMerchantsByCategory(string calldata category) external view returns (address[])",
  "function getTotalMerchants() external view returns (uint256)",
  "function isActiveMerchant(address merchant) external view returns (bool)",
  "function registeredMerchants(address merchant) external view returns (bool)",
  
  // Write functions
  "function registerMerchant(string calldata businessName, string calldata description, string calldata logoUrl, string calldata websiteUrl, string calldata contactEmail, string calldata category) external",
  "function updateMerchantProfile(string calldata businessName, string calldata description, string calldata logoUrl, string calldata websiteUrl, string calldata contactEmail) external",
  "function addProduct(string calldata name, string calldata description, string calldata imageUrl, uint256 price, string calldata category) external returns (uint256)",
  "function updateProduct(uint256 productId, string calldata name, string calldata description, string calldata imageUrl, uint256 price, string calldata category) external",
  "function deactivateProduct(uint256 productId) external",
  "function recordSale(address merchant, uint256 amount) external",
  "function updateRating(address merchant, uint8 rating) external",
];

// ERC20 token ABI (for USDT interactions)
export const ERC20_ABI = [
  // View functions
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  
  // Write functions
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
];