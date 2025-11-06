# ComedyInsight Production Deployment Guide

Complete deployment guide for Ubuntu 22.04 with all services, monitoring, and backups.

## 📋 Prerequisites

- Ubuntu 22.04 LTS server
- Root or sudo access
- Domain name pointed to server IP
- SSH access configured

## 🚀 Quick Start

```bash
# 1. Clone repository
git clone https://github.com/yourorg/comedyinsight.git
cd comedyinsight

# 2. Run setup script
chmod +x deployment/setup.sh
./deployment/setup.sh

# 3. Setup database
sudo -u postgres psql -c "CREATE DATABASE comedyinsight;"
sudo -u postgres psql -c "CREATE USER comedyinsight WITH PASSWORD 'secure-password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE comedyinsight TO comedyinsight;"

# 4. Run migrations
cd server
psql -U comedyinsight -d comedyinsight -f migrations/001_initial_schema.sql
psql -U comedyinsight -d comedyinsight -f migrations/002_add_fake_views_campaigns.sql
psql -U comedyinsight -d comedyinsight -f migrations/003_add_stripe_columns.sql
psql -U comedyinsight -d comedyinsight -f migrations/004_add_ad_tracking_tables.sql
psql -U comedyinsight -d comedyinsight -f migrations/005_add_download_encryption_fields.sql

# 5. Setup MinIO
mkdir -p /opt/comedyinsight/storage
cd /opt/comedyinsight
cp deployment/docker-compose.minio.yml docker-compose.yml

# Edit docker-compose.yml with secure credentials
nano docker-compose.yml

docker compose up -d

# 6. Configure environment
cp server/env.example /opt/comedyinsight/.env
nano /opt/comedyinsight/.env

# 7. Deploy application
chmod +x deployment/deploy.sh
./deployment/deploy.sh

# 8. Setup SSL
chmod +x deployment/setup-ssl.sh
./deployment/setup-ssl.sh
```

## 🔧 Detailed Steps

### 1. Initial Server Setup

```bash
# Run automated setup
./deployment/setup.sh

# What it installs:
# - Node.js LTS
# - Yarn
# - PostgreSQL 14+
# - Docker & Docker Compose
# - Nginx
# - Certbot
# - FFmpeg
# - Redis
# - PM2
# - UFW firewall
```

### 2. Database Configuration

```bash
# Create database
sudo -u postgres psql << EOF
CREATE DATABASE comedyinsight;
CREATE USER comedyinsight WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE comedyinsight TO comedyinsight;
\c comedyinsight
GRANT ALL ON SCHEMA public TO comedyinsight;
EOF

# Run migrations
cd /opt/comedyinsight/server
psql -U comedyinsight -d comedyinsight -f migrations/001_initial_schema.sql
# ... repeat for all migrations

# Verify
sudo -u postgres psql -d comedyinsight -c "\dt"
```

### 3. MinIO Setup (S3-compatible storage)

```bash
# Create data directory
sudo mkdir -p /opt/comedyinsight/storage/minio
sudo chown -R comedyinsight:comedyinsight /opt/comedyinsight/storage

# Edit docker-compose
cd /opt/comedyinsight
nano docker-compose.minio.yml
# Update MINIO_ROOT_USER and MINIO_ROOT_PASSWORD

# Start MinIO
docker compose -f docker-compose.minio.yml up -d

# Access console
# http://your-server-ip:9001
# Login with MINIO_ROOT_USER / MINIO_ROOT_PASSWORD

# Create bucket and set permissions
docker exec -it minio-client bash
mc alias set myminio http://minio:9000 admin password
mc mb myminio/comedyinsight-videos
mc anonymous set download myminio/comedyinsight-videos
mc versioning enable myminio/comedyinsight-videos
```

### 4. Environment Configuration

