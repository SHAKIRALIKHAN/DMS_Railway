import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { Shop, Order, Purchase, LedgerEntry, OrderItem, Delivery, DeliveryItem } from '../../types';

export const LedgerModal = ({ 
  shop, 
  onClose, 
  formatPKR 
}: { 
  shop: Shop, 
  onClose: () => void, 
  formatPKR: (amount: number) => string 
}) => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const res = await fetch(`/api/ledger/${shop.id}`);
        const data = await res.json();
        setEntries(data);
      } catch (err) {
        console.error("Failed to fetch ledger", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLedger();
  }, [shop.id]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-white w-full h-full rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Shop Ledger</h3>
            <p className="text-sm text-slate-500">{shop.shop_name} • Financial History</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0" title="Close (F3)">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
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
            Close (F3)
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const OrderDetailsModal = ({ 
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-white w-full h-full rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Order Details</h3>
            <p className="text-sm text-slate-500">#ORD-{order.id.toString().padStart(4, '0')} • {order.shop_name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0" title="Close (F3)">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Shop</p>
              <p className="text-sm font-bold text-slate-900">{order.shop_name}</p>
              <p className="text-xs text-slate-500">Booker: {order.order_booker_name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full inline-block",
                order.status === 'delivered' ? "bg-emerald-50 text-emerald-600" : 
                order.status === 'pending' ? "bg-amber-50 text-amber-600" : 
                order.status === 'partially_delivered' ? "bg-blue-50 text-blue-600" :
                "bg-rose-50 text-rose-600"
              )}>
                {order.status.replace('_', ' ')}
              </span>
              <p className="text-xs text-slate-500 mt-1">{new Date(order.order_date).toLocaleString()}</p>
              <p className="text-xs font-bold text-indigo-600 mt-1 uppercase">Delivery: {order.estimated_delivery_date ? new Date(order.estimated_delivery_date).toLocaleDateString() : 'N/A'}</p>
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
            Close (F3)
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const PurchaseDetailsModal = ({ 
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-white w-full h-full rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Purchase Details</h3>
            <p className="text-sm text-slate-500">#PUR-{purchase.id.toString().padStart(4, '0')} • {purchase.supplier_name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0" title="Close (F3)">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
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
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm italic">Loading items...</td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm italic">No items found</td>
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
            Close (F3)
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const DeliveryDetailsModal = ({ 
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-white w-full h-full rounded-2xl shadow-2xl overflow-hidden flex flex-col"
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
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0" title="Close (F3)">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Shop</p>
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

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
