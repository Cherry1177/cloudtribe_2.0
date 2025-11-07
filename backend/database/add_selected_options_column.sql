-- Add selectedOptions column to order_items table
-- This column stores JSON data for product customizations (ice level, sweetness, etc.)

ALTER TABLE order_items 
ADD COLUMN selected_options JSONB DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN order_items.selected_options IS 'Stores product customizations as JSON (e.g., {"ice": ["常溫"], "sweetness": ["半糖"]})';