```bash
# Copy and edit environment file
cp server/env.example /opt/comedyinsight/.env
nano /opt/comedyinsight/.env

# Required variables:
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=comedyinsight
DB_USER=comedyinsight
DB_PASSWORD=your-secure-password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# MinIO
AWS_ACCESS_KEY_ID=your-minio-access-key
AWS_SECRET_ACCESS_KEY=your-minio-secret-key
AWS_REGION=us-east-1
S3_BUCKET=comedyinsight-videos

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Encryption
ENCRYPTION_SECRET=generate-strong-secret-256-bits

# JWT
JWT_SECRET=another-strong-secret

# OAuth providers (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APPLE_CLIENT_ID=
```

### 5. Deploy Application

```bash
# Option A: Using deploy script
./deployment/deploy.sh

# Option B: Manual deployment
cd /opt/comedyinsight/server
yarn install --frozen-lockfile
yarn build

cd /opt/comedyinsight/admin-dashboard
yarn install --frozen-lockfile
yarn build

# Install systemd services
sudo cp deployment/comedyinsight-api.service /etc/systemd/system/
sudo cp deployment/comedyinsight-worker.service /etc/systemd/system/
sudo systemctl daemon-reload

# Start services
sudo systemctl enable comedyinsight-api comedyinsight-worker
sudo systemctl start comedyinsight-api comedyinsight-worker
```

### 6. Nginx Configuration

```bash
# Install Nginx config
sudo cp deployment/nginx.conf /etc/nginx/conf.d/comedyinsight.conf

# Test configuration
sudo nginx -t

# Create cache directories
sudo mkdir -p /var/cache/nginx/{hls,videos}
sudo chown -R www-data:www-data /var/cache/nginx

# Reload Nginx
sudo systemctl reload nginx
```

### 7. SSL Certificate

```bash
# Install SSL certificate
chmod +x deployment/setup-ssl.sh
./deployment/setup-ssl.sh

# Or manual:
sudo certbot certonly --nginx -d api.comedyinsight.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 8. Monitoring Setup

```bash
# Make monitoring script executable
chmod +x deployment/monitoring.sh

# Run manually
./deployment/monitoring.sh

# Or add to cron
crontab -e
# Add: 0 * * * * /opt/comedyinsight/deployment/monitoring.sh >> /var/log/comedyinsight/monitoring.log 2>&1
```

### 9. Backup Configuration

```bash
# Setup database backups
chmod +x deployment/backup-database.sh

# Add to cron (daily at 2 AM)
crontab -e
0 2 * * * /opt/comedyinsight/deployment/backup-database.sh >> /var/log/comedyinsight/backup.log 2>&1

# Setup MinIO backups
chmod +x deployment/backup-minio.sh

# Add to cron (daily at 3 AM)
0 3 * * * /opt/comedyinsight/deployment/backup-minio.sh >> /var/log/comedyinsight/backup.log 2>&1

# Optional: Upload to S3
sudo apt-get install aws-cli
aws configure

# Update backup scripts with S3_BUCKET env var
```

## 🔥 Firewall Configuration

```bash
# View current rules
sudo ufw status verbose

# Basic rules (already configured)
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Optional: Allow specific IP for database access
sudo ufw allow from 10.0.0.0/8 to any port 5432

# Enable logging
sudo ufw logging on
```

## 📊 Monitoring Commands

```bash
# Check all services
./deployment/monitoring.sh

# Check API logs
sudo journalctl -u comedyinsight-api -f

# Check worker logs
sudo journalctl -u comedyinsight-worker -f

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check database
sudo -u postgres psql -d comedyinsight -c "SELECT * FROM pg_stat_activity;"

# Check Redis
redis-cli info memory

# Check disk usage
df -h /opt/comedyinsight
du -sh /opt/comedyinsight/storage/*
```

## 🚨 Troubleshooting

### Service won't start

```bash
# Check logs
sudo journalctl -u comedyinsight-api -n 100

# Check environment
sudo cat /opt/comedyinsight/.env

# Test database connection
psql -U comedyinsight -d comedyinsight -c "SELECT NOW();"

# Test Redis connection
redis-cli ping

# Check permissions
ls -la /opt/comedyinsight
```

### Database connection issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check pg_hba.conf
sudo cat /etc/postgresql/*/main/pg_hba.conf

