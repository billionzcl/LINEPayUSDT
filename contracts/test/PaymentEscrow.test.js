const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("PaymentEscrow", function () {
  // Test constants
  const INITIAL_SUPPLY = ethers.utils.parseUnits("1000000", 6); // 1M USDT (6 decimals)
  const PAYMENT_AMOUNT = ethers.utils.parseUnits("100", 6); // 100 USDT
  const PLATFORM_FEE = 100; // 1%
  const AUTO_RELEASE_DELAY = 7 * 24 * 60 * 60; // 7 days

  async function deployContractsFixture() {
    // Get signers
    const [owner, merchant, payer, feeRecipient, unauthorized] = await ethers.getSigners();

    // Deploy mock USDT token
    const MockUSDT = await ethers.getContractFactory("MockERC20");
    const usdt = await MockUSDT.deploy("Tether USD", "USDT", 6, INITIAL_SUPPLY);
    await usdt.deployed();

    // Deploy PaymentEscrow
    const PaymentEscrow = await ethers.getContractFactory("PaymentEscrow");
    const paymentEscrow = await PaymentEscrow.deploy(usdt.address, feeRecipient.address);
    await paymentEscrow.deployed();

    // Setup: transfer USDT to payer and approve escrow contract
    await usdt.transfer(payer.address, PAYMENT_AMOUNT.mul(10));
    await usdt.connect(payer).approve(paymentEscrow.address, PAYMENT_AMOUNT.mul(10));

    // Authorize merchant
    await paymentEscrow.setMerchantAuthorization(merchant.address, true);

    return { paymentEscrow, usdt, owner, merchant, payer, feeRecipient, unauthorized };
  }

  describe("Deployment", function () {
    it("Should deploy with correct initial values", async function () {
      const { paymentEscrow, usdt, feeRecipient } = await loadFixture(deployContractsFixture);

      expect(await paymentEscrow.usdt()).to.equal(usdt.address);
      expect(await paymentEscrow.feeRecipient()).to.equal(feeRecipient.address);
      expect(await paymentEscrow.platformFee()).to.equal(PLATFORM_FEE);
      expect(await paymentEscrow.getCurrentPaymentId()).to.equal(0);
    });

    it("Should reject invalid constructor parameters", async function () {
      const PaymentEscrow = await ethers.getContractFactory("PaymentEscrow");
      
      await expect(
        PaymentEscrow.deploy(ethers.constants.AddressZero, ethers.constants.AddressZero)
      ).to.be.revertedWith("Invalid USDT address");
    });
  });

  describe("Merchant Authorization", function () {
    it("Should allow owner to authorize merchants", async function () {
      const { paymentEscrow, merchant } = await loadFixture(deployContractsFixture);

      expect(await paymentEscrow.authorizedMerchants(merchant.address)).to.be.true;
    });

    it("Should allow owner to deauthorize merchants", async function () {
      const { paymentEscrow, merchant, owner } = await loadFixture(deployContractsFixture);

      await paymentEscrow.connect(owner).setMerchantAuthorization(merchant.address, false);
      expect(await paymentEscrow.authorizedMerchants(merchant.address)).to.be.false;
    });

    it("Should reject unauthorized users from authorizing merchants", async function () {
      const { paymentEscrow, unauthorized } = await loadFixture(deployContractsFixture);

      await expect(
        paymentEscrow.connect(unauthorized).setMerchantAuthorization(unauthorized.address, true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Payment Creation", function () {
    it("Should create payment successfully", async function () {
      const { paymentEscrow, payer, merchant } = await loadFixture(deployContractsFixture);

      const orderId = "ORDER123";
      const description = "Test payment";

      await expect(
        paymentEscrow.connect(payer).createPayment(
          merchant.address,
          PAYMENT_AMOUNT,
          orderId,
          description
        )
      ).to.emit(paymentEscrow, "PaymentCreated")
        .withArgs(1, payer.address, merchant.address, PAYMENT_AMOUNT, orderId, description);

      const payment = await paymentEscrow.getPayment(1);
      expect(payment.payer).to.equal(payer.address);
      expect(payment.merchant).to.equal(merchant.address);
      expect(payment.amount).to.equal(PAYMENT_AMOUNT);
      expect(payment.orderId).to.equal(orderId);
      expect(payment.description).to.equal(description);
      expect(payment.released).to.be.false;
      expect(payment.refunded).to.be.false;
    });

    it("Should calculate platform fee correctly", async function () {
      const { paymentEscrow, payer, merchant } = await loadFixture(deployContractsFixture);

      await paymentEscrow.connect(payer).createPayment(
        merchant.address,
        PAYMENT_AMOUNT,
        "ORDER123",
        "Test payment"
      );

      const payment = await paymentEscrow.getPayment(1);
      const expectedFee = PAYMENT_AMOUNT.mul(PLATFORM_FEE).div(10000);
      const expectedMerchantAmount = PAYMENT_AMOUNT.sub(expectedFee);

      expect(payment.platformFeeAmount).to.equal(expectedFee);
      expect(payment.merchantAmount).to.equal(expectedMerchantAmount);
    });

    it("Should reject payment to unauthorized merchant", async function () {
      const { paymentEscrow, payer, unauthorized } = await loadFixture(deployContractsFixture);

      await expect(
        paymentEscrow.connect(payer).createPayment(
          unauthorized.address,
          PAYMENT_AMOUNT,
          "ORDER123",
          "Test payment"
        )
      ).to.be.revertedWith("Merchant not authorized");
    });

    it("Should reject payment to self", async function () {
      const { paymentEscrow, payer } = await loadFixture(deployContractsFixture);

      await paymentEscrow.setMerchantAuthorization(payer.address, true);

      await expect(
        paymentEscrow.connect(payer).createPayment(
          payer.address,
          PAYMENT_AMOUNT,
          "ORDER123",
          "Test payment"
        )
      ).to.be.revertedWith("Cannot pay yourself");
    });

    it("Should reject duplicate order IDs", async function () {
      const { paymentEscrow, payer, merchant } = await loadFixture(deployContractsFixture);

      const orderId = "ORDER123";

      await paymentEscrow.connect(payer).createPayment(
        merchant.address,
        PAYMENT_AMOUNT,
        orderId,
        "First payment"
      );

      await expect(
        paymentEscrow.connect(payer).createPayment(
          merchant.address,
          PAYMENT_AMOUNT,
          orderId,
          "Second payment"
        )
      ).to.be.revertedWith("Order ID already exists");
    });

    it("Should reject zero amount", async function () {
      const { paymentEscrow, payer, merchant } = await loadFixture(deployContractsFixture);

      await expect(
        paymentEscrow.connect(payer).createPayment(
          merchant.address,
          0,
          "ORDER123",
          "Test payment"
        )
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should reject empty order ID", async function () {
      const { paymentEscrow, payer, merchant } = await loadFixture(deployContractsFixture);

      await expect(
        paymentEscrow.connect(payer).createPayment(
          merchant.address,
          PAYMENT_AMOUNT,
          "",
          "Test payment"
        )
      ).to.be.revertedWith("Order ID required");
    });
  });

  describe("Payment Release", function () {
    beforeEach(async function () {
      const { paymentEscrow, payer, merchant } = await loadFixture(deployContractsFixture);
      
      await paymentEscrow.connect(payer).createPayment(
        merchant.address,
        PAYMENT_AMOUNT,
        "ORDER123",
        "Test payment"
      );
    });

    it("Should allow merchant to release payment", async function () {
      const { paymentEscrow, merchant, feeRecipient } = await loadFixture(deployContractsFixture);

      const payment = await paymentEscrow.getPayment(1);
      const merchantBalanceBefore = await paymentEscrow.usdt().then(token => token.balanceOf(merchant.address));
      const feeRecipientBalanceBefore = await paymentEscrow.usdt().then(token => token.balanceOf(feeRecipient.address));

      await expect(
        paymentEscrow.connect(merchant).releasePayment(1)
      ).to.emit(paymentEscrow, "PaymentReleased")
        .withArgs(1, merchant.address, payment.merchantAmount, payment.platformFeeAmount);

      const paymentAfter = await paymentEscrow.getPayment(1);
      expect(paymentAfter.released).to.be.true;
      expect(paymentAfter.releasedAt).to.be.gt(0);
    });

    it("Should allow auto-release after timelock", async function () {
      const { paymentEscrow, payer, merchant } = await loadFixture(deployContractsFixture);

      // Fast forward time
      await time.increase(AUTO_RELEASE_DELAY + 1);

      await expect(
        paymentEscrow.connect(payer).releasePayment(1)
      ).to.emit(paymentEscrow, "PaymentReleased");
    });

    it("Should reject unauthorized release", async function () {
      const { paymentEscrow, unauthorized } = await loadFixture(deployContractsFixture);

      await expect(
        paymentEscrow.connect(unauthorized).releasePayment(1)
      ).to.be.revertedWith("Not authorized to release or timelock not passed");
    });

    it("Should reject double release", async function () {
      const { paymentEscrow, merchant } = await loadFixture(deployContractsFixture);

      await paymentEscrow.connect(merchant).releasePayment(1);

      await expect(
        paymentEscrow.connect(merchant).releasePayment(1)
      ).to.be.revertedWith("Payment already processed");
    });
  });

  describe("Payment Refund", function () {
    beforeEach(async function () {
      const { paymentEscrow, payer, merchant } = await loadFixture(deployContractsFixture);
      
      await paymentEscrow.connect(payer).createPayment(
        merchant.address,
        PAYMENT_AMOUNT,
        "ORDER123",
        "Test payment"
      );
    });

    it("Should allow payer to refund payment", async function () {
      const { paymentEscrow, payer } = await loadFixture(deployContractsFixture);

      await expect(
        paymentEscrow.connect(payer).refundPayment(1)
      ).to.emit(paymentEscrow, "PaymentRefunded")
        .withArgs(1, payer.address, PAYMENT_AMOUNT);

      const payment = await paymentEscrow.getPayment(1);
      expect(payment.refunded).to.be.true;
    });

    it("Should allow owner to refund payment", async function () {
      const { paymentEscrow, owner, payer } = await loadFixture(deployContractsFixture);

      await expect(
        paymentEscrow.connect(owner).refundPayment(1)
      ).to.emit(paymentEscrow, "PaymentRefunded")
        .withArgs(1, payer.address, PAYMENT_AMOUNT);
    });

    it("Should reject unauthorized refund", async function () {
      const { paymentEscrow, unauthorized } = await loadFixture(deployContractsFixture);

      await expect(
        paymentEscrow.connect(unauthorized).refundPayment(1)
      ).to.be.revertedWith("Not authorized to refund");
    });

    it("Should reject double refund", async function () {
      const { paymentEscrow, payer } = await loadFixture(deployContractsFixture);

      await paymentEscrow.connect(payer).refundPayment(1);

      await expect(
        paymentEscrow.connect(payer).refundPayment(1)
      ).to.be.revertedWith("Payment already processed");
    });

    it("Should reject refund after release", async function () {
      const { paymentEscrow, payer, merchant } = await loadFixture(deployContractsFixture);

      await paymentEscrow.connect(merchant).releasePayment(1);

      await expect(
        paymentEscrow.connect(payer).refundPayment(1)
      ).to.be.revertedWith("Payment already processed");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      const { paymentEscrow, payer, merchant } = await loadFixture(deployContractsFixture);
      
      await paymentEscrow.connect(payer).createPayment(
        merchant.address,
        PAYMENT_AMOUNT,
        "ORDER123",
        "Test payment"
      );
    });

    it("Should return payment by order ID", async function () {
      const { paymentEscrow } = await loadFixture(deployContractsFixture);

      const payment = await paymentEscrow.getPaymentByOrderId("ORDER123");
      expect(payment.id).to.equal(1);
      expect(payment.orderId).to.equal("ORDER123");
    });

    it("Should return payer payments", async function () {
      const { paymentEscrow, payer } = await loadFixture(deployContractsFixture);

      const payments = await paymentEscrow.getPayerPayments(payer.address);
      expect(payments.length).to.equal(1);
      expect(payments[0]).to.equal(1);
    });

    it("Should return merchant payments", async function () {
      const { paymentEscrow, merchant } = await loadFixture(deployContractsFixture);

      const payments = await paymentEscrow.getMerchantPayments(merchant.address);
      expect(payments.length).to.equal(1);
      expect(payments[0]).to.equal(1);
    });

    it("Should check if payment can be auto-released", async function () {
      const { paymentEscrow } = await loadFixture(deployContractsFixture);

      expect(await paymentEscrow.canAutoRelease(1)).to.be.false;

      await time.increase(AUTO_RELEASE_DELAY + 1);
      expect(await paymentEscrow.canAutoRelease(1)).to.be.true;
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update platform fee", async function () {
      const { paymentEscrow, owner } = await loadFixture(deployContractsFixture);

      const newFee = 200; // 2%
      await expect(
        paymentEscrow.connect(owner).setPlatformFee(newFee)
      ).to.emit(paymentEscrow, "PlatformFeeUpdated")
        .withArgs(PLATFORM_FEE, newFee);

      expect(await paymentEscrow.platformFee()).to.equal(newFee);
    });

    it("Should reject fee higher than maximum", async function () {
      const { paymentEscrow, owner } = await loadFixture(deployContractsFixture);

      await expect(
        paymentEscrow.connect(owner).setPlatformFee(600) // 6%
      ).to.be.revertedWith("Fee too high");
    });

    it("Should allow owner to update fee recipient", async function () {
      const { paymentEscrow, owner, payer } = await loadFixture(deployContractsFixture);

      await expect(
        paymentEscrow.connect(owner).setFeeRecipient(payer.address)
      ).to.emit(paymentEscrow, "FeeRecipientUpdated");

      expect(await paymentEscrow.feeRecipient()).to.equal(payer.address);
    });

    it("Should allow owner to pause and unpause", async function () {
      const { paymentEscrow, owner, payer, merchant } = await loadFixture(deployContractsFixture);

      await paymentEscrow.connect(owner).pause();
      expect(await paymentEscrow.paused()).to.be.true;

      await expect(
        paymentEscrow.connect(payer).createPayment(
          merchant.address,
          PAYMENT_AMOUNT,
          "ORDER456",
          "Test payment"
        )
      ).to.be.revertedWith("Pausable: paused");

      await paymentEscrow.connect(owner).unpause();
      expect(await paymentEscrow.paused()).to.be.false;
    });
  });
});

// Mock ERC20 contract for testing
contract("MockERC20", function () {
  // MockERC20 implementation would go here if needed
});