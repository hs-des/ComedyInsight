#!/bin/sh
# Health check for the admin dashboard (static site served by nginx)
set -eu

DASHBOARD_HOST=${DASHBOARD_HOST:-localhost}
DASHBOARD_PORT=${DASHBOARD_PORT:-4173}

if command -v curl >/dev/null 2>&1; then
  curl -fsS "http://${DASHBOARD_HOST}:${DASHBOARD_PORT}/health" >/dev/null || \
  curl -fsS "http://${DASHBOARD_HOST}:${DASHBOARD_PORT}/" >/dev/null
else
  wget -q -O - "http://${DASHBOARD_HOST}:${DASHBOARD_PORT}/health" >/dev/null || \
  wget -q -O - "http://${DASHBOARD_HOST}:${DASHBOARD_PORT}/" >/dev/null
fi

