#!/usr/bin/env python3
"""
Script to create a test driver account with phone number 0987654321
Run this script to create a test driver for testing transfer order functionality.
"""

import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Database connection parameters
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'cloudtribe')
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'postgres')

TEST_PHONE = '0987654321'
TEST_NAME = '測試司機'

def create_test_driver():
    """Create a test driver account"""
    try:
        # Connect to database
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        # Check if user already exists
        cur.execute("SELECT id FROM users WHERE phone = %s", (TEST_PHONE,))
        user_result = cur.fetchone()
        
        if user_result:
            test_user_id = user_result[0]
            print(f"✓ User with phone {TEST_PHONE} already exists (ID: {test_user_id})")
            # Update to ensure is_driver is True
            cur.execute("UPDATE users SET is_driver = TRUE WHERE id = %s", (test_user_id,))
            print(f"✓ Updated user to be a driver")
        else:
            # Create new user
            cur.execute(
                "INSERT INTO users (name, phone, location, is_driver) VALUES (%s, %s, %s, %s) RETURNING id",
                (TEST_NAME, TEST_PHONE, '未選擇', True)
            )
            test_user_id = cur.fetchone()[0]
            print(f"✓ Created new user with ID: {test_user_id}")
        
        # Check if driver already exists
        cur.execute("SELECT id FROM drivers WHERE user_id = %s", (test_user_id,))
        driver_result = cur.fetchone()
        
        if driver_result:
            test_driver_id = driver_result[0]
            print(f"✓ Driver already exists with ID: {test_driver_id}")
        else:
            # Check if driver with phone already exists (orphaned)
            cur.execute("SELECT id FROM drivers WHERE driver_phone = %s", (TEST_PHONE,))
            existing_driver = cur.fetchone()
            
            if existing_driver:
                test_driver_id = existing_driver[0]
                # Update to link with user
                cur.execute(
                    "UPDATE drivers SET user_id = %s, driver_name = %s WHERE id = %s",
                    (test_user_id, TEST_NAME, test_driver_id)
                )
                print(f"✓ Updated existing driver record (ID: {test_driver_id}) to link with user")
            else:
                # Create new driver
                cur.execute(
                    "INSERT INTO drivers (user_id, driver_name, driver_phone) VALUES (%s, %s, %s) RETURNING id",
                    (test_user_id, TEST_NAME, TEST_PHONE)
                )
                test_driver_id = cur.fetchone()[0]
                print(f"✓ Created new driver with ID: {test_driver_id}")
        
        print("\n" + "=" * 50)
        print("✓ Test driver account created successfully!")
        print("=" * 50)
        print(f"Phone Number: {TEST_PHONE}")
        print(f"Name: {TEST_NAME}")
        print(f"User ID: {test_user_id}")
        print(f"Driver ID: {test_driver_id}")
        print("\nYou can now use this account to test transfer order functionality.")
        print("Login with phone number: 0987654321")
        
        cur.close()
        conn.close()
        
    except psycopg2.OperationalError as e:
        print(f"❌ Database connection error: {e}")
        print("\nPlease check your database credentials:")
        print(f"  DB_HOST={DB_HOST}")
        print(f"  DB_PORT={DB_PORT}")
        print(f"  DB_NAME={DB_NAME}")
        print(f"  DB_USER={DB_USER}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error creating test driver: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("=" * 50)
    print("Creating Test Driver Account")
    print("=" * 50)
    create_test_driver()

