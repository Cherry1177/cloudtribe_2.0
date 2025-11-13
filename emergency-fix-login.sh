#!/bin/bash

echo "🚨 EMERGENCY FIX: Login 504 Timeout"
echo "===================================="
echo ""

# Step 1: Check backend is actually responding
echo "1. Testing backend health..."
HEALTH_RESPONSE=$(curl -s -m 5 http://127.0.0.1:8001/health 2>&1)
if echo "$HEALTH_RESPONSE" | grep -q "healthy\|status"; then
    echo "   ✅ Backend health check OK"
else
    echo "   ❌ Backend NOT responding!"
    echo "   Response: $HEALTH_RESPONSE"
    echo ""
    echo "   Restarting backend..."
    pm2 restart fastapi-app
    sleep 3
fi

# Step 2: Test login endpoint directly
echo ""
echo "2. Testing login endpoint directly..."
LOGIN_RESPONSE=$(curl -s -m 10 -X POST http://127.0.0.1:8001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"0966026265"}' 2>&1)

if echo "$LOGIN_RESPONSE" | grep -q "id\|name\|phone"; then
    echo "   ✅ Login endpoint working!"
    echo "   Response: $LOGIN_RESPONSE"
elif echo "$LOGIN_RESPONSE" | grep -q "404\|not found"; then
    echo "   ⚠️  User not found (this is OK - endpoint is working)"
elif echo "$LOGIN_RESPONSE" | grep -q "timeout\|Connection refused"; then
    echo "   ❌ Backend not responding to login requests"
    echo "   Restarting backend..."
    pm2 restart fastapi-app
    sleep 3
else
    echo "   ⚠️  Unexpected response: $LOGIN_RESPONSE"
fi

# Step 3: Check database connection
echo ""
echo "3. Testing database connection..."
if [ -n "$DATABASE_URL" ]; then
    DB_TEST=$(timeout 5 psql "$DATABASE_URL" -c "SELECT 1;" 2>&1)
    if echo "$DB_TEST" | grep -q "1"; then
        echo "   ✅ Database connection OK"
    else
        echo "   ❌ Database connection FAILED!"
        echo "   Error: $DB_TEST"
    fi
else
    echo "   ⚠️  DATABASE_URL not set"
fi

# Step 4: Check Nginx timeout settings
echo ""
echo "4. Checking Nginx timeout settings..."
NGINX_CONFIG="/etc/nginx/sites-enabled/app"
if [ -f "$NGINX_CONFIG" ]; then
    if grep -q "proxy_read_timeout" "$NGINX_CONFIG"; then
        TIMEOUT=$(grep "proxy_read_timeout" "$NGINX_CONFIG" | awk '{print $2}')
        echo "   Current timeout: $TIMEOUT"
        if echo "$TIMEOUT" | grep -qE "30s|10s|5s"; then
            echo "   ⚠️  Timeout might be too short, updating..."
            sudo sed -i 's/proxy_read_timeout.*/proxy_read_timeout 60s;/' "$NGINX_CONFIG"
            sudo sed -i 's/proxy_connect_timeout.*/proxy_connect_timeout 10s;/' "$NGINX_CONFIG"
            sudo nginx -t && sudo systemctl reload nginx
            echo "   ✅ Nginx timeout updated to 60s"
        fi
    else
        echo "   ⚠️  No timeout settings found, adding them..."
        sudo sed -i '/location \/api\/ {/a\    proxy_read_timeout 60s;\n    proxy_connect_timeout 10s;' "$NGINX_CONFIG"
        sudo nginx -t && sudo systemctl reload nginx
        echo "   ✅ Added timeout settings"
    fi
else
    echo "   ⚠️  Nginx config not found at $NGINX_CONFIG"
fi

# Step 5: Check backend logs for errors
echo ""
echo "5. Recent backend errors (last 10 lines)..."
pm2 logs fastapi-app --err --lines 10 --nostream | tail -10

# Step 6: Restart everything
echo ""
echo "6. Restarting services..."
pm2 restart fastapi-app
sleep 2
sudo systemctl reload nginx 2>/dev/null

echo ""
echo "===================================="
echo "✅ Emergency fix complete!"
echo ""
echo "Try logging in again. If it still fails:"
echo "  1. Check backend logs: pm2 logs fastapi-app --lines 50"
echo "  2. Check Nginx logs: sudo tail -20 /var/log/nginx/error.log"
echo "  3. Test directly: curl -X POST http://127.0.0.1:8001/api/users/login -H 'Content-Type: application/json' -d '{\"phone\":\"0966026265\"}'"

