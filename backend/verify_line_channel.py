#!/usr/bin/env python3
"""
Script to verify which LINE Channel ID matches the configured token and secret.
"""

import os
import sys
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

LINE_BOT_TOKEN = os.getenv('LINE_BOT_TOKEN')
LINE_BOT_SECRET = os.getenv('LINE_BOT_SECRET')

def verify_channel():
    """Verify the LINE channel configuration and try to get channel info."""
    print("=" * 60)
    print("LINE Channel Verification")
    print("=" * 60)
    
    if not LINE_BOT_TOKEN:
        print("❌ ERROR: LINE_BOT_TOKEN not found in .env file")
        return
    
    if not LINE_BOT_SECRET:
        print("❌ ERROR: LINE_BOT_SECRET not found in .env file")
        return
    
    print(f"✓ LINE_BOT_TOKEN found: {LINE_BOT_TOKEN[:20]}...{LINE_BOT_TOKEN[-10:]}")
    print(f"✓ LINE_BOT_SECRET found: {LINE_BOT_SECRET[:10]}...{LINE_BOT_SECRET[-10:]}")
    print()
    
    # Try to get channel info using LINE API
    try:
        import requests
        
        headers = {
            'Authorization': f'Bearer {LINE_BOT_TOKEN}'
        }
        
        # Get bot info endpoint
        response = requests.get('https://api.line.me/v2/bot/info', headers=headers)
        
        if response.status_code == 200:
            bot_info = response.json()
            channel_id = bot_info.get('userId') or bot_info.get('basicId') or 'N/A'
            display_name = bot_info.get('displayName', 'N/A')
            
            print("=" * 60)
            print("✓ Channel verification successful!")
            print("=" * 60)
            print(f"Channel ID: {channel_id}")
            print(f"Display Name: {display_name}")
            print()
            print("This is the Channel ID being used by your code.")
            print()
            print("To verify it matches your LINE Console:")
            print("1. Go to https://developers.line.biz/console/")
            print("2. Click on 'CloudTribe Bot' (the one with Messaging API)")
            print("3. Go to 'Basic settings' tab")
            print("4. Compare the Channel ID shown there with the one above")
            print("=" * 60)
        else:
            print(f"⚠️  API call failed with status {response.status_code}")
            print(f"Response: {response.text}")
            print()
            print("Note: This might mean the token is invalid or expired.")
            print("Please check:")
            print("1. LINE_BOT_TOKEN is correct")
            print("2. Token hasn't expired")
            print("3. Token is from the 'CloudTribe Bot' channel (Messaging API)")
            
    except ImportError:
        print("⚠️  'requests' library not installed.")
        print("Install it with: pip install requests")
        print()
        print("Alternatively, you can manually verify:")
        print("1. The Channel ID from LINE Console")
        print("2. The Channel Secret should match LINE_BOT_SECRET")
        print("3. The Channel Access Token should match LINE_BOT_TOKEN")
    except Exception as e:
        print(f"❌ Error verifying channel: {str(e)}")
        print()
        print("You can manually verify by:")
        print("1. Going to https://developers.line.biz/console/")
        print("2. Click on 'CloudTribe Bot' channel")
        print("3. In 'Basic settings' tab, check the Channel Secret")
        print("   - Should match: LINE_BOT_SECRET in .env")
        print("4. In 'Messaging API' tab, check the Channel Access Token")
        print("   - Should match: LINE_BOT_TOKEN in .env")

if __name__ == "__main__":
    verify_channel()

