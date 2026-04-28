export interface Unit {
  id: number;
  unit_code: string;
  name: string;
  short_name: string;
  status: number;
}

export interface MaterialGroup {
  mat_gp: string;
  mat_description: string;
}

export interface Product {
  product_id: string;
  product_name: string;
  brand: string;
  material_group_id: string;
  material_group_name?: string;
  purchase_price: number; // PP
  trade_price: number;    // TP
  retail_price: number;   // RP
  stock_quantity: number;
  unit: string;
  conversion_value: number;
  conversion_unit: string;
  min_stock_level: number;
  reorder_level: number;
}

export interface Shop {
  id: number;
  shop_name: string;
  owner_name: string;
  location: string;
  phone: string;
  credit_limit: number;
  category?: string;
}

export interface OrderBooker {
  id: number;
  name: string;
  father_name: string;
  cell_no: string;
  cnic_no: string;
  joining_date: string;
}

export interface Salesman {
  id: number;
  name: string;
  father_name: string;
  cell_no: string;
  cnic_no: string;
  joining_date: string;
}

export interface Order {
  id: number;
  shop_id: number;
  order_booker_id: number;
  order_date: string;
  status: 'pending' | 'delivered' | 'cancelled' | 'partially_delivered';
  total_amount: number;
  shop_name: string;
  order_booker_name: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: string;
  quantity: number;
  price: number;
  product_name: string;
  brand: string;
  status: 'Pending' | 'Delivered' | 'Cancelled' | 'Partially Delivered';
  delivered_quantity?: number;
  estimated_delivery_date?: string;
}

export interface StockValuationReport {
  totalValueAtPP: number;
  totalPotentialRevenueAtTP: number;
  totalPotentialProfit: number;
  averageMarginPercent: number;
}

export interface DashboardStats {
  totalSales: number;
  pendingOrders: number;
  lowStock: number;
  totalShops: number;
  orderStatusCounts: { name: string; value: number }[];
  salesByTown: { name: string; value: number }[];
  topOrderBookers: { name: string; value: number }[];
  salesTrend: { name: string; value: number }[];
  categorySales: { name: string; value: number }[];
}

export interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  address: string;
}

export interface Purchase {
  id: number;
  supplier_id: number;
  supplier_name: string;
  purchase_date: string;
  total_amount: number;
  status: 'received' | 'pending';
}

export interface PurchaseItem {
  id: number;
  purchase_id: number;
  product_id: string;
  quantity: number;
  price: number;
  product_name?: string;
  supplier_batch_no?: string;
  storage_location?: string;
}

export interface Driver {
  id: number;
  name: string;
  father_name: string;
  cell_no: string;
  cnic_no: string;
  joining_date: string;
}

export interface LoadPlan {
  id: number;
  plan_date: string;
  vehicle_id: string;
  driver_id: number;
  driver_name?: string;
  status: 'draft' | 'dispatched' | 'completed';
}

export interface LoadPlanItem {
  id: number;
  plan_id: number;
  order_id: number;
  shop_name?: string;
  total_amount?: number;
}

export interface LedgerEntry {
  id: number;
  shop_id: number;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface Country {
  id: number;
  name: string;
}

export interface Province {
  id: number;
  country_id: number;
  name: string;
}

export interface City {
  id: number;
  province_id: number;
  name: string;
}

export interface Town {
  id: number;
  city_id: number;
  name: string;
}

export interface Area {
  id: number;
  town_id: number;
  name: string;
}

export interface Subarea {
  id: number;
  area_id: number;
  name: string;
}

export interface Delivery {
  id: number;
  order_id: number;
  order_ref: number;
  salesman_id: number;
  salesman_name: string;
  shop_name: string;
  delivery_date: string;
  total_amount: number;
  status: 'completed';
}

export interface DeliveryItem {
  id: number;
  delivery_id: number;
  order_item_id: number;
  product_id: string;
  product_name?: string;
  brand?: string;
  quantity: number;
  price: number;
  order_id?: number;
  order_ref?: number;
}
