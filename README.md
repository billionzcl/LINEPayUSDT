# LINEPayUSDT — Kaia-native USDT Payments for LINE Mini DApp

Enable fast, low-fee Kaia-native USDT payments inside LINE Messenger via a Mini DApp: pay merchants, tip creators, and settle micro-transactions with on-chain receipts and an optional escrow/refund flow.

## 🎯 Hackathon Target

**Kaia Wave Stablecoin Summer** - Building Kaia-native USDT DeFi solutions with LINE Mini DApp integration.

## ✨ Key Features

- **LINE Integration**: Native Mini DApp with LIFF SDK and Dapp Portal wallet
- **Kaia USDT Payments**: Fast, low-fee stablecoin transactions
- **Escrow System**: Optional merchant escrow for dispute-free settlements
- **On-chain Receipts**: Transparent transaction history
- **Merchant Dashboard**: Settlement management and analytics
- **QR Payments**: Quick payment via QR codes or deep links

## 🏗️ Architecture

```
├── contracts/          # Solidity smart contracts
├── frontend/           # React LIFF Mini DApp
├── backend/            # Node.js indexer and APIs
├── docs/              # Documentation and guides
└── tests/             # Contract and integration tests
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MetaMask or compatible wallet
- Kaia testnet tokens

### Installation

```bash
# Clone and install dependencies
git clone <repo-url>
cd KAIAUSDTPay
npm install

# Set up contracts
cd contracts
npm install
npx hardhat compile

# Set up frontend
cd ../frontend
npm install

# Set up backend
cd ../backend
npm install
```

### Deployment

1. Configure Kaia testnet in `hardhat.config.js`
2. Deploy contracts: `npx hardhat deploy --network kaia-testnet`
3. Update contract addresses in frontend/backend configs
4. Start services: `npm run dev`

## 📱 Demo Flow

1. Open LINE chat → tap LINEPayUSDT Mini DApp
2. Connect wallet via LINE Dapp Portal (one tap)
3. Select merchant item → confirm payment → approve USDT transfer
4. Merchant marks delivered → escrow released → receipt generated

## 🛠️ Tech Stack

- **Smart Contracts**: Solidity, Hardhat, OpenZeppelin
- **Frontend**: React, Tailwind CSS, LIFF SDK
- **Backend**: Node.js, Express, PostgreSQL, Redis
- **Blockchain**: Kaia L1, Kaia-native USDT (ERC-20 compatible)

## 📄 Documentation

- [Deployment Guide](./docs/DEPLOY.md)
- [Demo Instructions](./docs/DEMO.md)
- [API Documentation](./docs/API.md)
- [Smart Contract Guide](./docs/CONTRACTS.md)

## 🎪 Hackathon Deliverables

- ✅ Deployed smart contracts on Kaia testnet
- ✅ LINE Mini DApp with wallet integration
- ✅ Payment escrow system with refund capability
- ✅ Merchant dashboard and transaction indexer
- ✅ End-to-end demo video
- ✅ Comprehensive documentation

## 📊 Success Metrics

- Payment success rate (signed tx → confirmed on Kaia)
- Average transaction latency
- UX completion rate
- Merchant onboarding conversion
- On-chain receipt generation

## 🔗 Links

- [Kaia Wave Hackathon](https://dorahacks.io)
- [Kaia Documentation](https://kaia.io)
- [LINE Dapp Portal](https://dapp-portal.line.me)

## 📝 License

MIT License - see [LICENSE](./LICENSE) for details.