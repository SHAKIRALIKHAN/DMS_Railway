import { useState, useEffect, FormEvent } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Menu, 
  X, 
  LogOut, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone,
  Truck, 
  FileText, 
  CreditCard,
  Store,
  ChevronRight,
  Factory,
  DollarSign,
  Save,
  Database,
  BarChart3,
  Edit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line 
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  Product, 
  Retailer, 
  Order, 
  DashboardStats, 
  OrderItem, 
  Purchase, 
  LoadPlan, 
  LedgerEntry,
  Supplier,
  StockValuationReport,
  MaterialGroup,
  Driver,
  OrderBooker,
  Salesman,
  Delivery,
  DeliveryItem,
  Unit
} from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const LedgerModal = ({ 
  retailer, 
  onClose, 
  formatPKR 
}: { 
  retailer: Retailer, 
  onClose: () => void, 
  formatPKR: (amount: number) => string 
}) => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const res = await fetch(`/api/ledger/${retailer.id}`);
        const data = await res.json();
        setEntries(data);
      } catch (err) {
        console.error("Failed to fetch ledger", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLedger();
  }, [retailer.id]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Client Ledger</h3>
            <p className="text-sm text-slate-500">{retailer.shop_name} • Financial History</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Debit</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Credit</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map(entry => (
                  <tr key={entry.id} className="text-sm">
                    <td className="px-4 py-3 text-slate-600">{new Date(entry.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-slate-900 font-medium">{entry.description}</td>
                    <td className="px-4 py-3 text-right text-rose-600 font-medium">
                      {entry.debit > 0 ? formatPKR(entry.debit) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                      {entry.credit > 0 ? formatPKR(entry.credit) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-900 font-bold">{formatPKR(entry.balance)}</td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">No ledger entries found</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const OrderDetailsModal = ({ 
  order, 
  onClose, 
  formatPKR 
}: { 
  order: Order, 
  onClose: () => void, 
  formatPKR: (amount: number) => string 
}) => {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}/items`);
        const data = await res.json();
        setItems(data);
      } catch (err) {
        console.error("Failed to fetch order items", err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [order.id]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Order Details</h3>
            <p className="text-sm text-slate-500">#ORD-{order.id.toString().padStart(4, '0')} • {order.shop_name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Retailer</p>
              <p className="text-sm font-bold text-slate-900">{order.shop_name}</p>
              <p className="text-xs text-slate-500">Booker: {order.order_booker_name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full inline-block",
                order.status === 'delivered' ? "bg-emerald-50 text-emerald-600" : 
                order.status === 'pending' ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
              )}>
                {order.status}
              </span>
              <p className="text-xs text-slate-500 mt-1">{new Date(order.order_date).toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">Qty</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Price</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm italic">Loading items...</td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm italic">No items found</td>
                  </tr>
                ) : items.map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-slate-900">{item.product_name}</p>
                      <p className="text-[10px] text-slate-500">{item.brand}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600">{formatPKR(item.price)}</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">{formatPKR(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100/50">
                  <td colSpan={3} className="px-4 py-3 text-sm font-bold text-slate-900 text-right uppercase tracking-wider">Grand Total</td>
                  <td className="px-4 py-3 text-right text-lg font-bold text-indigo-600">{formatPKR(order.total_amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors">
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const PurchaseDetailsModal = ({ 
  purchase, 
  onClose, 
  formatPKR 
}: { 
  purchase: Purchase, 
  onClose: () => void, 
  formatPKR: (amount: number) => string 
}) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(`/api/purchases/${purchase.id}/items`);
        const data = await res.json();
        setItems(data);
      } catch (err) {
        console.error("Failed to fetch purchase items", err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [purchase.id]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Purchase Details</h3>
            <p className="text-sm text-slate-500">#PUR-{purchase.id.toString().padStart(4, '0')} • {purchase.supplier_name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Supplier</p>
              <p className="text-sm font-bold text-slate-900">{purchase.supplier_name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
                {purchase.status}
              </span>
              <p className="text-xs text-slate-500 mt-1">{new Date(purchase.purchase_date).toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Product / Batch</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Location</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">Qty</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Cost</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm italic">Loading items...</td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm italic">No items found</td>
                  </tr>
                ) : items.map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-slate-900">{item.product_name}</p>
                      <div className="flex gap-2 items-center">
                        <span className="text-[10px] text-slate-500">{item.brand}</span>
                        {item.supplier_batch_no && (
                          <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 rounded">Batch: {item.supplier_batch_no}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600">{item.storage_location || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600">{formatPKR(item.price)}</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">{formatPKR(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100/50">
                  <td colSpan={4} className="px-4 py-3 text-sm font-bold text-slate-900 text-right uppercase tracking-wider">Grand Total</td>
                  <td className="px-4 py-3 text-right text-lg font-bold text-indigo-600">{formatPKR(purchase.total_amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors">
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const PurchaseModal = ({ 
  products,
  suppliers,
  purchase,
  onClose, 
  onSuccess,
  formatPKR
}: { 
  products: Product[],
  suppliers: Supplier[],
  purchase?: Purchase,
  onClose: () => void, 
  onSuccess: () => void,
  formatPKR: (amount: number) => string
}) => {
  const [masterData, setMasterData] = useState({
    supplier_id: purchase?.supplier_id.toString() || '',
  });
  const [items, setItems] = useState<{product_id: string, quantity: number, price: number, supplier_batch_no: string, storage_location: string, product_name?: string, trade_price?: number, retail_price?: number}[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLOV, setShowLOV] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (purchase) {
      const fetchItems = async () => {
        try {
          const res = await fetch(`/api/purchases/${purchase.id}/items`);
          const data = await res.json();
          setItems(data.map((item: any) => ({
            ...item,
            product_name: products.find(p => p.product_id === item.product_id)?.product_name,
            trade_price: products.find(p => p.product_id === item.product_id)?.trade_price,
            retail_price: products.find(p => p.product_id === item.product_id)?.retail_price
          })));
        } catch (err) {
          console.error("Failed to fetch purchase items", err);
        }
      };
      fetchItems();
    }
  }, [purchase, products]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'a') {
        e.preventDefault();
        document.getElementById('purchase-product-search')?.focus();
      }
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [masterData, items]);

  const filteredProducts = products.filter(p => 
    p.product_id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addItem = (product: Product) => {
    const existing = items.find(i => i.product_id === product.product_id);
    if (existing) {
      setItems(items.map(i => i.product_id === product.product_id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, { 
        product_id: product.product_id, 
        quantity: 1, 
        price: product.purchase_price,
        supplier_batch_no: '',
        storage_location: '',
        product_name: product.product_name,
        trade_price: product.trade_price,
        retail_price: product.retail_price
      }]);
    }
    setSearchQuery('');
    setShowLOV(false);
  };

  const removeItem = (productId: string) => {
    setItems(items.filter(i => i.product_id !== productId));
  };

  const updateItemField = (productId: string, field: string, value: any) => {
    setItems(items.map(i => i.product_id === productId ? { ...i, [field]: value } : i));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (items.length === 0 || !masterData.supplier_id) {
      alert("Please select a supplier and add at least one item.");
      return;
    }

    // Validate required fields for each item
    const invalidItem = items.find(i => !i.supplier_batch_no || !i.storage_location);
    if (invalidItem) {
      alert(`Please provide Supplier Batch # and Storage Location for all items.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const url = purchase ? `/api/purchases/${purchase.id}` : '/api/purchases';
      const method = purchase ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: parseInt(masterData.supplier_id),
          items
        })
      });
      if (res.ok) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error("Failed to save purchase", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{purchase ? 'Update Purchase' : 'New Purchase Order'}</h3>
            <p className="text-xs text-slate-500">Shortcut: <kbd className="bg-white border px-1 rounded">Alt+A</kbd> Add Item, <kbd className="bg-white border px-1 rounded">Alt+S</kbd> Save</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Master Form */}
          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
            <div className="max-w-xs">
              <label className="block text-xs font-bold text-indigo-700 mb-1 uppercase">Supplier</label>
              <select 
                required
                value={masterData.supplier_id}
                onChange={e => setMasterData({...masterData, supplier_id: e.target.value})}
                className="w-full px-4 py-2 bg-white border border-indigo-200 rounded-xl text-sm focus:border-indigo-600 outline-none"
              >
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* Detail Form (Items) */}
          <div className="space-y-4">
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    id="purchase-product-search"
                    type="text" 
                    placeholder="Search Product by Code or Name (Alt+A)..."
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      setShowLOV(true);
                    }}
                    onFocus={() => setShowLOV(true)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  />
                  
                  {/* LOV (List of Values) */}
                  <AnimatePresence>
                    {showLOV && searchQuery && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto"
                      >
                        {filteredProducts.map(p => (
                          <button 
                            key={p.product_id}
                            onClick={() => addItem(p)}
                            className="w-full px-4 py-3 text-left hover:bg-indigo-50 flex justify-between items-center border-b border-slate-50 last:border-0"
                          >
                            <div>
                              <p className="text-sm font-bold text-slate-900">{p.product_name}</p>
                              <p className="text-xs text-slate-500">{p.product_id} • {p.brand}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-indigo-600">{formatPKR(p.purchase_price)}</p>
                              <p className="text-[10px] text-slate-400">Stock: {p.stock_quantity}</p>
                            </div>
                          </button>
                        ))}
                        {filteredProducts.length === 0 && (
                          <div className="p-4 text-center text-slate-500 text-sm">No products found</div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Batch #</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Location</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Qty</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map(item => (
                    <tr key={item.product_id}>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900">{item.product_name}</p>
                        <p className="text-xs text-slate-500">{item.product_id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <input 
                          required
                          type="text" 
                          value={item.supplier_batch_no}
                          onChange={e => updateItemField(item.product_id, 'supplier_batch_no', e.target.value)}
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-600"
                          placeholder="Required"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input 
                          required
                          type="text" 
                          value={item.storage_location}
                          onChange={e => updateItemField(item.product_id, 'storage_location', e.target.value)}
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-600"
                          placeholder="Required"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input 
                          type="number" 
                          value={item.quantity}
                          onChange={e => updateItemField(item.product_id, 'quantity', Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-600"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input 
                          type="number" 
                          value={item.price}
                          onChange={e => updateItemField(item.product_id, 'price', parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-600"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">{formatPKR(item.quantity * item.price)}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => removeItem(item.product_id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        <ShoppingCart className="mx-auto mb-2 opacity-20" size={48} />
                        <p>No items added yet. Search products above to start.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Amount</span>
            <span className="text-2xl font-bold text-indigo-600">{formatPKR(calculateTotal())}</span>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => handleSubmit()}
              disabled={isSubmitting || items.length === 0}
              className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={18} />
              )}
              <span>{purchase ? 'Update Purchase' : 'Save Purchase'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const RegisterSupplierModal = ({ 
  onClose, 
  onSuccess 
}: { 
  onClose: () => void, 
  onSuccess: () => void 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error("Failed to register supplier", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900">Register New Supplier</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Supplier Name</label>
            <input 
              required
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
              placeholder="e.g. MSK Company"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Contact Person</label>
            <input 
              required
              type="text" 
              value={formData.contact_person}
              onChange={e => setFormData({...formData, contact_person: e.target.value})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
              placeholder="e.g. Saleem Ahmed"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Phone Number</label>
            <input 
              required
              type="tel" 
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
              placeholder="e.g. 03444444444"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Address</label>
            <textarea 
              required
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all min-h-[100px]"
              placeholder="e.g. SITE Area, Karachi"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Register Supplier'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const RegisterRetailerModal = ({ 
  onClose, 
  onSuccess 
}: { 
  onClose: () => void, 
  onSuccess: () => void 
}) => {
  const [formData, setFormData] = useState({
    shop_name: '',
    owner_name: '',
    location: '',
    phone: '',
    credit_limit: '0'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/retailers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          credit_limit: parseFloat(formData.credit_limit)
        })
      });
      if (res.ok) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error("Failed to register retailer", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900">Register New Retailer</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Shop Name</label>
            <input 
              required
              type="text" 
              value={formData.shop_name}
              onChange={e => setFormData({...formData, shop_name: e.target.value})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
              placeholder="e.g. Bismillah General Store"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Owner Name</label>
            <input 
              required
              type="text" 
              value={formData.owner_name}
              onChange={e => setFormData({...formData, owner_name: e.target.value})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
              placeholder="e.g. Ahmed Ali"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Location</label>
            <input 
              required
              type="text" 
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
              placeholder="e.g. Saddar, Karachi"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Phone Number</label>
            <input 
              required
              type="tel" 
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
              placeholder="e.g. 03001234567"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Credit Limit (PKR)</label>
            <input 
              required
              type="number" 
              value={formData.credit_limit}
              onChange={e => setFormData({...formData, credit_limit: e.target.value})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
              placeholder="0"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Register Retailer'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const DriverModal = ({ 
  onClose, 
  onSuccess,
  drivers 
}: { 
  onClose: () => void, 
  onSuccess: () => void,
  drivers: Driver[]
}) => {
  const [formData, setFormData] = useState({
    name: '',
    father_name: '',
    cell_no: '',
    cnic_no: '',
    joining_date: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingId ? `/api/drivers/${editingId}` : '/api/drivers';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess();
        setFormData({ 
          name: '', 
          father_name: '', 
          cell_no: '', 
          cnic_no: '', 
          joining_date: new Date().toISOString().split('T')[0] 
        });
        setEditingId(null);
      }
    } catch (err) {
      console.error("Failed to save driver", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this driver?")) return;
    try {
      const res = await fetch(`/api/drivers/${id}`, { method: 'DELETE' });
      if (res.ok) onSuccess();
      else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error("Failed to delete driver", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900">Manage Drivers Master Data</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="p-6 border-r border-slate-100 lg:col-span-1">
            <h4 className="text-sm font-bold text-slate-900 mb-4">{editingId ? 'Edit Driver' : 'Add New Driver'}</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Driver Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. Junaid Khan"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Father Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.father_name}
                  onChange={e => setFormData({...formData, father_name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. Abdul Khan"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Cell No</label>
                <input 
                  required
                  type="text" 
                  value={formData.cell_no}
                  onChange={e => setFormData({...formData, cell_no: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. 03001234567"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">CNIC #</label>
                <input 
                  required
                  type="text" 
                  value={formData.cnic_no}
                  onChange={e => setFormData({...formData, cnic_no: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. 42101-1234567-1"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Date of Joining</label>
                <input 
                  required
                  type="date" 
                  value={formData.joining_date}
                  onChange={e => setFormData({...formData, joining_date: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Driver' : 'Add Driver'}
                </button>
                {editingId && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ 
                        name: '', 
                        father_name: '', 
                        cell_no: '', 
                        cnic_no: '', 
                        joining_date: new Date().toISOString().split('T')[0] 
                      });
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="p-6 bg-slate-50 lg:col-span-2 overflow-y-auto max-h-[600px]">
            <h4 className="text-sm font-bold text-slate-900 mb-4">Driver List</h4>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Name / Father</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Contact / CNIC</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Joined</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {drivers.map(driver => (
                    <tr key={driver.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-slate-500">#{driver.id}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-slate-900">{driver.name}</p>
                        <p className="text-[10px] text-slate-500">{driver.father_name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-700">{driver.cell_no}</p>
                        <p className="text-[10px] text-slate-500">{driver.cnic_no}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{driver.joining_date}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => {
                              setEditingId(driver.id);
                              setFormData({ 
                                name: driver.name, 
                                father_name: driver.father_name, 
                                cell_no: driver.cell_no, 
                                cnic_no: driver.cnic_no, 
                                joining_date: driver.joining_date 
                              });
                            }}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Plus size={14} className="rotate-45" />
                          </button>
                          <button 
                            onClick={() => handleDelete(driver.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {drivers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">No drivers found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const SalesmanModal = ({ 
  onClose, 
  onSuccess,
  salesmen 
}: { 
  onClose: () => void, 
  onSuccess: () => void,
  salesmen: Salesman[]
}) => {
  const [formData, setFormData] = useState({
    name: '',
    father_name: '',
    cell_no: '',
    cnic_no: '',
    joining_date: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingId ? `/api/salesmen/${editingId}` : '/api/salesmen';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess();
        setFormData({ 
          name: '', 
          father_name: '', 
          cell_no: '', 
          cnic_no: '', 
          joining_date: new Date().toISOString().split('T')[0] 
        });
        setEditingId(null);
      }
    } catch (err) {
      console.error("Failed to save salesman", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this salesman?")) return;
    try {
      const res = await fetch(`/api/salesmen/${id}`, { method: 'DELETE' });
      if (res.ok) onSuccess();
      else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error("Failed to delete salesman", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900">Manage Salesmen Master Data</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="p-6 border-r border-slate-100 lg:col-span-1">
            <h4 className="text-sm font-bold text-slate-900 mb-4">{editingId ? 'Edit Salesman' : 'Add New Salesman'}</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Salesman Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. Asif Ali"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Father Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.father_name}
                  onChange={e => setFormData({...formData, father_name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. Muhammad Ali"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Cell No</label>
                <input 
                  required
                  type="text" 
                  value={formData.cell_no}
                  onChange={e => setFormData({...formData, cell_no: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. 03111234567"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">CNIC #</label>
                <input 
                  required
                  type="text" 
                  value={formData.cnic_no}
                  onChange={e => setFormData({...formData, cnic_no: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. 42101-2222222-2"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Date of Joining</label>
                <input 
                  required
                  type="date" 
                  value={formData.joining_date}
                  onChange={e => setFormData({...formData, joining_date: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Salesman' : 'Save Salesman'}
                </button>
                {editingId && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ name: '', father_name: '', cell_no: '', cnic_no: '', joining_date: new Date().toISOString().split('T')[0] });
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="p-6 bg-slate-50 lg:col-span-2 overflow-y-auto max-h-[500px]">
            <h4 className="text-sm font-bold text-slate-900 mb-4">Registered Salesmen</h4>
            <div className="space-y-3">
              {salesmen.map(salesman => (
                <div key={salesman.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                      <Users size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{salesman.name}</p>
                      <div className="flex gap-3 mt-1">
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Phone size={10} /> {salesman.cell_no}
                        </p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock size={10} /> Joined: {new Date(salesman.joining_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        setEditingId(salesman.id);
                        setFormData({
                          name: salesman.name,
                          father_name: salesman.father_name,
                          cell_no: salesman.cell_no,
                          cnic_no: salesman.cnic_no,
                          joining_date: salesman.joining_date
                        });
                      }}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                    >
                      <Plus size={18} className="rotate-45" />
                    </button>
                    <button 
                      onClick={() => handleDelete(salesman.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {salesmen.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                  <Users size={32} className="mx-auto text-slate-200 mb-2" />
                  <p className="text-slate-500 text-sm">No salesmen registered yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const OrderBookerModal = ({ 
  onClose, 
  onSuccess,
  orderBookers 
}: { 
  onClose: () => void, 
  onSuccess: () => void,
  orderBookers: OrderBooker[]
}) => {
  const [formData, setFormData] = useState({
    name: '',
    father_name: '',
    cell_no: '',
    cnic_no: '',
    joining_date: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingId ? `/api/order-bookers/${editingId}` : '/api/order-bookers';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess();
        setFormData({ 
          name: '', 
          father_name: '', 
          cell_no: '', 
          cnic_no: '', 
          joining_date: new Date().toISOString().split('T')[0] 
        });
        setEditingId(null);
      }
    } catch (err) {
      console.error("Failed to save order booker", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this order booker?")) return;
    try {
      const res = await fetch(`/api/order-bookers/${id}`, { method: 'DELETE' });
      if (res.ok) onSuccess();
      else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error("Failed to delete order booker", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900">Manage Order Bookers Master Data</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="p-6 border-r border-slate-100 lg:col-span-1">
            <h4 className="text-sm font-bold text-slate-900 mb-4">{editingId ? 'Edit Booker' : 'Add New Booker'}</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Booker Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. Zeeshan Ahmed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Father Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.father_name}
                  onChange={e => setFormData({...formData, father_name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. Ahmed Khan"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Cell No</label>
                <input 
                  required
                  type="text" 
                  value={formData.cell_no}
                  onChange={e => setFormData({...formData, cell_no: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. 03001234567"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">CNIC #</label>
                <input 
                  required
                  type="text" 
                  value={formData.cnic_no}
                  onChange={e => setFormData({...formData, cnic_no: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. 42101-1111111-1"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Date of Joining</label>
                <input 
                  required
                  type="date" 
                  value={formData.joining_date}
                  onChange={e => setFormData({...formData, joining_date: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Booker' : 'Add Booker'}
                </button>
                {editingId && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ 
                        name: '', 
                        father_name: '', 
                        cell_no: '', 
                        cnic_no: '', 
                        joining_date: new Date().toISOString().split('T')[0] 
                      });
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="p-6 bg-slate-50 lg:col-span-2 overflow-y-auto max-h-[600px]">
            <h4 className="text-sm font-bold text-slate-900 mb-4">Order Booker List</h4>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Name / Father</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Contact / CNIC</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Joined</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orderBookers.map(booker => (
                    <tr key={booker.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-slate-500">#{booker.id}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-slate-900">{booker.name}</p>
                        <p className="text-[10px] text-slate-500">{booker.father_name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-700">{booker.cell_no}</p>
                        <p className="text-[10px] text-slate-500">{booker.cnic_no}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{booker.joining_date}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => {
                              setEditingId(booker.id);
                              setFormData({ 
                                name: booker.name, 
                                father_name: booker.father_name, 
                                cell_no: booker.cell_no, 
                                cnic_no: booker.cnic_no, 
                                joining_date: booker.joining_date 
                              });
                            }}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Plus size={14} className="rotate-45" />
                          </button>
                          <button 
                            onClick={() => handleDelete(booker.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {orderBookers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">No bookers found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const DeliveryModal = ({ 
  onClose, 
  onSuccess,
  salesmen,
  orders,
  delivery,
  formatPKR
}: { 
  onClose: () => void, 
  onSuccess: () => void,
  salesmen: Salesman[],
  orders: Order[],
  delivery?: Delivery,
  formatPKR: (val: number) => string
}) => {
  const [internalSalesmen, setInternalSalesmen] = useState<Salesman[]>(salesmen);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(delivery?.order_id || null);
  const [selectedSalesmanId, setSelectedSalesmanId] = useState<number | null>(delivery?.salesman_id || null);
  const [deliveryDate, setDeliveryDate] = useState(delivery?.delivery_date || new Date().toISOString().split('T')[0]);
  const [pendingItems, setPendingItems] = useState<OrderItem[]>([]);
  const [deliveryItems, setDeliveryItems] = useState<{order_item_id: number, product_id: string, product_name: string, quantity: number, price: number, max_quantity: number, order_ref: number}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (salesmen && salesmen.length > 0) {
      setInternalSalesmen(salesmen);
    } else {
      // Self-healing: if salesmen are missing, try to fetch them
      const fetchSalesmenFallback = async () => {
        try {
          const res = await fetch('/api/salesmen');
          if (res.ok) {
            const data = await res.json();
            setInternalSalesmen(data);
          }
        } catch (err) {
          console.error("Self-healing fetch failed", err);
        }
      };
      fetchSalesmenFallback();
    }
  }, [salesmen]);

  useEffect(() => {
    if (delivery) {
      const fetchDeliveryItems = async () => {
        try {
          const res = await fetch(`/api/deliveries/${delivery.id}/items`);
          const data = await res.json();
          // For editing, we need to know the true max quantity (current delivery qty + remaining on order)
          // This is a bit complex without a specialized endpoint, so we'll approximate or just allow editing qty
          setDeliveryItems(data.map((item: any) => ({
            ...item,
            max_quantity: item.quantity + 9999 // Simplified for now
          })));
        } catch (err) {
          console.error("Failed to fetch delivery items", err);
        }
      };
      fetchDeliveryItems();
    }
  }, [delivery]);

  useEffect(() => {
    if (selectedOrderId) {
      fetchPendingItems(selectedOrderId);
    } else {
      setPendingItems([]);
      setDeliveryItems([]);
    }
  }, [selectedOrderId]);

  const fetchPendingItems = async (orderId: number) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/pending-items`);
      const data = await res.json();
      setPendingItems(data);
    } catch (err) {
      console.error("Failed to fetch pending items", err);
    }
  };

  const addItem = (item: OrderItem) => {
    if (deliveryItems.find(di => di.order_item_id === item.id)) return;
    const remaining = item.quantity - (item.delivered_quantity || 0);
    setDeliveryItems([...deliveryItems, {
      order_item_id: item.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: remaining,
      price: item.price,
      max_quantity: remaining,
      order_ref: item.order_id
    }]);
  };

  const removeItem = (orderItemId: number) => {
    setDeliveryItems(deliveryItems.filter(di => di.order_item_id !== orderItemId));
  };

  const updateItemQuantity = (orderItemId: number, qty: number) => {
    setDeliveryItems(deliveryItems.map(di => {
      if (di.order_item_id === orderItemId) {
        return { ...di, quantity: Math.min(qty, di.max_quantity) };
      }
      return di;
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !selectedSalesmanId || deliveryItems.length === 0) return;
    
    setIsSubmitting(true);
    try {
      const url = delivery ? `/api/deliveries/${delivery.id}` : '/api/deliveries';
      const method = delivery ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: selectedOrderId,
          salesman_id: selectedSalesmanId,
          delivery_date: deliveryDate,
          items: deliveryItems
        })
      });
      
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save delivery");
      }
    } catch (err) {
      console.error("Failed to save delivery", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {delivery 
                ? `Update Delivery (#ORD-${(delivery.order_ref || delivery.order_id || selectedOrderId || 0).toString().padStart(4, '0')})` 
                : 'New Delivery Transaction'}
            </h3>
            <p className="text-xs text-slate-500">{delivery ? 'Modify existing delivery details' : 'Record delivery against an existing sale order'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Select Order</label>
              <select 
                required
                value={selectedOrderId || ''}
                onChange={e => setSelectedOrderId(Number(e.target.value))}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
              >
                <option value="">Select an Order</option>
                {orders.filter(o => o.status === 'pending' || o.id === selectedOrderId).map(order => (
                  <option key={order.id} value={order.id}>
                    #ORD-{order.id.toString().padStart(4, '0')} - {order.shop_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Select Salesman</label>
              <select 
                required
                value={selectedSalesmanId || ''}
                onChange={e => setSelectedSalesmanId(Number(e.target.value))}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
              >
                <option value="">Select Salesman</option>
                {internalSalesmen.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Delivery Date</label>
              <input 
                required
                type="date" 
                value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Items List */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden flex flex-col h-[400px]">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-700 uppercase">Pending Order Items</h4>
                <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold">
                  {pendingItems.length} Items
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {pendingItems.map(item => {
                  const isAdded = deliveryItems.find(di => di.order_item_id === item.id);
                  const remaining = item.quantity - (item.delivered_quantity || 0);
                  return (
                    <div 
                      key={item.id}
                      className={cn(
                        "p-3 rounded-xl border transition-all flex justify-between items-center",
                        isAdded ? "bg-indigo-50 border-indigo-100 opacity-50" : "bg-white border-slate-100 hover:border-indigo-200 cursor-pointer"
                      )}
                      onClick={() => !isAdded && addItem(item)}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900">{item.product_name}</p>
                          <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                            #ORD-{(item.order_id || selectedOrderId || delivery?.order_id || 0).toString().padStart(4, '0')}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">{item.brand}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[10px] font-bold text-slate-400">Ordered: {item.quantity}</span>
                          <span className="text-[10px] font-bold text-emerald-600">Remaining: {remaining}</span>
                        </div>
                      </div>
                      {!isAdded && <Plus size={18} className="text-indigo-600" />}
                    </div>
                  );
                })}
                {selectedOrderId && pendingItems.length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle2 size={32} className="mx-auto text-emerald-200 mb-2" />
                    <p className="text-sm text-slate-500">All items delivered for this order</p>
                  </div>
                )}
                {!selectedOrderId && (
                  <div className="text-center py-12">
                    <ShoppingCart size={32} className="mx-auto text-slate-200 mb-2" />
                    <p className="text-sm text-slate-500">Select an order to see items</p>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Items List */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden flex flex-col h-[400px]">
              <div className="bg-indigo-600 px-4 py-3 flex justify-between items-center">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Items to Deliver</h4>
                <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">
                  {deliveryItems.length} Selected
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-50/50">
                {deliveryItems.map(item => (
                  <div key={item.order_item_id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900">{item.product_name}</p>
                        <span className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">
                          #ORD-{(item.order_ref || selectedOrderId || delivery?.order_id || 0).toString().padStart(4, '0')}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">Price: {formatPKR(item.price)}</p>
                    </div>
                    <div className="w-24">
                      <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Quantity</label>
                      <input 
                        type="number" 
                        min="1"
                        max={item.max_quantity}
                        value={item.quantity}
                        onChange={e => updateItemQuantity(item.order_item_id, Number(e.target.value))}
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-sm outline-none focus:border-indigo-600"
                      />
                      <p className="text-[8px] text-rose-500 mt-0.5">Max: {item.max_quantity}</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => removeItem(item.order_item_id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {deliveryItems.length === 0 && (
                  <div className="text-center py-12">
                    <Truck size={32} className="mx-auto text-slate-200 mb-2" />
                    <p className="text-sm text-slate-500">No items added to delivery</p>
                  </div>
                )}
              </div>
              <div className="p-4 bg-white border-t border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-slate-500 uppercase">Total Amount</span>
                  <span className="text-xl font-bold text-indigo-600">
                    {formatPKR(deliveryItems.reduce((sum, item) => sum + (item.quantity * item.price), 0))}
                  </span>
                </div>
                <button 
                  type="submit"
                  disabled={isSubmitting || deliveryItems.length === 0}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Processing...' : (
                    <>
                      <Save size={18} />
                      <span>Confirm Delivery</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const DeliveryDetailsModal = ({ 
  delivery, 
  onClose, 
  formatPKR 
}: { 
  delivery: Delivery, 
  onClose: () => void, 
  formatPKR: (val: number) => string 
}) => {
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, [delivery.id]);

  const fetchItems = async () => {
    try {
      const res = await fetch(`/api/deliveries/${delivery.id}/items`);
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error("Failed to fetch delivery items", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-slate-900">Delivery Details</h3>
              <span className="text-xs font-mono text-slate-400">#DEL-{delivery.id.toString().padStart(4, '0')}</span>
            </div>
            <p className="text-xs text-slate-500">
              Order Ref: #ORD-{(delivery.order_ref || delivery.order_id || 0).toString().padStart(4, '0')}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Retailer</p>
              <p className="text-sm font-bold text-slate-900">{delivery.shop_name}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Salesman</p>
              <p className="text-sm font-bold text-slate-900">{delivery.salesman_name}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Date</p>
              <p className="text-sm font-bold text-slate-900">{new Date(delivery.delivery_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Amount</p>
              <p className="text-sm font-bold text-indigo-600">{formatPKR(delivery.total_amount)}</p>
            </div>
          </div>

          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center">Qty</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Price</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Loading items...</td></tr>
                ) : items.map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900">{item.product_name}</p>
                        <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                          #ORD-{(item.order_ref || delivery.order_ref || delivery.order_id || 0).toString().padStart(4, '0')}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">{item.brand}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-slate-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600">{formatPKR(item.price)}</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">{formatPKR(item.quantity * item.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const NewOrderModal = ({ 
  retailers,
  orderBookers,
  products,
  order,
  onClose, 
  onSuccess,
  formatPKR
}: { 
  retailers: Retailer[],
  orderBookers: OrderBooker[],
  products: Product[],
  order?: Order,
  onClose: () => void, 
  onSuccess: () => void,
  formatPKR: (amount: number) => string
}) => {
  const [masterData, setMasterData] = useState({
    retailer_id: order?.retailer_id.toString() || '',
    order_booker_id: order?.order_booker_id.toString() || '',
    estimated_delivery_date: order?.estimated_delivery_date || new Date(Date.now() + 86400000).toISOString().split('T')[0]
  });
  
  const [items, setItems] = useState<{ product_id: string, quantity: number, price: number, product_name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLOV, setShowLOV] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (order) {
      const fetchItems = async () => {
        try {
          const res = await fetch(`/api/orders/${order.id}/items`);
          const data = await res.json();
          setItems(data.map((item: any) => ({
            ...item,
            product_name: products.find(p => p.product_id === item.product_id)?.product_name || 'Unknown Product'
          })));
        } catch (err) {
          console.error("Failed to fetch order items", err);
        }
      };
      fetchItems();
    }
  }, [order, products]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'a') {
        e.preventDefault();
        document.getElementById('product-search')?.focus();
      }
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [masterData, items]);

  const filteredProducts = products.filter(p => 
    p.product_id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addItem = (product: Product) => {
    const existing = items.find(i => i.product_id === product.product_id);
    if (existing) {
      setItems(items.map(i => i.product_id === product.product_id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, { 
        product_id: product.product_id, 
        quantity: 1, 
        price: product.trade_price,
        product_name: product.product_name 
      }]);
    }
    setSearchQuery('');
    setShowLOV(false);
  };

  const removeItem = (productId: string) => {
    setItems(items.filter(i => i.product_id !== productId));
  };

  const updateQty = (productId: string, qty: number) => {
    setItems(items.map(i => i.product_id === productId ? { ...i, quantity: Math.max(1, qty) } : i));
  };

  const totalAmount = items.reduce((sum, i) => sum + (i.quantity * i.price), 0);

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!masterData.retailer_id || !masterData.order_booker_id || items.length === 0) {
      alert("Please fill all master data and add at least one item.");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = order ? `/api/orders/${order.id}` : '/api/orders';
      const method = order ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...masterData,
          retailer_id: parseInt(masterData.retailer_id),
          order_booker_id: parseInt(masterData.order_booker_id),
          items
        })
      });
      if (res.ok) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error("Failed to save order", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{order ? 'Update Order' : 'Create New Order (Master-Detail)'}</h3>
            <p className="text-xs text-slate-500">Shortcut: <kbd className="bg-white border px-1 rounded">Alt+A</kbd> Add Item, <kbd className="bg-white border px-1 rounded">Alt+S</kbd> Save</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Master Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
            <div>
              <label className="block text-xs font-bold text-indigo-700 mb-1 uppercase">Retailer / Shop</label>
              <select 
                required
                value={masterData.retailer_id}
                onChange={e => setMasterData({...masterData, retailer_id: e.target.value})}
                className="w-full px-4 py-2 bg-white border border-indigo-200 rounded-xl text-sm focus:border-indigo-600 outline-none"
              >
                <option value="">Select Retailer</option>
                {retailers.map(r => <option key={r.id} value={r.id}>{r.shop_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-indigo-700 mb-1 uppercase">Order Booker</label>
              <select 
                required
                value={masterData.order_booker_id}
                onChange={e => setMasterData({...masterData, order_booker_id: e.target.value})}
                className="w-full px-4 py-2 bg-white border border-indigo-200 rounded-xl text-sm focus:border-indigo-600 outline-none"
              >
                <option value="">Select Booker</option>
                {orderBookers.map(ob => <option key={ob.id} value={ob.id}>{ob.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-indigo-700 mb-1 uppercase">Est. Delivery Date</label>
              <input 
                required
                type="date" 
                value={masterData.estimated_delivery_date}
                onChange={e => setMasterData({...masterData, estimated_delivery_date: e.target.value})}
                className="w-full px-4 py-2 bg-white border border-indigo-200 rounded-xl text-sm focus:border-indigo-600 outline-none"
              />
            </div>
          </div>

          {/* Detail Form (Items) */}
          <div className="space-y-4">
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    id="product-search"
                    type="text" 
                    placeholder="Search Product by Code or Name (Alt+A)..."
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      setShowLOV(true);
                    }}
                    onFocus={() => setShowLOV(true)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  />
                  
                  {/* LOV (List of Values) */}
                  <AnimatePresence>
                    {showLOV && searchQuery && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto"
                      >
                        {filteredProducts.map(p => (
                          <button 
                            key={p.product_id}
                            onClick={() => addItem(p)}
                            className="w-full px-4 py-3 text-left hover:bg-indigo-50 flex justify-between items-center border-b border-slate-50 last:border-0"
                          >
                            <div>
                              <p className="text-sm font-bold text-slate-900">{p.product_name}</p>
                              <p className="text-xs text-slate-500">{p.product_id} • {p.brand}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-indigo-600">{formatPKR(p.trade_price)}</p>
                              <p className="text-[10px] text-slate-400">Stock: {p.stock_quantity}</p>
                            </div>
                          </button>
                        ))}
                        {filteredProducts.length === 0 && (
                          <div className="p-4 text-center text-slate-500 text-sm">No products found</div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map(item => (
                    <tr key={item.product_id}>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900">{item.product_name}</p>
                        <p className="text-xs text-slate-500">{item.product_id}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{formatPKR(item.price)}</td>
                      <td className="px-6 py-4">
                        <input 
                          type="number" 
                          value={item.quantity}
                          onChange={e => updateQty(item.product_id, parseInt(e.target.value))}
                          className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-600"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">{formatPKR(item.quantity * item.price)}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => removeItem(item.product_id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        <ShoppingCart className="mx-auto mb-2 opacity-20" size={48} />
                        <p>No items added yet. Search products above to start.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Amount</span>
            <span className="text-2xl font-bold text-indigo-600">{formatPKR(totalAmount)}</span>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => handleSubmit()}
              disabled={isSubmitting || items.length === 0}
              className="px-8 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Order...' : 'Save Order (Alt+S)'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const MaterialGroupModal = ({ 
  onClose, 
  onSuccess,
  materialGroups 
}: { 
  onClose: () => void, 
  onSuccess: () => void,
  materialGroups: MaterialGroup[]
}) => {
  const [formData, setFormData] = useState({
    mat_gp: '',
    mat_description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingId ? `/api/material-groups/${editingId}` : '/api/material-groups';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess();
        setFormData({ mat_gp: '', mat_description: '' });
        setEditingId(null);
      }
    } catch (err) {
      console.error("Failed to save material group", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this material group?")) return;
    try {
      const res = await fetch(`/api/material-groups/${id}`, { method: 'DELETE' });
      if (res.ok) onSuccess();
      else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error("Failed to delete material group", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900">Manage Material Groups</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="p-6 border-r border-slate-100">
            <h4 className="text-sm font-bold text-slate-900 mb-4">{editingId ? 'Edit Group' : 'Add New Group'}</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Group ID (MatGP)</label>
                <input 
                  required
                  disabled={!!editingId}
                  type="text" 
                  value={formData.mat_gp}
                  onChange={e => setFormData({...formData, mat_gp: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all disabled:opacity-50"
                  placeholder="e.g. 00001"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Description</label>
                <input 
                  required
                  type="text" 
                  value={formData.mat_description}
                  onChange={e => setFormData({...formData, mat_description: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. OIL"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Add Group'}
                </button>
                {editingId && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ mat_gp: '', mat_description: '' });
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="p-6 bg-slate-50 overflow-y-auto max-h-[400px]">
            <h4 className="text-sm font-bold text-slate-900 mb-4">Existing Groups</h4>
            <div className="space-y-2">
              {materialGroups.map(group => (
                <div key={group.mat_gp} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-slate-400">{group.mat_gp}</p>
                    <p className="text-sm font-bold text-slate-900">{group.mat_description}</p>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        setEditingId(group.mat_gp);
                        setFormData({ mat_gp: group.mat_gp, mat_description: group.mat_description });
                      }}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Plus size={16} className="rotate-45" />
                    </button>
                    <button 
                      onClick={() => handleDelete(group.mat_gp)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {materialGroups.length === 0 && (
                <p className="text-center py-8 text-slate-500 text-sm">No groups found</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>

const UnitModal = ({ 
  onClose, 
  onSuccess 
}: { 
  onClose: () => void, 
  onSuccess: () => void 
}) => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    status: 1
  });

  const fetchUnits = async () => {
    try {
      const res = await fetch('/api/units');
      if (res.ok) {
        const data = await res.json();
        setUnits(data);
      }
    } catch (err) {
      console.error("Failed to fetch units", err);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingId ? `/api/units/${editingId}` : '/api/units';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        fetchUnits();
        setEditingId(null);
        setFormData({ name: '', short_name: '', status: 1 });
        onSuccess();
      }
    } catch (err) {
      console.error("Action failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this unit?')) return;
    try {
      const res = await fetch(`/api/units/${id}`, { method: 'DELETE' });
      if (res.ok) fetchUnits();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center text-slate-900">
          <h3 className="text-lg font-bold">Manage Unit Master Data</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="p-6 border-r border-slate-100 lg:col-span-1">
            <h4 className="text-sm font-bold text-slate-900 mb-4">{editingId ? 'Edit Unit' : 'Add New Unit'}</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Unit Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. EACH"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Short Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.short_name}
                  onChange={e => setFormData({...formData, short_name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. EA"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Unit' : 'Add Unit'}
                </button>
                {editingId && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ name: '', short_name: '', status: 1 });
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="p-6 bg-slate-50 lg:col-span-2 overflow-y-auto max-h-[600px]">
            <h4 className="text-sm font-bold text-slate-900 mb-4">Unit List</h4>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Short Name</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {units.map(unit => (
                    <tr key={unit.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-slate-500">#{unit.id}</td>
                      <td className="px-4 py-3 text-sm font-bold text-slate-900">{unit.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{unit.short_name}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => {
                              setEditingId(unit.id);
                              setFormData({ name: unit.name, short_name: unit.short_name, status: unit.status });
                            }}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Plus size={14} className="rotate-45" />
                          </button>
                          <button 
                            onClick={() => handleDelete(unit.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {units.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-sm">No units found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const ProductMasterDataModal = ({ 
  onClose, 
  onSuccess,
  materialGroups,
  products
}: { 
  onClose: () => void, 
  onSuccess: () => void,
  materialGroups: MaterialGroup[],
  products: Product[]
}) => {
  const [formData, setFormData] = useState({
    product_name: '',
    brand: '',
    material_group_id: '',
    purchase_price: '',
    trade_price: '',
    retail_price: '',
    stock_quantity: '',
    unit: 'EACH',
    conversion_value: '1',
    conversion_unit: 'EACH',
    min_stock_level: '10',
    reorder_level: '20'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingId ? `/api/products/${editingId}` : '/api/products';
      const method = editingId ? 'PUT' : 'POST';
      const payload = {
        ...formData,
        purchase_price: parseFloat(formData.purchase_price),
        trade_price: parseFloat(formData.trade_price),
        retail_price: parseFloat(formData.retail_price),
        stock_quantity: parseInt(formData.stock_quantity),
        conversion_value: parseFloat(formData.conversion_value),
        min_stock_level: parseInt(formData.min_stock_level),
        reorder_level: parseInt(formData.reorder_level)
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        onSuccess();
        if (!editingId) {
          setFormData({
            product_name: '',
            brand: '',
            material_group_id: '',
            purchase_price: '',
            trade_price: '',
            retail_price: '',
            stock_quantity: '',
            unit: 'EACH',
            conversion_value: '1',
            conversion_unit: 'EACH',
            min_stock_level: '10',
            reorder_level: '20'
          });
        }
        setEditingId(null);
      }
    } catch (err) {
      console.error("Failed to save product", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id || product.product_id); // Support both naming variants if they exist
    setFormData({
      product_name: product.product_name,
      brand: product.brand || '',
      material_group_id: product.material_group_id?.toString() || '',
      purchase_price: product.purchase_price.toString(),
      trade_price: product.trade_price.toString(),
      retail_price: product.retail_price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      unit: product.unit || 'EACH',
      conversion_value: (product.conversion_value || 1).toString(),
      conversion_unit: product.conversion_unit || 'EACH',
      min_stock_level: (product.min_stock_level || 10).toString(),
      reorder_level: (product.reorder_level || 20).toString()
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) onSuccess();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const filteredProducts = products.filter(p => 
    p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Package size={20} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Manage Product Master Data</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
          {/* Form Section */}
          <div className="p-6 border-r border-slate-100 lg:col-span-1 overflow-y-auto">
            <h4 className="text-sm font-bold text-slate-900 mb-4">{editingId ? 'Edit Product' : 'Add New Product'}</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Product Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.product_name}
                  onChange={e => setFormData({...formData, product_name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. Cooking Oil 1L"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Brand</label>
                  <input 
                    type="text" 
                    value={formData.brand}
                    onChange={e => setFormData({...formData, brand: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                    placeholder="e.g. Dalda"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Material Group</label>
                  <select 
                    required
                    value={formData.material_group_id}
                    onChange={e => setFormData({...formData, material_group_id: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  >
                    <option value="">Select Group</option>
                    {materialGroups.map(mg => (
                      <option key={mg.mat_gp} value={mg.mat_gp}>{mg.mat_description}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Purchase (PP)</label>
                  <input 
                    required
                    type="number" 
                    value={formData.purchase_price}
                    onChange={e => setFormData({...formData, purchase_price: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Trade (TP)</label>
                  <input 
                    required
                    type="number" 
                    value={formData.trade_price}
                    onChange={e => setFormData({...formData, trade_price: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Retail (RP)</label>
                  <input 
                    required
                    type="number" 
                    value={formData.retail_price}
                    onChange={e => setFormData({...formData, retail_price: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Stock Qty</label>
                  <input 
                    required
                    type="number" 
                    value={formData.stock_quantity}
                    onChange={e => setFormData({...formData, stock_quantity: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Unit</label>
                  <input 
                    required
                    type="text" 
                    value={formData.unit}
                    onChange={e => setFormData({...formData, unit: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                    placeholder="EACH"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Conv Val</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={formData.conversion_value}
                    onChange={e => setFormData({...formData, conversion_value: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Conv Unit</label>
                  <input 
                    required
                    type="text" 
                    value={formData.conversion_unit}
                    onChange={e => setFormData({...formData, conversion_unit: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Min Stock</label>
                  <input 
                    required
                    type="number" 
                    value={formData.min_stock_level}
                    onChange={e => setFormData({...formData, min_stock_level: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Reorder</label>
                  <input 
                    required
                    type="number" 
                    value={formData.reorder_level}
                    onChange={e => setFormData({...formData, reorder_level: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}
                </button>
                {editingId && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({
                        product_name: '',
                        brand: '',
                        material_group_id: '',
                        purchase_price: '',
                        trade_price: '',
                        retail_price: '',
                        stock_quantity: '',
                        unit: 'EACH',
                        conversion_value: '1',
                        conversion_unit: 'EACH',
                        min_stock_level: '10',
                        reorder_level: '20'
                      });
                    }}
                    className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List Section */}
          <div className="lg:col-span-2 overflow-hidden flex flex-col bg-slate-50/50">
            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search products by name or brand..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600 transition-all"
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProducts.map(product => (
                  <div key={product.id || product.product_id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-all group">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 tracking-wider">#{product.id || product.product_id}</p>
                        <h5 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{product.product_name}</h5>
                        <p className="text-xs text-slate-500 font-medium">{product.brand} • {product.unit}</p>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleEdit(product)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id || product.product_id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-50 mb-3">
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Trade</p>
                        <p className="text-sm font-bold text-slate-900">{product.trade_price}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Stock</p>
                        <p className={cn(
                          "text-sm font-bold",
                          product.stock_quantity <= product.min_stock_level ? "text-rose-600" : "text-emerald-600"
                        )}>{product.stock_quantity}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Retail</p>
                        <p className="text-sm font-bold text-slate-900">{product.retail_price}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <Package size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-500 font-medium">No products found matching your search</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200",
      active 
        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
    )}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const StatCard = ({ label, value, icon: Icon, color, trend, alert }: any) => (
  <div className={cn(
    "bg-white p-6 rounded-2xl border transition-all duration-300",
    alert ? "border-rose-200 shadow-lg shadow-rose-50 ring-1 ring-rose-100" : "border-slate-100 shadow-sm"
  )}>
    <div className="flex justify-between items-start mb-4">
      <div className={cn(
        "p-3 rounded-xl", 
        color,
        alert && "animate-pulse"
      )}>
        <Icon size={24} className="text-white" />
      </div>
      {alert && (
        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-rose-100 text-rose-600 uppercase tracking-wider">
          Action Required
        </span>
      )}
      {trend && !alert && (
        <span className={cn(
          "text-xs font-bold px-2 py-1 rounded-full",
          trend > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
        )}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <p className="text-slate-500 text-sm font-medium mb-1">{label}</p>
    <h3 className={cn(
      "text-2xl font-bold transition-colors",
      alert ? "text-rose-600" : "text-slate-900"
    )}>{value}</h3>
  </div>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'retailers' | 'orders' | 'purchases' | 'load_plans' | 'master_data' | 'reports' | 'deliveries'>('dashboard');
  const [masterDataSubTab, setMasterDataSubTab] = useState<'products' | 'retailers' | 'suppliers' | 'order_bookers' | 'salesmen' | 'drivers'>('products');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [valuation, setValuation] = useState<StockValuationReport | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loadPlans, setLoadPlans] = useState<LoadPlan[]>([]);
  const [materialGroups, setMaterialGroups] = useState<MaterialGroup[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orderBookers, setOrderBookers] = useState<OrderBooker[]>([]);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [chartData, setChartData] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [isProductMasterModalOpen, setIsProductMasterModalOpen] = useState(false);
  const [isRegisterRetailerModalOpen, setIsRegisterRetailerModalOpen] = useState(false);
  const [isRegisterSupplierModalOpen, setIsRegisterSupplierModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [isMaterialGroupModalOpen, setIsMaterialGroupModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [isOrderBookerModalOpen, setIsOrderBookerModalOpen] = useState(false);
  const [isSalesmanModalOpen, setIsSalesmanModalOpen] = useState(false);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);

  useEffect(() => {
    fetchStats();
    fetchProducts();
    fetchRetailers();
    fetchSuppliers();
    fetchOrders();
    fetchChartData();
    fetchPurchases();
    fetchLoadPlans();
    fetchValuation();
    fetchMaterialGroups();
    fetchDrivers();
    fetchOrderBookers();
    fetchSalesmen();
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const res = await fetch('/api/deliveries');
      const data = await res.json();
      setDeliveries(data);
    } catch (err) {
      console.error("Failed to fetch deliveries", err);
    }
  };

  const fetchSalesmen = async () => {
    try {
      const res = await fetch('/api/salesmen');
      const data = await res.json();
      setSalesmen(data);
    } catch (err) {
      console.error("Failed to fetch salesmen", err);
    }
  };

  const fetchOrderBookers = async () => {
    try {
      const res = await fetch('/api/order-bookers');
      const data = await res.json();
      setOrderBookers(data);
    } catch (err) {
      console.error("Failed to fetch order bookers", err);
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await fetch('/api/drivers');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setDrivers(data);
    } catch (err) {
      console.error("Failed to fetch drivers", err);
    }
  };

  const fetchMaterialGroups = async () => {
    try {
      const res = await fetch('/api/material-groups');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setMaterialGroups(data);
    } catch (err) {
      console.error("Failed to fetch material groups", err);
    }
  };

  const fetchValuation = async () => {
    try {
      const res = await fetch('/api/reports/stock-valuation');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setValuation(data);
    } catch (err) {
      console.error("Failed to fetch valuation", err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products", err);
    }
  };

  const fetchRetailers = async () => {
    try {
      const res = await fetch('/api/retailers');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setRetailers(data);
    } catch (err) {
      console.error("Failed to fetch retailers", err);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setSuppliers(data);
    } catch (err) {
      console.error("Failed to fetch suppliers", err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("Failed to fetch orders", err);
    }
  };

  const fetchPurchases = async () => {
    try {
      const res = await fetch('/api/purchases');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setPurchases(data);
    } catch (err) {
      console.error("Failed to fetch purchases", err);
    }
  };

  const fetchLoadPlans = async () => {
    try {
      const res = await fetch('/api/load-plans');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setLoadPlans(data);
    } catch (err) {
      console.error("Failed to fetch load plans", err);
    }
  };

  const fetchChartData = async () => {
    try {
      const res = await fetch('/api/sales-chart');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setChartData(data);
    } catch (err) {
      console.error("Failed to fetch chart data", err);
    }
  };

  const formatPKR = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <TrendingUp className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Karachi DMS</h1>
          </div>

          <nav className="space-y-2 flex-1">
            <SidebarItem 
              icon={LayoutDashboard} 
              label="Dashboard" 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
            />
            <SidebarItem 
              icon={ShoppingCart} 
              label="Orders" 
              active={activeTab === 'orders'} 
              onClick={() => setActiveTab('orders')} 
            />
            <SidebarItem 
              icon={Truck} 
              label="Deliveries" 
              active={activeTab === 'deliveries'} 
              onClick={() => setActiveTab('deliveries')} 
            />
            <SidebarItem 
              icon={FileText} 
              label="Purchases" 
              active={activeTab === 'purchases'} 
              onClick={() => setActiveTab('purchases')} 
            />
            <SidebarItem 
              icon={Truck} 
              label="Load Plans" 
              active={activeTab === 'load_plans'} 
              onClick={() => setActiveTab('load_plans')} 
            />
            <SidebarItem 
              icon={Database} 
              label="Master Data" 
              active={activeTab === 'master_data'} 
              onClick={() => setActiveTab('master_data')} 
            />
            <SidebarItem 
              icon={BarChart3} 
              label="MIS - Reports" 
              active={activeTab === 'reports'} 
              onClick={() => setActiveTab('reports')} 
            />
          </nav>

          <div className="pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3 px-4 py-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                AK
              </div>
              <div>
                <p className="text-sm font-bold">Admin Karachi</p>
                <p className="text-xs text-slate-500">Super Admin</p>
              </div>
            </div>
            <button className="flex items-center gap-3 w-full px-4 py-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-bottom border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex-1 max-w-xl mx-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search orders, retailers, products..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-indigo-600 rounded-xl text-sm transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100">
              <Plus size={18} />
              <span>New Order</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Market Overview</h2>
                    <p className="text-slate-500">Real-time distribution metrics for Karachi region</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-slate-500">Last Updated</p>
                    <p className="text-sm font-bold text-slate-900">{new Date().toLocaleTimeString()}</p>
                  </div>
                </div>

                {stats && stats.lowStock > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-4"
                  >
                    <div className="bg-rose-500 p-2 rounded-lg text-white">
                      <AlertTriangle size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-rose-900">Inventory Alert</p>
                      <p className="text-xs text-rose-700">There are {stats.lowStock} items currently below their minimum stock level. Please review inventory.</p>
                    </div>
                    <button 
                      onClick={() => {
                        setActiveTab('master_data');
                        setMasterDataSubTab('products');
                      }}
                      className="text-xs font-bold text-rose-600 hover:underline"
                    >
                      View Inventory
                    </button>
                  </motion.div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard 
                    label="Total Sales" 
                    value={formatPKR(stats?.totalSales || 0)} 
                    icon={TrendingUp} 
                    color="bg-indigo-600"
                    trend={12}
                  />
                  <StatCard 
                    label="Stock Value (PP)" 
                    value={formatPKR(valuation?.totalValueAtPP || 0)} 
                    icon={Package} 
                    color="bg-amber-500"
                  />
                  <StatCard 
                    label="Potential Revenue" 
                    value={formatPKR(valuation?.totalPotentialRevenueAtTP || 0)} 
                    icon={DollarSign} 
                    color="bg-emerald-500"
                  />
                  <StatCard 
                    label="Active Retailers" 
                    value={stats?.totalRetailers || 0} 
                    icon={Store} 
                    color="bg-indigo-500"
                    trend={5}
                  />
                </div>

                {/* Valuation Summary */}
                {valuation && (
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold">Stock Valuation Summary</h3>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">FIFO Valuation</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-1">
                        <p className="text-sm text-slate-500">Total Potential Profit</p>
                        <p className="text-2xl font-bold text-emerald-600">{formatPKR(valuation.totalPotentialProfit)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-slate-500">Average Margin</p>
                        <p className="text-2xl font-bold text-indigo-600">{valuation.averageMarginPercent.toFixed(1)}%</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-slate-500">Inventory Health</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-600" 
                              style={{ width: `${Math.min(valuation.averageMarginPercent * 2, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-slate-700">Optimal</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold mb-6">Weekly Sales Performance</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                          <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="sales" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold mb-6">Recent Orders</h3>
                    <div className="space-y-4">
                      {orders.slice(0, 5).map(order => (
                        <div 
                          key={order.id} 
                          onClick={() => setSelectedOrder(order)}
                          className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-slate-100 p-2 rounded-lg">
                              <ShoppingCart size={18} className="text-slate-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{order.shop_name}</p>
                              <p className="text-xs text-slate-500">{new Date(order.order_date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-900">{formatPKR(order.total_amount)}</p>
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                              order.status === 'delivered' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                            )}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => setActiveTab('orders')}
                      className="w-full mt-6 py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                    >
                      View All Orders
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'master_data' && (
              <motion.div 
                key="master_data"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Master Data Management</h2>
                    <p className="text-slate-500">Manage core entities and configurations</p>
                  </div>
                </div>

                {/* Sub-tabs Navigation */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
                  {[
                    { id: 'suppliers', label: 'Suppliers', icon: Factory },
                    { id: 'retailers', label: 'Retailers', icon: Store },
                    { id: 'order_bookers', label: 'Order Bookers', icon: Users },
                    { id: 'salesmen', label: 'Salesmen', icon: Users },
                    { id: 'products', label: 'Products', icon: Package },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setMasterDataSubTab(tab.id as any)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                        masterDataSubTab === tab.id 
                          ? "bg-white text-indigo-600 shadow-sm" 
                          : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                      )}
                    >
                      <tab.icon size={16} />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Sub-tab Content */}
                <div className="mt-6">
                  {masterDataSubTab === 'suppliers' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-900">Supplier Directory</h3>
                        <button 
                          onClick={() => setIsRegisterSupplierModalOpen(true)}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
                        >
                          <Plus size={18} />
                          <span>Register Supplier</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {suppliers.map(supplier => (
                          <div key={supplier.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-4">
                              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                <Factory size={24} />
                              </div>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">{supplier.name}</h3>
                            <p className="text-sm text-slate-500 mb-4 flex items-center gap-1">
                              <Users size={14} className="text-slate-400" />
                              {supplier.contact_person}
                            </p>
                            <div className="space-y-3 pt-4 border-t border-slate-50">
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <MapPin size={16} className="text-slate-400" />
                                <span>{supplier.address}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Phone size={16} className="text-slate-400" />
                                <span>{supplier.phone}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {masterDataSubTab === 'retailers' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-900">Retailer Network</h3>
                        <button 
                          onClick={() => setIsRegisterRetailerModalOpen(true)}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                        >
                          <Plus size={18} />
                          <span>Register Retailer</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {retailers.map(retailer => (
                          <div key={retailer.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-4">
                              <div className="bg-indigo-50 p-3 rounded-xl">
                                <Store className="text-indigo-600" size={24} />
                              </div>
                              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Active</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">{retailer.shop_name}</h3>
                            <p className="text-sm text-slate-500 mb-4">{retailer.owner_name}</p>
                            <div className="space-y-3 pt-4 border-t border-slate-50">
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <MapPin size={16} className="text-slate-400" />
                                <span>{retailer.location}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Phone size={16} className="text-slate-400" />
                                <span>{retailer.phone}</span>
                              </div>
                              <div className="flex items-center justify-between pt-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Credit Limit</span>
                                <span className="text-sm font-bold text-slate-900">{formatPKR(retailer.credit_limit)}</span>
                              </div>
                              <div className="pt-4 border-t border-slate-50 flex justify-end">
                                <button 
                                  onClick={() => setSelectedRetailer(retailer)}
                                  className="flex items-center gap-1 text-indigo-600 text-sm font-bold hover:underline"
                                >
                                  <span>View Ledger</span>
                                  <ChevronRight size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {masterDataSubTab === 'order_bookers' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-900">Order Bookers</h3>
                        <button 
                          onClick={() => setIsOrderBookerModalOpen(true)}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
                        >
                          <Plus size={18} />
                          <span>Manage Order Bookers</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {orderBookers.map(booker => (
                          <div key={booker.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                                <Users size={24} />
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-slate-900">{booker.name}</h3>
                                <p className="text-sm text-slate-500">Booker ID: #BK-{booker.id.toString().padStart(3, '0')}</p>
                              </div>
                            </div>
                            <div className="space-y-3 pt-4 border-t border-slate-50">
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Phone size={16} className="text-slate-400" />
                                <span>{booker.cell_no}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Clock size={16} className="text-slate-400" />
                                <span>Joined: {new Date(booker.joining_date).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {masterDataSubTab === 'salesmen' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-900">Salesmen Directory</h3>
                        <button 
                          onClick={() => setIsSalesmanModalOpen(true)}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
                        >
                          <Plus size={18} />
                          <span>Manage Salesmen</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {salesmen.map(salesman => (
                          <div key={salesman.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                                <Users size={24} />
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-slate-900">{salesman.name}</h3>
                                <p className="text-sm text-slate-500">Salesman ID: #SM-{salesman.id.toString().padStart(3, '0')}</p>
                              </div>
                            </div>
                            <div className="space-y-3 pt-4 border-t border-slate-50">
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Phone size={16} className="text-slate-400" />
                                <span>{salesman.cell_no}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Clock size={16} className="text-slate-400" />
                                <span>Joined: {new Date(salesman.joining_date).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {masterDataSubTab === 'products' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-900">Product Inventory</h3>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setIsMaterialGroupModalOpen(true)}
                            className="bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
                          >
                            <Package size={18} />
                            <span>Groups</span>
                          </button>
                          <button 
                            onClick={() => setIsProductMasterModalOpen(true)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
                          >
                            <Settings size={18} />
                            <span>Manage Product Master Data</span>
                          </button>
                        </div>
                      </div>
                      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product Name</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Group</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">PP / TP / RP</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Stock</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {products.map(product => (
                              <tr key={product.product_id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-mono text-xs text-slate-500">{product.product_id}</td>
                                <td className="px-6 py-4">
                                  <p className="text-sm font-bold text-slate-900">{product.product_name}</p>
                                  <p className="text-[10px] text-slate-500">{product.brand}</p>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-xs font-bold text-slate-900">{product.material_group_name}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-900">PP: {formatPKR(product.purchase_price)}</span>
                                    <span className="text-xs text-indigo-600">TP: {formatPKR(product.trade_price)}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className={cn("text-sm font-bold", product.stock_quantity < 20 ? "text-rose-600" : "text-slate-900")}>
                                    {product.stock_quantity}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div 
                key="reports"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">MIS - Reports</h2>
                    <p className="text-slate-500">Analytical insights and business reports</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { title: 'Sales Summary', desc: 'Daily, weekly and monthly sales analysis', icon: TrendingUp },
                    { title: 'Inventory Valuation', desc: 'Current stock value at PP and TP', icon: Package },
                    { title: 'Retailer Aging', desc: 'Outstanding payments and credit analysis', icon: Clock },
                    { title: 'Booker Performance', desc: 'Orders and revenue by order booker', icon: Users },
                    { title: 'Product Velocity', desc: 'Fast and slow moving items', icon: BarChart3 },
                  ].map((report, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                      <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600 w-fit mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <report.icon size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{report.title}</h3>
                      <p className="text-sm text-slate-500 mb-4">{report.desc}</p>
                      <button className="text-indigo-600 text-sm font-bold flex items-center gap-1 hover:underline">
                        Generate Report <ChevronRight size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div 
                key="orders"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Order Tracking</h2>
                    <p className="text-slate-500">Monitor sales orders and delivery status</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsOrderBookerModalOpen(true)}
                      className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                      <Users size={18} />
                      <span>Order Bookers</span>
                    </button>
                    <button 
                      onClick={() => setIsNewOrderModalOpen(true)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100 flex items-center gap-2"
                    >
                      <Plus size={18} />
                      <span>New Order</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Order ID</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Retailer</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Order Booker</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map(order => (
                        <tr 
                          key={order.id} 
                          onClick={() => setSelectedOrder(order)}
                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <span className="text-sm font-mono text-slate-500">#ORD-{order.id.toString().padStart(4, '0')}</span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-slate-900">{order.shop_name}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-600">{order.order_booker_name}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-600">{new Date(order.order_date).toLocaleDateString()}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-slate-900">{formatPKR(order.total_amount)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full",
                              order.status === 'delivered' ? "bg-emerald-50 text-emerald-600" : 
                              order.status === 'pending' ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                            )}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingOrder(order);
                                setIsNewOrderModalOpen(true);
                              }}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Edit size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'deliveries' && (
              <motion.div 
                key="deliveries"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Delivery Transactions</h2>
                    <p className="text-slate-500">Manage and track product deliveries against orders</p>
                  </div>
                  <button 
                    onClick={() => setIsDeliveryModalOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100 flex items-center gap-2"
                  >
                    <Plus size={18} />
                    <span>New Delivery</span>
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Delivery ID</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Order Ref</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Retailer</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Salesman</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {deliveries.map(delivery => (
                        <tr key={delivery.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4">
                            <span className="font-mono font-bold text-indigo-600">#DEL-{delivery.id.toString().padStart(4, '0')}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-slate-600">
                              #ORD-{(delivery.order_ref || delivery.order_id || 0).toString().padStart(4, '0')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-slate-900">{delivery.shop_name}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-600">{delivery.salesman_name}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-600">{new Date(delivery.delivery_date).toLocaleDateString()}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm font-bold text-slate-900">{formatPKR(delivery.total_amount)}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-2">
                              <button 
                                onClick={() => setSelectedDelivery(delivery)}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              >
                                <FileText size={18} />
                              </button>
                              <button 
                                onClick={() => {
                                  setEditingDelivery(delivery);
                                  setIsDeliveryModalOpen(true);
                                }}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Edit size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {deliveries.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center">
                            <Truck size={48} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-500 font-medium">No delivery transactions found</p>
                            <button 
                              onClick={() => setIsDeliveryModalOpen(true)}
                              className="mt-4 text-indigo-600 font-bold hover:underline"
                            >
                              Create your first delivery
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'purchases' && (
              <motion.div 
                key="purchases"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Purchase Orders</h2>
                    <p className="text-slate-500">Inventory intake from MSK Company</p>
                  </div>
                  <button 
                    onClick={() => setIsPurchaseModalOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
                  >
                    <Plus size={18} />
                    <span>New Purchase</span>
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Supplier</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {purchases.map(purchase => (
                        <tr 
                          key={purchase.id} 
                          className="hover:bg-slate-50 transition-colors cursor-pointer group"
                        >
                          <td onClick={() => setSelectedPurchase(purchase)} className="px-6 py-4 text-sm font-mono text-slate-500">#PUR-{purchase.id.toString().padStart(4, '0')}</td>
                          <td onClick={() => setSelectedPurchase(purchase)} className="px-6 py-4 text-sm font-bold text-slate-900">{purchase.supplier_name}</td>
                          <td onClick={() => setSelectedPurchase(purchase)} className="px-6 py-4 text-sm text-slate-600">{new Date(purchase.purchase_date).toLocaleDateString()}</td>
                          <td onClick={() => setSelectedPurchase(purchase)} className="px-6 py-4 text-sm font-bold text-slate-900">{formatPKR(purchase.total_amount)}</td>
                          <td onClick={() => setSelectedPurchase(purchase)} className="px-6 py-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
                              {purchase.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPurchase(purchase);
                                setIsPurchaseModalOpen(true);
                              }}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Edit size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'load_plans' && (
              <motion.div 
                key="load_plans"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Daily Load Plans</h2>
                    <p className="text-slate-500">Manage daily dispatch and logistics</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsDriverModalOpen(true)}
                      className="bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
                    >
                      <Users size={18} />
                      <span>Drivers Master</span>
                    </button>
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                      <Plus size={18} />
                      <span>Generate Plan</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {loadPlans.map(plan => (
                    <div key={plan.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <div className="bg-indigo-50 p-3 rounded-xl">
                            <Truck className="text-indigo-600" size={24} />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900">#LP-{plan.id.toString().padStart(4, '0')}</h3>
                            <p className="text-xs text-slate-500">{new Date(plan.plan_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full",
                          plan.status === 'completed' ? "bg-emerald-50 text-emerald-600" : 
                          plan.status === 'dispatched' ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-600"
                        )}>
                          {plan.status}
                        </span>
                      </div>
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone size={14} />
                          <span>Vehicle: {plan.vehicle_id}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Users size={14} />
                          <span>Driver: {plan.driver_name}</span>
                        </div>
                      </div>
                      <button className="w-full py-2 text-sm font-bold text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-50 transition-colors">
                        View Dispatch List
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailsModal 
            order={selectedOrder} 
            onClose={() => setSelectedOrder(null)} 
            formatPKR={formatPKR}
          />
        )}
        {selectedDelivery && (
          <DeliveryDetailsModal 
            delivery={selectedDelivery} 
            onClose={() => setSelectedDelivery(null)} 
            formatPKR={formatPKR}
          />
        )}
        {selectedRetailer && (
          <LedgerModal 
            retailer={selectedRetailer} 
            onClose={() => setSelectedRetailer(null)} 
            formatPKR={formatPKR}
          />
        )}
        {selectedPurchase && (
          <PurchaseDetailsModal 
            purchase={selectedPurchase} 
            onClose={() => setSelectedPurchase(null)} 
            formatPKR={formatPKR}
          />
        )}
        {isProductMasterModalOpen && (
          <ProductMasterDataModal 
            products={products}
            materialGroups={materialGroups}
            onClose={() => setIsProductMasterModalOpen(false)} 
            onSuccess={() => {
              fetchProducts();
              fetchStats();
            }}
          />
        )}
        {isRegisterRetailerModalOpen && (
          <RegisterRetailerModal 
            onClose={() => setIsRegisterRetailerModalOpen(false)} 
            onSuccess={() => {
              fetchRetailers();
              fetchStats();
            }}
          />
        )}
        {isRegisterSupplierModalOpen && (
          <RegisterSupplierModal 
            onClose={() => setIsRegisterSupplierModalOpen(false)} 
            onSuccess={() => {
              fetchSuppliers();
            }}
          />
        )}
        {isPurchaseModalOpen && (
          <PurchaseModal 
            products={products}
            suppliers={suppliers}
            purchase={editingPurchase || undefined}
            onClose={() => {
              setIsPurchaseModalOpen(false);
              setEditingPurchase(null);
            }} 
            onSuccess={() => {
              fetchPurchases();
              fetchProducts();
              fetchStats();
              fetchValuation();
            }}
            formatPKR={formatPKR}
          />
        )}
        {isDeliveryModalOpen && (
          <DeliveryModal 
            onClose={() => {
              setIsDeliveryModalOpen(false);
              setEditingDelivery(null);
            }} 
            onSuccess={() => {
              fetchDeliveries();
              fetchOrders();
              fetchStats();
            }}
            salesmen={salesmen}
            orders={orders}
            delivery={editingDelivery || undefined}
            formatPKR={formatPKR}
          />
        )}
        {isMaterialGroupModalOpen && (
          <MaterialGroupModal 
            materialGroups={materialGroups}
            onClose={() => setIsMaterialGroupModalOpen(false)} 
            onSuccess={() => {
              fetchMaterialGroups();
              fetchProducts();
            }}
          />
        )}
        {isDriverModalOpen && (
          <DriverModal 
            drivers={drivers}
            onClose={() => setIsDriverModalOpen(false)} 
            onSuccess={() => {
              fetchDrivers();
              fetchLoadPlans();
            }}
          />
        )}
        {isOrderBookerModalOpen && (
          <OrderBookerModal 
            orderBookers={orderBookers}
            onClose={() => setIsOrderBookerModalOpen(false)} 
            onSuccess={() => {
              fetchOrderBookers();
              fetchOrders();
            }}
          />
        )}
        {isSalesmanModalOpen && (
          <SalesmanModal 
            salesmen={salesmen}
            onClose={() => setIsSalesmanModalOpen(false)} 
            onSuccess={() => {
              fetchSalesmen();
            }}
          />
        )}
        {isNewOrderModalOpen && (
          <NewOrderModal 
            retailers={retailers}
            orderBookers={orderBookers}
            products={products}
            order={editingOrder || undefined}
            onClose={() => {
              setIsNewOrderModalOpen(false);
              setEditingOrder(null);
            }} 
            onSuccess={() => {
              fetchOrders();
              fetchProducts();
              fetchStats();
            }}
            formatPKR={formatPKR}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
