#!/bin/sh
# Health check for Redis using redis-cli ping
set -eu

REDIS_HOST=${REDIS_HOST:-localhost}
REDIS_PORT=${REDIS_PORT:-6379}
REDIS_PASSWORD=${REDIS_PASSWORD:-}

if [ -n "$REDIS_PASSWORD" ]; then
  redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" ping | grep -q "PONG"
else
  redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping | grep -q "PONG"
fi

