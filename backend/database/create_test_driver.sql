-- Script to create a test driver account with phone number 0987654321
-- Run this script in your PostgreSQL database

-- First, check if user already exists, if not create it
DO $$
DECLARE
    test_user_id INT;
    test_driver_id INT;
BEGIN
    -- Check if user with phone 0987654321 already exists
    SELECT id INTO test_user_id FROM users WHERE phone = '0987654321';
    
    IF test_user_id IS NULL THEN
        -- Create new user
        INSERT INTO users (name, phone, location, is_driver)
        VALUES ('測試司機', '0987654321', '未選擇', TRUE)
        RETURNING id INTO test_user_id;
        
        RAISE NOTICE 'Created new user with ID: %', test_user_id;
    ELSE
        -- Update existing user to be a driver
        UPDATE users SET is_driver = TRUE WHERE id = test_user_id;
        RAISE NOTICE 'Updated existing user with ID: %', test_user_id;
    END IF;
    
    -- Check if driver already exists for this user
    SELECT id INTO test_driver_id FROM drivers WHERE user_id = test_user_id;
    
    IF test_driver_id IS NULL THEN
        -- Check if driver with phone already exists
        SELECT id INTO test_driver_id FROM drivers WHERE driver_phone = '0987654321';
        
        IF test_driver_id IS NULL THEN
            -- Create new driver
            INSERT INTO drivers (user_id, driver_name, driver_phone)
            VALUES (test_user_id, '測試司機', '0987654321')
            RETURNING id INTO test_driver_id;
            
            RAISE NOTICE 'Created new driver with ID: %', test_driver_id;
        ELSE
            -- Update existing driver to link with user
            UPDATE drivers SET user_id = test_user_id, driver_name = '測試司機' WHERE id = test_driver_id;
            RAISE NOTICE 'Updated existing driver with ID: %', test_driver_id;
        END IF;
    ELSE
        RAISE NOTICE 'Driver already exists with ID: %', test_driver_id;
    END IF;
    
    RAISE NOTICE 'Test driver account created successfully!';
    RAISE NOTICE 'User ID: %, Driver ID: %, Phone: 0987654321', test_user_id, test_driver_id;
END $$;

