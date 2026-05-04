import React, { useState, useEffect } from 'react';
import { X, Save, FileText, Printer, CheckCircle2, ChevronRight, AlertCircle, ShoppingCart } from 'lucide-react';
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
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const selectedShop = shops.find(s => s.id === selectedShopId);

  // Fetch pending deliveries for a shop
  useEffect(() => {
    if (selectedShopId) {
      fetch(`/api/shops/${selectedShopId}/pending-deliveries`)
        .then(res => res.json())
        .then(data => setPendingDeliveries(data))
        .catch(err => console.error(err));
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
  };

  const toggleDelivery = (id: number) => {
    setSelectedDeliveryIds(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-10 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Invoice Transaction</h2>
              <p className="text-sm font-medium text-slate-500">Aggregate deliveries into a professional bill</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Info Banner */}
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

        <div className="flex-1 overflow-y-auto">
          {/* Top Controls: Selection */}
          <div className="px-10 py-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white">
            {/* Shop Selection */}
            <div className="relative">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Retailer / Shop</label>
              <div className="relative">
                <ShoppingCart className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" size={18} />
                <input 
                  type="text"
                  placeholder="Search for a retailer..."
                  value={shopSearch}
                  onFocus={() => setShowShopDropdown(true)}
                  onChange={(e) => {
                    setShopSearch(e.target.value);
                    setShowShopDropdown(true);
                    if (selectedShopId) {
                        setSelectedShopId(null);
                        setSelectedDeliveryIds([]);
                    }
                  }}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:border-indigo-600 focus:bg-white transition-all outline-none"
                />
              </div>

              <AnimatePresence>
                {showShopDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute inset-x-0 top-full mt-2 bg-white border border-slate-100 rounded-3xl shadow-xl z-10 max-h-60 overflow-y-auto py-2"
                  >
                    {shops.filter(s => s.shop_name.toLowerCase().includes(shopSearch.toLowerCase())).map(shop => (
                      <button
                        key={shop.id}
                        onClick={() => handleShopSelect(shop)}
                        className="w-full px-6 py-3 hover:bg-indigo-50 text-left transition-colors flex items-center justify-between group"
                      >
                        <div>
                          <span className="text-sm font-bold text-slate-900 block group-hover:text-indigo-600 transition-colors">{shop.shop_name}</span>
                          <span className="text-xs text-slate-400 font-medium">{shop.location}</span>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-400" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Date Selection */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Invoice Posting Date</label>
              <input 
                type="date"
                value={invoiceDate}
                onChange={e => setInvoiceDate(e.target.value)}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:border-indigo-600 transition-all outline-none"
              />
            </div>
          </div>

          {/* Pending Deliveries Selector */}
          {selectedShopId && (
            <div className="px-10 py-6 bg-slate-50/50 border-y border-slate-100">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 block">Select Pending Deliveries</label>
              {pendingDeliveries.length === 0 ? (
                <div className="py-8 text-center text-slate-400 italic text-sm">No pending deliveries found for this shop.</div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {pendingDeliveries.map(delivery => (
                    <button
                      key={delivery.id}
                      onClick={() => toggleDelivery(delivery.id)}
                      className={cn(
                        "flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all hover:scale-105 active:scale-95",
                        selectedDeliveryIds.includes(delivery.id)
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                          : "bg-white border-slate-200 text-slate-600 hover:border-indigo-400"
                      )}
                    >
                      {selectedDeliveryIds.includes(delivery.id) ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-200" />
                      )}
                      <div className="text-left">
                        <span className="text-xs font-bold block">#DEL-{delivery.id.toString().padStart(4, '0')}</span>
                        <span className="text-[10px] opacity-70 font-medium">{new Date(delivery.delivery_date).toLocaleDateString()} • Rs. {delivery.total_amount.toLocaleString()}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Item Grid */}
          <div className="px-10 py-8">
            <div className="overflow-x-auto rounded-3xl border border-slate-100 shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Information</th>
                    <th className="px-4 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Qty / UOM</th>
                    <th className="px-4 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unit Price</th>
                    <th className="px-4 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross</th>
                    <th className="px-4 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Discounts %</th>
                    <th className="px-4 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tax %</th>
                    <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoiceItems.map((item, idx) => (
                    <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{item.product_name}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">{item.product_id}</span>
                            <span className="text-[10px] text-slate-400 font-medium">From #DEL-{item.delivery_id.toString().padStart(4, '0')}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm font-bold text-slate-900">{item.quantity}</span>
                        <span className="text-[10px] text-slate-400 ml-1 font-bold uppercase">{item.uom || 'EACH'}</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <input 
                          type="number"
                          value={item.unit_price}
                          onChange={e => updateItemField(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-20 bg-transparent border-b border-transparent focus:border-indigo-400 text-right text-sm font-bold text-slate-900 outline-none"
                        />
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-bold text-slate-900">
                        {(item.quantity * item.unit_price).toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                           <div className="flex flex-col items-center">
                             <label className="text-[8px] uppercase font-bold text-slate-400 mb-1">Trade</label>
                             <input 
                               type="number"
                               value={item.trade_discount_pct}
                               onChange={e => updateItemField(idx, 'trade_discount_pct', parseFloat(e.target.value) || 0)}
                               className="w-12 bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg text-xs font-bold text-center outline-none focus:border-indigo-400"
                             />
                           </div>
                           <div className="flex flex-col items-center">
                             <label className="text-[8px] uppercase font-bold text-slate-400 mb-1">Special</label>
                             <input 
                               type="number"
                               value={item.special_discount_pct}
                               onChange={e => updateItemField(idx, 'special_discount_pct', parseFloat(e.target.value) || 0)}
                               className="w-12 bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg text-xs font-bold text-center outline-none focus:border-indigo-400"
                             />
                           </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <input 
                          type="number"
                          value={item.tax_pct}
                          onChange={e => updateItemField(idx, 'tax_pct', parseFloat(e.target.value) || 0)}
                          className="w-14 bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg text-xs font-bold text-center outline-none focus:border-indigo-400"
                        />
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-indigo-600">
                        {formatPKR(item.net_amount)}
                      </td>
                    </tr>
                  ))}
                  {invoiceItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">No items to display. Select deliveries to populate grid.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Totals & Footer */}
        <div className="px-10 py-8 bg-slate-900 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Gross Total</span>
                <span className="text-xl font-bold text-white font-mono">{formatPKR(totals.gross)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Discount</span>
                <span className="text-xl font-bold text-rose-400 font-mono">-{formatPKR(totals.discount)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Tax</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">+{formatPKR(totals.tax)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Net Payable</span>
                <span className="text-3xl font-bold text-indigo-400 font-mono">{formatPKR(totals.net)}</span>
              </div>
           </div>

           <div className="flex items-center gap-4">
              <button
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-4 bg-slate-800 text-slate-300 rounded-2xl font-bold hover:bg-slate-700 transition-all border border-slate-700"
              >
                <Printer size={20} />
                Print Preview
              </button>
              <button
                disabled={isSubmitting || invoiceItems.length === 0}
                onClick={handleSubmit}
                className={cn(
                    "flex items-center gap-3 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:grayscale disabled:opacity-50",
                    isSubmitting ? "animate-pulse" : "hover:bg-indigo-700"
                )}
              >
                <Save size={20} />
                {isSubmitting ? 'Posting...' : 'Post Invoice'}
              </button>
           </div>
        </div>
      </motion.div>
    </div>
  );
};
