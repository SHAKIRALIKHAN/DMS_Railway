import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import cors from "cors";
import morgan from "morgan";
import Database from "better-sqlite3";
import multer from "multer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database persistence path
const dbPath = path.join(process.cwd(), "dms_v7.db");
console.log(`[Database] Target path: ${dbPath}`);

let db: any;
try {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = FULL');
  db.pragma('wal_checkpoint(FULL)');
  console.log(`[Database] Connection established successfully with WAL checkpoint.`);
  
  // Initialize Database Schema
  try {
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='units'").get();
    if (!tableCheck) {
      console.log("[Database] 'units' table missing. Triggering schema recreation.");
      throw new Error("Schema missing");
    }
  } catch (err) {
    console.log("[Database] Initial check failed, ensuring baseline tables exist...");
  }

    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

      CREATE TABLE IF NOT EXISTS material_groups (
        mat_gp TEXT PRIMARY KEY,
        mat_description TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS products (
        product_id TEXT PRIMARY KEY,
        product_name TEXT NOT NULL UNIQUE,
        brand TEXT NOT NULL,
        material_group_id TEXT,
        purchase_price REAL NOT NULL,
        trade_price REAL NOT NULL,
        retail_price REAL NOT NULL,
        stock_quantity INTEGER NOT NULL,
        unit TEXT DEFAULT 'EACH',
        conversion_value REAL DEFAULT 1,
        conversion_unit TEXT DEFAULT 'EACH',
        min_stock_level INTEGER DEFAULT 10,
        reorder_level INTEGER DEFAULT 20,
        FOREIGN KEY (material_group_id) REFERENCES material_groups(mat_gp)
      );

      CREATE TABLE IF NOT EXISTS units (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        short_name TEXT NOT NULL,
        status INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS product_batches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id TEXT NOT NULL,
        purchase_id INTEGER,
        quantity INTEGER NOT NULL,
        remaining_quantity INTEGER NOT NULL,
        purchase_price REAL NOT NULL,
        supplier_batch_no TEXT,
        storage_location TEXT,
        received_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(product_id),
        FOREIGN KEY (purchase_id) REFERENCES purchases(id)
      );

      CREATE TABLE IF NOT EXISTS shops (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_name TEXT NOT NULL UNIQUE,
        owner_name TEXT NOT NULL,
        location TEXT NOT NULL,
        phone TEXT NOT NULL UNIQUE,
        credit_limit REAL DEFAULT 0,
        category TEXT DEFAULT 'Retailer'
      );

      CREATE TABLE IF NOT EXISTS order_bookers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        father_name TEXT NOT NULL,
        cell_no TEXT NOT NULL UNIQUE,
        cnic_no TEXT NOT NULL,
        joining_date DATE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS returns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        return_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        shop_id INTEGER NOT NULL,
        total_amount REAL DEFAULT 0,
        status TEXT DEFAULT 'completed',
        FOREIGN KEY (shop_id) REFERENCES shops(id)
      );

      CREATE TABLE IF NOT EXISTS return_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        return_id INTEGER NOT NULL,
        delivery_id INTEGER NOT NULL,
        delivery_item_id INTEGER,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        reason TEXT,
        FOREIGN KEY (return_id) REFERENCES returns(id),
        FOREIGN KEY (product_id) REFERENCES products(product_id),
        FOREIGN KEY (delivery_id) REFERENCES deliveries(id),
        FOREIGN KEY (delivery_item_id) REFERENCES delivery_items(id)
      );
      CREATE TABLE IF NOT EXISTS salesmen (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        father_name TEXT NOT NULL,
        cell_no TEXT NOT NULL UNIQUE,
        cnic_no TEXT NOT NULL,
        joining_date DATE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_id INTEGER NOT NULL,
        order_booker_id INTEGER NOT NULL,
        order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        estimated_delivery_date DATETIME,
        status TEXT DEFAULT 'pending',
        total_amount REAL NOT NULL,
        sales_tax_pct REAL DEFAULT 0,
        sales_tax_amount REAL DEFAULT 0,
        additional_tax_pct REAL DEFAULT 0,
        additional_tax_amount REAL DEFAULT 0,
        discount_pct REAL DEFAULT 0,
        discount_amount REAL DEFAULT 0,
        extra_discount_pct REAL DEFAULT 0,
        extra_discount_amount REAL DEFAULT 0,
        is_cancelled TEXT DEFAULT '',
        FOREIGN KEY (shop_id) REFERENCES shops(id),
        FOREIGN KEY (order_booker_id) REFERENCES order_bookers(id)
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        status TEXT DEFAULT 'Pending',
        sales_tax_pct REAL DEFAULT 0,
        sales_tax_amount REAL DEFAULT 0,
        additional_tax_pct REAL DEFAULT 0,
        additional_tax_amount REAL DEFAULT 0,
        discount_pct REAL DEFAULT 0,
        discount_amount REAL DEFAULT 0,
        extra_discount_pct REAL DEFAULT 0,
        extra_discount_amount REAL DEFAULT 0,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(product_id)
      );

      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        payment_method TEXT NOT NULL,
        FOREIGN KEY (shop_id) REFERENCES shops(id)
      );

      CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        contact_person TEXT NOT NULL,
        phone TEXT NOT NULL UNIQUE,
        address TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplier_id INTEGER NOT NULL,
        purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'received',
        total_amount REAL NOT NULL,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
      );

      CREATE TABLE IF NOT EXISTS purchase_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_id INTEGER NOT NULL,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        supplier_batch_no TEXT,
        storage_location TEXT,
        FOREIGN KEY (purchase_id) REFERENCES purchases(id),
        FOREIGN KEY (product_id) REFERENCES products(product_id)
      );

      CREATE TABLE IF NOT EXISTS drivers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        father_name TEXT NOT NULL,
        cell_no TEXT NOT NULL,
        cnic_no TEXT NOT NULL,
        joining_date DATE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS load_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        vehicle_id TEXT NOT NULL,
        driver_id INTEGER NOT NULL,
        status TEXT DEFAULT 'draft',
        FOREIGN KEY (driver_id) REFERENCES drivers(id)
      );

      CREATE TABLE IF NOT EXISTS load_plan_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_id INTEGER NOT NULL,
        order_id INTEGER NOT NULL,
        FOREIGN KEY (plan_id) REFERENCES load_plans(id),
        FOREIGN KEY (order_id) REFERENCES orders(id)
      );

      CREATE TABLE IF NOT EXISTS deliveries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        shop_id INTEGER,
        salesman_id INTEGER NOT NULL,
        delivery_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'completed',
        total_amount REAL NOT NULL,
        invoice_id INTEGER,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (shop_id) REFERENCES shops(id),
        FOREIGN KEY (salesman_id) REFERENCES salesmen(id)
      );

      CREATE TABLE IF NOT EXISTS delivery_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        delivery_id INTEGER NOT NULL,
        order_item_id INTEGER NOT NULL,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        sales_tax_pct REAL DEFAULT 0,
        sales_tax_amount REAL DEFAULT 0,
        additional_tax_pct REAL DEFAULT 0,
        additional_tax_amount REAL DEFAULT 0,
        discount_pct REAL DEFAULT 0,
        discount_amount REAL DEFAULT 0,
        extra_discount_pct REAL DEFAULT 0,
        extra_discount_amount REAL DEFAULT 0,
        FOREIGN KEY (delivery_id) REFERENCES deliveries(id),
        FOREIGN KEY (order_item_id) REFERENCES order_items(id),
        FOREIGN KEY (product_id) REFERENCES products(product_id)
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_id INTEGER NOT NULL,
        invoice_date TEXT NOT NULL,
        gross_amount REAL DEFAULT 0,
        total_discount REAL DEFAULT 0,
        total_tax REAL DEFAULT 0,
        net_amount REAL DEFAULT 0,
        status TEXT DEFAULT 'open',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (shop_id) REFERENCES shops(id)
      );

      CREATE TABLE IF NOT EXISTS invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        delivery_id INTEGER NOT NULL,
        delivery_item_id INTEGER NOT NULL,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        trade_discount_pct REAL DEFAULT 0,
        tax_pct REAL DEFAULT 0,
        additional_tax_pct REAL DEFAULT 0,
        special_discount_pct REAL DEFAULT 0,
        net_amount REAL NOT NULL,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id),
        FOREIGN KEY (delivery_id) REFERENCES deliveries(id),
        FOREIGN KEY (product_id) REFERENCES products(product_id)
      );

      CREATE TABLE IF NOT EXISTS client_ledger (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_id INTEGER NOT NULL,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        description TEXT NOT NULL,
        debit REAL DEFAULT 0,
        credit REAL DEFAULT 0,
        balance REAL NOT NULL,
        FOREIGN KEY (shop_id) REFERENCES shops(id)
      );

      CREATE TABLE IF NOT EXISTS countries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS provinces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        country_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        FOREIGN KEY (country_id) REFERENCES countries(id),
        UNIQUE(country_id, name)
      );

      CREATE TABLE IF NOT EXISTS cities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        province_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        FOREIGN KEY (province_id) REFERENCES provinces(id),
        UNIQUE(province_id, name)
      );

      CREATE TABLE IF NOT EXISTS towns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        city_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        FOREIGN KEY (city_id) REFERENCES cities(id),
        UNIQUE(city_id, name)
      );

      CREATE TABLE IF NOT EXISTS areas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        town_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        FOREIGN KEY (town_id) REFERENCES towns(id),
        UNIQUE(town_id, name)
      );

      CREATE TABLE IF NOT EXISTS subareas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        area_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        FOREIGN KEY (area_id) REFERENCES areas(id),
        UNIQUE(area_id, name)
      );
    `);

  // Run Migrations (Idempotent)
  try { db.exec("ALTER TABLE orders ADD COLUMN is_cancelled TEXT DEFAULT ''"); } catch(e) {}
  try { db.exec("ALTER TABLE return_items ADD COLUMN reason TEXT;"); } catch(e) {}
  try { db.exec("ALTER TABLE orders ADD COLUMN sales_tax_pct REAL DEFAULT 0"); } catch(e) {}
  try { db.exec("ALTER TABLE orders ADD COLUMN sales_tax_amount REAL DEFAULT 0"); } catch(e) {}
  try { db.exec("ALTER TABLE orders ADD COLUMN additional_tax_pct REAL DEFAULT 0"); } catch(e) {}
  try { db.exec("ALTER TABLE orders ADD COLUMN additional_tax_amount REAL DEFAULT 0"); } catch(e) {}
  try { db.exec("ALTER TABLE orders ADD COLUMN discount_pct REAL DEFAULT 0"); } catch(e) {}
  try { db.exec("ALTER TABLE orders ADD COLUMN discount_amount REAL DEFAULT 0"); } catch(e) {}
  try { db.exec("ALTER TABLE orders ADD COLUMN extra_discount_pct REAL DEFAULT 0"); } catch(e) {}
  try { db.exec("ALTER TABLE orders ADD COLUMN extra_discount_amount REAL DEFAULT 0"); } catch(e) {}
  
  try { db.exec("ALTER TABLE order_items ADD COLUMN sales_tax_pct REAL DEFAULT 0"); } catch(e) {}
  try { db.exec("ALTER TABLE order_items ADD COLUMN sales_tax_amount REAL DEFAULT 0"); } catch(e) {}
  try { db.exec("ALTER TABLE order_items ADD COLUMN additional_tax_pct REAL DEFAULT 0"); } catch(e) {}
  try { db.exec("ALTER TABLE order_items ADD COLUMN additional_tax_amount REAL DEFAULT 0"); } catch(e) {}
  try { db.exec("ALTER TABLE order_items ADD COLUMN discount_pct REAL DEFAULT 0"); } catch(e) {}
  try { db.exec("ALTER TABLE order_items ADD COLUMN discount_amount REAL DEFAULT 0"); } catch(e) {}
  try { db.exec("ALTER TABLE order_items ADD COLUMN extra_discount_pct REAL DEFAULT 0"); } catch(e) {}
  try { db.exec("ALTER TABLE order_items ADD COLUMN extra_discount_amount REAL DEFAULT 0"); } catch(e) {}
  
  try { db.exec("ALTER TABLE delivery_items ADD COLUMN sales_tax_pct REAL DEFAULT 0"); } catch(e) {}
  try { db.exec("ALTER TABLE delivery_items ADD COLUMN sales_tax_amount REAL DEFAULT 0"); } catch(e) {}
  try { db.exec("ALTER TABLE delivery_items ADD COLUMN additional_tax_pct REAL DEFAULT 0"); } catch(e) {}
  try { db.exec("ALTER TABLE delivery_items ADD COLUMN additional_tax_amount REAL DEFAULT 0"); } catch(e) {}
  try { db.exec("ALTER TABLE delivery_items ADD COLUMN discount_pct REAL DEFAULT 0"); } catch(e) {}
  try { db.exec("ALTER TABLE delivery_items ADD COLUMN discount_amount REAL DEFAULT 0"); } catch(e) {}
  try { db.exec("ALTER TABLE delivery_items ADD COLUMN extra_discount_pct REAL DEFAULT 0"); } catch(e) {}
  try { db.exec("ALTER TABLE delivery_items ADD COLUMN extra_discount_amount REAL DEFAULT 0"); } catch(e) {}

  try { db.exec("ALTER TABLE return_items ADD COLUMN delivery_item_id INTEGER REFERENCES delivery_items(id)"); } catch(e) {}
  
  // Migrations for invoice_items 
  try { db.exec("ALTER TABLE invoice_items ADD COLUMN trade_discount_pct REAL DEFAULT 0"); } catch(e) {}
  try { db.exec("ALTER TABLE invoice_items ADD COLUMN tax_pct REAL DEFAULT 0"); } catch(e) {}
  try { db.exec("ALTER TABLE invoice_items ADD COLUMN additional_tax_pct REAL DEFAULT 0"); } catch(e) {}
  try { db.exec("ALTER TABLE invoice_items ADD COLUMN special_discount_pct REAL DEFAULT 0"); } catch(e) {}

  // Migration for order_items estimated_delivery_date
  try { db.exec("ALTER TABLE order_items ADD COLUMN estimated_delivery_date DATE"); } catch(e) {}

  // Migration for deliveries invoice_id
  try { db.exec("ALTER TABLE deliveries ADD COLUMN invoice_id INTEGER"); } catch(e) {}

  // Migration for deliveries shop_id and backfill
  try {
    const cols = db.prepare("PRAGMA table_info(deliveries)").all() as any[];
    if (!cols.find(c => c.name === 'shop_id')) {
      db.exec("ALTER TABLE deliveries ADD COLUMN shop_id INTEGER");
    }
    // Always try to backfill missing shop_ids
    db.exec(`
      UPDATE deliveries 
      SET shop_id = (SELECT shop_id FROM orders WHERE orders.id = deliveries.order_id)
      WHERE shop_id IS NULL OR shop_id = 0
    `);
  } catch (e) {
    console.warn("Deliveries shop_id migration/backfill error:", e);
  }

  // Migration for shops category
  try {
    db.prepare("SELECT category FROM shops LIMIT 1").get();
  } catch (err) {
    try {
      db.exec("ALTER TABLE shops ADD COLUMN category TEXT DEFAULT 'Retailer'");
    } catch (e) {
      // ignore
    }
  }

  // Sales Return tables
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS sales_returns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        return_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        shop_id INTEGER NOT NULL,
        invoice_id INTEGER NOT NULL,
        total_amount REAL DEFAULT 0,
        status TEXT DEFAULT 'completed',
        FOREIGN KEY (shop_id) REFERENCES shops(id),
        FOREIGN KEY (invoice_id) REFERENCES invoices(id)
      );

      CREATE TABLE IF NOT EXISTS sales_return_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sales_return_id INTEGER NOT NULL,
        invoice_item_id INTEGER NOT NULL,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        reason TEXT,
        FOREIGN KEY (sales_return_id) REFERENCES sales_returns(id),
        FOREIGN KEY (invoice_item_id) REFERENCES invoice_items(id),
        FOREIGN KEY (product_id) REFERENCES products(product_id)
      );

      CREATE TABLE IF NOT EXISTS purchase_returns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        return_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        supplier_id INTEGER NOT NULL,
        purchase_id INTEGER NOT NULL,
        total_amount REAL DEFAULT 0,
        status TEXT DEFAULT 'completed',
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
        FOREIGN KEY (purchase_id) REFERENCES purchases(id)
      );

      CREATE TABLE IF NOT EXISTS purchase_return_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_return_id INTEGER NOT NULL,
        purchase_item_id INTEGER NOT NULL,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        reason TEXT,
        FOREIGN KEY (purchase_return_id) REFERENCES purchase_returns(id),
        FOREIGN KEY (purchase_item_id) REFERENCES purchase_items(id),
        FOREIGN KEY (product_id) REFERENCES products(product_id)
      );
    `);
  } catch (e) {
    console.error("Sales and Purchase return table creation error:", e);
  }

  // Moving Average Price (MAP) & Inventory Valuation Migrations
  try { db.exec("ALTER TABLE products ADD COLUMN inventory_value REAL DEFAULT 0"); } catch(e) {}
  try { db.exec("ALTER TABLE products ADD COLUMN moving_average_price REAL DEFAULT 0"); } catch(e) {}

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS inventory_audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id TEXT NOT NULL,
        transaction_type TEXT NOT NULL, -- 'PURCHASE', 'PURCHASE_RETURN', 'SALE', 'SALE_RETURN', 'ADJUSTMENT'
        reference_id TEXT,
        qty_change REAL NOT NULL,
        unit_price REAL NOT NULL,
        previous_stock REAL NOT NULL,
        previous_value REAL NOT NULL,
        previous_map REAL NOT NULL,
        new_stock REAL NOT NULL,
        new_value REAL NOT NULL,
        new_map REAL NOT NULL,
        notes TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(product_id)
      );
    `);
  } catch (e) {
    console.error("inventory_audit_log table creation error:", e);
  }

  // Create Distributors table
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS distributors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        city TEXT DEFAULT 'Karachi',
        ntn_number TEXT,
        strn_number TEXT,
        status TEXT DEFAULT 'ACTIVE',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_distributors_code ON distributors(code);
    `);
  } catch (e) {
    console.error("distributors table creation error:", e);
  }

  // Safe migration: Add distributor_id column to tables
  const tablesForDistributor = [
    'users', 'shops', 'orders', 'purchases', 'deliveries', 'returns',
    'sales_returns', 'purchase_returns', 'invoices', 'order_bookers',
    'salesmen', 'drivers', 'load_plans', 'products'
  ];

  for (const tbl of tablesForDistributor) {
    try {
      db.exec(`ALTER TABLE ${tbl} ADD COLUMN distributor_id INTEGER REFERENCES distributors(id);`);
    } catch (e) {
      // Column already exists or table does not exist
    }
  }

  // Seed default distributors if empty
  try {
    const distCount = db.prepare("SELECT COUNT(*) as count FROM distributors").get() as { count: number };
    if (distCount.count === 0) {
      const insertDist = db.prepare(`
        INSERT OR IGNORE INTO distributors (id, code, name, contact_person, phone, email, address, city, ntn_number, strn_number, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertDist.run(1, 'DST-001', 'Karachi Central Logistics & Distribution', 'Muhammad Tariq', '021-34567890', 'info@khi-central.pk', 'Plot 45, Sector 15, Korangi Industrial Area, Karachi', 'Karachi', '1234567-8', '3277876123456', 'ACTIVE');
      insertDist.run(2, 'DST-002', 'South Zone FMCG Distribution', 'Nadeem Khan', '021-35678901', 'sales@southzone.pk', 'Shop 12-14, Wholesale Market, Saddar, Karachi', 'Karachi', '2345678-9', '3277876123457', 'ACTIVE');
      insertDist.run(3, 'DST-003', 'North Region Wholesale & Distribution', 'Farhan Ali', '021-36789012', 'contact@northdist.pk', 'Sector 5-D, North Karachi Industrial Area', 'Karachi', '3456789-0', '3277876123458', 'ACTIVE');
    }
  } catch (e) {
    console.error("Distributor seeding error:", e);
  }

  // Backfill existing records to distributor_id = 1 (Karachi Central) where distributor_id is NULL
  try {
    for (const tbl of tablesForDistributor) {
      if (tbl !== 'users') {
        db.exec(`UPDATE ${tbl} SET distributor_id = 1 WHERE distributor_id IS NULL;`);
      }
    }
    // Set non-admin users to distributor_id = 1 if null
    db.exec(`UPDATE users SET distributor_id = 1 WHERE role != 'admin' AND distributor_id IS NULL;`);
  } catch (e) {
    console.warn("Distributor backfill error:", e);
  }

  // Backfill initial MAP and Inventory Value for existing products
  try {
    db.exec(`
      UPDATE products 
      SET moving_average_price = CASE WHEN (moving_average_price IS NULL OR moving_average_price = 0) THEN purchase_price ELSE moving_average_price END,
          inventory_value = CASE WHEN (inventory_value IS NULL OR inventory_value = 0) THEN round(stock_quantity * purchase_price, 2) ELSE inventory_value END
      WHERE purchase_price > 0;
    `);
  } catch (e) {
    console.warn("MAP backfill error:", e);
  }
} catch (err) {
  console.error("CRITICAL: Database initialization failed:", err);
  process.exit(1);
}

/* ============================================================================
   MOVING AVERAGE PRICE (MAP) & INVENTORY VALUATION ENGINE
   SAP MM Compliant Valuation & Audit Ledger
   ============================================================================ */

const round2 = (val: number): number => Math.round((val + Number.EPSILON) * 100) / 100;
const round4 = (val: number): number => Math.round((val + Number.EPSILON) * 10000) / 10000;

interface ProductValuationState {
  product_id: string;
  product_name: string;
  stock_quantity: number;
  inventory_value: number;
  moving_average_price: number;
  purchase_price: number;
}

/**
 * 1. Process Purchase (Goods Receipt) -> Recalculates MAP
 *
 * New Receipt Value = Purchase Quantity * Purchase Unit Price
 * New Inventory Quantity = Current Stock Quantity + Purchase Quantity
 * New Inventory Value = Current Inventory Value + New Receipt Value
 * New MAP = New Inventory Value / New Inventory Quantity
 */
function processPurchaseValuation(
  dbInstance: any,
  productId: string,
  purchaseQty: number,
  purchaseUnitPrice: number,
  referenceId: string | number,
  notes: string = "Purchase Goods Receipt"
) {
  if (purchaseQty <= 0) {
    throw new Error(`Invalid Purchase Quantity (${purchaseQty}). Must be greater than zero.`);
  }
  if (purchaseUnitPrice <= 0) {
    throw new Error(`Invalid Purchase Price (${purchaseUnitPrice}). Must be greater than zero.`);
  }

  const product = dbInstance.prepare("SELECT * FROM products WHERE product_id = ?").get(productId) as ProductValuationState | undefined;
  if (!product) {
    throw new Error(`Product Master record not found for ID: ${productId}`);
  }

  const currentStock = Number(product.stock_quantity || 0);
  const currentMap = Number(product.moving_average_price) > 0 
    ? Number(product.moving_average_price) 
    : Number(product.purchase_price || 0);
  
  const currentValue = (product.inventory_value !== null && product.inventory_value !== undefined && Number(product.inventory_value) > 0)
    ? Number(product.inventory_value)
    : round2(currentStock * currentMap);

  const receiptValue = round4(purchaseQty * purchaseUnitPrice);
  const newStock = currentStock + purchaseQty;
  const newValue = round4(currentValue + receiptValue);
  const newMap = newStock > 0 ? round4(newValue / newStock) : 0;

  // Update Product Master
  dbInstance.prepare(`
    UPDATE products 
    SET stock_quantity = ?, 
        inventory_value = ?, 
        moving_average_price = ?,
        purchase_price = ?
    WHERE product_id = ?
  `).run(newStock, round2(newValue), newMap, purchaseUnitPrice, productId);

  // Insert Audit Log Entry
  dbInstance.prepare(`
    INSERT INTO inventory_audit_log 
    (product_id, transaction_type, reference_id, qty_change, unit_price, previous_stock, previous_value, previous_map, new_stock, new_value, new_map, notes)
    VALUES (?, 'PURCHASE', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    productId,
    String(referenceId),
    purchaseQty,
    purchaseUnitPrice,
    currentStock,
    round2(currentValue),
    currentMap,
    newStock,
    round2(newValue),
    newMap,
    notes
  );

  return { newStock, newValue: round2(newValue), newMap };
}

/**
 * 2. Process Purchase Return (Return to Vendor)
 *
 * Vendor returns decrease stock and inventory value using CURRENT MAP (not original purchase price).
 * Return Value = Return Quantity * Current MAP
 * New Inventory Quantity = Current Stock Quantity - Return Quantity
 * New Inventory Value = Current Inventory Value - Return Value
 * If New Quantity > 0 -> New MAP = New Inventory Value / New Inventory Quantity (remains equal to Current MAP)
 * If New Quantity == 0 -> New Inventory Value = 0, MAP = 0
 */
function processPurchaseReturnValuation(
  dbInstance: any,
  productId: string,
  returnQty: number,
  referenceId: string | number,
  notes: string = "Purchase Return to Vendor"
) {
  if (returnQty <= 0) {
    throw new Error(`Invalid Purchase Return Quantity (${returnQty}). Must be greater than zero.`);
  }

  const product = dbInstance.prepare("SELECT * FROM products WHERE product_id = ?").get(productId) as ProductValuationState | undefined;
  if (!product) {
    throw new Error(`Product Master record not found for ID: ${productId}`);
  }

  const currentStock = Number(product.stock_quantity || 0);
  if (returnQty > currentStock) {
    throw new Error(`Return quantity (${returnQty}) exceeds available stock (${currentStock}) for product ${product.product_name || productId}.`);
  }

  const currentMap = Number(product.moving_average_price) > 0 
    ? Number(product.moving_average_price) 
    : Number(product.purchase_price || 0);

  const currentValue = (product.inventory_value !== null && product.inventory_value !== undefined && Number(product.inventory_value) > 0)
    ? Number(product.inventory_value)
    : round2(currentStock * currentMap);

  const returnValue = round4(returnQty * currentMap);
  const newStock = Math.max(0, currentStock - returnQty);
  let newValue = Math.max(0, round4(currentValue - returnValue));
  let newMap = currentMap;

  if (newStock === 0) {
    newValue = 0;
    newMap = 0;
  } else {
    newMap = round4(newValue / newStock);
  }

  // Update Product Master
  dbInstance.prepare(`
    UPDATE products 
    SET stock_quantity = ?, 
        inventory_value = ?, 
        moving_average_price = ?
    WHERE product_id = ?
  `).run(newStock, round2(newValue), newMap, productId);

  // Insert Audit Log Entry
  dbInstance.prepare(`
    INSERT INTO inventory_audit_log 
    (product_id, transaction_type, reference_id, qty_change, unit_price, previous_stock, previous_value, previous_map, new_stock, new_value, new_map, notes)
    VALUES (?, 'PURCHASE_RETURN', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    productId,
    String(referenceId),
    -returnQty,
    currentMap,
    currentStock,
    round2(currentValue),
    currentMap,
    newStock,
    round2(newValue),
    newMap,
    notes
  );

  return { newStock, newValue: round2(newValue), newMap };
}

/**
 * 3. Process Non-MAP Recalculating Goods Issue (Sales / Delivery / Internal Issue)
 *
 * Reduces inventory value using Current MAP:
 * Inventory Value Reduction = Issued Quantity * Current MAP
 * MAP remains unchanged.
 */
function processIssueValuation(
  dbInstance: any,
  productId: string,
  issueQty: number,
  transactionType: string = 'SALE',
  referenceId: string | number,
  notes: string = "Goods Issue / Sales Delivery"
) {
  if (issueQty <= 0) return;

  const product = dbInstance.prepare("SELECT * FROM products WHERE product_id = ?").get(productId) as ProductValuationState | undefined;
  if (!product) return;

  const currentStock = Number(product.stock_quantity || 0);
  const currentMap = Number(product.moving_average_price) > 0 
    ? Number(product.moving_average_price) 
    : Number(product.purchase_price || 0);

  const currentValue = (product.inventory_value !== null && product.inventory_value !== undefined && Number(product.inventory_value) > 0)
    ? Number(product.inventory_value)
    : round2(currentStock * currentMap);

  const issueValue = round4(issueQty * currentMap);
  const newStock = Math.max(0, currentStock - issueQty);
  let newValue = Math.max(0, round4(currentValue - issueValue));
  let newMap = currentMap;

  if (newStock === 0) {
    newValue = 0;
    newMap = 0;
  }

  dbInstance.prepare(`
    UPDATE products 
    SET stock_quantity = ?, 
        inventory_value = ?, 
        moving_average_price = ?
    WHERE product_id = ?
  `).run(newStock, round2(newValue), newMap, productId);

  dbInstance.prepare(`
    INSERT INTO inventory_audit_log 
    (product_id, transaction_type, reference_id, qty_change, unit_price, previous_stock, previous_value, previous_map, new_stock, new_value, new_map, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    productId,
    transactionType,
    String(referenceId),
    -issueQty,
    currentMap,
    currentStock,
    round2(currentValue),
    currentMap,
    newStock,
    round2(newValue),
    newMap,
    notes
  );
}

/**
 * 4. Process Sales Return (Goods Receipt from Customer)
 */
function processSalesReturnValuation(
  dbInstance: any,
  productId: string,
  returnQty: number,
  referenceId: string | number,
  notes: string = "Sales Return from Customer"
) {
  if (returnQty <= 0) return;

  const product = dbInstance.prepare("SELECT * FROM products WHERE product_id = ?").get(productId) as ProductValuationState | undefined;
  if (!product) return;

  const currentStock = Number(product.stock_quantity || 0);
  const currentMap = Number(product.moving_average_price) > 0 
    ? Number(product.moving_average_price) 
    : Number(product.purchase_price || 0);

  const currentValue = (product.inventory_value !== null && product.inventory_value !== undefined && Number(product.inventory_value) > 0)
    ? Number(product.inventory_value)
    : round2(currentStock * currentMap);

  const returnReceiptValue = round4(returnQty * currentMap);
  const newStock = currentStock + returnQty;
  const newValue = round4(currentValue + returnReceiptValue);
  const newMap = currentMap;

  dbInstance.prepare(`
    UPDATE products 
    SET stock_quantity = ?, 
        inventory_value = ?, 
        moving_average_price = ?
    WHERE product_id = ?
  `).run(newStock, round2(newValue), newMap, productId);

  dbInstance.prepare(`
    INSERT INTO inventory_audit_log 
    (product_id, transaction_type, reference_id, qty_change, unit_price, previous_stock, previous_value, previous_map, new_stock, new_value, new_map, notes)
    VALUES (?, 'SALE_RETURN', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    productId,
    String(referenceId),
    returnQty,
    currentMap,
    currentStock,
    round2(currentValue),
    currentMap,
    newStock,
    round2(newValue),
    newMap,
    notes
  );
}

// Seed initial data if tables are empty
try {
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  const shopCount = db.prepare("SELECT COUNT(*) as count FROM shops").get() as { count: number };
  const productCount = db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
  
  if (userCount.count === 0 && shopCount.count === 0 && productCount.count === 0) {
    console.log("[Seeding] Database is empty. Applying baseline seed data...");
    db.transaction(() => {
      // 1. Users
      db.prepare("INSERT OR IGNORE INTO users (name, role, phone, password) VALUES (?, ?, ?, ?)").run("Admin Karachi", "admin", "03001234567", "admin123");
      db.prepare("INSERT OR IGNORE INTO users (name, role, phone, password) VALUES (?, ?, ?, ?)").run("Salesman A", "salesman", "03007654321", "sales123");

      // 2. Material Groups
      const materialGroups = [
        { mat_gp: "00001", mat_description: "OIL" },
        { mat_gp: "00002", mat_description: "DAIRY" },
        { mat_gp: "00003", mat_description: "KITCHEN" },
        { mat_gp: "00004", mat_description: "SNACKS" }
      ];
      const mgStmt = db.prepare("INSERT OR IGNORE INTO material_groups (mat_gp, mat_description) VALUES (?, ?)");
      for (const mg of materialGroups) mgStmt.run(mg.mat_gp, mg.mat_description);

      // 3. Units
      const unitsToSeed = [
        { code: 'KG', name: 'KILOGRAM', short: 'KGS' },
        { code: 'PC', name: 'PIECES', short: 'PCS' },
        { code: 'L', name: 'LITER', short: 'LTR' },
        { code: 'EA', name: 'EACH', short: 'EA' },
        { code: 'PK', name: 'PACK', short: 'PACK' },
        { code: 'CT', name: 'CARTON', short: 'CTN' }
      ];
      const unitStmt = db.prepare("INSERT OR IGNORE INTO units (unit_code, name, short_name, status) VALUES (?, ?, ?, ?)");
      for (const u of unitsToSeed) unitStmt.run(u.code, u.name, u.short, 1);

      // 4. Products & Initial Batches
      const initialProducts = [
        { id: "A000000001", name: "Cooking Oil 1L", brand: "Dalda", mg: "00001", pp: 500, tp: 550, rp: 600, stock: 100, unit: "EA", conv: 1, convUnit: "L", min: 20, reorder: 40 },
        { id: "A000000002", name: "Tea 400g", brand: "Tapal", mg: "00003", pp: 600, tp: 650, rp: 700, stock: 50, unit: "EA", conv: 400, convUnit: "GR", min: 10, reorder: 20 },
        { id: "A000000003", name: "Soap Bar", brand: "Lux", mg: "00003", pp: 100, tp: 120, rp: 150, stock: 200, unit: "EA", conv: 1, convUnit: "EA", min: 50, reorder: 100 }
      ];
      const productStmt = db.prepare("INSERT OR IGNORE INTO products (product_id, product_name, brand, material_group_id, purchase_price, trade_price, retail_price, stock_quantity, unit, conversion_value, conversion_unit, min_stock_level, reorder_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
      const batchStmt = db.prepare("INSERT OR IGNORE INTO product_batches (product_id, purchase_id, quantity, remaining_quantity, purchase_price) VALUES (?, ?, ?, ?, ?)");
      for (const p of initialProducts) {
        productStmt.run(p.id, p.name, p.brand, p.mg, p.pp, p.tp, p.rp, p.stock, p.unit, p.conv, p.convUnit, p.min, p.reorder);
        batchStmt.run(p.id, null, p.stock, p.stock, p.pp);
      }

      // 5. Shops, Suppliers, Bookers, Salesmen
      db.prepare("INSERT OR IGNORE INTO shops (shop_name, owner_name, location, phone, credit_limit) VALUES (?, ?, ?, ?, ?)").run("Bismillah General Store", "Ahmed Ali", "Saddar, Karachi", "03111111111", 50000);
      db.prepare("INSERT OR IGNORE INTO shops (shop_name, owner_name, location, phone, credit_limit) VALUES (?, ?, ?, ?, ?)").run("Madina Super Mart", "Muhammad Usman", "Gulshan-e-Iqbal, Karachi", "03222222222", 100000);
      db.prepare("INSERT OR IGNORE INTO suppliers (name, contact_person, phone, address) VALUES (?, ?, ?, ?)").run("MSK Company", "Saleem Ahmed", "03444444444", "SITE Area, Karachi");
      db.prepare("INSERT OR IGNORE INTO order_bookers (name, father_name, cell_no, cnic_no, joining_date) VALUES (?, ?, ?, ?, ?)").run("Zeeshan Ahmed", "Ahmed Khan", "03001234567", "42101-1111111-1", "2024-01-01");
      db.prepare("INSERT OR IGNORE INTO salesmen (name, father_name, cell_no, cnic_no, joining_date) VALUES (?, ?, ?, ?, ?)").run("Asif Ali", "Ali Ahmed", "03004445556", "42101-7654321-2", "2024-02-10");
    })();
  }

  // --- SEED TRANSACTION DATA ---
  const orderCount = db.prepare("SELECT COUNT(*) as count FROM orders").get() as { count: number };
  const purchaseCount = db.prepare("SELECT COUNT(*) as count FROM purchases").get() as { count: number };
  const returnCount = db.prepare("SELECT COUNT(*) as count FROM returns").get() as { count: number };

  if (orderCount.count === 0 || purchaseCount.count === 0 || returnCount.count === 0) {
    console.log("[Database] Seeding missing transaction records...");
    db.transaction(() => {
      const shopRes = db.prepare("SELECT id FROM shops LIMIT 1").get() as any;
      const supplierRes = db.prepare("SELECT id FROM suppliers LIMIT 1").get() as any;
      const bookerRes = db.prepare("SELECT id FROM order_bookers LIMIT 1").get() as any;
      const salesmanRes = db.prepare("SELECT id FROM salesmen LIMIT 1").get() as any;

      if (!shopRes || !supplierRes || !bookerRes || !salesmanRes) return;

      // 1. Seed 3 Purchases
      if (purchaseCount.count === 0) {
        const pItems = [
          { pid: "A000000001", qty: 50, price: 500 },
          { pid: "A000000002", qty: 30, price: 600 },
          { pid: "A000000003", qty: 100, price: 100 }
        ];
        for (const item of pItems) {
          const pTotal = item.qty * item.price;
          const pId = db.prepare("INSERT INTO purchases (supplier_id, total_amount, status) VALUES (?, ?, ?)").run(supplierRes.id, pTotal, 'received').lastInsertRowid;
          db.prepare("INSERT INTO purchase_items (purchase_id, product_id, quantity, price) VALUES (?, ?, ?, ?)").run(pId, item.pid, item.qty, item.price);
          db.prepare("INSERT INTO product_batches (product_id, purchase_id, quantity, remaining_quantity, purchase_price) VALUES (?, ?, ?, ?, ?)").run(item.pid, pId, item.qty, item.qty, item.price);
          db.prepare("UPDATE products SET stock_quantity = stock_quantity + ? WHERE product_id = ?").run(item.qty, item.pid);
        }
      }

      // 2. Seed 3 Orders & Deliveries
      if (orderCount.count === 0) {
        const dItems = [
          { pid: "A000000001", qty: 10, price: 550 },
          { pid: "A000000002", qty: 5, price: 650 },
          { pid: "A000000003", qty: 20, price: 120 }
        ];
        for (const item of dItems) {
          const dTotal = item.qty * item.price;
          const oId = db.prepare("INSERT INTO orders (shop_id, order_booker_id, total_amount, status) VALUES (?, ?, ?, ?)").run(shopRes.id, bookerRes.id, dTotal, 'delivered').lastInsertRowid;
          const oiId = db.prepare("INSERT INTO order_items (order_id, product_id, quantity, price, status) VALUES (?, ?, ?, ?, ?)").run(oId, item.pid, item.qty, item.price, 'delivered').lastInsertRowid;
          const delId = db.prepare("INSERT INTO deliveries (order_id, shop_id, salesman_id, total_amount, status) VALUES (?, ?, ?, ?, ?)").run(oId, shopRes.id, salesmanRes.id, dTotal, 'completed').lastInsertRowid;
          db.prepare("INSERT INTO delivery_items (delivery_id, order_item_id, product_id, quantity, price) VALUES (?, ?, ?, ?, ?)").run(delId, oiId, item.pid, item.qty, item.price);
          
          db.prepare("UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?").run(item.qty, item.pid);
          db.prepare("UPDATE product_batches SET remaining_quantity = remaining_quantity - ? WHERE product_id = ? AND remaining_quantity >= ?").run(item.qty, item.pid, item.qty);
          
          const lastBal = db.prepare("SELECT balance FROM client_ledger WHERE shop_id = ? ORDER BY id DESC LIMIT 1").get(shopRes.id) as any;
          db.prepare("INSERT INTO client_ledger (shop_id, description, debit, balance) VALUES (?, ?, ?, ?)").run(shopRes.id, `Delivery #${delId}`, dTotal, (lastBal?.balance || 0) + dTotal);
        }
      }

      // 3. Seed 3 Returns
      if (returnCount.count === 0) {
        const activeDels = db.prepare("SELECT d.id as del_id, di.id as di_id, d.shop_id, di.product_id, di.quantity, di.price FROM deliveries d JOIN delivery_items di ON d.id = di.delivery_id LIMIT 3").all() as any[];
        for (const r of activeDels) {
          const rQty = 1;
          const rTotal = rQty * r.price;
          const retId = db.prepare("INSERT INTO returns (shop_id, total_amount, status) VALUES (?, ?, ?)").run(r.shop_id, rTotal, 'completed').lastInsertRowid;
          db.prepare("INSERT INTO return_items (return_id, delivery_id, delivery_item_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?, ?, ?)").run(retId, r.del_id, r.di_id, r.product_id, rQty, r.price);
          db.prepare("UPDATE products SET stock_quantity = stock_quantity + ? WHERE product_id = ?").run(rQty, r.product_id);
        }
      }
    })();
  }
} catch (err) {
  console.error("CRITICAL: Initial seeding check failed:", err);
}

