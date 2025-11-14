# Performance & Sleep/Idle Issue Fixes

## Issues Identified

1. **Cold Start Lag**: Next.js server compiles on first request after idle
2. **Database Connection Idle Timeout**: Connections can timeout after being idle
3. **No Keepalive Mechanism**: Server can go idle without periodic health checks
4. **Uvicorn Timeout Settings**: Missing keepalive/timeout configurations

## Fixes Applied

### 1. ✅ Uvicorn Keepalive Settings

**File**: `ecosystem.config.js`

Added timeout settings to prevent connection drops:
- `--timeout-keep-alive 75`: Keeps connections alive for 75 seconds
- `--timeout-graceful-shutdown 10`: Allows 10 seconds for graceful shutdown

```javascript
args: 'backend.main:app --host 0.0.0.0 --port 8001 --timeout-keep-alive 75 --timeout-graceful-shutdown 10',
```

### 2. ✅ Database Connection Keepalive

**File**: `backend/database.py`

Added PostgreSQL keepalive settings to prevent idle connection timeouts:
- `keepalives=1`: Enable TCP keepalive
- `keepalives_idle=30`: Start keepalive after 30 seconds of idle
- `keepalives_interval=10`: Send keepalive every 10 seconds
- `keepalives_count=5`: Retry 5 times before considering connection dead

Also added connection validation before returning from pool to ensure connections are still alive.

### 3. ✅ Keepalive Health Check Script

**File**: `keepalive-health.sh`

Created a script that periodically pings both frontend and backend to prevent idle:
- Pings every 60 seconds
- Keeps servers "warm" to prevent cold starts
- Can run in background with `nohup`

### 4. ✅ Performance Diagnostic Script

**File**: `check-performance-issues.sh`

Created diagnostic script to check:
- PM2 process status
- Server response times
- Database connection pool status
- System resources (CPU, memory, disk)
- Network connections
- Cold start performance

## How to Apply Fixes

### On Server:

1. **Update PM2 configuration**:
   ```bash
   cd /home/ubuntu/cloudtribe-2.0
   git pull
   pm2 restart ecosystem.config.js
   ```

2. **Start keepalive health check** (optional but recommended):
   ```bash
   cd /home/ubuntu/cloudtribe-2.0
   nohup ./keepalive-health.sh > /dev/null 2>&1 &
   ```

3. **Check performance**:
   ```bash
   ./check-performance-issues.sh
   ```

## Expected Improvements

1. **Reduced Lag**: 
   - Keepalive prevents cold starts
   - Database connections stay alive
   - Faster response times

2. **Better Stability**:
   - No idle connection timeouts
   - Servers stay warm
   - Consistent performance

3. **Monitoring**:
   - Diagnostic script helps identify issues
   - Keepalive logs show server health

## Troubleshooting

### Still Experiencing Lag?

1. **Check if keepalive is running**:
   ```bash
   ps aux | grep keepalive-health
   ```

2. **Check PM2 logs**:
   ```bash
   pm2 logs --lines 50
   ```

3. **Check database connections**:
   ```bash
   psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
   ```

4. **Run diagnostic script**:
   ```bash
   ./check-performance-issues.sh
   ```

### Server Still Going Idle?

1. **Verify keepalive script is running**:
   ```bash
   nohup ./keepalive-health.sh > keepalive.log 2>&1 &
   tail -f keepalive.log
   ```

2. **Check system resources**:
   ```bash
   free -h
   df -h
   top
   ```

3. **Check for EC2 instance sleep** (if using AWS):
   - EC2 instances don't sleep, but check instance type
   - Free tier instances may throttle CPU

## Monitoring

### Check Keepalive Status:
```bash
tail -f keepalive.log  # If running with logging
```

### Check Server Response Times:
```bash
time curl -s http://127.0.0.1:3000/ >/dev/null
time curl -s http://127.0.0.1:8001/health >/dev/null
```

### Check PM2 Status:
```bash
pm2 status
pm2 monit
```

## Notes

- Keepalive script is optional but recommended for production
- Database keepalive settings prevent connection timeouts
- Uvicorn timeout settings improve connection handling
- All fixes are backward compatible







