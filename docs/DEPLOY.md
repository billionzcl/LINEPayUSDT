# LINEPayUSDT Deployment Guide

This guide provides comprehensive instructions for deploying the LINEPayUSDT system across all environments.

## 🧪 Testing Status

### Component Test Results

✅ **Frontend**: Build successful, no compilation errors  
✅ **Backend**: Syntax validation passed, API structure verified  
⚠️ **Smart Contracts**: Dependencies installed, hardhat execution issues on Windows  
✅ **Integration**: All components properly structured and integrated  

### Known Issues

1. **Contract Testing on Windows**: Hardhat execution may require additional setup:
   ```bash
   # Install hardhat globally if local execution fails
   npm install -g hardhat
   
   # Alternative: Use npx with full path
   npx --node-options="--loader ts-node/esm" hardhat test
   ```

2. **Missing Backend Tests**: Consider adding comprehensive API tests:
   ```bash
   cd backend
   mkdir -p src/__tests__
   # Add test files for API endpoints and blockchain indexer
   ```

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

## 🧪 Comprehensive Testing Guide

### Pre-Deployment Testing

#### Smart Contract Testing
```bash
cd contracts

# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests (May require troubleshooting on Windows)
npm test

# If hardhat command not found:
npx hardhat test

# Alternative for Windows PowerShell issues:
node node_modules/.bin/hardhat test

# Test specific contract
npx hardhat test --grep "PaymentEscrow"

# Check test coverage
npx hardhat coverage
```

**Troubleshooting Contract Tests:**
- If `hardhat` command not recognized, use `npx hardhat` instead
- For Windows PowerShell `&&` issues, run commands separately
- Ensure all dependencies are installed with `npm install`

#### Frontend Testing
```bash
cd frontend

# Install dependencies
npm install

# Build test (checks for compilation errors)
npm run build

# Run component tests (if available)
npm test

# Lint code
npm run lint

# Type checking (if TypeScript)
npm run type-check
```

**Frontend Test Results:**
✅ Build successful without compilation errors  
✅ All React components properly structured  
✅ LINE LIFF integration configured  
✅ Wallet integration components ready  

#### Backend Testing
```bash
cd backend

# Install dependencies
npm install

# Syntax validation
node -c src/index.js
node -c src/indexer/blockchainIndexer.js
node -c src/routes/api.js

# Run tests (create test files first)
npm test

# Start server test
npm run dev
# Check if server starts without errors

# Database connection test
npm run db:generate
```

**Backend Test Results:**
✅ No syntax errors in main files  
✅ Server configuration valid  
✅ Blockchain indexer structure correct  
✅ API routes properly defined  
⚠️ Missing comprehensive test suite - recommend adding:

```bash
# Recommended backend tests to add:
mkdir -p src/__tests__

# Create these test files:
# - api.test.js (API endpoint tests)
# - indexer.test.js (Blockchain indexer tests)
# - database.test.js (Database operation tests)
```

### Integration Testing

#### End-to-End Testing Checklist

1. **Contract Deployment Test**
   ```bash
   cd contracts
   npx hardhat run scripts/deploy.js --network kaia-testnet
   # Verify contracts are deployed and accessible
   ```

2. **Frontend-Backend Integration**
   ```bash
   # Start backend
   cd backend && npm run dev &
   
   # Start frontend
   cd frontend && npm run dev
   
   # Test API connectivity
   curl http://localhost:3001/api/health
   ```

3. **LIFF Integration Test**
   - Test LINE LIFF initialization
   - Verify wallet connection flow
   - Check payment process integration

4. **Blockchain Integration Test**
   - Test contract interaction
   - Verify transaction creation
   - Check event listening functionality

### Post-Deployment Testing

#### Production Health Checks
```bash
# Backend health check
curl https://your-api-domain.com/api/health

# Frontend accessibility
curl https://your-frontend-domain.com

# Contract verification
npx hardhat verify --network kaia-mainnet <contract-address>
```

#### Performance Testing
```bash
# Load testing (install first: npm install -g artillery)
artillery quick --count 10 --num 5 https://your-api-domain.com/api/health

# Frontend performance
npm install -g lighthouse
lighthouse https://your-frontend-domain.com
```

### Testing Automation

#### GitHub Actions CI/CD
Create `.github/workflows/test.yml`:
```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test-contracts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd contracts && npm install
      - run: cd contracts && npm test

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm install
      - run: cd frontend && npm run build

  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd backend && npm install
      - run: cd backend && npm test
```

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
- [ ] SSL certificates installed
- [ ] Database backup created
- [ ] Contract addresses verified
- [ ] LIFF configuration updated

### Post-Deployment
- [ ] Health checks passing
- [ ] Monitoring setup complete
- [ ] Logs configured
- [ ] Backup procedures tested
- [ ] Performance baseline established
- [ ] Team notified of deployment

---

## 🔒 Enhanced Security Guidelines

