
import React, { useState, useEffect, useCallback } from 'react';
import { db } from './services/supabaseClient';
import { Product, CartItem, Order, User, Language } from './types';
import Navbar from './components/Navbar';
import ProductGrid from './components/ProductGrid';
import CartDrawer from './components/CartDrawer';
import AdminDashboard from './components/AdminDashboard';
import OrderHistory from './components/OrderHistory';
import GeminiAssistant from './components/GeminiAssistant';
import AuthModal from './components/AuthModal';
import SpecialDeals from './components/SpecialDeals';
import WhatsAppEnrollment from './components/WhatsAppEnrollment';
import AddToHomeScreen from './components/AddToHomeScreen';

// App Version for Deployment Verification
const APP_VERSION = "1.1.2-stable";
const BUILD_DATE = new Date().toLocaleString();

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
    // Log environment state for debugging Vercel issues
    console.log(`[Khodarji] Live Version: ${APP_VERSION} | Deployment Date: ${BUILD_DATE}`);
    
    const init = async () => {
      try {
        const savedUserStr = localStorage.getItem('khodarji_user');
        const savedCartStr = localStorage.getItem('khodarji_cart');
        
        if (savedCartStr) {
          try {
            setCart(JSON.parse(savedCartStr));
          } catch (e) {
            localStorage.removeItem('khodarji_cart');
          }
        }

        if (savedUserStr) {
          try {
            const parsedUser = JSON.parse(savedUserStr);
            if (parsedUser && parsedUser.phone) {
              setUser(parsedUser);
              const fetchedOrders = await db.getOrders(parsedUser.role === 'admin' ? undefined : parsedUser.phone);
              setOrders(fetchedOrders || []);
            }
          } catch (e) {
            localStorage.removeItem('khodarji_user');
          }
        }
      } catch (e) {
        console.error("Init error", e);
      } finally {
        setTimeout(() => setIsInitializing(false), 800);
      }

      try {
        setIsProductsLoading(true);
        const fetchedProducts = await db.getProducts();
        setProducts(fetchedProducts || []);
      } catch (e) {
        console.error("Products error", e);
      } finally {
        setIsProductsLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    localStorage.setItem('khodarji_cart', JSON.stringify(cart));
  }, [cart]);

  const handlePhoneIdentification = async (phone: string, city: string, pin?: string) => {
    try {
      const { user: newUser, error } = await db.signIn(phone, city, pin);
      if (error === 'INCORRECT_ADMIN_PIN') {
        return { success: false, error: 'INCORRECT_PIN' };
      }
      
      if (newUser) {
        setUser(newUser);
        localStorage.setItem('khodarji_user', JSON.stringify(newUser));
        const fetchedOrders = await db.getOrders(newUser.role === 'admin' ? undefined : newUser.phone);
        setOrders(fetchedOrders || []);
        setIsAuthOpen(false);
        if (newUser.role === 'admin') setActiveSection('admin');
        return { success: true };
      }
    } catch (e) {
      console.error("Login error", e);
    }
    return { success: false };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('khodarji_user');
    setActiveSection('home');
    setOrders([]);
  };

  const addToCart = useCallback((product: Product, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { ...product, quantity }];
    });
    setIsCartOpen(true);
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateCartQuantity = useCallback((id: string, quantity: number) => {
    setCart(prev => prev.map(item => id === item.id ? { ...item, quantity: Math.max(0.5, quantity) } : item));
  }, []);

  const updateOrderStatus = async (id: string, status: Order['status']) => {
    const updatedOrder = await db.updateOrderStatus(id, status);
    if (updatedOrder) {
      setOrders(prev => prev.map(o => o.id === id ? updatedOrder : o));
    }
  };

  const createOrder = async (phone: string, city: string) => {
    if (cart.length === 0) return;
    setIsOrdering(true);
    let currentUser = user;
    if (!currentUser || currentUser.phone !== phone) {
      const result = await handlePhoneIdentification(phone, city);
      if (!result.success) {
        setIsOrdering(false);
        return;
      }
      currentUser = user; 
    }
    
    const currentStorageUser = JSON.parse(localStorage.getItem('khodarji_user') || 'null');
    const finalUser = currentUser || currentStorageUser;

    if (!finalUser) {
      setIsOrdering(false);
      return;
    }

    const subtotal = cart.reduce((sum, item) => sum + ((item.discountPrice || item.price) * item.quantity), 0);
    const deliveryFee = subtotal >= 20 ? 0 : 2;
    const order: Order = {
      id: Math.random().toString(36).substr(2, 6).toUpperCase(),
      customerPhone: finalUser.phone,
      customerCity: finalUser.city || city,
      items: [...cart],
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    try {
      await db.createOrder(order);
      setOrders(prev => [order, ...prev]);
      setCart([]);
      setIsCartOpen(false);
      setTimeout(() => setActiveSection('orders'), 150);
    } catch (e) {
      console.error("Order creation failed", e);
    } finally {
      setIsOrdering(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8fafc] w-full">
        <div className="animate-float mb-6 text-6xl md:text-8xl">🥬</div>
        <div className="w-64 md:w-80 h-2 bg-gray-200 rounded-full overflow-hidden relative">
          <div className="absolute top-0 left-0 h-full bg-[#266041] animate-[loading_1.5s_infinite_ease-in-out]"></div>
        </div>
        <p className="mt-8 text-[#266041] font-black tracking-tight text-2xl animate-pulse text-center px-4">
          {lang === 'ar' ? 'خضرجي في خدمتك...' : 'Khodarji is preparing...'}
        </p>
        <style>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  }

  const renderContent = () => {
    if (activeSection === 'admin' && user?.role === 'admin') {
      return (
        <div className="w-full px-4 md:px-12 mt-8 animate-in slide-in-from-bottom-4">
          <AdminDashboard 
            lang={lang} 
            products={products} 
            setProducts={setProducts} 
            orders={orders}
            onUpdateOrderStatus={updateOrderStatus}
          />
          {/* Build Info Tag for Vercel Verification */}
          <div className="mt-20 py-10 border-t border-gray-100 text-center opacity-30 select-none grayscale">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Build Signature: {APP_VERSION}
            </p>
            <p className="text-[8px] font-bold text-gray-300">
              Latest Deployment: {BUILD_DATE}
            </p>
          </div>
        </div>
      );
    }

    if (activeSection === 'orders' && user) {
      return (
        <div className="w-full px-4 md:px-12 mt-8 max-w-4xl mx-auto animate-in slide-in-from-bottom-4 pb-20">
          <OrderHistory lang={lang} orders={orders} />
        </div>
      );
    }

    return (
      <div className="animate-in fade-in duration-700 w-full pb-24">
        {user?.role === 'admin' && activeSection === 'home' && (
          <div className="bg-orange-500 text-white py-3 px-6 text-center animate-in slide-in-from-top-full">
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
              <span className="font-black text-xs md:text-sm uppercase tracking-widest">
                {lang === 'ar' ? 'أنت مسجل كمدير نظام' : 'You are logged in as Admin'}
              </span>
              <button 
                onClick={() => setActiveSection('admin')}
                className="bg-white text-orange-600 px-4 py-1.5 rounded-full font-black text-[10px] md:text-xs shadow-lg hover:scale-105 transition-transform"
              >
                {lang === 'ar' ? 'افتح لوحة التحكم' : 'Open Dashboard'}
              </button>
            </div>
          </div>
        )}

        <section className="relative h-[45vh] md:h-[65vh] flex items-center justify-center w-full">
          <div className="absolute inset-0 bg-cover bg-center w-full h-full" 
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600')` }}>
            <div className="absolute inset-0 bg-black/45 backdrop-grayscale-[0.1]" />
          </div>
          
          <div className="relative text-center px-6 z-10 w-full max-w-6xl">
            <h1 className="text-4xl md:text-9xl font-black text-white mb-6 drop-shadow-2xl leading-[1.1]">
              {lang === 'ar' ? 'خضرتك بلدية وطازجة' : 'Jordan\'s Finest Produce'}
            </h1>
            <p className="text-lg md:text-3xl text-white/95 mb-10 font-bold">
              {lang === 'ar' ? 'من مزارعنا لمائدتك، طعم الأرض الحقيقي' : 'From our farms to your table, the real taste of earth'}
            </p>
          </div>
        </section>

        {!searchTerm && (
          <SpecialDeals products={products} lang={lang} onAddToCart={addToCart} />
        )}

        <div className="max-w-7xl mx-auto px-4 py-6">
          <ProductGrid 
            products={products} 
            lang={lang} 
            onAddToCart={addToCart} 
            searchTerm={searchTerm}
            isLoading={isProductsLoading}
          />
        </div>

        {!searchTerm && (
          <div className="max-w-7xl mx-auto px-4 py-12">
            <WhatsAppEnrollment lang={lang} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-[#f8fafc] text-slate-900 ${lang === 'ar' ? 'font-tajawal' : 'font-sans'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Navbar 
        lang={lang} 
        setLang={setLang} 
        user={user} 
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        onLoginClick={() => setIsAuthOpen(true)}
        onLogout={logout}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onSearch={setSearchTerm}
      />
      
      <div className="pt-20">
        {renderContent()}
      </div>

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        lang={lang}
        onUpdateQuantity={updateCartQuantity}
        onRemove={removeFromCart}
        onCheckout={createOrder}
        phone={user?.phone || ''}
        city={user?.city || ''}
        isOrdering={isOrdering}
      />

      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={handlePhoneIdentification}
        lang={lang}
      />

      <GeminiAssistant cartItems={cart} lang={lang} />
      <AddToHomeScreen lang={lang} />
    </div>
  );
};

export default App;
