
import React, { useState, useEffect, useCallback } from 'react';
import { db, supabase } from './services/supabaseClient';
import { Product, CartItem, Order, User, Language } from './types';
import { INITIAL_PRODUCTS } from './constants';
import Navbar from './components/Navbar';
import ProductGrid from './components/ProductGrid';
import CartDrawer from './components/CartDrawer';
import AdminDashboard from './components/AdminDashboard';
import OrderHistory from './components/OrderHistory';
import GeminiAssistant from './components/GeminiAssistant';
import AuthModal from './components/AuthModal';
import WhatsAppEnrollment from './components/WhatsAppEnrollment';
import AddToHomeScreen from './components/AddToHomeScreen';

const APP_VERSION = "1.4.0-voice";

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('ar');
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeSection, setActiveSection] = useState<'home' | 'admin' | 'orders'>('home');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);

  useEffect(() => {
    const setupAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const syncedUser = await db.syncSocialUser(session.user);
        if (syncedUser) {
          setUser(syncedUser);
          localStorage.setItem('khodarji_user', JSON.stringify(syncedUser));
        }
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          const syncedUser = await db.syncSocialUser(session.user);
          if (syncedUser) {
            setUser(syncedUser);
            localStorage.setItem('khodarji_user', JSON.stringify(syncedUser));
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('khodarji_user');
          setActiveSection('home');
        }
      });

      return () => subscription.unsubscribe();
    };
    setupAuth();

    const init = async () => {
      const savedUserStr = localStorage.getItem('khodarji_user');
      const savedCartStr = localStorage.getItem('khodarji_cart');
      if (savedCartStr) try { setCart(JSON.parse(savedCartStr)); } catch {}
      
      let currentUser: User | null = null;
      if (savedUserStr) {
        try { 
          currentUser = JSON.parse(savedUserStr);
          setUser(currentUser);
          if (currentUser?.role === 'admin' || currentUser?.phone === '790000000') setActiveSection('admin');
        } catch {}
      }

      try {
        setIsProductsLoading(true);
        let fetchedProducts = await db.getProducts();
        
        if (fetchedProducts.length === 0) {
          if (currentUser?.role === 'admin' || currentUser?.phone === '790000000') {
            await db.seedProducts();
            fetchedProducts = await db.getProducts();
          } else {
            fetchedProducts = INITIAL_PRODUCTS;
          }
        }
        
        setProducts(fetchedProducts || []);
      } catch (e) { console.error("Products error", e); } 
      finally { setIsProductsLoading(false); setIsInitializing(false); }
    };
    init();
  }, []);

  useEffect(() => {
    if (user) {
      db.getOrders(user.role === 'admin' ? undefined : user.phone).then(setOrders);
    }
  }, [user]);

  useEffect(() => { localStorage.setItem('khodarji_cart', JSON.stringify(cart)); }, [cart]);

  const handlePhoneIdentification = async (phone: string, city: string, pin?: string) => {
    const { user: authenticatedUser, error } = await db.signIn(phone, city, pin);
    
    if (error === 'INCORRECT_ADMIN_PIN') return { success: false, error: 'INCORRECT_PIN' };
    if (error === 'PIN_REQUIRED') return { success: false, error: 'PIN_REQUIRED' };
    if (error === 'INVALID_PHONE') return { success: false, error: 'INVALID_PHONE' };
    
    if (authenticatedUser || (phone === '790000000' && pin === '123456')) {
      const finalUser = authenticatedUser || { id: 'admin-master-local', phone: '790000000', role: 'admin', city: city || 'Amman', pin: '123456' };
      setUser(finalUser);
      localStorage.setItem('khodarji_user', JSON.stringify(finalUser));
      setIsAuthOpen(false);
      
      if (finalUser.role === 'admin' || finalUser.phone === '790000000') {
        setActiveSection('admin');
      } else {
        setActiveSection('home');
      }
      return { success: true };
    }
    return { success: false, error: error || 'UNKNOWN' };
  };

  const logout = () => {
    db.signOut();
    setUser(null);
    localStorage.removeItem('khodarji_user');
    setActiveSection('home');
  };

  const addToCart = useCallback((product: Product, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      return [...prev, { ...product, quantity }];
    });
    // For voice orders, we might not want to pop open the drawer every time an item is added, 
    // but the user's "Confirm" action will open it anyway.
  }, []);

  const createOrder = async (phone: string, city: string) => {
    if (cart.length === 0) return;
    setIsOrdering(true);
    
    const finalUser = user || { id: `guest-${Date.now()}`, phone, city, role: 'customer' as const };
    if (!user) {
      setUser(finalUser);
      localStorage.setItem('khodarji_user', JSON.stringify(finalUser));
    }

    const subtotal = cart.reduce((sum, item) => sum + ((item.discountPrice || item.price) * item.quantity), 0);
    const deliveryFee = subtotal >= 20 ? 0 : 2;
    const order: Order = {
      id: Math.random().toString(36).substr(2, 6).toUpperCase(),
      customerPhone: finalUser.phone,
      customerCity: finalUser.city || city,
      items: [...cart],
      subtotal, deliveryFee, total: subtotal + deliveryFee,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    try {
      await db.createOrder(order);
      setOrders(prev => [order, ...prev]);
      setCart([]);
      setIsCartOpen(false);
      setActiveSection('orders');
    } catch (e) { 
      console.error("Order error", e); 
      alert(lang === 'ar' ? 'حدث خطأ أثناء إرسال الطلب' : 'Error placing order');
    } finally { 
      setIsOrdering(false); 
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const updated = await db.updateOrderStatus(orderId, 'cancelled');
    if (updated) {
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    await db.deleteOrder(orderId);
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  if (isInitializing) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8fafc] w-full">
      <div className="animate-float mb-6 text-6xl">🥬</div>
      <p className="text-[#266041] font-black text-xl animate-pulse">{lang === 'ar' ? 'خضرجي في خدمتك...' : 'Khodarji is preparing...'}</p>
    </div>
  );

  return (
    <div className={`min-h-screen bg-[#f8fafc] text-slate-900 ${lang === 'ar' ? 'font-tajawal' : 'font-sans'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Navbar 
        lang={lang} setLang={setLang} user={user} 
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        onLoginClick={() => setIsAuthOpen(true)}
        onLogout={logout}
        activeSection={activeSection} setActiveSection={setActiveSection}
        onSearch={setSearchTerm}
      />
      
      <div className="pt-20">
        {(activeSection === 'admin' && (user?.role === 'admin' || user?.phone === '790000000')) ? (
          <AdminDashboard 
            lang={lang} 
            products={products} 
            setProducts={setProducts} 
            orders={orders} 
            onUpdateOrderStatus={async (id, s) => {
              const up = await db.updateOrderStatus(id, s);
              if (up) setOrders(prev => prev.map(o => o.id === id ? up : o));
            }} 
          />
        ) : activeSection === 'orders' && user ? (
          <div className="max-w-4xl mx-auto px-4 mt-4 md:mt-8 pb-24">
            <OrderHistory 
              lang={lang} 
              orders={orders} 
              onCancel={handleCancelOrder}
              onDelete={handleDeleteOrder}
            />
          </div>
        ) : (
          <div className="animate-in fade-in duration-700 w-full pb-24">
            <section className="relative h-[25vh] md:h-[40vh] flex items-center justify-center bg-green-900 overflow-hidden shadow-inner">
               <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600')` }}></div>
               <div className="relative text-center px-6 z-10 text-white">
                 <h1 className="text-3xl md:text-7xl font-black mb-2 md:mb-4 drop-shadow-lg">{lang === 'ar' ? 'خضرتك بلدية وطازجة' : "Jordan's Finest"}</h1>
                 <p className="text-xs md:text-2xl font-bold opacity-90 uppercase tracking-widest">{lang === 'ar' ? 'من مزارعنا لمائدتك' : 'From our farms to your table'}</p>
               </div>
            </section>
            
            <div className="max-w-[1600px] mx-auto px-0 md:px-4 py-4 md:py-8">
              <ProductGrid products={products} lang={lang} onAddToCart={addToCart} searchTerm={searchTerm} isLoading={isProductsLoading} />
            </div>
            
            {!searchTerm && <div className="max-w-7xl mx-auto px-4 py-8 md:py-16"><WhatsAppEnrollment lang={lang} /></div>}
            
            <div className="text-center opacity-20 text-[10px] py-10">
              v{APP_VERSION} &copy; Khodarji 2024
            </div>
          </div>
        )}
      </div>

      <CartDrawer 
        isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cart={cart} lang={lang}
        onUpdateQuantity={(id, q) => setCart(prev => prev.map(i => i.id === id ? {...i, quantity: Math.max(0.5, q)} : i))}
        onRemove={(id) => setCart(prev => prev.filter(i => i.id !== id))}
        onCheckout={createOrder} phone={user?.phone || ''} city={user?.city || ''} isOrdering={isOrdering}
      />
      
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLogin={handlePhoneIdentification} lang={lang} />
      
      <GeminiAssistant 
        cartItems={cart} 
        products={products} 
        lang={lang} 
        onAddToCart={addToCart} 
      />
      
      <AddToHomeScreen lang={lang} />
    </div>
  );
};

export default App;
