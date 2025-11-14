# Quick Troubleshooting Guide

## If the website is not loading after reconnecting:

### Step 1: Check PM2 Status
```bash
pm2 status
```
**Expected:** Both `fastapi-app` and `frontend` should show `online` status

### Step 2: If apps are stopped, restart them
```bash
cd ~/cloudtribe_2.0
pm2 restart all
```

### Step 3: Check logs if something is wrong
```bash
pm2 logs --lines 50
```

### Step 4: Test backend directly
```bash
curl http://127.0.0.1:8001/health
```
**Expected:** Should return `{"status":"healthy"...}`

### Step 5: Test frontend
```bash
curl http://127.0.0.1:3000/ | head -20
```
**Expected:** Should return HTML (not error)

### Step 6: Check nginx
```bash
sudo systemctl status nginx
```
**Expected:** Should show `active (running)`

## Common Issues & Fixes

### Issue: PM2 shows apps as "errored" or "stopped"
**Fix:**
```bash
cd ~/cloudtribe_2.0
pm2 delete all
pm2 start ecosystem.config.js
pm2 save
```

### Issue: Port 3000 already in use
**Fix:**
```bash
sudo lsof -i :3000
sudo kill -9 <PID>  # Replace <PID> with the process ID from above
pm2 restart frontend
```

### Issue: Backend not responding (502 errors)
**Fix:**
```bash
# Check if backend is running
pm2 status fastapi-app

# Check backend logs
pm2 logs fastapi-app --lines 30

# Restart backend
pm2 restart fastapi-app

# Verify nginx is pointing to correct port
sudo grep "proxy_pass.*8001" /etc/nginx/sites-enabled/app
# Should show: proxy_pass http://localhost:8001;
```

### Issue: Frontend build is outdated
**Fix:**
```bash
cd ~/cloudtribe_2.0/client
npm run build
cd ..
pm2 restart frontend
```

## Quick Health Check (One Command)
```bash
pm2 status && echo "---" && curl -s http://127.0.0.1:8001/health && echo "---" && curl -s http://127.0.0.1:3000/ | head -5
```

## Restore PM2 After Server Reboot
If the server reboots, PM2 should auto-start, but if not:
```bash
pm2 resurrect
# OR
cd ~/cloudtribe_2.0
pm2 start ecosystem.config.js
```

## Emergency: Everything is broken
```bash
# Stop everything
pm2 delete all

# Restart from scratch
cd ~/cloudtribe_2.0
pm2 start ecosystem.config.js
pm2 save

# Check status
pm2 status
```

## Remember:
- **PM2 keeps running** even after you close SSH
- **Your apps stay online** when you disconnect
- **PM2 is more reliable** than systemd for Node.js/Python apps
- **You can always reconnect** and check `pm2 status`

