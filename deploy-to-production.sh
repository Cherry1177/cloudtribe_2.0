#!/bin/bash

# CloudTribe Production Deployment Script
# This script updates the production server on Ubuntu EC2

echo "🚀 CloudTribe Production Deployment"
echo "===================================="
echo ""

# Set default EC2 host if not provided
EC2_HOST=${EC2_HOST:-"13.55.79.119"}

echo "📡 Connecting to EC2 server: $EC2_HOST"
echo ""

# SSH into EC2 and run deployment commands
ssh -i ~/Desktop/cloudtribe-2.0/Cloudtribe2.pem ubuntu@$EC2_HOST << 'ENDSSH'
    echo "✅ Connected to EC2 server"
    echo ""
    
    # Navigate to project directory (adjust path if needed)
    cd ~/cloudtribe-2.0 || cd /home/ubuntu/cloudtribe-2.0 || {
        echo "❌ Error: Could not find project directory"
        echo "Please update the path in deploy-to-production.sh"
        exit 1
    }
    
    echo "📂 Current directory: $(pwd)"
    echo ""
    
    # Pull latest changes from git
    echo "📥 Pulling latest changes from git..."
    git fetch origin
    git pull origin main
    
    if [ $? -ne 0 ]; then
        echo "❌ Error: Failed to pull from git"
        exit 1
    fi
    
    echo "✅ Git pull successful"
    echo ""
    
    # Check current commit
    echo "📝 Current commit:"
    git log -1 --oneline
    echo ""
    
    # Update backend dependencies if needed
    echo "📦 Updating backend dependencies..."
    source venv/bin/activate
    pip install -r backend/requirements.txt --quiet
    echo "✅ Backend dependencies updated"
    echo ""
    
    # Update frontend dependencies if needed
    echo "📦 Updating frontend dependencies..."
    cd client
    npm install --silent
    echo "✅ Frontend dependencies updated"
    echo ""
    
    # Stop PM2 processes
    echo "🛑 Stopping PM2 processes..."
    pm2 stop all
    pm2 delete all
    echo "✅ PM2 processes stopped"
    echo ""
    
    # Go back to root directory
    cd ..
    
    # Configure systemd service with auto-restart
    echo "⚙️  Configuring systemd service with auto-restart..."
    if [ -f cloudtribe.service ]; then
        sudo cp cloudtribe.service /etc/systemd/system/cloudtribe.service
        sudo systemctl daemon-reload
        sudo systemctl enable cloudtribe.service
        echo "✅ Systemd service configured and enabled"
    else
        echo "⚠️  Warning: cloudtribe.service file not found, skipping systemd configuration"
    fi
    echo ""
    
    # Rebuild and restart production
    echo "🏗️  Building and starting production servers..."
    npm run prod
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Deployment successful!"
        echo ""
        
        # Restart systemd service to apply new configuration
        if [ -f /etc/systemd/system/cloudtribe.service ]; then
            echo "🔄 Restarting systemd service..."
            sudo systemctl restart cloudtribe.service
            sleep 2
            echo "📊 Systemd Service Status:"
            sudo systemctl status cloudtribe.service --no-pager -l
            echo ""
        fi
        
        echo "📊 PM2 Status:"
        pm2 status
        echo ""
        
        # Warm up the frontend to avoid cold-start delays
        echo "🔥 Warming up frontend (preventing cold-start)..."
        sleep 3
        curl -fsS http://127.0.0.1:3000/ >/dev/null 2>&1 && echo "✅ Frontend warmed up" || echo "⚠️  Frontend warmup failed (may still be starting)"
        echo ""
        
        # Warm up the backend health endpoint
        echo "🔥 Warming up backend..."
        curl -fsS http://127.0.0.1:8001/health >/dev/null 2>&1 && echo "✅ Backend warmed up" || echo "⚠️  Backend warmup failed (may still be starting)"
        echo ""
        
        echo "📋 PM2 Logs (last 20 lines):"
        pm2 logs --lines 20
    else
        echo "❌ Error: Deployment failed"
        exit 1
    fi
ENDSSH

echo ""
echo "✅ Deployment complete!"

