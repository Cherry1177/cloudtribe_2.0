#!/bin/bash

echo "🔧 Fixing Port 3000 Conflict..."
echo "================================="
echo ""

echo "1. Finding what's using port 3000..."
PID=$(lsof -ti :3000 2>/dev/null)

if [ -z "$PID" ]; then
    # Try alternative method
    PID=$(fuser 3000/tcp 2>/dev/null | awk '{print $1}')
fi

if [ -z "$PID" ]; then
    # Try netstat/ss
    PID=$(netstat -tulpn 2>/dev/null | grep :3000 | awk '{print $7}' | cut -d'/' -f1 | head -1)
fi

if [ -n "$PID" ]; then
    echo "   Found process using port 3000: PID $PID"
    echo "   Process details:"
    ps -p $PID -o pid,user,cmd 2>/dev/null || echo "   (Process details not available)"
    echo ""
    echo "2. Killing process $PID..."
    kill -9 $PID 2>/dev/null
    sleep 1
    
    # Verify it's dead
    if kill -0 $PID 2>/dev/null; then
        echo "   ⚠️  Process still running, trying harder..."
        killall -9 node 2>/dev/null
        sleep 1
    else
        echo "   ✅ Process killed"
    fi
else
    echo "   ⚠️  Could not find process using port 3000"
    echo "   Port might be in TIME_WAIT state, trying to kill all node processes..."
    killall -9 node 2>/dev/null
    sleep 2
fi

echo ""
echo "3. Verifying port 3000 is free..."
if lsof -ti :3000 > /dev/null 2>&1; then
    echo "   ⚠️  Port 3000 is still in use"
    echo "   Trying to kill all node processes..."
    killall -9 node 2>/dev/null
    pkill -9 -f "next-server" 2>/dev/null
    pkill -9 -f "next start" 2>/dev/null
    sleep 2
else
    echo "   ✅ Port 3000 is now free"
fi

echo ""
echo "4. Stopping PM2 frontend process..."
pm2 stop frontend 2>/dev/null
pm2 delete frontend 2>/dev/null
sleep 1

echo ""
echo "5. Restarting frontend with PM2..."
cd ~/cloudtribe_2.0 || cd /home/ubuntu/cloudtribe_2.0
if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js --only frontend
else
    cd client
    pm2 start npm --name frontend -- run start
fi

echo ""
echo "6. Waiting 3 seconds and checking status..."
sleep 3
pm2 status frontend

echo ""
echo "================================="
echo "✅ Done!"
echo ""
echo "If frontend still shows errors, check:"
echo "  pm2 logs frontend --lines 20"

