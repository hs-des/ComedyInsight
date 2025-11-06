# Database Migrations

This directory contains SQL migration files for the ComedyInsight PostgreSQL database.

## Structure

```
migrations/
├── README.md                # This file
└── 001_initial_schema.sql   # Initial database schema
```

## Running Migrations

### Using psql (Command Line)

```bash
# From the server directory
cd server

# Run the migration
psql -U postgres -d comedyinsight -f migrations/001_initial_schema.sql

# Or with explicit connection string
psql -h localhost -U postgres -d comedyinsight -f migrations/001_initial_schema.sql
```

### Using PGAdmin

1. Open PGAdmin
2. Connect to your PostgreSQL server
3. Right-click on the `comedyinsight` database
4. Select "Query Tool"
5. Open `server/migrations/001_initial_schema.sql`
6. Execute the query (F5)

### Using Node.js

```bash
# Install pg CLI tools
npm install -g pg-cli

# Run migration
psql postgres://postgres:password@localhost:5432/comedyinsight < migrations/001_initial_schema.sql
```

## Verification

After running the migration, verify the schema was created:

```bash
# List all tables
psql -U postgres -d comedyinsight -c "\dt"

# Count tables (should be 27)
psql -U postgres -d comedyinsight -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"

# Check indexes
psql -U postgres -d comedyinsight -c "\di"

# Verify triggers
psql -U postgres -d comedyinsight -c "SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public';"
```

## Rollback

To rollback the migration, uncomment the rollback section at the bottom of the SQL file and run it:

```bash
# Extract rollback section
sed -n '/^\/\*$/,$ p' migrations/001_initial_schema.sql | sed 's/^\/\*$//' > rollback.sql

# Run rollback
psql -U postgres -d comedyinsight -f rollback.sql
```

## Migration Contents

### Tables Created (27 total)

1. **Core User Tables**
   - users
   - oauth_accounts
   - phone_otps

2. **Content Tables**
   - artists
   - categories
   - videos
   - video_variants
   - subtitles

3. **Relationship Tables**
   - video_artists
   - video_categories

4. **User Engagement**
   - favorites
   - downloads
   - watch_history
   - views
   - fake_views_logs

5. **Subscription & Payments**
   - subscriptions
   - payments

6. **Content Management**
   - ads
   - homepage_sections
   - homepage_items

7. **Notifications**
   - push_tokens
   - notifications

8. **Admin & Auth**
   - roles
   - permissions
   - role_permissions
   - admin_users

9. **Audit & Settings**
   - audit_logs
   - user_settings

### Key Features

- ✅ **UUID Primary Keys**: All tables use `gen_random_uuid()` for primary keys
- ✅ **Full-Text Search**: GIN indexes on title/name columns for searching
- ✅ **JSONB Support**: GIN indexes on JSONB metadata fields
- ✅ **Foreign Keys**: Proper referential integrity constraints
- ✅ **Cascading Deletes**: Configured where appropriate
- ✅ **Auto Timestamps**: Triggers for `updated_at` columns
- ✅ **View Counts**: real_view_count, visible_view_count, boosted_view_count on videos
- ✅ **Initial Data**: Default roles, permissions, and categories

### Indexes

Over 100 indexes created for:
- Foreign key lookups
- Full-text search
- JSONB queries
- Common filter conditions
- Pagination and sorting

### Triggers

1. **update_updated_at_column**: Automatically updates `updated_at` timestamp
2. **calculate_visible_view_count**: Calculates visible views from real + boosted

### Initial Data

The migration includes:
- 4 default roles (super_admin, admin, moderator, editor)
- 16 default permissions
- 5 default categories
- Role-permission assignments

## Future Migrations

When creating new migrations:

1. Name them sequentially: `002_<description>.sql`, `003_<description>.sql`, etc.
2. Include rollback section at the end
3. Test both forward and backward migrations
4. Document what changed in the README
5. Keep migrations focused and atomic

## Troubleshooting

### Error: Extension "uuid-ossp" does not exist

```bash
# Install the extension
sudo apt-get install postgresql-contrib  # Ubuntu/Debian
brew install postgresql                 # macOS

# Or create it manually
psql -U postgres -d comedyinsight -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
```

### Error: Permission denied

```bash
# Grant necessary permissions
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE comedyinsight TO postgres;"
psql -U postgres -d comedyinsight -c "GRANT ALL ON SCHEMA public TO postgres;"
```

### Error: Table already exists

```bash
# Drop and recreate (WARNING: This deletes all data!)
psql -U postgres -d comedyinsight -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Then rerun the migration
psql -U postgres -d comedyinsight -f migrations/001_initial_schema.sql
```

### Check Migration Status

```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Schema Documentation

For detailed schema documentation, see the SQL file comments. Each table includes:
- Column descriptions
- Data types and constraints
- Foreign key relationships
- Index purposes

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [UUID Extension](https://www.postgresql.org/docs/current/uuid-ossp.html)
- [JSONB Guide](https://www.postgresql.org/docs/current/datatype-json.html)
- [GIN Indexes](https://www.postgresql.org/docs/current/gin.html)

