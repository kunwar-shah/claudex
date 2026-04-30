# Multi-stage Dockerfile for Claudex — WEB VIEWER (Fastify + React on port 3400)
#
# This Dockerfile builds the full web app: Fastify server + React SPA + REST API.
# It does NOT run the MCP server (which uses stdio, not HTTP).
#
# For MCP-only deployments (Glama validation, headless agents), use Dockerfile.mcp:
#   docker build -f Dockerfile.mcp -t claudex-mcp .
#   docker run -i --rm claudex-mcp
#
# Stage 1: Build React client with Vite
# Stage 2: Production server with built client

# ============================================
# Stage 1: Build Client (React + Vite)
# ============================================
FROM node:18-alpine AS client-builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./

# Install ALL dependencies (including devDependencies for build tools)
RUN npm ci

# Copy client source code
COPY client/ ./

# Build client for production (outputs to dist/)
RUN npm run build

# ============================================
# Stage 2: Production Server
# ============================================
FROM node:18-alpine AS production

WORKDIR /app

# Install root dependencies (concurrently, etc.)
COPY package*.json ./
RUN npm ci --only=production

# Copy server package files and install dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --only=production
WORKDIR /app

# Copy server source code
COPY server/ ./server/

# Copy built client from stage 1 (server expects it at client/dist)
COPY --from=client-builder /app/client/dist ./client/dist

# Copy CLI entry point
COPY bin/ ./bin/

# Copy scripts for system checks
COPY scripts/ ./scripts/

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create necessary directories for data persistence
RUN mkdir -p /root/.claude/projects && \
    mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app /root/.claude

# Switch to non-root user
USER nodejs

# Expose server port
EXPOSE 3400

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "const http=require('http');http.get('http://localhost:3400/api/health',(res)=>{process.exit(res.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

# Set environment variables
ENV NODE_ENV=production \
    PORT=3400 \
    HOST=0.0.0.0

# Start the server using the CLI entry point
CMD ["node", "bin/claude-viewer.js"]