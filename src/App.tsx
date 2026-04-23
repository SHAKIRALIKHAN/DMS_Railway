import React, { useState, useEffect, FormEvent } from 'react';
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
  ChevronLeft,
  Factory,
  DollarSign,
  Save,
  Database,
  BarChart3,
  Edit,
  Trash2,
  Settings,
  Shield
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
  Shop, 
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

// Modal component imports
import { LedgerModal, OrderDetailsModal, PurchaseDetailsModal, DeliveryDetailsModal } from './components/modals/DetailsModals';
import { RegisterSupplierModal, DriverModal, SalesmanModal, OrderBookerModal, MaterialGroupModal, TCodeMasterModal, LocationMasterModal } from './components/modals/MasterModals';
import { PurchaseModal, NewOrderModal } from './components/modals/TransactionModals';
import { DeliveryModal } from './components/modals/LogisticsModals';
import { RegisterShopModal, ShopMasterModal, ProductMasterDataModal, UnitModal } from './components/modals/DataManagementModals';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Sidebar and Stat Components ---







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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'transactions' | 'master_data' | 'reports'>('dashboard');
  const [masterDataSubTab, setMasterDataSubTab] = useState<'products' | 'shops' | 'suppliers' | 'order_bookers' | 'salesmen' | 'drivers' | 'locations'>('products');
  const [transactionsSubTab, setTransactionsSubTab] = useState<'orders' | 'deliveries' | 'purchases' | 'load_plans'>('orders');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
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
  const [units, setUnits] = useState<Unit[]>([]);
  const [chartData, setChartData] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [isProductMasterModalOpen, setIsProductMasterModalOpen] = useState(false);
  const [isRegisterShopModalOpen, setIsRegisterShopModalOpen] = useState(false);
  const [isRegisterSupplierModalOpen, setIsRegisterSupplierModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [isMaterialGroupModalOpen, setIsMaterialGroupModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [isOrderBookerModalOpen, setIsOrderBookerModalOpen] = useState(false);
  const [isSalesmanModalOpen, setIsSalesmanModalOpen] = useState(false);
  const [isShopMasterModalOpen, setIsShopMasterModalOpen] = useState(false);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isTCodeModalOpen, setIsTCodeModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [commandValue, setCommandValue] = useState("");
  const [isCommandExpanded, setIsCommandExpanded] = useState(true);

  const executeTransaction = (code: string) => {
    const tCode = code.trim().toUpperCase();
    if (!tCode) return;

    // Handle /n prefix
    const finalCode = tCode.startsWith('/N') ? tCode.slice(2) : tCode;

    // If it started with /n, we "terminate session" by closing any open modals
    if (tCode.startsWith('/N')) {
      setIsProductMasterModalOpen(false);
      setIsRegisterShopModalOpen(false);
      setIsRegisterSupplierModalOpen(false);
      setIsPurchaseModalOpen(false);
      setIsDeliveryModalOpen(false);
      setIsMaterialGroupModalOpen(false);
      setIsDriverModalOpen(false);
      setIsOrderBookerModalOpen(false);
      setIsSalesmanModalOpen(false);
      setIsShopMasterModalOpen(false);
      setIsNewOrderModalOpen(false);
      setIsUnitModalOpen(false);
      setIsLocationModalOpen(false);
      setSelectedOrder(null);
      setSelectedShop(null);
      setSelectedPurchase(null);
      setSelectedDelivery(null);
    }

    switch (finalCode) {
      // Sales & Distribution (SD)
      case 'VA01': 
      case 'OR05':
        setIsNewOrderModalOpen(true); 
        break;
      case 'VA03': 
      case 'OR01':
        setActiveTab('transactions');
        setTransactionsSubTab('orders');
        break;
      case 'DLVY': 
      case 'DL01':
        setActiveTab('transactions');
        setTransactionsSubTab('deliveries');
        break;
      
      // Material Management (MM) / Product (PR)
      case 'MM01': 
      case 'IN05':
        setIsMaterialGroupModalOpen(true); 
        break;
      case 'MM02': 
      case 'PR01':
      case 'PR02':
      case 'PR03':
        setIsProductMasterModalOpen(true); 
        break;
      case 'MM03': 
      case 'IN01':
        setActiveTab('inventory'); 
        break;
      case 'MM04': setIsUnitModalOpen(true); break;
      case 'LOC01': setIsLocationModalOpen(true); break;
      case 'ME21N': 
        setActiveTab('transactions');
        setTransactionsSubTab('purchases');
        break;
      
      // Master Data (MD) / Salesmen (SM) / Shops (SH)
      case 'VD01': 
      case 'SH05':
        setIsRegisterShopModalOpen(true); 
        break;
      case 'VD03': 
      case 'SH01':
        setActiveTab('master_data');
        setMasterDataSubTab('shops');
        break;
      case 'XK01': setIsRegisterSupplierModalOpen(true); break;
      case 'BP01': setIsShopMasterModalOpen(true); break;
      case 'OBM1': setIsOrderBookerModalOpen(true); break;
      case 'SLM1': 
      case 'SM01':
      case 'SM05':
      case 'SM07':
      case 'SM08':
        setIsSalesmanModalOpen(true); 
        break;
      case 'DRV1': setIsDriverModalOpen(true); break;
      case 'TC01': setIsTCodeModalOpen(true); break;
      
      // Systems & Reports
      case 'DASH': setActiveTab('dashboard'); break;
      case 'REPT': setActiveTab('reports'); break;
      case 'LP01': 
      case 'DL05':
        setActiveTab('transactions');
        setTransactionsSubTab('load_plans');
        break;
      
      default:
        console.warn(`Transaction code ${finalCode} not recognized`);
        break;
    }
    setCommandValue("");
  };
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);

  useEffect(() => {
    fetchStats();
    fetchProducts();
    fetchShops();
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
    fetchUnits();
    fetchDeliveries();
  }, []);

  const fetchUnits = async () => {
    try {
      const res = await fetch('/api/units');
      const data = await res.json();
      setUnits(data);
    } catch (err) {
      console.error("Failed to fetch units", err);
    }
  };

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

  const fetchShops = async () => {
    try {
      const res = await fetch('/api/shops');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setShops(data);
    } catch (err) {
      console.error("Failed to fetch shops", err);
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
              icon={Database} 
              label="Master Data" 
              active={activeTab === 'master_data'} 
              onClick={() => setActiveTab('master_data')} 
            />
            <SidebarItem 
              icon={TrendingUp} 
              label="Transactions" 
              active={activeTab === 'transactions'} 
              onClick={() => setActiveTab('transactions')} 
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
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 sticky top-0 z-40 gap-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200 p-0.5">
              <button 
                onClick={() => setIsCommandExpanded(!isCommandExpanded)}
                className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-slate-400 hover:text-slate-600"
              >
                {isCommandExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </button>
              
              <div className={cn(
                "overflow-hidden transition-all duration-300 flex items-center",
                isCommandExpanded ? "w-48 opacity-100 ml-1" : "w-0 opacity-0 ml-0"
              )}>
                <input 
                  type="text" 
                  value={commandValue}
                  onChange={(e) => setCommandValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      executeTransaction(commandValue);
                    }
                  }}
                  placeholder="Enter T-Code..." 
                  className="w-full bg-transparent border-none text-sm font-mono focus:ring-0 placeholder:text-slate-400 uppercase"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-xl hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search orders, shops, products..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-indigo-600 rounded-xl text-sm transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">System</span>
              <span className="text-xs font-bold text-indigo-600">SK-DMS</span>
            </div>
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
                    label="Active Shops" 
                    value={stats?.totalShops || 0} 
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
                    { id: 'shops', label: 'Shops', icon: Store },
                    { id: 'order_bookers', label: 'Order Bookers', icon: Users },
                    { id: 'salesmen', label: 'Salesmen', icon: Users },
                    { id: 'products', label: 'Products', icon: Package },
                    { id: 'locations', label: 'Locations', icon: MapPin },
                    { id: 'units', label: 'Units', icon: Settings },
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
                  <button
                    onClick={() => setIsTCodeModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all bg-slate-900 text-white hover:bg-slate-800 ml-2"
                  >
                    <Shield size={16} />
                    <span>TCODE Mapping</span>
                  </button>
                </div>

                {/* Sub-tab Content */}
                <div className="mt-6">
                  {masterDataSubTab === 'locations' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-900">Location Master Data</h3>
                        <button 
                          onClick={() => setIsLocationModalOpen(true)}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
                        >
                          <Settings size={18} />
                          <span>Manage Locations</span>
                        </button>
                      </div>

                      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center max-w-2xl mx-auto">
                        <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mb-6 shadow-xl shadow-indigo-100/50">
                          <MapPin size={40} />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 mb-2">Hierarchical Location Structure</h4>
                        <p className="text-slate-500 mb-8 sm:px-10">
                          Configure your multi-level location master data to enable precise routing and load plan tracking. 
                          The system supports a 6-level hierarchy from Country down to Subarea.
                        </p>
                        
                        <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                          {[
                            { l: 'Level 1', n: 'Country' },
                            { l: 'Level 2', n: 'Province' },
                            { l: 'Level 3', n: 'City' },
                            { l: 'Level 4', n: 'Town' },
                            { l: 'Level 5', n: 'Area' },
                            { l: 'Level 6', n: 'Subarea' }
                          ].map((item, idx) => (
                            <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.l}</span>
                              <p className="text-sm font-bold text-slate-900">{item.n}</p>
                            </div>
                          ))}
                        </div>

                        <button 
                          onClick={() => setIsLocationModalOpen(true)}
                          className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-indigo-600 transition-all shadow-2xl shadow-slate-200"
                        >
                          Open Location Manager (LOC01)
                        </button>
                      </div>
                    </div>
                  )}

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

                  {masterDataSubTab === 'shops' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-900">Shop Network</h3>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => setIsShopMasterModalOpen(true)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
                          >
                            <Settings size={18} />
                            <span>Manage Shops</span>
                          </button>
                          <button 
                            onClick={() => setIsRegisterShopModalOpen(true)}
                            className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-200 transition-colors"
                          >
                            <Plus size={18} />
                            <span>Register Shop</span>
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {shops.map(shop => (
                          <div key={shop.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-4">
                              <div className="bg-indigo-50 p-3 rounded-xl">
                                <Store className="text-indigo-600" size={24} />
                              </div>
                              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Active</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">{shop.shop_name}</h3>
                            <p className="text-sm text-slate-500 mb-4">{shop.owner_name}</p>
                            <div className="space-y-3 pt-4 border-t border-slate-50">
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <MapPin size={16} className="text-slate-400" />
                                <span>{shop.location}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Phone size={16} className="text-slate-400" />
                                <span>{shop.phone}</span>
                              </div>
                              <div className="flex items-center justify-between pt-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Credit Limit</span>
                                <span className="text-sm font-bold text-slate-900">{formatPKR(shop.credit_limit)}</span>
                              </div>
                              <div className="pt-4 border-t border-slate-50 flex justify-end">
                                <button 
                                  onClick={() => setSelectedShop(shop)}
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
                    { title: 'Shop Aging', desc: 'Outstanding payments and credit analysis', icon: Clock },
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

            {activeTab === 'transactions' && (
              <motion.div 
                key="transactions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Transaction Processing</h2>
                    <p className="text-slate-500">Manage sales, purchases and logistics</p>
                  </div>
                </div>

                {/* Sub-tabs Navigation */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
                  {[
                    { id: 'orders', label: 'Orders', icon: ShoppingCart },
                    { id: 'deliveries', label: 'Deliveries', icon: Truck },
                    { id: 'purchases', label: 'Purchases', icon: FileText },
                    { id: 'load_plans', label: 'Load Plans', icon: Truck },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setTransactionsSubTab(tab.id as any)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                        transactionsSubTab === tab.id 
                          ? "bg-white text-indigo-600 shadow-sm" 
                          : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                      )}
                    >
                      <tab.icon size={16} />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-6">
                  {transactionsSubTab === 'orders' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-900">Sales Orders</h3>
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
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Shop</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Order Booker</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {orders.map(order => (
                              <tr 
                                key={order.id} 
                                onClick={() => setSelectedOrder(order)}
                                className="hover:bg-slate-50 transition-colors cursor-pointer group"
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
                    </div>
                  )}

                  {transactionsSubTab === 'deliveries' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-900">Delivery Notes</h3>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setIsSalesmanModalOpen(true)}
                            className="bg-white text-slate-700 px-4 py-2 rounded-xl text-sm font-bold border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-2"
                          >
                            <Users size={18} />
                            <span>Salesmen</span>
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedDelivery(null);
                              setIsDeliveryModalOpen(true);
                            }}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100 flex items-center gap-2"
                          >
                            <Plus size={18} />
                            <span>New Delivery</span>
                          </button>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Delivery ID</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Order Ref</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Shop</th>
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
                                  <p className="text-slate-500 font-medium">No deliveries found</p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {transactionsSubTab === 'purchases' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-900">Purchase Orders</h3>
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
                    </div>
                  )}

                  {transactionsSubTab === 'load_plans' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-900">Load Plans</h3>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setIsDriverModalOpen(true)}
                            className="bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
                          >
                            <Users size={18} />
                            <span>Drivers Master</span>
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
                                <Truck size={14} />
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
                    </div>
                  )}
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
        {selectedShop && (
          <LedgerModal 
            shop={selectedShop} 
            onClose={() => setSelectedShop(null)} 
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
            units={units}
            onClose={() => setIsProductMasterModalOpen(false)} 
            onSuccess={() => {
              fetchProducts();
              fetchStats();
            }}
          />
        )}
        {isRegisterShopModalOpen && (
          <RegisterShopModal 
            onClose={() => setIsRegisterShopModalOpen(false)} 
            onSuccess={() => {
              fetchShops();
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
              fetchDeliveries();
            }}
          />
        )}
        {isShopMasterModalOpen && (
          <ShopMasterModal 
            onClose={() => setIsShopMasterModalOpen(false)}
            onSuccess={() => {
              fetchShops();
              setIsShopMasterModalOpen(false);
            }}
            shops={shops}
          />
        )}
        {isNewOrderModalOpen && (
          <NewOrderModal 
            shops={shops}
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
        {isTCodeModalOpen && (
          <TCodeMasterModal 
            onClose={() => setIsTCodeModalOpen(false)}
          />
        )}
        {isUnitModalOpen && (
          <UnitModal 
            onClose={() => setIsUnitModalOpen(false)}
            onSuccess={() => {
              // units are not fetched at top level currently, but common to Success handling
              setIsUnitModalOpen(false);
            }}
          />
        )}
        {isLocationModalOpen && (
          <LocationMasterModal 
            onClose={() => setIsLocationModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
