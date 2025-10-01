#!/bin/bash

# CloudTribe Startup Script with History Management Scheduler
# This script starts both the FastAPI server and the cleanup scheduler

echo "🚀 Starting CloudTribe with History Management..."

# Activate virtual environment
source venv/bin/activate

# Start the scheduler in the background
echo "📅 Starting history cleanup scheduler..."
cd backend
python scheduler.py &
SCHEDULER_PID=$!
echo "Scheduler started with PID: $SCHEDULER_PID"

# Start the FastAPI server
echo "🌐 Starting FastAPI server..."
python main.py &
SERVER_PID=$!
echo "Server started with PID: $SERVER_PID"

# Function to handle cleanup on exit
cleanup() {
    echo "🛑 Shutting down services..."
    kill $SCHEDULER_PID 2>/dev/null
    kill $SERVER_PID 2>/dev/null
    echo "✅ Services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo "✅ CloudTribe is running!"
echo "📊 History cleanup scheduled for every Sunday at 2:00 AM"
echo "🌐 API Server: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for both processes
wait
