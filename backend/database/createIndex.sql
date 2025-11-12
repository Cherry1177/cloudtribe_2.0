-- create_indexes.sql

-- ====================================
-- Indexes for users table
-- ====================================
CREATE INDEX IF NOT EXISTS idx_users_location ON users (location);

-- ====================================
-- Indexes for drivers table
-- ====================================
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers (user_id);


-- ====================================
-- Indexes for driver_time table
-- ====================================
CREATE INDEX IF NOT EXISTS idx_driver_time_driver_id ON driver_time (driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_time_date ON driver_time (date);

-- ====================================
-- Indexes for orders table
-- ====================================
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders (buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders (order_status);
CREATE INDEX IF NOT EXISTS idx_orders_timestamp ON orders (timestamp);
CREATE INDEX IF NOT EXISTS idx_orders_status_timestamp ON orders (order_status, timestamp);

-- ====================================
-- Indexes for order_items table
-- ====================================
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_category ON order_items (category);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id_category ON order_items (order_id, category);

-- ====================================
-- Indexes for driver_orders table
-- ====================================
CREATE INDEX IF NOT EXISTS idx_driver_orders_driver_id ON driver_orders (driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_orders_order_id ON driver_orders (order_id);
CREATE INDEX IF NOT EXISTS idx_driver_orders_timestamp ON driver_orders (timestamp);
CREATE INDEX IF NOT EXISTS idx_driver_orders_driver_order ON driver_orders (driver_id, order_id);

-- ====================================
-- Indexes for agricultural_product_order table
-- ====================================
CREATE INDEX IF NOT EXISTS idx_agri_order_status ON agricultural_product_order (status);
CREATE INDEX IF NOT EXISTS idx_agri_order_timestamp ON agricultural_product_order (timestamp);
CREATE INDEX IF NOT EXISTS idx_agri_order_status_timestamp ON agricultural_product_order (status, timestamp);


