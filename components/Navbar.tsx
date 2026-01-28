
import React, { useState } from 'react';
import { User, Language } from '../types';

interface NavbarProps {
  lang: Language;
  setLang: (l: Language) => void;
  user: User | null;
  cartCount: number;
  onCartClick: () => void;
  onLoginClick: () => void;
  onLogout: () => void;
  activeSection: 'home' | 'admin' | 'orders';
  setActiveSection: (s: 'home' | 'admin' | 'orders') => void;
  onSearch: (term: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  lang, setLang, user, cartCount, onCartClick, onLoginClick, onLogout, activeSection, setActiveSection, onSearch
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    onSearch(val);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 h-20 flex items-center shadow-xl w-full ${user?.role === 'admin' ? 'bg-indigo-950 shadow-indigo-900/20' : 'bg-[#266041]/95 backdrop-blur-md shadow-green-900/10'} text-white`}>
      <div className="w-full px-4 md:px-12 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 lg:gap-8">
          <button 
            onClick={() => setActiveSection('home')}
            className="flex items-center gap-3 group"
          >
            <div className="bg-white text-green-800 p-2 rounded-xl shadow-lg group-hover:rotate-12 transition-transform">
              <span className="text-xl md:text-2xl">🥕</span>
            </div>
            <span className="text-xl md:text-3xl font-black tracking-tighter hidden sm:inline">
              {lang === 'ar' ? 'خضرجي' : 'Khodarji'}
            </span>
          </button>

          {/* Navigation Tabs - Now visible on MD+ screens */}
          <div className="hidden md:flex items-center gap-2">
            <button 
              onClick={() => setActiveSection('home')}
              className={`px-4 py-2 rounded-xl text-xs lg:text-sm font-black transition-all ${activeSection === 'home' ? 'bg-white/20 text-white shadow-inner' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
            >
              {lang === 'ar' ? 'الرئيسية' : 'Home'}
            </button>
            {user && (
              <button 
                onClick={() => setActiveSection('orders')}
                className={`px-4 py-2 rounded-xl text-xs lg:text-sm font-black transition-all ${activeSection === 'orders' ? 'bg-white/20 text-white shadow-inner' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              >
                {lang === 'ar' ? 'طلباتي' : 'Orders'}
              </button>
            )}
            {user?.role === 'admin' && (
              <button 
                onClick={() => setActiveSection('admin')}
                className={`px-4 py-2 rounded-xl text-xs lg:text-sm font-black transition-all ${activeSection === 'admin' ? 'bg-orange-500 text-white shadow-lg animate-pulse' : 'text-orange-400 hover:text-orange-300 hover:bg-white/10'}`}
              >
                {lang === 'ar' ? 'لوحة المدير' : 'Admin Panel'}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 max-w-lg relative mx-2">
          <input 
            type="text"
            placeholder={lang === 'ar' ? 'ابحث عن خضار...' : 'Search...'}
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full bg-white/10 border border-white/20 rounded-xl py-2 px-4 md:pl-10 focus:bg-white focus:text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-500/30 transition-all text-sm font-bold placeholder:text-white/40"
          />
          <div className={`absolute ${lang === 'ar' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 opacity-40 hidden md:block`}>
            <i className="bi bi-search text-base"></i>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-4">
          <button 
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="text-[10px] md:text-xs font-black hover:bg-white/20 px-2 md:px-3 py-1.5 rounded-xl border border-white/20 transition-all active:scale-90"
          >
            {lang === 'ar' ? 'EN' : 'عربي'}
          </button>

          <button 
            onClick={onCartClick}
            className="relative p-2 hover:bg-white/10 rounded-xl transition-all group"
          >
            <i className="bi bi-bag-fill text-xl md:text-2xl group-hover:scale-110 transition-transform"></i>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[9px] font-black h-4 w-4 md:h-5 md:w-5 flex items-center justify-center rounded-full shadow-lg border-2 border-current">
                {cartCount}
              </span>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-1 md:gap-2">
              <div className="hidden lg:flex flex-col items-end mr-2 text-right">
                <span className="text-[9px] font-black opacity-60 uppercase leading-none mb-1">{user.role}</span>
                <span className="text-[10px] font-bold leading-none">{user.phone}</span>
              </div>
              <button 
                onClick={onLogout}
                className="bg-white/10 hover:bg-red-500 p-2 md:p-2.5 rounded-xl transition-all active:scale-90"
                title={lang === 'ar' ? 'خروج' : 'Logout'}
              >
                <i className="bi bi-box-arrow-right text-lg md:text-xl"></i>
              </button>
            </div>
          ) : (
            <button 
              onClick={onLoginClick}
              className="bg-white text-green-800 px-3 md:px-5 py-2 rounded-xl font-black text-[10px] md:text-sm hover:bg-green-50 transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
              <i className="bi bi-person-circle text-lg"></i>
              <span className="hidden sm:inline">{lang === 'ar' ? 'دخول' : 'Login'}</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
