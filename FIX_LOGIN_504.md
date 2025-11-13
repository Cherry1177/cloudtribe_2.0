# Fix Login 504 Gateway Timeout

## Problem
Login endpoint returns `504 (Gateway Time-out)` - Nginx is waiting for backend but backend isn't responding.

## Quick Fix Steps (Run on Server)

### Step 1: Check if Backend is Running
```bash
pm2 status
```

**Expected:** `fastapi-app` should show `online` status

**If not running:**
```bash
cd ~/cloudtribe_2.0  # or your server path
pm2 restart fastapi-app
pm2 logs fastapi-app --lines 30
```

### Step 2: Test Backend Directly
```bash
# Test health endpoint
curl http://127.0.0.1:8001/health

# Test login endpoint directly
curl -X POST http://127.0.0.1:8001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"0906281900"}'
```

**If this times out:** Backend is hung or database connection is stuck.

### Step 3: Check Database Connection
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1;"
```

**If this hangs:** Database connection issue - check:
- Database server is running
- Network connectivity
- Database credentials

### Step 4: Increase Nginx Timeout
```bash
sudo ./fix-nginx-timeout.sh
```

Or manually edit `/etc/nginx/sites-enabled/app`:
```nginx
location /api/ {
    proxy_pass http://localhost:8001;
    proxy_read_timeout 60s;
    proxy_connect_timeout 10s;
    proxy_send_timeout 60s;
    # ... other settings
}
```

Then reload Nginx:
```bash
sudo nginx -t  # Test config
sudo systemctl reload nginx
```

### Step 5: Ensure Phone Index Exists
```bash
psql $DATABASE_URL -f backend/database/createIndex.sql
```

This ensures the `users.phone` column has an index for fast lookups.

### Step 6: Restart Everything
```bash
pm2 restart all
sudo systemctl reload nginx
```

## Common Causes & Solutions

### Cause 1: Backend Process Hung
**Solution:**
```bash
pm2 restart fastapi-app
pm2 logs fastapi-app --lines 50
```

### Cause 2: Database Connection Pool Exhausted
**Solution:** Restart backend to reset connection pool
```bash
pm2 restart fastapi-app
```

### Cause 3: Nginx Timeout Too Short
**Solution:** Increase timeout (see Step 4 above)

### Cause 4: Database Query Hanging
**Solution:** 
1. Check database server status
2. Check for long-running queries:
   ```sql
   SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
   FROM pg_stat_activity 
   WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '5 seconds';
   ```

### Cause 5: Missing Database Index
**Solution:**
```bash
psql $DATABASE_URL -f backend/database/createIndex.sql
```

## Diagnostic Commands

```bash
# Full diagnostic
./diagnose-login-timeout.sh

# Check what's using port 8001
lsof -i :8001

# Check backend logs
pm2 logs fastapi-app --lines 50

# Check Nginx error logs
sudo tail -20 /var/log/nginx/error.log

# Test backend health
curl -v http://127.0.0.1:8001/health
```

## After Fixing

1. Test login from browser
2. Check browser console for errors
3. Monitor backend logs: `pm2 logs fastapi-app`
4. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`

## Prevention

1. **Database Keepalive:** Already configured in `backend/database.py`
2. **Connection Pool:** Limited to 20 connections
3. **Uvicorn Timeout:** Set to 75s keepalive
4. **Nginx Timeout:** Should be 60s (see Step 4)

