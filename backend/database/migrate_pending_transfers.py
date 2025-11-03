#!/usr/bin/env python3
"""
Migration script to create pending_transfers table
Run this script to add the pending_transfers table to your database.
"""

import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Database connection parameters
# Update these if your database credentials are different
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'cloudtribe')
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'postgres')

SQL = """
-- pending_transfers table
-- Stores pending transfer requests that require new driver acceptance
CREATE TABLE IF NOT EXISTS pending_transfers (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    current_driver_id INT REFERENCES drivers(id) ON DELETE CASCADE,
    new_driver_id INT REFERENCES drivers(id) ON DELETE CASCADE,
    current_driver_name VARCHAR(255),
    current_driver_phone VARCHAR(20),
    service VARCHAR(20) NOT NULL, -- 農產品、生活用品、載人
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected, expired
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
    CONSTRAINT unique_pending_transfer UNIQUE(order_id, new_driver_id, status)
);

-- Index for faster queries on pending_transfers
CREATE INDEX IF NOT EXISTS idx_pending_transfers_new_driver ON pending_transfers(new_driver_id, status);
CREATE INDEX IF NOT EXISTS idx_pending_transfers_order ON pending_transfers(order_id);
"""

def run_migration():
    """Run the migration to create pending_transfers table"""
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
        
        # Execute migration
        print("Creating pending_transfers table...")
        cur.execute(SQL)
        print("✅ Migration completed successfully!")
        print("✅ pending_transfers table created with indexes")
        
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
        print(f"❌ Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("=" * 50)
    print("Pending Transfers Table Migration")
    print("=" * 50)
    run_migration()

