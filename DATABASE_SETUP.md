# Database Setup Guide for Docker

This guide explains how to set up all database tables in your Docker environment.

## Prerequisites

1. Docker and Docker Compose are running
2. All containers are started: `docker compose up -d`
3. PostgreSQL container is healthy

## Quick Setup (Recommended)

### Option 1: Using PowerShell Script (Windows)

```powershell
cd server\migrations
.\run-migrations.ps1
```

### Option 2: Using Bash Script (Linux/Mac/WSL)

```bash
cd server/migrations
chmod +x run-migrations.sh
./run-migrations.sh
```

### Option 3: Manual Migration (Step by Step)

If you prefer to run migrations manually:

```powershell
# Connect to the database container
docker compose exec db psql -U postgres -d mydatabase

# Or run migrations directly
docker compose exec -T db psql -U postgres -d mydatabase < server/migrations/001_initial_schema.sql
docker compose exec -T db psql -U postgres -d mydatabase < server/migrations/002_add_fake_views_campaigns.sql
docker compose exec -T db psql -U postgres -d mydatabase < server/migrations/003_add_stripe_columns.sql
docker compose exec -T db psql -U postgres -d mydatabase < server/migrations/004_add_ad_tracking_tables.sql
docker compose exec -T db psql -U postgres -d mydatabase < server/migrations/005_add_download_encryption_fields.sql
```

## Migration Files

The migrations are run in this order:

1. **001_initial_schema.sql** - Core schema with all main tables
   - Users, OAuth accounts, phone OTPs
   - Artists, categories, videos
   - Video variants, subtitles
   - User engagement (favorites, downloads, watch history, views)
   - Subscriptions and payments
   - Ads and homepage configuration
   - Notifications
   - Admin roles and permissions
   - Audit logs and user settings

2. **002_add_fake_views_campaigns.sql** - Fake views functionality
   - Additional columns for view manipulation

3. **003_add_stripe_columns.sql** - Stripe payment integration
   - Stripe-specific columns for subscriptions and payments

4. **004_add_ad_tracking_tables.sql** - Ad tracking
   - Ad impressions and clicks tracking

5. **005_add_download_encryption_fields.sql** - Download encryption
   - Fields for encrypted download tokens

6. **security/migrations/create_refresh_tokens.sql** - Refresh tokens
   - JWT refresh token storage

## Verification

After running migrations, verify the setup:

```powershell
# Connect to database
docker compose exec db psql -U postgres -d mydatabase

# Check tables
\dt

# Count tables (should be ~27 tables)
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';

# Check some key tables
SELECT * FROM videos LIMIT 5;
SELECT * FROM users LIMIT 5;
SELECT * FROM roles;
```

## Expected Tables

After successful migration, you should have these tables:

### Core Tables
- `users`
- `oauth_accounts`
- `phone_otps`

### Content Tables
- `artists`
- `categories`
- `videos`
- `video_variants`
- `subtitles`
- `video_artists`
- `video_categories`

### User Engagement
- `favorites`
- `downloads`
- `watch_history`
- `views`
- `fake_views_logs`

### Subscriptions & Payments
- `subscriptions`
- `payments`

### Content Management
- `ads`
- `homepage_sections`
- `homepage_items`

### Notifications
- `push_tokens`
- `notifications`

### Admin & Auth
- `roles`
- `permissions`
- `role_permissions`
- `admin_users`
- `audit_logs`
- `refresh_tokens`

### Settings
- `user_settings`

## Troubleshooting

### Migration Already Applied

The scripts track applied migrations in `migrations_applied.log`. To reset:

```powershell
Remove-Item server\migrations\migrations_applied.log
```

### Connection Errors

If you get connection errors:

1. **Check if containers are running:**
   ```powershell
   docker compose ps
   ```

2. **Check database logs:**
   ```powershell
   docker compose logs db
   ```

3. **Verify database is ready:**
   ```powershell
   docker compose exec db pg_isready -U postgres
   ```

### Permission Errors

If you get permission errors on the script:

```powershell
# PowerShell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Database Already Has Data

If the database already has tables and you want to start fresh:

```powershell
# ⚠️ WARNING: This will delete all data!
docker compose exec db psql -U postgres -d mydatabase -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

Then run migrations again.

## Using pgAdmin (Web UI)

1. Open http://localhost:8080
2. Login:
   - Email: `admin@local.com`
   - Password: `admin`
3. Add server:
   - Host: `db`
   - Port: `5432`
   - Database: `mydatabase`
   - Username: `postgres`
   - Password: `postgres`

You can then run migrations or queries directly from pgAdmin.

## Next Steps

After setting up the database:

1. ✅ Verify all tables are created
2. ✅ Test admin dashboard login
3. ✅ Upload a test video
4. ✅ Test video processing queue
5. ✅ Test mobile app connection

## Reset Database

To completely reset the database:

```powershell
# Stop containers
docker compose down

# Remove volumes (⚠️ deletes all data)
docker compose down -v

# Start fresh
docker compose up -d

# Run migrations again
cd server\migrations
.\run-migrations.ps1
```
