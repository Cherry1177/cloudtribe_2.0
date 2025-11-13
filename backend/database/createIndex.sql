-- create_indexes.sql
-- NOTE: Most indexes are OPTIONAL. Only create if you have performance issues.
-- For login: NO indexes needed - users.phone already has UNIQUE = automatic index

-- ====================================
-- CRITICAL Indexes (only if you have slow queries)
-- ====================================

-- order_items.order_id - CRITICAL for JOINs (prevents N+1 query problem)
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);

-- orders.order_status - CRITICAL (used in almost every orders query)
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders (order_status);

-- orders.timestamp - CRITICAL (used for sorting and filtering)
CREATE INDEX IF NOT EXISTS idx_orders_timestamp ON orders (timestamp);

-- orders.buyer_id - CRITICAL (used in buyer orders queries)
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders (buyer_id);

-- Composite index for common query: WHERE order_status = X ORDER BY timestamp
CREATE INDEX IF NOT EXISTS idx_orders_status_timestamp ON orders (order_status, timestamp);

-- agricultural_product_order.status - CRITICAL (used frequently)
CREATE INDEX IF NOT EXISTS idx_agri_order_status ON agricultural_product_order (status);

-- agricultural_product_order.buyer_id - CRITICAL (used in buyer queries)
CREATE INDEX IF NOT EXISTS idx_agri_order_buyer_id ON agricultural_product_order (buyer_id);

-- ====================================
-- OPTIONAL Indexes (only if you use these features heavily)
-- ====================================

-- Users table
-- NOTE: users.phone already has UNIQUE constraint = automatic index, DON'T create idx_users_phone
CREATE INDEX IF NOT EXISTS idx_users_location ON users (location); -- Only if filtering by location frequently

-- Drivers table
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers (user_id);

-- Driver time table (only if driver scheduling is heavily used)
CREATE INDEX IF NOT EXISTS idx_driver_time_driver_id ON driver_time (driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_time_date ON driver_time (date);

-- Order items (optional optimizations)
CREATE INDEX IF NOT EXISTS idx_order_items_category ON order_items (category);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id_category ON order_items (order_id, category);

-- Driver orders
CREATE INDEX IF NOT EXISTS idx_driver_orders_driver_id ON driver_orders (driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_orders_order_id ON driver_orders (order_id);
CREATE INDEX IF NOT EXISTS idx_driver_orders_timestamp ON driver_orders (timestamp);
CREATE INDEX IF NOT EXISTS idx_driver_orders_driver_order ON driver_orders (driver_id, order_id);

-- Agricultural product order (optional)
CREATE INDEX IF NOT EXISTS idx_agri_order_timestamp ON agricultural_product_order (timestamp);
CREATE INDEX IF NOT EXISTS idx_agri_order_status_timestamp ON agricultural_product_order (status, timestamp);