# Allow local connections if needed
sudo -u postgres psql -c "ALTER USER comedyinsight WITH PASSWORD 'new-password';"
```

### Nginx issues

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Check access logs
sudo tail -f /var/log/nginx/access.log

# Verify upstream
curl http://127.0.0.1:3000/health
```

### SSL certificate issues

```bash
# Check certificate expiry
sudo certbot certificates

# Renew manually
sudo certbot renew --force-renewal

# Check Nginx SSL config
sudo nginx -T | grep ssl_certificate
```

## 📈 Scaling Considerations

### Horizontal Scaling (Load Balancer)

```
Internet
    |
[Load Balancer]
    |
  [Nginx] [Nginx]
    |
  [API] [API] [API]
    |
[PostgreSQL Master] → [PostgreSQL Replica]
    |
[Redis Sentinel]
```

### Database Scaling

```bash
# Setup streaming replication
# Master server
sudo nano /etc/postgresql/*/main/postgresql.conf
# Set: wal_level = replica

sudo nano /etc/postgresql/*/main/pg_hba.conf
# Add: host replication replica_user REPLICA_IP/32 md5

# Replica server
pg_basebackup -h master_ip -U replica_user -D /var/lib/postgresql/data -P -W
```

### Redis Scaling

```bash
# Setup Redis Cluster
redis-trib create --replicas 1 \
  server1:6379 server2:6379 server3:6379 \
  server4:6379 server5:6379 server6:6379

# Or use Redis Sentinel for HA
```

### Application Scaling

```bash
# PM2 cluster mode (already configured)
# Edit pm2.config.js to increase instances

{
  name: 'comedyinsight-api',
  instances: 4,  // 4 instances
  exec_mode: 'cluster'
}

pm2 restart all
```

### CDN for Video Delivery

```bash
# Configure CDN (CloudFlare, CloudFront, etc.)
# Point DNS to CDN
# Update CORS settings in Nginx

add_header 'Access-Control-Allow-Origin' '*';
add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
```

## 🔒 Security Hardening

```bash
# Fail2ban for SSH protection
sudo apt-get install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Automatic security updates
sudo apt-get install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Harden PostgreSQL
sudo nano /etc/postgresql/*/main/postgresql.conf
# Set: listen_addresses = 'localhost'

# Disable root login (if not already)
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no

# Configure log rotation
sudo nano /etc/logrotate.d/comedyinsight
/var/log/comedyinsight/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
}
```

## 📦 Maintenance

### Update Application

```bash
# Pull latest code
cd /opt/comedyinsight
git pull origin main

# Rebuild and deploy
./deployment/deploy.sh
```

### Database Maintenance

```bash
# Vacuum database
sudo -u postgres psql -d comedyinsight -c "VACUUM ANALYZE;"

# Check for bloat
sudo -u postgres psql -d comedyinsight -c "SELECT * FROM pg_stat_progress_vacuum;"

# Reindex
sudo -u postgres psql -d comedyinsight -c "REINDEX DATABASE comedyinsight;"
```

### Cleanup

```bash
# Clean old logs
sudo journalctl --vacuum-time=30d

# Clean Nginx cache
sudo rm -rf /var/cache/nginx/*

# Clean Docker
docker system prune -af
```

## 📞 Support

- **API Docs**: https://api.comedyinsight.com/docs
- **Health Check**: https://api.comedyinsight.com/health
- **Logs**: `/var/log/comedyinsight/`
- **Monitoring**: `./deployment/monitoring.sh`

## 📝 Deployment Checklist

- [ ] Server setup completed
- [ ] Database created and migrated
- [ ] MinIO running and configured
- [ ] Environment variables set
- [ ] Application deployed
- [ ] Nginx configured
- [ ] SSL certificate installed
- [ ] Services running
- [ ] Monitoring configured
- [ ] Backups scheduled
- [ ] Firewall configured
- [ ] Security hardening applied
- [ ] Load testing completed

## 🎉 Success!

Your ComedyInsight application is now deployed and running in production!

