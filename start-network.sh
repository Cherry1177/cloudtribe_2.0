#!/bin/bash

# CloudTribe Network Development Server Startup Script
# This allows access from other devices on the same network

echo "🌐 Starting CloudTribe Network Servers..."

# Get network IP
NETWORK_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
echo "📍 Network IP: $NETWORK_IP"

# Function to cleanup on exit
cleanup() {
    echo "🛑 Stopping servers..."
    pkill -f "uvicorn\|node\|next" 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start backend in background - accessible from network
echo "📡 Starting FastAPI backend on $NETWORK_IP:8000..."
cd /Users/cherry/Desktop/cloudtribe-2.0
source venv/bin/activate
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend in background - accessible from network
echo "🎨 Starting Next.js frontend on $NETWORK_IP:3000..."
cd /Users/cherry/Desktop/cloudtribe-2.0/client
npm run dev -- --hostname 0.0.0.0 --port 3000 &
FRONTEND_PID=$!

# Wait for both processes
echo "✅ Both servers are starting..."
echo ""
echo "🌐 === ACCESS FROM ANY DEVICE ==="
echo "Frontend: http://$NETWORK_IP:3000"
echo "Backend:  http://$NETWORK_IP:8000"
echo "API Docs: http://$NETWORK_IP:8000/docs"
echo ""
echo "🏠 === LOCAL ACCESS ==="
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8000"
echo ""
echo "📱 Share these URLs with your friends!"
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID

