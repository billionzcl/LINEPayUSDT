require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-gas-reporter");

// Load environment variables
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const KAIA_TESTNET_RPC = process.env.KAIA_TESTNET_RPC || "https://api.baobab.klaytn.net:8651";
const KAIA_MAINNET_RPC = process.env.KAIA_MAINNET_RPC || "https://api.cypress.klaytn.net:8651";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    "kaia-testnet": {
      url: KAIA_TESTNET_RPC,
      accounts: [PRIVATE_KEY],
      chainId: 1001,
      gasPrice: 25000000000, // 25 gwei
    },
    "kaia-mainnet": {
      url: KAIA_MAINNET_RPC,
      accounts: [PRIVATE_KEY],
      chainId: 8217,
      gasPrice: 25000000000, // 25 gwei
    },
  },
  etherscan: {
    apiKey: {
      "kaia-testnet": ETHERSCAN_API_KEY,
      "kaia-mainnet": ETHERSCAN_API_KEY,
    },
    customChains: [
      {
        network: "kaia-testnet",
        chainId: 1001,
        urls: {
          apiURL: "https://api-baobab.klaytnscope.com/api",
          browserURL: "https://baobab.klaytnscope.com",
        },
      },
      {
        network: "kaia-mainnet",
        chainId: 8217,
        urls: {
          apiURL: "https://api.klaytnscope.com/api",
          browserURL: "https://klaytnscope.com",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};