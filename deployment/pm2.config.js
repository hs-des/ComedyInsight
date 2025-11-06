/**
 * PM2 Configuration for ComedyInsight
 * Alternative to systemd for process management
 */

module.exports = {
  apps: [
    {
      name: 'comedyinsight-api',
      script: './dist/index.js',
      cwd: '/opt/comedyinsight/server',
      instances: 2, // Cluster mode: 2 instances
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_file: '/opt/comedyinsight/.env',
      error_file: '/var/log/comedyinsight/api-error.log',
      out_file: '/var/log/comedyinsight/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=2048',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      max_restarts: 10,
      min_uptime: '10s',
    },
    {
      name: 'comedyinsight-worker',
      script: './dist/worker.js',
      cwd: '/opt/comedyinsight/server',
      instances: 1, // Single instance for worker
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      env_file: '/opt/comedyinsight/.env',
      error_file: '/var/log/comedyinsight/worker-error.log',
      out_file: '/var/log/comedyinsight/worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      node_args: '--max-old-space-size=1024',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};

