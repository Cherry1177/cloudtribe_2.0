#!/bin/bash

echo "🔧 Fixing Hung Backend..."
echo "=========================="
echo ""

echo "1. Checking current backend status..."
pm2 status fastapi-app
echo ""

echo "2. Checking backend logs for errors..."
pm2 logs fastapi-app --err --lines 20 --nostream | tail -20
echo ""

echo "3. Checking for hung database connections..."
# Check if there are many database connections
if [ -n "$DATABASE_URL" ]; then
    echo "   Checking database connection pool..."
    psql "$DATABASE_URL" -c "SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active';" 2>/dev/null || echo "   Could not check database"
fi
echo ""

echo "4. Force killing backend process..."
pm2 stop fastapi-app
pm2 delete fastapi-app
sleep 2

# Kill any remaining Python/uvicorn processes
pkill -9 -f "uvicorn" 2>/dev/null
pkill -9 -f "fastapi" 2>/dev/null
sleep 1

echo "5. Restarting backend..."
cd ~/cloudtribe_2.0 || cd /home/ubuntu/cloudtribe_2.0
pm2 start ecosystem.config.js --only fastapi-app
sleep 5

echo ""
echo "6. Testing backend health..."
for i in {1..3}; do
    echo "   Attempt $i..."
    RESPONSE=$(curl -s -m 5 http://127.0.0.1:8001/health 2>&1)
    if echo "$RESPONSE" | grep -q "healthy\|status"; then
        echo "   ✅ Backend is responding!"
        echo "   Response: $RESPONSE"
        break
    else
        echo "   ⚠️  Still not responding, waiting 2 more seconds..."
        sleep 2
    fi
done

echo ""
echo "7. Final status check..."
pm2 status fastapi-app
pm2 logs fastapi-app --lines 10 --nostream | tail -10

echo ""
echo "=========================="
echo "✅ Done!"
echo ""
echo "If backend still doesn't respond:"
echo "  1. Check database: psql \$DATABASE_URL -c 'SELECT 1;'"
echo "  2. Check logs: pm2 logs fastapi-app --lines 50"
echo "  3. Check system resources: free -h && df -h"

