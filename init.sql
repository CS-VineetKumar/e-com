-- Initialize database with some sample data
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Insert sample categories
INSERT INTO categories (id, name, description, "createdAt", "updatedAt") VALUES
('cat_1', 'Electronics', 'Electronic devices and gadgets', NOW(), NOW()),
('cat_2', 'Clothing', 'Fashion and apparel', NOW(), NOW()),
('cat_3', 'Books', 'Books and literature', NOW(), NOW()),
('cat_4', 'Home & Garden', 'Home improvement and garden supplies', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample products
INSERT INTO products (id, name, description, price, stock, "categoryId", "createdAt", "updatedAt") VALUES
('prod_1', 'Laptop Pro', 'High-performance laptop for professionals', 1299.99, 50, 'cat_1', NOW(), NOW()),
('prod_2', 'Wireless Headphones', 'Noise-cancelling wireless headphones', 199.99, 100, 'cat_1', NOW(), NOW()),
('prod_3', 'Smartphone', 'Latest generation smartphone', 899.99, 75, 'cat_1', NOW(), NOW()),
('prod_4', 'Cotton T-Shirt', 'Comfortable cotton t-shirt', 29.99, 200, 'cat_2', NOW(), NOW()),
('prod_5', 'Programming Book', 'Learn modern programming techniques', 49.99, 30, 'cat_3', NOW(), NOW()),
('prod_6', 'Garden Tools Set', 'Complete set of garden tools', 79.99, 25, 'cat_4', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create a default admin user (password: admin123)
INSERT INTO users (id, email, password, "firstName", "lastName", role, "createdAt", "updatedAt") VALUES
('admin_1', 'admin@ecommerce.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2K', 'Admin', 'User', 'ADMIN', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Create a default customer user (password: customer123)
INSERT INTO users (id, email, password, "firstName", "lastName", role, "createdAt", "updatedAt") VALUES
('customer_1', 'customer@ecommerce.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2K', 'Customer', 'User', 'CUSTOMER', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;
