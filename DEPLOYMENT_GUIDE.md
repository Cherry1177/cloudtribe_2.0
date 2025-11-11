# CloudTribe Production Deployment Guide

## Quick Update (Manual Steps)

If you need to update the production server on Ubuntu EC2:

### Option 1: SSH and Deploy Manually

1. **SSH into your EC2 server:**
   ```bash
   ssh -i ~/.ssh/cloud.pem ubuntu@your-ec2-ip-or-domain
   ```

2. **Navigate to project directory:**
   ```bash
   cd ~/cloudtribe-2.0
   # or
   cd /home/ubuntu/cloudtribe-2.0
   ```

3. **Pull latest changes:**
   ```bash
   git pull origin main
   ```

4. **Update dependencies (if needed):**
   ```bash
   # Backend
   source venv/bin/activate
   pip install -r backend/requirements.txt
   
   # Frontend
   cd client
   npm install
   cd ..
   ```

5. **Stop PM2 processes:**
   ```bash
   pm2 stop all
   pm2 delete all
   ```

6. **Rebuild and restart:**
   ```bash
   npm run prod
   ```

7. **Check status:**
   ```bash
   pm2 status
   pm2 logs
   ```

### Option 2: Use Deployment Script

From your local machine:

```bash
# Set your EC2 host
export EC2_HOST=your-ec2-ip-or-domain

# Run deployment script
./deploy-to-production.sh
```

## What Gets Updated

- ✅ Latest code from `main` branch
- ✅ Frontend build (removes old `.next` folder)
- ✅ Backend dependencies
- ✅ Frontend dependencies
- ✅ PM2 processes restarted

## Current Latest Commit

The latest commit includes:
- **d11c12f** - Update .gitignore to exclude .pem files and remove Carrefour integration
- **40f3968** - adding order details for our drivers + remvoing careerfour options

This removes the "查看實際價格" button and all Carrefour-related code.

## Troubleshooting

### If deployment fails:

1. **Check PM2 logs:**
   ```bash
   pm2 logs
   ```

2. **Check if ports are in use:**
   ```bash
   sudo lsof -i :8001  # Backend
   sudo lsof -i :3000  # Frontend
   ```

3. **Check disk space:**
   ```bash
   df -h
   ```

4. **Check git status:**
   ```bash
   git status
   git log -5 --oneline
   ```

### If you need to rollback:

```bash
# Find previous commit
git log --oneline

# Checkout previous commit
git checkout <previous-commit-hash>

# Rebuild and restart
npm run prod
```

## Notes

- Always backup your `.env` files before deployment
- Make sure your EC2 instance has enough disk space
- The deployment script stops all PM2 processes before restarting
- Frontend build can take a few minutes

