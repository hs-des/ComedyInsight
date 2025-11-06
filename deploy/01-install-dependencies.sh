#!/bin/bash

# Installation script for ComedyInsight server dependencies
# Ubuntu 22.04

set -e

echo "🚀 Installing dependencies for ComedyInsight..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install prerequisites
echo "📦 Installing prerequisites..."
sudo apt-get install -y curl wget git gnupg lsb-release

# ============================================================================
# Install Node.js (LTS)
# ============================================================================
echo "📦 Installing Node.js LTS..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

node --version
npm --version

# ============================================================================
# Install Yarn
# ============================================================================
echo "📦 Installing Yarn..."
npm install -g yarn

yarn --version

# ============================================================================
# Install PostgreSQL
# ============================================================================
echo "📦 Installing PostgreSQL..."
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt-get update
sudo apt-get install -y postgresql-14 postgresql-contrib-14

sudo systemctl enable postgresql
sudo systemctl start postgresql

# ============================================================================
# Install Docker
# ============================================================================
echo "📦 Installing Docker..."
sudo apt-get install -y ca-certificates
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo systemctl enable docker
sudo systemctl start docker

# Add current user to docker group
sudo usermod -aG docker $USER

docker --version

# ============================================================================
# Install Nginx
# ============================================================================
echo "📦 Installing Nginx..."
sudo apt-get install -y nginx

sudo systemctl enable nginx
sudo systemctl start nginx

nginx -v

# ============================================================================
# Install Certbot
# ============================================================================
echo "📦 Installing Certbot..."
sudo apt-get install -y certbot python3-certbot-nginx

certbot --version

# ============================================================================
# Install FFmpeg
# ============================================================================
echo "📦 Installing FFmpeg..."
sudo apt-get install -y ffmpeg

ffmpeg -version

# ============================================================================
# Install PM2
# ============================================================================
echo "📦 Installing PM2..."
sudo npm install -g pm2

pm2 --version

# Setup PM2 to start on boot
pm2 startup systemd -u $USER --hp $HOME

# ============================================================================
# Install Redis
# ============================================================================
echo "📦 Installing Redis..."
sudo apt-get install -y redis-server

sudo systemctl enable redis-server
sudo systemctl start redis-server

redis-cli --version

# ============================================================================
# Configure UFW Firewall
# ============================================================================
echo "🔥 Configuring firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw allow 5432/tcp  # PostgreSQL (restrict to internal later)
sudo ufw allow 6379/tcp  # Redis (restrict to internal later)

sudo ufw --force enable

sudo ufw status

echo ""
echo "✅ All dependencies installed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Configure PostgreSQL database"
echo "2. Set up MinIO container"
echo "3. Deploy application files"
echo "4. Configure Nginx"
echo "5. Get SSL certificates"

