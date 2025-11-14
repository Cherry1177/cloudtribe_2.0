# CloudTribe Stability Fixes

This document explains the fixes implemented to prevent sudden shutdowns and improve application stability.

## Problems Addressed

1. **Unhandled Exceptions**: Uncaught exceptions could crash the entire application
2. **Database Connection Exhaustion**: Creating new connections for each request could exhaust database connections
3. **No Auto-Restart**: PM2 wasn't configured with proper restart policies
4. **Resource Leaks**: No proper cleanup on shutdown
5. **No Health Monitoring**: No way to check if the application is healthy

## Solutions Implemented

### 1. Global Exception Handler ✅

**Location**: `backend/main.py`

Added a global exception handler that catches all unhandled exceptions and prevents the application from crashing:

```python
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {type(exc).__name__}: {str(exc)}", exc_info=True)
    return {
        "error": "Internal server error",
        "message": "An unexpected error occurred. Please try again later.",
        "status_code": 500
    }
```

**Benefits**:
- Prevents crashes from unhandled exceptions
- Logs all errors for debugging
- Returns user-friendly error messages

### 2. Database Connection Pooling ✅

**Location**: `backend/database.py`

Implemented connection pooling to prevent database connection exhaustion:

- **Pool Size**: 1-20 connections
- **Automatic Management**: Connections are reused instead of creating new ones
- **Fallback**: Falls back to direct connections if pool fails

**Benefits**:
- Prevents "too many connections" errors
- Improves performance by reusing connections
- Reduces database load

### 3. PM2 Ecosystem Configuration ✅

**Location**: `ecosystem.config.js`

Created a comprehensive PM2 configuration with:

- **Auto-restart**: Automatically restarts crashed processes
- **Memory Limits**: Restarts if memory exceeds 500MB (backend) or 1GB (frontend)
- **Restart Policies**: 
  - Max 10 restarts per minute
  - 4 second delay between restarts
  - Minimum 10 seconds uptime to consider stable
- **Logging**: Centralized logging for monitoring
- **Graceful Shutdown**: 5 second timeout before force kill

**Benefits**:
- Automatic recovery from crashes
- Prevents memory leaks from crashing the server
- Better monitoring and debugging

### 4. Startup/Shutdown Handlers ✅

**Location**: `backend/main.py`

Added proper resource management:

- **Startup**: Initializes database connection pool
- **Shutdown**: Closes all database connections gracefully

**Benefits**:
- Proper resource cleanup
- Prevents connection leaks
- Clean application lifecycle

### 5. Health Check Endpoint ✅

**Location**: `backend/main.py` - `/health`

Added a health check endpoint that monitors:
- Application status
- Database connectivity
- Timestamp

**Usage**:
```bash
curl http://your-server:8001/health
```

**Response**:
```json
{
  "status": "healthy",
  "database": "healthy",
  "timestamp": "2025-01-15T10:30:00"
}
```

**Benefits**:
- Monitor application health
- Detect issues early
- Integration with load balancers and monitoring tools

## How to Use

### Option 1: Use PM2 Ecosystem Config (Recommended)

```bash
# Stop existing processes
pm2 stop all
pm2 delete all

# Start with ecosystem config
npm run prod:ecosystem

# Or manually
pm2 start ecosystem.config.js
```

### Option 2: Use Existing Scripts

```bash
# Stop existing processes
pm2 stop all
pm2 delete all

# Start with existing scripts
npm run prod
```

### Monitoring

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs

# View specific app logs
pm2 logs fastapi-app
pm2 logs frontend

# Monitor resources
pm2 monit
```

### Health Check

```bash
# Check application health
curl http://localhost:8001/health

# Or from EC2
curl http://13.55.79.119:8001/health
```

## Configuration Details

### PM2 Restart Policies

- **max_memory_restart**: Restarts if memory exceeds limit
- **autorestart**: Automatically restarts crashed processes
- **max_restarts**: Maximum restarts in 1 minute (prevents restart loops)
- **min_uptime**: Minimum uptime to consider app stable
- **restart_delay**: Delay before restarting

### Database Connection Pool

- **minconn**: Minimum connections in pool (1)
- **maxconn**: Maximum connections in pool (20)
- **Automatic cleanup**: Connections are returned to pool after use

## Troubleshooting

### Application Still Crashing

1. **Check PM2 logs**:
   ```bash
   pm2 logs --lines 100
   ```

2. **Check application logs**:
   ```bash
   tail -f backend/logs/orders.log
   tail -f backend/logs/drivers.log
   ```

3. **Check system resources**:
   ```bash
   # CPU and Memory
   top
   htop
   
   # Disk space
   df -h
   ```

4. **Check database connections**:
   ```bash
   # Connect to database and check active connections
   psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
   ```

### High Memory Usage

1. **Check PM2 memory usage**:
   ```bash
   pm2 monit
   ```

2. **Restart if needed**:
   ```bash
   pm2 restart fastapi-app
   ```

3. **Check for memory leaks**:
   - Review application logs
   - Check for unclosed connections
   - Monitor memory over time

### Database Connection Issues

1. **Check pool status**:
   - Review application logs for connection pool errors
   - Check database connection limits

2. **Increase pool size** (if needed):
   Edit `backend/database.py`:
   ```python
   connection_pool = psycopg2.pool.SimpleConnectionPool(
       minconn=1,
       maxconn=30,  # Increase if needed
       dsn=database_url
   )
   ```

## Best Practices

1. **Monitor Regularly**: Check PM2 status and logs regularly
2. **Set Up Alerts**: Configure alerts for health check failures
3. **Review Logs**: Regularly review application logs for errors
4. **Resource Limits**: Adjust memory limits based on your server capacity
5. **Database Monitoring**: Monitor database connection usage

## Next Steps

1. **Set up monitoring**: Consider using PM2 Plus or other monitoring tools
2. **Configure alerts**: Set up alerts for health check failures
3. **Load testing**: Test the application under load to ensure stability
4. **Review logs**: Regularly review logs to identify potential issues

## Files Modified

- `backend/main.py`: Added global exception handler, startup/shutdown handlers, health check
- `backend/database.py`: Implemented connection pooling
- `ecosystem.config.js`: Created PM2 ecosystem configuration
- `package.json`: Added ecosystem script

## Notes

- The ecosystem config uses paths for Ubuntu EC2 (`/home/ubuntu/cloudtribe-2.0`)
- Adjust paths in `ecosystem.config.js` if your deployment path is different
- Connection pool falls back to direct connections if pool initialization fails
- All errors are logged for debugging purposes










