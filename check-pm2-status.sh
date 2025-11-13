#!/bin/bash

echo "📊 PM2 Status Check"
echo "==================="
echo ""

echo "1. Full PM2 Status:"
pm2 status
echo ""

echo "2. Detailed Frontend Status:"
pm2 describe frontend
echo ""

echo "3. Frontend Logs (last 30 lines):"
pm2 logs frontend --lines 30 --nostream
echo ""

echo "4. Frontend Error Logs:"
pm2 logs frontend --err --lines 20 --nostream
echo ""

echo "5. Checking if port 3000 is in use:"
if lsof -i :3000 > /dev/null 2>&1; then
    echo "   ✅ Port 3000 is in use:"
    lsof -i :3000
else
    echo "   ❌ Port 3000 is NOT in use"
fi
echo ""

echo "6. Checking frontend process:"
ps aux | grep -E "next|node.*3000" | grep -v grep || echo "   No frontend process found"
echo ""

echo "==================="
echo "Analysis:"
echo ""
echo "If frontend shows 'errored' or 'stopped':"
echo "  1. Check logs above for errors"
echo "  2. Try: pm2 restart frontend"
echo "  3. If port 3000 is in use, kill it first"
echo ""
echo "If frontend keeps restarting (high ↺ count):"
echo "  1. Check the error logs above"
echo "  2. Common causes:"
echo "     - Port already in use"
echo "     - Build errors"
echo "     - Missing dependencies"
echo "     - Memory issues"

