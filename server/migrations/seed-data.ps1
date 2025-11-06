# Seed Data Script for ComedyInsight
Write-Host "🌱 Seeding database..." -ForegroundColor Cyan

$DB_NAME = "mydatabase"
$DB_USER = "postgres"

# Function to execute SQL
function Execute-SQL {
    param($sql)
    $result = docker compose exec -T db psql -U $DB_USER -d $DB_NAME -c $sql 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Success" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed: $result" -ForegroundColor Red
    }
}

Write-Host "`n1. Inserting users..." -ForegroundColor Yellow
$sql = @"
INSERT INTO users (id, username, email, phone, password_hash, first_name, last_name, is_verified, is_active)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'admin', 'admin@comedyinsight.com', '+1234567890', '\$2b\$10\$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin', 'User', TRUE, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'john_doe', 'john@example.com', '+1234567891', '\$2b\$10\$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'John', 'Doe', TRUE, TRUE),
    ('33333333-3333-3333-3333-333333333333', 'jane_smith', 'jane@example.com', '+1234567892', '\$2b\$10\$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Jane', 'Smith', TRUE, TRUE)
ON CONFLICT (email) DO NOTHING;
"@
Execute-SQL $sql

Write-Host "`n2. Linking admin user..." -ForegroundColor Yellow
$sql = @"
INSERT INTO admin_users (user_id, role_id, is_super_admin)
SELECT 
    '11111111-1111-1111-1111-111111111111',
    id,
    TRUE
FROM roles 
WHERE name = 'super_admin'
ON CONFLICT (user_id) DO NOTHING;
"@
Execute-SQL $sql

Write-Host "`n3. Inserting artists..." -ForegroundColor Yellow
$sql = @"
INSERT INTO artists (id, name, slug, bio, profile_image_url, is_active, is_featured)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Dave Chappelle', 'dave-chappelle', 'American stand-up comedian', 'https://via.placeholder.com/300?text=Dave', TRUE, TRUE),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Kevin Hart', 'kevin-hart', 'American comedian and actor', 'https://via.placeholder.com/300?text=Kevin', TRUE, TRUE),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Amy Schumer', 'amy-schumer', 'American stand-up comedian', 'https://via.placeholder.com/300?text=Amy', TRUE, TRUE),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Hasan Minhaj', 'hasan-minhaj', 'American comedian and political commentator', 'https://via.placeholder.com/300?text=Hasan', TRUE, FALSE),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Tiffany Haddish', 'tiffany-haddish', 'American comedian and actress', 'https://via.placeholder.com/300?text=Tiffany', TRUE, FALSE)
ON CONFLICT (slug) DO NOTHING;
"@
Execute-SQL $sql

Write-Host "`n4. Inserting videos..." -ForegroundColor Yellow
$sql = @"
INSERT INTO videos (id, title, slug, description, thumbnail_url, video_url, duration_seconds, video_type, quality, file_size_mb, mime_type, is_featured, is_premium, is_active, published_at, tags, metadata, real_view_count, visible_view_count)
VALUES 
    ('11111111-1111-1111-1111-111111111100', 'Dave Chappelle - The Closer', 'dave-chappelle-the-closer', 'Latest comedy special', 'https://via.placeholder.com/640x360?text=Dave+Closer', 'https://example.com/videos/dave-closer.mp4', 3600, 'full', '1080p', 500.00, 'video/mp4', TRUE, FALSE, TRUE, NOW(), ARRAY['stand-up', 'comedy-special'], '{\"rating\": 4.8}'::jsonb, 1500000, 1500000),
    ('11111111-1111-1111-1111-111111111101', 'Kevin Hart - What Now?', 'kevin-hart-what-now', 'Performance at Lincoln Financial Field', 'https://via.placeholder.com/640x360?text=Kevin+Hart', 'https://example.com/videos/kevin-hart.mp4', 2400, 'full', '1080p', 350.00, 'video/mp4', TRUE, TRUE, TRUE, NOW(), ARRAY['stand-up', 'comedy-special'], '{\"rating\": 4.6}'::jsonb, 2300000, 2300000),
    ('11111111-1111-1111-1111-111111111102', 'Amy Schumer - Growing', 'amy-schumer-growing', 'Talks about marriage and pregnancy', 'https://via.placeholder.com/640x360?text=Amy+Schumer', 'https://example.com/videos/amy-growing.mp4', 2700, 'full', '1080p', 400.00, 'video/mp4', TRUE, FALSE, TRUE, NOW(), ARRAY['stand-up', 'comedy-special'], '{\"rating\": 4.5}'::jsonb, 890000, 890000),
    ('11111111-1111-1111-1111-111111111103', 'Hasan Minhaj - The Kings Jester', 'hasan-minhaj-kings-jester', 'Political comedy special', 'https://via.placeholder.com/640x360?text=Hasan+Minhaj', 'https://example.com/videos/hasan-jester.mp4', 3300, 'full', '1080p', 480.00, 'video/mp4', FALSE, TRUE, TRUE, NOW(), ARRAY['stand-up', 'political'], '{\"rating\": 4.7}'::jsonb, 1200000, 1200000),
    ('11111111-1111-1111-1111-111111111104', 'Tiffany Haddish - Black Mitzvah', 'tiffany-haddish-black-mitzvah', 'Celebration special', 'https://via.placeholder.com/640x360?text=Tiffany', 'https://example.com/videos/tiffany-mitzvah.mp4', 2100, 'full', '1080p', 300.00, 'video/mp4', FALSE, FALSE, TRUE, NOW(), ARRAY['stand-up'], '{\"rating\": 4.4}'::jsonb, 650000, 650000),
    ('11111111-1111-1111-1111-111111111105', 'Funny Compilation 2024', 'funny-compilation-2024', 'Best moments compilation', 'https://via.placeholder.com/640x360?text=Compilation', 'https://example.com/videos/compilation.mp4', 900, 'short', '720p', 150.00, 'video/mp4', FALSE, FALSE, TRUE, NOW(), ARRAY['compilation'], '{\"rating\": 4.3}'::jsonb, 450000, 450000)
