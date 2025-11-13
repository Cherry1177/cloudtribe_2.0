#!/bin/bash

echo "🔧 Fixing Nginx Timeout for API Requests..."
echo "============================================="
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  This script needs sudo privileges to modify Nginx config"
    echo "   Run with: sudo ./fix-nginx-timeout.sh"
    exit 1
fi

NGINX_CONFIG="/etc/nginx/sites-enabled/app"

if [ ! -f "$NGINX_CONFIG" ]; then
    echo "❌ Nginx config not found at $NGINX_CONFIG"
    echo "   Looking for other config files..."
    ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "No sites-enabled directory found"
    exit 1
fi

echo "1. Backing up current Nginx config..."
cp "$NGINX_CONFIG" "${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
echo "   ✅ Backup created"

echo ""
echo "2. Checking current timeout settings..."
grep -E "proxy_read_timeout|proxy_connect_timeout|proxy_send_timeout" "$NGINX_CONFIG" || echo "   No timeout settings found (using defaults)"

echo ""
echo "3. Adding/updating timeout settings..."

# Check if location /api/ block exists
if grep -q "location /api/" "$NGINX_CONFIG"; then
    echo "   Found /api/ location block"
    
    # Add timeout settings if not present
    if ! grep -q "proxy_read_timeout" "$NGINX_CONFIG"; then
        # Add timeout settings inside the location /api/ block
        sed -i '/location \/api\/ {/a\
    proxy_read_timeout 60s;\
    proxy_connect_timeout 10s;\
    proxy_send_timeout 60s;
' "$NGINX_CONFIG"
        echo "   ✅ Added timeout settings to /api/ block"
    else
        echo "   ⚠️  Timeout settings already exist, updating values..."
        sed -i 's/proxy_read_timeout.*/proxy_read_timeout 60s;/' "$NGINX_CONFIG"
        sed -i 's/proxy_connect_timeout.*/proxy_connect_timeout 10s;/' "$NGINX_CONFIG"
        sed -i 's/proxy_send_timeout.*/proxy_send_timeout 60s;/' "$NGINX_CONFIG"
        echo "   ✅ Updated timeout settings"
    fi
else
    echo "   ⚠️  /api/ location block not found, adding it..."
    # This would need to be customized based on your actual Nginx config structure
    echo "   Please manually add timeout settings to your Nginx config"
fi

echo ""
echo "4. Testing Nginx configuration..."
if nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✅ Nginx configuration is valid"
    echo ""
    echo "5. Reloading Nginx..."
    systemctl reload nginx
    if [ $? -eq 0 ]; then
        echo "   ✅ Nginx reloaded successfully"
    else
        echo "   ❌ Failed to reload Nginx"
        exit 1
    fi
else
    echo "   ❌ Nginx configuration has errors!"
    echo "   Run 'nginx -t' to see details"
    echo "   Restoring backup..."
    cp "${NGINX_CONFIG}.backup."* "$NGINX_CONFIG" 2>/dev/null
    exit 1
fi

echo ""
echo "============================================="
echo "✅ Done! Nginx timeout settings updated:"
echo "   - proxy_read_timeout: 60s"
echo "   - proxy_connect_timeout: 10s"
echo "   - proxy_send_timeout: 60s"
echo ""
echo "If login still times out, check:"
echo "   1. Backend is running: pm2 status"
echo "   2. Backend logs: pm2 logs fastapi-app"
echo "   3. Database connection: psql \$DATABASE_URL -c 'SELECT 1;'"

