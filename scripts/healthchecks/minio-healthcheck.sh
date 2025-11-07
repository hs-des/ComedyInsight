#!/bin/sh
# Health check for MinIO by hitting the live endpoint
set -eu

MINIO_HOST=${MINIO_HEALTH_HOST:-localhost}
MINIO_PORT=${MINIO_PORT:-9000}

if command -v curl >/dev/null 2>&1; then
  curl -fsS "http://${MINIO_HOST}:${MINIO_PORT}/minio/health/live" >/dev/null
elif command -v wget >/dev/null 2>&1; then
  wget -q -O - "http://${MINIO_HOST}:${MINIO_PORT}/minio/health/live" >/dev/null
else
  echo "minio-healthcheck: curl or wget required" >&2
  exit 1
fi

