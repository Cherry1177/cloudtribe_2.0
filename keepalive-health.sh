#!/bin/bash
# Keepalive Health Check Script
# Prevents server from going idle by periodically pinging health endpoints
# Run this in background: nohup ./keepalive-health.sh > /dev/null 2>&1 &

echo "🔄 Starting keepalive health check..."
echo "   This will ping the servers every 60 seconds to prevent idle/sleep"

INTERVAL=60  # Ping every 60 seconds
FRONTEND_URL="http://127.0.0.1:3000"
BACKEND_URL="http://127.0.0.1:8001/health"

while true; do
    # Ping frontend
    curl -fsS "$FRONTEND_URL" >/dev/null 2>&1 && echo "[$(date +'%Y-%m-%d %H:%M:%S')] ✅ Frontend alive" || echo "[$(date +'%Y-%m-%d %H:%M:%S')] ❌ Frontend not responding"
    
    # Ping backend
    curl -fsS "$BACKEND_URL" >/dev/null 2>&1 && echo "[$(date +'%Y-%m-%d %H:%M:%S')] ✅ Backend alive" || echo "[$(date +'%Y-%m-%d %H:%M:%S')] ❌ Backend not responding"
    
    sleep $INTERVAL
done




