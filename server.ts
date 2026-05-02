import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import morgan from "morgan";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: any;
try {
  db = new Database("dms_v7.db");
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  
  // Migration for orders is_cancelled
  try { db.exec("ALTER TABLE orders ADD COLUMN is_cancelled TEXT DEFAULT ''"); } catch(e) {}
  
  // Initialize Database Schema
  try {
    db.prepare("SELECT unit_code FROM units LIMIT 1").get();
  } catch (err) {
    db.exec("DROP TABLE IF EXISTS units");
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS material_groups (
    mat_gp TEXT PRIMARY KEY,
    mat_description TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    product_id TEXT PRIMARY KEY,
    product_name TEXT NOT NULL,
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
    shop_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    location TEXT NOT NULL,
    phone TEXT NOT NULL,
    credit_limit REAL DEFAULT 0,
    category TEXT DEFAULT 'Retailer'
  );

  CREATE TABLE IF NOT EXISTS order_bookers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    father_name TEXT NOT NULL,
    cell_no TEXT NOT NULL,
    cnic_no TEXT NOT NULL,
    joining_date DATE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS salesmen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    father_name TEXT NOT NULL,
    cell_no TEXT NOT NULL,
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
    name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    phone TEXT NOT NULL,
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
    order_id INTEGER NOT NULL,
    salesman_id INTEGER NOT NULL,
    delivery_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'completed',
    total_amount REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (salesman_id) REFERENCES salesmen(id)
  );

  CREATE TABLE IF NOT EXISTS delivery_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    delivery_id INTEGER NOT NULL,
    order_item_id INTEGER NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (delivery_id) REFERENCES deliveries(id),
    FOREIGN KEY (order_item_id) REFERENCES order_items(id),
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

  // Migration for order_items estimated_delivery_date
  try { db.exec("ALTER TABLE order_items ADD COLUMN estimated_delivery_date DATE"); } catch(e) {}

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
} catch (err) {
  console.error("CRITICAL: Database initialization failed:", err);
  process.exit(1);
}

