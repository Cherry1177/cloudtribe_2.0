#!/bin/bash

echo "🔧 Fixing Port 3000 Conflict..."
echo "=================================="
echo ""

# Find what's using port 3000
echo "1. Finding process using port 3000..."
PID=$(lsof -ti :3000 2>/dev/null || fuser 3000/tcp 2>/dev/null | awk '{print $1}')

if [ -z "$PID" ]; then
    echo "   No process found on port 3000"
    echo "   Trying alternative method..."
    PID=$(netstat -tulpn 2>/dev/null | grep :3000 | awk '{print $7}' | cut -d'/' -f1 | head -1)
fi

if [ -n "$PID" ]; then
    echo "   Found process: PID $PID"
    ps -p $PID -o pid,cmd 2>/dev/null || echo "   Process details not available"
    echo ""
    echo "2. Killing process $PID..."
    kill -9 $PID 2>/dev/null && echo "   ✅ Killed process $PID" || echo "   ⚠️  Could not kill process"
else
    echo "   ⚠️  Could not find process using port 3000"
    echo "   Port might be in TIME_WAIT state, waiting 2 seconds..."
    sleep 2
fi

echo ""
echo "3. Cleaning up PM2..."
pm2 delete all 2>/dev/null
pm2 kill 2>/dev/null
sleep 1

echo ""
echo "4. Verifying port 3000 is free..."
if lsof -ti :3000 > /dev/null 2>&1; then
    echo "   ⚠️  Port 3000 is still in use"
    echo "   Trying to kill all node processes on port 3000..."
    killall -9 node 2>/dev/null
    sleep 2
else
    echo "   ✅ Port 3000 is now free"
fi

echo ""
echo "5. Restarting PM2..."
cd ~/cloudtribe_2.0 || cd /home/ubuntu/cloudtribe_2.0 || cd /Users/cherry/Desktop/cloudtribe-2.0
pm2 start ecosystem.config.js
pm2 save

echo ""
echo "6. Checking PM2 status..."
pm2 status

echo ""
echo "=================================="
echo "✅ Done! Check PM2 status above."

