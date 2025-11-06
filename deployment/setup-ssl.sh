#!/bin/bash
#
# SSL Certificate Setup with Let's Encrypt
#

set -e

DOMAIN="api.comedyinsight.com"
EMAIL="admin@comedyinsight.com"  # Change this

echo "🔒 Setting up SSL for $DOMAIN..."

# Test Nginx configuration first
echo "Testing Nginx configuration..."
sudo nginx -t

# Obtain certificate
echo "Obtaining SSL certificate..."
sudo certbot certonly --nginx \
    -d $DOMAIN \
    --email $EMAIL \
    --agree-tos \
    --non-interactive \
    --redirect

# Setup auto-renewal
echo "Setting up auto-renewal..."

# Create renewal hook script
sudo tee /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh > /dev/null << 'EOF'
#!/bin/bash
nginx -t && systemctl reload nginx
EOF

sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh

# Test renewal
echo "Testing certificate renewal..."
sudo certbot renew --dry-run

echo ""
echo "✅ SSL setup completed!"
echo "Certificate location: /etc/letsencrypt/live/$DOMAIN/"
echo ""
echo "Auto-renewal is configured and will run twice daily."

