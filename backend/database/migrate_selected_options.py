#!/usr/bin/env python3
"""
Script to add selected_options column to order_items table
Run this script to add the column for storing product customizations (ice level, sweetness, etc.)

Usage:
    # Local development (uses .env file):
    python3 backend/database/migrate_selected_options.py
    
    # Production/EC2 (uses DATABASE_URL environment variable or connection string):
    DATABASE_URL="postgresql://user:pass@host:port/db" python3 backend/database/migrate_selected_options.py
    
    # Or with direct connection string:
    python3 backend/database/migrate_selected_options.py "postgresql://user:pass@host:port/db"
"""

import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv

# Load environment variables (for local development)
load_dotenv(dotenv_path="backend/.env")

# Get DATABASE_URL from command line argument, environment variable, or .env file
if len(sys.argv) > 1:
    # Connection string provided as command line argument
    database_url = sys.argv[1]
elif os.getenv('DATABASE_URL'):
    # DATABASE_URL from environment variable (for EC2/production)
    database_url = os.getenv('DATABASE_URL')
else:
    # Try to get from .env file (local development)
    database_url = os.getenv('DATABASE_URL')
    
    # If DATABASE_URL is not set, try individual components
    if not database_url:
        DB_HOST = os.getenv('DB_HOST', 'localhost')
        DB_PORT = os.getenv('DB_PORT', '5432')
        DB_NAME = os.getenv('DB_NAME', 'cloudtribe')
        DB_USER = os.getenv('DB_USER', 'postgres')
        DB_PASSWORD = os.getenv('DB_PASSWORD', 'postgres')
        database_url = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

SQL = """
-- Add selectedOptions column to order_items table
-- This column stores JSON data for product customizations (ice level, sweetness, etc.)

ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS selected_options JSONB DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN order_items.selected_options IS 'Stores product customizations as JSON (e.g., {"ice": ["常溫"], "sweetness": ["半糖"]})';
"""

def run_migration():
    """Run the migration to add selected_options column"""
    try:
        # Connect to database
        print(f"Connecting to database...")
        conn = psycopg2.connect(database_url)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        # Check if column already exists
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='order_items' AND column_name='selected_options'
        """)
        
        if cur.fetchone():
            print("✅ Column 'selected_options' already exists in order_items table")
            print("   Migration not needed.")
        else:
            # Execute migration
            print("Adding selected_options column to order_items table...")
            cur.execute(SQL)
            print("✅ Migration completed successfully!")
            print("✅ selected_options column added to order_items table")
        
        cur.close()
        conn.close()
        
    except psycopg2.OperationalError as e:
        print(f"❌ Database connection error: {e}")
        print("\nPlease check your database credentials in backend/.env")
        print("Make sure DATABASE_URL is set correctly.")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    print("=" * 50)
    print("Migration: Add selected_options column to order_items")
    print("=" * 50)
    run_migration()
    print("=" * 50)

