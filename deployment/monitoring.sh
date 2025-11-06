#!/bin/bash
#
# Monitoring Commands for ComedyInsight
#

echo "📊 ComedyInsight System Status"
echo ""

# Server uptime
echo "🖥️  Server Uptime:"
uptime
echo ""

# Disk usage
echo "💾 Disk Usage:"
df -h
echo ""

# Memory usage
echo "🧠 Memory Usage:"
free -h
echo ""

# Service status
echo "🔧 Service Status:"
echo ""
echo "PostgreSQL:"
sudo systemctl status postgresql --no-pager | head -n 3
echo ""

echo "Redis:"
sudo systemctl status redis-server --no-pager | head -n 3
echo ""

echo "Nginx:"
sudo systemctl status nginx --no-pager | head -n 3
echo ""

echo "ComedyInsight API:"
sudo systemctl status comedyinsight-api --no-pager | head -n 3
echo ""

echo "ComedyInsight Worker:"
sudo systemctl status comedyinsight-worker --no-pager | head -n 3
echo ""

echo "MinIO:"
docker ps | grep minio
echo ""

# Process monitoring
echo "📈 Process Resources:"
echo ""
echo "Top processes by CPU:"
ps aux --sort=-%cpu | head -n 10
echo ""

echo "Top processes by Memory:"
ps aux --sort=-%mem | head -n 10
echo ""

# Network connections
echo "🌐 Network Connections:"
netstat -tuln | grep -E ':(3000|5432|6379|80|443)' | head -n 10
echo ""

# Database size
echo "🗄️  Database Size:"
sudo -u postgres psql -d comedyinsight -c "
SELECT 
    pg_size_pretty(pg_database_size('comedyinsight')) as db_size,
    (SELECT count(*) FROM videos) as videos,
    (SELECT count(*) FROM users) as users,
    (SELECT count(*) FROM subscriptions WHERE status='active') as active_subs;
"
echo ""

# Redis info
echo "🔴 Redis Info:"
redis-cli info memory | grep -E '(used_memory_human|used_memory_peak_human)'
echo ""

# Nginx stats
echo "🌐 Nginx Stats:"
echo "Requests in last hour:"
sudo tail -n 1000 /var/log/nginx/access.log | awk -v date="$(date -d '1 hour ago' '+%d/%b/%Y:%H')" '$4 > "["date {count++} END {print count+0}'
echo ""

# Error logs
echo "⚠️  Recent Errors (last 50 lines):"
echo ""
echo "API Errors:"
sudo tail -n 50 /var/log/comedyinsight/api-error.log 2>/dev/null || echo "No errors"
echo ""
