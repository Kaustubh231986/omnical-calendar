# Multi-stage Dockerfile for OmniCal Enterprise
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies (clean install)
RUN npm ci

# Copy application source code
COPY . .

# Build production bundle
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Install serve to run the production build
RUN npm install -g serve

# Copy built distribution files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

# Start static file server on port 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
