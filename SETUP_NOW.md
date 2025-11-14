# 🚀 Setup Steps - Do This Now

## Step 1: Deploy the Fixes to Your Server

On your server, run:

```bash
cd ~/cloudtribe_2.0

# Pull the latest changes (if using git)
# OR just make sure the updated files are on the server

# Restart backend with new connection pool fixes
pm2 restart fastapi-app

# Wait a few seconds
sleep 5

# Test if backend is working
curl http://127.0.0.1:8001/health
```

**Expected:** Should return `{"status":"healthy"...}`

---

## Step 2: Fix Frontend Port Conflict (One-time)

```bash
# Kill anything on port 3000
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

# Restart frontend
pm2 restart frontend

# Check status
pm2 status
```

**Expected:** Frontend should show `online` status

---

## Step 3: Set Up Auto-Monitoring (Prevents Future Crashes)

```bash
cd ~/cloudtribe_2.0

# Make script executable
chmod +x monitor-and-auto-fix.sh

# Start monitoring in background
nohup ./monitor-and-auto-fix.sh > monitor.log 2>&1 &

# Verify it's running
ps aux | grep monitor-and-auto-fix

# Check logs
tail -f monitor.log
```

**What this does:** Automatically restarts backend if it hangs (checks every 30 seconds)

---

## Step 4: Make PM2 Survive Server Reboots

```bash
# Save current PM2 processes
pm2 save

# Generate startup script
pm2 startup

# It will print a command like:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
# Copy and run that command
```

**What this does:** PM2 will auto-start all processes when server reboots

---

## Step 5: Test Login

1. Open your browser: `https://cloudtribe.site/login`
2. Try to log in
3. Check browser console (F12) for errors

**If login still times out:**
```bash
# Check backend logs
pm2 logs fastapi-app --lines 30

# Test backend directly
curl -X POST http://127.0.0.1:8001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"0966026265"}' \
  --max-time 10
```

---

## Step 6: Increase Nginx Timeout (If Still Having Issues)

```bash
sudo ./fix-nginx-timeout.sh
```

Or manually:
```bash
sudo nano /etc/nginx/sites-enabled/app
```

Add inside `location /api/ {` block:
```nginx
proxy_read_timeout 60s;
proxy_connect_timeout 10s;
```

Then:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Quick One-Liner Setup (All Steps Combined)

```bash
cd ~/cloudtribe_2.0 && \
pm2 restart fastapi-app && \
sleep 5 && \
lsof -ti :3000 | xargs kill -9 2>/dev/null; \
pm2 restart frontend && \
chmod +x monitor-and-auto-fix.sh && \
nohup ./monitor-and-auto-fix.sh > monitor.log 2>&1 & \
pm2 save && \
echo "✅ Setup complete! Test login now."
```

---

## Verify Everything is Working

```bash
# 1. Check PM2 status
pm2 status
# Should show both fastapi-app and frontend as "online"

# 2. Test backend health
curl http://127.0.0.1:8001/health
# Should return JSON with "status":"healthy"

# 3. Check monitor is running
ps aux | grep monitor-and-auto-fix
# Should show the process running

# 4. Check recent logs
pm2 logs fastapi-app --lines 10
# Should show no errors
```

---

## What You've Fixed

✅ **Database connection pool** - Better error handling, no leaks  
✅ **Auto-monitoring** - System self-heals from hangs  
✅ **Frontend port conflict** - Fixed  
✅ **PM2 persistence** - Survives reboots  
✅ **Nginx timeout** - Increased if needed  

---

## If Something Still Doesn't Work

1. **Login still times out:**
   ```bash
   pm2 logs fastapi-app --lines 50
   curl -v http://127.0.0.1:8001/health
   ```

2. **Frontend still crashing:**
   ```bash
   pm2 logs frontend --lines 50
   lsof -i :3000
   ```

3. **Monitor not working:**
   ```bash
   tail -f monitor.log
   ps aux | grep monitor
   ```

---

## Expected Result

After these steps:
- ✅ Login should work
- ✅ System should stay stable
- ✅ Auto-recovery from hangs
- ✅ Survives server reboots
- ✅ No more manual fixes needed

**You're done!** The system should now be self-sustaining.

