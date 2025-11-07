#!/bin/sh
# Health check for the ML microservice
set -eu

ML_HOST=${ML_HOST:-localhost}
ML_PORT=${ML_SERVICE_PORT:-8000}
ML_HEALTH_PATH=${ML_HEALTH_PATH:-/health}

if command -v curl >/dev/null 2>&1; then
  curl -fsS "http://${ML_HOST}:${ML_PORT}${ML_HEALTH_PATH}" >/dev/null
else
  wget -q -O - "http://${ML_HOST}:${ML_PORT}${ML_HEALTH_PATH}" >/dev/null
fi

