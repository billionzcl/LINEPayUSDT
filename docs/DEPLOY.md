# LINEPayUSDT Deployment Guide

This guide provides comprehensive instructions for deploying the LINEPayUSDT system across all environments.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   LINE Client   │◄──►│  React Frontend │◄──►│  Node.js API    │
│   (LIFF SDK)    │    │   (Mini DApp)   │    │   (Indexer)     │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │                 │    │                 │
                       │ Kaia Blockchain │◄──►│   PostgreSQL    │
                       │ Smart Contracts │    │   Database      │
                       │                 │    │                 │
                       └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

### Development Environment
```bash
# Required Software
- Node.js 18+
- npm or yarn
- Git
- MetaMask or compatible wallet

# Optional Tools
- Docker & Docker Compose
- PM2 for production deployment
- nginx for reverse proxy
```

### Kaia Network Setup
```bash
# Add Kaia networks to your wallet
Testnet (Kairos):
- Chain ID: 1001
- RPC: https://api.baobab.klaytn.net:8651
- Explorer: https://baobab.klaytnscope.com

Mainnet (Cypress):
- Chain ID: 8217
- RPC: https://api.cypress.klaytn.net:8651
- Explorer: https://klaytnscope.com
```

### LINE Developer Setup
1. Create LINE Developers account
2. Create new LIFF app
3. Configure LIFF settings
4. Get LIFF ID for deployment

## 🚀 Step-by-Step Deployment

### Step 1: Clone and Install Dependencies

```bash
# Clone repository
git clone https://github.com/your-username/KAIAUSDTPay
cd KAIAUSDTPay

# Install all dependencies
npm run install:all

# Or install individually
cd contracts && npm install
cd ../frontend && npm install
cd ../backend && npm install
```

### Step 2: Environment Configuration

#### Contracts Environment
```bash
cd contracts
cp .env.example .env
```

Edit `.env`:
```bash
# Your wallet private key (with testnet KAIA)
PRIVATE_KEY=your_private_key_here

# RPC URLs
KAIA_TESTNET_RPC=https://api.baobab.klaytn.net:8651
KAIA_MAINNET_RPC=https://api.cypress.klaytn.net:8651

# Block explorer API key (optional)
ETHERSCAN_API_KEY=your_api_key

# USDT token address (testnet)
USDT_TOKEN_ADDRESS=0x...
```

#### Frontend Environment
```bash
cd frontend
cp .env.example .env
```

Edit `.env`:
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3001
VITE_NETWORK=testnet

# Contract addresses (filled after deployment)
VITE_PAYMENT_ESCROW_ADDRESS=0x...
VITE_MERCHANT_REGISTRY_ADDRESS=0x...
VITE_USDT_TOKEN_ADDRESS=0x...

# LINE LIFF Configuration
VITE_LIFF_ID=your-liff-id-here

# Blockchain Configuration
VITE_KAIA_TESTNET_RPC=https://api.baobab.klaytn.net:8651
VITE_CHAIN_ID=1001
```

#### Backend Environment
```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://localhost:5432/linepayusdt
REDIS_URL=redis://localhost:6379

# Blockchain
KAIA_RPC_URL=https://api.baobab.klaytn.net:8651
PRIVATE_KEY=your_private_key_here

# Contracts (filled after deployment)
PAYMENT_ESCROW_ADDRESS=0x...
MERCHANT_REGISTRY_ADDRESS=0x...

# LINE Configuration
LINE_CHANNEL_SECRET=your_channel_secret
```

### Step 3: Deploy Smart Contracts

#### Testnet Deployment
```bash
cd contracts

# Compile contracts
npm run compile

# Run tests
npm test

# Deploy to testnet
npm run deploy:testnet

# Verify contracts (optional)
npx hardhat verify --network kaia-testnet <contract-address> <constructor-args>
```

#### Mainnet Deployment
```bash
# Deploy to mainnet (production)
npm run deploy:mainnet

# Verify contracts
npx hardhat verify --network kaia-mainnet <contract-address> <constructor-args>
```

**Important**: Save the deployed contract addresses and update all environment files.

### Step 4: Set Up Database (Backend)

#### PostgreSQL Setup
```bash
# Install PostgreSQL
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/

# Create database
sudo -u postgres createdb linepayusdt

# Create user
sudo -u postgres psql
postgres=# CREATE USER linepayadmin WITH PASSWORD 'your_password';
postgres=# GRANT ALL PRIVILEGES ON DATABASE linepayusdt TO linepayadmin;
postgres=# \q
```

#### Redis Setup (Optional)
```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis

# Windows
# Download from https://redis.io/download
```

### Step 5: Deploy Backend API

```bash
cd backend

# Install dependencies
npm install

# Set up database
npm run db:migrate
npm run db:seed

# Start development server
npm run dev

# For production
npm run build
npm start
```

#### Production Deployment with PM2
```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

### Step 6: Deploy Frontend

#### Development Deployment
```bash
cd frontend

# Start development server
npm run dev

# Application will be available at http://localhost:3000
```

