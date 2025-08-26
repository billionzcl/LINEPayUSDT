const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting LINEPayUSDT contract deployment...");

  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "KAIA");

  // Contract configuration
  const config = {
    // Kaia Testnet USDT address (replace with actual address)
    usdtAddress: process.env.USDT_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000",
    feeRecipient: deployer.address, // Can be changed later via admin function
  };

  console.log("⚙️ Configuration:");
  console.log("  - USDT Address:", config.usdtAddress);
  console.log("  - Fee Recipient:", config.feeRecipient);

  // Deploy MerchantRegistry first
  console.log("\n📋 Deploying MerchantRegistry...");
  const MerchantRegistry = await ethers.getContractFactory("MerchantRegistry");
  const merchantRegistry = await MerchantRegistry.deploy();
  await merchantRegistry.deployed();
  console.log("✅ MerchantRegistry deployed to:", merchantRegistry.address);

  // Deploy PaymentEscrow
  console.log("\n💳 Deploying PaymentEscrow...");
  const PaymentEscrow = await ethers.getContractFactory("PaymentEscrow");
  const paymentEscrow = await PaymentEscrow.deploy(
    config.usdtAddress,
    config.feeRecipient
  );
  await paymentEscrow.deployed();
  console.log("✅ PaymentEscrow deployed to:", paymentEscrow.address);

  // Setup initial configuration
  console.log("\n⚙️ Setting up initial configuration...");

  // Register deployer as initial merchant for testing
  try {
    const tx1 = await merchantRegistry.registerMerchant(
      "Test Merchant",
      "A test merchant for demo purposes",
      "",
      "",
      "test@example.com",
      "general"
    );
    await tx1.wait();
    console.log("✅ Deployer registered as test merchant");

    // Authorize the test merchant in PaymentEscrow
    const tx2 = await paymentEscrow.setMerchantAuthorization(deployer.address, true);
    await tx2.wait();
    console.log("✅ Test merchant authorized in PaymentEscrow");
  } catch (error) {
    console.log("⚠️ Setup failed:", error.message);
  }

  // Save deployment information
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      MerchantRegistry: {
        address: merchantRegistry.address,
        constructorArgs: [],
      },
      PaymentEscrow: {
        address: paymentEscrow.address,
        constructorArgs: [config.usdtAddress, config.feeRecipient],
      },
    },
    configuration: config,
  };

  // Save to file
  const deploymentPath = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }

  const fileName = `deployment-${network.name}-${Date.now()}.json`;
  const filePath = path.join(deploymentPath, fileName);
  
  fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n📄 Deployment info saved to:", filePath);

  // Save latest deployment for easy access
  const latestPath = path.join(deploymentPath, `latest-${network.name}.json`);
  fs.writeFileSync(latestPath, JSON.stringify(deploymentInfo, null, 2));

  // Display summary
  console.log("\n🎉 Deployment Summary:");
  console.log("=" .repeat(50));
  console.log("Network:", network.name);
  console.log("Chain ID:", network.config.chainId);
  console.log("Deployer:", deployer.address);
  console.log("MerchantRegistry:", merchantRegistry.address);
  console.log("PaymentEscrow:", paymentEscrow.address);
  console.log("=" .repeat(50));

  // Verification instructions
  console.log("\n🔍 To verify contracts on block explorer:");
  console.log(`npx hardhat verify --network ${network.name} ${merchantRegistry.address}`);
  console.log(`npx hardhat verify --network ${network.name} ${paymentEscrow.address} "${config.usdtAddress}" "${config.feeRecipient}"`);

  // Next steps
  console.log("\n📋 Next Steps:");
  console.log("1. Update .env file with deployed contract addresses");
  console.log("2. Update frontend configuration with contract addresses");
  console.log("3. Update backend indexer with contract addresses");
  console.log("4. Register additional merchants via MerchantRegistry");
  console.log("5. Test the payment flow end-to-end");

  return {
    merchantRegistry: merchantRegistry.address,
    paymentEscrow: paymentEscrow.address,
  };
}

// Handle deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    });
}

module.exports = main;