#!/bin/bash

# Quick deployment script for CloudTribe production
# This script connects to EC2 and updates the production server

EC2_HOST="13.55.79.119"
PEM_FILE="$HOME/Desktop/cloudtribe-2.0/Cloudtribe2.pem"

echo "🚀 CloudTribe Production Deployment"
echo "===================================="
echo "📡 Connecting to EC2: $EC2_HOST"
echo ""

# Check if PEM file exists
if [ ! -f "$PEM_FILE" ]; then
    echo "❌ Error: PEM file not found at $PEM_FILE"
    echo "Please check the path to Cloudtribe2.pem"
    exit 1
fi

# SSH into EC2 and run deployment commands
ssh -i "$PEM_FILE" ubuntu@$EC2_HOST << 'ENDSSH'
    echo "✅ Connected to EC2 server"
    echo ""
    
    # Navigate to project directory (try common locations)
    if [ -d "$HOME/cloudtribe-2.0" ]; then
        cd "$HOME/cloudtribe-2.0"
    elif [ -d "/home/ubuntu/cloudtribe-2.0" ]; then
        cd /home/ubuntu/cloudtribe-2.0
    elif [ -d "/var/www/cloudtribe-2.0" ]; then
        cd /var/www/cloudtribe-2.0
    else
        echo "❌ Error: Could not find project directory"
        echo "Please navigate to your project directory manually"
        echo "Current directory: $(pwd)"
        echo "Available directories:"
        ls -la ~/
        exit 1
    fi
    
    echo "📂 Current directory: $(pwd)"
    echo ""
    
    # Check git status
    echo "📋 Checking git status..."
    git status
    echo ""
    
    # Pull latest changes from git
    echo "📥 Pulling latest changes from git..."
    git fetch origin
    git pull origin main
    
    if [ $? -ne 0 ]; then
        echo "❌ Error: Failed to pull from git"
        echo "Trying to continue anyway..."
    else
        echo "✅ Git pull successful"
    fi
    
    echo ""
    
    # Check current commit
    echo "📝 Current commit:"
    git log -1 --oneline
    echo ""
    
    # Update backend dependencies if needed
    echo "📦 Updating backend dependencies..."
    if [ -d "venv" ]; then
        source venv/bin/activate
        pip install -r backend/requirements.txt --quiet
        echo "✅ Backend dependencies updated"
    else
        echo "⚠️  Warning: venv not found, skipping backend dependencies"
    fi
    echo ""
    
    # Update frontend dependencies if needed
    echo "📦 Updating frontend dependencies..."
    if [ -d "client" ]; then
        cd client
        npm install --silent
        echo "✅ Frontend dependencies updated"
        cd ..
    else
        echo "⚠️  Warning: client directory not found"
    fi
    echo ""
    
    # Stop PM2 processes
    echo "🛑 Stopping PM2 processes..."
    pm2 stop all 2>/dev/null || echo "No PM2 processes to stop"
    pm2 delete all 2>/dev/null || echo "No PM2 processes to delete"
    echo "✅ PM2 processes stopped"
    echo ""
    
    # Rebuild and restart production
    echo "🏗️  Building and starting production servers..."
    npm run prod
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Deployment successful!"
        echo ""
        echo "📊 PM2 Status:"
        pm2 status
        echo ""
        echo "📋 Recent PM2 Logs:"
        pm2 logs --lines 10 --nostream
    else
        echo "❌ Error: Deployment failed"
        echo "Check the logs above for errors"
        exit 1
    fi
ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment complete!"
    echo ""
    echo "🌐 Your site should now be updated at:"
    echo "   http://13.55.79.119"
    echo "   or"
    echo "   https://www.cloudtrib.site (if configured)"
else
    echo ""
    echo "❌ Deployment failed. Please check the errors above."
fi

