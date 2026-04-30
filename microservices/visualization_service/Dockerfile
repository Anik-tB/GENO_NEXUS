# ============================================================
# GenoNexus Visualization Service — Multi-stage Docker Build
# ============================================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install all dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-alpine AS runtime

WORKDIR /app

# Security: run as non-root user
RUN addgroup -g 1001 -S vizgroup && \
    adduser -S vizuser -u 1001 -G vizgroup

# Copy package files and install production-only dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built output from builder
COPY --from=builder /app/dist ./dist

# Set ownership
RUN chown -R vizuser:vizgroup /app
USER vizuser

# Environment
ENV NODE_ENV=production
ENV PORT=4500

EXPOSE 4500

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:4500/api/viz/health || exit 1

CMD ["node", "dist/index.js"]
