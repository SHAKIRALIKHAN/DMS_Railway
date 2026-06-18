import React, { useState, useEffect } from 'react';
import { ArrowLeft, Truck, Store, Package, Phone, User, CheckCircle, Code, Database, Printer, ChevronDown, ChevronUp, RefreshCw, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductItem {
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

interface ShopLoadPlan {
  shopId: number;
  shopName: string;
  ownerName: string;
  phone: string;
  deliverySequence: number;
  invoices: number[];
  products: ProductItem[];
}

interface ConsolidatedLoadSummary {
  productId: string;
  productName: string;
  totalQuantity: number;
  unit: string;
}

interface SubAreaLoadPlan {
  subArea: string;
  totalShopsCount: number;
  totalOutstandingInvoices: number;
  shops: ShopLoadPlan[];
  consolidatedLoadSummary: ConsolidatedLoadSummary[];
}

interface DailyLoadPlanReportProps {
  onBack: () => void;
  formatPKR: (num: number) => string;
}

export const DailyLoadPlanReport: React.FC<DailyLoadPlanReportProps> = ({ onBack, formatPKR }) => {
  const [loadPlans, setLoadPlans] = useState<SubAreaLoadPlan[]>([]);
  const [selectedAreaName, setSelectedAreaName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI states
  const [expandedShopId, setExpandedShopId] = useState<number | null>(null);
  const [showSchema, setShowSchema] = useState<boolean>(false);
  const [completedStops, setCompletedStops] = useState<Record<number, boolean>>({});
  const [checkedConsolidatedItems, setCheckedConsolidatedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchLoadPlanData();
  }, []);

  const fetchLoadPlanData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/reports/daily-load-plan');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data: SubAreaLoadPlan[] = await res.json();
      setLoadPlans(data);
      if (data.length > 0) {
        setSelectedAreaName(data[0].subArea);
      } else {
        setError("No sales invoices found to construct a Daily Load Plan.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to load invoice load plan report dataset. Please check if invoices have been created.");
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = loadPlans.find(plan => plan.subArea === selectedAreaName);

  const toggleShop = (shopId: number) => {
    if (expandedShopId === shopId) {
      setExpandedShopId(null);
    } else {
      setExpandedShopId(shopId);
    }
  };

  const toggleStopCompletion = (shopId: number) => {
    setCompletedStops(prev => ({
      ...prev,
      [shopId]: !prev[shopId]
    }));
  };

  const toggleConsolidatedCheck = (prodId: string) => {
    setCheckedConsolidatedItems(prev => ({
      ...prev,
      [prodId]: !prev[prodId]
    }));
  };

  const datasetSchemaJSON = {
    "schema": "DistributionManagementSystem.DailyLoadPlanReportData",
    "description": "Output layout representing aggregated sales invoice quantities grouped by geographical Sub-Area, routed in optimal delivery stops sequence, with a final physical loading vehicle summary.",
    "levels": {
      "level1_macro_route": "subArea (Geographical distribution route e.g., UC-2 Gulshan-e-Iqbal)",
      "level2_stop_sequence": "shops (Sequenced lists of retail/wholesale points belonging to this route)",
      "level3_item_aggregation": "products (Summed quantities of all items corresponding to any open invoices under the shop)"
    },
    "data_model": [
      {
        "subArea": "string - Full name of the sub-area / route",
        "totalShopsCount": "number - Number of unique customer stops in this route",
        "totalOutstandingInvoices": "number - Number of open invoices combined",
        "shops": [
          {
            "shopId": "number - Uniquely identifies shop",
            "shopName": "string - Business name of shop",
            "ownerName": "string - Contact person name",
            "phone": "string - Mobile phone for dropoff notification",
            "deliverySequence": "number - Auto-generated recommended sequences for delivery truck",
            "invoices": "number[] - IDs of all combined invoices in this dropoff",
            "products": [
              {
                "productId": "string - Unique product sku/code",
                "productName": "string - Printed product formulation name",
                "unit": "string - Stock unit (e.g. Cartoon, Pack, Bag)",
                "quantity": "number - Total aggregated target quantity for this shop",
                "unitPrice": "number - Retail or trade unit rate matching distribution norms",
                "totalAmount": "number - Net invoiced valuation for this product line to collect"
              }
            ]
          }
        ],
        "consolidatedLoadSummary": [
          {
            "productId": "string - Unique product code",
            "productName": "string - Printed formulation name",
            "totalQuantity": "number - Total sum of this item needed across all shops on this route",
            "unit": "string - Packaging measurement unit"
          }
        ]
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-2xl transition-all"
            title="Back to Reports"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-100 text-amber-800 text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md font-mono">
                T-Code: LPR01
              </span>
              <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md font-mono">
                Daily Report
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">Daily Load Plan Report</h2>
            <p className="text-xs text-slate-500">Physical loading optimization & routed sequence instructions for delivery persons.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setShowSchema(!showSchema)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
              showSchema 
                ? "bg-slate-900 text-white border-slate-900" 
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {showSchema ? <Layers size={16} /> : <Code size={16} />}
            <span>{showSchema ? 'View Interactive UI' : 'View Scheme & Code'}</span>
          </button>
          
          <button 
            onClick={() => window.print()}
            className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <Printer size={16} />
            <span>Print Report</span>
          </button>

          <button 
            onClick={fetchLoadPlanData}
            className="bg-indigo-50 text-indigo-700 p-2.5 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors"
            title="Refresh Report Data"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-600">Structuring load-plan dataset from invoices...</p>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-100 p-8 rounded-3xl text-center shadow-sm max-w-2xl mx-auto">
          <div className="bg-rose-100 text-rose-700 p-3 rounded-2xl w-fit mx-auto mb-4">
            <Truck size={28} />
          </div>
          <h3 className="text-slate-900 font-bold mb-1">No Active Load Source</h3>
          <p className="text-xs text-slate-500 mb-6">{error}</p>
          <div className="flex justify-center gap-3">
            <button 
              onClick={onBack}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-black rounded-xl transition-all"
            >
              Back to list
            </button>
            <button 
              onClick={fetchLoadPlanData}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!loading && !error && showSchema && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden text-slate-300"
        >
          <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-xl text-emerald-400">
                <Database size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Database & Dataset Layout Schema</h3>
                <p className="text-[10px] text-slate-400">Aggregated payload blueprint for rendering is-cancelled clean load guides.</p>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-slate-800 text-emerald-400 px-2 py-1 rounded">JSON payload</span>
          </div>
          <div className="p-6 max-h-[500px] overflow-y-auto font-mono text-[11px] leading-relaxed bg-slate-950/50">
            <pre className="text-emerald-400">{JSON.stringify(datasetSchemaJSON, null, 2)}</pre>
          </div>
          <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
            <button 
              onClick={() => setShowSchema(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all"
            >
              Close Code View
            </button>
          </div>
        </motion.div>
      )}

      {!loading && !error && !showSchema && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Panel: Route & Drop-off list (Level 1: Sub-Area selection, Level 2: Shop sequencing) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Level 1: Sub-Area Filter Select */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Select Macro Route (Sub-Area)</h3>
                  <p className="text-[10px] text-slate-500">Delivery sequences are automatically computed for selected urban zones.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <select 
                    value={selectedAreaName}
                    onChange={(e) => {
                      setSelectedAreaName(e.target.value);
                      setExpandedShopId(null);
                    }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 transition-all appearance-none cursor-pointer"
                  >
                    {loadPlans.map((plan, i) => (
                      <option key={i} value={plan.subArea}>
                        {plan.subArea} ({plan.totalShopsCount} Stops)
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <ChevronDown size={14} />
                  </div>
                </div>

                {selectedPlan && (
                  <div className="flex gap-4 justify-around items-center bg-slate-50 rounded-xl px-4 py-2 border border-slate-100">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Stops</p>
                      <p className="text-xs font-black text-slate-700">{selectedPlan.totalShopsCount}</p>
                    </div>
                    <div className="h-6 w-px bg-slate-200"></div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Invoices</p>
                      <p className="text-xs font-black text-slate-700">{selectedPlan.totalOutstandingInvoices}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Level 2: Shop Sequence Timeline */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Drop-off Sequenced Stops</h3>
                  <p className="text-[10px] text-slate-500">Verify stop order and expand each stop to inspect local client aggregates.</p>
                </div>
                <span className="text-[10px] font-black uppercase text-indigo-600 font-mono tracking-wider">Sequence Sequence</span>
              </div>

              {selectedPlan && (
                <div className="space-y-4">
                  {selectedPlan.shops.map((shop, idx) => {
                    const isCompleted = completedStops[shop.shopId];
                    const isExpanded = expandedShopId === shop.shopId;
                    return (
                      <div 
                        key={shop.shopId}
                        className={`border rounded-2xl transition-all ${
                          isCompleted 
                            ? "bg-slate-50/70 border-slate-100 opacity-60" 
                            : isExpanded 
                            ? "border-indigo-200 shadow-md bg-white hover:border-indigo-300" 
                            : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
                        }`}
                      >
                        {/* Header card representation */}
                        <div 
                          onClick={() => toggleShop(shop.shopId)}
                          className="p-4 flex items-center justify-between cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-3">
                            {/* Sequence number badge */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                              isCompleted 
                                ? "bg-slate-200 text-slate-500" 
                                : isExpanded 
                                ? "bg-indigo-650 text-indigo-600 bg-indigo-50" 
                                : "bg-slate-100 text-slate-700"
                            }`}>
                              {shop.deliverySequence}
                            </div>
                            <div>
                              <h4 className={`text-xs sm:text-sm font-black ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                                {shop.shopName}
                              </h4>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                                <span className="text-[9px] text-slate-400 font-mono flex items-center gap-0.5 font-medium">
                                  <User size={10} /> {shop.ownerName}
                                </span>
                                <span className="text-slate-200 text-[10px]">•</span>
                                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5 font-semibold">
                                  <Phone size={10} /> {shop.phone}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="bg-slate-100 text-slate-600 text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded">
                              {shop.products.length} {shop.products.length === 1 ? 'item' : 'items'}
                            </span>
                            
                            {/* Stop complete toggle checkbox */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStopCompletion(shop.shopId);
                              }}
                              className={`p-1.5 rounded-lg transition-all ${
                                isCompleted 
                                  ? "bg-emerald-150 text-emerald-600 bg-emerald-50" 
                                  : "bg-slate-100 text-slate-400 hover:text-emerald-500"
                              }`}
                              title={isCompleted ? "Mark drop-off outstanding" : "Mark drop-off complete"}
                            >
                              <CheckCircle size={16} />
                            </button>

                            {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                          </div>
                        </div>

                        {/* Collapsed view (Level 3: Product items for the stop) */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="overflow-hidden bg-slate-50/50 rounded-b-2xl border-t border-slate-100"
                            >
                              <div className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Item Aggregation for Stop #{shop.deliverySequence}
                                  </p>
                                  <span className="text-[9px] font-mono text-slate-400">
                                    Invoices: {shop.invoices.map(id => `#${id}`).join(', ')}
                                  </span>
                                </div>
                                
                                <div className="border border-slate-100/80 rounded-xl overflow-hidden bg-white">
                                  <table className="w-full text-left text-xs">
                                    <thead>
                                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-400">
                                        <th className="px-3 py-2 font-mono text-[10px] uppercase font-bold">Item ID</th>
                                        <th className="px-3 py-2 font-bold font-mono text-[10px] uppercase">Product Details</th>
                                        <th className="px-3 py-2 font-black font-mono text-[10px] uppercase text-right">Qty</th>
                                        <th className="px-3 py-2 font-black font-mono text-[10px] uppercase text-right">Amount</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                      {shop.products.map((prod, pIdx) => (
                                        <tr key={pIdx} className="hover:bg-slate-50/50 transition-colors">
                                          <td className="px-3 py-2 font-mono text-[10px] text-slate-500">{prod.productId}</td>
                                          <td className="px-3 py-2">
                                            <span className="font-bold text-slate-800 leading-tight block">{prod.productName}</span>
                                            <span className="text-[9px] text-slate-400 leading-none">Pack style: {prod.unit}</span>
                                          </td>
                                          <td className="px-3 py-2 text-right font-mono font-bold text-indigo-600">
                                            {prod.quantity} <span className="text-[9px] font-sans text-slate-400">{prod.unit}</span>
                                          </td>
                                          <td className="px-3 py-2 text-right font-mono text-slate-650">
                                            {formatPKR(prod.totalAmount)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Final Consolidated Load Summary */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 rounded-3xl text-white p-6 shadow-lg border border-slate-800 sticky top-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-md shadow-indigo-650/45">
                    <Package size={22} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-md tracking-tight uppercase font-mono">Loading Summary</h3>
                    <p className="text-[10px] text-slate-400 font-sans">Vehicle physical load check sheet before dispatch.</p>
                  </div>
                </div>
              </div>

              {selectedPlan ? (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 flex justify-between items-center">
                    <div>
                      <span className="text-[9px] text-indigo-400 font-black tracking-wider uppercase block font-mono">Consolidation Key</span>
                      <span className="text-xs font-semibold text-slate-200 block mt-0.5">{selectedPlan.subArea}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded">
                      {selectedPlan.consolidatedLoadSummary.length} SKU types
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {selectedPlan.consolidatedLoadSummary.map((item) => {
                      const isChecked = checkedConsolidatedItems[item.productId];
                      return (
                        <div 
                          key={item.productId}
                          onClick={() => toggleConsolidatedCheck(item.productId)}
                          className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer select-none ${
                            isChecked 
                              ? "bg-slate-950/40 border-slate-800 opacity-50" 
                              : "bg-slate-800/40 border-slate-800/60 hover:bg-slate-800/80"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Checkmark indicator */}
                            <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                              isChecked 
                                ? "bg-emerald-500 border-emerald-500 text-white" 
                                : "border-slate-600 text-transparent hover:border-slate-500"
                            }`}>
                              <CheckCircle size={14} className="stroke-[3]" />
                            </div>
                            
                            <div>
                              <span className={`text-xs font-bold leading-tight block ${isChecked ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                                {item.productName}
                              </span>
                              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mt-0.5 block">{item.productId}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`text-sm font-black font-mono block ${isChecked ? 'text-slate-500' : 'text-emerald-400'}`}>
                              {item.totalQuantity}
                            </span>
                            <span className="text-[9px] text-slate-400 uppercase font-mono tracking-wider block">{item.unit}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-emerald-950/30 border border-emerald-900/50 p-4 rounded-2xl flex items-start gap-3">
                    <CheckCircle size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-emerald-200/90 leading-relaxed font-sans font-medium">
                      Instruct the warehouse dispatcher to load exactly the sums checked above. The calculated stop routing minimizes logistical dead-runs across Karachi.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="text-slate-700 mx-auto mb-2" size={40} />
                  <p className="text-xs text-slate-500">Pick a Sub-Area zone on the left to display its loaded counts.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
