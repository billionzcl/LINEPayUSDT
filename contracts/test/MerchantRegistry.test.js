const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("MerchantRegistry", function () {
  async function deployMerchantRegistryFixture() {
    const [owner, merchant1, merchant2, customer] = await ethers.getSigners();

    const MerchantRegistry = await ethers.getContractFactory("MerchantRegistry");
    const merchantRegistry = await MerchantRegistry.deploy();
    await merchantRegistry.deployed();

    return { merchantRegistry, owner, merchant1, merchant2, customer };
  }

  describe("Deployment", function () {
    it("Should deploy with correct initial state", async function () {
      const { merchantRegistry, owner } = await loadFixture(deployMerchantRegistryFixture);

      expect(await merchantRegistry.owner()).to.equal(owner.address);
      expect(await merchantRegistry.getTotalMerchants()).to.equal(0);
    });
  });

  describe("Merchant Registration", function () {
    it("Should register a merchant successfully", async function () {
      const { merchantRegistry, merchant1 } = await loadFixture(deployMerchantRegistryFixture);

      const businessName = "Test Coffee Shop";
      const description = "Best coffee in town";
      const logoUrl = "https://example.com/logo.png";
      const websiteUrl = "https://example.com";
      const contactEmail = "contact@test.com";
      const category = "food";

      await expect(
        merchantRegistry.connect(merchant1).registerMerchant(
          businessName,
          description,
          logoUrl,
          websiteUrl,
          contactEmail,
          category
        )
      ).to.emit(merchantRegistry, "MerchantRegistered")
        .withArgs(merchant1.address, businessName, await ethers.provider.getBlock("latest").then(b => b.timestamp + 1));

      const profile = await merchantRegistry.getMerchantProfile(merchant1.address);
      expect(profile.merchantAddress).to.equal(merchant1.address);
      expect(profile.businessName).to.equal(businessName);
      expect(profile.description).to.equal(description);
      expect(profile.isActive).to.be.true;
      expect(profile.isVerified).to.be.false;
      expect(profile.rating).to.equal(50); // 5.0 stars
    });

    it("Should reject registration with empty business name", async function () {
      const { merchantRegistry, merchant1 } = await loadFixture(deployMerchantRegistryFixture);

      await expect(
        merchantRegistry.connect(merchant1).registerMerchant(
          "",
          "Description",
          "",
          "",
          "contact@test.com",
          "food"
        )
      ).to.be.revertedWith("Business name required");
    });

    it("Should reject registration with empty email", async function () {
      const { merchantRegistry, merchant1 } = await loadFixture(deployMerchantRegistryFixture);

      await expect(
        merchantRegistry.connect(merchant1).registerMerchant(
          "Test Shop",
          "Description",
          "",
          "",
          "",
          "food"
        )
      ).to.be.revertedWith("Contact email required");
    });

    it("Should reject duplicate registration", async function () {
      const { merchantRegistry, merchant1 } = await loadFixture(deployMerchantRegistryFixture);

      await merchantRegistry.connect(merchant1).registerMerchant(
        "Test Shop",
        "Description",
        "",
        "",
        "contact@test.com",
        "food"
      );

      await expect(
        merchantRegistry.connect(merchant1).registerMerchant(
          "Another Shop",
          "Description",
          "",
          "",
          "contact2@test.com",
          "food"
        )
      ).to.be.revertedWith("Already registered");
    });

    it("Should track total merchants correctly", async function () {
      const { merchantRegistry, merchant1, merchant2 } = await loadFixture(deployMerchantRegistryFixture);

      await merchantRegistry.connect(merchant1).registerMerchant(
        "Shop 1",
        "Description",
        "",
        "",
        "contact1@test.com",
        "food"
      );

      expect(await merchantRegistry.getTotalMerchants()).to.equal(1);

      await merchantRegistry.connect(merchant2).registerMerchant(
        "Shop 2",
        "Description",
        "",
        "",
        "contact2@test.com",
        "retail"
      );

      expect(await merchantRegistry.getTotalMerchants()).to.equal(2);
    });
  });

  describe("Merchant Profile Management", function () {
    beforeEach(async function () {
      const { merchantRegistry, merchant1 } = await loadFixture(deployMerchantRegistryFixture);
      
      await merchantRegistry.connect(merchant1).registerMerchant(
        "Test Shop",
        "Original description",
        "original-logo.png",
        "https://original.com",
        "original@test.com",
        "food"
      );
    });

    it("Should allow merchant to update profile", async function () {
      const { merchantRegistry, merchant1 } = await loadFixture(deployMerchantRegistryFixture);

      await expect(
        merchantRegistry.connect(merchant1).updateMerchantProfile(
          "Updated Shop Name",
          "Updated description",
          "new-logo.png",
          "https://new-site.com",
          "new@test.com"
        )
      ).to.emit(merchantRegistry, "MerchantUpdated")
        .withArgs(merchant1.address);

      const profile = await merchantRegistry.getMerchantProfile(merchant1.address);
      expect(profile.businessName).to.equal("Updated Shop Name");
      expect(profile.description).to.equal("Updated description");
      expect(profile.logoUrl).to.equal("new-logo.png");
    });

    it("Should reject profile update from unregistered merchant", async function () {
      const { merchantRegistry, merchant2 } = await loadFixture(deployMerchantRegistryFixture);

      await expect(
        merchantRegistry.connect(merchant2).updateMerchantProfile(
          "Shop Name",
          "Description",
          "",
          "",
          "contact@test.com"
        )
      ).to.be.revertedWith("Not a registered merchant");
    });
  });

  describe("Product Management", function () {
    beforeEach(async function () {
      const { merchantRegistry, merchant1 } = await loadFixture(deployMerchantRegistryFixture);
      
      await merchantRegistry.connect(merchant1).registerMerchant(
        "Test Shop",
        "Description",
        "",
        "",
        "contact@test.com",
        "food"
      );
    });

    it("Should allow merchant to add products", async function () {
      const { merchantRegistry, merchant1 } = await loadFixture(deployMerchantRegistryFixture);

      const productName = "Coffee";
      const description = "Premium coffee";
      const imageUrl = "coffee.jpg";
      const price = ethers.utils.parseUnits("5", 6); // $5 USDT
      const category = "beverages";

      await expect(
        merchantRegistry.connect(merchant1).addProduct(
          productName,
          description,
          imageUrl,
          price,
          category
        )
      ).to.emit(merchantRegistry, "ProductAdded")
        .withArgs(1, merchant1.address, productName, price);

      const product = await merchantRegistry.getProduct(1);
      expect(product.id).to.equal(1);
      expect(product.merchant).to.equal(merchant1.address);
      expect(product.name).to.equal(productName);
      expect(product.price).to.equal(price);
      expect(product.isActive).to.be.true;
    });

    it("Should reject product with empty name", async function () {
      const { merchantRegistry, merchant1 } = await loadFixture(deployMerchantRegistryFixture);

      await expect(
        merchantRegistry.connect(merchant1).addProduct(
          "",
          "Description",
          "",
          ethers.utils.parseUnits("5", 6),
          "food"
        )
      ).to.be.revertedWith("Product name required");
    });

    it("Should reject product with zero price", async function () {
      const { merchantRegistry, merchant1 } = await loadFixture(deployMerchantRegistryFixture);

      await expect(
        merchantRegistry.connect(merchant1).addProduct(
          "Product",
          "Description",
          "",
          0,
          "food"
        )
      ).to.be.revertedWith("Price must be greater than 0");
    });

    it("Should allow merchant to update their products", async function () {
      const { merchantRegistry, merchant1 } = await loadFixture(deployMerchantRegistryFixture);

      // Add product first
      await merchantRegistry.connect(merchant1).addProduct(
        "Coffee",
        "Description",
        "",
        ethers.utils.parseUnits("5", 6),
        "beverages"
      );

      // Update product
      await expect(
        merchantRegistry.connect(merchant1).updateProduct(
          1,
          "Premium Coffee",
          "Updated description",
          "new-image.jpg",
          ethers.utils.parseUnits("7", 6),
          "premium-beverages"
        )
      ).to.emit(merchantRegistry, "ProductUpdated")
        .withArgs(1);

      const product = await merchantRegistry.getProduct(1);
      expect(product.name).to.equal("Premium Coffee");
      expect(product.price).to.equal(ethers.utils.parseUnits("7", 6));
    });

    it("Should reject product update from non-owner", async function () {
      const { merchantRegistry, merchant1, merchant2 } = await loadFixture(deployMerchantRegistryFixture);

      // Register second merchant
      await merchantRegistry.connect(merchant2).registerMerchant(
        "Shop 2",
        "Description",
        "",
        "",
        "contact2@test.com",
        "food"
      );

      // Add product as merchant1
      await merchantRegistry.connect(merchant1).addProduct(
        "Coffee",
        "Description",
        "",
        ethers.utils.parseUnits("5", 6),
        "beverages"
      );

      // Try to update as merchant2
      await expect(
        merchantRegistry.connect(merchant2).updateProduct(
          1,
          "Hacked Coffee",
          "Description",
          "",
          ethers.utils.parseUnits("1", 6),
          "beverages"
        )
      ).to.be.revertedWith("Not product owner");
    });

    it("Should allow product deactivation", async function () {
      const { merchantRegistry, merchant1 } = await loadFixture(deployMerchantRegistryFixture);

      await merchantRegistry.connect(merchant1).addProduct(
        "Coffee",
        "Description",
        "",
        ethers.utils.parseUnits("5", 6),
        "beverages"
      );

      await expect(
        merchantRegistry.connect(merchant1).deactivateProduct(1)
      ).to.emit(merchantRegistry, "ProductDeactivated")
        .withArgs(1);

      const product = await merchantRegistry.getProduct(1);
      expect(product.isActive).to.be.false;
    });
  });

  describe("Sales Recording", function () {
    beforeEach(async function () {
      const { merchantRegistry, merchant1 } = await loadFixture(deployMerchantRegistryFixture);
      
      await merchantRegistry.connect(merchant1).registerMerchant(
        "Test Shop",
        "Description",
        "",
        "",
        "contact@test.com",
        "food"
      );
    });

    it("Should record sales correctly", async function () {
      const { merchantRegistry, merchant1, customer } = await loadFixture(deployMerchantRegistryFixture);

      const saleAmount = ethers.utils.parseUnits("100", 6);

      await expect(
        merchantRegistry.connect(customer).recordSale(merchant1.address, saleAmount)
      ).to.emit(merchantRegistry, "SaleRecorded")
        .withArgs(merchant1.address, saleAmount, await ethers.provider.getBlock("latest").then(b => b.timestamp + 1));

      const profile = await merchantRegistry.getMerchantProfile(merchant1.address);
      expect(profile.totalSales).to.equal(saleAmount);
      expect(profile.totalTransactions).to.equal(1);
    });
  });

  describe("Rating System", function () {
    beforeEach(async function () {
      const { merchantRegistry, merchant1 } = await loadFixture(deployMerchantRegistryFixture);
      
      await merchantRegistry.connect(merchant1).registerMerchant(
        "Test Shop",
        "Description",
        "",
        "",
        "contact@test.com",
        "food"
      );
    });

    it("Should update merchant rating", async function () {
      const { merchantRegistry, merchant1, customer } = await loadFixture(deployMerchantRegistryFixture);

      const rating = 40; // 4.0 stars

      await expect(
        merchantRegistry.connect(customer).updateRating(merchant1.address, rating)
      ).to.emit(merchantRegistry, "RatingUpdated");

      const profile = await merchantRegistry.getMerchantProfile(merchant1.address);
      expect(profile.ratingCount).to.equal(1);
      // Average of 50 (initial) and 40 should be 45
      expect(profile.rating).to.equal(45);
    });

    it("Should reject invalid ratings", async function () {
      const { merchantRegistry, merchant1, customer } = await loadFixture(deployMerchantRegistryFixture);

      await expect(
        merchantRegistry.connect(customer).updateRating(merchant1.address, 5) // 0.5 stars
      ).to.be.revertedWith("Rating must be between 1.0 and 5.0");

      await expect(
        merchantRegistry.connect(customer).updateRating(merchant1.address, 60) // 6.0 stars
      ).to.be.revertedWith("Rating must be between 1.0 and 5.0");
    });
  });

  describe("Admin Functions", function () {
    beforeEach(async function () {
      const { merchantRegistry, merchant1 } = await loadFixture(deployMerchantRegistryFixture);
      
      await merchantRegistry.connect(merchant1).registerMerchant(
        "Test Shop",
        "Description",
        "",
        "",
        "contact@test.com",
        "food"
      );
    });

    it("Should allow owner to verify merchants", async function () {
      const { merchantRegistry, owner, merchant1 } = await loadFixture(deployMerchantRegistryFixture);

      await expect(
        merchantRegistry.connect(owner).verifyMerchant(merchant1.address, true)
      ).to.emit(merchantRegistry, "MerchantVerified")
        .withArgs(merchant1.address, true);

      const profile = await merchantRegistry.getMerchantProfile(merchant1.address);
      expect(profile.isVerified).to.be.true;
    });

    it("Should allow owner to deactivate merchants", async function () {
      const { merchantRegistry, owner, merchant1 } = await loadFixture(deployMerchantRegistryFixture);

      await expect(
        merchantRegistry.connect(owner).deactivateMerchant(merchant1.address)
      ).to.emit(merchantRegistry, "MerchantDeactivated")
        .withArgs(merchant1.address);

      const profile = await merchantRegistry.getMerchantProfile(merchant1.address);
      expect(profile.isActive).to.be.false;
    });

    it("Should reject unauthorized admin actions", async function () {
      const { merchantRegistry, merchant1, customer } = await loadFixture(deployMerchantRegistryFixture);

      await expect(
        merchantRegistry.connect(customer).verifyMerchant(merchant1.address, true)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        merchantRegistry.connect(customer).deactivateMerchant(merchant1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      const { merchantRegistry, merchant1, merchant2 } = await loadFixture(deployMerchantRegistryFixture);
      
      await merchantRegistry.connect(merchant1).registerMerchant(
        "Shop 1",
        "Description 1",
        "",
        "",
        "contact1@test.com",
        "food"
      );

      await merchantRegistry.connect(merchant2).registerMerchant(
        "Shop 2",
        "Description 2",
        "",
        "",
        "contact2@test.com",
        "food"
      );
    });

    it("Should return all merchants", async function () {
      const { merchantRegistry, merchant1, merchant2 } = await loadFixture(deployMerchantRegistryFixture);

      const allMerchants = await merchantRegistry.getAllMerchants();
      expect(allMerchants.length).to.equal(2);
      expect(allMerchants[0]).to.equal(merchant1.address);
      expect(allMerchants[1]).to.equal(merchant2.address);
    });

    it("Should return merchants by category", async function () {
      const { merchantRegistry, merchant1, merchant2 } = await loadFixture(deployMerchantRegistryFixture);

      const foodMerchants = await merchantRegistry.getMerchantsByCategory("food");
      expect(foodMerchants.length).to.equal(2);
    });

    it("Should check merchant active status", async function () {
      const { merchantRegistry, merchant1 } = await loadFixture(deployMerchantRegistryFixture);

      expect(await merchantRegistry.isActiveMerchant(merchant1.address)).to.be.true;
    });
  });
});