// Seed initial data if empty
try {
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  if (userCount.count === 0) {
    db.transaction(() => {
      db.prepare("INSERT INTO users (name, role, phone, password) VALUES (?, ?, ?, ?)").run(
        "Admin Karachi", "admin", "03001234567", "admin123"
      );
      db.prepare("INSERT INTO users (name, role, phone, password) VALUES (?, ?, ?, ?)").run(
        "Salesman A", "salesman", "03007654321", "sales123"
      );

      // Seed Material Groups
      const materialGroups = [
        { id: "00001", desc: "OIL" },
        { id: "00002", desc: "DAIRY" },
        { id: "00003", desc: "KITCHEN" },
        { id: "00004", desc: "SNACKS" }
      ];

      const mgStmt = db.prepare("INSERT INTO material_groups (mat_gp, mat_description) VALUES (?, ?)");
      for (const mg of materialGroups) {
        mgStmt.run(mg.id, mg.desc);
      }

      // Seed Units
      const unitsToSeed = [
        { code: 'KG', name: 'KILOGRAM', short: 'KGS' },
        { code: 'MT', name: 'METRIC TON', short: 'MT' },
        { code: 'PC', name: 'PIECES', short: 'PCS' },
        { code: 'GR', name: 'GRAM', short: 'GRM' },
        { code: 'L', name: 'LITER', short: 'LTR' },
        { code: 'BX', name: 'BOX', short: 'BOX' },
        { code: 'DZ', name: 'DOZEN', short: 'DZN' },
        { code: 'CT', name: 'CARTON', short: 'CTN' },
        { code: 'EA', name: 'EACH', short: 'EA' },
        { code: 'PK', name: 'PACK', short: 'PACK' },
        { code: 'SET', name: 'SET', short: 'SET' },
        { code: 'BAG', name: 'BAG', short: 'BAG' }
      ];

      const unitStmt = db.prepare("INSERT OR IGNORE INTO units (unit_code, name, short_name, status) VALUES (?, ?, ?, ?)");
      for (const u of unitsToSeed) {
        unitStmt.run(u.code, u.name, u.short, 1);
      }

      const initialProducts = [
        { id: "A000000001", name: "Cooking Oil 1L", brand: "Dalda", mg: "00001", pp: 500, tp: 550, rp: 600, stock: 100, unit: "EA", conv: 1, convUnit: "L", min: 20, reorder: 40 },
        { id: "A000000002", name: "Tea 400g", brand: "Tapal", mg: "00003", pp: 600, tp: 650, rp: 700, stock: 50, unit: "EA", conv: 400, convUnit: "GR", min: 10, reorder: 20 },
        { id: "A000000003", name: "Soap Bar", brand: "Lux", mg: "00003", pp: 100, tp: 120, rp: 150, stock: 200, unit: "EA", conv: 1, convUnit: "EA", min: 50, reorder: 100 },
        { id: "A000000004", name: "Milk 1L", brand: "MilkPak", mg: "00002", pp: 250, tp: 280, rp: 320, stock: 150, unit: "EA", conv: 1, convUnit: "L", min: 30, reorder: 60 },
        { id: "A000000005", name: "Biscuits 12pk", brand: "Peek Freans", mg: "00004", pp: 400, tp: 450, rp: 500, stock: 80, unit: "PK", conv: 12, convUnit: "EA", min: 15, reorder: 30 }
      ];

      const productStmt = db.prepare("INSERT INTO products (product_id, product_name, brand, material_group_id, purchase_price, trade_price, retail_price, stock_quantity, unit, conversion_value, conversion_unit, min_stock_level, reorder_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
      const batchStmt = db.prepare("INSERT INTO product_batches (product_id, purchase_id, quantity, remaining_quantity, purchase_price) VALUES (?, ?, ?, ?, ?)");
      
      for (const p of initialProducts) {
        productStmt.run(p.id, p.name, p.brand, p.mg, p.pp, p.tp, p.rp, p.stock, p.unit, p.conv, p.convUnit, p.min, p.reorder);
        batchStmt.run(p.id, null, p.stock, p.stock, p.pp);
      }

      db.prepare("INSERT INTO shops (shop_name, owner_name, location, phone, credit_limit) VALUES (?, ?, ?, ?, ?)").run(
        "Bismillah General Store", "Ahmed Ali", "Saddar, Karachi", "03111111111", 50000
      );
      db.prepare("INSERT INTO shops (shop_name, owner_name, location, phone, credit_limit) VALUES (?, ?, ?, ?, ?)").run(
        "Madina Super Mart", "Muhammad Usman", "Gulshan-e-Iqbal, Karachi", "03222222222", 100000
      );
      db.prepare("INSERT INTO shops (shop_name, owner_name, location, phone, credit_limit) VALUES (?, ?, ?, ?, ?)").run(
        "Al-Jadeed Mart", "Ibrahim Khan", "North Nazimabad, Karachi", "03333333333", 75000
      );

      // Seed Suppliers
      db.prepare("INSERT INTO suppliers (name, contact_person, phone, address) VALUES (?, ?, ?, ?)").run(
        "MSK Company", "Saleem Ahmed", "03444444444", "SITE Area, Karachi"
      );
      db.prepare("INSERT INTO suppliers (name, contact_person, phone, address) VALUES (?, ?, ?, ?)").run(
        "Unilever Pakistan", "Zubair Ali", "03555555555", "Avari Towers, Karachi"
      );

      // Seed Order Bookers
      const ob1 = db.prepare("INSERT INTO order_bookers (name, father_name, cell_no, cnic_no, joining_date) VALUES (?, ?, ?, ?, ?)").run(
        "Zeeshan Ahmed", "Ahmed Khan", "03001234567", "42101-1111111-1", "2024-01-01"
      );
      const ob2 = db.prepare("INSERT INTO order_bookers (name, father_name, cell_no, cnic_no, joining_date) VALUES (?, ?, ?, ?, ?)").run(
        "Kamran Shah", "Shah Jahan", "03007654321", "42101-2222222-2", "2024-01-15"
      );

      // Seed Salesmen
      const sm1 = db.prepare("INSERT INTO salesmen (name, father_name, cell_no, cnic_no, joining_date) VALUES (?, ?, ?, ?, ?)").run(
        "Asif Ali", "Ali Ahmed", "03004445556", "42101-7654321-2", "2024-02-10"
      );
      const sm2 = db.prepare("INSERT INTO salesmen (name, father_name, cell_no, cnic_no, joining_date) VALUES (?, ?, ?, ?, ?)").run(
        "M. Yasin", "M. Yousuf", "03112223334", "42101-3333333-3", "2024-03-01"
      );

      // Seed some orders and items
      const seedOrders = [
        { retailer: 1, order_booker: ob1.lastInsertRowid, items: [{ id: "A000000001", qty: 2, price: 550 }, { id: "A000000002", qty: 1, price: 650 }], status: 'delivered' },
        { retailer: 2, order_booker: ob1.lastInsertRowid, items: [{ id: "A000000003", qty: 10, price: 120 }], status: 'pending' },
        { retailer: 3, order_booker: ob2.lastInsertRowid, items: [{ id: "A000000001", qty: 5, price: 550 }, { id: "A000000004", qty: 6, price: 280 }, { id: "A000000005", qty: 2, price: 450 }], status: 'delivered' }
      ];

      for (const o of seedOrders) {
        const total = o.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
        const estDelivery = new Date();
        estDelivery.setDate(estDelivery.getDate() + 1);
        
        const order = db.prepare("INSERT INTO orders (shop_id, order_booker_id, total_amount, status, estimated_delivery_date) VALUES (?, ?, ?, ?, ?)").run(
          o.retailer, o.order_booker, total, o.status, estDelivery.toISOString()
        );
        const orderId = order.lastInsertRowid;

        for (const item of o.items) {
          db.prepare("INSERT INTO order_items (order_id, product_id, quantity, price, status) VALUES (?, ?, ?, ?, ?)").run(
            orderId, item.id, item.qty, item.price, o.status === 'delivered' ? 'Delivered' : 'Pending'
          );
          
          db.prepare("UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?").run(item.qty, item.id);
          
          let remainingToReduce = item.qty;
          const batches = db.prepare("SELECT * FROM product_batches WHERE product_id = ? AND remaining_quantity > 0 ORDER BY received_date ASC").all(item.id) as any[];
          
          for (const batch of batches) {
            if (remainingToReduce <= 0) break;
            const reduce = Math.min(batch.remaining_quantity, remainingToReduce);
            db.prepare("UPDATE product_batches SET remaining_quantity = remaining_quantity - ? WHERE id = ?").run(reduce, batch.id);
            remainingToReduce -= reduce;
          }
        }

        if (o.status === 'delivered') {
          const delivery = db.prepare("INSERT INTO deliveries (order_id, salesman_id, total_amount, status) VALUES (?, ?, ?, ?)").run(
            orderId, sm1.lastInsertRowid, total, 'completed'
          );
          const deliveryId = delivery.lastInsertRowid;

          const orderItems = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(orderId) as any[];
          for (const oi of orderItems) {
            db.prepare("INSERT INTO delivery_items (delivery_id, order_item_id, product_id, quantity, price) VALUES (?, ?, ?, ?, ?)").run(
              deliveryId, oi.id, oi.product_id, oi.quantity, oi.price
            );
          }

          db.prepare("INSERT INTO client_ledger (shop_id, description, debit, balance) VALUES (?, ?, ?, ?)").run(
            o.retailer, `Order #${orderId}`, total, total
          );
        }
      }

      // Seed Purchases
      const p1_items = [{ id: "A000000001", qty: 100, price: 450 }];
      const p1_total = p1_items.reduce((sum, i) => sum + (i.qty * i.price), 0);
      const purchase1 = db.prepare("INSERT INTO purchases (supplier_id, total_amount, status) VALUES (?, ?, ?)").run(
        1, p1_total, 'received'
      );
      db.prepare("INSERT INTO purchase_items (purchase_id, product_id, quantity, price, supplier_batch_no, storage_location) VALUES (?, ?, ?, ?, ?, ?)").run(
        purchase1.lastInsertRowid, p1_items[0].id, p1_items[0].qty, p1_items[0].price, "B-001", "Warehouse A"
      );
      db.prepare("INSERT INTO product_batches (product_id, purchase_id, quantity, remaining_quantity, purchase_price, supplier_batch_no, storage_location) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
        p1_items[0].id, purchase1.lastInsertRowid, p1_items[0].qty, p1_items[0].qty, p1_items[0].price, "B-001", "Warehouse A"
      );
      db.prepare("UPDATE products SET stock_quantity = stock_quantity + 100 WHERE product_id = ?").run("A000000001");

      const p2_items = [{ id: "A000000002", qty: 50, price: 580 }];
      const p2_total = p2_items.reduce((sum, i) => sum + (i.qty * i.price), 0);
      const purchase2 = db.prepare("INSERT INTO purchases (supplier_id, total_amount, status) VALUES (?, ?, ?)").run(
        2, p2_total, 'received'
      );
      db.prepare("INSERT INTO purchase_items (purchase_id, product_id, quantity, price, supplier_batch_no, storage_location) VALUES (?, ?, ?, ?, ?, ?)").run(
        purchase2.lastInsertRowid, p2_items[0].id, p2_items[0].qty, p2_items[0].price, "B-002", "Warehouse B"
      );
      db.prepare("INSERT INTO product_batches (product_id, purchase_id, quantity, remaining_quantity, purchase_price, supplier_batch_no, storage_location) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
        p2_items[0].id, purchase2.lastInsertRowid, p2_items[0].qty, p2_items[0].qty, p2_items[0].price, "B-002", "Warehouse B"
      );
      db.prepare("UPDATE products SET stock_quantity = stock_quantity + 50 WHERE product_id = ?").run("A000000002");

      // Seed Drivers
      const driver1 = db.prepare("INSERT INTO drivers (name, father_name, cell_no, cnic_no, joining_date) VALUES (?, ?, ?, ?, ?)").run(
        "Junaid Khan", "Abdul Khan", "03001112223", "42101-1234567-1", "2024-01-15"
      );
      const driver2 = db.prepare("INSERT INTO drivers (name, father_name, cell_no, cnic_no, joining_date) VALUES (?, ?, ?, ?, ?)").run(
        "Asif Ali", "Ali Ahmed", "03004445556", "42101-7654321-2", "2024-02-10"
      );

      // Seed Load Plan
      const plan1 = db.prepare("INSERT INTO load_plans (vehicle_id, driver_id, status) VALUES (?, ?, ?)").run(
        "KHI-1234", driver1.lastInsertRowid, "draft"
      );
      db.prepare("INSERT INTO load_plan_items (plan_id, order_id) VALUES (?, ?)").run(
        plan1.lastInsertRowid, 2
      );
    })();
  }
} catch (err) {
  console.error("CRITICAL: Initial seeding failed:", err);
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
        const deliveryStmt = db.prepare("INSERT INTO deliveries (order_id, salesman_id, total_amount, status) VALUES (?, ?, ?, ?)");
        const deliveryItemStmt = db.prepare("INSERT INTO delivery_items (delivery_id, order_item_id, product_id, quantity, price) VALUES (?, ?, ?, ?, ?)");
        
        for (const order of deliveredOrders) {
          const delivery = deliveryStmt.run(order.id, firstSalesman.id, order.total_amount, 'completed');
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(morgan("dev"));
  app.use(express.json());

  // API Routes
  app.get("/api/stats", (req, res) => {
    try {
      const totalSales = db.prepare("SELECT SUM(total_amount) as total FROM orders WHERE status = 'delivered' AND is_cancelled != 'X'").get() as { total: number };
      const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'partially_delivered') AND is_cancelled != 'X'").get() as { count: number };
      const lowStock = db.prepare("SELECT COUNT(*) as count FROM products WHERE stock_quantity <= min_stock_level").get() as { count: number };
      const totalShops = db.prepare("SELECT COUNT(*) as count FROM shops").get() as { count: number };
      
      const statusCounts = db.prepare(`
        SELECT status as name, COUNT(*) as value 
        FROM orders 
        WHERE is_cancelled != 'X'
        GROUP BY status
      `).all() as { name: string; value: number }[];

      const formattedStatusCounts = statusCounts.map(s => ({
        name: (s.name || 'unknown').split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        value: s.value
      }));

      // 1. Sales by Town (from location string for now since area_id isn't directly in shops yet)
      const salesByTown = db.prepare(`
        SELECT location as name, SUM(total_amount) as value 
        FROM orders o
        JOIN shops s ON o.shop_id = s.id
        WHERE o.status = 'delivered'
        GROUP BY location
        ORDER BY value DESC
        LIMIT 5
      `).all() as { name: string; value: number }[];

      // 2. Top Order Bookers
      const topOrderBookers = db.prepare(`
        SELECT ob.name as name, SUM(o.total_amount) as value 
        FROM orders o
        JOIN order_bookers ob ON o.order_booker_id = ob.id
        WHERE o.status = 'delivered'
        GROUP BY ob.name
        ORDER BY value DESC
        LIMIT 5
      `).all() as { name: string; value: number }[];

      // 3. Sales Trend (Last 7 Days)
      const salesTrend = db.prepare(`
        SELECT strftime('%Y-%m-%d', order_date) as name, SUM(total_amount) as value 
        FROM orders 
        WHERE order_date >= date('now', '-7 days') AND status = 'delivered'
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
        WHERE o.status = 'delivered'
        GROUP BY mg.mat_description
        ORDER BY value DESC
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
      // Reuse existing logic or write queries directly
      const stats = db.prepare("SELECT SUM(total_amount) as total FROM orders WHERE status = 'delivered'").get();
      const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").get();
      const lowStock = db.prepare("SELECT COUNT(*) as count FROM products WHERE stock_quantity <= min_stock_level").get();
      const totalShops = db.prepare("SELECT COUNT(*) as count FROM shops").get();
      const statusCounts = db.prepare("SELECT status as name, COUNT(*) as value FROM orders GROUP BY status").all();
      const salesTrend = db.prepare("SELECT strftime('%Y-%m-%d', order_date) as name, SUM(total_amount) as value FROM orders WHERE order_date >= date('now', '-7 days') AND status = 'delivered' GROUP BY name ORDER BY name ASC").all();

      const products = db.prepare("SELECT p.*, mg.mat_description as material_group_name FROM products p LEFT JOIN material_groups mg ON p.material_group_id = mg.mat_gp").all();
      const shops = db.prepare("SELECT * FROM shops").all();
      const suppliers = db.prepare("SELECT * FROM suppliers").all();
      const orders = db.prepare("SELECT o.*, r.shop_name, ob.name as order_booker_name FROM orders o JOIN shops r ON o.shop_id = r.id JOIN order_bookers ob ON o.order_booker_id = ob.id ORDER BY o.order_date DESC").all();
      const purchases = db.prepare("SELECT p.*, s.name as supplier_name FROM purchases p JOIN suppliers s ON p.supplier_id = s.id ORDER BY p.purchase_date DESC").all();
      const loadPlans = db.prepare("SELECT lp.*, d.name as driver_name FROM load_plans lp JOIN drivers d ON lp.driver_id = d.id ORDER BY lp.plan_date DESC").all();
      const materialGroups = db.prepare("SELECT * FROM material_groups").all();
      const drivers = db.prepare("SELECT * FROM drivers").all();
      const orderBookers = db.prepare("SELECT * FROM order_bookers").all();
      const salesmen = db.prepare("SELECT * FROM salesmen").all();
      const units = db.prepare("SELECT * FROM units").all();
      const deliveries = db.prepare("SELECT d.*, o.id as order_ref, r.shop_name, s.name as salesman_name FROM deliveries d JOIN orders o ON d.order_id = o.id JOIN shops r ON o.shop_id = r.id JOIN salesmen s ON d.salesman_id = s.id ORDER BY d.delivery_date DESC").all();
      
      const valuation = db.prepare(`
        SELECT 
          SUM(remaining_quantity * pb.purchase_price) as totalValueAtPP,
          SUM(remaining_quantity * p.trade_price) as totalPotentialRevenueAtTP
        FROM product_batches pb
        JOIN products p ON pb.product_id = p.product_id
        WHERE remaining_quantity > 0
      `).get() as any;

      // Mock daily sales for chart if not already gathered from DB
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
      SELECT p.*, mg.mat_description as material_group_name 
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
    const { product_name, brand, material_group_id, purchase_price, trade_price, retail_price, stock_quantity, unit, conversion_value, conversion_unit, min_stock_level, reorder_level } = req.body;
    const product_id = generateProductId();
    
    const transaction = db.transaction(() => {
      db.prepare("INSERT INTO products (product_id, product_name, brand, material_group_id, purchase_price, trade_price, retail_price, stock_quantity, unit, conversion_value, conversion_unit, min_stock_level, reorder_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
        product_id, product_name, brand, material_group_id, purchase_price, trade_price, retail_price, stock_quantity, unit || 'EACH', conversion_value || 1, conversion_unit || 'EACH', min_stock_level || 10, reorder_level || 20
      );

      if (stock_quantity > 0) {
        db.prepare("INSERT INTO product_batches (product_id, purchase_id, quantity, remaining_quantity, purchase_price) VALUES (?, ?, ?, ?, ?)").run(
          product_id, null, stock_quantity, stock_quantity, purchase_price
        );
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
    const { product_name, brand, material_group_id, purchase_price, trade_price, retail_price, stock_quantity, unit, conversion_value, conversion_unit, min_stock_level, reorder_level } = req.body;
    
    const transaction = db.transaction(() => {
      // Get current stock to see if we need to adjust batches
      const currentProduct = db.prepare("SELECT stock_quantity, purchase_price FROM products WHERE product_id = ?").get(id) as any;
      
      db.prepare("UPDATE products SET product_name = ?, brand = ?, material_group_id = ?, purchase_price = ?, trade_price = ?, retail_price = ?, stock_quantity = ?, unit = ?, conversion_value = ?, conversion_unit = ?, min_stock_level = ?, reorder_level = ? WHERE product_id = ?").run(
        product_name, brand, material_group_id, purchase_price, trade_price, retail_price, stock_quantity, unit, conversion_value, conversion_unit, min_stock_level, reorder_level, id
      );

      // If stock was manually adjusted upwards, add a batch
      if (stock_quantity > currentProduct.stock_quantity) {
        const diff = stock_quantity - currentProduct.stock_quantity;
        db.prepare("INSERT INTO product_batches (product_id, purchase_id, quantity, remaining_quantity, purchase_price) VALUES (?, ?, ?, ?, ?)").run(
          id, null, diff, diff, purchase_price
        );
      }
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
    const total_amount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);

    const transaction = db.transaction(() => {
      const order = db.prepare("INSERT INTO orders (shop_id, order_booker_id, order_date, estimated_delivery_date, total_amount, status) VALUES (?, ?, ?, ?, ?, ?)").run(
        shop_id, order_booker_id, order_date || new Date().toISOString(), estimated_delivery_date, total_amount, 'pending'
      );
      const orderId = order.lastInsertRowid;

      for (const item of items) {
        db.prepare("INSERT INTO order_items (order_id, product_id, quantity, price, status) VALUES (?, ?, ?, ?, ?)").run(
          orderId, item.product_id, item.quantity, item.price, 'pending'
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
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Items array is required" });
    }

    const total_amount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);

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
          SET shop_id = ?, order_booker_id = ?, order_date = ?, estimated_delivery_date = ?, total_amount = ?, is_cancelled = ''
          WHERE id = ?
        `).run(shop_id, order_booker_id, order_date || new Date().toISOString(), estimated_delivery_date, total_amount, id);

        // 4. Process New Items
        for (const item of items) {
          db.prepare(`
            INSERT INTO order_items (order_id, product_id, quantity, price, status)
            VALUES (?, ?, ?, ?, ?)
          `).run(id, item.product_id, item.quantity, item.price, item.status || 'Pending');
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

  app.get("/api/deliveries", (req, res) => {
    const deliveries = db.prepare(`
      SELECT d.*, o.id as order_ref, r.shop_name, s.name as salesman_name
      FROM deliveries d
      JOIN orders o ON d.order_id = o.id
      JOIN shops r ON o.shop_id = r.id
      JOIN salesmen s ON d.salesman_id = s.id
      ORDER BY d.delivery_date DESC
    `).all();
    res.json(deliveries);
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
    res.json(delivery);
  });

  app.put("/api/deliveries/:id", (req, res) => {
    const { id } = req.params;
    const { order_id, salesman_id, delivery_date, items } = req.body;
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);

    const transaction = db.transaction(() => {
      // 0. Store old order ID for cleanup
      const oldDelivery = db.prepare("SELECT order_id FROM deliveries WHERE id = ?").get(id) as any;
      const oldOrderId = oldDelivery?.order_id;
      const oldItemIds = db.prepare("SELECT order_item_id FROM delivery_items WHERE delivery_id = ?").all(id) as any[];

      // 1. Delete old items
      db.prepare("DELETE FROM delivery_items WHERE delivery_id = ?").run(id);

      // 1.1 Reset status for old items
      for (const row of oldItemIds) {
        const stats = db.prepare(`
          SELECT oi.quantity as ordered, COALESCE(SUM(di.quantity), 0) as delivered
          FROM order_items oi
          LEFT JOIN delivery_items di ON oi.id = di.order_item_id
          WHERE oi.id = ?
        `).get(row.order_item_id) as any;
        
        let status = 'pending';
        if (stats.delivered >= stats.ordered) status = 'delivered';
        else if (stats.delivered > 0) status = 'partially_delivered';
        db.prepare("UPDATE order_items SET status = ? WHERE id = ?").run(status, row.order_item_id);
      }
      
      if (oldOrderId && oldOrderId !== order_id) {
        const items = db.prepare("SELECT status FROM order_items WHERE order_id = ?").all(oldOrderId) as any[];
        const allDelivered = items.length > 0 && items.every(i => i.status === 'delivered');
        db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(allDelivered ? 'delivered' : 'pending', oldOrderId);
      }

      // 2. Update Delivery Header
      db.prepare(`
        UPDATE deliveries 
        SET order_id = ?, salesman_id = ?, delivery_date = ?, total_amount = ?
        WHERE id = ?
      `).run(order_id, salesman_id, delivery_date, totalAmount, id);

      // 3. Process New Items
      const affectedOrderIds = new Set<number>();
      affectedOrderIds.add(order_id);
      if (oldOrderId) affectedOrderIds.add(oldOrderId);

      for (const item of items) {
        db.prepare(`
          INSERT INTO delivery_items (delivery_id, order_item_id, product_id, quantity, price)
          VALUES (?, ?, ?, ?, ?)
        `).run(id, item.order_item_id, item.product_id, item.quantity, item.price);

        const stats = db.prepare(`
          SELECT oi.quantity as ordered, COALESCE(SUM(di.quantity), 0) as delivered, oi.order_id
          FROM order_items oi
          LEFT JOIN delivery_items di ON oi.id = di.order_item_id
          WHERE oi.id = ?
        `).get(item.order_item_id) as any;

        affectedOrderIds.add(stats.order_id);

        let status = 'pending';
        if (stats.delivered >= stats.ordered) status = 'delivered';
        else if (stats.delivered > 0) status = 'partially_delivered';
        db.prepare("UPDATE order_items SET status = ? WHERE id = ?").run(status, item.order_item_id);
      }

      // 4. Update Status for all affected Orders
      for (const oid of affectedOrderIds) {
        const orderItems = db.prepare("SELECT status FROM order_items WHERE order_id = ?").all(oid) as any[];
        if (orderItems.length > 0) {
          const allDelivered = orderItems.every(item => item.status === 'delivered');
          const someDelivered = orderItems.some(item => item.status === 'delivered' || item.status === 'partially_delivered');
          
          let orderStatus = 'pending';
          if (allDelivered) orderStatus = 'delivered';
          else if (someDelivered) orderStatus = 'partially_delivered'; // Optional: add this if supported, else stay 'pending'
          
          db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(orderStatus, oid);
        }
      }

      // 5. Update Client Ledger
      const order = db.prepare("SELECT shop_id FROM orders WHERE id = ?").get(order_id) as any;
      const ledgerEntry = db.prepare("SELECT id, debit, balance FROM client_ledger WHERE description LIKE ?").get(`%Delivery #DEL-${id}%`) as any;
      if (ledgerEntry) {
        const diff = totalAmount - ledgerEntry.debit;
        db.prepare(`
          UPDATE client_ledger 
          SET debit = ?, date = ?, balance = balance + ?
          WHERE id = ?
        `).run(totalAmount, delivery_date, diff, ledgerEntry.id);
        
        // Also update all subsequent balances for this shop
        db.prepare(`
          UPDATE client_ledger
          SET balance = balance + ?
          WHERE shop_id = ? AND id > ?
        `).run(diff, order.shop_id, ledgerEntry.id);
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
      SELECT di.*, p.product_name, p.brand, oi.order_id as order_ref
      FROM delivery_items di
      JOIN products p ON di.product_id = p.product_id
      JOIN order_items oi ON di.order_item_id = oi.id
      WHERE di.delivery_id = ?
    `).all(id);
    res.json(items);
  });

  app.get("/api/orders/:id/pending-items", (req, res) => {
    const { id } = req.params;
    const items = db.prepare(`
      SELECT 
        oi.*, 
        p.product_name, 
        p.brand,
        COALESCE((SELECT SUM(di.quantity) FROM delivery_items di WHERE di.order_item_id = oi.id), 0) as delivered_quantity
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?
    `).all(id);
    
    // Filter items that still have balance
    const pendingItems = items.filter((item: any) => item.quantity > item.delivered_quantity);
    res.json(pendingItems);
  });

  app.post("/api/deliveries", (req, res) => {
    const { order_id, salesman_id, delivery_date, items } = req.body;
    
    const transaction = db.transaction(() => {
      // Check if order is cancelled
      const orderData = db.prepare("SELECT status FROM orders WHERE id = ?").get(order_id) as any;
      if (orderData?.status === "cancelled") {
        throw new Error("Cannot create delivery for a cancelled order.");
      }

      // 1. Create Delivery Header
      const totalAmount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);

      const deliveryResult = db.prepare(`
        INSERT INTO deliveries (order_id, salesman_id, delivery_date, total_amount)
        VALUES (?, ?, ?, ?)
      `).run(order_id, salesman_id, delivery_date, totalAmount);
      
      const deliveryId = deliveryResult.lastInsertRowid;

      // 2. Process Items
      const affectedOrderIds = new Set<number>();
      affectedOrderIds.add(order_id);

      for (const item of items) {
        // Validation: Check remaining balance for this order item
        const orderItem = db.prepare(`
          SELECT 
            oi.*,
            COALESCE((SELECT SUM(di.quantity) FROM delivery_items di WHERE di.order_item_id = oi.id), 0) as delivered_quantity
          FROM order_items oi
          WHERE oi.id = ?
        `).get(item.order_item_id) as any;

        if (!orderItem) throw new Error(`Order item ${item.order_item_id} not found`);
        affectedOrderIds.add(orderItem.order_id);
        
        const remaining = orderItem.quantity - orderItem.delivered_quantity;
        if (item.quantity > remaining) {
          throw new Error(`Delivery quantity (${item.quantity}) exceeds remaining balance (${remaining}) for product ${item.product_id}`);
        }

        // Insert delivery item
        db.prepare(`
          INSERT INTO delivery_items (delivery_id, order_item_id, product_id, quantity, price)
          VALUES (?, ?, ?, ?, ?)
        `).run(deliveryId, item.order_item_id, item.product_id, item.quantity, item.price);

        // Update order item status
        const newDeliveredTotal = orderItem.delivered_quantity + item.quantity;
        let status = 'partially_delivered';
        if (newDeliveredTotal >= orderItem.quantity) {
          status = 'delivered';
        }
        db.prepare("UPDATE order_items SET status = ? WHERE id = ?").run(status, item.order_item_id);

        // DEDUCT STOCK AT DELIVERY TIME
        db.prepare("UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?")
          .run(item.quantity, item.product_id);
        
        let remainingToReduce = item.quantity;
        const batches = db.prepare("SELECT * FROM product_batches WHERE product_id = ? AND remaining_quantity > 0 ORDER BY received_date ASC").all(item.product_id) as any[];
        for (const batch of batches) {
          if (remainingToReduce <= 0) break;
          const reduce = Math.min(batch.remaining_quantity, remainingToReduce);
          db.prepare("UPDATE product_batches SET remaining_quantity = remaining_quantity - ? WHERE id = ?").run(reduce, batch.id);
          remainingToReduce -= reduce;
        }
      }

      // 3. Update Order Statuses
      for (const oid of affectedOrderIds) {
        const orderItems = db.prepare("SELECT status FROM order_items WHERE order_id = ?").all(oid) as any[];
        const allDelivered = orderItems.length > 0 && orderItems.every(item => item.status === 'delivered');
        db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(allDelivered ? 'delivered' : 'pending', oid);
      }

      // 4. Update Client Ledger (Debit the shop for the delivery)
      const order = db.prepare("SELECT shop_id FROM orders WHERE id = ?").get(order_id) as any;
      const lastLedger = db.prepare("SELECT balance FROM client_ledger WHERE shop_id = ? ORDER BY id DESC LIMIT 1").get(order.shop_id) as any;
      const currentBalance = (lastLedger?.balance || 0) + totalAmount;

      db.prepare(`
        INSERT INTO client_ledger (shop_id, date, description, debit, balance)
        VALUES (?, ?, ?, ?, ?)
      `).run(order.shop_id, delivery_date, `Delivery #DEL-${deliveryId} for Order #ORD-${order_id}`, totalAmount, currentBalance);

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

  app.post("/api/purchases", (req, res) => {
    const { supplier_id, items } = req.body;
    
    const total_amount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);

    const transaction = db.transaction(() => {
      // 1. Create Purchase Record
      const purchase = db.prepare("INSERT INTO purchases (supplier_id, total_amount, status) VALUES (?, ?, ?)").run(
        supplier_id, total_amount, 'received'
      );
      const purchase_id = purchase.lastInsertRowid;

      for (const item of items) {
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

        // 5. Update Product Master (Weighted Average PP or just update to latest)
        // For this implementation, we update master PP to latest and ensure TP/RP are maintained
        db.prepare("UPDATE products SET purchase_price = ?, stock_quantity = stock_quantity + ? WHERE product_id = ?").run(
          item.price, item.quantity, item.product_id
        );
      }
      return purchase_id;
    });

    try {
      const purchase_id = transaction();
      res.json({ id: purchase_id });
    } catch (err) {
      console.error("Purchase transaction failed", err);
      res.status(500).json({ error: "Failed to create purchase" });
    }
  });

  app.put("/api/purchases/:id", (req, res) => {
    const { id } = req.params;
    const { supplier_id, items } = req.body;
    
    const total_amount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);

    const transaction = db.transaction(() => {
      // 1. Get old items to reverse stock
      const oldItems = db.prepare("SELECT product_id, quantity FROM purchase_items WHERE purchase_id = ?").all(id) as any[];
      for (const oldItem of oldItems) {
        db.prepare("UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?").run(oldItem.quantity, oldItem.product_id);
      }

      // 2. Delete old items and batches
      db.prepare("DELETE FROM purchase_items WHERE purchase_id = ?").run(id);
      db.prepare("DELETE FROM product_batches WHERE purchase_id = ?").run(id);

      // 3. Update Purchase Record
      db.prepare("UPDATE purchases SET supplier_id = ?, total_amount = ? WHERE id = ?").run(supplier_id, total_amount, id);

      // 4. Insert new items and batches
      for (const item of items) {
        db.prepare("INSERT INTO purchase_items (purchase_id, product_id, quantity, price, supplier_batch_no, storage_location) VALUES (?, ?, ?, ?, ?, ?)").run(
          id, item.product_id, item.quantity, item.price, item.supplier_batch_no, item.storage_location
        );

        db.prepare("INSERT INTO product_batches (product_id, purchase_id, quantity, remaining_quantity, purchase_price, supplier_batch_no, storage_location) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
          item.product_id, id, item.quantity, item.quantity, item.price, item.supplier_batch_no, item.storage_location
        );

        db.prepare("UPDATE products SET purchase_price = ?, stock_quantity = stock_quantity + ? WHERE product_id = ?").run(
          item.price, item.quantity, item.product_id
        );
      }
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (err) {
      console.error("Purchase update failed", err);
      res.status(500).json({ error: "Failed to update purchase" });
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

  app.get('/api/units', (req, res) => {
    try {
      const units = db.prepare("SELECT * FROM units ORDER BY name ASC").all();
      res.json(units);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch units" });
    }
  });

  app.post('/api/units', (req, res) => {
    const { unit_code, name, short_name } = req.body;
    try {
      const result = db.prepare("INSERT INTO units (unit_code, name, short_name) VALUES (?, ?, ?)")
        .run(unit_code, name, short_name);
      res.json({ id: result.lastInsertRowid });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/units/:id', (req, res) => {
    const { unit_code, name, short_name, status } = req.body;
    try {
      db.prepare("UPDATE units SET unit_code = ?, name = ?, short_name = ?, status = ? WHERE id = ?")
        .run(unit_code, name, short_name, status, req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/units/:id', (req, res) => {
    try {
      db.prepare("DELETE FROM units WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: "Cannot delete unit as it may be in use" });
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
}

startServer().catch(err => {
  console.error("CRITICAL: Failed to start server:", err);
  process.exit(1);
});
