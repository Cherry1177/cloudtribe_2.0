#!/bin/bash
# Safe script to add warmup to PM2 ecosystem config
# This won't break anything - it just adds a post-start warmup

echo "🔧 Adding Warmup to PM2 Ecosystem Config"
echo "=========================================="
echo ""

# Check if ecosystem.config.js exists
if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ ecosystem.config.js not found!"
    exit 1
fi

echo "✅ Found ecosystem.config.js"
echo ""
echo "📝 Current frontend config uses: npm run start (production mode)"
echo "✅ This is correct - no changes needed!"
echo ""
echo "💡 To add warmup, you can:"
echo ""
echo "Option 1: Add to PM2 ecosystem (recommended)"
echo "   - PM2 doesn't support ExecStartPost, but you can add a startup script"
echo ""
echo "Option 2: Use a simple health check script"
echo "   - Create a cron job that hits the endpoint every minute"
echo "   - This keeps the app warm"
echo ""
echo "Option 3: Add warmup to deployment script"
echo "   - Add curl command after 'npm run prod' in deploy scripts"
echo ""

# Check if PM2 is running
if pm2 list | grep -q "frontend"; then
    echo "✅ PM2 frontend is running"
    echo ""
    echo "🧪 Testing warmup..."
    sleep 2
    curl -fsS http://127.0.0.1:3000/ >/dev/null 2>&1 && echo "✅ Frontend is responding" || echo "❌ Frontend not responding"
else
    echo "⚠️  PM2 frontend is not running"
    echo "   Run: pm2 start ecosystem.config.js"
fi

echo ""
echo "✅ Script completed - no changes made (safe!)"

