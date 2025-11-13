#!/bin/bash
# Fix Performance Lag and Sleep/Idle Issues

echo "🔧 Fixing Performance & Sleep Issues"
echo "======================================"
echo ""

# 1. Add uvicorn timeout/keepalive settings
echo "1️⃣  Updating uvicorn settings for better performance..."
# This will be done by modifying ecosystem.config.js

# 2. Add keepalive health check
echo "2️⃣  Setting up keepalive health check..."
cat > /tmp/keepalive-health.sh << 'EOF'
#!/bin/bash
# Keepalive script to prevent server from going idle
while true; do
    curl -fsS http://127.0.0.1:3000/ >/dev/null 2>&1 || true
    curl -fsS http://127.0.0.1:8001/health >/dev/null 2>&1 || true
    sleep 60  # Ping every 60 seconds
done
EOF

chmod +x /tmp/keepalive-health.sh
echo "✅ Keepalive script created"
echo ""

# 3. Check current PM2 status
echo "3️⃣  Current PM2 Status:"
pm2 status
echo ""

# 4. Restart with new settings
echo "4️⃣  Restarting services with optimized settings..."
echo "   (This will be done after updating ecosystem.config.js)"
echo ""

echo "✅ Performance fixes ready!"
echo ""
echo "📋 Next Steps:"
echo "   1. Review the updated ecosystem.config.js"
echo "   2. Run: pm2 restart ecosystem.config.js"
echo "   3. Optionally start keepalive: nohup /tmp/keepalive-health.sh &"