// Seed Units separately
try {
  const unitCount = db.prepare("SELECT COUNT(*) as count FROM units").get() as { count: number };
  if (unitCount.count === 0) {
    db.transaction(() => {
      const initialUnits = [
        { code: 'KG', name: 'KILOGRAM', short: 'KGS' },
        { code: 'MT', name: 'METRIC TON', short: 'MT' },
        { code: 'PC', name: 'PIECES', short: 'PCS' },
        { code: 'GR', name: 'GRAM', short: 'GRM' },
        { code: 'L', name: 'LITER', short: 'LTR' },
        { code: 'BX', name: 'BOX', short: 'BOX' },
        { code: 'DZ', name: 'DOZEN', short: 'DZN' },
        { code: 'CT', name: 'CARTON', short: 'CTN' },
        { code: 'EA', name: 'EACH', short: 'EA' },
        { code: 'PK', name: 'PACK', short: 'PACK' }
      ];

      const stmt = db.prepare("INSERT OR IGNORE INTO units (unit_code, name, short_name, status) VALUES (?, ?, ?, ?)");
      for (const u of initialUnits) {
        stmt.run(u.code, u.name, u.short, 1);
      }
    })();
  }
} catch (err) {
  console.error("Unit seeding failed:", err);
}

// Seed missing deliveries for delivered orders (Idempotent catch-up)
try {
  const deliveryCount = db.prepare("SELECT COUNT(*) as count FROM deliveries").get() as { count: number };
  if (deliveryCount.count === 0) {
    db.transaction(() => {
      const deliveredOrders = db.prepare("SELECT * FROM orders WHERE status = 'delivered'").all() as any[];
      const firstSalesman = db.prepare("SELECT id FROM salesmen LIMIT 1").get() as { id: number } | undefined;
      
      if (deliveredOrders.length > 0 && firstSalesman) {
        const deliveryStmt = db.prepare("INSERT INTO deliveries (order_id, shop_id, salesman_id, total_amount, status) VALUES (?, ?, ?, ?, ?)");
        const deliveryItemStmt = db.prepare("INSERT INTO delivery_items (delivery_id, order_item_id, product_id, quantity, price) VALUES (?, ?, ?, ?, ?)");
        
        for (const order of deliveredOrders) {
          const delivery = deliveryStmt.run(order.id, order.shop_id, firstSalesman.id, order.total_amount, 'completed');
          const deliveryId = delivery.lastInsertRowid;
          
          const orderItems = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(order.id) as any[];
          for (const oi of orderItems) {
            deliveryItemStmt.run(deliveryId, oi.id, oi.product_id, oi.quantity, oi.price);
          }
        }
        console.log(`Seeded ${deliveredOrders.length} deliveries for existing delivered orders.`);
      }
    })();
  }
} catch (err) {
  console.warn("Delivery catch-up seeding failed:", err);
}

// Seed Locations (Idempotent)
try {
  const countryCount = db.prepare("SELECT COUNT(*) as count FROM countries").get() as { count: number };
  if (countryCount.count === 0) {
    db.transaction(() => {
      const country = db.prepare("INSERT OR IGNORE INTO countries (name) VALUES (?)").run("Pakistan");
      const countryId = country.lastInsertRowid || (db.prepare("SELECT id FROM countries WHERE name = ?").get("Pakistan") as any)?.id;

      if (countryId) {
        const province = db.prepare("INSERT OR IGNORE INTO provinces (country_id, name) VALUES (?, ?)").run(countryId, "Sindh");
        const provinceId = province.lastInsertRowid || (db.prepare("SELECT id FROM provinces WHERE name = ? AND country_id = ?").get("Sindh", countryId) as any)?.id;

        if (provinceId) {
          const city = db.prepare("INSERT OR IGNORE INTO cities (province_id, name) VALUES (?, ?)").run(provinceId, "Karachi");
          const cityId = city.lastInsertRowid || (db.prepare("SELECT id FROM cities WHERE name = ? AND province_id = ?").get("Karachi", provinceId) as any)?.id;

          if (cityId) {
            const locationData = [
              {
                town: "Gulshan-e-Iqbal Town",
                areas: [
                  {
                    name: "Gulshan-e-Iqbal",
                    subareas: ["UC-2 Gulshan-e-Iqbal (Main)", "UC-1 Essa Nagri", "UC-8 National Stadium Area"]
                  },
                  {
                    name: "Gulistan-e-Jauhar (Safoora Town)",
                    subareas: ["UC-7 Gulistan-e-Jauhar", "UC-8 Safari Park Area", "UC-6 Pahlwan Goth"]
                  },
                  {
                    name: "Gulzar-e-Hijri",
                    subareas: ["UC-2 Gulzar-e-Hijri", "UC-3 Sachal Goth", "UC-4 Al-Azhar Garden"]
                  }
                ]
              },
              {
                town: "North Nazimabad Town",
                areas: [
                  {
                    name: "North Nazimabad",
                    subareas: ["UC-1 Sir Syed Town", "UC-5 Taimooria", "UC-7 Hyderi"]
                  },
                  {
                    name: "Buffer Zone",
                    subareas: ["UC-4 Buffer Zone I", "UC-6 Sakhi Hassan", "UC-10 Shadman Town"]
                  },
                  {
                    name: "Sakhi Hassan & Surrounds",
                    subareas: ["UC-2 Farooq-e-Azam", "UC-3 Siddiq-e-Akbar", "UC-9 Pahar Gunj"]
                  }
                ]
              },
              {
                town: "Saddar Town",
                areas: [
                  {
                    name: "Saddar & Civil Lines",
                    subareas: ["UC-9 Hijrat Colony", "UC-10 Frere Town", "UC-11 Clifton / Boat Basin"]
                  },
                  {
                    name: "Garden & Kharadar",
                    subareas: ["UC-4 Nanakwara", "UC-5 Old Town (Kharadar)", "UC-6 City Railway Colony"]
                  },
                  {
                    name: "Aram Bagh",
                    subareas: ["UC-1 Bhim Pura", "UC-2 Ranchore Line", "UC-3 Gazdarabad"]
                  }
                ]
              }
            ];

            const townStmt = db.prepare("INSERT OR IGNORE INTO towns (city_id, name) VALUES (?, ?)");
            const areaStmt = db.prepare("INSERT OR IGNORE INTO areas (town_id, name) VALUES (?, ?)");
            const subareaStmt = db.prepare("INSERT OR IGNORE INTO subareas (area_id, name) VALUES (?, ?)");
            const findTownStmt = db.prepare("SELECT id FROM towns WHERE name = ? AND city_id = ?");
            const findAreaStmt = db.prepare("SELECT id FROM areas WHERE name = ? AND town_id = ?");

            for (const t of locationData) {
              const town = townStmt.run(cityId, t.town);
              const townId = town.lastInsertRowid || (findTownStmt.get(t.town, cityId) as any)?.id;

              if (townId) {
                for (const a of t.areas) {
                  const area = areaStmt.run(townId, a.name);
                  const areaId = area.lastInsertRowid || (findAreaStmt.get(a.name, townId) as any)?.id;

                  if (areaId) {
                    for (const sa of a.subareas) {
                      subareaStmt.run(areaId, sa);
                    }
                  }
                }
              }
            }
          }
        }
      }
    })();
  }
} catch (err) {
  console.warn("Location seeding skipped or failed:", err);
}