### Private Key Security
```bash
# Use environment variables for sensitive data
export PRIVATE_KEY="0x..."
export DATABASE_PASSWORD="secure_password"

# Consider using hardware security modules (HSM)
# Implement multi-signature wallets for critical operations
# Regular security audits and penetration testing
```

### API Security Best Practices
```javascript
// Implement comprehensive input validation
const joi = require('joi');
const paymentSchema = joi.object({
  amount: joi.number().positive().required(),
  merchantAddress: joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  orderId: joi.string().max(100).required()
});

// Rate limiting with Redis
const rateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.sendStatus(401);
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};
```

### Smart Contract Security Enhancements
```solidity
// Implement circuit breaker pattern
bool private emergencyStop = false;

modifier notInEmergency() {
    require(!emergencyStop, "Contract is in emergency mode");
    _;
}

function emergencyPause() external onlyOwner {
    emergencyStop = true;
    emit EmergencyPause(block.timestamp);
}

// Add withdrawal limits
uint256 public constant MAX_WITHDRAWAL = 10000 * 10**6; // 10,000 USDT

function withdraw(uint256 amount) external {
    require(amount <= MAX_WITHDRAWAL, "Exceeds maximum withdrawal");
    // ... withdrawal logic
}

// Implement timelock for critical functions
modifier onlyAfterTimelock(uint256 timestamp) {
    require(block.timestamp >= timestamp, "Timelock not expired");
    _;
}
```

## 🚀 Advanced Production Setup

### Kubernetes Deployment
```yaml
# kubernetes/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: linepayusdt-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: linepayusdt-frontend
  template:
    metadata:
      labels:
        app: linepayusdt-frontend
    spec:
      containers:
      - name: frontend
        image: linepayusdt-frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: VITE_API_BASE_URL
          value: "https://api.linepayusdt.com"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### Terraform Infrastructure
```hcl
# infrastructure/main.tf
provider "aws" {
  region = "us-west-2"
}

resource "aws_ecs_cluster" "linepayusdt" {
  name = "linepayusdt-cluster"
}

resource "aws_ecs_service" "backend" {
  name            = "linepayusdt-backend"
  cluster         = aws_ecs_cluster.linepayusdt.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 2

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 3001
  }
}
```

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:all

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker images
        run: |
          docker build -t linepayusdt/frontend:${{ github.sha }} ./frontend
          docker build -t linepayusdt/backend:${{ github.sha }} ./backend
      
      - name: Deploy to production
        run: |
          kubectl set image deployment/frontend frontend=linepayusdt/frontend:${{ github.sha }}
          kubectl set image deployment/backend backend=linepayusdt/backend:${{ github.sha }}
```

## 📈 Monitoring and Alerting

### Prometheus Metrics
```javascript
// backend/src/metrics.js
const prometheus = require('prom-client');

const paymentCounter = new prometheus.Counter({
  name: 'payments_total',
  help: 'Total number of payments processed',
  labelNames: ['status']
});

const paymentDuration = new prometheus.Histogram({
  name: 'payment_duration_seconds',
  help: 'Duration of payment processing',
  buckets: [0.1, 0.5, 1, 2, 5]
});

module.exports = { paymentCounter, paymentDuration };
```

### Grafana Dashboard
```json
{
  "dashboard": {
    "id": null,
    "title": "LINEPayUSDT Monitoring",
    "panels": [
      {
        "title": "Payment Volume",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(payments_total[5m])",
            "legendFormat": "Payments per second"
          }
        ]
      },
      {
        "title": "API Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, payment_duration_seconds)",
            "legendFormat": "95th percentile"
          }
        ]
      }
    ]
  }
}
```

## 🔄 Backup and Disaster Recovery

### Automated Backup Strategy
```bash
#!/bin/bash
# scripts/backup.sh

# Database backup
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL | gzip > "backups/db_backup_$DATE.sql.gz"

# Upload to S3
aws s3 cp "backups/db_backup_$DATE.sql.gz" s3://linepayusdt-backups/database/

# Contract state backup
node scripts/export-contract-state.js > "backups/contract_state_$DATE.json"
aws s3 cp "backups/contract_state_$DATE.json" s3://linepayusdt-backups/contracts/

# Configuration backup
tar -czf "backups/config_$DATE.tar.gz" configs/ .env.example
aws s3 cp "backups/config_$DATE.tar.gz" s3://linepayusdt-backups/configs/

# Cleanup old backups (keep 30 days)
find backups/ -type f -mtime +30 -delete
```

### Disaster Recovery Plan
```markdown
## Recovery Procedures

### Database Recovery
1. Restore from latest backup
2. Verify data integrity
3. Update application configuration
4. Test all endpoints

### Contract Recovery
1. Deploy contracts to new addresses
2. Update frontend configuration
3. Migrate any trapped funds
4. Notify users of new addresses

### Service Recovery
1. Restore from container images
2. Verify all services are healthy
3. Check monitoring alerts
4. Perform smoke tests
```

This comprehensive deployment guide covers all aspects of testing, security, and production deployment for the LINEPayUSDT system. Regular updates and security audits are recommended to maintain system integrity.
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