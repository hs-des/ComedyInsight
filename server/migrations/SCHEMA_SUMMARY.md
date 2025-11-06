# Database Schema Summary

Quick reference for the ComedyInsight database schema.

## Table Dependency Graph

```
users (PK: id)
├── oauth_accounts (FK: user_id → users.id)
├── phone_otps (no FK)
├── favorites (FK: user_id → users.id)
├── downloads (FK: user_id → users.id)
├── watch_history (FK: user_id → users.id)
├── views (FK: user_id → users.id)
├── subscriptions (FK: user_id → users.id)
├── payments (FK: user_id → users.id)
├── push_tokens (FK: user_id → users.id)
├── notifications (FK: user_id → users.id)
├── admin_users (FK: user_id → users.id)
├── audit_logs (FK: user_id → users.id)
└── user_settings (FK: user_id → users.id)

artists (PK: id)
├── video_artists (FK: artist_id → artists.id)
└── homepage_items (FK: artist_id → artists.id)

categories (PK: id, self-referencing)
├── categories (FK: parent_id → categories.id)
├── video_categories (FK: category_id → categories.id)
└── homepage_items (FK: category_id → categories.id)

videos (PK: id)
├── video_variants (FK: video_id → videos.id)
├── subtitles (FK: video_id → videos.id)
├── video_artists (FK: video_id → videos.id)
├── video_categories (FK: video_id → videos.id)
├── favorites (FK: video_id → videos.id)
├── downloads (FK: video_id → videos.id)
├── watch_history (FK: video_id → videos.id)
├── views (FK: video_id → videos.id)
├── fake_views_logs (FK: video_id → videos.id)
└── homepage_items (FK: video_id → videos.id)

subscriptions (PK: id)
└── payments (FK: subscription_id → subscriptions.id)

homepage_sections (PK: id)
└── homepage_items (FK: section_id → homepage_sections.id)

roles (PK: id)
├── admin_users (FK: role_id → roles.id)
└── role_permissions (FK: role_id → roles.id)

permissions (PK: id)
└── role_permissions (FK: permission_id → permissions.id)
```

## Core Tables Overview

### User Management (3 tables)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | Core user accounts | id, username, email, phone, password_hash |
| `oauth_accounts` | OAuth provider links | id, user_id, provider, provider_user_id |
| `phone_otps` | Phone verification | id, phone, otp_code, expires_at |

### Content (5 tables)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `artists` | Comedy performers | id, name, slug, profile_image_url |
| `categories` | Video categories | id, name, slug, parent_id |
| `videos` | Main videos | id, title, slug, video_url, duration |
| `video_variants` | Video qualities | id, video_id, quality, video_url |
| `subtitles` | Video subtitles | id, video_id, language, subtitle_url |

### Relationships (2 tables)

| Table | Purpose | Relationships |
|-------|---------|---------------|
| `video_artists` | Many-to-many | videos ↔ artists |
| `video_categories` | Many-to-many | videos ↔ categories |

### User Engagement (5 tables)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `favorites` | User favorites | user_id, video_id |
| `downloads` | User downloads | user_id, video_id, quality, expires_at |
| `watch_history` | View history | user_id, video_id, watched_seconds |
| `views` | View tracking | user_id, video_id, ip_address, view_date |
| `fake_views_logs` | View manipulation | video_id, fake_views_count, request_type |

### Subscriptions & Payments (2 tables)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `subscriptions` | User subscriptions | user_id, type, status, start_date, end_date |
| `payments` | Payment transactions | user_id, amount, status, transaction_id |

### Content Management (3 tables)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `ads` | Ad campaigns | id, title, ad_type, position, is_active |
| `homepage_sections` | Section config | id, name, layout_type, display_order |
| `homepage_items` | Section items | section_id, video_id, artist_id, category_id |

### Notifications (2 tables)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `push_tokens` | Device tokens | user_id, device_token, device_type |
| `notifications` | User notifications | user_id, title, body, is_read |

### Admin & Auth (5 tables)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `roles` | Admin roles | id, name, is_system |
| `permissions` | System permissions | id, name, resource, action |
| `role_permissions` | Role-permission links | role_id, permission_id |
| `admin_users` | Admin accounts | user_id, role_id, is_super_admin |
| `audit_logs` | System audit trail | user_id, action, resource_type |

### Settings (1 table)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `user_settings` | User preferences | user_id, setting_key, setting_value |

## Column Statistics

- **Total Tables**: 27
- **Total Columns**: ~250+
- **Total Indexes**: 100+
- **Total Foreign Keys**: 40+
- **Total Triggers**: 20+
- **JSONB Columns**: 15+

## Key Constraints

### Unique Constraints

