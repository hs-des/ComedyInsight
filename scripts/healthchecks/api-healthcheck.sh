#!/bin/sh
# Simple HTTP health check for the API service
set -eu

API_HOST=${API_HOST:-localhost}
API_PORT=${API_PORT:-3000}
API_HEALTH_PATH=${API_HEALTH_PATH:-/health}

if command -v curl >/dev/null 2>&1; then
  curl -fsS "http://${API_HOST}:${API_PORT}${API_HEALTH_PATH}" >/dev/null
else
  wget -q -O - "http://${API_HOST}:${API_PORT}${API_HEALTH_PATH}" >/dev/null
fi

