import React, { useState, useEffect, useMemo, FormEvent } from 'react';
import { X, Save, Truck, Plus, CheckCircle2, ShoppingCart, ArrowRight, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Salesman, Order, OrderItem, Delivery, DeliveryItem } from '../../types';
import { cn } from '../../lib/utils';

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
  // UI State Object (as requested)
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [shopSearch, setShopSearch] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [selectedSalesmanId, setSelectedSalesmanId] = useState<number | null>(null);
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryItems, setDeliveryItems] = useState<any[]>([]);
  const [orderQuery, setOrderQuery] = useState('');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showShopDropdown, setShowShopDropdown] = useState(false);

  // 1. Header State: Searchable Retailers with pending orders
  const availableShops = useMemo(() => {
    const shopMap = new Map<number, {id: number, name: string}>();
    orders.forEach(o => {
      if (o.status === 'pending' || (delivery && o.shop_id === delivery.shop_id)) {
        shopMap.set(o.shop_id, { id: o.shop_id, name: o.shop_name });
      }
    });
    return Array.from(shopMap.values()).filter(s => 
      s.name.toLowerCase().includes(shopSearch.toLowerCase())
    );
  }, [orders, shopSearch, delivery]);

  // 2. Order List State: Orders for selected shop only
  const shopOrders = useMemo(() => {
    return orders.filter(o => 
      o.shop_id === selectedShopId && (o.status === 'pending' || selectedOrderIds.includes(o.id))
    );
  }, [selectedShopId, orders, selectedOrderIds]);

  // Initialization for Edit Mode
  useEffect(() => {
    if (delivery) {
      setSelectedShopId(delivery.shop_id || null);
      setShopSearch(delivery.shop_name || '');
      setSelectedSalesmanId(delivery.salesman_id || null);
      setDeliveryDate(new Date(delivery.delivery_date).toISOString().split('T')[0]);
      
      // Fetch items for this delivery to identify orders and initial quantities
      const fetchDeliveryContext = async () => {
        try {
          const res = await fetch(`/api/deliveries/${delivery.id}/items`);
          const items = await res.json();
          
          // Identify unique orders from delivery items
          const oids = Array.from(new Set(items.map((i: any) => i.order_ref))) as number[];
          setSelectedOrderIds(oids);
          
          // Initial delivery items state
          setDeliveryItems(items.map((i: any) => ({
            order_item_id: i.order_item_id,
            product_id: i.product_id,
            product_name: i.product_name,
            brand: i.brand,
            quantity: i.quantity,
            price: i.price,
            max_quantity: i.quantity + (i.remaining_on_order || 9999), // Approximate or fetch real max later
            order_ref: i.order_ref
          })));
        } catch (err) {
          console.error("Failed to load delivery context", err);
        }
      };
      fetchDeliveryContext();
    }
  }, [delivery]);

  // Zero-Conflict Policy: Clear logic when Shop changes
  const handleShopSelect = (shopId: number) => {
    setSelectedShopId(shopId);
    setSelectedOrderIds([]);
    setDeliveryItems([]);
    setShowShopDropdown(false);
    setShopSearch(availableShops.find(s => s.id === shopId)?.name || '');
  };

  useEffect(() => {
    if (selectedOrderIds.length > 0) {
      const fetchFlatItems = async () => {
        try {
          const allBatchItems: any[] = [];
          for (const oid of selectedOrderIds) {
            const url = `/api/orders/${oid}/pending-items${delivery ? `?excludeDeliveryId=${delivery.id}` : ''}`;
            const res = await fetch(url);
            const data = await res.json();
            allBatchItems.push(...data);
          }
          
          setDeliveryItems(prev => {
            return allBatchItems.map(item => {
              const existing = prev.find(p => p.order_item_id === item.id);
              const max = item.quantity - (item.delivered_quantity || 0);
              return {
                order_item_id: item.id,
                product_id: item.product_id,
                product_name: item.product_name,
                brand: item.brand,
                quantity: existing?.quantity || 0,
                price: item.price,
                max_quantity: max,
                order_ref: item.order_id
              };
            });
          });
        } catch (err) {
          console.error("Grid sync failed", err);
        }
      };
      fetchFlatItems();
    } else {
      setDeliveryItems([]);
    }
  }, [selectedOrderIds, delivery]);

  const toggleOrder = (oid: number) => {
    setSelectedOrderIds(prev => 
      prev.includes(oid) ? prev.filter(id => id !== oid) : [...prev, oid]
    );
  };

  const addOrderByNumber = (oidStr: string) => {
    const oid = parseInt(oidStr);
    if (isNaN(oid)) return;
    
    const targetOrder = orders.find(o => o.id === oid);
    if (!targetOrder) {
      setErrorStatus(`Order #ORD-${oid.toString().padStart(4, '0')} not found.`);
      return;
    }

    if (selectedShopId && targetOrder.shop_id !== selectedShopId) {
      setErrorStatus("Validation Error: This delivery already contains items for a different shop. Cannot merge items from multiple shops into one delivery.");
      return;
    }

    if (!selectedShopId) {
      handleShopSelect(targetOrder.shop_id);
    }

    if (!selectedOrderIds.includes(oid)) {
      setSelectedOrderIds(prev => [...prev, oid]);
      setErrorStatus(null);
      setOrderQuery('');
    } else {
      setErrorStatus("Order already added to this delivery.");
    }
  };

  const updateQty = (orderItemId: number, val: number) => {
    setDeliveryItems(prev => prev.map(item => {
      if (item.order_item_id === orderItemId) {
        return { ...item, quantity: Math.max(0, Math.min(val, item.max_quantity)) };
      }
      return item;
    }));
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const activeItems = deliveryItems.filter(i => i.quantity > 0);
    if (!selectedSalesmanId || activeItems.length === 0) return;
    
    setIsSubmitting(true);
    try {
      const url = delivery ? `/api/deliveries/${delivery.id}` : '/api/deliveries';
      const method = delivery ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_ids: selectedOrderIds,
          order_id: selectedOrderIds[0], // backward compatibility
          salesman_id: selectedSalesmanId,
          delivery_date: deliveryDate,
          items: activeItems
        })
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        alert(err.error || `Delivery ${delivery ? 'Update' : 'Creation'} Failed`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard Assist
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); handleSubmit(); }
      if (e.key === 'F3') { e.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedOrderIds, selectedSalesmanId, deliveryItems, deliveryDate]);

  const totalValue = deliveryItems.reduce((s, i) => s + (i.quantity * i.price), 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white w-full h-full overflow-hidden flex flex-col"
      >
        {/* Header: Shop Selection */}
        <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex-1 max-w-xl relative">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">1. Anchor Retailer (Filtered by Pending Status)</label>
            <div className="relative">
              <ShoppingCart className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Search shop name..."
                value={shopSearch}
                onFocus={() => setShowShopDropdown(true)}
                onChange={(e) => {
                  const val = e.target.value;
                  setShopSearch(val);
                  setShowShopDropdown(true);
                  if (selectedShopId) {
                    setSelectedShopId(null);
                    setSelectedOrderIds([]);
                    setDeliveryItems([]);
                  }
                }}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:border-indigo-600 focus:bg-white transition-all outline-none"
              />
              {showShopDropdown && availableShops.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 shadow-2xl rounded-2xl z-50 max-h-60 overflow-y-auto p-2">
                  {availableShops.map(s => (
                    <button 
                      key={s.id}
                      onClick={() => handleShopSelect(s.id)}
                      className="w-full text-left px-4 py-3 hover:bg-indigo-50 rounded-xl transition-colors text-sm font-medium"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
             <div className="text-right">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Quick Add Order</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="Order #"
                    value={orderQuery}
                    onChange={e => setOrderQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addOrderByNumber(orderQuery)}
                    className="w-24 bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl text-sm font-mono outline-none focus:border-indigo-600 transition-all"
                  />
                  <button 
                    onClick={() => addOrderByNumber(orderQuery)}
                    className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
                  >
                    <Plus size={18} />
                  </button>
                </div>
             </div>
             <div className="text-right">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Dispatch Date</label>
                <input 
                  type="date"
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                  className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-sm font-mono outline-none focus:border-indigo-600 transition-all"
                />
             </div>
             <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors">
               <X size={20} className="text-slate-400" />
             </button>
          </div>
        </div>
        
        {/* Error Banner */}
        {errorStatus && (
          <div className="px-10 py-3 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle size={18} className="text-rose-600" />
              <p className="text-sm font-bold text-rose-900">{errorStatus}</p>
            </div>
            <button onClick={() => setErrorStatus(null)} className="text-rose-400 hover:text-rose-600">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Middle: Order IDs */}
        <div className="px-10 py-6 bg-slate-50/50 border-b border-slate-100">
           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">2. Multi-Order Consolidation (Selected Shop Only)</label>
           <div className="flex flex-wrap gap-3">
             {shopOrders.length > 0 ? shopOrders.map(o => (
               <button
                 key={o.id}
                 onClick={() => toggleOrder(o.id)}
                 className={cn(
                   "px-5 py-2 rounded-xl text-xs font-bold transition-all border-2",
                   selectedOrderIds.includes(o.id) 
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100" 
                    : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                 )}
               >
                 #ORD-{o.id.toString().padStart(4, '0')} — {formatPKR(o.total_amount)}
               </button>
             )) : (
               <p className="text-sm text-slate-400 italic">Please select a retailer above to view pending orders.</p>
             )}
           </div>
        </div>

        {/* Unified Grid */}
        <div className="flex-1 overflow-y-auto px-10 py-8">
           <div className="flex justify-between items-end mb-6">
              <div>
                <h4 className="text-sm font-bold text-slate-900">3. Flattened Product Grid</h4>
                <p className="text-xs text-slate-500 mt-1">Cross-order item allocation logic</p>
              </div>
              <div className="w-64">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Assign Deliverer</label>
                <select
                  value={selectedSalesmanId || ''}
                  onChange={e => setSelectedSalesmanId(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600 transition-all appearance-none"
                >
                  <option value="">Select Salesman</option>
                  {salesmen.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
           </div>

           {deliveryItems.length > 0 ? (
             <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                   <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order #</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product Description</th>
                        <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available</th>
                        <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest w-40">Delivery Qty</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {deliveryItems.map(item => (
                        <tr key={item.order_item_id} className="hover:bg-indigo-50/20 transition-colors">
                           <td className="px-6 py-5">
                              <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold font-mono">
                                #ORD-{item.order_ref.toString().padStart(4, '0')}
                              </span>
                           </td>
                           <td className="px-6 py-5">
                              <p className="text-sm font-bold text-slate-900">{item.product_name}</p>
                              <p className="text-[10px] text-slate-500 font-medium">{item.brand}</p>
                           </td>
                           <td className="px-6 py-5 text-right">
                              <span className="text-sm font-bold text-slate-600">{item.max_quantity}</span>
                           </td>
                           <td className="px-6 py-5 text-right">
                              <input 
                                type="number"
                                min="0"
                                max={item.max_quantity}
                                value={item.quantity}
                                onChange={(e) => updateQty(item.order_item_id, Number(e.target.value))}
                                className="w-24 px-3 py-2 bg-white border border-slate-100 rounded-xl text-sm text-right focus:border-indigo-600 outline-none transition-all font-mono font-bold"
                              />
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
           ) : (
             <div className="h-64 flex flex-col items-center justify-center text-center bg-slate-50 border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                <Truck size={40} className="text-slate-300 mb-4" />
                <p className="text-sm text-slate-400 font-medium">No items available for selected criteria.</p>
             </div>
           )}
        </div>

        {/* Footer */}
        <div className="px-10 py-8 border-t border-slate-100 flex justify-between items-center bg-white">
           <div className="flex gap-12">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Consolidated Value</p>
                <p className="text-3xl font-bold text-indigo-600 tracking-tight font-mono">{formatPKR(totalValue)}</p>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 size={20} className="text-emerald-500" />
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Validation</p>
                    <p className="text-xs font-bold text-slate-900">Zero-Conflict Rule Active</p>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-4">
              <button 
                onClick={onClose}
                className="px-8 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all"
              >
                Discard (F3)
              </button>
              <button 
                disabled={isSubmitting || deliveryItems.filter(i => i.quantity > 0).length === 0 || !selectedSalesmanId}
                onClick={() => handleSubmit()}
                className="px-12 py-4 bg-indigo-600 text-white rounded-[1.25rem] font-bold shadow-2xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center gap-2 group disabled:opacity-50 disabled:translate-y-0"
              >
                {isSubmitting ? 'Finalizing...' : (
                  <>
                    <Save size={18} />
                    <span>Confirm Dispatch (F2)</span>
                    <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
           </div>
        </div>
      </motion.div>
    </div>
  );
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
