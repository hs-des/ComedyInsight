# Docker Network Fix for Build Issues

## Problem

If you encounter connection errors when building the Docker image:
```
Connection failed [IP: ... 80]
E: Unable to locate package curl
E: Unable to locate package ffmpeg
```

This is typically caused by:
1. Network connectivity issues to Ubuntu package repositories
2. DNS resolution problems
3. Firewall/proxy blocking access

## Solutions

### Solution 1: Use Docker Build Args for Proxy (if behind corporate proxy)

If you're behind a corporate proxy, configure Docker to use it:

```bash
docker compose build --build-arg http_proxy=http://proxy.company.com:8080 --build-arg https_proxy=http://proxy.company.com:8080
```

Or set environment variables:
```bash
export http_proxy=http://proxy.company.com:8080
export https_proxy=http://proxy.company.com:8080
docker compose build
```

### Solution 2: Use Alternative Base Image (Node.js with FFmpeg)

If network issues persist, we can switch to a Node.js base image that might have better connectivity:

Alternative Dockerfile approach (use if needed):
```dockerfile
FROM node:18-slim

# Install FFmpeg and build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Solution 3: Pre-download Dependencies

If you have intermittent connectivity, build in stages:

1. First, ensure npm packages are installed locally:
```bash
cd server
npm install
```

2. The Dockerfile already copies `node_modules` if they exist, which can help.

### Solution 4: Use Docker BuildKit with Better Caching

Enable BuildKit for better error handling:
```bash
export DOCKER_BUILDKIT=1
docker compose build
```

### Solution 5: Manual Retry

Sometimes the issue is temporary. Simply retry:
```bash
docker compose build --no-cache
```

## Updated Dockerfile Features

The updated Dockerfile now includes:
- DNS configuration (Google DNS: 8.8.8.8, 8.8.4.4)
- Retry logic for `apt-get update`
- Clean apt cache before updates
- `--no-install-recommends` to reduce package size

## Verify Network Connectivity

Test if Docker can reach the internet:
```bash
docker run --rm ubuntu:22.04 apt-get update
```

If this fails, your Docker environment has network connectivity issues that need to be resolved at the Docker/network level.

## Alternative: Use Pre-built Image

If build issues persist, consider using a pre-built base image with Node.js and FFmpeg:

```dockerfile
FROM jrottenberg/ffmpeg:4.4-node-18

WORKDIR /app
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

This uses a Docker Hub image that already has FFmpeg and Node.js pre-installed.
