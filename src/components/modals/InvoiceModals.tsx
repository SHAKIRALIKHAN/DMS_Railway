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
              additional_tax_pct: it.additional_tax_pct || 0,
              special_discount_pct: it.extra_discount_pct || 0,
              unit_price: it.price,
              net_amount: calculateLineNet(it.quantity, it.price, (it.discount_pct || 0) + (it.extra_discount_pct || 0), (it.sales_tax_pct || 0) + (it.additional_tax_pct || 0))
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
    const discAmount = (gross * discTotalPct / 100);
    const taxAmount = (gross * taxPct / 100);
    const net = gross - discAmount + taxAmount;
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
        additional_tax_pct: it.additional_tax_pct,
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
      (item.tax_pct || 0) + (item.additional_tax_pct || 0)
    );
    
    setInvoiceItems(updated);
  };

  const totals = invoiceItems.reduce((acc, it) => {
    const gross = it.quantity * it.unit_price;
    const disc = gross * ((it.trade_discount_pct || 0) + (it.special_discount_pct || 0)) / 100;
    const tax = gross * ((it.tax_pct || 0) + (it.additional_tax_pct || 0)) / 100;
    
    acc.gross += gross;
    acc.discount += disc;
    acc.tax += tax;
    acc.net += it.net_amount;
    return acc;
  }, { gross: 0, discount: 0, tax: 0, net: 0 });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-white w-full h-full rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-slate-900">
              Invoice Management (INV01)
            </h3>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">Live Posting</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0" title="Close (F3)">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorStatus && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center gap-3">
              <AlertCircle size={20} />
              <p className="text-sm font-bold">{errorStatus}</p>
            </div>
          )}

          {/* Header Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Select Retailer</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Type shop name or location..."
                  value={shopSearch}
                  onFocus={() => setShowShopDropdown(true)}
                  onChange={(e) => {
                    setShopSearch(e.target.value);
                    setShowShopDropdown(true);
                  }}
                  className="w-full pl-12 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                />
                
                <AnimatePresence>
                  {showShopDropdown && shopSearch.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                      <div className="max-h-60 overflow-y-auto">
                        {shops
                          .filter(s => s.shop_name.toLowerCase().includes(shopSearch.toLowerCase()) || s.location.toLowerCase().includes(shopSearch.toLowerCase()))
                          .map(shop => (
                            <button
                              key={shop.id}
                              onClick={() => handleShopSelect(shop)}
                              className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between group transition-colors border-b border-slate-50 last:border-0"
                            >
                              <div>
                                <span className="text-sm font-bold text-slate-900 block group-hover:text-indigo-600 transition-colors">{shop.shop_name}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{shop.location}</span>
                              </div>
                              <ChevronRight size={16} className="text-slate-200 group-hover:text-indigo-400 transition-colors" />
                            </button>
                          ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Billing Date</label>
              <input 
                type="date"
                value={invoiceDate}
                onChange={e => setInvoiceDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all font-medium"
              />
            </div>
            <div className="flex items-end">
              <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl w-full text-center">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Available Deliveries</span>
                <span className="text-lg font-black text-indigo-600">{pendingDeliveries.length}</span>
              </div>
            </div>
          </div>

          {/* Delivery Slots Selection */}
          {selectedShopId && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-700 uppercase">Input Delivery Refs</label>
                <div className="h-px flex-1 bg-slate-100"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[0, 1, 2, 3, 4].map(idx => (
                  <div key={idx} className="relative">
                    <input 
                      type="text"
                      placeholder={`Slot ${idx + 1}...`}
                      value={deliverySlots[idx]}
                      onChange={(e) => handleSlotChange(idx, e.target.value)}
                      onFocus={() => setActiveSlotIdx(idx)}
                      onBlur={() => setTimeout(() => setActiveSlotIdx(null), 200)}
                      className={cn(
                        "w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold transition-all outline-none",
                        deliverySlots[idx] 
                          ? "border-indigo-400 text-indigo-700 bg-white" 
                          : "text-slate-900 placeholder:text-slate-400 focus:border-indigo-400"
                      )}
                    />
                    <AnimatePresence>
                      {activeSlotIdx === idx && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto"
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
                                  "w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center justify-between group rounded transition-colors",
                                  selectedDeliveryIds.includes(d.id) && "opacity-40 cursor-not-allowed"
                                )}
                              >
                                <div>
                                  <span className="text-xs font-bold text-slate-900 block italic">#DEL-{d.id.toString().padStart(4, '0')}</span>
                                  <span className="text-[10px] text-slate-400 block font-medium">Rs.{d.total_amount.toLocaleString()}</span>
                                </div>
                              </button>
                            ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items Table */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center">Batch Ref</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center">Qty</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Unit Price</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center whitespace-nowrap">Tax (%)</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center whitespace-nowrap">Add. Tax (%)</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center">Disc (%)</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center">E. Disc (%)</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Net Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoiceItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{item.product_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono tracking-wider italic">{item.product_id}</p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200/50 font-mono italic">#DEL-{item.delivery_id}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <p className="text-sm font-bold text-slate-900">{item.quantity}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.uom || 'EACH'}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <input 
                        type="number"
                        value={item.unit_price}
                        onChange={e => updateItemField(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-right text-xs font-bold outline-none focus:border-indigo-600 transition-all"
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <input 
                        type="number"
                        value={item.tax_pct}
                        onChange={e => updateItemField(idx, 'tax_pct', parseFloat(e.target.value) || 0)}
                        className="w-12 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg px-1 py-1 text-center text-xs font-bold outline-none"
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <input 
                        type="number"
                        value={item.additional_tax_pct}
                        onChange={e => updateItemField(idx, 'additional_tax_pct', parseFloat(e.target.value) || 0)}
                        className="w-12 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg px-1 py-1 text-center text-xs font-bold outline-none"
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <input 
                        type="number"
                        value={item.trade_discount_pct}
                        onChange={e => updateItemField(idx, 'trade_discount_pct', parseFloat(e.target.value) || 0)}
                        className="w-12 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg px-1 py-1 text-center text-xs font-bold outline-none"
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <input 
                        type="number"
                        value={item.special_discount_pct}
                        onChange={e => updateItemField(idx, 'special_discount_pct', parseFloat(e.target.value) || 0)}
                        className="w-12 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg px-1 py-1 text-center text-xs font-bold outline-none"
                      />
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900 text-sm">
                      {formatPKR(item.net_amount)}
                    </td>
                  </tr>
                ))}
                {invoiceItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center text-slate-400">
                      <ShoppingCart size={48} className="mx-auto mb-4 opacity-10" />
                      <p className="text-sm font-medium">Awaiting Line Items Selection</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* New ORDER Style Summary Bar */}
          <div className="bg-indigo-600 rounded-2xl p-6 text-white flex justify-between items-center shadow-lg shadow-indigo-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Gross Total</p>
                <p className="text-lg font-bold">{formatPKR(totals.gross)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Discounts</p>
                <p className="text-lg font-bold text-rose-200">-{formatPKR(totals.discount)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Tax Total</p>
                <p className="text-lg font-bold text-emerald-200">+{formatPKR(totals.tax)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Net Payable</p>
                <p className="text-2xl font-black">{formatPKR(totals.net)}</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={onClose}
                className="px-6 py-4 text-white font-bold opacity-70 hover:opacity-100 transition-opacity uppercase text-xs tracking-widest"
              >
                Discard
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting || invoiceItems.length === 0}
                className="bg-white text-indigo-600 px-10 py-4 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10 flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Posting...' : (
                  <>
                    <Save size={18} />
                    <span>Post Invoice (F2)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
