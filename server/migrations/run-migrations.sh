#!/bin/bash

# Database Migration Script for Docker
# This script runs all migrations in order

set -e  # Exit on error

# Database connection details (from docker-compose.yml)
DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-mydatabase}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"

# Export password for psql
export PGPASSWORD="$DB_PASSWORD"

echo "🚀 Starting database migrations..."
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo ""

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c '\q' 2>/dev/null; do
  echo "  Database is unavailable - sleeping"
  sleep 2
done
echo "✅ Database is ready!"
echo ""

# Migration files in order
MIGRATIONS=(
  "001_initial_schema.sql"
  "002_add_fake_views_campaigns.sql"
  "003_add_stripe_columns.sql"
  "004_add_ad_tracking_tables.sql"
  "005_add_download_encryption_fields.sql"
)

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Track migration status
MIGRATION_LOG="$SCRIPT_DIR/migrations_applied.log"

# Function to check if migration has been applied
migration_applied() {
  local migration_file=$1
  if [ -f "$MIGRATION_LOG" ]; then
    grep -q "^$migration_file$" "$MIGRATION_LOG"
  else
    return 1
  fi
}

# Function to mark migration as applied
mark_migration_applied() {
  local migration_file=$1
  echo "$migration_file" >> "$MIGRATION_LOG"
}

# Run migrations
for migration in "${MIGRATIONS[@]}"; do
  migration_path="$SCRIPT_DIR/$migration"
  
  if [ ! -f "$migration_path" ]; then
    echo "⚠️  Warning: Migration file not found: $migration"
    continue
  fi

  if migration_applied "$migration"; then
    echo "⏭️  Skipping $migration (already applied)"
    continue
  fi

  echo "📝 Running migration: $migration"
  
  if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_path"; then
    mark_migration_applied "$migration"
    echo "✅ Successfully applied: $migration"
  else
    echo "❌ Failed to apply: $migration"
    exit 1
  fi
  
  echo ""
done

# Check for refresh_tokens migration
REFRESH_TOKENS_MIGRATION="$SCRIPT_DIR/../../security/migrations/create_refresh_tokens.sql"
if [ -f "$REFRESH_TOKENS_MIGRATION" ]; then
  if ! migration_applied "create_refresh_tokens.sql"; then
    echo "📝 Running migration: create_refresh_tokens.sql"
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$REFRESH_TOKENS_MIGRATION"; then
      mark_migration_applied "create_refresh_tokens.sql"
      echo "✅ Successfully applied: create_refresh_tokens.sql"
    else
      echo "❌ Failed to apply: create_refresh_tokens.sql"
      exit 1
    fi
    echo ""
  else
    echo "⏭️  Skipping create_refresh_tokens.sql (already applied)"
  fi
fi

echo "🎉 All migrations completed successfully!"
echo ""
echo "📊 Verifying database..."

# Verify tables were created
TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "   Tables created: $TABLE_COUNT"

# List some key tables
echo ""
echo "📋 Key tables:"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\dt" | head -20

echo ""
echo "✨ Database setup complete!"
