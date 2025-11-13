#!/bin/bash

echo "🚀 Quick Setup - CloudTribe Stability Fixes"
echo "============================================"
echo ""

cd ~/cloudtribe_2.0 || cd /home/ubuntu/cloudtribe_2.0 || {
    echo "❌ Could not find cloudtribe_2.0 directory"
    exit 1
}

echo "Step 1: Restarting backend with new fixes..."
pm2 restart fastapi-app
sleep 5

echo ""
echo "Step 2: Testing backend health..."
HEALTH=$(curl -s -m 5 http://127.0.0.1:8001/health 2>&1)
if echo "$HEALTH" | grep -q "healthy\|status"; then
    echo "   ✅ Backend is healthy"
else
    echo "   ⚠️  Backend health check: $HEALTH"
fi

echo ""
echo "Step 3: Fixing frontend port conflict..."
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
sleep 1
pm2 restart frontend
sleep 3

echo ""
echo "Step 4: Setting up auto-monitoring..."
chmod +x monitor-and-auto-fix.sh
# Kill existing monitor if running
pkill -f monitor-and-auto-fix.sh 2>/dev/null || true
sleep 1
nohup ./monitor-and-auto-fix.sh > monitor.log 2>&1 &
sleep 2

if ps aux | grep -q "[m]onitor-and-auto-fix"; then
    echo "   ✅ Auto-monitor started"
else
    echo "   ⚠️  Auto-monitor may not have started"
fi

echo ""
echo "Step 5: Saving PM2 configuration..."
pm2 save

echo ""
echo "Step 6: Final status check..."
pm2 status

echo ""
echo "============================================"
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "  1. Test login: https://cloudtribe.site/login"
echo "  2. Check monitor: tail -f monitor.log"
echo "  3. Check PM2: pm2 status"
echo ""
echo "If login still doesn't work:"
echo "  - Check logs: pm2 logs fastapi-app --lines 50"
echo "  - Test backend: curl http://127.0.0.1:8001/health"
echo "  - Run: sudo ./fix-nginx-timeout.sh"

