#!/bin/bash
#
# ComedyInsight Production Deployment Script
# Ubuntu 22.04 Server Setup
#

set -e  # Exit on error

echo "🚀 Starting ComedyInsight production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================================
# SYSTEM UPDATES
# ============================================================================

echo -e "${GREEN}📦 Updating system packages...${NC}"
sudo apt-get update
sudo apt-get upgrade -y

# ============================================================================
# INSTALL NODE.JS LTS
# ============================================================================

echo -e "${GREEN}📦 Installing Node.js LTS...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js installed: ${NODE_VERSION}${NC}"

# ============================================================================
# INSTALL YARN
# ============================================================================

echo -e "${GREEN}📦 Installing Yarn...${NC}"
if ! command -v yarn &> /dev/null; then
    corepack enable
    corepack prepare yarn@stable --activate
fi

YARN_VERSION=$(yarn --version)
echo -e "${GREEN}✅ Yarn installed: ${YARN_VERSION}${NC}"

# ============================================================================
# INSTALL POSTGRESQL
# ============================================================================

echo -e "${GREEN}📦 Installing PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    sudo apt-get install -y postgresql postgresql-contrib
    sudo systemctl enable postgresql
    sudo systemctl start postgresql
fi

POSTGRES_VERSION=$(psql --version)
echo -e "${GREEN}✅ PostgreSQL installed: ${POSTGRES_VERSION}${NC}"

# ============================================================================
# INSTALL DOCKER
# ============================================================================

echo -e "${GREEN}📦 Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    # Remove old versions
    sudo apt-get remove -y docker docker-engine docker.io containerd runc
    
    # Install Docker
    sudo apt-get install -y ca-certificates curl gnupg lsb-release
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
fi

DOCKER_VERSION=$(docker --version)
echo -e "${GREEN}✅ Docker installed: ${DOCKER_VERSION}${NC}"

# ============================================================================
# INSTALL NGINX
# ============================================================================

echo -e "${GREEN}📦 Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    sudo apt-get install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
fi

NGINX_VERSION=$(nginx -v 2>&1)
echo -e "${GREEN}✅ Nginx installed: ${NGINX_VERSION}${NC}"

# ============================================================================
# INSTALL CERTBOT
# ============================================================================

echo -e "${GREEN}📦 Installing Certbot...${NC}"
if ! command -v certbot &> /dev/null; then
    sudo apt-get install -y certbot python3-certbot-nginx
fi

CERTBOT_VERSION=$(certbot --version)
echo -e "${GREEN}✅ Certbot installed: ${CERTBOT_VERSION}${NC}"

# ============================================================================
# INSTALL FFMPEG
# ============================================================================

echo -e "${GREEN}📦 Installing FFmpeg...${NC}"
if ! command -v ffmpeg &> /dev/null; then
    sudo apt-get install -y ffmpeg
fi

FFMPEG_VERSION=$(ffmpeg -version | head -n 1)
echo -e "${GREEN}✅ FFmpeg installed: ${FFMPEG_VERSION}${NC}"

# ============================================================================
# INSTALL REDIS
# ============================================================================

echo -e "${GREEN}📦 Installing Redis...${NC}"
if ! command -v redis-cli &> /dev/null; then
    sudo apt-get install -y redis-server
    sudo systemctl enable redis-server
    sudo systemctl start redis-server
fi

REDIS_VERSION=$(redis-cli --version)
echo -e "${GREEN}✅ Redis installed: ${REDIS_VERSION}${NC}"

# ============================================================================
# CONFIGURE FIREWALL
# ============================================================================

echo -e "${GREEN}🔥 Configuring firewall...${NC}"
if command -v ufw &> /dev/null; then
    sudo ufw --force enable
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow ssh
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw status verbose
else
    sudo apt-get install -y ufw
    sudo ufw --force enable
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow ssh
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw status verbose
fi

echo -e "${GREEN}✅ Firewall configured${NC}"

# ============================================================================
# CREATE APPLICATION USER
# ============================================================================

echo -e "${GREEN}👤 Creating application user...${NC}"
if ! id "comedyinsight" &>/dev/null; then
    sudo useradd -m -s /bin/bash comedyinsight
    sudo mkdir -p /opt/comedyinsight
    sudo chown comedyinsight:comedyinsight /opt/comedyinsight
fi

echo -e "${GREEN}✅ Application user created${NC}"

# ============================================================================
# INSTALL PM2
# ============================================================================

echo -e "${GREEN}📦 Installing PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER
fi

PM2_VERSION=$(pm2 --version)
echo -e "${GREEN}✅ PM2 installed: ${PM2_VERSION}${NC}"

# ============================================================================
# SUMMARY
# ============================================================================

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Deployment script completed!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo "Installed versions:"
echo "  • Node.js: $(node --version)"
echo "  • Yarn: $(yarn --version)"
echo "  • PostgreSQL: $(psql --version)"
echo "  • Docker: $(docker --version)"
echo "  • Nginx: $(nginx -v 2>&1)"
echo "  • Certbot: $(certbot --version)"
echo "  • FFmpeg: $(ffmpeg -version 2>&1 | head -n 1)"
echo "  • Redis: $(redis-cli --version)"
echo "  • PM2: $(pm2 --version)"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "  1. Configure PostgreSQL database"
echo "  2. Setup MinIO with docker-compose"
echo "  3. Deploy application code"
echo "  4. Configure Nginx"
echo "  5. Setup SSL with Certbot"
echo "  6. Start services with PM2"
echo ""
echo -e "${YELLOW}💡 Note: Logout and login again for docker group to take effect${NC}"

