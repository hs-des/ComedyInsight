#!/bin/bash
#
# Database Backup Script
# Runs daily via cron
#

set -e

BACKUP_DIR="/opt/comedyinsight/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="comedyinsight"
RETENTION_DAYS=30

# Ensure backup directory exists
mkdir -p $BACKUP_DIR

# Create backup
echo "Creating database backup..."
PGPASSWORD="${DB_PASSWORD}" pg_dump -U postgres -h localhost -d $DB_NAME \
    -F c -b -v -f "$BACKUP_DIR/comedyinsight_$DATE.dump"

# Compress backup
echo "Compressing backup..."
gzip "$BACKUP_DIR/comedyinsight_$DATE.dump"

echo "✅ Backup created: comedyinsight_$DATE.dump.gz"

# Clean old backups
echo "Cleaning old backups (older than $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "comedyinsight_*.dump.gz" -mtime +$RETENTION_DAYS -delete

echo "✅ Backup cleanup completed"

# Upload to S3 (optional)
if [ -n "$BACKUP_S3_BUCKET" ]; then
    echo "Uploading backup to S3..."
    aws s3 cp "$BACKUP_DIR/comedyinsight_$DATE.dump.gz" "s3://$BACKUP_S3_BUCKET/"
    echo "✅ Uploaded to S3"
fi

