// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title PaymentEscrow
 * @dev Escrow contract for secure USDT payments between buyers and merchants
 * Supports automatic release, manual release, and refund mechanisms
 */
contract PaymentEscrow is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;

    // State variables
    IERC20 public immutable usdt;
    Counters.Counter private _paymentIds;
    
    // Timelock for automatic release (7 days)
    uint256 public constant AUTO_RELEASE_DELAY = 7 days;
    
    // Fee for the platform (1% = 100 basis points)
    uint256 public platformFee = 100; // 1%
    uint256 public constant MAX_FEE = 500; // 5% maximum
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    address public feeRecipient;

    struct Payment {
        uint256 id;
        address payer;
        address merchant;
        uint256 amount;
        uint256 platformFeeAmount;
        uint256 merchantAmount;
        uint256 createdAt;
        uint256 releasedAt;
        bool released;
        bool refunded;
        string orderId;
        string description;
    }

    // Mappings
    mapping(uint256 => Payment) public payments;
    mapping(address => uint256[]) public payerPayments;
    mapping(address => uint256[]) public merchantPayments;
    mapping(string => uint256) public orderIdToPaymentId;
    mapping(address => bool) public authorizedMerchants;

    // Events
    event PaymentCreated(
        uint256 indexed paymentId,
        address indexed payer,
        address indexed merchant,
        uint256 amount,
        string orderId,
        string description
    );
    
    event PaymentReleased(
        uint256 indexed paymentId,
        address indexed merchant,
        uint256 merchantAmount,
        uint256 platformFeeAmount
    );
    
    event PaymentRefunded(
        uint256 indexed paymentId,
        address indexed payer,
        uint256 amount
    );
    
    event MerchantAuthorized(address indexed merchant, bool authorized);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);

    modifier onlyAuthorizedMerchant() {
        require(authorizedMerchants[msg.sender], "Not authorized merchant");
        _;
    }

    modifier paymentExists(uint256 paymentId) {
        require(payments[paymentId].id != 0, "Payment does not exist");
        _;
    }

    modifier paymentNotProcessed(uint256 paymentId) {
        Payment memory payment = payments[paymentId];
        require(!payment.released && !payment.refunded, "Payment already processed");
        _;
    }

    constructor(address _usdt, address _feeRecipient) {
        require(_usdt != address(0), "Invalid USDT address");
        require(_feeRecipient != address(0), "Invalid fee recipient");
        
        usdt = IERC20(_usdt);
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev Create a new escrow payment
     * @param merchant The merchant receiving the payment
     * @param amount The total amount to be escrowed
     * @param orderId Unique order identifier
     * @param description Payment description
     */
    function createPayment(
        address merchant,
        uint256 amount,
        string calldata orderId,
        string calldata description
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(merchant != address(0), "Invalid merchant address");
        require(merchant != msg.sender, "Cannot pay yourself");
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(orderId).length > 0, "Order ID required");
        require(orderIdToPaymentId[orderId] == 0, "Order ID already exists");
        require(authorizedMerchants[merchant], "Merchant not authorized");

        // Calculate fees
        uint256 platformFeeAmount = (amount * platformFee) / FEE_DENOMINATOR;
        uint256 merchantAmount = amount - platformFeeAmount;

        // Transfer USDT from payer to this contract
        usdt.safeTransferFrom(msg.sender, address(this), amount);

        // Create payment record
        _paymentIds.increment();
        uint256 paymentId = _paymentIds.current();

        Payment storage payment = payments[paymentId];
        payment.id = paymentId;
        payment.payer = msg.sender;
        payment.merchant = merchant;
        payment.amount = amount;
        payment.platformFeeAmount = platformFeeAmount;
        payment.merchantAmount = merchantAmount;
        payment.createdAt = block.timestamp;
        payment.orderId = orderId;
        payment.description = description;

        // Update mappings
        payerPayments[msg.sender].push(paymentId);
        merchantPayments[merchant].push(paymentId);
        orderIdToPaymentId[orderId] = paymentId;

        emit PaymentCreated(paymentId, msg.sender, merchant, amount, orderId, description);

        return paymentId;
    }

    /**
     * @dev Release payment to merchant (only by merchant or after timelock)
     * @param paymentId The payment ID to release
     */
    function releasePayment(uint256 paymentId) 
        external 
        nonReentrant 
        paymentExists(paymentId) 
        paymentNotProcessed(paymentId) 
    {
        Payment storage payment = payments[paymentId];
        
        require(
            msg.sender == payment.merchant || 
            (block.timestamp >= payment.createdAt + AUTO_RELEASE_DELAY),
            "Not authorized to release or timelock not passed"
        );

        payment.released = true;
        payment.releasedAt = block.timestamp;

        // Transfer merchant amount to merchant
        usdt.safeTransfer(payment.merchant, payment.merchantAmount);
        
        // Transfer platform fee to fee recipient
        if (payment.platformFeeAmount > 0) {
            usdt.safeTransfer(feeRecipient, payment.platformFeeAmount);
        }

        emit PaymentReleased(paymentId, payment.merchant, payment.merchantAmount, payment.platformFeeAmount);
    }

    /**
     * @dev Refund payment to payer (only by payer or owner)
     * @param paymentId The payment ID to refund
     */
    function refundPayment(uint256 paymentId) 
        external 
        nonReentrant 
        paymentExists(paymentId) 
        paymentNotProcessed(paymentId) 
    {
        Payment storage payment = payments[paymentId];
        
        require(
            msg.sender == payment.payer || msg.sender == owner(),
            "Not authorized to refund"
        );

        payment.refunded = true;

        // Refund full amount to payer (no fees charged on refund)
        usdt.safeTransfer(payment.payer, payment.amount);

        emit PaymentRefunded(paymentId, payment.payer, payment.amount);
    }

    /**
     * @dev Get payment details
     * @param paymentId The payment ID
     */
    function getPayment(uint256 paymentId) external view returns (Payment memory) {
        require(payments[paymentId].id != 0, "Payment does not exist");
        return payments[paymentId];
    }

    /**
     * @dev Get payment ID by order ID
     * @param orderId The order ID
     */
    function getPaymentByOrderId(string calldata orderId) external view returns (Payment memory) {
        uint256 paymentId = orderIdToPaymentId[orderId];
        require(paymentId != 0, "Order not found");
        return payments[paymentId];
    }

    /**
     * @dev Get payer's payment history
     * @param payer The payer address
     */
    function getPayerPayments(address payer) external view returns (uint256[] memory) {
        return payerPayments[payer];
    }

    /**
     * @dev Get merchant's payment history
     * @param merchant The merchant address
     */
    function getMerchantPayments(address merchant) external view returns (uint256[] memory) {
        return merchantPayments[merchant];
    }

    /**
     * @dev Get current payment counter
     */
    function getCurrentPaymentId() external view returns (uint256) {
        return _paymentIds.current();
    }

    /**
     * @dev Check if payment can be auto-released
     * @param paymentId The payment ID
     */
    function canAutoRelease(uint256 paymentId) external view returns (bool) {
        Payment memory payment = payments[paymentId];
        return !payment.released && 
               !payment.refunded && 
               block.timestamp >= payment.createdAt + AUTO_RELEASE_DELAY;
    }

    // Admin functions

    /**
     * @dev Authorize or deauthorize a merchant
     * @param merchant The merchant address
     * @param authorized Whether the merchant is authorized
     */
    function setMerchantAuthorization(address merchant, bool authorized) external onlyOwner {
        require(merchant != address(0), "Invalid merchant address");
        authorizedMerchants[merchant] = authorized;
        emit MerchantAuthorized(merchant, authorized);
    }

    /**
     * @dev Update platform fee
     * @param newFee The new fee in basis points
     */
    function setPlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_FEE, "Fee too high");
        uint256 oldFee = platformFee;
        platformFee = newFee;
        emit PlatformFeeUpdated(oldFee, newFee);
    }

    /**
     * @dev Update fee recipient
     * @param newFeeRecipient The new fee recipient address
     */
    function setFeeRecipient(address newFeeRecipient) external onlyOwner {
        require(newFeeRecipient != address(0), "Invalid address");
        address oldRecipient = feeRecipient;
        feeRecipient = newFeeRecipient;
        emit FeeRecipientUpdated(oldRecipient, newFeeRecipient);
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdrawal (only owner, only when paused)
     * @param token The token to withdraw
     * @param amount The amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner whenPaused {
        IERC20(token).safeTransfer(owner(), amount);
    }
}