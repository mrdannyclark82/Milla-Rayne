# syntax=docker/dockerfile:1.7-labs
# 1. Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules, including canvas dependencies
RUN apk add --no-cache python3 make g++ linux-headers pkgconfig build-base cairo-dev jpeg-dev pango-dev giflib-dev

# Copy package manifests and install all dependencies (including dev)
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy the rest of the application source code
COPY . .

# Build the application
RUN npm run build

# Prune development dependencies
RUN npm prune --production


# 2. Production stage
FROM node:24-alpine

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy pruned node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy built artifacts from the build stage
COPY --from=builder /app/dist ./dist

# Copy public assets and package.json
COPY client/public ./client/public
COPY package.json .


EXPOSE 5000

# The command to run the application
CMD ["node", "dist/index.js"]