// Seed Area Wise Report Data
function seedAreaWiseReportData() {
  try {
    // 1. Ensure material group '00001' exists
    db.prepare("INSERT OR IGNORE INTO material_groups (id, name, description) VALUES (?, ?, ?)").run("00001", "Sugar & Sweeteners", "Sweetening agents");

    // 2. Ensure products exist
    const productsToSeed = [
      { id: "PR-SUGAR-W", name: "WHITE SUGAR", brand: "Zensoft", mg: "00001", pp: 90, tp: 100, rp: 100, stock: 5000, unit: "1kgs" },
      { id: "PR-SUGAR-B", name: "BROWN SUGAR", brand: "Zensoft", mg: "00001", pp: 85, tp: 94, rp: 94, stock: 5000, unit: "500grm" },
      { id: "PR-SUGAR-C", name: "CASTER SUGAR", brand: "Zensoft", mg: "00001", pp: 120, tp: 130, rp: 130, stock: 5000, unit: "500grm" }
    ];

    const productStmt = db.prepare(`
      INSERT OR IGNORE INTO products (
        product_id, product_name, brand, material_group_id, purchase_price, 
        trade_price, retail_price, stock_quantity, unit, conversion_value, 
        conversion_unit, min_stock_level, reorder_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'EA', 10, 20)
    `);
    const batchStmt = db.prepare("INSERT OR IGNORE INTO product_batches (product_id, purchase_id, quantity, remaining_quantity, purchase_price) VALUES (?, ?, ?, ?, ?)");

    for (const p of productsToSeed) {
      productStmt.run(p.id, p.name, p.brand, p.mg, p.pp, p.tp, p.rp, p.stock, p.unit);
      batchStmt.run(p.id, null, p.stock, p.stock, p.pp);
    }

    // 3. Ensure order bookers exist
    const bookersToSeed = ["MUHAMMAD ADNAN", "NADEEM HAIDER", "TAUQEER"];
    const bookerStmt = db.prepare("INSERT OR IGNORE INTO order_bookers (name, father_name, cell_no, cnic_no, joining_date) VALUES (?, 'Father', ?, '42101-0000000-1', '2021-01-01')");
    for (const b of bookersToSeed) {
      const phone = b === "MUHAMMAD ADNAN" ? "03009990001" : b === "NADEEM HAIDER" ? "03009990002" : "03009990003";
      bookerStmt.run(b, phone);
    }

    // 4. Ensure shops exist
    const shopsToSeed = [
      { name: "HYPER LINK SUPER MARKET & PHARMACY", location: "BLOCK 10", phone: "03008880001" },
      { name: "ZAIQA MASALA", location: "BLOCK 3", phone: "03008880002" },
      { name: "B S MART", location: "BLOCK I", phone: "03008880003" },
      { name: "LBM MART", location: "QUETTA TOWN", phone: "03008880004" },
      { name: "OCTOBER NOW", location: "SADDAR", phone: "03008880005" },
      { name: "FUTURE MART", location: "SECTOR 11-A", phone: "03008880006" },
      { name: "M.D MART", location: "SECTOR 11-A", phone: "03008880007" },
      { name: "MD MART", location: "SECTOR 11-A", phone: "03008880008" },
      { name: "USMAN GENERAL STORE", location: "SECTOR 15 A", phone: "03008880009" },
      { name: "BIN MUMTAZ CASH AND CARRY", location: "SURJANI TOWN", phone: "03008880010" },
      { name: "FJ FOODS STORE", location: "SURJANI TOWN", phone: "03008880011" }
    ];

    const shopStmt = db.prepare("INSERT OR IGNORE INTO shops (shop_name, owner_name, location, phone, credit_limit) VALUES (?, 'Owner', ?, ?, 500000)");
    for (const s of shopsToSeed) {
      shopStmt.run(s.name, s.location, s.phone);
    }

    // 5. Check if we already have transactions for June 16, 2021
    const invoiceCheck = db.prepare("SELECT COUNT(*) as count FROM invoices WHERE invoice_date LIKE '2021-06-16%'").get() as { count: number };
    if (invoiceCheck.count > 0) {
      console.log("[Database] Area Wise Item Party Summary report data already exists.");
      return;
    }

    console.log("[Database] Seeding Area Wise Item Party Summary report data...");

    const getShopId = (name: string) => {
      const res = db.prepare("SELECT id FROM shops WHERE shop_name = ?").get(name) as any;
      if (!res) throw new Error(`Shop ${name} not found`);
      return res.id;
    };
    const getBookerId = (name: string) => {
      const res = db.prepare("SELECT id FROM order_bookers WHERE name = ?").get(name) as any;
      if (!res) throw new Error(`Booker ${name} not found`);
      return res.id;
    };
    const salesmanId = (db.prepare("SELECT id FROM salesmen LIMIT 1").get() as any)?.id || 1;

    const reportData = [
      { shop: "HYPER LINK SUPER MARKET & PHARMACY", booker: "MUHAMMAD ADNAN", pid: "PR-SUGAR-W", qty: 800, rate: 100, amount: 40000 },
      { shop: "ZAIQA MASALA", booker: "MUHAMMAD ADNAN", pid: "PR-SUGAR-W", qty: 120, rate: 100, amount: 6000 },
      { shop: "ZAIQA MASALA", booker: "MUHAMMAD ADNAN", pid: "PR-SUGAR-B", qty: 16, rate: 94, amount: 752 },
      { shop: "B S MART", booker: "MUHAMMAD ADNAN", pid: "PR-SUGAR-W", qty: 0, rate: 100, amount: 0 },
      { shop: "B S MART", booker: "MUHAMMAD ADNAN", pid: "PR-SUGAR-B", qty: 16, rate: 94, amount: 752 },
      { shop: "LBM MART", booker: "MUHAMMAD ADNAN", pid: "PR-SUGAR-W", qty: 400, rate: 100, amount: 20000 },
      { shop: "OCTOBER NOW", booker: "NADEEM HAIDER", pid: "PR-SUGAR-W", qty: 520, rate: 100, amount: 26000 },
      { shop: "FUTURE MART", booker: "TAUQEER", pid: "PR-SUGAR-W", qty: 0, rate: 100, amount: 0 },
      { shop: "FUTURE MART", booker: "TAUQEER", pid: "PR-SUGAR-B", qty: 0, rate: 94, amount: 0 },
      { shop: "FUTURE MART", booker: "TAUQEER", pid: "PR-SUGAR-C", qty: 0, rate: 130, amount: 0 },
      { shop: "M.D MART", booker: "TAUQEER", pid: "PR-SUGAR-W", qty: 40, rate: 100, amount: 2000 },
      { shop: "M.D MART", booker: "TAUQEER", pid: "PR-SUGAR-B", qty: 12, rate: 94, amount: 564 },
      { shop: "MD MART", booker: "TAUQEER", pid: "PR-SUGAR-W", qty: 0, rate: 100, amount: 0 },
      { shop: "MD MART", booker: "TAUQEER", pid: "PR-SUGAR-B", qty: 0, rate: 94, amount: 0 },
      { shop: "USMAN GENERAL STORE", booker: "MUHAMMAD ADNAN", pid: "PR-SUGAR-W", qty: 40, rate: 100, amount: 2000 },
      { shop: "BIN MUMTAZ CASH AND CARRY", booker: "TAUQEER", pid: "PR-SUGAR-W", qty: 200, rate: 100, amount: 10000 },
      { shop: "BIN MUMTAZ CASH AND CARRY", booker: "TAUQEER", pid: "PR-SUGAR-B", qty: 32, rate: 94, amount: 1504 },
      { shop: "BIN MUMTAZ CASH AND CARRY", booker: "TAUQEER", pid: "PR-SUGAR-C", qty: 20, rate: 130, amount: 1300 },
      { shop: "FJ FOODS STORE", booker: "TAUQEER", pid: "PR-SUGAR-W", qty: 120, rate: 100, amount: 6000 },
      { shop: "FJ FOODS STORE", booker: "TAUQEER", pid: "PR-SUGAR-B", qty: 10, rate: 94, amount: 470 },
      { shop: "FJ FOODS STORE", booker: "TAUQEER", pid: "PR-SUGAR-C", qty: 10, rate: 130, amount: 650 }
    ];

    const shopItemsMap = new Map<string, any[]>();
    for (const r of reportData) {
      if (!shopItemsMap.has(r.shop)) {
        shopItemsMap.set(r.shop, []);
      }
      shopItemsMap.get(r.shop)!.push(r);
    }

    db.transaction(() => {
      for (const [shopName, items] of shopItemsMap.entries()) {
        const sId = getShopId(shopName);
        const bId = getBookerId(items[0].booker);

        for (let invIdx = 1; invIdx <= 2; invIdx++) {
          let orderTotal = 0;
          for (const item of items) {
            orderTotal += item.amount / 2;
          }

          const oId = db.prepare(`
            INSERT INTO orders (shop_id, order_booker_id, order_date, estimated_delivery_date, total_amount, status)
            VALUES (?, ?, '2021-06-16T10:00:00.000Z', '2021-06-16T18:00:00.000Z', ?, 'delivered')
          `).run(sId, bId, orderTotal).lastInsertRowid;

          const delId = db.prepare(`
            INSERT INTO deliveries (order_id, shop_id, salesman_id, delivery_date, status, total_amount)
            VALUES (?, ?, ?, '2021-06-16T14:00:00.000Z', 'completed', ?)
          `).run(oId, sId, salesmanId, orderTotal).lastInsertRowid;

          const invId = db.prepare(`
            INSERT INTO invoices (shop_id, invoice_date, gross_amount, total_discount, total_tax, net_amount, status)
            VALUES (?, '2021-06-16T15:00:00.000Z', ?, 0, 0, ?, 'paid')
          `).run(sId, orderTotal, orderTotal).lastInsertRowid;

          db.prepare("UPDATE deliveries SET invoice_id = ?, status = 'billed' WHERE id = ?").run(invId, delId);

          for (const item of items) {
            const halfQty = Math.floor(item.qty / 2);
            const finalQty = invIdx === 1 ? halfQty : (item.qty - halfQty);
            
            const halfAmt = item.amount / 2;
            const finalAmt = invIdx === 1 ? halfAmt : (item.amount - halfAmt);

            const oiId = db.prepare(`
              INSERT INTO order_items (order_id, product_id, quantity, price, status)
              VALUES (?, ?, ?, ?, 'delivered')
            `).run(oId, item.pid, finalQty, item.rate).lastInsertRowid;

            db.prepare(`
              INSERT INTO delivery_items (delivery_id, order_item_id, product_id, quantity, price)
              VALUES (?, ?, ?, ?, ?)
            `).run(delId, oiId, item.pid, finalQty, item.rate);

            db.prepare(`
              INSERT INTO invoice_items (
                invoice_id, delivery_id, delivery_item_id, product_id, 
                quantity, unit_price, trade_discount_pct, tax_pct, additional_tax_pct, special_discount_pct, net_amount
              )
              VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, 0, ?)
            `).run(invId, delId, oiId, item.pid, finalQty, item.rate, finalAmt);
          }
        }
      }
    })();

    console.log("[Database] Area Wise Item Party Summary report data successfully seeded!");
  } catch (err) {
    console.error("[Database Error] Seeding Area Wise Item Party Summary failed:", err);
  }
}

