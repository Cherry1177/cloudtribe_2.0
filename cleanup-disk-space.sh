#!/bin/bash
# Disk Space Cleanup Script for CloudTribe
# This script removes redundant virtual environments, old logs, and other unnecessary files

# Don't exit on error - we want to continue even if some operations fail
set +e

echo "🧹 CloudTribe Disk Space Cleanup"
echo "================================="
echo ""

# Get current disk usage
echo "📊 Current Disk Usage:"
df -h / | tail -1
echo ""

# Calculate space before cleanup
BEFORE=$(df / | tail -1 | awk '{print $3}')

echo "🔍 Analyzing what can be cleaned..."
echo ""

# 1. Remove redundant fastapi-env virtual environment
if [ -d "fastapi-env" ]; then
    echo "1️⃣  Removing redundant fastapi-env virtual environment..."
    SIZE=$(du -sh fastapi-env 2>/dev/null | cut -f1)
    echo "   Size: $SIZE"
    rm -rf fastapi-env
    echo "   ✅ Removed fastapi-env (only venv is used in production)"
    echo ""
else
    echo "1️⃣  fastapi-env not found (already removed or doesn't exist)"
    echo ""
fi

# 2. Clean up old log files
echo "2️⃣  Cleaning up old log files..."
if [ -d "backend/logs" ]; then
    # Keep last 7 days of logs, remove older ones
    find backend/logs -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
    echo "   ✅ Removed log files older than 7 days"
    
    # Compress remaining logs
    find backend/logs -name "*.log" -type f -size +10M -exec gzip {} \; 2>/dev/null || true
    echo "   ✅ Compressed large log files"
else
    echo "   ⚠️  backend/logs directory not found"
fi
echo ""

# 3. Clean up PM2 logs
echo "3️⃣  Cleaning up PM2 logs..."
if [ -d "logs" ]; then
    # Keep last 7 days, remove older
    find logs -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
    echo "   ✅ Removed PM2 log files older than 7 days"
    
    # Compress large logs
    find logs -name "*.log" -type f -size +10M -exec gzip {} \; 2>/dev/null || true
    echo "   ✅ Compressed large PM2 log files"
else
    echo "   ⚠️  logs directory not found"
fi
echo ""

# 4. Clean up system logs (requires sudo)
echo "3️⃣  Cleaning up system logs (requires sudo)..."
if [ -d "/var/log" ]; then
    # Clean journal logs (systemd)
    sudo journalctl --vacuum-time=7d 2>/dev/null || echo "   ⚠️  Could not clean journal logs (may need sudo)"
    
    # Remove old log files
    sudo find /var/log -name "*.log" -type f -mtime +30 -delete 2>/dev/null || true
    sudo find /var/log -name "*.gz" -type f -mtime +90 -delete 2>/dev/null || true
    echo "   ✅ Cleaned system logs (kept last 7-30 days)"
else
    echo "   ⚠️  /var/log directory not accessible"
fi
echo ""

# 5. Clean up Python cache files
echo "4️⃣  Cleaning up Python cache files..."
find . -type d -name "__pycache__" -exec rm -r {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true
find . -type f -name "*.pyo" -delete 2>/dev/null || true
echo "   ✅ Removed Python cache files"
echo ""

# 6. Clean up Node.js cache and build artifacts (if not needed)
echo "5️⃣  Checking Node.js build artifacts..."
if [ -d "client/.next" ] && [ -d "client/node_modules" ]; then
    # .next can be regenerated, but check if we're in production
    if [ "$NODE_ENV" != "production" ] || [ -z "$NODE_ENV" ]; then
        echo "   ℹ️  Skipping .next cleanup (may be needed for production)"
    else
        echo "   ℹ️  .next directory exists (needed for production, keeping)"
    fi
fi
echo ""

# 7. Clean up temporary files
echo "6️⃣  Cleaning up temporary files..."
# Remove common temp files
find . -name "*.tmp" -type f -delete 2>/dev/null || true
find . -name "*.temp" -type f -delete 2>/dev/null || true
find . -name ".DS_Store" -type f -delete 2>/dev/null || true
find . -name "Thumbs.db" -type f -delete 2>/dev/null || true
echo "   ✅ Removed temporary files"
echo ""

# 8. Clean up old backups (if any)
echo "7️⃣  Checking for old backup files..."
if [ -d "Archive" ]; then
    # Find old zip files (older than 30 days)
    OLD_BACKUPS=$(find Archive -name "*.zip" -type f -mtime +30 2>/dev/null | wc -l)
    if [ "$OLD_BACKUPS" -gt 0 ]; then
        echo "   Found $OLD_BACKUPS old backup files (>30 days)"
        echo "   ⚠️  Review Archive/ directory manually before deleting"
    else
        echo "   ✅ No old backup files found"
    fi
fi
echo ""

# Calculate space after cleanup
AFTER=$(df / | tail -1 | awk '{print $3}')

echo "📊 Disk Usage After Cleanup:"
df -h / | tail -1
echo ""

# Show summary
echo "✅ Cleanup Complete!"
echo ""
echo "💡 Recommendations:"
echo "   1. Monitor disk usage regularly: df -h"
echo "   2. Set up log rotation for application logs"
echo "   3. Consider moving old backups to external storage"
echo "   4. Review Archive/ directory for files that can be removed"
echo ""
echo "📝 To set up automatic log rotation, consider using logrotate:"
echo "   sudo nano /etc/logrotate.d/cloudtribe"
echo ""

