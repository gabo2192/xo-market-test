# Multi-stage build for NestJS API application
FROM --platform=linux/amd64 node:20-alpine AS base

# Install pnpm globally
RUN npm install -g pnpm@10.4.1

# Set working directory
WORKDIR /app

# Copy root package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY turbo.json ./

# Copy shared packages
COPY packages/ ./packages/

# Copy server app (API)
COPY apps/server/ ./apps/server/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages first
RUN pnpm --filter="@workspace/*" build

# Build the server application
RUN pnpm --filter=server build

# Production stage
FROM node:20-alpine AS production

# Install pnpm globally
RUN npm install -g pnpm@10.4.1

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY turbo.json ./

# Copy necessary package files for production dependencies
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/ui/package.json ./packages/ui/
COPY packages/database/package.json ./packages/database/
COPY apps/server/package.json ./apps/server/

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built application from previous stage
COPY --from=base /app/apps/server/dist ./apps/server/dist
COPY --from=base /app/apps/server/drizzle.config.ts ./apps/server/
COPY --from=base /app/packages/database/src/migrations ./packages/database/src/migrations

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership of the app directory
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port
EXPOSE 3001

# Set working directory to server app
WORKDIR /app/apps/server

# Health check - fixed to use correct endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/main.js"]