ON CONFLICT (slug) DO NOTHING;
"@
Execute-SQL $sql

Write-Host "`n5. Linking videos to artists..." -ForegroundColor Yellow
$sql = @"
INSERT INTO video_artists (video_id, artist_id, role)
VALUES 
    ('11111111-1111-1111-1111-111111111100', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'main'),
    ('11111111-1111-1111-1111-111111111101', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'main'),
    ('11111111-1111-1111-1111-111111111102', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'main'),
    ('11111111-1111-1111-1111-111111111103', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'main'),
    ('11111111-1111-1111-1111-111111111104', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'main')
ON CONFLICT (video_id, artist_id) DO NOTHING;
"@
Execute-SQL $sql

Write-Host "`n6. Linking videos to categories..." -ForegroundColor Yellow
$sql = @"
INSERT INTO video_categories (video_id, category_id)
SELECT v.id, c.id
FROM videos v
CROSS JOIN categories c
WHERE v.slug IN ('dave-chappelle-the-closer', 'kevin-hart-what-now', 'amy-schumer-growing', 'hasan-minhaj-kings-jester', 'tiffany-haddish-black-mitzvah')
AND c.slug = 'stand-up'
ON CONFLICT (video_id, category_id) DO NOTHING;
"@
Execute-SQL $sql

Write-Host "`n7. Inserting subscriptions..." -ForegroundColor Yellow
$sql = @"
INSERT INTO subscriptions (id, user_id, subscription_type, status, price, currency, start_date, end_date, auto_renew)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01', '22222222-2222-2222-2222-222222222222', 'monthly', 'active', 9.99, 'USD', NOW() - INTERVAL '10 days', NOW() + INTERVAL '20 days', TRUE),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02', '33333333-3333-3333-3333-333333333333', 'yearly', 'active', 99.99, 'USD', NOW() - INTERVAL '30 days', NOW() + INTERVAL '335 days', TRUE)
ON CONFLICT DO NOTHING;
"@
Execute-SQL $sql

Write-Host "`n8. Inserting favorites..." -ForegroundColor Yellow
$sql = @"
INSERT INTO favorites (user_id, video_id)
VALUES 
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111100'),
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111101'),
    ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111102')
ON CONFLICT (user_id, video_id) DO NOTHING;
"@
Execute-SQL $sql

Write-Host "`n9. Inserting watch history..." -ForegroundColor Yellow
$sql = @"
INSERT INTO watch_history (user_id, video_id, watched_seconds, total_duration_seconds, completion_percentage)
VALUES 
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111100', 1800, 3600, 50.00),
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111101', 2400, 2400, 100.00),
    ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111102', 1350, 2700, 50.00)
ON CONFLICT (user_id, video_id) DO UPDATE SET
    watched_seconds = EXCLUDED.watched_seconds,
    total_duration_seconds = EXCLUDED.total_duration_seconds,
    completion_percentage = EXCLUDED.completion_percentage;
"@
Execute-SQL $sql

Write-Host "`n✅ Seed data complete!`n" -ForegroundColor Green

Write-Host "Verifying data..." -ForegroundColor Cyan
docker compose exec -T db psql -U postgres -d mydatabase -c "SELECT 'Users' as table_name, COUNT(*)::text as count FROM users UNION ALL SELECT 'Artists', COUNT(*)::text FROM artists UNION ALL SELECT 'Videos', COUNT(*)::text FROM videos UNION ALL SELECT 'Subscriptions', COUNT(*)::text FROM subscriptions UNION ALL SELECT 'Favorites', COUNT(*)::text FROM favorites;" 2>&1 | Select-String -Pattern "table_name|Users|Artists|Videos|Subscriptions|Favorites" | Select-Object -First 10
