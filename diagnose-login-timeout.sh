#!/bin/bash

echo "🔍 Diagnosing Login 504 Timeout Issue..."
echo "=========================================="
echo ""

echo "1. Checking PM2 Status..."
pm2 status
echo ""

echo "2. Checking if backend is listening on port 8001..."
if lsof -i :8001 > /dev/null 2>&1; then
    echo "✅ Port 8001 is in use"
    lsof -i :8001
else
    echo "❌ Port 8001 is NOT in use - backend is not running!"
fi
echo ""

echo "3. Testing backend health endpoint..."
curl -s -m 5 http://127.0.0.1:8001/health || echo "❌ Backend health check failed"
echo ""

echo "4. Testing backend login endpoint directly..."
curl -s -m 10 -X POST http://127.0.0.1:8001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"0906281900"}' || echo "❌ Direct backend login test failed"
echo ""

echo "5. Checking backend logs (last 20 lines)..."
pm2 logs fastapi-app --lines 20 --nostream | tail -20
echo ""

echo "6. Checking database connection..."
if [ -n "$DATABASE_URL" ]; then
    echo "DATABASE_URL is set"
    timeout 5 psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1 && echo "✅ Database connection OK" || echo "❌ Database connection failed"
else
    echo "⚠️  DATABASE_URL not set"
fi
echo ""

echo "7. Checking Nginx status..."
sudo systemctl status nginx --no-pager | head -5
echo ""

echo "8. Checking Nginx error logs (last 10 lines)..."
sudo tail -10 /var/log/nginx/error.log 2>/dev/null || echo "No error log found"
echo ""

echo "=========================================="
echo "Diagnosis complete!"

