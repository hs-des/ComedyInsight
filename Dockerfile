# Use Node.js 18 slim base image (smaller and often has better network connectivity)
FROM node:18-slim

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive

# Install FFmpeg and build dependencies
# Using retry logic and clean cache for better reliability
RUN apt-get clean && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/* && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

# Verify Node.js and FFmpeg installation
RUN node --version && npm --version && ffmpeg -version

# Set working directory
WORKDIR /app

# Copy all project files
COPY server/ ./ 

# Install dependencies
RUN npm install

# Build TypeScript to JavaScript
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Set default command
CMD ["npm", "start"]

