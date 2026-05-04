import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Search, ChevronRight, AlertCircle, ShoppingCart, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Shop, Delivery, DeliveryItem } from '../../types';
import { cn } from '../../lib/utils';

interface ReturnModalProps {
  onClose: () => void;
  shops: Shop[];
}

export const ReturnModal: React.FC<ReturnModalProps> = ({ onClose, shops }) => {
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [shopSearch, setShopSearch] = useState('');
  const [showShopDropdown, setShowShopDropdown] = useState(false);
  
  const [completedDeliveries, setCompletedDeliveries] = useState<Delivery[]>([]);
  const [selectedDeliveryIds, setSelectedDeliveryIds] = useState<number[]>([]);
  const [showDeliveryDropdown, setShowDeliveryDropdown] = useState(false);
  
  const [returnItems, setReturnItems] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Fetch completed deliveries when shop changes
  useEffect(() => {
    if (selectedShopId) {
      fetch(`/api/shops/${selectedShopId}/completed-deliveries`)
        .then(res => res.json())
        .then(data => setCompletedDeliveries(data))
        .catch(err => console.error(err));
    } else {
      setCompletedDeliveries([]);
      setSelectedDeliveryIds([]);
      setReturnItems([]);
    }
  }, [selectedShopId]);

  // Fetch items when selected deliveries change
  useEffect(() => {
    if (selectedDeliveryIds.length > 0) {
      const fetchAllItems = async () => {
        try {
          const allItems: any[] = [];
          for (const deliveryId of selectedDeliveryIds) {
            const res = await fetch(`/api/deliveries/${deliveryId}/items`);
            if (res.ok) {
              const items: DeliveryItem[] = await res.json();
              items.forEach(item => {
                allItems.push({
                  ...item,
                  delivery_id: deliveryId,
                  return_qty: 0,
                  uom: item.product_name?.includes('Box') ? 'BOX' : 'EACH' // Simple heuristic
                });
              });
            }
          }
          setReturnItems(allItems);
        } catch (err) {
          console.error("Error fetching delivery items:", err);
        }
      };
      fetchAllItems();
    } else {
      setReturnItems([]);
    }
  }, [selectedDeliveryIds]);

  const handleShopSelect = (shop: Shop) => {
    setSelectedShopId(shop.id);
    setShopSearch(shop.shop_name);
    setShowShopDropdown(false);
    setSelectedDeliveryIds([]);
  };

  const toggleDeliverySelection = (id: number) => {
    setSelectedDeliveryIds(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleReturnQtyChange = (idx: number, val: string) => {
    const qty = parseInt(val) || 0;
    const item = returnItems[idx];
    
    if (qty > item.quantity) {
      setErrorStatus(`Return quantity for ${item.product_name} cannot exceed delivered quantity (${item.quantity}).`);
      return;
    }
    
    setErrorStatus(null);
    const newItems = [...returnItems];
    newItems[idx].return_qty = qty;
    setReturnItems(newItems);
  };

  const handleSubmit = async () => {
    const itemsToReturn = returnItems.filter(item => item.return_qty > 0);
    if (itemsToReturn.length === 0) {
      setErrorStatus("Please enter return quantity for at least one item.");
      return;
    }

    // Double check validations
    for (const item of itemsToReturn) {
      if (item.return_qty > item.quantity) {
        setErrorStatus(`Invalid return quantity for ${item.product_name}.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_id: selectedShopId,
          items: itemsToReturn.map(item => ({
            delivery_id: item.delivery_id,
            product_id: item.product_id,
            quantity: item.return_qty,
            unit_price: item.price
          }))
        })
      });

      if (res.ok) {
        onClose();
      } else {
        const data = await res.json();
        setErrorStatus(data.error || "Failed to process return.");
      }
    } catch (err) {
      setErrorStatus("Network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full h-full flex flex-col shadow-2xl relative"
      >
        {/* Header */}
        <div className="px-10 py-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-rose-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-rose-200">
              <RotateCcw size={32} />
            </div>
            <div>
              <div className="flex items-center gap-4">
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Delivery Return</h2>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100 italic">Trans RT01</span>
                </div>
              </div>
              <p className="text-slate-400 font-medium mt-1">Process customer returns and restock inventory</p>
            </div>
          </div>
          <motion.button 
            whileHover={{ rotate: 90, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm"
          >
            <X size={28} />
          </motion.button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto bg-slate-50/30">
          <div className="max-w-[1400px] mx-auto p-12">
            
            {errorStatus && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700"
              >
                <AlertCircle size={20} />
                <span className="text-sm font-bold">{errorStatus}</span>
              </motion.div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
              {/* Left Column: Selection */}
              <div className="xl:col-span-4 space-y-8">
                
                {/* Shop SELECT */}
                <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1.5 h-6 bg-rose-500 rounded-full" />
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">1. Select Shop</h3>
                  </div>

                  <div className="relative">
                    <div className="relative group">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-rose-500 transition-colors" size={20} />
                      <input 
                        type="text"
                        placeholder="Search retailer..."
                        value={shopSearch}
                        onFocus={() => setShowShopDropdown(true)}
                        onChange={(e) => {
                          setShopSearch(e.target.value);
                          setShowShopDropdown(true);
                        }}
                        className="w-full pl-14 pr-4 py-5 bg-slate-50 border border-slate-200 rounded-3xl text-lg font-black text-slate-900 focus:bg-white focus:border-rose-500 focus:ring-8 focus:ring-rose-50 transition-all outline-none"
                      />
                    </div>

                    <AnimatePresence>
                      {showShopDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute left-0 right-0 top-full mt-3 bg-white border border-slate-100 rounded-[2rem] shadow-2xl z-50 overflow-hidden ring-1 ring-slate-200"
                        >
                          <div className="max-h-60 overflow-y-auto py-2">
                            {shops.filter(s => s.shop_name.toLowerCase().includes(shopSearch.toLowerCase())).map(shop => (
                              <button
                                key={shop.id}
                                onClick={() => handleShopSelect(shop)}
                                className="w-full px-6 py-4 text-left hover:bg-rose-50/50 flex items-center justify-between group transition-colors"
                              >
                                <div>
                                  <span className="font-black text-slate-900 block group-hover:text-rose-600 transition-colors">{shop.shop_name}</span>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{shop.location}</span>
                                </div>
                                <ChevronRight size={18} className="text-slate-200 group-hover:text-rose-400" />
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </section>

                {/* Delivery MULTI-SELECT */}
                {selectedShopId && (
                  <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-rose-500 rounded-full" />
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">2. Deliveries</h3>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {completedDeliveries.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 italic">No completed deliveries found.</div>
                      ) : (
                        completedDeliveries.map(d => (
                          <button
                            key={d.id}
                            onClick={() => toggleDeliverySelection(d.id)}
                            className={cn(
                              "w-full p-5 rounded-2xl border text-left transition-all flex items-center gap-4",
                              selectedDeliveryIds.includes(d.id)
                                ? "bg-rose-600 border-rose-600 text-white shadow-xl shadow-rose-200 scale-[1.02]"
                                : "bg-slate-50 border-slate-100 text-slate-600 hover:border-rose-300"
                            )}
                          >
                            <Package size={24} className={selectedDeliveryIds.includes(d.id) ? "text-white" : "text-slate-300"} />
                            <div>
                              <span className="font-black block leading-none">#DEL-{d.id.toString().padStart(4, '0')}</span>
                              <span className="text-[10px] font-bold uppercase tracking-widest mt-1.5 opacity-60">
                                {new Date(d.delivery_date).toLocaleDateString()} • Rs.{d.total_amount.toLocaleString()}
                              </span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </section>
                )}
              </div>

              {/* Right Column: Grid */}
              <div className="xl:col-span-8 flex flex-col h-full">
                <section className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col flex-1">
                  <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Items to Return</h3>
                    <div className="px-4 py-2 bg-white rounded-full border border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       {returnItems.length} Products Loaded
                    </div>
                  </div>

                  <div className="flex-1 overflow-x-auto min-h-[400px]">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50/30">
                          <th className="px-10 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Product Selection</th>
                          <th className="px-6 py-6 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">Original Qty</th>
                          <th className="px-6 py-6 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">UOM</th>
                          <th className="px-10 py-6 text-center text-[11px] font-black text-rose-500 uppercase tracking-widest">Return Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {returnItems.map((item, idx) => (
                          <tr key={`${item.delivery_id}-${item.product_id}`} className="group hover:bg-rose-50/30 transition-colors">
                            <td className="px-10 py-6">
                              <span className="text-base font-black text-slate-900 group-hover:text-rose-600 transition-colors block leading-tight">{item.product_name}</span>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg border border-slate-200/50 uppercase tracking-widest italic">{item.product_id}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Batch: #DEL-{item.delivery_id}</span>
                              </div>
                            </td>
                            <td className="px-6 py-6 text-center">
                              <span className="text-lg font-black text-slate-900">{item.quantity}</span>
                            </td>
                            <td className="px-6 py-6 text-center">
                              <span className="text-[10px] font-black bg-slate-200/50 text-slate-500 px-3 py-1.5 rounded-full uppercase italic tracking-widest border border-slate-200/50">
                                {item.uom}
                              </span>
                            </td>
                            <td className="px-10 py-6">
                              <div className="flex items-center justify-center">
                                <input 
                                  type="number"
                                  min="0"
                                  max={item.quantity}
                                  value={item.return_qty === 0 ? '' : item.return_qty}
                                  placeholder="0"
                                  onChange={(e) => handleReturnQtyChange(idx, e.target.value)}
                                  className={cn(
                                    "w-32 py-4 bg-slate-50 rounded-2xl text-center text-xl font-black outline-none transition-all border-2",
                                    item.return_qty > 0 ? "border-rose-400 bg-white text-rose-600 ring-8 ring-rose-50 shadow-lg" : "border-transparent text-slate-400 focus:bg-white focus:border-rose-400"
                                  )}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                        {returnItems.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-40 text-center opacity-20 flex flex-col items-center">
                              <RotateCcw size={64} className="mb-4" />
                              <h4 className="text-2xl font-black uppercase tracking-widest">Select Deliveries</h4>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-12 py-8 bg-white border-t border-slate-100 flex items-center justify-between shadow-[0_-20px_40px_rgba(0,0,0,0.02)] shrink-0">
          <button 
            onClick={() => {
              setSelectedShopId(null);
              setShopSearch('');
              setSelectedDeliveryIds([]);
              setReturnItems([]);
              setErrorStatus(null);
            }}
            className="px-10 py-5 text-base font-black text-slate-400 hover:text-rose-500 transition-all uppercase tracking-widest"
          >
            Reset
          </button>
          
          <div className="flex gap-4">
             <button 
              onClick={onClose}
              className="px-10 py-5 text-base font-black text-slate-400 hover:text-slate-900 transition-all uppercase tracking-widest"
            >
              Cancel
            </button>
            <button 
              disabled={isSubmitting || returnItems.filter(i => i.return_qty > 0).length === 0}
              onClick={handleSubmit}
              className={cn(
                "px-14 py-5 bg-rose-600 text-white rounded-[2rem] text-lg font-black uppercase tracking-widest flex items-center gap-4 transition-all shadow-2xl shadow-rose-200 active:scale-95 disabled:grayscale disabled:opacity-30",
                !isSubmitting && "hover:bg-rose-700 hover:translate-y-[-4px]"
              )}
            >
              {isSubmitting ? (
                 <>
                   <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                   Updating Stock...
                 </>
              ) : (
                <>
                  <Save size={24} />
                  Save Return
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
