-- Migration: Add email column to users table
-- This migration adds the email column to the users table if it doesn't exist
-- Run this on your PostgreSQL database (RDS or local)

-- Add email column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE users ADD COLUMN email VARCHAR(255);
        RAISE NOTICE 'Email column added to users table';
    ELSE
        RAISE NOTICE 'Email column already exists in users table';
    END IF;
END $$;

