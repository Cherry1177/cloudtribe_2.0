module.exports = {
  apps: [
    {
      name: 'fastapi-app',
      script: 'venv/bin/uvicorn',
      args: 'backend.main:app --host 0.0.0.0 --port 8001',
      interpreter: 'venv/bin/python3',
      cwd: '/home/ubuntu/cloudtribe-2.0',
      instances: 1,
      exec_mode: 'fork',
      env: {
        PYTHONPATH: 'backend',
        NODE_ENV: 'production'
      },
      // Restart policies
      autorestart: true,
      watch: false,
      max_memory_restart: '500M', // Restart if memory exceeds 500MB
      
      // Error handling
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      merge_logs: true,
      
      // Restart settings
      min_uptime: '10s', // Minimum uptime to consider app stable
      max_restarts: 10, // Maximum restarts in 1 minute
      restart_delay: 4000, // Delay before restart (4 seconds)
      
      // Graceful shutdown
      kill_timeout: 5000, // Wait 5 seconds before force kill
      listen_timeout: 10000, // Wait 10 seconds for app to start listening
      
      // Health monitoring
      wait_ready: false,
      exp_backoff_restart_delay: 100
    },
    {
      name: 'frontend',
      script: 'npm',
      args: 'run start',
      cwd: '/home/ubuntu/cloudtribe-2.0/client',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Restart policies
      autorestart: true,
      watch: false,
      max_memory_restart: '1G', // Restart if memory exceeds 1GB
      
      // Error handling
      error_file: './logs/pm2-frontend-error.log',
      out_file: './logs/pm2-frontend-out.log',
      log_file: './logs/pm2-frontend-combined.log',
      time: true,
      merge_logs: true,
      
      // Restart settings
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000
    }
  ]
};



