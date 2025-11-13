#!/bin/bash

# Auto-monitoring and recovery script for CloudTribe
# Run this with: nohup ./monitor-and-auto-fix.sh > monitor.log 2>&1 &

echo "🔍 Starting CloudTribe Auto-Monitor..."
echo "======================================="

CHECK_INTERVAL=30  # Check every 30 seconds
HEALTH_TIMEOUT=5   # Health check timeout in seconds
MAX_FAILURES=3     # Restart after 3 consecutive failures

failure_count=0

while true; do
    # Check backend health
    HEALTH_RESPONSE=$(curl -s -m $HEALTH_TIMEOUT http://127.0.0.1:8001/health 2>&1)
    HEALTH_STATUS=$?
    
    if [ $HEALTH_STATUS -ne 0 ] || ! echo "$HEALTH_RESPONSE" | grep -q "healthy\|status"; then
        failure_count=$((failure_count + 1))
        echo "[$(date)] ❌ Health check failed (count: $failure_count/$MAX_FAILURES)"
        echo "   Response: $HEALTH_RESPONSE"
        
        if [ $failure_count -ge $MAX_FAILURES ]; then
            echo "[$(date)] 🔄 Restarting backend after $MAX_FAILURES failures..."
            
            # Restart backend
            pm2 restart fastapi-app
            
            # Wait for startup
            sleep 10
            
            # Test again
            TEST_RESPONSE=$(curl -s -m $HEALTH_TIMEOUT http://127.0.0.1:8001/health 2>&1)
            if echo "$TEST_RESPONSE" | grep -q "healthy\|status"; then
                echo "[$(date)] ✅ Backend recovered!"
                failure_count=0
            else
                echo "[$(date)] ⚠️  Backend still not responding after restart"
                failure_count=0  # Reset to prevent infinite restart loop
            fi
        fi
    else
        if [ $failure_count -gt 0 ]; then
            echo "[$(date)] ✅ Health check passed (recovered)"
        fi
        failure_count=0
    fi
    
    # Check frontend (port 3000)
    if ! lsof -i :3000 > /dev/null 2>&1; then
        FRONTEND_STATUS=$(pm2 jlist | grep -o '"name":"frontend"[^}]*"status":"[^"]*"' | grep -o '"status":"[^"]*"')
        if echo "$FRONTEND_STATUS" | grep -q "errored\|stopped"; then
            echo "[$(date)] 🔄 Restarting frontend..."
            pm2 restart frontend
            sleep 5
        fi
    fi
    
    sleep $CHECK_INTERVAL
done

