#!/bin/bash
# Script to check what's actually running your services

echo "🔍 Checking CloudTribe Service Status"
echo "======================================"
echo ""

echo "📊 PM2 Status:"
pm2 status
echo ""

echo "📊 Systemd Service Status:"
sudo systemctl status cloudtribe.service --no-pager -l | head -20
echo ""

echo "🌐 Checking what's listening on port 3000:"
sudo lsof -i :3000 || netstat -tulpn | grep 3000 || echo "Nothing found on port 3000"
echo ""

echo "🌐 Checking what's listening on port 8001:"
sudo lsof -i :8001 || netstat -tulpn | grep 8001 || echo "Nothing found on port 8001"
echo ""

echo "💡 Recommendation:"
echo "   - If PM2 is running: You're using production mode ✅"
echo "   - If systemd is running 'npm run dev': You're using dev mode ❌"
echo "   - Best practice: Use PM2 for production (ecosystem.config.js)"
echo ""