- `users`: email, username, phone
- `oauth_accounts`: (provider, provider_user_id)
- `artists`: slug
- `categories`: name, slug
- `videos`: slug
- `video_variants`: (video_id, quality)
- `subtitles`: (video_id, language)
- `video_artists`: (video_id, artist_id)
- `video_categories`: (video_id, category_id)
- `favorites`: (user_id, video_id)
- `watch_history`: (user_id, video_id)
- `push_tokens`: (user_id, device_token)
- `user_settings`: (user_id, setting_key)

### Foreign Key Constraints

All foreign keys have appropriate `ON DELETE` actions:
- `CASCADE`: Delete dependent records (e.g., user → oauth_accounts)
- `SET NULL`: Set FK to NULL (e.g., user → views.user_id)
- `RESTRICT`: Prevent deletion (e.g., roles → admin_users)

## Search & Indexing Strategy

### Full-Text Search
- `artists.name` → GIN index with to_tsvector
- `videos.title` → GIN index with to_tsvector

### JSONB Queries
- All JSONB columns have GIN indexes
- Examples: metadata, provider_response, target_demographics

### Performance Indexes
- All foreign keys indexed
- Common filter columns indexed (is_active, status, dates)
- Array columns indexed (tags)
- Composite indexes on unique constraints

## Common Query Patterns

### Get User Profile
```sql
SELECT * FROM users WHERE id = '...';
```

### Get User's Favorite Videos
```sql
SELECT v.* 
FROM videos v
JOIN favorites f ON v.id = f.video_id
WHERE f.user_id = '...';
```

### Get Video with Artists and Categories
```sql
SELECT 
    v.*,
    json_agg(DISTINCT jsonb_build_object('id', a.id, 'name', a.name)) as artists,
    json_agg(DISTINCT jsonb_build_object('id', c.id, 'name', c.name)) as categories
FROM videos v
LEFT JOIN video_artists va ON v.id = va.video_id
LEFT JOIN artists a ON va.artist_id = a.id
LEFT JOIN video_categories vc ON v.id = vc.video_id
LEFT JOIN categories c ON vc.category_id = c.id
WHERE v.id = '...'
GROUP BY v.id;
```

### Search Videos by Title
```sql
SELECT * 
FROM videos 
WHERE to_tsvector('english', title) @@ to_tsquery('english', 'comedy');
```

### Get View Statistics
```sql
SELECT 
    real_view_count,
    visible_view_count,
    boosted_view_count,
    (visible_view_count - real_view_count) as fake_views
FROM videos
WHERE id = '...';
```

### Get Admin Permissions
```sql
SELECT p.*
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
JOIN admin_users au ON rp.role_id = au.role_id
WHERE au.user_id = '...';
```

## Data Types Overview

| Type | Usage | Examples |
|------|-------|----------|
| UUID | Primary keys, foreign keys | All id columns |
| VARCHAR | Names, slugs, emails | username, title, slug |
| TEXT | Long text content | bio, description |
| JSONB | Flexible data | metadata, social_links |
| TIMESTAMP WITH TIME ZONE | Timestamps | created_at, updated_at |
| BOOLEAN | Flags | is_active, is_featured |
| INTEGER | Counts | view_count, duration_seconds |
| DECIMAL | Money, sizes | price, file_size_mb |
| ARRAY | Lists | tags, permissions |
| INET | IP addresses | ip_address |

## Triggers Summary

### Auto-Update Timestamps
Every table with `updated_at` has a trigger that updates it on `UPDATE` operations.

### View Count Calculation
The `videos` table has a trigger that calculates `visible_view_count` from `real_view_count + boosted_view_count`.

## Initial Seed Data

### Roles (4)
1. super_admin
2. admin
3. moderator
4. editor

### Permissions (16+)
- Resource permissions for: users, videos, artists, categories
- Actions: create, read, update, delete, publish

### Categories (5)
1. Stand-up Comedy
2. Sketch Comedy
3. Improv Comedy
4. Comedy Specials
5. Funny Moments

## Backup & Restore

### Backup Full Schema
```bash
pg_dump -U postgres -d comedyinsight -F c -f backup.dump
```

### Restore Schema
```bash
pg_restore -U postgres -d comedyinsight backup.dump
```

### Export Schema Only (no data)
```bash
pg_dump -U postgres -d comedyinsight --schema-only -f schema.sql
```

## Migration History

| File | Date | Description |
|------|------|-------------|
| 001_initial_schema.sql | 2024 | Initial complete schema with all 27 tables |

## Next Steps

1. Create migration for user-specific customizations
2. Add indexes based on query performance analysis
3. Set up connection pooling
4. Configure read replicas for scaling
5. Implement database-level row-level security (RLS)
6. Set up automated backups

