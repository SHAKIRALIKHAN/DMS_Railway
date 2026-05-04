import React, { useState, useEffect } from 'react';
import { X, Save, FileText, Printer, CheckCircle2, ChevronRight, AlertCircle, ShoppingCart, Search, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Shop, Delivery, InvoiceItem, DeliveryItem } from '../../types';
import { cn } from '../../lib/utils';

interface InvoiceTransactionModalProps {
  onClose: () => void;
  shops: Shop[];
  onSuccess: () => void;
  formatPKR: (amt: number) => string;
}

export const InvoiceTransactionModal = ({ onClose, shops, onSuccess, formatPKR }: InvoiceTransactionModalProps) => {
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [shopSearch, setShopSearch] = useState('');
  const [showShopDropdown, setShowShopDropdown] = useState(false);
  const [pendingDeliveries, setPendingDeliveries] = useState<Delivery[]>([]);
  const [selectedDeliveryIds, setSelectedDeliveryIds] = useState<number[]>([]);
  const [deliverySlots, setDeliverySlots] = useState<string[]>(['', '', '', '', '']);
  const [activeSlotIdx, setActiveSlotIdx] = useState<number | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const selectedShop = shops.find(s => s.id === selectedShopId);

  // Fetch pending deliveries for a shop
  useEffect(() => {
    if (selectedShopId) {
      setErrorStatus(null);
      fetch(`/api/shops/${selectedShopId}/pending-deliveries`)
        .then(res => {
          if (!res.ok) throw new Error(`Server returned ${res.status}`);
          return res.json();
        })
        .then(data => {
          setPendingDeliveries(data);
          setSelectedDeliveryIds([]);
          setInvoiceItems([]);
        })
        .catch(err => {
          console.error(err);
          setErrorStatus(err.message);
        });
    } else {
      setPendingDeliveries([]);
      setSelectedDeliveryIds([]);
      setInvoiceItems([]);
    }
  }, [selectedShopId]);

  // Fetch items when deliveries are selected
  useEffect(() => {
    if (selectedDeliveryIds.length > 0) {
      const fetchItems = async () => {
        try {
          const allItems: any[] = [];
          for (const dId of selectedDeliveryIds) {
            const res = await fetch(`/api/deliveries/${dId}/items`);
            const items = await res.json();
            allItems.push(...items.map((it: any) => ({
              ...it,
              delivery_id: dId,
              trade_discount_pct: it.discount_pct || 0,
              tax_pct: it.sales_tax_pct || 0,
              special_discount_pct: it.extra_discount_pct || 0,
              unit_price: it.price,
              net_amount: calculateLineNet(it.quantity, it.price, (it.discount_pct || 0) + (it.extra_discount_pct || 0), it.sales_tax_pct || 0)
            })));
          }
          setInvoiceItems(allItems);
        } catch (err) {
          console.error(err);
        }
      };
      fetchItems();
    } else {
      setInvoiceItems([]);
    }
  }, [selectedDeliveryIds]);

  const calculateLineNet = (qty: number, price: number, discTotalPct: number, taxPct: number) => {
    const gross = qty * price;
    const afterDisc = gross - (gross * discTotalPct / 100);
    const net = afterDisc + (afterDisc * taxPct / 100);
    return Math.round(net * 100) / 100;
  };

  const handleShopSelect = (shop: Shop) => {
    setSelectedShopId(shop.id);
    setShopSearch(shop.shop_name);
    setShowShopDropdown(false);
    setDeliverySlots(['', '', '', '', '']);
  };

  const syncSlotsWithIds = (ids: number[]) => {
    const newSlots = [...deliverySlots];
    ids.forEach((id, i) => {
      if (i < 5) newSlots[i] = id.toString();
    });
    setDeliverySlots(newSlots);
  };

  const handleSlotChange = (idx: number, value: string) => {
    const newSlots = [...deliverySlots];
    newSlots[idx] = value;
    setDeliverySlots(newSlots);

    // If it's a direct ID match from pending
    const match = pendingDeliveries.find(d => d.id.toString() === value || `#DEL-${d.id.toString().padStart(4, '0')}` === value);
    if (match) {
      updateSelectedIdsFromSlots(newSlots);
    }
  };

  const updateSelectedIdsFromSlots = (slotsArr: string[]) => {
    const ids: number[] = [];
    slotsArr.forEach(s => {
      const clean = s.replace('#DEL-', '').trim();
      const id = parseInt(clean);
      if (!isNaN(id) && pendingDeliveries.some(d => d.id === id)) {
        if (!ids.includes(id)) ids.push(id);
      }
    });
    setSelectedDeliveryIds(ids);
  };

  const selectFromSearch = (idx: number, delivery: Delivery) => {
    const newSlots = [...deliverySlots];
    newSlots[idx] = `#DEL-${delivery.id.toString().padStart(4, '0')}`;
    setDeliverySlots(newSlots);
    updateSelectedIdsFromSlots(newSlots);
    setActiveSlotIdx(null);
  };

  const clearSlot = (idx: number) => {
    const newSlots = [...deliverySlots];
    newSlots[idx] = '';
    setDeliverySlots(newSlots);
    updateSelectedIdsFromSlots(newSlots);
  };

  const toggleDelivery = (id: number) => {
    setSelectedDeliveryIds(prev => {
      const next = prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id];
      // Sync slots back
      const newSlots = ['', '', '', '', ''];
      next.forEach((nid, i) => { if(i < 5) newSlots[i] = `#DEL-${nid.toString().padStart(4, '0')}`; });
      setDeliverySlots(newSlots);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!selectedShopId || invoiceItems.length === 0) {
      setErrorStatus("Please select a shop and at least one delivery.");
      return;
    }

    setIsSubmitting(true);
    setErrorStatus(null);

    const payload = {
      shop_id: selectedShopId,
      invoice_date: invoiceDate,
      delivery_ids: selectedDeliveryIds,
      items: invoiceItems.map(it => ({
        delivery_id: it.delivery_id,
        delivery_item_id: it.id,
        product_id: it.product_id,
        quantity: it.quantity,
        unit_price: it.unit_price,
        trade_discount_pct: it.trade_discount_pct,
        tax_pct: it.tax_pct,
        special_discount_pct: it.special_discount_pct,
        net_amount: it.net_amount
      }))
    };

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        setErrorStatus(data.error || "Failed to create invoice");
      }
    } catch (err) {
      setErrorStatus("Network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateItemField = (idx: number, field: string, val: number) => {
    const updated = [...invoiceItems];
    updated[idx][field] = val;
    
    const item = updated[idx];
    item.net_amount = calculateLineNet(
      item.quantity, 
      item.unit_price, 
      (item.trade_discount_pct || 0) + (item.special_discount_pct || 0), 
      item.tax_pct || 0
    );
    
    setInvoiceItems(updated);
  };

  const totals = invoiceItems.reduce((acc, it) => {
    const gross = it.quantity * it.unit_price;
    const disc = gross * ((it.trade_discount_pct || 0) + (it.special_discount_pct || 0)) / 100;
    const afterDisc = gross - disc;
    const tax = afterDisc * (it.tax_pct || 0) / 100;
    
    acc.gross += gross;
    acc.discount += disc;
    acc.tax += tax;
    acc.net += it.net_amount;
    return acc;
  }, { gross: 0, discount: 0, tax: 0, net: 0 });

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
            <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
              <FileText size={32} />
            </div>
            <div>
              <div className="flex items-center gap-4">
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Invoice Management</h2>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 italic">Transaction INV01</span>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">Live Posting</span>
                </div>
              </div>
              <p className="text-slate-400 font-medium mt-1">Select shop and deliveries to generate professional billing records</p>
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
          <div className="max-w-[1600px] mx-auto p-12">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
              
              {/* Left Column: Configuration (4 cols) */}
              <div className="xl:col-span-4 space-y-10">
                
                {/* Shop Search section ... */}
                <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Step 1: Select Retailer</h3>
                  </div>

                  <div className="relative">
                    <div className="relative group">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                      <input 
                        type="text"
                        placeholder="Type shop name or location..."
                        value={shopSearch}
                        onFocus={() => setShowShopDropdown(true)}
                        onChange={(e) => {
                          setShopSearch(e.target.value);
                          setShowShopDropdown(true);
                        }}
                        className="w-full pl-14 pr-4 py-5 bg-slate-50 border border-slate-200 rounded-3xl text-lg font-black text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-8 focus:ring-indigo-50 transition-all outline-none"
                      />
                    </div>

                    <AnimatePresence>
                      {showShopDropdown && shopSearch.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute left-0 right-0 top-full mt-3 bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl z-50 overflow-hidden ring-1 ring-slate-200"
                        >
                          <div className="max-h-80 overflow-y-auto py-3">
                            {shops
                              .filter(s => s.shop_name.toLowerCase().includes(shopSearch.toLowerCase()) || s.location.toLowerCase().includes(shopSearch.toLowerCase()))
                              .map(shop => (
                                <button
                                  key={shop.id}
                                  onClick={() => handleShopSelect(shop)}
                                  className="w-full px-8 py-5 text-left hover:bg-indigo-50/50 flex items-center justify-between group transition-colors"
                                >
                                  <div>
                                    <span className="text-base font-black text-slate-900 block group-hover:text-indigo-600 tracking-tight transition-colors">{shop.shop_name}</span>
                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 block">{shop.location}</span>
                                  </div>
                                  <ChevronRight size={20} className="text-slate-200 group-hover:text-indigo-400 transition-colors" />
                                </button>
                              ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Effective Billing Date</label>
                    <input 
                      type="date"
                      value={invoiceDate}
                      onChange={e => setInvoiceDate(e.target.value)}
                      className="w-full px-8 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-900 focus:bg-white transition-all outline-none"
                    />
                  </div>
                </section>

                {/* Vertical Delivery Slots */}
                {selectedShopId && (
                  <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Step 2: Input Deliveries</h3>
                      </div>
                      <div className="px-3 py-1 bg-indigo-50 rounded-full text-[10px] font-black text-indigo-600 border border-indigo-100">
                        {pendingDeliveries.length} AVAILABLE
                      </div>
                    </div>

                    <div className="space-y-4">
                      {[0, 1, 2, 3, 4].map(idx => (
                        <div key={idx} className="relative group/slot">
                          <div className="relative">
                            <input 
                              type="text"
                              placeholder={`Delivery Slot ${idx + 1}...`}
                              value={deliverySlots[idx]}
                              onChange={(e) => handleSlotChange(idx, e.target.value)}
                              onFocus={() => setActiveSlotIdx(idx)}
                              onBlur={() => setTimeout(() => setActiveSlotIdx(null), 200)}
                              className={cn(
                                "w-full pl-6 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-black transition-all outline-none",
                                deliverySlots[idx] 
                                  ? "border-indigo-400 text-indigo-700 bg-white ring-8 ring-indigo-50" 
                                  : "text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-400 focus:bg-white"
                              )}
                            />
                            {deliverySlots[idx] && (
                              <button 
                                onClick={() => clearSlot(idx)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-rose-500 transition-colors"
                              >
                                <X size={20} />
                              </button>
                            )}
                          </div>

                          <AnimatePresence>
                            {activeSlotIdx === idx && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-3xl shadow-2xl z-50 max-h-60 overflow-y-auto p-2 ring-1 ring-slate-200"
                              >
                                {pendingDeliveries
                                  .filter(d => {
                                    const q = deliverySlots[idx].toLowerCase().replace('#del-', '');
                                    return d.id.toString().includes(q) || d.delivery_date.includes(q);
                                  })
                                  .map(d => (
                                    <button
                                      key={d.id}
                                      onClick={() => selectFromSearch(idx, d)}
                                      disabled={selectedDeliveryIds.includes(d.id)}
                                      className={cn(
                                        "w-full px-6 py-4 text-left hover:bg-slate-50 flex items-center justify-between group/item rounded-2xl transition-colors mb-1 last:mb-0",
                                        selectedDeliveryIds.includes(d.id) && "opacity-40 cursor-not-allowed"
                                      )}
                                    >
                                      <div>
                                        <span className="text-sm font-black text-slate-900 block group-hover/item:text-indigo-600 transition-colors italic">#DEL-{d.id.toString().padStart(4, '0')}</span>
                                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mt-0.5">{new Date(d.delivery_date).toLocaleDateString()} • Rs.{d.total_amount.toLocaleString()}</span>
                                      </div>
                                      {!selectedDeliveryIds.includes(d.id) && <ChevronRight size={16} className="text-slate-200 group-hover/item:text-indigo-400 transition-colors" />}
                                    </button>
                                  ))}
                                {pendingDeliveries.length === 0 && (
                                  <div className="py-8 text-center text-xs text-slate-400 italic">No pending items</div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Quick Tap Select</label>
                       <div className="flex flex-wrap gap-2">
                          {pendingDeliveries.map(d => (
                            <button
                              key={d.id}
                              onClick={() => toggleDelivery(d.id)}
                              className={cn(
                                "px-3 py-2 rounded-xl text-[10px] font-black border transition-all hover:scale-105 active:scale-95",
                                selectedDeliveryIds.includes(d.id)
                                  ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200"
                                  : "bg-white border-slate-200 text-slate-500 hover:border-indigo-400"
                              )}
                            >
                              #{d.id}
                            </button>
                          ))}
                       </div>
                    </div>
                  </section>
                )}
              </div>

              {/* Right Column: Calculations & Items (8 cols) */}
              <div className="xl:col-span-8 space-y-10">
                <section className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col h-full min-h-[600px]">
                  <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-8 bg-emerald-500 rounded-full" />
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Invoice Details Line-Items</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected:</span>
                      <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-black text-slate-900">
                        {selectedDeliveryIds.length} Deliveries
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50/50">
                          <th className="px-10 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Material Info</th>
                          <th className="px-6 py-6 text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Quantity</th>
                          <th className="px-6 py-6 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Unit Price</th>
                          <th className="px-6 py-6 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Discounts %</th>
                          <th className="px-6 py-6 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Tax %</th>
                          <th className="px-10 py-6 text-right text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em]">Net Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {invoiceItems.map((item, idx) => (
                          <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="px-10 py-6">
                              <span className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors block leading-tight">{item.product_name}</span>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg border border-slate-200/50 uppercase tracking-widest italic">{item.product_id}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Ref: #DEL-{item.delivery_id}</span>
                              </div>
                            </td>
                            <td className="px-6 py-6 text-center">
                              <span className="text-lg font-black text-slate-900">{item.quantity}</span>
                              <span className="text-[10px] font-black text-slate-400 ml-2 uppercase italic tracking-widest">{item.uom || 'EACH'}</span>
                            </td>
                            <td className="px-6 py-6 text-right">
                              <input 
                                type="number"
                                value={item.unit_price}
                                onChange={e => updateItemField(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                                className="w-24 bg-slate-50 hover:bg-white border-2 border-transparent focus:border-indigo-400 px-3 py-2 rounded-xl text-right text-base font-black text-slate-900 outline-none transition-all shadow-inner"
                              />
                            </td>
                            <td className="px-6 py-6 text-right">
                               <div className="flex flex-col items-end gap-1">
                                  <div className="flex items-center gap-2">
                                     <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Trade</span>
                                     <input 
                                       type="number"
                                       value={item.trade_discount_pct}
                                       onChange={e => updateItemField(idx, 'trade_discount_pct', parseFloat(e.target.value) || 0)}
                                       className="w-12 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-center text-xs font-black outline-none focus:border-indigo-400"
                                     />
                                  </div>
                                  <div className="flex items-center gap-2">
                                     <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">SPL</span>
                                     <input 
                                       type="number"
                                       value={item.special_discount_pct}
                                       onChange={e => updateItemField(idx, 'special_discount_pct', parseFloat(e.target.value) || 0)}
                                       className="w-12 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-center text-xs font-black outline-none focus:border-indigo-400"
                                     />
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-6 text-right">
                               <input 
                                 type="number"
                                 value={item.tax_pct}
                                 onChange={e => updateItemField(idx, 'tax_pct', parseFloat(e.target.value) || 0)}
                                 className="w-14 bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-center text-xs font-black outline-none focus:border-emerald-400"
                               />
                            </td>
                            <td className="px-10 py-6 text-right text-lg font-black text-indigo-600 italic">
                               {formatPKR(item.net_amount)}
                            </td>
                          </tr>
                        ))}
                        {invoiceItems.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-10 py-40 text-center">
                              <div className="flex flex-col items-center opacity-20">
                                <ShoppingCart size={80} className="mb-6" />
                                <h4 className="text-3xl font-black uppercase tracking-widest">Awaiting Line Items</h4>
                                <p className="text-sm font-medium mt-2">Select deliveries on the left to begin population</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Bar */}
                  <div className="px-12 py-10 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0">
                    <div className="grid grid-cols-3 gap-12">
                      <div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-2">Aggregate Gross</span>
                        <span className="text-2xl font-black text-white font-mono">{formatPKR(totals.gross)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] block mb-2 italic">Total Discs</span>
                        <span className="text-2xl font-black text-rose-500 font-mono">-{formatPKR(totals.discount)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] block mb-2 italic">Est. Tax</span>
                        <span className="text-2xl font-black text-emerald-500 font-mono">+{formatPKR(totals.tax)}</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-xs font-black text-indigo-400 uppercase tracking-[0.5em] block mb-2">Final Net Payable</span>
                      <span className="text-6xl font-black text-indigo-500 font-mono tracking-tighter">
                        {formatPKR(totals.net)}
                      </span>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Fixed */}
        <div className="px-12 py-8 border-t border-slate-100 bg-white flex justify-end gap-6 shrink-0 shadow-[0_-20px_40px_rgba(0,0,0,0.02)]">
          <button 
            disabled={isSubmitting}
            onClick={onClose}
            className="px-10 py-5 text-base font-black text-slate-400 hover:text-slate-900 transition-all uppercase tracking-widest"
          >
            Discard
          </button>
          <button 
            disabled={isSubmitting || invoiceItems.length === 0}
            onClick={handleSubmit}
            className={cn(
              "px-14 py-5 bg-indigo-600 text-white rounded-[2rem] text-lg font-black uppercase tracking-widest flex items-center gap-4 transition-all shadow-2xl shadow-indigo-200 active:scale-95 disabled:grayscale disabled:opacity-30",
              isSubmitting ? "animate-pulse" : "hover:bg-indigo-700 hover:translate-y-[-4px]"
            )}
          >
            {isSubmitting ? (
              <>
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                Validating & Posting...
              </>
            ) : (
              <>
                <Save size={24} />
                Generate Final Bill
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
