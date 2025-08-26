// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title MerchantRegistry
 * @dev Registry contract for managing merchant profiles and metadata
 */
contract MerchantRegistry is Ownable, Pausable {
    
    struct MerchantProfile {
        address merchantAddress;
        string businessName;
        string description;
        string logoUrl;
        string websiteUrl;
        string contactEmail;
        uint256 registeredAt;
        bool isActive;
        bool isVerified;
        uint256 totalSales;
        uint256 totalTransactions;
        uint8 rating; // 1-5 stars (multiplied by 10, so 50 = 5.0 stars)
        uint256 ratingCount;
    }

    struct Product {
        uint256 id;
        address merchant;
        string name;
        string description;
        string imageUrl;
        uint256 price; // in USDT (with 6 decimals)
        bool isActive;
        string category;
        uint256 createdAt;
    }

    // State variables
    mapping(address => MerchantProfile) public merchants;
    mapping(address => bool) public registeredMerchants;
    mapping(uint256 => Product) public products;
    mapping(address => uint256[]) public merchantProducts;
    mapping(string => address[]) public categoryMerchants;
    
    address[] public allMerchants;
    uint256 private _nextProductId = 1;
    
    // Events
    event MerchantRegistered(
        address indexed merchant,
        string businessName,
        uint256 timestamp
    );
    
    event MerchantUpdated(address indexed merchant);
    event MerchantVerified(address indexed merchant, bool verified);
    event MerchantDeactivated(address indexed merchant);
    
    event ProductAdded(
        uint256 indexed productId,
        address indexed merchant,
        string name,
        uint256 price
    );
    
    event ProductUpdated(uint256 indexed productId);
    event ProductDeactivated(uint256 indexed productId);
    
    event SaleRecorded(
        address indexed merchant,
        uint256 amount,
        uint256 timestamp
    );
    
    event RatingUpdated(
        address indexed merchant,
        uint8 newRating,
        uint256 ratingCount
    );

    modifier onlyRegisteredMerchant() {
        require(registeredMerchants[msg.sender], "Not a registered merchant");
        require(merchants[msg.sender].isActive, "Merchant not active");
        _;
    }

    modifier validMerchant(address merchant) {
        require(registeredMerchants[merchant], "Merchant not registered");
        _;
    }

    modifier productExists(uint256 productId) {
        require(products[productId].id != 0, "Product does not exist");
        _;
    }

    /**
     * @dev Register a new merchant
     */
    function registerMerchant(
        string calldata businessName,
        string calldata description,
        string calldata logoUrl,
        string calldata websiteUrl,
        string calldata contactEmail,
        string calldata category
    ) external whenNotPaused {
        require(!registeredMerchants[msg.sender], "Already registered");
        require(bytes(businessName).length > 0, "Business name required");
        require(bytes(contactEmail).length > 0, "Contact email required");

        MerchantProfile storage profile = merchants[msg.sender];
        profile.merchantAddress = msg.sender;
        profile.businessName = businessName;
        profile.description = description;
        profile.logoUrl = logoUrl;
        profile.websiteUrl = websiteUrl;
        profile.contactEmail = contactEmail;
        profile.registeredAt = block.timestamp;
        profile.isActive = true;
        profile.isVerified = false;
        profile.rating = 50; // Start with 5.0 stars
        profile.ratingCount = 0;

        registeredMerchants[msg.sender] = true;
        allMerchants.push(msg.sender);
        
        if (bytes(category).length > 0) {
            categoryMerchants[category].push(msg.sender);
        }

        emit MerchantRegistered(msg.sender, businessName, block.timestamp);
    }

    /**
     * @dev Update merchant profile
     */
    function updateMerchantProfile(
        string calldata businessName,
        string calldata description,
        string calldata logoUrl,
        string calldata websiteUrl,
        string calldata contactEmail
    ) external onlyRegisteredMerchant {
        MerchantProfile storage profile = merchants[msg.sender];
        
        if (bytes(businessName).length > 0) {
            profile.businessName = businessName;
        }
        profile.description = description;
        profile.logoUrl = logoUrl;
        profile.websiteUrl = websiteUrl;
        if (bytes(contactEmail).length > 0) {
            profile.contactEmail = contactEmail;
        }

        emit MerchantUpdated(msg.sender);
    }

    /**
     * @dev Add a new product
     */
    function addProduct(
        string calldata name,
        string calldata description,
        string calldata imageUrl,
        uint256 price,
        string calldata category
    ) external onlyRegisteredMerchant returns (uint256) {
        require(bytes(name).length > 0, "Product name required");
        require(price > 0, "Price must be greater than 0");

        uint256 productId = _nextProductId++;
        
        Product storage product = products[productId];
        product.id = productId;
        product.merchant = msg.sender;
        product.name = name;
        product.description = description;
        product.imageUrl = imageUrl;
        product.price = price;
        product.isActive = true;
        product.category = category;
        product.createdAt = block.timestamp;

        merchantProducts[msg.sender].push(productId);

        emit ProductAdded(productId, msg.sender, name, price);
        return productId;
    }

    /**
     * @dev Update product information
     */
    function updateProduct(
        uint256 productId,
        string calldata name,
        string calldata description,
        string calldata imageUrl,
        uint256 price,
        string calldata category
    ) external productExists(productId) {
        Product storage product = products[productId];
        require(product.merchant == msg.sender, "Not product owner");

        if (bytes(name).length > 0) {
            product.name = name;
        }
        product.description = description;
        product.imageUrl = imageUrl;
        if (price > 0) {
            product.price = price;
        }
        product.category = category;

        emit ProductUpdated(productId);
    }

    /**
     * @dev Deactivate a product
     */
    function deactivateProduct(uint256 productId) external productExists(productId) {
        Product storage product = products[productId];
        require(product.merchant == msg.sender || msg.sender == owner(), "Not authorized");
        
        product.isActive = false;
        emit ProductDeactivated(productId);
    }

    /**
     * @dev Record a sale (only callable by authorized contracts)
     */
    function recordSale(address merchant, uint256 amount) external {
        // In a full implementation, this would be restricted to authorized contracts
        require(registeredMerchants[merchant], "Merchant not registered");
        
        MerchantProfile storage profile = merchants[merchant];
        profile.totalSales += amount;
        profile.totalTransactions += 1;

        emit SaleRecorded(merchant, amount, block.timestamp);
    }

    /**
     * @dev Update merchant rating
     */
    function updateRating(address merchant, uint8 rating) external validMerchant(merchant) {
        require(rating >= 10 && rating <= 50, "Rating must be between 1.0 and 5.0");
        
        MerchantProfile storage profile = merchants[merchant];
        
        // Simple average calculation (in production, use more sophisticated algorithm)
        uint256 totalRating = (profile.rating * profile.ratingCount) + rating;
        profile.ratingCount += 1;
        profile.rating = uint8(totalRating / profile.ratingCount);

        emit RatingUpdated(merchant, profile.rating, profile.ratingCount);
    }

    // View functions

    /**
     * @dev Get merchant profile
     */
    function getMerchantProfile(address merchant) external view returns (MerchantProfile memory) {
        require(registeredMerchants[merchant], "Merchant not registered");
        return merchants[merchant];
    }

    /**
     * @dev Get merchant's products
     */
    function getMerchantProducts(address merchant) external view returns (uint256[] memory) {
        return merchantProducts[merchant];
    }

    /**
     * @dev Get product details
     */
    function getProduct(uint256 productId) external view returns (Product memory) {
        require(products[productId].id != 0, "Product does not exist");
        return products[productId];
    }

    /**
     * @dev Get all merchants
     */
    function getAllMerchants() external view returns (address[] memory) {
        return allMerchants;
    }

    /**
     * @dev Get merchants by category
     */
    function getMerchantsByCategory(string calldata category) external view returns (address[] memory) {
        return categoryMerchants[category];
    }

    /**
     * @dev Get total number of registered merchants
     */
    function getTotalMerchants() external view returns (uint256) {
        return allMerchants.length;
    }

    /**
     * @dev Check if merchant is registered and active
     */
    function isActiveMerchant(address merchant) external view returns (bool) {
        return registeredMerchants[merchant] && merchants[merchant].isActive;
    }

    // Admin functions

    /**
     * @dev Verify a merchant (only owner)
     */
    function verifyMerchant(address merchant, bool verified) external onlyOwner validMerchant(merchant) {
        merchants[merchant].isVerified = verified;
        emit MerchantVerified(merchant, verified);
    }

    /**
     * @dev Deactivate a merchant (only owner)
     */
    function deactivateMerchant(address merchant) external onlyOwner validMerchant(merchant) {
        merchants[merchant].isActive = false;
        emit MerchantDeactivated(merchant);
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
}