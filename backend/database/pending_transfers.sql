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

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_pending_transfers_new_driver ON pending_transfers(new_driver_id, status);
CREATE INDEX IF NOT EXISTS idx_pending_transfers_order ON pending_transfers(order_id);

