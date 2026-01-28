
import React, { useState, useEffect, useRef } from 'react';
import { Product, Order, Language, Enrollment } from '../types';
import { db } from '../services/supabaseClient';

interface AdminDashboardProps {
  lang: Language;
  products: Product[];
  setProducts: (p: Product[]) => void;
  orders: Order[];
  onUpdateOrderStatus: (id: string, status: Order['status']) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ lang, products, setProducts, orders, onUpdateOrderStatus }) => {
  const [tab, setTab] = useState<'products' | 'orders' | 'subscribers' | 'settings'>('products');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [dbStatus, setDbStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [aiStatus, setAiStatus] = useState<'checking' | 'ok' | 'error'>('checking');

  useEffect(() => { checkHealth(); }, []);

  const checkHealth = async () => {
    const isDbOk = await db.testConnection();
    setDbStatus(isDbOk ? 'ok' : 'error');
    setAiStatus(process.env.API_KEY ? 'ok' : 'error');
  };

  useEffect(() => { if (tab === 'subscribers') loadEnrollments(); }, [tab]);

  const loadEnrollments = async () => {
    setLoading(true);
    const data = await db.getEnrollments();
    setEnrollments(data);
    setLoading(false);
  };

  const handleExportCSV = () => {
    const headers = ['id', 'name_en', 'name_ar', 'category', 'price', 'discountPrice', 'image', 'unit', 'organic'];
    const rows = products.map(p => [
      p.id,
      `"${p.name.en.replace(/"/g, '""')}"`,
      `"${p.name.ar.replace(/"/g, '""')}"`,
      p.category,
      p.price,
      p.discountPrice || '',
      p.image,
      p.unit,
      p.organic
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `khodarji_inventory_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const parsedProducts: Product[] = lines.slice(1).map(line => {
        const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!values || values.length < 9) return null;
        const clean = (val: string) => val.replace(/^"|"$/g, '').replace(/""/g, '"');
        return {
          id: clean(values[0]),
          name: { en: clean(values[1]), ar: clean(values[2]) },
          category: clean(values[3]) as any,
          price: parseFloat(clean(values[4])),
          discountPrice: clean(values[5]) ? parseFloat(clean(values[5])) : undefined,
          image: clean(values[6]),
          unit: clean(values[7]),
          organic: clean(values[8]).toLowerCase() === 'true'
        };
      }).filter(p => p !== null) as Product[];
      if (parsedProducts.length > 0) {
        if (window.confirm(lang === 'ar' ? `استيراد ${parsedProducts.length} منتج؟` : `Import ${parsedProducts.length} items?`)) {
          setIsSeeding(true);
          await db.bulkSaveProducts(parsedProducts);
          setProducts(await db.getProducts());
          setIsSeeding(false);
          alert('Success!');
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSeedDatabase = async () => {
    if (window.confirm(lang === 'ar' ? 'استيراد المنتجات الأساسية؟' : 'Seed base products?')) {
      setIsSeeding(true);
      await db.seedProducts();
      setProducts(await db.getProducts());
      setIsSeeding(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm(lang === 'ar' ? 'تأكيد الحذف؟' : 'Confirm delete?')) {
      await db.deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const product = { 
      ...editingProduct, 
      id: editingProduct.id || Math.random().toString(36).substr(2, 9),
      description: editingProduct.description || { en: '', ar: '' }
    } as Product;
    await db.saveProduct(product);
    setProducts(await db.getProducts());
    setEditingProduct(null);
  };

  const openCustomerChat = (phone: string) => {
    window.open(`https://wa.me/962${phone}`, '_blank');
  };

  return (
    <div className="py-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto px-4">
      <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImportCSV} className="hidden" />
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-black text-indigo-950 flex items-center gap-4">
            <span className="bg-indigo-100 p-3 rounded-[2rem] shadow-sm">🛡️</span>
            {lang === 'ar' ? 'لوحة تحكم المدير' : 'Admin Terminal'}
          </h2>
          <div className="flex items-center gap-4 mt-2 ml-2">
            <p className="text-indigo-400 font-bold text-xs uppercase tracking-[0.2em]">Management & Inventory</p>
            <div className="flex items-center gap-2 border-l border-indigo-100 pl-4">
              <span className={`w-2 h-2 rounded-full ${dbStatus === 'ok' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-red-500'}`}></span>
              <span className="text-[10px] font-black text-indigo-900/60 uppercase">DB</span>
              <span className={`w-2 h-2 rounded-full ml-2 ${aiStatus === 'ok' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)] animate-pulse' : 'bg-red-500'}`}></span>
              <span className="text-[10px] font-black text-indigo-900/60 uppercase">AI</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {tab === 'products' && (
            <>
              <button onClick={handleExportCSV} className="bg-white hover:bg-gray-50 text-gray-600 px-4 py-3 rounded-2xl font-black text-xs border border-gray-100 shadow-sm flex items-center gap-2"><i className="bi bi-download"></i>{lang === 'ar' ? 'تصدير' : 'Export'}</button>
              <button onClick={() => fileInputRef.current?.click()} className="bg-white hover:bg-gray-50 text-indigo-600 px-4 py-3 rounded-2xl font-black text-xs border border-indigo-100 shadow-sm flex items-center gap-2"><i className="bi bi-upload"></i>{lang === 'ar' ? 'استيراد' : 'Import'}</button>
              <button onClick={handleSeedDatabase} disabled={isSeeding} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl font-black text-xs shadow-sm flex items-center gap-2 transition-all disabled:opacity-50">
                {isSeeding ? <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /> : <i className="bi bi-database-fill-down" />}
                {lang === 'ar' ? 'تأسيس' : 'Seed'}
              </button>
              <button onClick={() => setEditingProduct({ name: { en: '', ar: '' }, category: 'vegetables', price: 0, unit: 'KG', organic: false, image: '', description: { en: '', ar: '' } })} className="bg-indigo-900 hover:bg-indigo-800 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2">
                <i className="bi bi-plus-lg"></i>{lang === 'ar' ? 'إضافة منتج' : 'Add Product'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-64 space-y-2">
          <button onClick={() => setTab('products')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${tab === 'products' ? 'bg-indigo-900 text-white shadow-xl' : 'bg-white text-indigo-400 border border-indigo-50'}`}><i className="bi bi-box-seam"></i> {lang === 'ar' ? 'المخزون' : 'Inventory'}</button>
          <button onClick={() => setTab('orders')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${tab === 'orders' ? 'bg-indigo-900 text-white shadow-xl' : 'bg-white text-indigo-400 border border-indigo-50'}`}><i className="bi bi-receipt"></i> {lang === 'ar' ? 'الطلبات' : 'Orders'}</button>
          <button onClick={() => setTab('subscribers')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${tab === 'subscribers' ? 'bg-indigo-900 text-white shadow-xl' : 'bg-white text-indigo-400 border border-indigo-50'}`}><i className="bi bi-people"></i> {lang === 'ar' ? 'المشتركون' : 'Subscribers'}</button>
          <button onClick={() => setTab('settings')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${tab === 'settings' ? 'bg-indigo-900 text-white shadow-xl' : 'bg-white text-indigo-400 border border-indigo-50'}`}><i className="bi bi-gear"></i> {lang === 'ar' ? 'إعدادات' : 'Config'}</button>
        </div>

        <div className="flex-1">
          {tab === 'products' ? (
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-indigo-50 overflow-hidden">
              <table className="w-full text-left" dir="ltr">
                <thead className="bg-indigo-50/50 text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-5">Item</th>
                    <th className="px-8 py-5">Category</th>
                    <th className="px-8 py-5">Price (Base / Deal)</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-50/30">
                  {products.length === 0 ? (
                    <tr><td colSpan={4} className="py-20 text-center"><button onClick={handleSeedDatabase} className="text-indigo-600 font-black underline">{lang === 'ar' ? 'استيراد 70+ منتج الآن' : 'Seed 70+ products now'}</button></td></tr>
                  ) : (
                    products.map(p => (
                      <tr key={p.id} className="hover:bg-indigo-50/20 transition-colors group">
                        <td className="px-8 py-4"><div className="flex items-center gap-3"><img src={p.image} className="w-10 h-10 rounded-lg object-cover" /><span className="font-black text-indigo-950 text-sm">{p.name[lang]}</span></div></td>
                        <td className="px-8 py-4 uppercase text-[10px] font-black text-indigo-400">{p.category}</td>
                        <td className="px-8 py-4 font-mono font-black text-indigo-950">
                          {p.price.toFixed(2)} / <span className="text-orange-500">{p.discountPrice ? p.discountPrice.toFixed(2) : '--'}</span> JD
                        </td>
                        <td className="px-8 py-4 text-right"><div className="flex items-center justify-end gap-2"><button onClick={() => setEditingProduct(p)} className="p-2 text-indigo-400 hover:text-indigo-900"><i className="bi bi-pencil-square"></i></button><button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-red-300 hover:text-red-500"><i className="bi bi-trash3"></i></button></div></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : tab === 'orders' ? (
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-indigo-50 overflow-hidden">
              <table className="w-full text-left" dir="ltr">
                <thead className="bg-indigo-50/50 text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                  <tr><th className="px-6 py-5">ID</th><th className="px-6 py-5">Customer</th><th className="px-6 py-5">Total</th><th className="px-6 py-5">Status</th><th className="px-6 py-5 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-indigo-50/30">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-black">#{o.id}</td>
                      <td className="px-6 py-4"><p className="font-black text-indigo-950 text-xs">{o.customerPhone}</p><p className="text-[10px] text-indigo-300">{o.customerCity}</p></td>
                      <td className="px-6 py-4 font-black text-indigo-950 text-xs">{o.total.toFixed(2)} JD</td>
                      <td className="px-6 py-4">
                        <select value={o.status} onChange={(e) => onUpdateOrderStatus(o.id, e.target.value as any)} className="text-[10px] font-black uppercase tracking-widest rounded-lg px-2 py-1 bg-gray-50">
                          <option value="pending">Pending</option><option value="processing">Processing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right"><button onClick={() => setSelectedOrder(o)} className="text-indigo-400 hover:text-indigo-950 transition-colors"><i className="bi bi-eye-fill text-xl"></i></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : tab === 'subscribers' ? (
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-indigo-50 overflow-hidden">
              <table className="w-full text-left" dir="ltr">
                <thead className="bg-indigo-50/50 text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                  <tr><th className="px-8 py-5">Name</th><th className="px-8 py-5">Phone</th><th className="px-8 py-5 text-right">Chat</th></tr>
                </thead>
                <tbody className="divide-y divide-indigo-50/30">
                  {enrollments.map(e => (
                    <tr key={e.id} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="px-8 py-4 font-black text-indigo-950 text-sm">{e.name || 'Anonymous'}</td>
                      <td className="px-8 py-4 font-mono font-black text-indigo-900">+962 {e.phone}</td>
                      <td className="px-8 py-4 text-right"><button onClick={() => window.open(`https://wa.me/962${e.phone}`, '_blank')} className="text-green-500"><i className="bi bi-whatsapp"></i></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-indigo-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
              <h3 className="text-2xl font-black mb-2">Platform Setup</h3>
              <p className="text-indigo-200 text-sm font-bold mb-8">Environment Variables for Vercel:</p>
              <div className="space-y-4">
                {['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'API_KEY'].map(k => (
                  <div key={k} className="bg-white/10 p-4 rounded-2xl flex items-center justify-between border border-white/20">
                    <code className="text-sm font-black">{k}</code>
                    <button onClick={() => navigator.clipboard.writeText(k)} className="text-indigo-300"><i className="bi bi-copy"></i></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {editingProduct && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="absolute inset-0 bg-indigo-950/60" onClick={() => setEditingProduct(null)} />
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto max-h-[95vh] animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-indigo-950 mb-6">Product Management</h3>
            <form onSubmit={handleSaveProduct} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Localized Name</label>
                  <input required placeholder="English Name" value={editingProduct.name?.en} onChange={e => setEditingProduct({...editingProduct, name: {...editingProduct.name!, en: e.target.value}})} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm font-bold" />
                  <input required placeholder="الاسم بالعربية" dir="rtl" value={editingProduct.name?.ar} onChange={e => setEditingProduct({...editingProduct, name: {...editingProduct.name!, ar: e.target.value}})} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm font-bold font-tajawal" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Category</label>
                  <select value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value as any})} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-black uppercase">
                    <option value="vegetables">Vegetables</option><option value="fruits">Fruits</option><option value="other">Other</option><option value="organic">Organic</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Unit Type</label>
                  <input required value={editingProduct.unit} onChange={e => setEditingProduct({...editingProduct, unit: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm font-black" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Regular Price (JD)</label>
                  <input type="number" step="0.01" required value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm font-black" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-orange-400 uppercase tracking-widest block">Discount Price (JD) - Optional</label>
                  <input type="number" step="0.01" value={editingProduct.discountPrice || ''} onChange={e => setEditingProduct({...editingProduct, discountPrice: e.target.value ? parseFloat(e.target.value) : undefined})} className="w-full bg-orange-50 border border-orange-100 rounded-xl p-3 text-sm font-black text-orange-600" placeholder="Empty = No Deal" />
                </div>
                <div className="col-span-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Image URL</label>
                  <input required value={editingProduct.image} onChange={e => setEditingProduct({...editingProduct, image: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-mono" />
                </div>
                <div className="col-span-2 flex items-center gap-3 bg-indigo-50 p-4 rounded-2xl">
                  <input type="checkbox" checked={editingProduct.organic} onChange={e => setEditingProduct({...editingProduct, organic: e.target.checked})} className="w-5 h-5 rounded accent-indigo-900" id="org_check" />
                  <label htmlFor="org_check" className="text-xs font-black text-indigo-900 uppercase">This is an Organic Baladi Product</label>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="submit" className="flex-1 bg-indigo-900 text-white py-4 rounded-xl font-black shadow-lg">Save Changes</button>
                <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 bg-gray-50 text-gray-400 py-4 rounded-xl font-black uppercase text-[10px]">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="absolute inset-0 bg-indigo-950/60" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-white w-full max-w-3xl rounded-[2.5rem] p-0 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-8 py-6 bg-indigo-950 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl">
                  <i className="bi bi-receipt-cutoff text-2xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-black leading-none mb-1">Order Details #{selectedOrder.id}</h3>
                  <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em]">
                    {new Date(selectedOrder.createdAt).toLocaleString(lang === 'ar' ? 'ar-JO' : 'en-US')}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <i className="bi bi-x-lg text-xl"></i>
              </button>
            </div>

            <div className="flex-grow overflow-y-auto">
              <div className="p-8 space-y-8">
                {/* Customer & Status Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Customer Information</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-xl text-indigo-600 shadow-sm">
                            <i className="bi bi-telephone-fill"></i>
                          </div>
                          <span className="font-black text-indigo-950 tracking-widest">+962 {selectedOrder.customerPhone}</span>
                        </div>
                        <button 
                          onClick={() => openCustomerChat(selectedOrder.customerPhone)}
                          className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-xl shadow-lg shadow-green-500/20 transition-all active:scale-90"
                        >
                          <i className="bi bi-whatsapp"></i>
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-xl text-indigo-600 shadow-sm">
                          <i className="bi bi-geo-alt-fill"></i>
                        </div>
                        <span className="font-black text-indigo-950 uppercase text-xs">{selectedOrder.customerCity}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Management</h4>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-white p-2 rounded-xl text-indigo-600 shadow-sm">
                          <i className="bi bi-info-circle-fill"></i>
                        </div>
                        <select 
                          value={selectedOrder.status} 
                          onChange={(e) => onUpdateOrderStatus(selectedOrder.id, e.target.value as any)} 
                          className="flex-1 bg-white border border-indigo-100 rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-widest text-indigo-950 focus:outline-none"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-xl text-center text-[10px] font-black uppercase tracking-widest ${
                      selectedOrder.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                      selectedOrder.status === 'completed' ? 'bg-green-100 text-green-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      Current Status: {selectedOrder.status}
                    </div>
                  </div>
                </div>

                {/* Items Breakdown */}
                <div>
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 border-b border-indigo-50 pb-2">Item Breakdown</h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, idx) => {
                      const activePrice = item.discountPrice && item.discountPrice < item.price ? item.discountPrice : item.price;
                      return (
                        <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-shadow group">
                          <div className="flex items-center gap-4">
                            <img src={item.image} className="w-14 h-14 rounded-xl object-cover border border-gray-100 shadow-sm" alt="" />
                            <div>
                              <p className="font-black text-indigo-950 text-sm mb-1">{item.name[lang]}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-indigo-400 uppercase bg-indigo-50 px-2 py-0.5 rounded-md">
                                  {item.quantity} {item.unit}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400">@ {activePrice.toFixed(2)} JD</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-indigo-950">{(activePrice * item.quantity).toFixed(2)} JD</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-indigo-950 text-white rounded-[2rem] p-8 shadow-xl">
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold opacity-60">
                      <span>Subtotal</span>
                      <span>{selectedOrder.subtotal.toFixed(2)} JD</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold opacity-60">
                      <span>Delivery Fee</span>
                      <span>{selectedOrder.deliveryFee === 0 ? 'FREE' : `${selectedOrder.deliveryFee.toFixed(2)} JD`}</span>
                    </div>
                    <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                      <span className="text-sm font-black uppercase tracking-widest">Grand Total</span>
                      <span className="text-3xl font-black text-orange-400">{selectedOrder.total.toFixed(2)} <span className="text-xs opacity-60">JD</span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4 shrink-0">
              <button 
                onClick={() => openCustomerChat(selectedOrder.customerPhone)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-green-600/20 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                <i className="bi bi-whatsapp text-xl"></i>
                Contact via WhatsApp
              </button>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="px-8 bg-white border border-gray-200 text-gray-400 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
