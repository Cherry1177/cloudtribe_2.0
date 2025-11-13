-- MINIMAL Indexes - Only the critical ones for performance
-- These are the indexes actually needed based on query patterns

-- ====================================
-- CRITICAL: These are used in JOINs and frequent WHERE clauses
-- ====================================

-- order_items.order_id - CRITICAL for JOINs (fixes N+1 query problem)
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);

-- orders.order_status - CRITICAL (used in almost every orders query)
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders (order_status);

-- orders.timestamp - CRITICAL (used for sorting and filtering)
CREATE INDEX IF NOT EXISTS idx_orders_timestamp ON orders (timestamp);

-- orders.buyer_id - CRITICAL (used in buyer orders queries)
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders (buyer_id);

-- Composite index for common query pattern: WHERE order_status = X ORDER BY timestamp
CREATE INDEX IF NOT EXISTS idx_orders_status_timestamp ON orders (order_status, timestamp);

-- agricultural_product_order.status - CRITICAL (used frequently)
CREATE INDEX IF NOT EXISTS idx_agri_order_status ON agricultural_product_order (status);

-- agricultural_product_order.buyer_id - CRITICAL (used in buyer queries)
CREATE INDEX IF NOT EXISTS idx_agri_order_buyer_id ON agricultural_product_order (buyer_id);

-- ====================================
-- NOTE: users.phone already has UNIQUE constraint = automatic index
-- You don't need idx_users_phone - it's redundant!
-- ====================================

