"""
Automatic History Cleanup Scheduler
Runs cleanup tasks periodically to maintain database performance
"""
import asyncio
import schedule
import time
from datetime import datetime
import logging
from routers.history_management import cleanup_old_history

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/scheduler.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

async def run_cleanup_task():
    """Run the automatic cleanup task"""
    try:
        logger.info("Starting automatic history cleanup...")
        result = await cleanup_old_history()
        
        if result.get("success"):
            logger.info(f"Cleanup completed successfully: {result.get('message')}")
        else:
            logger.error(f"Cleanup failed: {result.get('error')}")
            
    except Exception as e:
        logger.error(f"Error during automatic cleanup: {str(e)}")

def schedule_cleanup_task():
    """Schedule the cleanup task to run weekly"""
    # Schedule cleanup every Sunday at 2:00 AM
    schedule.every().sunday.at("02:00").do(lambda: asyncio.create_task(run_cleanup_task()))
    logger.info("Scheduled automatic cleanup for every Sunday at 2:00 AM")

def run_scheduler():
    """Run the scheduler in a loop"""
    logger.info("Starting history cleanup scheduler...")
    schedule_cleanup_task()
    
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute

if __name__ == "__main__":
    run_scheduler()