#### Production Deployment
```bash
# Build for production
npm run build

# Serve static files
npm install -g serve
serve -s dist -l 3000

# Or use nginx (recommended)
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        root /path/to/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Step 7: Configure LINE LIFF

1. **Create LIFF App**
   - Go to LINE Developers Console
   - Create new provider/channel
   - Add LIFF app

2. **LIFF Settings**
   ```json
   {
     "liffId": "your-liff-id",
     "view": {
       "type": "full",
       "url": "https://your-domain.com"
     },
     "features": {
       "ble": false,
       "qrCodeReader": true
     },
     "permanentLinkPattern": "concat"
   }
   ```

3. **Update Environment**
   ```bash
   # Update frontend .env
   VITE_LIFF_ID=your-actual-liff-id
   ```

## 🔧 Configuration Updates

### Update Contract Addresses
After deployment, update all configuration files:

1. **Frontend (.env)**
   ```bash
   VITE_PAYMENT_ESCROW_ADDRESS=0xActualEscrowAddress
   VITE_MERCHANT_REGISTRY_ADDRESS=0xActualRegistryAddress
   VITE_USDT_TOKEN_ADDRESS=0xActualUSDTAddress
   ```

2. **Backend (.env)**
   ```bash
   PAYMENT_ESCROW_ADDRESS=0xActualEscrowAddress
   MERCHANT_REGISTRY_ADDRESS=0xActualRegistryAddress
   ```

3. **Documentation**
   Update README.md and other docs with actual addresses.

## 🧪 Testing Deployment

### Contract Testing
```bash
cd contracts

# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Check contract verification
npx hardhat verify --list-networks
```

### Frontend Testing
```bash
cd frontend

# Run component tests
npm test

# Run E2E tests
npm run test:e2e

# Build and test
npm run build
npm run preview
```

### Backend Testing
```bash
cd backend

# Run API tests
npm test

# Test database connection
npm run db:test

# Test blockchain connection
npm run test:blockchain
```

### End-to-End Testing
```bash
# Test complete payment flow
1. Connect wallet
2. Select product
3. Confirm payment
4. Process transaction
5. Verify in merchant dashboard
```

## 🚀 Production Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale api=3
```

### Cloud Deployment Options

#### AWS Deployment
```bash
# Frontend: S3 + CloudFront
aws s3 sync dist/ s3://your-bucket --delete
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"

# Backend: EC2 + RDS
# Use AWS CLI or Terraform for infrastructure
```

#### Vercel Deployment (Frontend)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Configure environment variables in Vercel dashboard
```

#### Railway/Heroku (Backend)
```bash
# Railway
railway login
railway init
railway up

# Heroku
heroku create your-app
git push heroku main
```

## 🔒 Security Considerations

### Contract Security
- [ ] Audit smart contracts before mainnet
- [ ] Use OpenZeppelin libraries
- [ ] Implement access controls
- [ ] Add emergency pause functionality
- [ ] Monitor for unusual transactions

### Frontend Security
- [ ] Validate all user inputs
- [ ] Sanitize displayed data
- [ ] Use HTTPS in production
- [ ] Implement CSP headers
- [ ] Secure environment variables

### Backend Security
- [ ] Implement rate limiting
- [ ] Use authentication middleware
- [ ] Validate blockchain data
- [ ] Secure database connections
- [ ] Monitor API endpoints

### LINE Integration Security
- [ ] Validate LIFF signatures
- [ ] Secure webhook endpoints
- [ ] Implement user session management
- [ ] Protect against CSRF attacks

## 📊 Monitoring and Maintenance

### Application Monitoring
```bash
# PM2 monitoring
pm2 monit

# Logs
pm2 logs

# Health checks
curl http://localhost:3001/health
```

### Blockchain Monitoring
- Monitor contract events
- Track gas usage
- Watch for failed transactions
- Alert on unusual activity

### Performance Monitoring
- Frontend: Web Vitals, Lighthouse
- Backend: Response times, error rates
- Database: Query performance, connections
- Blockchain: Block times, gas prices

## 🆘 Troubleshooting

### Common Issues

1. **Contract Deployment Fails**
   ```bash
   # Check network configuration
   # Verify account balance
   # Review gas settings
   ```

2. **Frontend Won't Connect**
   ```bash
   # Check contract addresses
   # Verify network settings
   # Test wallet connection
   ```

3. **LIFF Not Working**
   ```bash
   # Verify LIFF ID
   # Check domain configuration
   # Test in LINE client
   ```

4. **Database Connection Issues**
   ```bash
   # Check connection string
   # Verify database exists
   # Test network connectivity
   ```

### Debug Commands
```bash
# Frontend debugging
npm run dev -- --debug

# Backend debugging
DEBUG=* npm run dev

# Contract debugging
npx hardhat console --network kaia-testnet
```

## 📈 Scaling Considerations

### Performance Optimization
- Implement caching (Redis)
- Use CDN for static assets
- Optimize database queries
- Implement connection pooling

### High Availability
- Load balancer setup
- Database replication
- Multiple RPC endpoints
- Graceful error handling

### Cost Optimization
- Optimize smart contract gas usage
- Implement batching for transactions
- Use efficient database indexing
- Monitor and optimize API calls

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Security audit completed
- [ ] Performance testing done
- [ ] Documentation updated

### Deployment
- [ ] Smart contracts deployed and verified
- [ ] Database migrations completed
- [ ] Frontend built and deployed
- [ ] Backend services started
- [ ] LIFF app configured

### Post-Deployment
- [ ] End-to-end testing completed
- [ ] Monitoring systems active
- [ ] Team notifications set up
- [ ] User documentation published
- [ ] Support channels ready

## 🎉 Go Live!

Your LINEPayUSDT application is now ready for users! 🚀

For support and questions, please refer to:
- [GitHub Issues](https://github.com/your-username/KAIAUSDTPay/issues)
- [Documentation](./README.md)
- [FAQ](./FAQ.md)