import React, { useState, FormEvent } from 'react';
import { X, Save, Trash2, Edit, Users, Phone, Clock, Plus, Search, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { Supplier, MaterialGroup, Driver, OrderBooker, Salesman } from '../../types';
import { TCODES } from '../../constants/tcodes';

export const RegisterSupplierModal = ({ 
  onClose, 
  onSuccess 
}: { 
  onClose: () => void, 
  onSuccess: () => void 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error("Failed to register supplier", err);
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
          <h3 className="text-lg font-bold text-slate-900">Register New Supplier</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Supplier Name</label>
            <input 
              required
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
              placeholder="e.g. MSK Company"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Contact Person</label>
            <input 
              required
              type="text" 
              value={formData.contact_person}
              onChange={e => setFormData({...formData, contact_person: e.target.value})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
              placeholder="e.g. Saleem Ahmed"
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
              placeholder="e.g. 03444444444"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Address</label>
            <textarea 
              required
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all min-h-[100px]"
              placeholder="e.g. SITE Area, Karachi"
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
              {isSubmitting ? 'Registering...' : 'Register Supplier'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export const DriverModal = ({ 
  onClose, 
  onSuccess,
  drivers 
}: { 
  onClose: () => void, 
  onSuccess: () => void,
  drivers: Driver[]
}) => {
  const [formData, setFormData] = useState({
    name: '',
    father_name: '',
    cell_no: '',
    cnic_no: '',
    joining_date: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingId ? `/api/drivers/${editingId}` : '/api/drivers';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess();
        setFormData({ 
          name: '', 
          father_name: '', 
          cell_no: '', 
          cnic_no: '', 
          joining_date: new Date().toISOString().split('T')[0] 
        });
        setEditingId(null);
      }
    } catch (err) {
      console.error("Failed to save driver", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this driver?")) return;
    try {
      const res = await fetch(`/api/drivers/${id}`, { method: 'DELETE' });
      if (res.ok) onSuccess();
      else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error("Failed to delete driver", err);
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
          <h3 className="text-lg font-bold text-slate-900">Manage Drivers Master Data</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="p-6 border-r border-slate-100 lg:col-span-1">
            <h4 className="text-sm font-bold text-slate-900 mb-4">{editingId ? 'Edit Driver' : 'Add New Driver'}</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Driver Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. Junaid Khan"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Father Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.father_name}
                  onChange={e => setFormData({...formData, father_name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. Abdul Khan"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Cell No</label>
                <input 
                  required
                  type="text" 
                  value={formData.cell_no}
                  onChange={e => setFormData({...formData, cell_no: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. 03001234567"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">CNIC #</label>
                <input 
                  required
                  type="text" 
                  value={formData.cnic_no}
                  onChange={e => setFormData({...formData, cnic_no: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. 42101-1234567-1"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Date of Joining</label>
                <input 
                  required
                  type="date" 
                  value={formData.joining_date}
                  onChange={e => setFormData({...formData, joining_date: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Driver' : 'Add Driver'}
                </button>
                {editingId && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ 
                        name: '', 
                        father_name: '', 
                        cell_no: '', 
                        cnic_no: '', 
                        joining_date: new Date().toISOString().split('T')[0] 
                      });
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
            <h4 className="text-sm font-bold text-slate-900 mb-4">Driver List</h4>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Name / Father</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Contact / CNIC</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Joined</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {drivers.map(driver => (
                    <tr key={driver.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-slate-500">#{driver.id}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-slate-900">{driver.name}</p>
                        <p className="text-[10px] text-slate-500">{driver.father_name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-700">{driver.cell_no}</p>
                        <p className="text-[10px] text-slate-500">{driver.cnic_no}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{driver.joining_date}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => {
                              setEditingId(driver.id);
                              setFormData({ 
                                name: driver.name, 
                                father_name: driver.father_name, 
                                cell_no: driver.cell_no, 
                                cnic_no: driver.cnic_no, 
                                joining_date: driver.joining_date 
                              });
                            }}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} className="rotate-180" /> {/* Reusing trash for edit icon shape if needed, but actually Edit is imported */}
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(driver.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {drivers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">No drivers found</td>
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

export const SalesmanModal = ({ 
  onClose, 
  onSuccess,
  salesmen 
}: { 
  onClose: () => void, 
  onSuccess: () => void,
  salesmen: Salesman[]
}) => {
  const [formData, setFormData] = useState({
    name: '',
    father_name: '',
    cell_no: '',
    cnic_no: '',
    joining_date: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingId ? `/api/salesmen/${editingId}` : '/api/salesmen';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess();
        setFormData({ 
          name: '', 
          father_name: '', 
          cell_no: '', 
          cnic_no: '', 
          joining_date: new Date().toISOString().split('T')[0] 
        });
        setEditingId(null);
      }
    } catch (err) {
      console.error("Failed to save salesman", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this salesman?")) return;
    try {
      const res = await fetch(`/api/salesmen/${id}`, { method: 'DELETE' });
      if (res.ok) onSuccess();
      else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error("Failed to delete salesman", err);
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
          <h3 className="text-lg font-bold text-slate-900">Manage Salesmen Master Data</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="p-6 border-r border-slate-100 lg:col-span-1">
            <h4 className="text-sm font-bold text-slate-900 mb-4">{editingId ? 'Edit Salesman' : 'Add New Salesman'}</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Salesman Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. Asif Ali"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Father Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.father_name}
                  onChange={e => setFormData({...formData, father_name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. Muhammad Ali"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Cell No</label>
                <input 
                  required
                  type="text" 
                  value={formData.cell_no}
                  onChange={e => setFormData({...formData, cell_no: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. 03111234567"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">CNIC #</label>
                <input 
                  required
                  type="text" 
                  value={formData.cnic_no}
                  onChange={e => setFormData({...formData, cnic_no: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. 42101-2222222-2"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Date of Joining</label>
                <input 
                  required
                  type="date" 
                  value={formData.joining_date}
                  onChange={e => setFormData({...formData, joining_date: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Salesman' : 'Save Salesman'}
                </button>
                {editingId && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ name: '', father_name: '', cell_no: '', cnic_no: '', joining_date: new Date().toISOString().split('T')[0] });
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="p-6 bg-slate-50 lg:col-span-2 overflow-y-auto max-h-[500px]">
            <h4 className="text-sm font-bold text-slate-900 mb-4">Registered Salesmen</h4>
            <div className="space-y-3">
              {salesmen.map(salesman => (
                <div key={salesman.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                      <Users size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{salesman.name}</p>
                      <div className="flex gap-3 mt-1">
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Phone size={10} /> {salesman.cell_no}
                        </p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock size={10} /> Joined: {new Date(salesman.joining_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        setEditingId(salesman.id);
                        setFormData({
                          name: salesman.name,
                          father_name: salesman.father_name,
                          cell_no: salesman.cell_no,
                          cnic_no: salesman.cnic_no,
                          joining_date: salesman.joining_date
                        });
                      }}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(salesman.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {salesmen.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                  <Users size={32} className="mx-auto text-slate-200 mb-2" />
                  <p className="text-slate-500 text-sm">No salesmen registered yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const OrderBookerModal = ({ 
  onClose, 
  onSuccess,
  orderBookers 
}: { 
  onClose: () => void, 
  onSuccess: () => void,
  orderBookers: OrderBooker[]
}) => {
  const [formData, setFormData] = useState({
    name: '',
    father_name: '',
    cell_no: '',
    cnic_no: '',
    joining_date: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingId ? `/api/order-bookers/${editingId}` : '/api/order-bookers';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess();
        setFormData({ 
          name: '', 
          father_name: '', 
          cell_no: '', 
          cnic_no: '', 
          joining_date: new Date().toISOString().split('T')[0] 
        });
        setEditingId(null);
      }
    } catch (err) {
      console.error("Failed to save order booker", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this order booker?")) return;
    try {
      const res = await fetch(`/api/order-bookers/${id}`, { method: 'DELETE' });
      if (res.ok) onSuccess();
      else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error("Failed to delete order booker", err);
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
          <h3 className="text-lg font-bold text-slate-900">Manage Order Bookers Master Data</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="p-6 border-r border-slate-100 lg:col-span-1">
            <h4 className="text-sm font-bold text-slate-900 mb-4">{editingId ? 'Edit Booker' : 'Add New Booker'}</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Booker Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. Zeeshan Ahmed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Father Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.father_name}
                  onChange={e => setFormData({...formData, father_name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. Ahmed Khan"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Cell No</label>
                <input 
                  required
                  type="text" 
                  value={formData.cell_no}
                  onChange={e => setFormData({...formData, cell_no: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. 03001234567"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">CNIC #</label>
                <input 
                  required
                  type="text" 
                  value={formData.cnic_no}
                  onChange={e => setFormData({...formData, cnic_no: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. 42101-1111111-1"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Date of Joining</label>
                <input 
                  required
                  type="date" 
                  value={formData.joining_date}
                  onChange={e => setFormData({...formData, joining_date: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Booker' : 'Add Booker'}
                </button>
                {editingId && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ 
                        name: '', 
                        father_name: '', 
                        cell_no: '', 
                        cnic_no: '', 
                        joining_date: new Date().toISOString().split('T')[0] 
                      });
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
            <h4 className="text-sm font-bold text-slate-900 mb-4">Order Booker List</h4>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Name / Father</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Contact / CNIC</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Joined</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orderBookers.map(booker => (
                    <tr key={booker.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-slate-500">#{booker.id}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-slate-900">{booker.name}</p>
                        <p className="text-[10px] text-slate-500">{booker.father_name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-700">{booker.cell_no}</p>
                        <p className="text-[10px] text-slate-500">{booker.cnic_no}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{booker.joining_date}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => {
                              setEditingId(booker.id);
                              setFormData({ 
                                name: booker.name, 
                                father_name: booker.father_name, 
                                cell_no: booker.cell_no, 
                                cnic_no: booker.cnic_no, 
                                joining_date: booker.joining_date 
                              });
                            }}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(booker.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {orderBookers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">No bookers found</td>
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

export const MaterialGroupModal = ({ 
  onClose, 
  onSuccess,
  materialGroups 
}: { 
  onClose: () => void, 
  onSuccess: () => void,
  materialGroups: MaterialGroup[]
}) => {
  const [formData, setFormData] = useState({
    mat_gp: '',
    mat_description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingId ? `/api/material-groups/${editingId}` : '/api/material-groups';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess();
        setFormData({ mat_gp: '', mat_description: '' });
        setEditingId(null);
      }
    } catch (err) {
      console.error("Failed to save material group", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this material group?")) return;
    try {
      const res = await fetch(`/api/material-groups/${id}`, { method: 'DELETE' });
      if (res.ok) onSuccess();
      else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error("Failed to delete material group", err);
    }
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
          <h3 className="text-lg font-bold text-slate-900">Manage Material Groups</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="p-6 border-r border-slate-100">
            <h4 className="text-sm font-bold text-slate-900 mb-4">{editingId ? 'Edit Group' : 'Add New Group'}</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Group ID (MatGP)</label>
                <input 
                  required
                  disabled={!!editingId}
                  type="text" 
                  value={formData.mat_gp}
                  onChange={e => setFormData({...formData, mat_gp: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all disabled:opacity-50"
                  placeholder="e.g. 00001"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Description</label>
                <input 
                  required
                  type="text" 
                  value={formData.mat_description}
                  onChange={e => setFormData({...formData, mat_description: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. OIL"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Add Group'}
                </button>
                {editingId && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ mat_gp: '', mat_description: '' });
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="p-6 bg-slate-50 overflow-y-auto max-h-[400px]">
            <h4 className="text-sm font-bold text-slate-900 mb-4">Existing Groups</h4>
            <div className="space-y-2">
              {materialGroups.map(group => (
                <div key={group.mat_gp} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-slate-400">{group.mat_gp}</p>
                    <p className="text-sm font-bold text-slate-900">{group.mat_description}</p>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        setEditingId(group.mat_gp);
                        setFormData({ mat_gp: group.mat_gp, mat_description: group.mat_description });
                      }}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(group.mat_gp)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {materialGroups.length === 0 && (
                <p className="text-center py-8 text-slate-500 text-sm">No groups found</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const TCodeMasterModal = ({ 
  onClose 
}: { 
  onClose: () => void 
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTCodes = TCODES.filter(t => 
    t.tCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.transactionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.module.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500 rounded-lg">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">TCODE Info (Master Data)</h3>
              <p className="text-xs text-indigo-200">Granular mapping of functional modules to transaction codes for role-based maintenance</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X size={20} className="text-white" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by TCode, Transaction Name, or Module..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all bg-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="bg-slate-100 border-b border-slate-200">
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">TCode</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Parent Module</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Transaction Name</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Action Type</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Role association</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTCodes.map(t => (
                <tr key={t.tCode} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                      {t.tCode}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.parentModule}</p>
                    <p className="text-sm font-medium text-slate-600">{t.module}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{t.transactionName}</p>
                    <p className="text-[10px] text-slate-500 line-clamp-1">{t.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest ${
                      t.actionType === 'Create' ? 'bg-emerald-100 text-emerald-700' :
                      t.actionType === 'Change' ? 'bg-amber-100 text-amber-700' :
                      t.actionType === 'Delete' ? 'bg-rose-100 text-rose-700' :
                      t.actionType === 'Manage' ? 'bg-indigo-100 text-indigo-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {t.actionType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Shield size={12} className="text-slate-400" />
                      <span className="font-mono text-xs text-slate-500">{t.roleAssociation}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTCodes.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center">
              <Shield size={48} className="text-slate-200 mb-4" />
              <p className="text-slate-500 font-medium tracking-tight text-lg">No Transaction Codes found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search query</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <p className="text-xs text-slate-500">
            Total Codes: <span className="font-bold text-slate-900">{TCODES.length}</span>
          </p>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
