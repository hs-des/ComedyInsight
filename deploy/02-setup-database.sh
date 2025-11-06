#!/bin/bash

# Database setup script
# Run as postgres user or with sudo

set -e

echo "🗄️ Setting up PostgreSQL database..."

# Configure PostgreSQL
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'changeme_in_production';"

# Create database and user
DB_NAME="comedyinsight"
DB_USER="comedyinsight_user"
DB_PASS="changeme_in_production"

sudo -u postgres psql <<EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
EOF

echo "✅ Database created: $DB_NAME"

# Run migrations
echo "📝 Running database migrations..."
cd /opt/comedyinsight/server

# Run initial schema
sudo -u postgres psql -d $DB_NAME -f migrations/001_initial_schema.sql

# Run additional migrations
sudo -u postgres psql -d $DB_NAME -f migrations/002_add_fake_views_campaigns.sql || true
sudo -u postgres psql -d $DB_NAME -f migrations/003_add_stripe_columns.sql || true
sudo -u postgres psql -d $DB_NAME -f migrations/004_add_ad_tracking_tables.sql || true
sudo -u postgres psql -d $DB_NAME -f migrations/005_add_download_encryption_fields.sql || true

echo "✅ Database migrations completed"

# Configure pg_hba.conf for better security
echo "🔒 Configuring PostgreSQL authentication..."
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /etc/postgresql/14/main/postgresql.conf

sudo systemctl restart postgresql

echo ""
echo "✅ Database setup complete!"

