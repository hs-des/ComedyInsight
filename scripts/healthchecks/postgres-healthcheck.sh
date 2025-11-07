#!/bin/sh
# Health check for PostgreSQL using pg_isready
set -eu

PGHOST=${POSTGRES_HOST:-localhost}
PGPORT=${POSTGRES_PORT:-5432}
PGUSER=${POSTGRES_USER:-postgres}
PGDATABASE=${POSTGRES_DB:-postgres}

pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE"

