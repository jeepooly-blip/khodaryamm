import React, { useState, useEffect } from 'react';
import { Product, Order, Language, Enrollment } from '../types';
import { db } from '../services/supabaseClient';

interface AdminDashboardProps {
  lang: Language;
  products: Product[];
  setProducts: (p: Product[]) => void;
  orders: Order[];
  onUpdateOrderStatus: (id: string, status: Order['status']) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ lang, products, setProducts, orders: initialOrders, onUpdateOrderStatus }) => {
  const [tab, setTab] = useState<'products' | 'orders' | 'subscribers' | 'settings'>('products');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>(initialOrders);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Health Status
  const [dbStatus, setDbStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [aiStatus, setAiStatus] = useState<'checking' | 'ok' | 'error'>('checking');

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    const isDbOk = await db.testConnection();
    setDbStatus(isDbOk ? 'ok' : 'error');
    setAiStatus(process.env.API_KEY ? 'ok' : 'error');
  };

  useEffect(() => {
    if (tab === 'subscribers') loadEnrollments();
    if (tab === 'orders') loadAllOrders();
  }, [tab]);

  const loadEnrollments = async () => {
    setLoading(true);
    const data = await db.getEnrollments();
    setEnrollments(data);
    setLoading(false);
  };

  const loadAllOrders = async () => {
    setLoading(true);
    const data = await db.getOrders();
    setAllOrders(data);
    setLoading(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm(lang === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure?')) {
      await db.deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا الطلب نهائياً؟' : 'Are you sure you want to delete this order?')) {
      await db.deleteOrder(id);
      setAllOrders(allOrders.filter(o => o.id !== id));
    }
  };

  const handleStatusChange = async (id: string, status: Order['status']) => {
    await onUpdateOrderStatus(id, status);
    setAllOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const product = { ...editingProduct, id: editingProduct.id || Math.random().toString(36).substr(2, 9) } as Product;
    await db.saveProduct(product);
    const updated = await db.getProducts();
    setProducts(updated);
    setEditingProduct(null);
  };

  return (
    <div className="py-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-black text-indigo-950 flex items-center gap-4">
            <span className="bg-indigo-100 p-3 rounded-[2rem] shadow-sm">🛡️</span>
            {lang === 'ar' ? 'لوحة تحكم المدير' : 'Admin Terminal'}
          </h2>
          <div className="flex items-center gap-4 mt-2 ml-2">
            <p className="text-indigo-400 font-bold text-xs uppercase tracking-[0.2em]">
              Management & Inventory
            </p>
            <div className="flex items-center gap-2 border-l border-indigo-100 pl-4">
              <span className={`w-2 h-2 rounded-full ${dbStatus === 'ok' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse' : dbStatus === 'checking' ? 'bg-gray-300' : 'bg-red-500'}`}></span>
              <span className="text-[10px] font-black text-indigo-900/60 uppercase">DB</span>
              
              <span className={`w-2 h-2 rounded-full ml-2 ${aiStatus === 'ok' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)] animate-pulse' : aiStatus === 'checking' ? 'bg-gray-300' : 'bg-red-500'}`}></span>
              <span className="text-[10px] font-black text-indigo-900/60 uppercase">AI</span>
            </div>
          </div>
        </div>
        
        {tab === 'products' && (
          <button 
            onClick={() => setEditingProduct({ name: { en: '', ar: '' }, category: 'vegetables', price: 0, unit: 'KG', organic: false, image: '' })}
            className="bg-indigo-900 hover:bg-indigo-800 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2"
          >
            <i className="bi bi-plus-lg"></i>
            {lang === 'ar' ? 'إضافة منتج' : 'Add Product'}
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-64 space-y-2">
          <button onClick={() => setTab('products')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${tab === 'products' ? 'bg-indigo-900 text-white shadow-xl' : 'bg-white text-indigo-400 border border-indigo-50'}`}>
            <i className="bi bi-box-seam"></i> {lang === 'ar' ? 'المخزون' : 'Inventory'}
          </button>
          <button onClick={() => setTab('orders')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${tab === 'orders' ? 'bg-indigo-900 text-white shadow-xl' : 'bg-white text-indigo-400 border border-indigo-50'}`}>
            <i className="bi bi-receipt"></i> {lang === 'ar' ? 'الطلبات' : 'Orders'}
          </button>
          <button onClick={() => setTab('subscribers')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${tab === 'subscribers' ? 'bg-indigo-900 text-white shadow-xl' : 'bg-white text-indigo-400 border border-indigo-50'}`}>
            <i className="bi bi-people"></i> {lang === 'ar' ? 'المشتركون' : 'Subscribers'}
          </button>
          <button onClick={() => setTab('settings')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${tab === 'settings' ? 'bg-indigo-900 text-white shadow-xl' : 'bg-white text-indigo-400 border border-indigo-50'}`}>
            <i className="bi bi-gear"></i> {lang === 'ar' ? 'إعدادات المنصة' : 'Cloud Config'}
          </button>
        </div>

        <div className="flex-1">
          {tab === 'products' ? (
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-indigo-50 overflow-hidden">
              <table className="w-full text-left" dir="ltr">
                <thead className="bg-indigo-50/50 text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-5">Item</th>
                    <th className="px-8 py-5">Category</th>
                    <th className="px-8 py-5">Price</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-50/30">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-indigo-50/20 transition-colors group">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <img src={p.image} className="w-10 h-10 rounded-lg object-cover" />
                          <span className="font-black text-indigo-950 text-sm">{p.name[lang]}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4 uppercase text-[10px] font-black text-indigo-400">{p.category}</td>
                      <td className="px-8 py-4 font-mono font-black text-indigo-950">{p.price.toFixed(2)} JD</td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setEditingProduct(p)} className="p-2 text-indigo-400 hover:text-indigo-900 transition-all"><i className="bi bi-pencil-square"></i></button>
                          <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-red-300 hover:text-red-500 transition-all"><i className="bi bi-trash3"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : tab === 'orders' ? (
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-indigo-50 overflow-hidden">
              <div className="p-6 border-b border-indigo-50 flex justify-between items-center">
                <h3 className="font-black text-indigo-950">{lang === 'ar' ? 'جميع الطلبات' : 'All Customer Orders'}</h3>
                <button onClick={loadAllOrders} className="text-indigo-600 p-2 hover:rotate-180 transition-transform"><i className="bi bi-arrow-clockwise"></i></button>
              </div>
              <table className="w-full text-left" dir="ltr">
                <thead className="bg-indigo-50/50 text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-5">ID</th>
                    <th className="px-6 py-5">Customer</th>
                    <th className="px-6 py-5">Total</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-50/30">
                  {allOrders.map(o => (
                    <tr key={o.id} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-black">#{o.id}</td>
                      <td className="px-6 py-4">
                        <p className="font-black text-indigo-950 text-xs">{o.customerPhone}</p>
                        <p className="text-[10px] text-indigo-300">{o.customerCity}</p>
                      </td>
                      <td className="px-6 py-4 font-black text-indigo-950 text-xs">{o.total.toFixed(2)} JD</td>
                      <td className="px-6 py-4">
                        <select 
                          value={o.status} 
                          onChange={(e) => handleStatusChange(o.id, e.target.value as any)}
                          className={`text-[10px] font-black uppercase tracking-widest rounded-lg px-2 py-1 border-0 focus:ring-2 focus:ring-indigo-500 ${
                            o.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                            o.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => setSelectedOrder(o)} className="text-indigo-400 hover:text-indigo-900"><i className="bi bi-eye"></i></button>
                        <button onClick={() => handleDeleteOrder(o.id)} className="text-red-300 hover:text-red-500"><i className="bi bi-trash"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : tab === 'subscribers' ? (
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-indigo-50 overflow-hidden">
              <div className="p-6 border-b border-indigo-50 flex justify-between items-center">
                 <h3 className="font-black text-indigo-950">{lang === 'ar' ? 'قائمة المشتركين' : 'WhatsApp Subscriber List'}</h3>
                 <button onClick={loadEnrollments} className="text-indigo-600 hover:rotate-180 transition-transform p-2"><i className="bi bi-arrow-clockwise"></i></button>
              </div>
              <table className="w-full text-left" dir="ltr">
                <thead className="bg-indigo-50/50 text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-5">Name</th>
                    <th className="px-8 py-5">Phone Number</th>
                    <th className="px-8 py-5">Joined Date</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-50/30">
                  {loading ? (
                    <tr><td colSpan={4} className="p-12 text-center text-indigo-300 font-black">Loading...</td></tr>
                  ) : enrollments.length === 0 ? (
                    <tr><td colSpan={4} className="p-12 text-center text-gray-400 font-bold">No subscribers yet.</td></tr>
                  ) : (
                    enrollments.map(e => (
                      <tr key={e.id} className="hover:bg-indigo-50/20 transition-colors">
                        <td className="px-8 py-4 font-black text-indigo-950 text-sm">{e.name || 'Anonymous'}</td>
                        <td className="px-8 py-4 font-mono font-black text-indigo-900">+962 {e.phone}</td>
                        <td className="px-8 py-4 text-xs text-indigo-400">{new Date(e.createdAt).toLocaleDateString()}</td>
                        <td className="px-8 py-4 text-right">
                          <button onClick={() => window.open(`https://wa.me/962${e.phone}`, '_blank')} className="p-2 text-green-500 hover:scale-110 transition-transform"><i className="bi bi-whatsapp"></i></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="bg-indigo-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-2xl font-black mb-2 flex items-center gap-3">
                    <i className="bi bi-cloud-arrow-up"></i>
                    Vercel Environment Setup
                  </h3>
                  <p className="text-indigo-200 text-sm font-bold mb-8 max-w-xl">
                    To ensure your database and AI features are secure and stable on Vercel, add these variables in your Vercel Dashboard under <b>Project Settings &gt; Environment Variables</b>.
                  </p>

                  <div className="space-y-4">
                    {[
                      { key: 'SUPABASE_URL', val: 'https://xeagsfoxbtmqeazrnblm.supabase.co' },
                      { key: 'SUPABASE_ANON_KEY', val: 'sb_publishable_tZzJ1zkrvLaKSPL1y1dLXQ_WNI95QGh' },
                      { key: 'API_KEY', val: 'Your_Gemini_API_Key' }
                    ].map(env => (
                      <div key={env.key} className="bg-white/10 border border-white/20 p-4 rounded-2xl flex items-center justify-between group hover:bg-white/20 transition-colors">
                        <div>
                          <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Variable Name</p>
                          <code className="text-sm font-black text-white">{env.key}</code>
                        </div>
                        <button 
                          onClick={() => { navigator.clipboard.writeText(env.val); alert('Copied value!'); }}
                          className="p-2 text-indigo-300 hover:text-white transition-colors"
                        >
                          <i className="bi bi-copy"></i>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* New Vercel Environment Debugger */}
                  <div className="mt-8 p-6 bg-black/30 rounded-3xl border border-white/10">
                    <h4 className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-4">Detected in Vercel Runtime</h4>
                    <div className="space-y-2">
                       <div className="flex items-center justify-between text-xs">
                          <span className="opacity-60">SUPABASE_URL</span>
                          <span className={process.env.SUPABASE_URL ? 'text-green-400 font-black' : 'text-red-400 font-black'}>{process.env.SUPABASE_URL ? 'PRESENT ✓' : 'MISSING ✗'}</span>
                       </div>
                       <div className="flex items-center justify-between text-xs">
                          <span className="opacity-60">SUPABASE_ANON_KEY</span>
                          <span className={process.env.SUPABASE_ANON_KEY ? 'text-green-400 font-black' : 'text-red-400 font-black'}>{process.env.SUPABASE_ANON_KEY ? 'PRESENT ✓' : 'MISSING ✗'}</span>
                       </div>
                       <div className="flex items-center justify-between text-xs">
                          <span className="opacity-60">API_KEY (Gemini)</span>
                          <span className={process.env.API_KEY ? 'text-green-400 font-black' : 'text-red-400 font-black'}>{process.env.API_KEY ? 'PRESENT ✓' : 'MISSING ✗'}</span>
                       </div>
                    </div>
                  </div>

                  <div className="mt-8 p-4 bg-orange-500/20 border border-orange-500/30 rounded-2xl">
                    <p className="text-xs font-bold text-orange-200">
                      💡 Tip: After adding these variables in Vercel, you <b>must click "Redeploy"</b> in the Vercel dashboard.
                    </p>
                  </div>
                </div>
                <div className="absolute -bottom-10 -right-10 text-[10rem] text-white/5 pointer-events-none">
                  <i className="bi bi-vimeo"></i>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {editingProduct && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="absolute inset-0 bg-indigo-950/60" onClick={() => setEditingProduct(null)} />
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-indigo-950 mb-6">Product Editor</h3>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Name (EN/AR)</label>
                  <div className="space-y-2">
                    <input required placeholder="English" value={editingProduct.name?.en} onChange={e => setEditingProduct({...editingProduct, name: {...editingProduct.name!, en: e.target.value}})} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm font-bold" />
                    <input required placeholder="العربية" dir="rtl" value={editingProduct.name?.ar} onChange={e => setEditingProduct({...editingProduct, name: {...editingProduct.name!, ar: e.target.value}})} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm font-bold font-tajawal" />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Category</label>
                  <select value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value as any})} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-black uppercase">
                    <option value="vegetables">Vegetables</option>
                    <option value="fruits">Fruits</option>
                    <option value="other">Other</option>
                    <option value="organic">Organic</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Price / JD</label>
                  <input type="number" step="0.01" required value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm font-black" />
                </div>
                <div className="col-span-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Image URL</label>
                  <input required value={editingProduct.image} onChange={e => setEditingProduct({...editingProduct, image: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-mono" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-indigo-900 text-white py-4 rounded-xl font-black">Save Changes</button>
                <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 bg-gray-50 text-gray-400 py-4 rounded-xl font-black uppercase text-[10px]">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="absolute inset-0 bg-indigo-950/60" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-indigo-950">Order Details #{selectedOrder.id}</h3>
              <button onClick={() => setSelectedOrder(null)} className="p-2 text-gray-400 hover:text-indigo-950"><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="flex-grow overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4 bg-indigo-50/50 p-4 rounded-2xl">
                <div><p className="text-[9px] font-black text-indigo-300 uppercase">Phone</p><p className="font-black">{selectedOrder.customerPhone}</p></div>
                <div><p className="text-[9px] font-black text-indigo-300 uppercase">City</p><p className="font-black">{selectedOrder.customerCity}</p></div>
              </div>
              <div className="space-y-3">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ordered Items</p>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                    <div className="flex items-center gap-3">
                      <img src={item.image} className="w-10 h-10 rounded-lg object-cover" />
                      <div><p className="font-bold">{item.name[lang]}</p><p className="text-[10px] text-gray-400">{item.quantity} {item.unit}</p></div>
                    </div>
                    <p className="font-black">{(item.price * item.quantity).toFixed(2)} JD</p>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-dashed border-gray-200 space-y-2">
                <div className="flex justify-between text-xs text-gray-500"><span>Subtotal</span><span>{selectedOrder.subtotal.toFixed(2)} JD</span></div>
                <div className="flex justify-between text-xs text-gray-500"><span>Delivery</span><span>{selectedOrder.deliveryFee.toFixed(2)} JD</span></div>
                <div className="flex justify-between text-xl font-black text-indigo-950"><span>Total</span><span>{selectedOrder.total.toFixed(2)} JD</span></div>
              </div>
            </div>
            <button onClick={() => setSelectedOrder(null)} className="mt-6 w-full bg-indigo-900 text-white py-3 rounded-xl font-black">Close Details</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
