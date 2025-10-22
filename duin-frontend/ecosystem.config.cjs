module.exports = {
  apps: [
    {
      name: 'duin-frontend',
      script: 'npm',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      // Memory optimization for build process
      node_args: '--max-old-space-size=2048',
      env: {
        NODE_ENV: 'development',
        PORT: 3002,
        NODE_OPTIONS: '--max-old-space-size=2048'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3002,
        NODE_OPTIONS: '--max-old-space-size=2048'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
