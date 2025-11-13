#!/bin/bash
# Performance and Sleep/Idle Issue Diagnostic Script

echo "🔍 Checking for Performance & Sleep Issues"
echo "==========================================="
echo ""

echo "1️⃣  Check PM2 Process Status:"
echo "------------------------------"
pm2 status
pm2 monit --no-interaction &
MONIT_PID=$!
sleep 3
kill $MONIT_PID 2>/dev/null
echo ""

echo "2️⃣  Check Server Response Times:"
echo "----------------------------------"
echo "Testing frontend (port 3000):"
time curl -s -o /dev/null -w "Response time: %{time_total}s\n" http://127.0.0.1:3000/ || echo "❌ Frontend not responding"
echo ""

echo "Testing backend (port 8001):"
time curl -s -o /dev/null -w "Response time: %{time_total}s\n" http://127.0.0.1:8001/health || echo "❌ Backend not responding"
echo ""

echo "3️⃣  Check Database Connection Pool:"
echo "-------------------------------------"
echo "Active database connections:"
psql $DATABASE_URL -c "SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active';" 2>/dev/null || echo "Cannot check database"
echo ""

echo "4️⃣  Check System Resources:"
echo "----------------------------"
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | head -1
echo ""
echo "Memory Usage:"
free -h | grep -E "Mem|Swap"
echo ""
echo "Disk Usage:"
df -h / | tail -1
echo ""

echo "5️⃣  Check for Idle/Sleep Issues:"
echo "---------------------------------"
echo "Process uptime:"
pm2 describe frontend | grep "uptime" || echo "Frontend not running"
pm2 describe fastapi-app | grep "uptime" || echo "Backend not running"
echo ""

echo "6️⃣  Check Network Connections:"
echo "-------------------------------"
echo "Active connections to port 3000:"
sudo netstat -an | grep :3000 | grep ESTABLISHED | wc -l
echo "Active connections to port 8001:"
sudo netstat -an | grep :8001 | grep ESTABLISHED | wc -l
echo ""

echo "7️⃣  Check for Cold Start:"
echo "-------------------------"
echo "First request (cold start test):"
time curl -s http://127.0.0.1:3000/ >/dev/null
echo ""
echo "Second request (should be faster):"
time curl -s http://127.0.0.1:3000/ >/dev/null
echo ""

echo "8️⃣  Check PM2 Logs for Errors:"
echo "-------------------------------"
echo "Recent frontend errors:"
pm2 logs frontend --lines 5 --nostream --err || echo "No errors"
echo ""
echo "Recent backend errors:"
pm2 logs fastapi-app --lines 5 --nostream --err || echo "No errors"
echo ""

echo "✅ Diagnostic complete!"
echo ""
echo "💡 Common Issues:"
echo "   - Cold start: First request after idle takes longer"
echo "   - Database connection pool exhausted: Too many connections"
echo "   - Memory issues: Server restarting frequently"
echo "   - Network latency: Slow database or API calls"




