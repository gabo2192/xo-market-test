# XO Market - Blockchain Prediction Markets Platform

A full-stack prediction markets platform built on the XO testnet, featuring real-time market creation, trading, and AI-powered market evaluation.

## 🚀 Overview

XO Market is a decentralized prediction markets platform that allows users to create, trade, and resolve markets on future events. The platform combines blockchain technology with AI evaluation to provide sophisticated market analysis and automated processing.

### Key Features

- **Decentralized Markets**: Create and trade prediction markets on the XO testnet
- **AI Evaluation**: Automated market analysis using OpenAI and Claude AI
- **Real-time Trading**: Live price updates and trading functionality
- **Market Resolution**: Automated market closure and resolution
- **Comprehensive Analytics**: Market volume, price changes, and trading activity tracking

## 🏗️ Architecture

This is a modern monorepo containing:

### Apps

- **`apps/server`** - NestJS API server handling market data and business logic
- **`apps/web`** - Next.js frontend application with React components
- **`apps/worker`** - Background worker for AI evaluation and market processing

### Packages

- **`packages/blockchain`** - Blockchain interaction layer with contract clients
- **`packages/database`** - Database schema, migrations, and repositories using Drizzle ORM
- **`packages/ui`** - Shared UI components built with shadcn/ui
- **`packages/eslint-config`** - Shared ESLint configurations
- **`packages/typescript-config`** - Shared TypeScript configurations

### Infrastructure

- **`infrastructure/`** - Terraform modules for AWS deployment
- **Docker** - Containerized applications
- **AWS ECS** - Production deployment on AWS

## 🛠️ Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern component library

### Backend

- **NestJS** - Progressive Node.js framework
- **Drizzle ORM** - Type-safe database toolkit
- **PostgreSQL** - Primary database
- **Redis** - Caching and job queues
- **Bull Queue** - Background job processing

### Blockchain

- **Viem** - TypeScript interface for Ethereum
- **XO Testnet** - Custom blockchain network
- **GraphQL** - Blockchain event indexing

### AI & External Services

- **OpenAI GPT-4** - Market evaluation and analysis
- **Anthropic Claude** - Alternative AI provider

### DevOps & Infrastructure

- **Docker** - Containerization
- **AWS ECS** - Container orchestration
- **Terraform** - Infrastructure as Code
- **GitHub Actions** - CI/CD pipelines

## 🚦 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Docker and Docker Compose
- PostgreSQL and Redis (or use Docker Compose)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd xo-market-monorepo
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   # Copy environment templates
   cp apps/server/.env.example apps/server/.env
   cp apps/web/.env.example apps/web/.env
   cp apps/worker/.env.example apps/worker/.env

   # Edit the files with your configuration
   ```

4. **Start development services**

   ```bash
   # Start PostgreSQL and Redis
   docker-compose up -d

   # Run database migrations
   cd apps/server
   pnpm db:migrate
   ```

5. **Start development servers**

   ```bash
   # Start all applications
   pnpm dev

   # Or start individual apps
   pnpm --filter server dev
   pnpm --filter web dev
   pnpm --filter worker dev
   ```

### Development URLs

- **Web App**: http://localhost:3000
- **API Server**: http://localhost:3001
- **Worker**: http://localhost:3002 (background service)
- **Database Studio**: `pnpm --filter server db:studio`

## 📁 Project Structure

```
├── apps/
│   ├── server/          # NestJS API server
│   ├── web/             # Next.js frontend
│   └── worker/          # Background worker
├── packages/
│   ├── blockchain/      # Blockchain clients and contracts
│   ├── database/        # Database schema and utilities
│   ├── ui/              # Shared UI components
│   ├── eslint-config/   # ESLint configurations
│   └── typescript-config/ # TypeScript configurations
├── infrastructure/
│   ├── apps/            # Application Dockerfiles
│   ├── environments/    # Terraform environments
│   └── modules/         # Terraform modules
└── docker-compose.yml   # Local development services
```

## 🔧 Key Features

### Market Management

- Create prediction markets with custom parameters
- Set resolution criteria and expiry dates
- Configure creator fees and collateral tokens

### Trading Engine

- Buy and sell outcome tokens
- Real-time price calculations using LMSR (Logarithmic Market Scoring Rule)
- Volume tracking and analytics

### AI Integration

- Automated market evaluation using AI models
- Market sentiment analysis
- Risk assessment and quality scoring

### Blockchain Integration

- Smart contract interactions on XO testnet
- Event indexing and real-time updates
- Multi-signature market resolution

## 🚀 Deployment

### Local Development

```bash
docker-compose up -d  # Start services
pnpm dev             # Start all applications
```

### Production Deployment

The application is designed for AWS deployment using Terraform:

1. **Configure AWS credentials**
2. **Update Terraform variables**

   ```bash
   cd infrastructure/environments/dev
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   ```

3. **Deploy infrastructure**

   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

4. **Build and push Docker images**
   ```bash
   cd infrastructure/apps
   ./build-all.sh
   ```

## 📊 API Documentation

### Market Endpoints

- `GET /markets` - List all markets
- `GET /markets/:id` - Get specific market
- `POST /markets` - Create new market
- `GET /health` - Health check

### Trading Endpoints

- Market price calculations
- Trading volume analytics
- Historical price data

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter server test
pnpm --filter web test

# Run e2e tests
pnpm test:e2e
```

## 🔒 Environment Variables

### Frontend (`apps/web/.env`)

```bash
API_URL=http://localhost:3001
```

### Server (`apps/server/.env`)

```bash
# Database
DATABASE_URL=postgresql://xo_market_user:xo_market_password@localhost:5432/xo_market_db

# Server
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Worker (`apps/worker/.env`)

```bash
# Database
DATABASE_URL=postgresql://xo_market_user:xo_market_password@localhost:5434/xo_market_db

# Server
PORT=3002
NODE_ENV=development

# Redis (for Bull queues)
REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_PASSWORD=xo_market_password
REDIS_DB=0

# AI Services (at least one required for market evaluation)
OPENAI_API_KEY=your-openai-key-here
ANTHROPIC_API_KEY=your-claude-key-here
```

### Docker Compose Services

The `docker-compose.yml` sets up:

- **PostgreSQL**: Port 5434 (to avoid conflicts with local PostgreSQL on 5432)
- **Redis**: Port 6380 (to avoid conflicts with local Redis on 6379)

### Additional Configuration Notes

- The worker uses a different database port (5434) to connect to the Docker PostgreSQL instance
- Redis password is configured in both Docker Compose and worker environment
- AI API keys are optional but required for automated market evaluation features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and linting rules
- Write tests for new features
- Update documentation as needed
- Use conventional commit messages

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For questions or support:

- Create an issue in the repository
- Check the documentation in each package
- Review the API documentation

## 🔗 Links

- **XO Testnet Explorer**: http://explorer-testnet.xo.market
- **XO Chain RPC**: https://testnet-rpc-1.xo.market
- **GraphQL Endpoint**: http://localhost:8080/v1/graphql (development)

---

**Built with ❤️ for the decentralized prediction markets ecosystem**
