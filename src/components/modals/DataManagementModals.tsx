import React, { useState, useEffect, FormEvent } from 'react';
import { X, Save, Trash2, Edit, Store, Package, Plus, Trash } from 'lucide-react';
import { motion } from 'motion/react';
import { Shop, Product, Unit, MaterialGroup } from '../../types';

export const RegisterShopModal = ({ 
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
      const res = await fetch('/api/shops', {
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
      console.error("Failed to register shop", err);
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
          <h3 className="text-lg font-bold text-slate-900">Register New Shop</h3>
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
              {isSubmitting ? 'Registering...' : 'Register Shop'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export const ShopMasterModal = ({ 
  onClose, 
  onSuccess,
  shops 
}: { 
  onClose: () => void, 
  onSuccess: () => void,
  shops: Shop[]
}) => {
  const [formData, setFormData] = useState({
    shop_name: '',
    owner_name: '',
    location: '',
    phone: '',
    credit_limit: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingId ? `/api/shops/${editingId}` : '/api/shops';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess();
        setFormData({ 
          shop_name: '', 
          owner_name: '', 
          location: '', 
          phone: '', 
          credit_limit: 0 
        });
        setEditingId(null);
      }
    } catch (err) {
      console.error("Failed to save shop", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this shop?")) return;
    try {
      const res = await fetch(`/api/shops/${id}`, { method: 'DELETE' });
      if (res.ok) onSuccess();
      else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error("Failed to delete shop", err);
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
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Store size={20} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Manage Shops Master Data</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="p-6 border-r border-slate-100 lg:col-span-1">
            <h4 className="text-sm font-bold text-slate-900 mb-4">{editingId ? 'Edit Shop' : 'Add New Shop'}</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Shop Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.shop_name}
                  onChange={e => setFormData({...formData, shop_name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. Al-Madina Mart"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Owner Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.owner_name}
                  onChange={e => setFormData({...formData, owner_name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. Ahmed"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Shop' : 'Add Shop'}
                </button>
                {editingId && (
                  <button 
                    type="button"
                    onClick={() => {
                        setEditingId(null);
                        setFormData({ shop_name: '', owner_name: '', location: '', phone: '', credit_limit: 0 });
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
            <h4 className="text-sm font-bold text-slate-900 mb-4">Registered Shops</h4>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Shop Info</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Location / Contact</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Credit</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {shops.map(shop => (
                            <tr key={shop.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3">
                                    <p className="text-sm font-bold text-slate-900">{shop.shop_name}</p>
                                    <p className="text-[10px] text-slate-500">{shop.owner_name}</p>
                                </td>
                                <td className="px-4 py-3">
                                    <p className="text-xs text-slate-700">{shop.location}</p>
                                    <p className="text-[10px] text-slate-500">{shop.phone}</p>
                                </td>
                                <td className="px-4 py-3 text-right text-xs font-bold text-indigo-600">
                                    {shop.credit_limit}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-1">
                                        <button 
                                            onClick={() => {
                                                setEditingId(shop.id);
                                                setFormData({
                                                    shop_name: shop.shop_name,
                                                    owner_name: shop.owner_name,
                                                    location: shop.location,
                                                    phone: shop.phone,
                                                    credit_limit: shop.credit_limit
                                                });
                                            }}
                                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        >
                                            <Edit size={14} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(shop.id)}
                                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const UnitModal = ({ 
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
      if (res.ok) setUnits(await res.json());
    } catch (err) {
      console.error("Failed to fetch units", err);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
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
        onSuccess();
        fetchUnits();
        setFormData({ name: '', short_name: '', status: 1 });
        setEditingId(null);
      }
    } catch (err) {
      console.error("Failed to save unit", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this unit?")) return;
    try {
      const res = await fetch(`/api/units/${id}`, { method: 'DELETE' });
      if (res.ok) fetchUnits();
      else alert( (await res.json()).error );
    } catch (err) { console.error(err); }
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
          <h3 className="text-lg font-bold text-slate-900">Manage Units</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-6 border-r border-slate-100">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Unit Name</label>
                        <input 
                            required
                            type="text" 
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            placeholder="e.g. Cartoon"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Short Name</label>
                        <input 
                            required
                            type="text" 
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600"
                            value={formData.short_name}
                            onChange={e => setFormData({...formData, short_name: e.target.value})}
                            placeholder="e.g. CTN"
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Saving...' : editingId ? 'Update Unit' : 'Add Unit'}
                    </button>
                    {editingId && (
                        <button 
                            onClick={() => { setEditingId(null); setFormData({name: '', short_name: '', status:1}); }}
                            className="w-full py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm"
                        >
                            Cancel
                        </button>
                    )}
                </form>
            </div>
            <div className="p-6 bg-slate-50 overflow-y-auto max-h-[400px]">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Available Units</h4>
                <div className="space-y-2">
                    {units.map(u => (
                        <div key={u.id} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                            <div>
                                <p className="text-sm font-bold text-slate-900">{u.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono tracking-wider">{u.short_name}</p>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => { setEditingId(u.id); setFormData({name: u.name, short_name: u.short_name, status: u.status}); }} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                    <Edit size={14} />
                                </button>
                                <button onClick={() => handleDelete(u.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg">
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

export const ProductMasterDataModal = ({ 
  onClose, 
  onSuccess,
  products,
  materialGroups,
  units 
}: { 
  onClose: () => void, 
  onSuccess: () => void,
  products: Product[],
  materialGroups: MaterialGroup[],
  units: Unit[]
}) => {
    const [formData, setFormData] = useState({
        product_id: '',
        product_name: '',
        material_group_id: '',
        brand: '',
        unit: '',
        conversion_value: 1,
        trade_price: 0,
        retail_price: 0,
        purchase_price: 0,
        stock_quantity: 0,
        min_stock_level: 0,
        reorder_level: 0
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const url = editingId ? `/api/products/${editingId}` : '/api/products';
            const method = editingId ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                onSuccess();
                setFormData({
                    product_id: '',
                    product_name: '',
                    material_group_id: '',
                    brand: '',
                    unit: '',
                    conversion_value: 1,
                    trade_price: 0,
                    retail_price: 0,
                    purchase_price: 0,
                    stock_quantity: 0,
                    min_stock_level: 0,
                    reorder_level: 0
                });
                setEditingId(null);
            }
        } catch (err) {
            console.error("Failed to save product", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete product?")) return;
        try {
            const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
            if (res.ok) onSuccess();
            else alert( (await res.json()).error );
        } catch (err) { console.error(err); }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-lg">
                            <Package size={20} className="text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Manage Products Master Data</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3">
                    {/* Form Section */}
                    <div className="p-6 border-r border-slate-100 overflow-y-auto">
                        <h4 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                            {editingId ? <Edit size={16}/> : <Plus size={16}/>}
                            {editingId ? 'Edit Product' : 'Add New Product'}
                        </h4>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Product Code (ID)</label>
                                    <input 
                                        required
                                        disabled={!!editingId}
                                        type="text" 
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all disabled:opacity-50"
                                        value={formData.product_id}
                                        onChange={e => setFormData({...formData, product_id: e.target.value})}
                                        placeholder="e.g. PROD001"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Product Name</label>
                                    <input 
                                        required
                                        type="text" 
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                                        value={formData.product_name}
                                        onChange={e => setFormData({...formData, product_name: e.target.value})}
                                        placeholder="e.g. Master Oil 1L"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Brand</label>
                                    <input 
                                        required
                                        type="text" 
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none"
                                        value={formData.brand}
                                        onChange={e => setFormData({...formData, brand: e.target.value})}
                                        placeholder="Brand"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Material Group</label>
                                    <select 
                                        required
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none"
                                        value={formData.material_group_id}
                                        onChange={e => setFormData({...formData, material_group_id: e.target.value})}
                                    >
                                        <option value="">Select Group</option>
                                        {materialGroups.map(gp => <option key={gp.mat_gp} value={gp.mat_gp}>{gp.mat_description}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Unit</label>
                                    <select 
                                        required
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none"
                                        value={formData.unit}
                                        onChange={e => setFormData({...formData, unit: e.target.value})}
                                    >
                                        <option value="">Select Unit</option>
                                        {units.map(u => <option key={u.id} value={u.short_name}>{u.short_name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">TP (Trade Price)</label>
                                    <input 
                                        required
                                        type="number" 
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none"
                                        value={formData.trade_price}
                                        onChange={e => setFormData({...formData, trade_price: parseFloat(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">RP (Retail Price)</label>
                                    <input 
                                        required
                                        type="number" 
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none"
                                        value={formData.retail_price}
                                        onChange={e => setFormData({...formData, retail_price: parseFloat(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Stock Qty</label>
                                    <input 
                                        required
                                        type="number" 
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none"
                                        value={formData.stock_quantity}
                                        onChange={e => setFormData({...formData, stock_quantity: parseInt(e.target.value)})}
                                    />
                                </div>
                            </div>
                            
                            <div className="flex gap-2 pt-4">
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <Save size={18}/>
                                    {isSubmitting ? 'Saving...' : editingId ? 'Update Product' : 'Save Product'}
                                </button>
                                {editingId && (
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setEditingId(null);
                                            setFormData({
                                                product_id: '', product_name: '', mat_gp: '', brand: '', unit_id: '',
                                                conversion_factor: 1, trade_price: 0, retail_price: 0, gst_percent: 18, cost_price: 0, stock_qty: 0
                                            });
                                        }}
                                        className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Table Section */}
                    <div className="lg:col-span-2 bg-slate-50 p-6 overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Product Inventory ({products.length})</h4>
                            <div className="flex gap-2">
                                <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-bold">Total SKUs: {products.length}</span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-white z-10">
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Product Details</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Brand/Group</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">TP / RP</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Stock</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {products.map(p => (
                                        <tr key={p.product_id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-slate-900 leading-tight">{p.product_name}</p>
                                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.product_id}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-slate-600 font-medium">{p.brand}</p>
                                                <p className="text-[10px] text-slate-400">{materialGroups.find(g => g.mat_gp === p.material_group_id)?.mat_description || p.material_group_id}</p>
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums">
                                                <p className="text-indigo-600 font-bold">{p.trade_price}</p>
                                                <p className="text-[10px] text-slate-400">{p.retail_price}</p>
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded text-[10px] font-bold",
                                                    p.stock_quantity <= 0 ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                                                )}>
                                                    {p.stock_quantity} {p.unit}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => {
                                                            setEditingId(p.product_id);
                                                            setFormData({...p});
                                                        }}
                                                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(p.product_id)}
                                                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {products.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                                                <Package size={40} className="mx-auto mb-3 opacity-20"/>
                                                <p>No products in master data</p>
                                            </td>
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

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
