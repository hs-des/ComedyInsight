#!/bin/bash
#
# ComedyInsight Deployment Script
# Builds and deploys the application
#

set -e

APP_DIR="/opt/comedyinsight"
SERVICE_USER="comedyinsight"

echo "🚀 Starting deployment..."

# Make sure running as correct user or with sudo
if [ "$USER" != "$SERVICE_USER" ] && [ "$USER" != "root" ]; then
    echo "❌ This script must be run as $SERVICE_USER or root"
    exit 1
fi

# ============================================================================
# BUILD APPLICATION
# ============================================================================

echo "📦 Building application..."

# Build server
cd $APP_DIR/server
yarn install --frozen-lockfile
yarn build

# Build admin dashboard
cd $APP_DIR/admin-dashboard
yarn install --frozen-lockfile
yarn build

# ============================================================================
# INSTALL SERVICES
# ============================================================================

echo "⚙️ Installing services..."

# Copy systemd files
sudo cp $APP_DIR/deployment/comedyinsight-api.service /etc/systemd/system/
sudo cp $APP_DIR/deployment/comedyinsight-worker.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# OR use PM2
# sudo -u $SERVICE_USER pm2 delete all
# sudo -u $SERVICE_USER pm2 start $APP_DIR/deployment/pm2.config.js
# sudo -u $SERVICE_USER pm2 save

# ============================================================================
# RUN DATABASE MIGRATIONS
# ============================================================================

echo "🗄️ Running database migrations..."

cd $APP_DIR/server
sudo -u $SERVICE_USER yarn migration:run

# ============================================================================
# START SERVICES
# ============================================================================

echo "▶️ Starting services..."

sudo systemctl enable comedyinsight-api
sudo systemctl enable comedyinsight-worker

sudo systemctl restart comedyinsight-api
sudo systemctl restart comedyinsight-worker

# ============================================================================
# VERIFY SERVICES
# ============================================================================

echo "🔍 Verifying services..."

sleep 5

if sudo systemctl is-active --quiet comedyinsight-api; then
    echo "✅ API service is running"
else
    echo "❌ API service failed to start"
    sudo systemctl status comedyinsight-api
    exit 1
fi

if sudo systemctl is-active --quiet comedyinsight-worker; then
    echo "✅ Worker service is running"
else
    echo "❌ Worker service failed to start"
    sudo systemctl status comedyinsight-worker
    exit 1
fi

# ============================================================================
# RELOAD NGINX
# ============================================================================

echo "🔄 Reloading Nginx..."

sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Service status:"
sudo systemctl status comedyinsight-api --no-pager -l
echo ""
sudo systemctl status comedyinsight-worker --no-pager -l
