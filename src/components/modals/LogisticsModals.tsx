import React, { useState, useEffect, FormEvent } from 'react';
import { X, Save, Truck, Plus, CheckCircle2, ShoppingCart } from 'lucide-react';
import { motion } from 'motion/react';
import { Salesman, Order, OrderItem, Delivery, DeliveryItem } from '../../types';

export const DeliveryModal = ({ 
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
  const [deliveryItems, setDeliveryItems] = useState<{order_item_id: number, product_id: string, product_name: string, quantity: number, price: number, max_quantity: number, order_ref: number, sales_tax_pct?: number, sales_tax_amount?: number, additional_tax_pct?: number, additional_tax_amount?: number, discount_pct?: number, discount_amount?: number, extra_discount_pct?: number, extra_discount_amount?: number}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === 's') || e.key === 'F2') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'F3') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOrderId, selectedSalesmanId, deliveryDate, deliveryItems]);

  useEffect(() => {
    if (salesmen && salesmen.length > 0) {
      setInternalSalesmen(salesmen);
    } else {
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
          setDeliveryItems(data.map((item: any) => ({
            ...item,
            max_quantity: item.quantity + 9999
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
      order_ref: item.order_id,
      sales_tax_pct: item.sales_tax_pct || 0,
      sales_tax_amount: (item.price * remaining * (item.sales_tax_pct || 0)) / 100,
      additional_tax_pct: item.additional_tax_pct || 0,
      additional_tax_amount: (item.price * remaining * (item.additional_tax_pct || 0)) / 100,
      discount_pct: item.discount_pct || 0,
      discount_amount: (item.price * remaining * (item.discount_pct || 0)) / 100,
      extra_discount_pct: item.extra_discount_pct || 0,
      extra_discount_amount: (item.price * remaining * (item.extra_discount_pct || 0)) / 100
    }]);
  };

  const removeItem = (orderItemId: number) => {
    setDeliveryItems(deliveryItems.filter(di => di.order_item_id !== orderItemId));
  };

  const updateItemQuantity = (orderItemId: number, qty: number) => {
    setDeliveryItems(deliveryItems.map(di => {
      if (di.order_item_id === orderItemId) {
        const newQty = Math.min(qty, di.max_quantity);
        return { 
          ...di, 
          quantity: newQty,
          sales_tax_amount: (di.price * newQty * (di.sales_tax_pct || 0)) / 100,
          additional_tax_amount: (di.price * newQty * (di.additional_tax_pct || 0)) / 100,
          discount_amount: (di.price * newQty * (di.discount_pct || 0)) / 100,
          extra_discount_amount: (di.price * newQty * (di.extra_discount_pct || 0)) / 100
        };
      }
      return di;
    }));
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-white w-full h-full rounded-2xl shadow-2xl overflow-hidden flex flex-col"
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
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0" title="Close (F3)">
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
              </div>
            </div>

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
              </div>
              <div className="p-4 bg-white border-t border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-slate-500 uppercase">Total Amount</span>
                  <span className="text-xl font-bold text-indigo-600">
                    {formatPKR(deliveryItems.reduce((sum, item: any) => sum + (item.quantity * item.price) + (item.sales_tax_amount || 0) + (item.additional_tax_amount || 0) - (item.discount_amount || 0) - (item.extra_discount_amount || 0), 0))}
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
                      <span>Confirm Delivery (CTRL+S / F2)</span>
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

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
