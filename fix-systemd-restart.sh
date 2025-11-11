#!/bin/bash

# Quick fix script to enable auto-restart for cloudtribe.service
# This ensures the service restarts automatically on failure and on boot

echo "🔧 Fixing systemd service auto-restart configuration..."
echo ""

# Set default EC2 host if not provided
EC2_HOST=${EC2_HOST:-"13.55.79.119"}

echo "📡 Connecting to EC2 server: $EC2_HOST"
echo ""

# SSH into EC2 and fix systemd service
ssh -i ~/Desktop/cloudtribe-2.0/Cloudtribe2.pem ubuntu@$EC2_HOST << 'ENDSSH'
    echo "✅ Connected to EC2 server"
    echo ""
    
    # Navigate to project directory
    cd ~/cloudtribe-2.0 || cd /home/ubuntu/cloudtribe-2.0 || {
        echo "❌ Error: Could not find project directory"
        exit 1
    }
    
    echo "📂 Current directory: $(pwd)"
    echo ""
    
    # Pull latest changes to get the service file
    echo "📥 Pulling latest changes from git..."
    git fetch origin
    git pull origin main
    echo ""
    
    # Check if service file exists
    if [ ! -f cloudtribe.service ]; then
        echo "❌ Error: cloudtribe.service file not found in repository"
        exit 1
    fi
    
    # Copy service file to systemd directory
    echo "📋 Installing systemd service file..."
    sudo cp cloudtribe.service /etc/systemd/system/cloudtribe.service
    
    # Reload systemd to pick up changes
    echo "🔄 Reloading systemd daemon..."
    sudo systemctl daemon-reload
    
    # Enable service to start on boot
    echo "🚀 Enabling service to start on boot..."
    sudo systemctl enable cloudtribe.service
    
    # Restart the service to apply new configuration
    echo "🔄 Restarting service..."
    sudo systemctl restart cloudtribe.service
    
    # Wait a moment for service to start
    sleep 3
    
    # Show service status
    echo ""
    echo "📊 Service Status:"
    sudo systemctl status cloudtribe.service --no-pager -l
    
    echo ""
    echo "✅ Systemd service configured with auto-restart!"
    echo ""
    echo "The service will now:"
    echo "  ✓ Automatically restart on failure (Restart=always)"
    echo "  ✓ Wait 10 seconds before restarting (RestartSec=10)"
    echo "  ✓ Start automatically on system boot (enabled)"
    echo ""
ENDSSH

echo ""
echo "✅ Fix complete!"

