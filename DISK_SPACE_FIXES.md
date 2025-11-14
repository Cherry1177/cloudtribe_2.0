# Disk Space Cleanup Guide

## Issues Identified

1. **Root volume 91% full** (6.7 GB total) - Critical issue causing performance degradation
2. **Redundant virtual environments**: Both `venv` and `fastapi-env` exist, but only `venv` is used
3. **Log files accumulating**: Application and system logs consuming space
4. **Python cache files**: `__pycache__` directories throughout the codebase

## Solution

A cleanup script has been created: `cleanup-disk-space.sh`

### What the Script Does

1. **Removes redundant `fastapi-env`** virtual environment (~70MB saved)
   - Only `venv` is used in production (see `ecosystem.config.js`)
   - `fastapi-env` is not referenced anywhere in the codebase

2. **Cleans up old log files**:
   - Removes application logs older than 7 days
   - Compresses large log files (>10MB)
   - Cleans PM2 logs older than 7 days

3. **Cleans system logs** (with sudo):
   - Cleans journalctl logs (keeps last 7 days)
   - Removes old system logs (>30 days)
   - Removes old compressed logs (>90 days)

4. **Removes Python cache files**:
   - `__pycache__` directories
   - `.pyc` and `.pyo` files
   - These are automatically regenerated

5. **Removes temporary files**:
   - `.tmp`, `.temp` files
   - `.DS_Store` (macOS)
   - `Thumbs.db` (Windows)

6. **Identifies old backups** for manual review

## How to Run

### On Your Server:

```bash
cd /home/ubuntu/cloudtribe-2.0
./cleanup-disk-space.sh
```

**Note**: Some operations require sudo for system log cleanup. The script will handle this gracefully.

## Expected Space Savings

- **fastapi-env removal**: ~70MB
- **Old logs**: ~50-200MB (depends on log volume)
- **System logs**: ~100-500MB (depends on system activity)
- **Python cache**: ~10-50MB
- **Temporary files**: ~5-20MB

**Total expected**: ~235-840MB freed (3-12% of 6.7GB disk)

## Manual Cleanup (If Needed)

### Check what's using space:

```bash
# Check directory sizes
sudo du -h --max-depth=1 / | sort -h

# Check specific directories
du -sh ~/cloudtribe_2.0/* | sort -h
du -sh /var/log/* 2>/dev/null | sort -h | tail -20
```

### Remove fastapi-env manually:

```bash
cd /home/ubuntu/cloudtribe_2.0
rm -rf fastapi-env
```

### Clean logs manually:

```bash
# Application logs
find backend/logs -name "*.log" -mtime +7 -delete
find logs -name "*.log" -mtime +7 -delete

# System logs (requires sudo)
sudo journalctl --vacuum-time=7d
sudo find /var/log -name "*.log" -mtime +30 -delete
```

### Clean Python cache:

```bash
find . -type d -name "__pycache__" -exec rm -r {} +
find . -name "*.pyc" -delete
```

## Prevention

### Set up log rotation:

Copy the provided logrotate config:

```bash
sudo cp logrotate-cloudtribe.conf /etc/logrotate.d/cloudtribe
```

Or create `/etc/logrotate.d/cloudtribe` manually:

```
/home/ubuntu/cloudtribe_2.0/backend/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 ubuntu ubuntu
}

/home/ubuntu/cloudtribe_2.0/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 ubuntu ubuntu
}
```

### Monitor disk usage:

Add to cron for daily monitoring:

```bash
# Add to crontab: crontab -e
0 9 * * * df -h / | mail -s "Daily Disk Usage" your-email@example.com
```

### Regular cleanup:

Run cleanup script weekly:

```bash
# Add to crontab
0 2 * * 0 /home/ubuntu/cloudtribe_2.0/cleanup-disk-space.sh >> /var/log/cloudtribe-cleanup.log 2>&1
```

## Important Notes

1. **Don't delete `venv`** - This is the active virtual environment used in production
2. **Review Archive/ before deleting** - May contain important backups
3. **Keep recent logs** - Script keeps last 7 days for debugging
4. **System logs require sudo** - Some cleanup operations need elevated privileges

## After Cleanup

1. **Restart services** (if needed):
   ```bash
   pm2 restart ecosystem.config.js
   ```

2. **Verify everything works**:
   ```bash
   pm2 status
   curl http://127.0.0.1:8001/health
   curl http://127.0.0.1:3000/
   ```

3. **Monitor disk usage**:
   ```bash
   df -h /
   ```

## If Still Low on Space

Consider:
1. **Increasing disk size** (if using cloud instance)
2. **Moving logs to external storage**
3. **Archiving old data** to S3 or other storage
4. **Removing unused Docker images/containers** (if using Docker)
5. **Cleaning package manager caches**:
   ```bash
   sudo apt-get clean
   sudo apt-get autoremove
   ```

