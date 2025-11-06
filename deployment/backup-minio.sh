#!/bin/bash
#
# MinIO Backup Script
# Runs daily via cron
#

set -e

BACKUP_DIR="/opt/comedyinsight/backups/minio"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Ensure backup directory exists
mkdir -p $BACKUP_DIR

# Backup MinIO data volume
echo "Creating MinIO backup..."
docker exec minio tar czf /tmp/minio-backup.tar.gz /data
docker cp minio:/tmp/minio-backup.tar.gz "$BACKUP_DIR/minio_$DATE.tar.gz"
docker exec minio rm /tmp/minio-backup.tar.gz

echo "✅ Backup created: minio_$DATE.tar.gz"

# Clean old backups
echo "Cleaning old backups (older than $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "minio_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "✅ Backup cleanup completed"

# Upload to S3 (optional)
if [ -n "$BACKUP_S3_BUCKET" ]; then
    echo "Uploading backup to S3..."
    aws s3 cp "$BACKUP_DIR/minio_$DATE.tar.gz" "s3://$BACKUP_S3_BUCKET/"
    echo "✅ Uploaded to S3"
fi

