#!/bin/bash

# Script to fix git pull conflicts on production server
# This will stash local changes, pull, and then drop the stash

EC2_HOST="13.55.79.119"
PEM_FILE="$HOME/Desktop/cloudtribe-2.0/Cloudtribe2.pem"

echo "🔧 Fixing Git Pull Conflict"
echo "=========================="
echo ""

ssh -i "$PEM_FILE" ubuntu@$EC2_HOST << 'ENDSSH'
    cd ~/cloudtribe_2.0 || cd ~/cloudtribe-2.0 || {
        echo "❌ Error: Could not find project directory"
        exit 1
    }
    
    echo "📂 Current directory: $(pwd)"
    echo ""
    
    # Check what changes exist
    echo "📋 Checking local changes..."
    git status
    echo ""
    
    # Stash local changes (including untracked files)
    echo "💾 Stashing local changes..."
    git stash push -u -m "Local changes before pull $(date)"
    echo "✅ Changes stashed"
    echo ""
    
    # Pull latest changes
    echo "📥 Pulling latest changes..."
    git pull origin main
    echo ""
    
    if [ $? -eq 0 ]; then
        echo "✅ Git pull successful!"
        echo ""
        
        # Drop the stash (we don't need the old local changes)
        echo "🗑️  Dropping stashed changes (using remote version)..."
        git stash drop
        echo "✅ Stash dropped"
        echo ""
        
        # Show current commit
        echo "📝 Current commit:"
        git log -1 --oneline
        echo ""
        
        echo "✅ Ready to deploy!"
    else
        echo "❌ Error: Git pull failed"
        echo "You may need to resolve conflicts manually"
        exit 1
    fi
ENDSSH