try {
  seedAreaWiseReportData();
} catch (e) {
  console.error("Area Wise Report Seeding execution failed:", e);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(morgan("dev"));
  app.use(express.json());

  // Authentication & User Management Routes
  app.post("/api/auth/login", (req, res) => {
    const { phone, username, name, identifier, password } = req.body;
    const loginIdentifier = (identifier || phone || username || name || "").toString().trim();
    const cleanPass = (password || "").toString().trim();

    if (!loginIdentifier || !cleanPass) {
      return res.status(400).json({ error: "Username/Phone and Password are required" });
    }

    try {
      const sanitizedPhone = loginIdentifier.replace(/[\s-]/g, '');
      const user = db.prepare(`
        SELECT u.id, u.name, u.role, u.phone, u.password, u.distributor_id,
               d.name as distributor_name, d.code as distributor_code
        FROM users u
        LEFT JOIN distributors d ON u.distributor_id = d.id
        WHERE LOWER(TRIM(u.phone)) = LOWER(?)
           OR LOWER(TRIM(u.name)) = LOWER(?)
           OR REPLACE(REPLACE(u.phone, ' ', ''), '-', '') = ?
      `).get(loginIdentifier, loginIdentifier, sanitizedPhone) as any;

      if (!user) {
        return res.status(401).json({ error: "User not found. Please check your username, name, or phone number." });
      }

      if (user.password !== cleanPass) {
        return res.status(401).json({ error: "Incorrect password. Please verify and try again." });
      }

      const { password: _, ...userSafe } = user;
      res.json({
        success: true,
        user: userSafe
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Login failed" });
    }
  });

  app.get("/api/users", (req, res) => {
    try {
      const users = db.prepare(`
        SELECT u.id, u.name, u.role, u.phone, u.distributor_id,
               d.name as distributor_name, d.code as distributor_code
        FROM users u
        LEFT JOIN distributors d ON u.distributor_id = d.id
        ORDER BY u.id ASC
      `).all();
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/users", (req, res) => {
    const { name, role, phone, password, distributor_id } = req.body;
    if (!name || !role || !phone || !password) {
      return res.status(400).json({ error: "All fields (name, role, phone, password) are required" });
    }
    if (role !== 'admin' && (!distributor_id || distributor_id === 'all')) {
      return res.status(400).json({ error: "Please select an assigned Distributor for this user" });
    }
    try {
      const distId = distributor_id && distributor_id !== 'all' ? Number(distributor_id) : null;
      const result = db.prepare("INSERT INTO users (name, role, phone, password, distributor_id) VALUES (?, ?, ?, ?, ?)").run(
        name.trim(), role.trim(), phone.trim(), password.trim(), distId
      );
      res.status(201).json({ id: result.lastInsertRowid, name, role, phone, distributor_id: distId });
    } catch (err: any) {
      if (err.message?.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ error: "A user with this phone number already exists" });
      }
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/users/:id", (req, res) => {
    const { name, role, phone, password, distributor_id } = req.body;
    if (!name || !role || !phone) {
      return res.status(400).json({ error: "Name, role, and phone are required" });
    }
    if (role !== 'admin' && (!distributor_id || distributor_id === 'all')) {
      return res.status(400).json({ error: "Please select an assigned Distributor for this user" });
    }
    try {
      const distId = distributor_id && distributor_id !== 'all' ? Number(distributor_id) : null;
      if (password && password.trim()) {
        db.prepare("UPDATE users SET name = ?, role = ?, phone = ?, password = ?, distributor_id = ? WHERE id = ?").run(
          name.trim(), role.trim(), phone.trim(), password.trim(), distId, req.params.id
        );
      } else {
        db.prepare("UPDATE users SET name = ?, role = ?, phone = ?, distributor_id = ? WHERE id = ?").run(
          name.trim(), role.trim(), phone.trim(), distId, req.params.id
        );
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/users/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Distributor Master API Routes (T-Code: DST01 / DIS01)
  app.get("/api/distributors", (req, res) => {
    try {
      const distributors = db.prepare(`
        SELECT d.*,
          (SELECT COUNT(*) FROM shops s WHERE s.distributor_id = d.id) as total_shops,
          (SELECT COUNT(*) FROM users u WHERE u.distributor_id = d.id) as total_users,
          (SELECT COUNT(*) FROM orders o WHERE o.distributor_id = d.id) as total_orders
        FROM distributors d
        ORDER BY d.id ASC
      `).all();
      res.json(distributors);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/distributors", (req, res) => {
    const { code, name, contact_person, phone, email, address, city, ntn_number, strn_number, status } = req.body;
    if (!code || !name) {
      return res.status(400).json({ error: "Distributor Code and Name are required" });
    }
    try {
      const result = db.prepare(`
        INSERT INTO distributors (code, name, contact_person, phone, email, address, city, ntn_number, strn_number, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        code.trim().toUpperCase(),
        name.trim(),
        contact_person?.trim() || null,
        phone?.trim() || null,
        email?.trim() || null,
        address?.trim() || null,
        city?.trim() || 'Karachi',
        ntn_number?.trim() || null,
        strn_number?.trim() || null,
        status || 'ACTIVE'
      );
      res.status(201).json({ id: result.lastInsertRowid, ...req.body });
    } catch (err: any) {
      if (err.message?.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ error: "A distributor with this code already exists" });
      }
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/distributors/:id", (req, res) => {
    const { id } = req.params;
    const { code, name, contact_person, phone, email, address, city, ntn_number, strn_number, status } = req.body;
    if (!code || !name) {
      return res.status(400).json({ error: "Distributor Code and Name are required" });
    }
    try {
      db.prepare(`
        UPDATE distributors 
        SET code = ?, name = ?, contact_person = ?, phone = ?, email = ?, address = ?, city = ?, ntn_number = ?, strn_number = ?, status = ?
        WHERE id = ?
      `).run(
        code.trim().toUpperCase(),
        name.trim(),
        contact_person?.trim() || null,
        phone?.trim() || null,
        email?.trim() || null,
        address?.trim() || null,
        city?.trim() || 'Karachi',
        ntn_number?.trim() || null,
        strn_number?.trim() || null,
        status || 'ACTIVE',
        id
      );
      res.json({ id: Number(id), ...req.body });
    } catch (err: any) {
      if (err.message?.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ error: "A distributor with this code already exists" });
      }
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/distributors/:id", (req, res) => {
    const { id } = req.params;
    try {
      const userCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE distributor_id = ?").get(id) as { count: number };
      const shopCount = db.prepare("SELECT COUNT(*) as count FROM shops WHERE distributor_id = ?").get(id) as { count: number };
      const orderCount = db.prepare("SELECT COUNT(*) as count FROM orders WHERE distributor_id = ?").get(id) as { count: number };
      if (userCount.count > 0 || shopCount.count > 0 || orderCount.count > 0) {
        return res.status(400).json({
          error: `Cannot delete distributor: It has ${userCount.count} user(s), ${shopCount.count} shop(s), and ${orderCount.count} order(s) attached.`
        });
      }
      db.prepare("DELETE FROM distributors WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Routes
  app.get("/api/stats", (req, res) => {
    try {
      const distId = req.query.distributor_id && req.query.distributor_id !== 'all' ? Number(req.query.distributor_id) : null;

      const orderWhere = distId ? `WHERE status = 'delivered' AND is_cancelled != 'X' AND (distributor_id = ${distId} OR distributor_id IS NULL)` : `WHERE status = 'delivered' AND is_cancelled != 'X'`;
      const pendingWhere = distId ? `WHERE status IN ('pending', 'partially_delivered') AND is_cancelled != 'X' AND (distributor_id = ${distId} OR distributor_id IS NULL)` : `WHERE status IN ('pending', 'partially_delivered') AND is_cancelled != 'X'`;
      const shopWhere = distId ? `WHERE distributor_id = ${distId} OR distributor_id IS NULL` : ``;

      const totalSales = db.prepare(`SELECT SUM(total_amount) as total FROM orders ${orderWhere}`).get() as { total: number };
      const pendingOrders = db.prepare(`SELECT COUNT(*) as count FROM orders ${pendingWhere}`).get() as { count: number };
      const lowStock = db.prepare("SELECT COUNT(*) as count FROM products WHERE stock_quantity <= min_stock_level").get() as { count: number };
      const totalShops = db.prepare(`SELECT COUNT(*) as count FROM shops ${shopWhere}`).get() as { count: number };
      
      const statusCounts = db.prepare(`
        SELECT status as name, COUNT(*) as value 
        FROM orders 
        WHERE is_cancelled != 'X' ${distId ? `AND (distributor_id = ${distId} OR distributor_id IS NULL)` : ''}
        GROUP BY status
      `).all() as { name: string; value: number }[];

      const formattedStatusCounts = statusCounts.map(s => ({
        name: (s.name || 'unknown').split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        value: s.value
      }));

      // 1. Sales by Town
      const salesByTown = db.prepare(`
        SELECT s.location as name, SUM(o.total_amount) as value 
        FROM orders o
        JOIN shops s ON o.shop_id = s.id
        WHERE o.status = 'delivered' ${distId ? `AND (o.distributor_id = ${distId} OR o.distributor_id IS NULL)` : ''}
        GROUP BY s.location
        ORDER BY value DESC
        LIMIT 5
      `).all() as { name: string; value: number }[];

      // 2. Top Order Bookers
      const topOrderBookers = db.prepare(`
        SELECT ob.name as name, SUM(o.total_amount) as value 
        FROM orders o
        JOIN order_bookers ob ON o.order_booker_id = ob.id
        WHERE o.status = 'delivered' ${distId ? `AND (o.distributor_id = ${distId} OR o.distributor_id IS NULL)` : ''}
        GROUP BY ob.name
        ORDER BY value DESC
        LIMIT 5
      `).all() as { name: string; value: number }[];

      // 3. Sales Trend (Last 7 Days)
      const salesTrend = db.prepare(`
        SELECT strftime('%Y-%m-%d', order_date) as name, SUM(total_amount) as value 
        FROM orders 
        WHERE order_date >= date('now', '-7 days') AND status = 'delivered' ${distId ? `AND (distributor_id = ${distId} OR distributor_id IS NULL)` : ''}
        GROUP BY name
        ORDER BY name ASC
      `).all() as { name: string; value: number }[];

      // 4. Sales by Material Group
      const categorySales = db.prepare(`
        SELECT mg.mat_description as name, SUM(oi.quantity * oi.price) as value 
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        JOIN material_groups mg ON p.material_group_id = mg.mat_gp
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'delivered' ${distId ? `AND (o.distributor_id = ${distId} OR o.distributor_id IS NULL)` : ''}
        GROUP BY mg.mat_description
        ORDER BY value DESC
        LIMIT 5
      `).all() as { name: string; value: number }[];

      res.json({
        totalSales: totalSales.total || 0,
        pendingOrders: pendingOrders.count,
        lowStock: lowStock.count,
        totalShops: totalShops.count,
        orderStatusCounts: formattedStatusCounts,
        salesByTown,
        topOrderBookers,
        salesTrend,
        categorySales
      });
    } catch (err: any) {
      console.error("Dashboard stats fetch failed:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/batch-init", (req, res) => {
    try {
      const distId = req.query.distributor_id && req.query.distributor_id !== 'all' ? Number(req.query.distributor_id) : null;

      const orderWhere = distId ? `WHERE (o.distributor_id = ${distId} OR o.distributor_id IS NULL)` : '';
      const statsOrderWhere = distId ? `WHERE status = 'delivered' AND (distributor_id = ${distId} OR distributor_id IS NULL)` : `WHERE status = 'delivered'`;
      const pendingWhere = distId ? `WHERE status = 'pending' AND (distributor_id = ${distId} OR distributor_id IS NULL)` : `WHERE status = 'pending'`;
      const shopWhere = distId ? `WHERE (distributor_id = ${distId} OR distributor_id IS NULL)` : '';
      const purchaseWhere = distId ? `WHERE (p.distributor_id = ${distId} OR p.distributor_id IS NULL)` : '';
      const loadPlanWhere = distId ? `WHERE (lp.distributor_id = ${distId} OR lp.distributor_id IS NULL)` : '';
      const deliveryWhere = distId ? `WHERE (d.distributor_id = ${distId} OR d.distributor_id IS NULL)` : '';
      const returnWhere = distId ? `WHERE (r.distributor_id = ${distId} OR r.distributor_id IS NULL)` : '';
      const invoiceWhere = distId ? `WHERE (i.distributor_id = ${distId} OR i.distributor_id IS NULL)` : '';
      const bookerWhere = distId ? `WHERE (distributor_id = ${distId} OR distributor_id IS NULL)` : '';
      const salesmanWhere = distId ? `WHERE (distributor_id = ${distId} OR distributor_id IS NULL)` : '';
      const driverWhere = distId ? `WHERE (distributor_id = ${distId} OR distributor_id IS NULL)` : '';

      const stats = db.prepare(`SELECT SUM(total_amount) as total FROM orders ${statsOrderWhere}`).get() as any;
      const pendingOrders = db.prepare(`SELECT COUNT(*) as count FROM orders ${pendingWhere}`).get() as any;
      const lowStock = db.prepare("SELECT COUNT(*) as count FROM products WHERE stock_quantity <= min_stock_level").get() as any;
      const totalShops = db.prepare(`SELECT COUNT(*) as count FROM shops ${shopWhere}`).get() as any;
      const statusCounts = db.prepare(`SELECT status as name, COUNT(*) as value FROM orders ${orderWhere} GROUP BY status`).all();
      const salesTrend = db.prepare(`SELECT strftime('%Y-%m-%d', order_date) as name, SUM(total_amount) as value FROM orders WHERE order_date >= date('now', '-7 days') AND status = 'delivered' ${distId ? `AND (distributor_id = ${distId} OR distributor_id IS NULL)` : ''} GROUP BY name ORDER BY name ASC`).all();

      const distributors = db.prepare(`
        SELECT d.*,
          (SELECT COUNT(*) FROM shops s WHERE s.distributor_id = d.id) as total_shops,
          (SELECT COUNT(*) FROM users u WHERE u.distributor_id = d.id) as total_users,
          (SELECT COUNT(*) FROM orders o WHERE o.distributor_id = d.id) as total_orders
        FROM distributors d
        ORDER BY d.id ASC
      `).all();

      const products = db.prepare("SELECT p.*, mg.mat_description as material_group_name FROM products p LEFT JOIN material_groups mg ON p.material_group_id = mg.mat_gp").all();
      const shops = db.prepare(`SELECT * FROM shops ${shopWhere}`).all();
      const suppliers = db.prepare("SELECT * FROM suppliers").all();
      const orders = db.prepare(`
        SELECT o.*, r.shop_name, ob.name as order_booker_name,
        (SELECT GROUP_CONCAT(COALESCE(p.product_name, oi.product_id), ', ') FROM order_items oi LEFT JOIN products p ON oi.product_id = p.product_id WHERE oi.order_id = o.id) as items_summary
        FROM orders o 
        LEFT JOIN shops r ON o.shop_id = r.id 
        LEFT JOIN order_bookers ob ON o.order_booker_id = ob.id 
        ${orderWhere}
        ORDER BY o.order_date DESC
      `).all();

      const purchases = db.prepare(`
        SELECT p.*, s.name as supplier_name,
        (SELECT GROUP_CONCAT(COALESCE(prod.product_name, pi.product_id), ', ') FROM purchase_items pi LEFT JOIN products prod ON pi.product_id = prod.product_id WHERE pi.purchase_id = p.id) as items_summary
        FROM purchases p 
        LEFT JOIN suppliers s ON p.supplier_id = s.id 
        ${purchaseWhere}
        ORDER BY p.purchase_date DESC
      `).all();

      const loadPlans = db.prepare(`
        SELECT lp.*, d.name as driver_name,
        (SELECT GROUP_CONCAT('ORD-' || lpi.order_id, ', ') FROM load_plan_items lpi WHERE lpi.plan_id = lp.id) as items_summary
        FROM load_plans lp 
        LEFT JOIN drivers d ON lp.driver_id = d.id 
        ${loadPlanWhere}
        ORDER BY lp.plan_date DESC
      `).all();

      const materialGroups = db.prepare("SELECT * FROM material_groups").all();
      const drivers = db.prepare(`SELECT * FROM drivers ${driverWhere}`).all();
      const orderBookers = db.prepare(`SELECT * FROM order_bookers ${bookerWhere}`).all();
      const salesmen = db.prepare(`SELECT * FROM salesmen ${salesmanWhere}`).all();
      const units = db.prepare("SELECT * FROM units").all();

      const deliveries = db.prepare(`
        SELECT d.*, o.id as order_ref, r.shop_name, s.name as salesman_name,
        (SELECT GROUP_CONCAT(COALESCE(p.product_name, di.product_id), ', ') FROM delivery_items di LEFT JOIN products p ON di.product_id = p.product_id WHERE di.delivery_id = d.id) as items_summary
        FROM deliveries d 
        LEFT JOIN orders o ON d.order_id = o.id 
        LEFT JOIN shops r ON (d.shop_id = r.id OR o.shop_id = r.id) 
        LEFT JOIN salesmen s ON d.salesman_id = s.id 
        ${deliveryWhere}
        ORDER BY d.delivery_date DESC
      `).all();

      const returns = db.prepare(`
        SELECT r.*, s.shop_name,
        (SELECT GROUP_CONCAT(COALESCE(p.product_name, ret.product_id), ', ') FROM return_items ret LEFT JOIN products p ON ret.product_id = p.product_id WHERE ret.return_id = r.id) as items_summary
        FROM returns r 
        LEFT JOIN shops s ON r.shop_id = s.id 
        ${returnWhere}
        ORDER BY r.return_date DESC
      `).all();

      const invoices = db.prepare(`
        SELECT i.*, s.shop_name,
        (SELECT GROUP_CONCAT(COALESCE(p.product_name, ii.product_id), ', ') FROM invoice_items ii LEFT JOIN products p ON ii.product_id = p.product_id WHERE ii.invoice_id = i.id) as items_summary
        FROM invoices i 
        LEFT JOIN shops s ON i.shop_id = s.id 
        ${invoiceWhere}
        ORDER BY i.created_at DESC
      `).all();
      
      const valuation = db.prepare(`
        SELECT 
          SUM(remaining_quantity * pb.purchase_price) as totalValueAtPP,
          SUM(remaining_quantity * p.trade_price) as totalPotentialRevenueAtTP
        FROM product_batches pb
        JOIN products p ON pb.product_id = p.product_id
        WHERE remaining_quantity > 0
      `).get() as any;

      // Mock daily sales for chart
      const chartData = [
        { name: "Mon", sales: 45000 },
        { name: "Tue", sales: 52000 },
        { name: "Wed", sales: 48000 },
        { name: "Thu", sales: 61000 },
        { name: "Fri", sales: 55000 },
        { name: "Sat", sales: 67000 },
        { name: "Sun", sales: 42000 },
      ];

      res.json({
        stats: {
          totalSales: stats.total || 0,
          pendingOrders: pendingOrders.count || 0,
          lowStock: lowStock.count || 0,
          totalShops: totalShops.count || 0,
          orderStatusCounts: statusCounts.map((s: any) => ({
            name: (s.name || 'unknown').split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            value: s.value
          })),
          salesTrend
        },
        distributors,
        products,
        shops,
        suppliers,
        orders,
        purchases,
        loadPlans,
        materialGroups,
        drivers,
        orderBookers,
        salesmen,
        units,
        deliveries,
        returns,
        invoices,
        valuation: {
          totalValueAtPP: valuation.totalValueAtPP || 0,
          totalPotentialRevenueAtTP: valuation.totalPotentialRevenueAtTP || 0,
          totalPotentialProfit: (valuation.totalPotentialRevenueAtTP || 0) - (valuation.totalValueAtPP || 0),
          averageMarginPercent: valuation.totalPotentialRevenueAtTP > 0 ? (((valuation.totalPotentialRevenueAtTP || 0) - (valuation.totalValueAtPP || 0)) / valuation.totalPotentialRevenueAtTP) * 100 : 0
        },
        chartData
      });
    } catch (err: any) {
      console.error("Batch init failed:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Material Groups API
  app.get("/api/material-groups", (req, res) => {
    const groups = db.prepare("SELECT * FROM material_groups").all();
    res.json(groups);
  });

  // Units API
  app.get("/api/units", (req, res) => {
    const units = db.prepare("SELECT * FROM units").all();
    res.json(units);
  });

  app.post("/api/units", (req, res) => {
    const { unit_code, name, short_name, status } = req.body;
    try {
      const result = db.prepare("INSERT INTO units (unit_code, name, short_name, status) VALUES (?, ?, ?, ?)").run(unit_code, name, short_name, status);
      res.json({ id: result.lastInsertRowid, ...req.body });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put("/api/units/:id", (req, res) => {
    const { id } = req.params;
    const { unit_code, name, short_name, status } = req.body;
    try {
      db.prepare("UPDATE units SET unit_code = ?, name = ?, short_name = ?, status = ? WHERE id = ?").run(unit_code, name, short_name, status, id);
      res.json({ id, ...req.body });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/units/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM units WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: "Failed to delete unit. It may be in use." });
    }
  });

  app.post("/api/material-groups", (req, res) => {
    const { mat_gp, mat_description } = req.body;
    try {
      db.prepare("INSERT INTO material_groups (mat_gp, mat_description) VALUES (?, ?)").run(mat_gp, mat_description);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to create material group" });
    }
  });

  app.put("/api/material-groups/:id", (req, res) => {
    const { mat_description } = req.body;
    db.prepare("UPDATE material_groups SET mat_description = ? WHERE mat_gp = ?").run(mat_description, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/material-groups/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM material_groups WHERE mat_gp = ?").run(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete material group. It may be in use." });
    }
  });

  app.get("/api/products", (req, res) => {
    const products = db.prepare(`
      SELECT p.*, mg.mat_description as material_group_name,
             (SELECT COALESCE(SUM(quantity), 0) FROM product_batches WHERE product_batches.product_id = p.product_id AND purchase_id IS NULL) AS opening_stock
      FROM products p 
      LEFT JOIN material_groups mg ON p.material_group_id = mg.mat_gp
    `).all();
    res.json(products);
  });

  function generateProductId() {
    const lastProduct = db.prepare("SELECT product_id FROM products WHERE product_id LIKE 'A%' ORDER BY product_id DESC LIMIT 1").get() as { product_id: string } | undefined;
    if (!lastProduct) return "A000000001";
    const lastNum = parseInt(lastProduct.product_id.substring(1));
    return "A" + (lastNum + 1).toString().padStart(9, '0');
  }

  app.post("/api/products", (req, res) => {
    const { product_name, brand, material_group_id, purchase_price, trade_price, retail_price, unit, conversion_value, conversion_unit, min_stock_level, reorder_level } = req.body;
    const opening_stock = req.body.opening_stock !== undefined ? Number(req.body.opening_stock) : Number(req.body.stock_quantity || 0);
    const pPrice = Number(purchase_price) || 0;
    const initialMap = pPrice;
    const initialVal = round2(opening_stock * pPrice);
    const product_id = generateProductId();
    
    const transaction = db.transaction(() => {
      db.prepare("INSERT INTO products (product_id, product_name, brand, material_group_id, purchase_price, trade_price, retail_price, stock_quantity, inventory_value, moving_average_price, unit, conversion_value, conversion_unit, min_stock_level, reorder_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
        product_id, product_name, brand, material_group_id, pPrice, trade_price, retail_price, opening_stock, initialVal, initialMap, unit || 'EACH', conversion_value || 1, conversion_unit || 'EACH', min_stock_level || 10, reorder_level || 20
      );

      if (opening_stock > 0) {
        db.prepare("INSERT INTO product_batches (product_id, purchase_id, quantity, remaining_quantity, purchase_price) VALUES (?, ?, ?, ?, ?)").run(
          product_id, null, opening_stock, opening_stock, pPrice
        );

        db.prepare(`
          INSERT INTO inventory_audit_log 
          (product_id, transaction_type, reference_id, qty_change, unit_price, previous_stock, previous_value, previous_map, new_stock, new_value, new_map, notes)
          VALUES (?, 'ADJUSTMENT', 'INITIAL_STOCK', ?, ?, 0, 0, 0, ?, ?, ?, 'Initial Opening Stock')
        `).run(product_id, opening_stock, pPrice, opening_stock, initialVal, initialMap);
      }
    });

    try {
      transaction();
      res.json({ product_id });
    } catch (err) {
      console.error("Failed to create product", err);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", (req, res) => {
    const { id } = req.params;
    const { product_name, brand, material_group_id, purchase_price, trade_price, retail_price, unit, conversion_value, conversion_unit, min_stock_level, reorder_level } = req.body;
    
    const newOpeningStock = req.body.opening_stock !== undefined ? Number(req.body.opening_stock) : null;
    
    const transaction = db.transaction(() => {
      // Get current product details
      const currentProduct = db.prepare("SELECT * FROM products WHERE product_id = ?").get(id) as any;
      if (!currentProduct) {
        throw new Error("Product not found");
      }

      let updatedStockQuantity = currentProduct.stock_quantity;

      if (newOpeningStock !== null) {
        // Query current sum of opening stock (where purchase_id IS NULL)
        const systemOpeningResult = db.prepare(`
          SELECT COALESCE(SUM(quantity), 0) AS total
          FROM product_batches
          WHERE product_id = ? AND purchase_id IS NULL
        `).get(id) as { total: number };
        const oldOpeningStock = systemOpeningResult ? systemOpeningResult.total : 0;
        const diff = newOpeningStock - oldOpeningStock;

        if (diff !== 0) {
          // Update product's stock_quantity
          updatedStockQuantity = currentProduct.stock_quantity + diff;

          // Find the first opening stock batch
          const firstBatch = db.prepare("SELECT * FROM product_batches WHERE product_id = ? AND purchase_id IS NULL ORDER BY id ASC LIMIT 1").get(id) as any;
          if (firstBatch) {
            const newQty = firstBatch.quantity + diff;
            const newRemaining = Math.max(0, firstBatch.remaining_quantity + diff);
            db.prepare("UPDATE product_batches SET quantity = ?, remaining_quantity = ? WHERE id = ?").run(newQty, newRemaining, firstBatch.id);
          } else if (newOpeningStock > 0) {
            // If no opening batch existed, insert a new one
            db.prepare("INSERT INTO product_batches (product_id, purchase_id, quantity, remaining_quantity, purchase_price) VALUES (?, ?, ?, ?, ?)").run(
              id, null, newOpeningStock, newOpeningStock, purchase_price
            );
          }
        }
      }

      db.prepare("UPDATE products SET product_name = ?, brand = ?, material_group_id = ?, purchase_price = ?, trade_price = ?, retail_price = ?, stock_quantity = ?, unit = ?, conversion_value = ?, conversion_unit = ?, min_stock_level = ?, reorder_level = ? WHERE product_id = ?").run(
        product_name, brand, material_group_id, purchase_price, trade_price, retail_price, updatedStockQuantity, unit, conversion_value, conversion_unit, min_stock_level, reorder_level, id
      );
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to update product", err);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.get("/api/shops", (req, res) => {
    const shops = db.prepare("SELECT * FROM shops").all();
    res.json(shops);
  });

  app.get("/api/shops/:id/pending-deliveries", (req, res) => {
    const { id } = req.params;
    try {
      // Robust query for pending deliveries
      const deliveries = db.prepare(`
        SELECT d.*, o.id as order_ref, o.order_date
        FROM deliveries d
        JOIN orders o ON d.order_id = o.id
        WHERE CAST(d.shop_id AS INTEGER) = CAST(? AS INTEGER) 
        AND (d.invoice_id IS NULL OR d.invoice_id = 0 OR d.invoice_id = '') 
        AND d.status != 'cancelled'
        ORDER BY d.delivery_date ASC
      `).all(id);
      console.log(`[PendingDeliveries] Shop ID: ${id}, Found: ${deliveries.length}`);
      res.json(deliveries);
    } catch (err: any) {
      console.error("Error fetching pending deliveries:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/shops", (req, res) => {
    const { shop_name, owner_name, location, phone, credit_limit } = req.body;
    const result = db.prepare("INSERT INTO shops (shop_name, owner_name, location, phone, credit_limit) VALUES (?, ?, ?, ?, ?)").run(
      shop_name, owner_name, location, phone, credit_limit
    );
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/shops/:id", (req, res) => {
    const { id } = req.params;
    const { shop_name, owner_name, location, phone, credit_limit } = req.body;
    try {
      db.prepare("UPDATE shops SET shop_name = ?, owner_name = ?, location = ?, phone = ?, credit_limit = ? WHERE id = ?").run(
        shop_name, owner_name, location, phone, credit_limit, id
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/shops/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM shops WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: "Failed to delete shop. It may have associated records (Orders/Payments)." });
    }
  });

  // API to fetch completed deliveries for a shop (for returns)
  app.get("/api/shops/:id/completed-deliveries", (req, res) => {
    const { id } = req.params;
    try {
      const deliveries = db.prepare(`
        SELECT d.*, o.id as order_ref 
        FROM deliveries d
        JOIN orders o ON d.order_id = o.id
        WHERE CAST(d.shop_id AS INTEGER) = CAST(? AS INTEGER) 
        AND d.status = 'completed'
        ORDER BY d.delivery_date DESC
      `).all(id);
      res.json(deliveries);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API: Get Inventory Audit Logs / Valuation History
  app.get("/api/inventory-audit-log", (req, res) => {
    const { product_id, transaction_type, limit } = req.query;
    try {
      let query = `
        SELECT log.*, p.product_name, p.brand
        FROM inventory_audit_log log
        JOIN products p ON log.product_id = p.product_id
        WHERE 1=1
      `;
      const params: any[] = [];
      if (product_id) {
        query += ` AND log.product_id = ?`;
        params.push(product_id);
      }
      if (transaction_type) {
        query += ` AND log.transaction_type = ?`;
        params.push(transaction_type);
      }
      query += ` ORDER BY log.timestamp DESC, log.id DESC`;
      if (limit) {
        query += ` LIMIT ?`;
        params.push(Number(limit));
      } else {
        query += ` LIMIT 500`;
      }

      const logs = db.prepare(query).all(...params);
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/products/:id/valuation-history", (req, res) => {
    const { id } = req.params;
    try {
      const logs = db.prepare(`
        SELECT log.*, p.product_name
        FROM inventory_audit_log log
        JOIN products p ON log.product_id = p.product_id
        WHERE log.product_id = ?
        ORDER BY log.timestamp DESC, log.id DESC
      `).all(id);
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API to process a return
  app.post("/api/returns", (req, res) => {
    const { shop_id, items } = req.body; // items: Array<{delivery_id, product_id, quantity, unit_price}>
    
    const transaction = db.transaction(() => {
      // 1. Create Return Header
      const header = db.prepare("INSERT INTO returns (shop_id, status) VALUES (?, ?)").run(shop_id, 'completed');
      const returnId = header.lastInsertRowid;

      let total = 0;
      for (const item of items) {
        if (item.quantity <= 0) continue;

        // 2. Insert Return Item
        db.prepare(`
          INSERT INTO return_items (return_id, delivery_id, delivery_item_id, product_id, quantity, unit_price, reason)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(returnId, item.delivery_id, item.delivery_item_id, item.product_id, item.quantity, item.unit_price, item.reason || null);

        // 3. Update Stock and Valuation using Sales Return Valuation
        processSalesReturnValuation(db, item.product_id, item.quantity, returnId, `Customer Sales Return #RET-${returnId}`);
        
        total += item.quantity * item.unit_price;
      }

      // 4. Update Header total
      db.prepare("UPDATE returns SET total_amount = ? WHERE id = ?").run(total, returnId);

      // 5. Update Client Ledger (Credit the shop for the return)
      const lastLedger = db.prepare("SELECT balance FROM client_ledger WHERE shop_id = ? ORDER BY id DESC LIMIT 1").get(shop_id) as any;
      const currentBalance = (lastLedger?.balance || 0) - total;
      
      db.prepare(`
        INSERT INTO client_ledger (shop_id, description, credit, balance)
        VALUES (?, ?, ?, ?)
      `).run(shop_id, `Sales Return #RET-${returnId}`, total, currentBalance);

      return returnId;
    });

    try {
      const result = transaction();
      res.json({ success: true, returnId: result });
    } catch (err: any) {
      console.error("Return processing error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/returns", (req, res) => {
    const returns = db.prepare(`
      SELECT r.*, s.shop_name 
      FROM returns r 
      JOIN shops s ON r.shop_id = s.id 
      ORDER BY r.return_date DESC
    `).all();
    res.json(returns);
  });

  app.get("/api/returns/:id/items", (req, res) => {
    const { id } = req.params;
    const items = db.prepare(`
      SELECT 
        ri.*, 
        p.product_name, 
        p.brand,
        p.purchase_price,
        p.trade_price as price,
        (SELECT quantity FROM delivery_items di WHERE di.id = ri.delivery_item_id) as original_delivered_qty,
        (SELECT SUM(quantity) FROM return_items orri JOIN returns orr ON orri.return_id = orr.id WHERE orri.delivery_item_id = ri.delivery_item_id AND orr.id != ri.return_id AND orr.status != 'cancelled') as other_returns_qty
      FROM return_items ri
      JOIN products p ON ri.product_id = p.product_id
      WHERE ri.return_id = ?
    `).all(id) as any[];

    // Calculate net_qty for each item
    const formatted = items.map(item => ({
      ...item,
      quantity: item.original_delivered_qty, // Total delivered initially
      return_qty: item.other_returns_qty || 0, // Other returns
      net_qty: item.original_delivered_qty - (item.other_returns_qty || 0), // available to return (including THIS return's current qty)
      current_return_qty: item.quantity // The qty saved in THIS return
    }));

    res.json(formatted);
  });

  app.get("/api/returns/:id", (req, res) => {
    const { id } = req.params;
    const ret = db.prepare(`
      SELECT r.*, s.shop_name, s.location
      FROM returns r
      JOIN shops s ON r.shop_id = s.id
      WHERE r.id = ?
    `).get(id);
    if (!ret) return res.status(404).json({ error: "Return not found" });
    res.json(ret);
  });

  app.put("/api/returns/:id", (req, res) => {
    const { id } = req.params;
    const { shop_id, items } = req.body;

    const transaction = db.transaction(() => {
      // 0. Get old return record
      const oldReturn = db.prepare("SELECT * FROM returns WHERE id = ?").get(id) as any;
      if (!oldReturn) throw new Error("Return not found");

      // 1. Get old items to reverse stock and valuation
      const oldItems = db.prepare("SELECT * FROM return_items WHERE return_id = ?").all(id) as any[];
      for (const item of oldItems) {
        processIssueValuation(db, item.product_id, item.quantity, 'SALE_RETURN_CANCEL', id, `Reversal of Customer Sales Return #RET-${id}`);
      }

      // 2. Delete old items
      db.prepare("DELETE FROM return_items WHERE return_id = ?").run(id);

      // 3. Process New Items
      let total = 0;
      for (const item of items) {
        if (item.quantity <= 0) continue;
        db.prepare(`
          INSERT INTO return_items (return_id, delivery_id, delivery_item_id, product_id, quantity, unit_price, reason)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(id, item.delivery_id, item.delivery_item_id, item.product_id, item.quantity, item.unit_price, item.reason || null);

        processSalesReturnValuation(db, item.product_id, item.quantity, id, `Update Customer Sales Return #RET-${id}`);
        
        total += item.quantity * item.unit_price;
      }

      // 4. Update Header
      db.prepare("UPDATE returns SET total_amount = ?, shop_id = ? WHERE id = ?").run(total, shop_id, id);

      // 5. Update Ledger
      // Search by description for the specific return
      const ledgerEntry = db.prepare("SELECT id, credit, balance, shop_id FROM client_ledger WHERE description LIKE ?").get(`%Return #RET-${id}%`) as any;
      
      if (ledgerEntry) {
        if (ledgerEntry.shop_id === shop_id) {
          const diff = total - ledgerEntry.credit; 
          db.prepare(`
            UPDATE client_ledger 
            SET credit = ?, balance = balance - ?
            WHERE id = ?
          `).run(total, diff, ledgerEntry.id);

          db.prepare(`
            UPDATE client_ledger
            SET balance = balance - ?
            WHERE shop_id = ? AND id > ?
          `).run(diff, shop_id, ledgerEntry.id);
        } else {
          // Shop changed! This is complex. We need to "delete" from old shop ledger and "add" to new one.
          // For simplicity, let's just reverse old and add new.
          
          // Revert old ledger entry (reduce credit to 0, which increases balance for the old shop)
          const oldCredit = ledgerEntry.credit;
          db.prepare("UPDATE client_ledger SET credit = 0, balance = balance + ?, description = description || ' (MOVED)' WHERE id = ?").run(oldCredit, ledgerEntry.id);
          db.prepare("UPDATE client_ledger SET balance = balance + ? WHERE shop_id = ? AND id > ?").run(oldCredit, ledgerEntry.shop_id, ledgerEntry.id);
          
          // Add new entry for new shop
          const lastLedger = db.prepare("SELECT balance FROM client_ledger WHERE shop_id = ? ORDER BY id DESC LIMIT 1").get(shop_id) as any;
          const currentBalance = (lastLedger?.balance || 0) - total;
          db.prepare(`
            INSERT INTO client_ledger (shop_id, description, credit, balance)
            VALUES (?, ?, ?, ?)
          `).run(shop_id, `Sales Return #RET-${id}`, total, currentBalance);
        }
      }

      return true;
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (err: any) {
      console.error("Return update error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Sales Return APIs
  app.get("/api/shops/:id/invoices", (req, res) => {
    const { id } = req.params;
    try {
      const invoices = db.prepare(`
        SELECT i.* 
        FROM invoices i
        WHERE CAST(i.shop_id AS INTEGER) = CAST(? AS INTEGER) 
        AND i.status != 'cancelled'
        ORDER BY i.invoice_date DESC, i.id DESC
      `).all(id);
      res.json(invoices);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/sales-returns/invoice/:id/items", (req, res) => {
    const { id } = req.params;
    try {
      const items = db.prepare(`
        SELECT 
          ii.id as invoice_item_id,
          ii.invoice_id,
          ii.product_id,
          ii.quantity,
          ii.unit_price as price,
          p.product_name,
          p.brand,
          p.unit as uom,
          COALESCE((
            SELECT SUM(sri.quantity) 
            FROM sales_return_items sri 
            JOIN sales_returns sr ON sri.sales_return_id = sr.id 
            WHERE sri.invoice_item_id = ii.id AND sr.status != 'cancelled'
          ), 0) as already_returned_qty
        FROM invoice_items ii
        JOIN products p ON ii.product_id = p.product_id
        WHERE ii.invoice_id = ?
      `).all(id) as any[];

      // Calculate net_qty available for return
      const formatted = items.map(item => ({
        ...item,
        already_returned_qty: item.already_returned_qty,
        net_qty: Math.max(0, item.quantity - item.already_returned_qty),
        current_return_qty: 0,
        reason: ""
      }));

      res.json(formatted);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/sales-returns", (req, res) => {
    const { shop_id, invoice_id, items } = req.body; // items: Array<{invoice_item_id, product_id, quantity, unit_price, reason}>
    
    if (!shop_id || !invoice_id || !items || items.length === 0) {
      return res.status(400).json({ error: "Missing required fields or return items." });
    }

    const transaction = db.transaction(() => {
      // 1. Create Sales Return Header
      const header = db.prepare("INSERT INTO sales_returns (shop_id, invoice_id, status) VALUES (?, ?, ?)").run(shop_id, invoice_id, 'completed');
      const salesReturnId = header.lastInsertRowid;

      let total = 0;
      for (const item of items) {
        if (item.quantity <= 0) continue;

        // Double check already returned to enforce limit
        const existing = db.prepare(`
          SELECT 
            ii.quantity,
            COALESCE((
              SELECT SUM(sri.quantity) 
              FROM sales_return_items sri 
              JOIN sales_returns sr ON sri.sales_return_id = sr.id 
              WHERE sri.invoice_item_id = ii.id AND sr.status != 'cancelled'
            ), 0) as already_returned_qty
          FROM invoice_items ii
          WHERE ii.id = ?
        `).get(item.invoice_item_id) as any;

        if (!existing) {
          throw new Error(`Invoice item not found for ID ${item.invoice_item_id}`);
        }

        const maxReturnable = existing.quantity - existing.already_returned_qty;
        if (item.quantity > maxReturnable) {
          throw new Error(`Return quantity of ${item.quantity} exceeds remaining returnable quantity (${maxReturnable})`);
        }

        // 2. Insert Sales Return Item
        db.prepare(`
          INSERT INTO sales_return_items (sales_return_id, invoice_item_id, product_id, quantity, unit_price, reason)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(salesReturnId, item.invoice_item_id, item.product_id, item.quantity, item.unit_price, item.reason || null);

        // 3. Update Stock (using stock_quantity column to increase the stock)
        db.prepare("UPDATE products SET stock_quantity = stock_quantity + ? WHERE product_id = ?").run(item.quantity, item.product_id);
        
        total += item.quantity * item.unit_price;
      }

      // 4. Update Header total
      db.prepare("UPDATE sales_returns SET total_amount = ? WHERE id = ?").run(total, salesReturnId);

      // 5. Update Client Ledger (Credit the shop for the sales return)
      const lastLedger = db.prepare("SELECT balance FROM client_ledger WHERE shop_id = ? ORDER BY id DESC LIMIT 1").get(shop_id) as any;
      const currentBalance = (lastLedger?.balance || 0) - total;
      
      const invoiceNo = `INV # ${Number(invoice_id).toString().padStart(4, '0')}`;
      db.prepare(`
        INSERT INTO client_ledger (shop_id, description, credit, balance)
        VALUES (?, ?, ?, ?)
      `).run(shop_id, `Sales Return #SRT-${salesReturnId} (Ref Inv: ${invoiceNo})`, total, currentBalance);

      return salesReturnId;
    });

    try {
      const result = transaction();
      res.json({ success: true, salesReturnId: result });
    } catch (err: any) {
      console.error("Sales Return processing error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/sales-returns", (req, res) => {
    try {
      const returns = db.prepare(`
        SELECT sr.*, s.shop_name, i.id as invoice_ref_id
        FROM sales_returns sr 
        JOIN shops s ON sr.shop_id = s.id 
        JOIN invoices i ON sr.invoice_id = i.id
        ORDER BY sr.return_date DESC
      `).all();
      res.json(returns);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/sales-returns/:id/items", (req, res) => {
    const { id } = req.params;
    try {
      const items = db.prepare(`
        SELECT 
          sri.*, 
          p.product_name, 
          p.brand,
          p.purchase_price,
          p.trade_price as price,
          (SELECT quantity FROM invoice_items ii WHERE ii.id = sri.invoice_item_id) as original_invoice_qty,
          (SELECT SUM(quantity) FROM sales_return_items osri JOIN sales_returns osr ON osri.sales_return_id = osr.id WHERE osri.invoice_item_id = sri.invoice_item_id AND osr.id != sri.sales_return_id AND osr.status != 'cancelled') as other_returns_qty
        FROM sales_return_items sri
        JOIN products p ON sri.product_id = p.product_id
        WHERE sri.sales_return_id = ?
      `).all(id) as any[];

      // Calculate net_qty for each item
      const formatted = items.map(item => ({
        ...item,
        quantity: item.original_invoice_qty, // Total invoiced initially
        return_qty: item.other_returns_qty || 0, // Other returns
        net_qty: item.original_invoice_qty - (item.other_returns_qty || 0), // available to return (including THIS return's current qty)
        current_return_qty: item.quantity // The qty saved in THIS return
      }));

      res.json(formatted);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/sales-returns/:id", (req, res) => {
    const { id } = req.params;
    const { shop_id, invoice_id, items } = req.body;

    const transaction = db.transaction(() => {
      // 0. Get old return record
      const oldReturn = db.prepare("SELECT * FROM sales_returns WHERE id = ?").get(id) as any;
      if (!oldReturn) throw new Error("Sales Return not found");

      // 1. Get old items to reverse stock
      const oldItems = db.prepare("SELECT * FROM sales_return_items WHERE sales_return_id = ?").all(id) as any[];
      for (const item of oldItems) {
        db.prepare("UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?")
          .run(item.quantity, item.product_id);
      }

      // 2. Delete old items
      db.prepare("DELETE FROM sales_return_items WHERE sales_return_id = ?").run(id);

      // 3. Process New Items
      let total = 0;
      for (const item of items) {
        if (item.quantity <= 0) continue;

        // Double check already returned to enforce limit
        const existing = db.prepare(`
          SELECT 
            ii.quantity,
            COALESCE((
              SELECT SUM(sri.quantity) 
              FROM sales_return_items sri 
              JOIN sales_returns sr ON sri.sales_return_id = sr.id 
              WHERE sri.invoice_item_id = ii.id AND sr.id != ? AND sr.status != 'cancelled'
            ), 0) as already_returned_qty
          FROM invoice_items ii
          WHERE ii.id = ?
        `).get(id, item.invoice_item_id) as any;

        if (!existing) {
          throw new Error(`Invoice item not found for ID ${item.invoice_item_id}`);
        }

        const maxReturnable = existing.quantity - existing.already_returned_qty;
        if (item.quantity > maxReturnable) {
          throw new Error(`Return quantity of ${item.quantity} exceeds remaining returnable quantity (${maxReturnable})`);
        }

        db.prepare(`
          INSERT INTO sales_return_items (sales_return_id, invoice_item_id, product_id, quantity, unit_price, reason)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(id, item.invoice_item_id, item.product_id, item.quantity, item.unit_price, item.reason || null);

        db.prepare("UPDATE products SET stock_quantity = stock_quantity + ? WHERE product_id = ?")
          .run(item.quantity, item.product_id);

        total += item.quantity * item.unit_price;
      }

      // 4. Update Header total
      db.prepare("UPDATE sales_returns SET total_amount = ? WHERE id = ?").run(total, id);

      // 5. Update client ledger balance (first reverse previous total, then apply new total)
      const lastLedger = db.prepare("SELECT balance FROM client_ledger WHERE shop_id = ? ORDER BY id DESC LIMIT 1").get(shop_id) as any;
      const currentBalance = (lastLedger?.balance || 0) + oldReturn.total_amount - total;
      
      const invoiceNo = `INV # ${Number(invoice_id).toString().padStart(4, '0')}`;
      db.prepare(`
        INSERT INTO client_ledger (shop_id, description, credit, balance)
        VALUES (?, ?, ?, ?)
      `).run(shop_id, `Sales Return Update #SRT-${id} (Ref Inv: ${invoiceNo})`, total - oldReturn.total_amount, currentBalance);

      return id;
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (err: any) {
      console.error("Sales Return edit failure:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Purchase Return Endpoints
  app.get("/api/suppliers/:id/purchases", (req, res) => {
    const { id } = req.params;
    try {
      const purchases = db.prepare(`
        SELECT p.*, s.name as supplier_name
        FROM purchases p
        JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.supplier_id = ? AND p.status != 'cancelled'
        ORDER BY p.purchase_date DESC
      `).all(id);
      res.json(purchases);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/purchase-returns/purchase/:id/items", (req, res) => {
    const { id } = req.params;
    try {
      const items = db.prepare(`
        SELECT 
          pi.id as purchase_item_id,
          pi.purchase_id,
          pi.product_id,
          pi.quantity,
          pi.price as unit_price,
          p.product_name,
          p.brand,
          COALESCE((
            SELECT SUM(pri.quantity) 
            FROM purchase_return_items pri 
            JOIN purchase_returns pr ON pri.purchase_return_id = pr.id 
            WHERE pri.purchase_item_id = pi.id AND pr.status != 'cancelled'
          ), 0) as already_returned_qty
        FROM purchase_items pi
        JOIN products p ON pi.product_id = p.product_id
        WHERE pi.purchase_id = ?
      `).all(id) as any[];

      const formatted = items.map(item => ({
        ...item,
        already_returned_qty: item.already_returned_qty,
        net_qty: Math.max(0, item.quantity - item.already_returned_qty),
        current_return_qty: 0,
        reason: ""
      }));

      res.json(formatted);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/purchase-returns", (req, res) => {
    const { supplier_id, purchase_id, items } = req.body;
    
    if (!supplier_id || !purchase_id || !items || items.length === 0) {
      return res.status(400).json({ error: "Missing required fields or return items." });
    }

    const transaction = db.transaction(() => {
      // 1. Create Purchase Return Header
      const header = db.prepare("INSERT INTO purchase_returns (supplier_id, purchase_id, status) VALUES (?, ?, ?)").run(supplier_id, purchase_id, 'completed');
      const purchaseReturnId = header.lastInsertRowid;

      let total = 0;
      for (const item of items) {
        if (item.quantity <= 0) continue;

        // Double check already returned to enforce limit
        const existing = db.prepare(`
          SELECT 
            pi.quantity,
            COALESCE((
              SELECT SUM(pri.quantity) 
              FROM purchase_return_items pri 
              JOIN purchase_returns pr ON pri.purchase_return_id = pr.id 
              WHERE pri.purchase_item_id = pi.id AND pr.status != 'cancelled'
            ), 0) as already_returned_qty
          FROM purchase_items pi
          WHERE pi.id = ?
        `).get(item.purchase_item_id) as any;

        if (!existing) {
          throw new Error(`Purchase item not found for ID ${item.purchase_item_id}`);
        }

        const maxReturnable = existing.quantity - existing.already_returned_qty;
        if (item.quantity > maxReturnable) {
          throw new Error(`Return quantity of ${item.quantity} exceeds remaining returnable quantity (${maxReturnable})`);
        }

        // 2. Insert Purchase Return Item
        db.prepare(`
          INSERT INTO purchase_return_items (purchase_return_id, purchase_item_id, product_id, quantity, unit_price, reason)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(purchaseReturnId, item.purchase_item_id, item.product_id, item.quantity, item.unit_price, item.reason || null);

        // 3. Process MAP Valuation & Deduct stock quantity from product Master
        processPurchaseReturnValuation(db, item.product_id, item.quantity, purchaseReturnId, `Purchase Return #${purchaseReturnId} for Purchase #${purchase_id}`);

        // 4. Deduct remaining_quantity from product batch corresponding to purchase
        const batch = db.prepare("SELECT * FROM product_batches WHERE purchase_id = ? AND product_id = ? ORDER BY id ASC LIMIT 1").get(purchase_id, item.product_id) as any;
        if (batch) {
          db.prepare("UPDATE product_batches SET remaining_quantity = MAX(0, remaining_quantity - ?) WHERE id = ?").run(item.quantity, batch.id);
        }

        total += item.quantity * item.unit_price;
      }

      // 5. Update Header total
      db.prepare("UPDATE purchase_returns SET total_amount = ? WHERE id = ?").run(total, purchaseReturnId);

      return purchaseReturnId;
    });

    try {
      const result = transaction();
      res.json({ success: true, purchaseReturnId: result });
    } catch (err: any) {
      console.error("Purchase Return processing error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/purchase-returns", (req, res) => {
    try {
      const returns = db.prepare(`
        SELECT pr.*, s.name as supplier_name, p.id as purchase_ref_id
        FROM purchase_returns pr 
        JOIN suppliers s ON pr.supplier_id = s.id 
        JOIN purchases p ON pr.purchase_id = p.id
        ORDER BY pr.return_date DESC
      `).all();
      res.json(returns);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/purchase-returns/:id/items", (req, res) => {
    const { id } = req.params;
    try {
      const items = db.prepare(`
        SELECT 
          pri.*, 
          p.product_name, 
          p.brand,
          (SELECT quantity FROM purchase_items pi WHERE pi.id = pri.purchase_item_id) as original_purchase_qty,
          (SELECT SUM(quantity) FROM purchase_return_items opri JOIN purchase_returns opr ON opri.purchase_return_id = opr.id WHERE opri.purchase_item_id = pri.purchase_item_id AND opr.id != pri.purchase_return_id AND opr.status != 'cancelled') as other_returns_qty
        FROM purchase_return_items pri
        JOIN products p ON pri.product_id = p.product_id
        WHERE pri.purchase_return_id = ?
      `).all(id) as any[];

      const formatted = items.map(item => ({
        ...item,
        quantity: item.original_purchase_qty,
        already_returned_qty: item.other_returns_qty || 0,
        net_qty: item.original_purchase_qty - (item.other_returns_qty || 0),
        current_return_qty: item.quantity
      }));

      res.json(formatted);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/purchase-returns/:id", (req, res) => {
    const { id } = req.params;
    const { supplier_id, purchase_id, items } = req.body;

    const transaction = db.transaction(() => {
      const oldReturn = db.prepare("SELECT * FROM purchase_returns WHERE id = ?").get(id) as any;
      if (!oldReturn) throw new Error("Purchase Return not found");

      // 1. Get old items to restore stock and valuation
      const oldItems = db.prepare("SELECT * FROM purchase_return_items WHERE purchase_return_id = ?").all(id) as any[];
      for (const item of oldItems) {
        processPurchaseValuation(db, item.product_id, item.quantity, item.unit_price, id, `Reversal of Purchase Return #${id}`);

        const batch = db.prepare("SELECT * FROM product_batches WHERE purchase_id = ? AND product_id = ? ORDER BY id ASC LIMIT 1").get(oldReturn.purchase_id, item.product_id) as any;
        if (batch) {
          db.prepare("UPDATE product_batches SET remaining_quantity = remaining_quantity + ? WHERE id = ?").run(item.quantity, batch.id);
        }
      }

      // 2. Delete old return items
      db.prepare("DELETE FROM purchase_return_items WHERE purchase_return_id = ?").run(id);

      // 3. Insert new items and deduct stock with MAP calculation
      let total = 0;
      for (const item of items) {
        if (item.quantity <= 0) continue;

        const existing = db.prepare(`
          SELECT 
            pi.quantity,
            COALESCE((
              SELECT SUM(pri.quantity) 
              FROM purchase_return_items pri 
              JOIN purchase_returns pr ON pri.purchase_return_id = pr.id 
              WHERE pri.purchase_item_id = pi.id AND pr.id != ? AND pr.status != 'cancelled'
            ), 0) as already_returned_qty
          FROM purchase_items pi
          WHERE pi.id = ?
        `).get(id, item.purchase_item_id) as any;

        if (!existing) {
          throw new Error(`Purchase item not found for ID ${item.purchase_item_id}`);
        }

        const maxReturnable = existing.quantity - existing.already_returned_qty;
        if (item.quantity > maxReturnable) {
          throw new Error(`Return quantity of ${item.quantity} exceeds remaining returnable quantity (${maxReturnable})`);
        }

        db.prepare(`
          INSERT INTO purchase_return_items (purchase_return_id, purchase_item_id, product_id, quantity, unit_price, reason)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(id, item.purchase_item_id, item.product_id, item.quantity, item.unit_price, item.reason || null);

        processPurchaseReturnValuation(db, item.product_id, item.quantity, id, `Updated Purchase Return #${id}`);

        const batch = db.prepare("SELECT * FROM product_batches WHERE purchase_id = ? AND product_id = ? ORDER BY id ASC LIMIT 1").get(purchase_id, item.product_id) as any;
        if (batch) {
          db.prepare("UPDATE product_batches SET remaining_quantity = MAX(0, remaining_quantity - ?) WHERE id = ?").run(item.quantity, batch.id);
        }

        total += item.quantity * item.unit_price;
      }

      // 4. Update Header total
      db.prepare("UPDATE purchase_returns SET total_amount = ? WHERE id = ?").run(total, id);

      return id;
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (err: any) {
      console.error("Purchase Return edit failure:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/purchase-returns/:id", (req, res) => {
    const { id } = req.params;
    const transaction = db.transaction(() => {
      const oldReturn = db.prepare("SELECT * FROM purchase_returns WHERE id = ?").get(id) as any;
      if (!oldReturn) throw new Error("Purchase Return not found");

      if (oldReturn.status !== 'cancelled') {
        const oldItems = db.prepare("SELECT * FROM purchase_return_items WHERE purchase_return_id = ?").all(id) as any[];
        for (const item of oldItems) {
          processPurchaseValuation(db, item.product_id, item.quantity, item.unit_price, id, `Cancellation of Purchase Return #${id}`);

          const batch = db.prepare("SELECT * FROM product_batches WHERE purchase_id = ? AND product_id = ? ORDER BY id ASC LIMIT 1").get(oldReturn.purchase_id, item.product_id) as any;
          if (batch) {
            db.prepare("UPDATE product_batches SET remaining_quantity = remaining_quantity + ? WHERE id = ?").run(item.quantity, batch.id);
          }
        }
        db.prepare("UPDATE purchase_returns SET status = 'cancelled' WHERE id = ?").run(id);
      }
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/orders", (req, res) => {
    const orders = db.prepare(`
      SELECT o.*, r.shop_name, ob.name as order_booker_name,
      (SELECT COUNT(*) FROM deliveries WHERE order_id = o.id) > 0 as has_delivery
      FROM orders o
      JOIN shops r ON o.shop_id = r.id
      JOIN order_bookers ob ON o.order_booker_id = ob.id
      ORDER BY o.order_date DESC
    `).all();
    res.json(orders);
  });

  app.post("/api/orders", (req, res) => {
    const { shop_id, order_booker_id, order_date, estimated_delivery_date, items } = req.body;
    let { 
      sales_tax_pct, sales_tax_amount, 
      additional_tax_pct, additional_tax_amount,
      discount_pct, discount_amount,
      extra_discount_pct, extra_discount_amount
    } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Items array is required" });
    }

    // Recalculate totals server-side for robustness
    const items_total = items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);
    const calculated_sales_tax = items.reduce((sum: number, item: any) => sum + (item.sales_tax_amount || 0), 0);
    const calculated_additional_tax = items.reduce((sum: number, item: any) => sum + (item.additional_tax_amount || 0), 0);
    const calculated_discount = items.reduce((sum: number, item: any) => sum + (item.discount_amount || 0), 0);
    const calculated_extra_discount = items.reduce((sum: number, item: any) => sum + (item.extra_discount_amount || 0), 0);

    sales_tax_amount = calculated_sales_tax;
    additional_tax_amount = calculated_additional_tax;
    discount_amount = calculated_discount;
    extra_discount_amount = calculated_extra_discount;

    const total_amount = items_total + sales_tax_amount + additional_tax_amount - discount_amount - extra_discount_amount;

    console.log(`[Order Create] Shop: ${shop_id}, Items Total: ${items_total}, Tax: ${sales_tax_amount + additional_tax_amount}, Discount: ${discount_amount + extra_discount_amount}, Grand Total: ${total_amount}`);

    const transaction = db.transaction(() => {
      const order = db.prepare(`
        INSERT INTO orders (
          shop_id, order_booker_id, order_date, estimated_delivery_date, total_amount, 
          sales_tax_pct, sales_tax_amount, additional_tax_pct, additional_tax_amount,
          discount_pct, discount_amount, extra_discount_pct, extra_discount_amount,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        shop_id, order_booker_id, order_date || new Date().toISOString(), estimated_delivery_date, total_amount, 
        sales_tax_pct || 0, sales_tax_amount || 0, additional_tax_pct || 0, additional_tax_amount || 0,
        discount_pct || 0, discount_amount || 0, extra_discount_pct || 0, extra_discount_amount || 0,
        'pending'
      );
      const orderId = order.lastInsertRowid;

      for (const item of items) {
        db.prepare(`
          INSERT INTO order_items (
            order_id, product_id, quantity, price, status, 
            sales_tax_pct, sales_tax_amount, additional_tax_pct, additional_tax_amount,
            discount_pct, discount_amount, extra_discount_pct, extra_discount_amount
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          orderId, item.product_id, item.quantity, item.price, 'pending', 
          item.sales_tax_pct || 0, item.sales_tax_amount || 0, item.additional_tax_pct || 0, item.additional_tax_amount || 0,
          item.discount_pct || 0, item.discount_amount || 0, item.extra_discount_pct || 0, item.extra_discount_amount || 0
        );
      }
      return orderId;
    });

    try {
      const orderId = transaction();
      res.json({ id: orderId });
    } catch (err) {
      console.error("Failed to create order", err);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.get("/api/order-bookers", (req, res) => {
    const bookers = db.prepare("SELECT * FROM order_bookers").all();
    res.json(bookers);
  });

  app.post("/api/order-bookers", (req, res) => {
    const { name, father_name, cell_no, cnic_no, joining_date } = req.body;
    try {
      const result = db.prepare("INSERT INTO order_bookers (name, father_name, cell_no, cnic_no, joining_date) VALUES (?, ?, ?, ?, ?)").run(
        name, father_name, cell_no, cnic_no, joining_date
      );
      res.json({ id: result.lastInsertRowid });
    } catch (err) {
      res.status(500).json({ error: "Failed to create order booker" });
    }
  });

  app.put("/api/order-bookers/:id", (req, res) => {
    const { name, father_name, cell_no, cnic_no, joining_date } = req.body;
    db.prepare("UPDATE order_bookers SET name = ?, father_name = ?, cell_no = ?, cnic_no = ?, joining_date = ? WHERE id = ?").run(
      name, father_name, cell_no, cnic_no, joining_date, req.params.id
    );
    res.json({ success: true });
  });

  app.get("/api/salesmen", (req, res) => {
    const salesmen = db.prepare("SELECT * FROM salesmen").all();
    res.json(salesmen);
  });

  app.post("/api/salesmen", (req, res) => {
    const { name, father_name, cell_no, cnic_no, joining_date } = req.body;
    try {
      const result = db.prepare("INSERT INTO salesmen (name, father_name, cell_no, cnic_no, joining_date) VALUES (?, ?, ?, ?, ?)").run(
        name, father_name, cell_no, cnic_no, joining_date
      );
      res.json({ id: result.lastInsertRowid });
    } catch (err) {
      res.status(500).json({ error: "Failed to create salesman" });
    }
  });

  app.put("/api/salesmen/:id", (req, res) => {
    const { name, father_name, cell_no, cnic_no, joining_date } = req.body;
    db.prepare("UPDATE salesmen SET name = ?, father_name = ?, cell_no = ?, cnic_no = ?, joining_date = ? WHERE id = ?").run(
      name, father_name, cell_no, cnic_no, joining_date, req.params.id
    );
    res.json({ success: true });
  });

  app.delete("/api/order-bookers/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM order_bookers WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete order booker. It may be in use." });
    }
  });

  app.delete("/api/salesmen/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM salesmen WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete salesman. It may be in use." });
    }
  });

  app.get("/api/orders/:id/items", (req, res) => {
    const { id } = req.params;
    const items = db.prepare(`
      SELECT oi.*, p.product_name, p.brand
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?
    `).all(id);
    res.json(items);
  });

  app.get("/api/orders/:id", (req, res) => {
    const { id } = req.params;
    const order = db.prepare(`
      SELECT o.*, r.shop_name, ob.name as order_booker_name
      FROM orders o
      JOIN shops r ON o.shop_id = r.id
      JOIN order_bookers ob ON o.order_booker_id = ob.id
      WHERE o.id = ?
    `).get(id);
    res.json(order);
  });

  app.put("/api/orders/:id", (req, res) => {
    const { id } = req.params;
    const { shop_id, order_booker_id, order_date, estimated_delivery_date, items } = req.body;
    let { 
      sales_tax_pct, sales_tax_amount, 
      additional_tax_pct, additional_tax_amount,
      discount_pct, discount_amount,
      extra_discount_pct, extra_discount_amount
    } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Items array is required" });
    }

    // Recalculate totals server-side for robustness
    const items_total = items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);
    const calculated_sales_tax = items.reduce((sum: number, item: any) => sum + (item.sales_tax_amount || 0), 0);
    const calculated_additional_tax = items.reduce((sum: number, item: any) => sum + (item.additional_tax_amount || 0), 0);
    const calculated_discount = items.reduce((sum: number, item: any) => sum + (item.discount_amount || 0), 0);
    const calculated_extra_discount = items.reduce((sum: number, item: any) => sum + (item.extra_discount_amount || 0), 0);

    // Use calculated amounts if not provided or if they differ (prefer server calculation)
    sales_tax_amount = calculated_sales_tax;
    additional_tax_amount = calculated_additional_tax;
    discount_amount = calculated_discount;
    extra_discount_amount = calculated_extra_discount;

    const total_amount = items_total + sales_tax_amount + additional_tax_amount - discount_amount - extra_discount_amount;

    console.log(`[Order Update] ID: ${id}, Shop: ${shop_id}, Items Total: ${items_total}, Tax: ${sales_tax_amount + additional_tax_amount}, Discount: ${discount_amount + extra_discount_amount}, Grand Total: ${total_amount}`);

    try {
      db.transaction(() => {
        // 0. Check for dependencies that block update
        
        // Check Deliveries (Header or Items)
        const deliveryDetails = db.prepare(`
          SELECT 
            (SELECT COUNT(*) FROM deliveries WHERE order_id = ?) as header_count,
            (SELECT COUNT(*) FROM delivery_items di JOIN order_items oi ON di.order_item_id = oi.id WHERE oi.order_id = ?) as item_count
        `).get(id, id) as { header_count: number; item_count: number };

        if (deliveryDetails.header_count > 0 || deliveryDetails.item_count > 0) {
          throw new Error(`Cannot modify order: It is already linked to a Delivery record${deliveryDetails.item_count > 0 ? " with items" : ""}.`);
        }

        // Check Load Plans (Allow editing if all associated plans are in 'draft')
        const activePlans = db.prepare(`
          SELECT lp.id, lp.status 
          FROM load_plans lp
          JOIN load_plan_items lpi ON lp.id = lpi.plan_id
          WHERE lpi.order_id = ? AND lp.status != 'draft'
        `).all(id) as any[];

        if (activePlans.length > 0) {
          throw new Error(`Cannot modify order: It is assigned to an active Load Plan (#${activePlans[0].id}, Status: ${activePlans[0].status}).`);
        }

        // 1. (Stock deduction is now handled at delivery time)

        // 2. Delete old items
        db.prepare("DELETE FROM order_items WHERE order_id = ?").run(id);

        // 3. Update Order Header
        db.prepare(`
          UPDATE orders 
          SET shop_id = ?, order_booker_id = ?, order_date = ?, estimated_delivery_date = ?, total_amount = ?, 
              sales_tax_pct = ?, sales_tax_amount = ?, additional_tax_pct = ?, additional_tax_amount = ?, 
              discount_pct = ?, discount_amount = ?, extra_discount_pct = ?, extra_discount_amount = ?,
              is_cancelled = ''
          WHERE id = ?
        `).run(shop_id, order_booker_id, order_date || new Date().toISOString(), estimated_delivery_date, total_amount, 
               sales_tax_pct || 0, sales_tax_amount || 0, additional_tax_pct || 0, additional_tax_amount || 0, 
               discount_pct || 0, discount_amount || 0, extra_discount_pct || 0, extra_discount_amount || 0,
               id);

        // 4. Process New Items
        for (const item of items) {
          db.prepare(`
            INSERT INTO order_items (
              order_id, product_id, quantity, price, status, 
              sales_tax_pct, sales_tax_amount, additional_tax_pct, additional_tax_amount,
              discount_pct, discount_amount, extra_discount_pct, extra_discount_amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            id, item.product_id, item.quantity, item.price, item.status || 'Pending', 
            item.sales_tax_pct || 0, item.sales_tax_amount || 0, item.additional_tax_pct || 0, item.additional_tax_amount || 0,
            item.discount_pct || 0, item.discount_amount || 0, item.extra_discount_pct || 0, item.extra_discount_amount || 0
          );
        }
      })();
      res.json({ success: true });
    } catch (err: any) {
      console.error("Order update failed", err);
      res.status(500).json({ error: "Failed to update order: " + err.message });
    }
  });

  app.post("/api/orders/cancel", (req, res) => {
    const { orderIds } = req.body;
    if (!orderIds || !Array.isArray(orderIds)) {
      return res.status(400).json({ error: "Order IDs array is required" });
    }

    try {
      console.log(`[Order Cancel] Attempting to cancel orders: ${JSON.stringify(orderIds)}`);
      
      const transaction = db.transaction(() => {
        for (const id of orderIds) {
          // 1. Check if order exists
          const order = db.prepare("SELECT status, is_cancelled FROM orders WHERE id = ?").get(id) as any;
          if (!order) {
            throw new Error(`Order #ORD-${id.toString().padStart(4, '0')} not found.`);
          }
          
          if (order.is_cancelled === 'X') continue;

          // 2. Check for dependencies (Deliveries)
          const deliveryDetails = db.prepare(`
            SELECT 
              (SELECT COUNT(*) FROM deliveries WHERE order_id = ?) as header_count,
              (SELECT COUNT(*) FROM delivery_items di JOIN order_items oi ON di.order_item_id = oi.id WHERE oi.order_id = ?) as item_count
          `).get(id, id) as { header_count: number; item_count: number };

          if (deliveryDetails.header_count > 0 || deliveryDetails.item_count > 0) {
            throw new Error(`Order #ORD-${id.toString().padStart(4, '0')} cannot be cancelled: It is already linked to a Delivery record.`);
          }

          // 3. Update status to 'cancelled' and set flag 'X'
          db.prepare("UPDATE orders SET status = 'cancelled', is_cancelled = 'X' WHERE id = ?").run(id);
          db.prepare("UPDATE order_items SET status = 'cancelled' WHERE order_id = ?").run(id);
          
          // 4. Cleanup related records
          db.prepare("DELETE FROM load_plan_items WHERE order_id = ?").run(id);
        }
      });

      transaction();
      res.json({ success: true });
    } catch (err: any) {
      console.error("Order cancellation failed", err);
      res.status(400).json({ error: err.message || "Failed to cancel orders" });
    }
  });

  app.post("/api/orders/uncancel", (req, res) => {
    const { orderIds } = req.body;
    if (!orderIds || !Array.isArray(orderIds)) {
      return res.status(400).json({ error: "Order IDs array is required" });
    }

    try {
      console.log(`[Order Uncancel] Attempting to restore/reopen orders: ${JSON.stringify(orderIds)}`);
      
      const transaction = db.transaction(() => {
        for (const id of orderIds) {
          // 1. Check if order exists
          const order = db.prepare("SELECT status, is_cancelled FROM orders WHERE id = ?").get(id) as any;
          if (!order) {
            throw new Error(`Order #ORD-${id.toString().padStart(4, '0')} not found.`);
          }
          
          if (order.is_cancelled !== 'X') continue;

          // 2. Update status back to 'pending' and clear flag
          db.prepare("UPDATE orders SET status = 'pending', is_cancelled = '' WHERE id = ?").run(id);
          db.prepare("UPDATE order_items SET status = 'Pending' WHERE order_id = ?").run(id);
        }
      });

      transaction();
      res.json({ success: true });
    } catch (err: any) {
      console.error("Order restoration failed", err);
      res.status(400).json({ error: err.message || "Failed to restore orders" });
    }
  });

  app.get("/api/deliveries", (req, res) => {
    const deliveries = db.prepare(`
      SELECT 
        d.*, 
        o.id as order_ref, 
        r.shop_name, 
        s.name as salesman_name,
        (SELECT COALESCE(SUM(ri.quantity), 0) FROM return_items ri WHERE ri.delivery_id = d.id) as total_return_qty,
        (SELECT SUM(di.quantity) FROM delivery_items di WHERE di.delivery_id = d.id) - (SELECT COALESCE(SUM(ri.quantity), 0) FROM return_items ri WHERE ri.delivery_id = d.id) as total_net_qty
      FROM deliveries d
      JOIN orders o ON d.order_id = o.id
      JOIN shops r ON o.shop_id = r.id
      JOIN salesmen s ON d.salesman_id = s.id
      ORDER BY d.delivery_date DESC
    `).all();
    res.json(deliveries);
  });

  app.delete("/api/deliveries/:id", (req, res) => {
    const { id } = req.params;
    
    const transaction = db.transaction(() => {
      // 0. Get delivery info
      const delivery = db.prepare("SELECT shop_id, order_id, total_amount FROM deliveries WHERE id = ?").get(id) as any;
      if (!delivery) throw new Error("Delivery not found");

      const items = db.prepare("SELECT * FROM delivery_items WHERE delivery_id = ?").all(id) as any[];
      const affectedOrderIds = new Set<number>();
      if (delivery.order_id) affectedOrderIds.add(delivery.order_id);

      // 1. Restore Stock and Batch Quantities
      for (const item of items) {
        // Restore product stock
        db.prepare("UPDATE products SET stock_quantity = stock_quantity + ? WHERE product_id = ?")
          .run(item.quantity, item.product_id);
        
        // Restore batch quantity (simple approach: most recent batch)
        const lastBatch = db.prepare("SELECT id FROM product_batches WHERE product_id = ? ORDER BY received_date DESC LIMIT 1").get(item.product_id) as any;
        if (lastBatch) {
          db.prepare("UPDATE product_batches SET remaining_quantity = remaining_quantity + ? WHERE id = ?").run(item.quantity, lastBatch.id);
        }
        
        const oi = db.prepare("SELECT order_id FROM order_items WHERE id = ?").get(item.order_item_id) as any;
        if (oi) affectedOrderIds.add(oi.order_id);
      }

      // 2. Delete Ledger Entry and adjust balances
      const ledgerEntry = db.prepare("SELECT id, debit FROM client_ledger WHERE shop_id = ? AND description LIKE ?").get(delivery.shop_id, `%#DEL-${id}%`) as any;
      if (ledgerEntry) {
        const diff = -ledgerEntry.debit;
        db.prepare("DELETE FROM client_ledger WHERE id = ?").run(ledgerEntry.id);
        
        // Adjust subsequent balances
        db.prepare(`
          UPDATE client_ledger
          SET balance = balance + ?
          WHERE shop_id = ? AND id > ?
        `).run(diff, delivery.shop_id, ledgerEntry.id);
      }

      // 3. Delete Items and Header
      db.prepare("DELETE FROM delivery_items WHERE delivery_id = ?").run(id);
      db.prepare("DELETE FROM deliveries WHERE id = ?").run(id);

      // 4. Update Order and Item Statuses
      for (const oid of affectedOrderIds) {
        const orderItems = db.prepare("SELECT id, quantity FROM order_items WHERE order_id = ?").all(oid) as any[];
        for (const item of orderItems) {
          const stats = db.prepare(`
            SELECT COALESCE(SUM(di.quantity), 0) as delivered
            FROM delivery_items di
            JOIN deliveries d ON di.delivery_id = d.id
            WHERE di.order_item_id = ? AND d.status != 'cancelled'
          `).get(item.id) as any;
          
          const status = stats.delivered >= item.quantity ? 'delivered' : (stats.delivered > 0 ? 'partially_delivered' : 'pending');
          db.prepare("UPDATE order_items SET status = ? WHERE id = ?").run(status, item.id);
        }

        const itemsStatus = db.prepare("SELECT status FROM order_items WHERE order_id = ?").all(oid) as any[];
        const allDelivered = itemsStatus.length > 0 && itemsStatus.every((i: any) => i.status === 'delivered');
        db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(allDelivered ? 'delivered' : 'pending', oid);
      }

      return true;
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (err: any) {
      console.error("Delete delivery failure:", err);
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/deliveries/:id", (req, res) => {
    const { id } = req.params;
    const delivery = db.prepare(`
      SELECT d.*, o.id as order_ref, r.shop_name, s.name as salesman_name
      FROM deliveries d
      JOIN orders o ON d.order_id = o.id
      JOIN shops r ON o.shop_id = r.id
      JOIN salesmen s ON d.salesman_id = s.id
      WHERE d.id = ?
    `).get(id);
    if (!delivery) return res.status(404).json({ error: "Delivery not found" });
    res.json(delivery);
  });

  app.put("/api/deliveries/:id", (req, res) => {
    const { id } = req.params;
    const { order_id, order_ids, salesman_id, delivery_date, items } = req.body;
    
    const targetOrderIds = order_ids || [order_id];
    if (!targetOrderIds || targetOrderIds.length === 0) {
      return res.status(400).json({ error: "No orders specified" });
    }

    const items_total = items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);
    const tax_total = items.reduce((sum: number, item: any) => sum + (item.sales_tax_amount || 0), 0);
    const add_tax_total = items.reduce((sum: number, item: any) => sum + (item.additional_tax_amount || 0), 0);
    const discount_total = items.reduce((sum: number, item: any) => sum + (item.discount_amount || 0), 0);
    const extra_discount_total = items.reduce((sum: number, item: any) => sum + (item.extra_discount_amount || 0), 0);
    const totalAmount = items_total + tax_total + add_tax_total - discount_total - extra_discount_total;

    const transaction = db.transaction(() => {
      // 0. Get old data for restoration
      const oldDelivery = db.prepare("SELECT order_id, shop_id FROM deliveries WHERE id = ?").get(id) as any;
      if (!oldDelivery) throw new Error("Delivery not found");

      // Validation: Ensure all target orders belong to the same shop
      const ordersData = db.prepare(`
        SELECT shop_id FROM orders WHERE id IN (${targetOrderIds.map(() => '?').join(',')})
      `).all(...targetOrderIds) as any[];

      const shopIds = new Set(ordersData.map(o => o.shop_id));
      if (shopIds.size > 1) {
        throw new Error("Validation Error: This delivery already contains items for a different shop. Cannot merge items from multiple shops into one delivery.");
      }

      const shop_id = ordersData[0].shop_id;
      
      const oldItems = db.prepare("SELECT * FROM delivery_items WHERE delivery_id = ?").all(id) as any[];
      const affectedOrderIds = new Set<number>();
      affectedOrderIds.add(oldDelivery.order_id);

      // 1. Restore Stock and Batch Quantities
      for (const item of oldItems) {
        // Restore product stock
        db.prepare("UPDATE products SET stock_quantity = stock_quantity + ? WHERE product_id = ?")
          .run(item.quantity, item.product_id);
        
        // Restore batch quantity (FIFO reversal - hard to be perfect without history, but we increment most recent non-full or oldest)
        // Simple approach: Increment the most recent batch for this product
        const lastBatch = db.prepare("SELECT id FROM product_batches WHERE product_id = ? ORDER BY received_date DESC LIMIT 1").get(item.product_id) as any;
        if (lastBatch) {
          db.prepare("UPDATE product_batches SET remaining_quantity = remaining_quantity + ? WHERE id = ?").run(item.quantity, lastBatch.id);
        }
        
        affectedOrderIds.add(db.prepare("SELECT order_id FROM order_items WHERE id = ?").get(item.order_item_id).order_id);
      }

      // 2. Delete old items
      db.prepare("DELETE FROM delivery_items WHERE delivery_id = ?").run(id);

      // 3. Update Delivery Header
      db.prepare(`
        UPDATE deliveries 
        SET order_id = ?, shop_id = ?, salesman_id = ?, delivery_date = ?, total_amount = ?
        WHERE id = ?
      `).run(targetOrderIds[0], shop_id, salesman_id, delivery_date, totalAmount, id);

      // 4. Process New Items
      for (const item of items) {
        db.prepare(`
          INSERT INTO delivery_items (
            delivery_id, order_item_id, product_id, quantity, price, 
            sales_tax_pct, sales_tax_amount, additional_tax_pct, additional_tax_amount,
            discount_pct, discount_amount, extra_discount_pct, extra_discount_amount
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          id, item.order_item_id, item.product_id, item.quantity, item.price, 
          item.sales_tax_pct || 0, item.sales_tax_amount || 0, item.additional_tax_pct || 0, item.additional_tax_amount || 0,
          item.discount_pct || 0, item.discount_amount || 0, item.extra_discount_pct || 0, item.extra_discount_amount || 0
        );

        // Update stock and valuation using Issue Valuation (does not change MAP)
        processIssueValuation(db, item.product_id, item.quantity, 'SALE', id, `Update Sales Delivery #${id}`);
        
        let remainingToReduce = item.quantity;
        const batches = db.prepare("SELECT * FROM product_batches WHERE product_id = ? AND remaining_quantity > 0 ORDER BY received_date ASC").all(item.product_id) as any[];
        for (const batch of batches) {
          if (remainingToReduce <= 0) break;
          const reduce = Math.min(batch.remaining_quantity, remainingToReduce);
          db.prepare("UPDATE product_batches SET remaining_quantity = remaining_quantity - ? WHERE id = ?").run(reduce, batch.id);
          remainingToReduce -= reduce;
        }

        // Update order item status
        const stats = db.prepare(`
          SELECT oi.quantity as ordered, COALESCE((SELECT SUM(di.quantity) FROM delivery_items di JOIN deliveries d ON di.delivery_id = d.id WHERE di.order_item_id = oi.id AND d.status != 'cancelled'), 0) as delivered, oi.order_id
          FROM order_items oi
          WHERE oi.id = ?
        `).get(item.order_item_id) as any;

        affectedOrderIds.add(stats.order_id);
        const itemStatus = stats.delivered >= stats.ordered ? 'delivered' : (stats.delivered > 0 ? 'partially_delivered' : 'pending');
        db.prepare("UPDATE order_items SET status = ? WHERE id = ?").run(itemStatus, item.order_item_id);
      }

      // 5. Update Status for all affected Orders
      for (const oid of affectedOrderIds) {
        const orderItems = db.prepare("SELECT status FROM order_items WHERE order_id = ?").all(oid) as any[];
        if (orderItems.length > 0) {
          const allDelivered = orderItems.every(i => i.status === 'delivered');
          db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(allDelivered ? 'delivered' : 'pending', oid);
        }
      }

      // 6. Update Client Ledger
      const ledgerEntry = db.prepare("SELECT id, debit, balance FROM client_ledger WHERE description LIKE ?").get(`%Delivery #DEL-${id}%`) as any;
      if (ledgerEntry) {
        const diff = totalAmount - ledgerEntry.debit;
        db.prepare(`
          UPDATE client_ledger 
          SET debit = ?, date = ?, balance = balance + ?
          WHERE id = ?
        `).run(totalAmount, delivery_date, diff, ledgerEntry.id);
        
        db.prepare(`
          UPDATE client_ledger
          SET balance = balance + ?
          WHERE shop_id = ? AND id > ?
        `).run(diff, oldDelivery.shop_id, ledgerEntry.id);
      }

      return true;
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (err: any) {
      console.error("Failed to update delivery", err);
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/deliveries/:id/items", (req, res) => {
    const { id } = req.params;
    const items = db.prepare(`
      SELECT 
        di.*, 
        p.product_name, 
        p.brand, 
        oi.order_id as order_ref,
        oi.discount_pct as discount_pct,
        oi.sales_tax_pct as sales_tax_pct,
        oi.additional_tax_pct as additional_tax_pct,
        oi.extra_discount_pct as extra_discount_pct,
        (oi.quantity - (
          SELECT COALESCE(SUM(di2.quantity), 0) 
          FROM delivery_items di2 
          JOIN deliveries d ON di2.delivery_id = d.id
          WHERE di2.order_item_id = oi.id AND d.status != 'cancelled' AND d.id != ?
        )) as remaining_on_order,
        (
          SELECT COALESCE(SUM(ri.quantity), 0)
          FROM return_items ri
          WHERE ri.delivery_item_id = di.id
        ) as return_qty,
        (di.quantity - (
          SELECT COALESCE(SUM(ri.quantity), 0)
          FROM return_items ri
          WHERE ri.delivery_item_id = di.id
        )) as net_qty
      FROM delivery_items di
      JOIN products p ON di.product_id = p.product_id
      JOIN order_items oi ON di.order_item_id = oi.id
      WHERE di.delivery_id = ?
    `).all(id, id);
    res.json(items);
  });

  app.get("/api/orders/:id/pending-items", (req, res) => {
    const { id } = req.params;
    const { excludeDeliveryId } = req.query;
    const items = db.prepare(`
      SELECT 
        oi.*, 
        p.product_name, 
        p.brand,
        COALESCE((
          SELECT SUM(di.quantity) 
          FROM delivery_items di 
          JOIN deliveries d ON di.delivery_id = d.id
          WHERE di.order_item_id = oi.id 
          AND d.status != 'cancelled'
          ${excludeDeliveryId ? 'AND d.id != ?' : ''}
        ), 0) as delivered_quantity
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?
    `).all(...(excludeDeliveryId ? [excludeDeliveryId, id] : [id]));
    
    // Filter items that still have balance
    const pendingItems = items.filter((item: any) => item.quantity > item.delivered_quantity);
    res.json(pendingItems);
  });

  app.post("/api/deliveries", (req, res) => {
    const { order_id, order_ids, salesman_id, delivery_date, items } = req.body;
    
    const transaction = db.transaction(() => {
      const targetOrderIds = order_ids || [order_id];
      if (!targetOrderIds || targetOrderIds.length === 0) throw new Error("No orders specified");

      // Validation: Retailer Matching (One shop per batch)
      const ordersData = db.prepare(`
        SELECT shop_id, id, status FROM orders WHERE id IN (${targetOrderIds.map(() => '?').join(',')})
      `).all(...targetOrderIds) as any[];

      if (ordersData.length === 0) throw new Error("Orders not found");

      const shopIds = new Set(ordersData.map(o => o.shop_id));
      if (shopIds.size > 1) {
        throw new Error("Validation Error: This delivery already contains items for a different shop. Cannot merge items from multiple shops into one delivery.");
      }
      
      if (ordersData.some(o => o.status === 'cancelled')) {
        throw new Error("Cannot create delivery for cancelled orders.");
      }

      const shop_id = ordersData[0].shop_id;

      // 1. Create Delivery Header
      const items_total = items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);
      const tax_total = items.reduce((sum: number, item: any) => sum + (item.sales_tax_amount || 0), 0);
      const add_tax_total = items.reduce((sum: number, item: any) => sum + (item.additional_tax_amount || 0), 0);
      const discount_total = items.reduce((sum: number, item: any) => sum + (item.discount_amount || 0), 0);
      const extra_discount_total = items.reduce((sum: number, item: any) => sum + (item.extra_discount_amount || 0), 0);
      const totalAmount = items_total + tax_total + add_tax_total - discount_total - extra_discount_total;

      const deliveryResult = db.prepare(`
        INSERT INTO deliveries (order_id, shop_id, salesman_id, delivery_date, total_amount)
        VALUES (?, ?, ?, ?, ?)
      `).run(targetOrderIds[0], shop_id, salesman_id, delivery_date, totalAmount);
      
      const deliveryId = deliveryResult.lastInsertRowid;

      // Track unique order IDs actually used in this delivery
      const affectedOrderIds = new Set<number>();
      for (const id of targetOrderIds) affectedOrderIds.add(id);

      // 2. Process Items
      for (const item of items) {
        // Validation: Check remaining balance for this order item
        const orderItem = db.prepare(`
          SELECT 
            oi.*,
            COALESCE((SELECT SUM(di.quantity) FROM delivery_items di 
                      JOIN deliveries d ON di.delivery_id = d.id 
                      WHERE di.order_item_id = oi.id AND d.status != 'cancelled'), 0) as delivered_quantity
          FROM order_items oi
          WHERE oi.id = ?
        `).get(item.order_item_id) as any;

        if (!orderItem) throw new Error(`Order item ${item.order_item_id} not found`);
        
        const remaining = orderItem.quantity - orderItem.delivered_quantity;
        if (item.quantity > remaining) {
          throw new Error(`Delivery quantity (${item.quantity}) exceeds remaining balance (${remaining}) for product ${item.product_id}`);
        }

        // Insert delivery item
        db.prepare(`
          INSERT INTO delivery_items (
            delivery_id, order_item_id, product_id, quantity, price, 
            sales_tax_pct, sales_tax_amount, additional_tax_pct, additional_tax_amount,
            discount_pct, discount_amount, extra_discount_pct, extra_discount_amount
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          deliveryId, item.order_item_id, item.product_id, item.quantity, item.price, 
          item.sales_tax_pct || 0, item.sales_tax_amount || 0, item.additional_tax_pct || 0, item.additional_tax_amount || 0,
          item.discount_pct || 0, item.discount_amount || 0, item.extra_discount_pct || 0, item.extra_discount_amount || 0
        );

        // Update order item status
        const newDeliveredTotal = orderItem.delivered_quantity + item.quantity;
        const itemStatus = newDeliveredTotal >= orderItem.quantity ? 'delivered' : 'partially_delivered';
        db.prepare("UPDATE order_items SET status = ? WHERE id = ?").run(itemStatus, item.order_item_id);

        // Update stock and valuation using Issue Valuation (does not change MAP)
        processIssueValuation(db, item.product_id, item.quantity, 'SALE', deliveryId, `Sales Delivery #${deliveryId}`);
        
        let remainingToReduce = item.quantity;
        const batches = db.prepare("SELECT * FROM product_batches WHERE product_id = ? AND remaining_quantity > 0 ORDER BY received_date ASC").all(item.product_id) as any[];
        for (const batch of batches) {
          if (remainingToReduce <= 0) break;
          const reduce = Math.min(batch.remaining_quantity, remainingToReduce);
          db.prepare("UPDATE product_batches SET remaining_quantity = remaining_quantity - ? WHERE id = ?").run(reduce, batch.id);
          remainingToReduce -= reduce;
        }
      }

      // 3. Update Order Statuses for all affected orders
      for (const oid of affectedOrderIds) {
        const orderItems = db.prepare("SELECT status FROM order_items WHERE order_id = ?").all(oid) as any[];
        const allDelivered = orderItems.length > 0 && orderItems.every(item => item.status === 'delivered');
        db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(allDelivered ? 'delivered' : 'pending', oid);
      }

      // 4. Update Client Ledger (Debit the shop for the delivery)
      const lastLedger = db.prepare("SELECT balance FROM client_ledger WHERE shop_id = ? ORDER BY id DESC LIMIT 1").get(shop_id) as any;
      const currentBalance = (lastLedger?.balance || 0) + totalAmount;

      const batchDesc = targetOrderIds.length > 1 
        ? `Consolidated Delivery #DEL-${deliveryId} for Orders [${targetOrderIds.map(id => '#ORD-'+id).join(', ')}]` 
        : `Delivery #DEL-${deliveryId} for Order #ORD-${targetOrderIds[0]}`;

      db.prepare(`
        INSERT INTO client_ledger (shop_id, date, description, debit, balance)
        VALUES (?, ?, ?, ?, ?)
      `).run(shop_id, delivery_date, batchDesc, totalAmount, currentBalance);

      return deliveryId;
    });

    try {
      const deliveryId = transaction();
      res.json({ id: deliveryId });
    } catch (err: any) {
      console.error("Failed to create delivery", err);
      res.status(400).json({ error: err.message });
    }
  });

  // Invoice APIs
  app.get("/api/invoices", (req, res) => {
    const invoices = db.prepare(`
      SELECT i.*, s.shop_name
      FROM invoices i
      JOIN shops s ON i.shop_id = s.id
      ORDER BY i.created_at DESC
    `).all();
    res.json(invoices);
  });

  app.post("/api/invoices", (req, res) => {
    const { shop_id, invoice_date, delivery_ids, items } = req.body;

    const transaction = db.transaction(() => {
      // 1. Calculate Totals
      const gross = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
      const totalDisc = items.reduce((sum: number, item: any) => {
        const itemGross = item.quantity * item.unit_price;
        const disc = (item.trade_discount_pct || 0) + (item.special_discount_pct || 0);
        return sum + (itemGross * disc / 100);
      }, 0);
      const totalTax = items.reduce((sum: number, item: any) => {
        const itemGross = item.quantity * item.unit_price;
        const tax = (item.tax_pct || 0) + (item.additional_tax_pct || 0);
        return sum + (itemGross * tax / 100);
      }, 0);
      const net = gross - totalDisc + totalTax;

      // 2. Create Invoice
      const info = db.prepare(`
        INSERT INTO invoices (shop_id, invoice_date, gross_amount, total_discount, total_tax, net_amount)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(shop_id, invoice_date, gross, totalDisc, totalTax, net);
      const invoiceId = info.lastInsertRowid;

      // 3. Create Invoice Items
      const insertItem = db.prepare(`
        INSERT INTO invoice_items (
          invoice_id, delivery_id, delivery_item_id, product_id, 
          quantity, unit_price, trade_discount_pct, tax_pct, additional_tax_pct, special_discount_pct, net_amount
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        insertItem.run(
          invoiceId, item.delivery_id, item.delivery_item_id, item.product_id,
          item.quantity, item.unit_price, item.trade_discount_pct || 0,
          item.tax_pct || 0, item.additional_tax_pct || 0, item.special_discount_pct || 0, item.net_amount
        );
      }

      // 4. Update Deliveries - mark as billed and link to invoice
      const updateDelivery = db.prepare("UPDATE deliveries SET invoice_id = ?, status = 'billed' WHERE id = ?");
      for (const dId of delivery_ids) {
        updateDelivery.run(invoiceId, dId);
      }

      return invoiceId;
    });

    try {
      const invoiceId = transaction();
      res.json({ success: true, invoiceId: invoiceId });
    } catch (err: any) {
      console.error("Invoice generation failure:", err);
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/invoices/:id", (req, res) => {
    try {
      const { id } = req.params;
      const invoice = db.prepare(`
        SELECT i.*, s.shop_name, s.owner_name, s.location, s.phone
        FROM invoices i
        JOIN shops s ON i.shop_id = s.id
        WHERE i.id = ?
      `).get(id) as any;

      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      const items = db.prepare(`
        SELECT ii.*, p.product_name, p.unit as uom
        FROM invoice_items ii
        JOIN products p ON ii.product_id = p.product_id
        WHERE ii.invoice_id = ?
      `).all(id);

      res.json({ ...invoice, items });
    } catch (err: any) {
      console.error("Failed to fetch invoice:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/invoices/cancel", (req, res) => {
    const { invoice_id } = req.body;
    if (!invoice_id) return res.status(400).json({ error: "Invoice ID is required" });

    const transaction = db.transaction(() => {
      // 1. Verify existence and status
      const invoice = db.prepare("SELECT * FROM invoices WHERE id = ?").get(invoice_id) as any;
      if (!invoice) throw new Error("Invoice not found");
      if (invoice.status === 'cancelled') throw new Error("Invoice already cancelled");

      // 2. Set deliveries back to 'completed' and clear invoice_id
      db.prepare("UPDATE deliveries SET invoice_id = NULL, status = 'completed' WHERE invoice_id = ?").run(invoice_id);

      // 3. Set invoice status to 'cancelled'
      db.prepare("UPDATE invoices SET status = 'cancelled' WHERE id = ?").run(invoice_id);

      return true;
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (err: any) {
      console.error("Invoice cancellation error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/invoices/bulk-cancel", (req, res) => {
    const { start_id, end_id } = req.body;
    if (!start_id || !end_id) return res.status(400).json({ error: "Start and End IDs are required" });

    const transaction = db.transaction(() => {
      // Find all non-cancelled invoices in range
      const invoices = db.prepare("SELECT id FROM invoices WHERE id BETWEEN ? AND ? AND status != 'cancelled'").all(start_id, end_id) as any[];
      
      for (const inv of invoices) {
        db.prepare("UPDATE deliveries SET invoice_id = NULL, status = 'completed' WHERE invoice_id = ?").run(inv.id);
        db.prepare("UPDATE invoices SET status = 'cancelled' WHERE id = ?").run(inv.id);
      }

      return invoices.length;
    });

    try {
      const count = transaction();
      res.json({ success: true, count });
    } catch (err: any) {
      console.error("Bulk invoice cancellation error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/invoices/:id", (req, res) => {
    const { id } = req.params;
    const transaction = db.transaction(() => {
      // Restore deliveries status
      db.prepare("UPDATE deliveries SET invoice_id = NULL, status = 'completed' WHERE invoice_id = ?").run(id);
      
      // Delete items and invoice
      db.prepare("DELETE FROM invoice_items WHERE invoice_id = ?").run(id);
      db.prepare("DELETE FROM invoices WHERE id = ?").run(id);
      return true;
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/purchases", (req, res) => {
    const purchases = db.prepare(`
      SELECT p.*, s.name as supplier_name
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.id
      ORDER BY p.purchase_date DESC
    `).all();
    res.json(purchases);
  });

  app.get("/api/purchases/:id/items", (req, res) => {
    const { id } = req.params;
    const items = db.prepare(`
      SELECT pi.*, p.product_name, p.brand
      FROM purchase_items pi
      JOIN products p ON pi.product_id = p.product_id
      WHERE pi.purchase_id = ?
    `).all(id);
    res.json(items);
  });

  app.get("/api/purchases/:id", (req, res) => {
    const { id } = req.params;
    const purchase = db.prepare(`
      SELECT p.*, s.name as supplier_name
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?
    `).get(id);
    if (!purchase) return res.status(404).json({ error: "Purchase not found" });
    res.json(purchase);
  });

  app.post("/api/purchases", (req, res) => {
    const { supplier_id, items } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Purchase must contain at least one item." });
    }

    const total_amount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);

    const transaction = db.transaction(() => {
      // 1. Create Purchase Record
      const purchase = db.prepare("INSERT INTO purchases (supplier_id, total_amount, status) VALUES (?, ?, ?)").run(
        supplier_id, total_amount, 'received'
      );
      const purchase_id = purchase.lastInsertRowid;

      for (const item of items) {
        if (item.quantity <= 0 || item.price <= 0) {
          throw new Error(`Quantity and price must be greater than zero for product ${item.product_id}`);
        }

        // 2. Check Price Deviation
        const lastPurchase = db.prepare("SELECT purchase_price FROM product_batches WHERE product_id = ? ORDER BY received_date DESC LIMIT 1").get(item.product_id) as any;
        if (lastPurchase) {
          const deviation = Math.abs(item.price - lastPurchase.purchase_price) / lastPurchase.purchase_price;
          if (deviation > 0.1) {
            console.warn(`Price deviation alert for ${item.product_id}: ${Math.round(deviation * 100)}%`);
          }
        }

        // 3. Create Purchase Item
        db.prepare("INSERT INTO purchase_items (purchase_id, product_id, quantity, price, supplier_batch_no, storage_location) VALUES (?, ?, ?, ?, ?, ?)").run(
          purchase_id, item.product_id, item.quantity, item.price, item.supplier_batch_no, item.storage_location
        );

        // 4. Create Inventory Batch
        db.prepare("INSERT INTO product_batches (product_id, purchase_id, quantity, remaining_quantity, purchase_price, supplier_batch_no, storage_location) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
          item.product_id, purchase_id, item.quantity, item.quantity, item.price, item.supplier_batch_no, item.storage_location
        );

        // 5. Update Product Master with Moving Average Price (MAP) Calculation
        processPurchaseValuation(db, item.product_id, item.quantity, item.price, purchase_id, `Purchase #${purchase_id}`);
      }
      return purchase_id;
    });

    try {
      const purchase_id = transaction();
      res.json({ id: purchase_id });
    } catch (err: any) {
      console.error("Purchase transaction failed", err);
      res.status(500).json({ error: err.message || "Failed to create purchase" });
    }
  });

  app.put("/api/purchases/:id", (req, res) => {
    const { id } = req.params;
    const { supplier_id, items } = req.body;
    
    const total_amount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);

    const transaction = db.transaction(() => {
      // 1. Get old items to reverse stock and valuation
      const oldItems = db.prepare("SELECT product_id, quantity FROM purchase_items WHERE purchase_id = ?").all(id) as any[];
      for (const oldItem of oldItems) {
        processPurchaseReturnValuation(db, oldItem.product_id, oldItem.quantity, id, `Reversal of Purchase #${id}`);
      }

      // 2. Delete old items and batches
      db.prepare("DELETE FROM purchase_items WHERE purchase_id = ?").run(id);
      db.prepare("DELETE FROM product_batches WHERE purchase_id = ?").run(id);

      // 3. Update Purchase Record
      db.prepare("UPDATE purchases SET supplier_id = ?, total_amount = ? WHERE id = ?").run(supplier_id, total_amount, id);

      // 4. Insert new items and batches with MAP calculation
      for (const item of items) {
        db.prepare("INSERT INTO purchase_items (purchase_id, product_id, quantity, price, supplier_batch_no, storage_location) VALUES (?, ?, ?, ?, ?, ?)").run(
          id, item.product_id, item.quantity, item.price, item.supplier_batch_no, item.storage_location
        );

        db.prepare("INSERT INTO product_batches (product_id, purchase_id, quantity, remaining_quantity, purchase_price, supplier_batch_no, storage_location) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
          item.product_id, id, item.quantity, item.quantity, item.price, item.supplier_batch_no, item.storage_location
        );

        processPurchaseValuation(db, item.product_id, item.quantity, item.price, id, `Update Purchase #${id}`);
      }
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (err: any) {
      console.error("Purchase update failed", err);
      res.status(500).json({ error: err.message || "Failed to update purchase" });
    }
  });

  app.delete("/api/purchases/:id", (req, res) => {
    const { id } = req.params;
    const transaction = db.transaction(() => {
      // 1. Get purchase items to reverse stock and valuation
      const items = db.prepare("SELECT product_id, quantity FROM purchase_items WHERE purchase_id = ?").all(id) as any[];
      if (items.length === 0) {
        const purchase = db.prepare("SELECT id FROM purchases WHERE id = ?").get(id);
        if (!purchase) throw new Error("Purchase not found");
      }

      for (const item of items) {
        processPurchaseReturnValuation(db, item.product_id, item.quantity, id, `Cancellation of Purchase #${id}`);
      }

      // 2. Delete batches associated with this purchase
      db.prepare("DELETE FROM product_batches WHERE purchase_id = ?").run(id);

      // 3. Delete Purchase Items and Header
      db.prepare("DELETE FROM purchase_items WHERE purchase_id = ?").run(id);
      db.prepare("DELETE FROM purchases WHERE id = ?").run(id);

      return true;
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (err: any) {
      console.error("Delete purchase failure", err);
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/reports/stock-valuation", (req, res) => {
    const valuation = db.prepare(`
      SELECT 
        SUM(remaining_quantity * pb.purchase_price) as totalValueAtPP,
        SUM(remaining_quantity * p.trade_price) as totalPotentialRevenueAtTP
      FROM product_batches pb
      JOIN products p ON pb.product_id = p.product_id
      WHERE remaining_quantity > 0
    `).get() as any;

    const totalValueAtPP = valuation.totalValueAtPP || 0;
    const totalPotentialRevenueAtTP = valuation.totalPotentialRevenueAtTP || 0;
    const totalPotentialProfit = totalPotentialRevenueAtTP - totalValueAtPP;
    const averageMarginPercent = totalPotentialRevenueAtTP > 0 
      ? (totalPotentialProfit / totalPotentialRevenueAtTP) * 100 
      : 0;

    res.json({
      totalValueAtPP,
      totalPotentialRevenueAtTP,
      totalPotentialProfit,
      averageMarginPercent
    });
  });

  app.get("/api/reports/daily-load-plan", (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      let queryStr = `
        SELECT 
          i.id as invoice_id,
          i.invoice_date,
          i.net_amount as invoice_net_amount,
          s.id as shop_id,
          s.shop_name,
          s.location as sub_area,
          s.owner_name,
          s.phone,
          ii.product_id,
          p.product_name,
          p.unit,
          ii.quantity,
          ii.unit_price,
          ii.net_amount as item_net_amount
        FROM invoices i
        JOIN shops s ON i.shop_id = s.id
        JOIN invoice_items ii ON ii.invoice_id = i.id
        JOIN products p ON ii.product_id = p.product_id
      `;
      const params: any[] = [];
      const conditions: string[] = [];

      if (startDate) {
        conditions.push("strftime('%Y-%m-%d', i.invoice_date) >= ?");
        params.push(startDate);
      }
      if (endDate) {
        conditions.push("strftime('%Y-%m-%d', i.invoice_date) <= ?");
        params.push(endDate);
      }

      if (conditions.length > 0) {
        queryStr += " WHERE " + conditions.join(" AND ");
      }

      queryStr += " ORDER BY s.location, s.shop_name, ii.product_id";

      const rows = db.prepare(queryStr).all(...params) as any[];

      const subAreasMap = new Map<string, any>();

      for (const r of rows) {
        const areaName = r.sub_area || "Unspecified Sub-Area";
        if (!subAreasMap.has(areaName)) {
          subAreasMap.set(areaName, {
            subArea: areaName,
            shops: new Map<number, any>()
          });
        }

        const area = subAreasMap.get(areaName);
        if (!area.shops.has(r.shop_id)) {
          area.shops.set(r.shop_id, {
            shopId: r.shop_id,
            shopName: r.shop_name,
            ownerName: r.owner_name,
            phone: r.phone,
            invoices: new Set<number>(),
            productsMap: new Map<string, any>()
          });
        }

        const shop = area.shops.get(r.shop_id);
        shop.invoices.add(r.invoice_id);

        if (!shop.productsMap.has(r.product_id)) {
          shop.productsMap.set(r.product_id, {
            productId: r.product_id,
            productName: r.product_name,
            unit: r.unit || 'Pcs',
            quantity: 0,
            unitPrice: r.unit_price,
            totalAmount: 0
          });
        }

        const prod = shop.productsMap.get(r.product_id);
        prod.quantity += r.quantity;
        prod.totalAmount += r.item_net_amount;
      }

      const result = Array.from(subAreasMap.values()).map(area => {
        let deliverySequence = 1;
        const shopsArray = Array.from(area.shops.values()).map((shop: any) => {
          const productsArray = Array.from(shop.productsMap.values());
          const invoicesArray = Array.from(shop.invoices);
          return {
            shopId: shop.shopId,
            shopName: shop.shopName,
            ownerName: shop.ownerName,
            phone: shop.phone,
            deliverySequence: deliverySequence++,
            invoices: invoicesArray,
            products: productsArray
          };
        });

        const consolidatedMap = new Map<string, any>();
        for (const sh of shopsArray) {
          for (const p of sh.products as any[]) {
            if (!consolidatedMap.has(p.productId)) {
              consolidatedMap.set(p.productId, {
                productId: p.productId,
                productName: p.productName,
                totalQuantity: 0,
                unit: p.unit
              });
            }
            consolidatedMap.get(p.productId).totalQuantity += p.quantity;
          }
        }

        return {
          subArea: area.subArea,
          totalShopsCount: shopsArray.length,
          totalOutstandingInvoices: shopsArray.reduce((acc: number, current: any) => acc + current.invoices.length, 0),
          shops: shopsArray,
          consolidatedLoadSummary: Array.from(consolidatedMap.values())
        };
      });

      res.json(result);
    } catch (err: any) {
      console.error("Failed to generate daily load plan", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/reports/invoices-range", (req, res) => {
    try {
      const { startDate, endDate, invoiceNoFrom, invoiceNoTo } = req.query;

      let queryStr = `
        SELECT i.*, s.shop_name, s.owner_name, s.location, s.phone
        FROM invoices i
        JOIN shops s ON i.shop_id = s.id
      `;

      const params: any[] = [];
      const conditions: string[] = [];

      if (startDate) {
        conditions.push("strftime('%Y-%m-%d', i.invoice_date) >= ?");
        params.push(startDate);
      }
      if (endDate) {
        conditions.push("strftime('%Y-%m-%d', i.invoice_date) <= ?");
        params.push(endDate);
      }
      
      if (invoiceNoFrom) {
        const match = invoiceNoFrom.toString().match(/\d+/);
        let numFrom = match ? Number(match[0]) : Number(invoiceNoFrom);
        if (numFrom >= 300919) {
          numFrom = numFrom - 300918;
        }
        conditions.push("i.id >= ?");
        params.push(numFrom);
      }
      if (invoiceNoTo) {
        const match = invoiceNoTo.toString().match(/\d+/);
        let numTo = match ? Number(match[0]) : Number(invoiceNoTo);
        if (numTo >= 300919) {
          numTo = numTo - 300918;
        }
        conditions.push("i.id <= ?");
        params.push(numTo);
      }

      if (conditions.length > 0) {
        queryStr += " WHERE " + conditions.join(" AND ");
      }

      queryStr += " ORDER BY i.id ASC";

      const invoices = db.prepare(queryStr).all(params) as any[];

      // Fetch items for each invoice
      const result = invoices.map(invoice => {
        const items = db.prepare(`
          SELECT ii.*, p.product_name, p.unit as uom
          FROM invoice_items ii
          JOIN products p ON ii.product_id = p.product_id
          WHERE ii.invoice_id = ?
        `).all(invoice.id);
        return {
          ...invoice,
          items
        };
      });

      res.json(result);
    } catch (err: any) {
      console.error("Failed to fetch invoices range report", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/reports/stock-detail", (req, res) => {
    try {
      const { productId, startDate, endDate } = req.query;
      if (!productId) {
        return res.status(400).json({ error: "productId is required" });
      }

      // Get product info
      const product = db.prepare("SELECT * FROM products WHERE product_id = ?").get(productId) as any;
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      // 1. Get constant system opening stock baseline
      const systemOpeningResult = db.prepare(`
        SELECT COALESCE(SUM(quantity), 0) AS total
        FROM product_batches
        WHERE product_id = ? AND purchase_id IS NULL
      `).get(productId) as { total: number };
      const systemOpening = systemOpeningResult ? systemOpeningResult.total : 0;

      // 2. Query all transaction stock movements (excluding initial/opening stock as transactions)
      const purchases = db.prepare(`
        SELECT 
          p.purchase_date AS doc_date,
          p.id AS doc_id,
          'Purchase' AS type,
          s.name AS description,
          pi.price AS rate,
          pi.quantity AS qty,
          0 AS return_qty,
          pi.price * pi.quantity AS net_amount
        FROM purchase_items pi
        JOIN purchases p ON pi.purchase_id = p.id
        JOIN suppliers s ON p.supplier_id = s.id
        WHERE pi.product_id = ? AND p.status != 'cancelled'
      `).all(productId) as any[];

      const sales = db.prepare(`
        SELECT 
          i.invoice_date AS doc_date,
          i.id AS doc_id,
          'Sale' AS type,
          sh.shop_name AS description,
          ii.unit_price AS rate,
          ii.quantity AS qty,
          0 AS return_qty,
          ii.net_amount AS net_amount
        FROM invoice_items ii
        JOIN invoices i ON ii.invoice_id = i.id
        JOIN shops sh ON i.shop_id = sh.id
        WHERE ii.product_id = ? AND i.status != 'cancelled'
      `).all(productId) as any[];

      const salesReturns = db.prepare(`
        SELECT 
          sr.return_date AS doc_date,
          sr.id AS doc_id,
          'Sale Return' AS type,
          sh.shop_name AS description,
          sri.unit_price AS rate,
          0 AS qty,
          sri.quantity AS return_qty,
          sri.unit_price * sri.quantity AS net_amount
        FROM sales_return_items sri
        JOIN sales_returns sr ON sri.sales_return_id = sr.id
        JOIN shops sh ON sr.shop_id = sh.id
        WHERE sri.product_id = ? AND sr.status != 'cancelled'
      `).all(productId) as any[];

      const purchaseReturns = db.prepare(`
        SELECT 
          pr.return_date AS doc_date,
          pr.id AS doc_id,
          'Purchase Return' AS type,
          s.name AS description,
          pri.unit_price AS rate,
          0 AS qty,
          pri.quantity AS return_qty,
          pri.unit_price * pri.quantity AS net_amount
        FROM purchase_return_items pri
        JOIN purchase_returns pr ON pri.purchase_return_id = pr.id
        JOIN suppliers s ON pr.supplier_id = s.id
        WHERE pri.product_id = ? AND pr.status != 'cancelled'
      `).all(productId) as any[];

      // Combine non-baseline movements
      let allMovements = [
        ...purchases,
        ...sales,
        ...salesReturns,
        ...purchaseReturns
      ];

      // Helper to parse date to YYYY-MM-DD
      const toDateStr = (dateStr: string) => {
        if (!dateStr) return '';
        return dateStr.replace('T', ' ').split(' ')[0]; // Split '2026-06-17 11:29:39' -> '2026-06-17'
      };

      // Helper to parse exact Date + Time consistently using local time parameters
      const parseDateTime = (str: string) => {
        if (!str) return 0;
        // Normalize ISO string "YYYY-MM-DDTHH:MM:SS..." to "YYYY-MM-DD HH:MM:SS"
        const normalized = str.replace('T', ' ').replace(/\..+$/, '').replace('Z', '');
        const parts = normalized.split(' ');
        const dateParts = parts[0].split('-');
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const day = parseInt(dateParts[2], 10);
        
        if (parts.length > 1) {
          const timeParts = parts[1].split(':');
          const hours = parseInt(timeParts[0], 10);
          const minutes = parseInt(timeParts[1], 10);
          const seconds = parseInt(timeParts[2], 10);
          return new Date(year, month, day, hours, minutes, seconds).getTime();
        }
        return new Date(year, month, day, 0, 0, 0).getTime();
      };

      // Type priority for stable sorting on the exact same date and time
      const typePriority: Record<string, number> = {
        'Purchase': 1,
        'Purchase Return': 2,
        'Sale Return': 3,
        'Sale': 4
      };

      // Sort chronologically datewise
      allMovements.sort((a, b) => {
        const timeA = parseDateTime(a.doc_date);
        const timeB = parseDateTime(b.doc_date);
        if (timeA !== timeB) return timeA - timeB;
        
        // If same time, sort by priority
        const pA = typePriority[a.type] || 9;
        const pB = typePriority[b.type] || 9;
        if (pA !== pB) return pA - pB;

        return a.doc_id - b.doc_id;
      });

      // Split into before and within date range
      const sDate = startDate ? (startDate as string) : '2026-06-17';
      const eDate = endDate ? (endDate as string) : '2026-06-17';

      let openingBalance = systemOpening;
      const ledgerItems: any[] = [];

      for (const m of allMovements) {
        const mDateStr = toDateStr(m.doc_date);
        
        // Calculate effect of movement on stock balance
        const qtyDiff = (m.type === 'Purchase')
          ? m.qty
          : (m.type === 'Sale Return')
            ? m.return_qty
            : (m.type === 'Purchase Return')
              ? -m.return_qty // Purchase Return decreases stock
              : -m.qty; // Sale decreases stock

        if (mDateStr < sDate) {
          openingBalance += qtyDiff;
        } else if (mDateStr >= sDate && mDateStr <= eDate) {
          ledgerItems.push(m);
        }
      }

      // Compute running balance for ledger items
      let runningBalance = openingBalance;
      const finalLedgerItems = ledgerItems.map(item => {
        const qtyDiff = (item.type === 'Purchase')
          ? item.qty
          : (item.type === 'Sale Return')
            ? item.return_qty
            : (item.type === 'Purchase Return')
              ? -item.return_qty
              : -item.qty;

        runningBalance += qtyDiff;
        return {
          ...item,
          balance: runningBalance
        };
      });

      res.json({
        product,
        startDate: sDate,
        endDate: eDate,
        openingBalance,
        ledger: finalLedgerItems
      });

    } catch (err: any) {
      console.error("Failed to fetch stock detail report", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/reports/area-wise-item-party-summary", (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      let queryStr = `
        SELECT 
          s.location as sub_area,
          s.shop_name as account_title,
          coalesce(ob.name, 'N/A') as booker,
          p.product_name as product,
          p.unit as pack_size,
          SUM(ii.quantity) as qty,
          ii.unit_price as rate,
          SUM(ii.net_amount) as amount,
          COUNT(DISTINCT i.id) as t_invoice
        FROM invoices i
        JOIN shops s ON i.shop_id = s.id
        JOIN invoice_items ii ON ii.invoice_id = i.id
        JOIN products p ON ii.product_id = p.product_id
        LEFT JOIN deliveries d ON ii.delivery_id = d.id
        LEFT JOIN orders o ON d.order_id = o.id
        LEFT JOIN order_bookers ob ON o.order_booker_id = ob.id
      `;

      const params: any[] = [];
      const conditions: string[] = [];

      if (startDate) {
        conditions.push("strftime('%Y-%m-%d', i.invoice_date) >= ?");
        params.push(startDate);
      }
      if (endDate) {
        conditions.push("strftime('%Y-%m-%d', i.invoice_date) <= ?");
        params.push(endDate);
      }

      if (conditions.length > 0) {
        queryStr += " WHERE " + conditions.join(" AND ");
      }

      queryStr += `
        GROUP BY s.location, s.shop_name, ob.name, p.product_name, p.unit, ii.unit_price
        ORDER BY s.location, s.shop_name, p.product_name
      `;

      const rows = db.prepare(queryStr).all(...params) as any[];
      res.json(rows);
    } catch (err: any) {
      console.error("Failed to generate Area Wise Item Party Summary report", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/payments", (req, res) => {
    const { shop_id, amount, payment_method, payment_date } = req.body;
    if (!shop_id || !amount) {
      return res.status(400).json({ error: "Shop ID and amount are required" });
    }

    const transaction = db.transaction(() => {
      // 1. Record payment
      const paymentRes = db.prepare("INSERT INTO payments (shop_id, amount, payment_method, payment_date) VALUES (?, ?, ?, ?)").run(
        shop_id, amount, payment_method || 'Cash', payment_date || new Date().toISOString()
      );
      
      // 2. Update Client Ledger (Credit the shop for the payment)
      const lastLedger = db.prepare("SELECT balance FROM client_ledger WHERE shop_id = ? ORDER BY id DESC LIMIT 1").get(shop_id) as any;
      const currentBalance = (lastLedger?.balance || 0) - amount;

      db.prepare(`
        INSERT INTO client_ledger (shop_id, date, description, credit, balance)
        VALUES (?, ?, ?, ?, ?)
      `).run(shop_id, payment_date || new Date().toISOString(), `Payment Received - ${payment_method || 'Cash'}`, amount, currentBalance);

      return paymentRes.lastInsertRowid;
    });

    try {
      const paymentId = transaction();
      res.json({ success: true, id: paymentId });
    } catch (err: any) {
      console.error("Payment processing error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/payments", (req, res) => {
    const payments = db.prepare(`
      SELECT p.*, s.shop_name 
      FROM payments p 
      JOIN shops s ON p.shop_id = s.id 
      ORDER BY p.payment_date DESC
    `).all();
    res.json(payments);
  });

  app.get("/api/suppliers", (req, res) => {
    const suppliers = db.prepare("SELECT * FROM suppliers").all();
    res.json(suppliers);
  });

  app.post("/api/suppliers", (req, res) => {
    const { name, contact_person, phone, address } = req.body;
    const result = db.prepare("INSERT INTO suppliers (name, contact_person, phone, address) VALUES (?, ?, ?, ?)").run(
      name, contact_person, phone, address
    );
    res.json({ id: result.lastInsertRowid });
  });

  // Drivers API
  app.get("/api/drivers", (req, res) => {
    const drivers = db.prepare("SELECT * FROM drivers").all();
    res.json(drivers);
  });

  app.post("/api/drivers", (req, res) => {
    const { name, father_name, cell_no, cnic_no, joining_date } = req.body;
    try {
      const result = db.prepare("INSERT INTO drivers (name, father_name, cell_no, cnic_no, joining_date) VALUES (?, ?, ?, ?, ?)").run(
        name, father_name, cell_no, cnic_no, joining_date
      );
      res.json({ id: result.lastInsertRowid });
    } catch (err) {
      res.status(500).json({ error: "Failed to create driver" });
    }
  });

  app.put("/api/drivers/:id", (req, res) => {
    const { name, father_name, cell_no, cnic_no, joining_date } = req.body;
    db.prepare("UPDATE drivers SET name = ?, father_name = ?, cell_no = ?, cnic_no = ?, joining_date = ? WHERE id = ?").run(
      name, father_name, cell_no, cnic_no, joining_date, req.params.id
    );
    res.json({ success: true });
  });

  app.delete("/api/drivers/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM drivers WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete driver. It may be in use." });
    }
  });

  app.get("/api/load-plans", (req, res) => {
    const plans = db.prepare(`
      SELECT lp.*, d.name as driver_name 
      FROM load_plans lp
      JOIN drivers d ON lp.driver_id = d.id
      ORDER BY lp.plan_date DESC
    `).all();
    res.json(plans);
  });

  app.get("/api/load-plans/:id/items", (req, res) => {
    const { id } = req.params;
    const items = db.prepare(`
      SELECT lpi.*, r.shop_name, o.total_amount, o.status as order_status
      FROM load_plan_items lpi
      JOIN orders o ON lpi.order_id = o.id
      JOIN shops r ON o.shop_id = r.id
      WHERE lpi.plan_id = ?
    `).all(id);
    res.json(items);
  });

  app.get("/api/ledger/:shopId", (req, res) => {
    const { shopId } = req.params;
    const entries = db.prepare("SELECT * FROM client_ledger WHERE shop_id = ? ORDER BY date DESC").all(shopId);
    res.json(entries);
  });

  // Location Hierarchy APIs
  const locationTypes = ['countries', 'provinces', 'cities', 'towns', 'areas', 'subareas'];
  const parentMap: Record<string, string> = {
    provinces: 'country_id',
    cities: 'province_id',
    towns: 'city_id',
    areas: 'town_id',
    subareas: 'area_id'
  };

  locationTypes.forEach(type => {
    app.get(`/api/locations/${type}`, (req, res) => {
      const parentId = req.query.parentId;
      const parentField = parentMap[type];
      
      let query = `SELECT * FROM ${type}`;
      let params: any[] = [];
      
      if (parentId && parentField) {
        query += ` WHERE ${parentField} = ?`;
        params.push(parentId);
      }
      
      const data = db.prepare(query).all(...params);
      res.json(data);
    });

    app.post(`/api/locations/${type}`, (req, res) => {
      const { name, parentId } = req.body;
      const parentField = parentMap[type];
      
      try {
        let result;
        if (parentField && parentId) {
          result = db.prepare(`INSERT INTO ${type} (name, ${parentField}) VALUES (?, ?)`).run(name, parentId);
        } else {
          result = db.prepare(`INSERT INTO ${type} (name) VALUES (?)`).run(name);
        }
        res.json({ id: result.lastInsertRowid });
      } catch (err: any) {
        res.status(400).json({ error: err.message });
      }
    });

    app.put(`/api/locations/${type}/:id`, (req, res) => {
      const { name } = req.body;
      const { id } = req.params;
      db.prepare(`UPDATE ${type} SET name = ? WHERE id = ?`).run(name, id);
      res.json({ success: true });
    });

    app.delete(`/api/locations/${type}/:id`, (req, res) => {
      const { id } = req.params;
      try {
        db.prepare(`DELETE FROM ${type} WHERE id = ?`).run(id);
        res.json({ success: true });
      } catch (err: any) {
        res.status(400).json({ error: `Cannot delete ${type.slice(0, -1)}. It may have children linked to it.` });
      }
    });
  });

  app.get("/api/sales-chart", (req, res) => {
    // Mock daily sales for the last 7 days
    const data = [
      { name: "Mon", sales: 45000 },
      { name: "Tue", sales: 52000 },
      { name: "Wed", sales: 48000 },
      { name: "Thu", sales: 61000 },
      { name: "Fri", sales: 55000 },
      { name: "Sat", sales: 67000 },
      { name: "Sun", sales: 42000 },
    ];
    res.json(data);
  });

  // Debug endpoints
  app.get("/api/debug/db-info", (req, res) => {
    try {
      const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
      const orderCount = db.prepare("SELECT COUNT(*) as count FROM orders").get();
      const invoiceCount = db.prepare("SELECT COUNT(*) as count FROM invoices").get();
      const deliveryCount = db.prepare("SELECT COUNT(*) as count FROM deliveries").get();
      
      res.json({
        dbPath,
        cwd: process.cwd(),
        counts: {
          users: userCount?.count || 0,
          orders: orderCount?.count || 0,
          invoices: invoiceCount?.count || 0,
          deliveries: deliveryCount?.count || 0
        },
        time: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/download-db", (req, res) => {
    const backupTempPath = path.join(process.cwd(), "uploads", `backup_${Date.now()}.db`);
    
    try {
      // VACUUM INTO creates a single-file, fully-checkpointed backup that doesn't need WAL/SHM
      console.log("[Database] Creating clean backup using VACUUM INTO...");
      db.prepare(`VACUUM INTO ?`).run(backupTempPath);
      
      res.download(backupTempPath, "karachi_dms_backup.db", (err) => {
        // Cleanup temp backup file after download
        try {
          if (fs.existsSync(backupTempPath)) {
            fs.unlinkSync(backupTempPath);
          }
        } catch (cleanupErr) {
          console.warn("[Database] Cleanup warning:", cleanupErr);
        }
        
        if (err && !res.headersSent) {
          console.error("Error downloading DB:", err);
          res.status(500).json({ error: "Failed to download database file" });
        }
      });
    } catch (err: any) {
      console.error("[Database] Backup failed:", err);
      res.status(500).json({ error: "Failed to create backup: " + err.message });
    }
  });

  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads', { recursive: true });
  }
  const upload = multer({ dest: 'uploads/' });

  app.post("/api/upload-db", upload.single('db_file'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const tempPath = req.file.path;
    const targetPath = path.join(process.cwd(), "dms_v7.db");
    const walPath = targetPath + "-wal";
    const shmPath = targetPath + "-shm";

    try {
      console.log("[Database] Restore requested. Validating uploaded file...");
      
      // 1. Validate the uploaded file is a valid SQLite DB
      let tempDb;
      try {
        tempDb = new Database(tempPath, { readonly: true });
        tempDb.prepare("SELECT name FROM sqlite_master WHERE type='table' LIMIT 1").get();
        tempDb.close();
      } catch (validationErr: any) {
        if (tempDb) try { tempDb.close(); } catch(e) {}
        console.error("[Database] File validation failed:", validationErr);
        return res.status(400).json({ error: "Invalid database file. Please upload a valid .db file." });
      }

      // 2. Clear state and close connection
      console.log("[Database] Closing current connection and flushing WAL...");
      try {
        db.pragma('wal_checkpoint(FULL)');
        db.pragma('journal_mode = DELETE'); // Merge WAL into main file
        db.close();
      } catch (err) {
        console.warn("[Database] Error/Warning during close:", err);
      }

      // 3. Wait a few ms to ensure file handles are released by the OS
      await new Promise(r => setTimeout(r, 200));

      // 4. WIPE existing DB and sidecars to ensure NO state leak from WAL/SHM
      const filesToRemove = [targetPath, walPath, shmPath];
      filesToRemove.forEach(f => {
        if (fs.existsSync(f)) {
          try { 
            fs.unlinkSync(f);
            console.log(`[Database] Successfully removed: ${f}`);
          } catch(e) { 
            console.warn(`[Database] Could not delete ${f}:`, e);
            // If we can't delete the main file, we can't restore
            if (f === targetPath) throw new Error("Could not replace main database file - it might be locked by another process.");
          }
        }
      });

      // 5. Deploy new database file
      console.log("[Database] Deploying new database file from temporary upload...");
      fs.copyFileSync(tempPath, targetPath);
      
      // Force disk synchronization
      try {
        const fd = fs.openSync(targetPath, 'r+');
        fs.fsyncSync(fd);
        fs.closeSync(fd);
      } catch (e) {
        console.warn("[Database] fsync failed, continuing anyway...", e);
      }
      
      // Wait another small window to ensure FS buffers are settled
      await new Promise(r => setTimeout(r, 600));
      
      // 6. Re-open connection
      console.log("[Database] Re-opening database connection...");
      db = new Database(targetPath);
      db.pragma('journal_mode = WAL');
      db.pragma('synchronous = FULL');
      db.pragma('wal_checkpoint(FULL)');
      
      // Ensure the database is actually responsive before sending success
      try {
        db.prepare("SELECT 1").get();
      } catch (e) {
        console.error("[Database] Sanity check failed after restore:", e);
        throw new Error("Database re-open sanity check failed.");
      }

      // Final Check: Log some counts to verify data presence in server logs
      try {
        const orderCount = db.prepare("SELECT COUNT(*) as count FROM orders").get() as any;
        console.log(`[Database] Restore verified. Current order count: ${orderCount.count}`);
      } catch (e) {}

      // Add a final buffer to allow OS to settle the new WAL files
      await new Promise(r => setTimeout(r, 500));

      res.set('Cache-Control', 'no-store');
      res.json({ success: true, message: "Database restoration successful. The system has been rolled back." });
    } catch (err: any) {
      console.error("Error restoring DB:", err);
      // Attempt recovery
      try { db = new Database(targetPath); } catch(e) {}
      res.status(500).json({ error: "Critical error during restore: " + err.message });
    } finally {
      if (fs.existsSync(tempPath)) {
        try { fs.unlinkSync(tempPath); } catch(e) {}
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Graceful shutdown
  const cleanup = () => {
    console.log("[Server] Closing database connection...");
    try {
      db.pragma('wal_checkpoint(FULL)');
      db.close();
      console.log("[Server] Database closed successfully.");
    } catch (err) {
      console.error("[Server] Error closing database:", err);
    }
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

startServer().catch(err => {
  console.error("CRITICAL: Failed to start server:", err);
  process.exit(1);
});
