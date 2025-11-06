# Database Migration Script for Docker (PowerShell)
# This script runs all migrations in order

$ErrorActionPreference = "Stop"

# Database connection details (from docker-compose.yml)
$DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$DB_PORT = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
$DB_NAME = if ($env:DB_NAME) { $env:DB_NAME } else { "mydatabase" }
$DB_USER = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }
$DB_PASSWORD = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "postgres" }

Write-Host "🚀 Starting database migrations..." -ForegroundColor Cyan
Write-Host "Database: $DB_NAME"
Write-Host "Host: ${DB_HOST}:${DB_PORT}"
Write-Host ""

# Migration files in order
$MIGRATIONS = @(
  "001_initial_schema.sql",
  "002_add_fake_views_campaigns.sql",
  "003_add_stripe_columns.sql",
  "004_add_ad_tracking_tables.sql",
  "005_add_download_encryption_fields.sql"
)

# Get the directory where this script is located
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path

# Track migration status
$MIGRATION_LOG = Join-Path $SCRIPT_DIR "migrations_applied.log"

# Function to check if migration has been applied
function Test-MigrationApplied {
    param($migrationFile)
    if (Test-Path $MIGRATION_LOG) {
        $content = Get-Content $MIGRATION_LOG
        return $content -contains $migrationFile
    }
    return $false
}

# Function to mark migration as applied
function Add-MigrationLog {
    param($migrationFile)
    Add-Content -Path $MIGRATION_LOG -Value $migrationFile
}

# Wait for database to be ready
Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$dbReady = $false

while ($attempt -lt $maxAttempts) {
    try {
        $env:PGPASSWORD = $DB_PASSWORD
        $result = & docker compose exec -T db psql -U $DB_USER -d postgres -c "SELECT 1" 2>&1
        if ($LASTEXITCODE -eq 0) {
            $dbReady = $true
            break
        }
    } catch {
        # Continue waiting
    }
    $attempt++
    Write-Host "  Attempt $attempt/$maxAttempts - Database not ready, waiting..." -ForegroundColor Gray
    Start-Sleep -Seconds 2
}

if (-not $dbReady) {
    Write-Host "❌ Database is not ready after $maxAttempts attempts" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Database is ready!" -ForegroundColor Green
Write-Host ""

# Run migrations
foreach ($migration in $MIGRATIONS) {
    $migrationPath = Join-Path $SCRIPT_DIR $migration
    
    if (-not (Test-Path $migrationPath)) {
        Write-Host "⚠️  Warning: Migration file not found: $migration" -ForegroundColor Yellow
        continue
    }

    if (Test-MigrationApplied $migration) {
        Write-Host "⏭️  Skipping $migration (already applied)" -ForegroundColor Gray
        continue
    }

    Write-Host "📝 Running migration: $migration" -ForegroundColor Cyan
    
    try {
        $env:PGPASSWORD = $DB_PASSWORD
        Get-Content $migrationPath | docker compose exec -T db psql -U $DB_USER -d $DB_NAME
        
        if ($LASTEXITCODE -eq 0) {
            Add-MigrationLog $migration
            Write-Host "✅ Successfully applied: $migration" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to apply: $migration" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "❌ Error applying migration: $migration" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
}

# Check for refresh_tokens migration
$REFRESH_TOKENS_MIGRATION = Join-Path (Split-Path (Split-Path $SCRIPT_DIR)) "security\migrations\create_refresh_tokens.sql"
if (Test-Path $REFRESH_TOKENS_MIGRATION) {
    if (-not (Test-MigrationApplied "create_refresh_tokens.sql")) {
        Write-Host "📝 Running migration: create_refresh_tokens.sql" -ForegroundColor Cyan
        try {
            $env:PGPASSWORD = $DB_PASSWORD
            Get-Content $REFRESH_TOKENS_MIGRATION | docker compose exec -T db psql -U $DB_USER -d $DB_NAME
            
            if ($LASTEXITCODE -eq 0) {
                Add-MigrationLog "create_refresh_tokens.sql"
                Write-Host "✅ Successfully applied: create_refresh_tokens.sql" -ForegroundColor Green
            } else {
                Write-Host "❌ Failed to apply: create_refresh_tokens.sql" -ForegroundColor Red
                exit 1
            }
        } catch {
            Write-Host "❌ Error applying migration: create_refresh_tokens.sql" -ForegroundColor Red
            Write-Host $_.Exception.Message -ForegroundColor Red
            exit 1
        }
        Write-Host ""
    } else {
        Write-Host "⏭️  Skipping create_refresh_tokens.sql (already applied)" -ForegroundColor Gray
    }
}

Write-Host "🎉 All migrations completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Verifying database..." -ForegroundColor Cyan

# Verify tables were created
$env:PGPASSWORD = $DB_PASSWORD
$tableCount = docker compose exec -T db psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
Write-Host "   Tables created: $($tableCount.Trim())"

# List key tables
Write-Host ""
Write-Host "📋 Key tables:" -ForegroundColor Cyan
docker compose exec -T db psql -U $DB_USER -d $DB_NAME -c "\dt"

Write-Host ""
Write-Host "✨ Database setup complete!" -ForegroundColor Green
