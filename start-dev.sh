#!/bin/bash

# CloudTribe Development Server Startup Script
echo "🚀 Starting CloudTribe Development Servers..."

# Function to cleanup on exit
cleanup() {
    echo "🛑 Stopping servers..."
    pkill -f "uvicorn\|node\|next" 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start backend in background
echo "📡 Starting FastAPI backend on port 8000..."
cd /Users/cherry/Desktop/cloudtribe-2.0
source venv/bin/activate
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend in background
echo "🎨 Starting Next.js frontend on port 3000..."
cd /Users/cherry/Desktop/cloudtribe-2.0/client
npm run dev &
FRONTEND_PID=$!

# Wait for both processes
echo "✅ Both servers are starting..."
echo "🌐 Frontend: http://localhost:3000"
echo "📡 Backend: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
