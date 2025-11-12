#!/bin/bash
# Diagnostic script to find the root cause of server refresh issue

echo "🔍 Diagnosing Server Refresh Issue"
echo "==================================="
echo ""

echo "1️⃣  Checking PM2 Status:"
echo "------------------------"
pm2 status 2>/dev/null || echo "PM2 not running or not installed"
echo ""

if pm2 list | grep -q "frontend"; then
    echo "✅ PM2 frontend is running"
    echo ""
    echo "📋 PM2 Frontend Details:"
    pm2 describe frontend | grep -E "(script|args|status|mode)" || true
    echo ""
    
    # Check if it's using dev or production mode
    PM2_SCRIPT=$(pm2 describe frontend | grep "script path" | awk '{print $4}' || echo "")
    if echo "$PM2_SCRIPT" | grep -q "dev"; then
        echo "❌ PROBLEM FOUND: PM2 is running in DEV mode!"
        echo "   This causes lazy compilation and refresh issues"
    else
        echo "✅ PM2 is running in PRODUCTION mode (good)"
    fi
else
    echo "⚠️  PM2 frontend is NOT running"
fi
echo ""

echo "2️⃣  Checking Systemd Status:"
echo "----------------------------"
if systemctl is-active --quiet cloudtribe.service 2>/dev/null; then
    echo "✅ Systemd cloudtribe.service is ACTIVE"
    echo ""
    echo "📋 Service Details:"
    sudo systemctl status cloudtribe.service --no-pager -l | head -15
    echo ""
    
    # Check what command it's running
    SERVICE_CMD=$(systemctl show cloudtribe.service -p ExecStart --value 2>/dev/null || echo "")
    if echo "$SERVICE_CMD" | grep -q "dev"; then
        echo "❌ PROBLEM FOUND: Systemd is running in DEV mode!"
        echo "   This causes lazy compilation and refresh issues"
    else
        echo "✅ Systemd is configured for PRODUCTION mode"
    fi
else
    echo "ℹ️  Systemd cloudtribe.service is NOT active (this is fine if using PM2)"
fi
echo ""

echo "3️⃣  Checking What's Listening on Port 3000:"
echo "--------------------------------------------"
PORT_3000=$(sudo lsof -i :3000 2>/dev/null | grep LISTEN || netstat -tulpn 2>/dev/null | grep :3000 || echo "Nothing found")
if [ -n "$PORT_3000" ]; then
    echo "$PORT_3000"
    echo ""
    # Try to determine if it's dev or production
    if echo "$PORT_3000" | grep -q "node.*dev"; then
        echo "❌ Port 3000 is running in DEV mode!"
    else
        echo "✅ Port 3000 appears to be in production mode"
    fi
else
    echo "⚠️  Nothing is listening on port 3000"
fi
echo ""

echo "4️⃣  Summary & Recommendation:"
echo "-------------------------------"
if pm2 list | grep -q "frontend"; then
    echo "✅ You're using PM2 (recommended)"
    echo "   Check PM2 details above to see if it's in dev or production mode"
elif systemctl is-active --quiet cloudtribe.service 2>/dev/null; then
    echo "⚠️  You're using systemd"
    echo "   Check systemd details above"
else
    echo "❓ Unknown: Neither PM2 nor systemd appears to be running"
    echo "   Your app might be running manually or via another method"
fi
echo ""

echo "💡 Root Cause:"
echo "   The refresh issue happens when Next.js runs in DEV mode"
echo "   DEV mode = lazy compilation on first request = refresh delay"
echo "   PRODUCTION mode = pre-compiled = no refresh delay"
echo ""

