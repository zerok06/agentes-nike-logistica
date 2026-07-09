-- ============================================================
-- BASE DE DATOS: Agentes Nike Logistica
-- Motor recomendado: PostgreSQL 14+
-- Descripcion: Tablas del sistema multi-tenant + tablas logisticas
-- ============================================================

DROP SCHEMA IF EXISTS nike_logistica CASCADE;
CREATE SCHEMA nike_logistica;
SET search_path TO nike_logistica;

-- Extensiones utiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. TABLAS DEL SISTEMA / PLATAFORMA
-- ============================================================

CREATE TABLE organizations (
    organization_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    ruc VARCHAR(20),
    industry VARCHAR(100),
    status VARCHAR(30) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(80) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE user_roles (
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    role_id INT REFERENCES roles(role_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE workspaces (
    workspace_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE conversations (
    conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    title VARCHAR(200),
    status VARCHAR(30) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    sender_type VARCHAR(30) NOT NULL CHECK (sender_type IN ('user','agent','system')),
    sender_name VARCHAR(100),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE artifacts (
    artifact_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(conversation_id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('table','chart','dashboard','document','kpi','diagram')),
    title VARCHAR(200) NOT NULL,
    content JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE data_sources (
    data_source_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    connection_info JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE semantic_mappings (
    mapping_id SERIAL PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    business_term VARCHAR(100) NOT NULL,
    physical_table VARCHAR(100) NOT NULL,
    physical_column VARCHAR(100),
    description TEXT
);

CREATE TABLE audit_logs (
    audit_id BIGSERIAL PRIMARY KEY,
    organization_id UUID REFERENCES organizations(organization_id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(150) NOT NULL,
    entity_name VARCHAR(100),
    entity_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. TABLAS DEL NEGOCIO: NIKE LOGISTICA
-- ============================================================

CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE products (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    category_id INT REFERENCES categories(category_id),
    sku VARCHAR(50) UNIQUE NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    model VARCHAR(100),
    size VARCHAR(20),
    color VARCHAR(50),
    unit_price NUMERIC(10,2) NOT NULL,
    status VARCHAR(30) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE warehouses (
    warehouse_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    warehouse_name VARCHAR(150) NOT NULL,
    city VARCHAR(80),
    address TEXT,
    capacity INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory (
    inventory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(warehouse_id) ON DELETE CASCADE,
    stock_qty INT NOT NULL DEFAULT 0,
    min_stock INT NOT NULL DEFAULT 10,
    max_stock INT DEFAULT 500,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, warehouse_id)
);

CREATE TABLE inventory_movements (
    movement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(product_id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(warehouse_id),
    movement_type VARCHAR(30) NOT NULL CHECK (movement_type IN ('entrada','salida','ajuste','transferencia')),
    quantity INT NOT NULL,
    reason TEXT,
    movement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE suppliers (
    supplier_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    supplier_name VARCHAR(150) NOT NULL,
    contact_email VARCHAR(150),
    phone VARCHAR(30),
    country VARCHAR(80)
);

CREATE TABLE purchase_orders (
    purchase_order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(supplier_id),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_date DATE,
    status VARCHAR(30) DEFAULT 'pending',
    total_amount NUMERIC(12,2) DEFAULT 0
);

CREATE TABLE purchase_order_items (
    purchase_order_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(purchase_order_id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(product_id),
    quantity INT NOT NULL,
    unit_cost NUMERIC(10,2) NOT NULL
);

CREATE TABLE customers (
    customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    customer_name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    city VARCHAR(80),
    address TEXT
);

CREATE TABLE sales_orders (
    sales_order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(customer_id),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(30) DEFAULT 'pending',
    total_amount NUMERIC(12,2) DEFAULT 0
);

CREATE TABLE sales_order_items (
    sales_order_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_order_id UUID NOT NULL REFERENCES sales_orders(sales_order_id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(product_id),
    quantity INT NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL
);

CREATE TABLE routes (
    route_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    origin_city VARCHAR(80) NOT NULL,
    destination_city VARCHAR(80) NOT NULL,
    estimated_hours NUMERIC(6,2),
    distance_km NUMERIC(8,2)
);

CREATE TABLE shipments (
    shipment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    sales_order_id UUID REFERENCES sales_orders(sales_order_id),
    warehouse_id UUID REFERENCES warehouses(warehouse_id),
    route_id UUID REFERENCES routes(route_id),
    shipment_date DATE DEFAULT CURRENT_DATE,
    delivery_date DATE,
    status VARCHAR(30) DEFAULT 'preparacion',
    carrier VARCHAR(100),
    tracking_code VARCHAR(100)
);

-- ============================================================
-- 3. INDICES
-- ============================================================

CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_products_org ON products(organization_id);
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_warehouse ON inventory(warehouse_id);
CREATE INDEX idx_sales_orders_org ON sales_orders(organization_id);
CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);

-- ============================================================
-- 4. DATOS DE PRUEBA
-- ============================================================

INSERT INTO organizations (organization_id, name, ruc, industry)
VALUES ('11111111-1111-1111-1111-111111111111', 'Nike Peru Logistica', '20555555555', 'Retail y Logistica');

INSERT INTO roles (role_name, description) VALUES
('Administrador', 'Control total del sistema'),
('Supervisor', 'Supervisa operaciones y reportes'),
('Operador', 'Registra movimientos y pedidos'),
('Logistica', 'Acceso a inventario, rutas y envios'),
('Ventas', 'Acceso a pedidos y clientes'),
('Invitado', 'Acceso limitado de consulta');

INSERT INTO users (user_id, organization_id, full_name, email, password_hash)
VALUES
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Admin Nike', 'admin@nike.pe', crypt('admin123', gen_salt('bf'))),
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Operador Logistico', 'operador@nike.pe', crypt('operador123', gen_salt('bf')));

INSERT INTO user_roles (user_id, role_id)
SELECT '22222222-2222-2222-2222-222222222222', role_id FROM roles WHERE role_name = 'Administrador';

INSERT INTO user_roles (user_id, role_id)
SELECT '33333333-3333-3333-3333-333333333333', role_id FROM roles WHERE role_name = 'Logistica';

INSERT INTO workspaces (workspace_id, organization_id, user_id, name, description)
VALUES ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Dashboard Logistico Nike', 'Espacio para consultar inventario, ventas y envios');

INSERT INTO conversations (conversation_id, workspace_id, user_id, title)
VALUES ('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Consulta inicial de stock');

INSERT INTO messages (conversation_id, sender_type, sender_name, content)
VALUES
('55555555-5555-5555-5555-555555555555', 'user', 'Admin Nike', 'Analiza el stock critico de zapatillas Nike'),
('55555555-5555-5555-5555-555555555555', 'agent', 'Agente Inventario', 'Se encontraron productos con stock por debajo del minimo.');

INSERT INTO categories (name, description) VALUES
('Zapatillas', 'Calzado deportivo Nike'),
('Ropa', 'Prendas deportivas'),
('Accesorios', 'Mochilas, medias y otros accesorios');

INSERT INTO products (product_id, organization_id, category_id, sku, product_name, model, size, color, unit_price)
VALUES
('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111111', 1, 'NK-AIR-001', 'Nike Air Max', 'Air Max 90', '42', 'Negro', 499.90),
('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '11111111-1111-1111-1111-111111111111', 1, 'NK-ZOOM-002', 'Nike Zoom Pegasus', 'Pegasus 40', '41', 'Azul', 429.90),
('aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '11111111-1111-1111-1111-111111111111', 1, 'NK-DUNK-003', 'Nike Dunk Low', 'Dunk Low', '40', 'Blanco', 529.90),
('aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaa4', '11111111-1111-1111-1111-111111111111', 2, 'NK-DRY-004', 'Polo Nike Dri-FIT', 'Dri-FIT', 'M', 'Rojo', 129.90);

INSERT INTO warehouses (warehouse_id, organization_id, warehouse_name, city, address, capacity)
VALUES
('bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '11111111-1111-1111-1111-111111111111', 'Almacen Lima Centro', 'Lima', 'Av. Industrial 123', 5000),
('bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '11111111-1111-1111-1111-111111111111', 'Almacen Arequipa', 'Arequipa', 'Parque Industrial 45', 3000),
('bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbb3', '11111111-1111-1111-1111-111111111111', 'Almacen Moquegua', 'Moquegua', 'Av. Principal 789', 1500);

INSERT INTO inventory (organization_id, product_id, warehouse_id, stock_qty, min_stock, max_stock)
VALUES
('11111111-1111-1111-1111-111111111111', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 120, 20, 500),
('11111111-1111-1111-1111-111111111111', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 8, 25, 400),
('11111111-1111-1111-1111-111111111111', 'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 15, 30, 300),
('11111111-1111-1111-1111-111111111111', 'aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 90, 20, 250);

INSERT INTO suppliers (supplier_id, organization_id, supplier_name, contact_email, phone, country)
VALUES
('ccccccc1-cccc-cccc-cccc-ccccccccccc1', '11111111-1111-1111-1111-111111111111', 'Nike Global Supply', 'supply@nike.com', '+1 555 111', 'USA'),
('ccccccc2-cccc-cccc-cccc-ccccccccccc2', '11111111-1111-1111-1111-111111111111', 'Distribuidora Deportiva Peru', 'ventas@deportiva.pe', '999888777', 'Peru');

INSERT INTO customers (customer_id, organization_id, customer_name, email, city, address)
VALUES
('ddddddd1-dddd-dddd-dddd-ddddddddddd1', '11111111-1111-1111-1111-111111111111', 'Tienda Sport Center', 'compras@sportcenter.pe', 'Lima', 'Jr. Comercio 100'),
('ddddddd2-dddd-dddd-dddd-ddddddddddd2', '11111111-1111-1111-1111-111111111111', 'Mega Deportes Sur', 'contacto@megadeportes.pe', 'Arequipa', 'Av. Ejercito 200');

INSERT INTO sales_orders (sales_order_id, organization_id, customer_id, order_date, status, total_amount)
VALUES
('eeeeeee1-eeee-eeee-eeee-eeeeeeeeeee1', '11111111-1111-1111-1111-111111111111', 'ddddddd1-dddd-dddd-dddd-ddddddddddd1', CURRENT_DATE, 'confirmed', 1359.70),
('eeeeeee2-eeee-eeee-eeee-eeeeeeeeeee2', '11111111-1111-1111-1111-111111111111', 'ddddddd2-dddd-dddd-dddd-ddddddddddd2', CURRENT_DATE, 'pending', 529.90);

INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price)
VALUES
('eeeeeee1-eeee-eeee-eeee-eeeeeeeeeee1', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 1, 499.90),
('eeeeeee1-eeee-eeee-eeee-eeeeeeeeeee1', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 2, 429.90),
('eeeeeee2-eeee-eeee-eeee-eeeeeeeeeee2', 'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 1, 529.90);

INSERT INTO routes (route_id, organization_id, origin_city, destination_city, estimated_hours, distance_km)
VALUES
('fffffff1-ffff-ffff-ffff-fffffffffff1', '11111111-1111-1111-1111-111111111111', 'Lima', 'Arequipa', 16, 1010),
('fffffff2-ffff-ffff-ffff-fffffffffff2', '11111111-1111-1111-1111-111111111111', 'Arequipa', 'Moquegua', 4, 225);

INSERT INTO shipments (organization_id, sales_order_id, warehouse_id, route_id, shipment_date, delivery_date, status, carrier, tracking_code)
VALUES
('11111111-1111-1111-1111-111111111111', 'eeeeeee1-eeee-eeee-eeee-eeeeeeeeeee1', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'fffffff1-ffff-ffff-ffff-fffffffffff1', CURRENT_DATE, CURRENT_DATE + INTERVAL '2 days', 'en_transito', 'Shalom', 'TRK001-NIKE'),
('11111111-1111-1111-1111-111111111111', 'eeeeeee2-eeee-eeee-eeee-eeeeeeeeeee2', 'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'fffffff2-ffff-ffff-ffff-fffffffffff2', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 day', 'preparacion', 'Olva Courier', 'TRK002-NIKE');

INSERT INTO semantic_mappings (organization_id, business_term, physical_table, physical_column, description)
VALUES
('11111111-1111-1111-1111-111111111111', 'stock', 'inventory', 'stock_qty', 'Cantidad disponible de productos'),
('11111111-1111-1111-1111-111111111111', 'producto', 'products', 'product_name', 'Nombre comercial del producto'),
('11111111-1111-1111-1111-111111111111', 'almacen', 'warehouses', 'warehouse_name', 'Centro de almacenamiento'),
('11111111-1111-1111-1111-111111111111', 'envio', 'shipments', 'status', 'Estado del despacho logistico'),
('11111111-1111-1111-1111-111111111111', 'cliente', 'customers', 'customer_name', 'Cliente que realiza pedidos');

INSERT INTO artifacts (workspace_id, conversation_id, type, title, content)
VALUES
('44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', 'table', 'Productos con stock critico',
 '{"columns":["producto","almacen","stock","stock_minimo"],"rows":[["Nike Zoom Pegasus","Almacen Lima Centro",8,25],["Nike Dunk Low","Almacen Arequipa",15,30]]}'::jsonb);

INSERT INTO audit_logs (organization_id, user_id, action, entity_name, details)
VALUES
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'CONSULTA_STOCK_CRITICO', 'inventory', '{"agent":"Agente Inventario","tool":"RunQueryTool"}'::jsonb);

-- ============================================================
-- 5. CONSULTAS DE PRUEBA
-- ============================================================

-- Productos con stock critico:
-- SELECT p.product_name, w.warehouse_name, i.stock_qty, i.min_stock
-- FROM inventory i
-- JOIN products p ON i.product_id = p.product_id
-- JOIN warehouses w ON i.warehouse_id = w.warehouse_id
-- WHERE i.stock_qty < i.min_stock;

-- Stock total por producto:
-- SELECT p.product_name, SUM(i.stock_qty) AS stock_total
-- FROM inventory i
-- JOIN products p ON i.product_id = p.product_id
-- GROUP BY p.product_name
-- ORDER BY stock_total DESC;

-- Pedidos y estado de envio:
-- SELECT so.sales_order_id, c.customer_name, so.status AS estado_pedido, s.status AS estado_envio, s.tracking_code
-- FROM sales_orders so
-- JOIN customers c ON so.customer_id = c.customer_id
-- LEFT JOIN shipments s ON so.sales_order_id = s.sales_order_id;

