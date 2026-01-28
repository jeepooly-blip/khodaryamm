
import React, { useState, useEffect } from 'react';
import { CartItem, Language } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  lang: Language;
  onUpdateQuantity: (id: string, q: number) => void;
  onRemove: (id: string) => void;
  onCheckout: (phone: string, city: string) => void;
  phone: string;
  city: string;
  isOrdering?: boolean;
}

const JORDAN_CITIES = [
  { ar: 'عمان', en: 'Amman' },
  { ar: 'الزرقاء', en: 'Zarqa' },
  { ar: 'إربد', en: 'Irbid' },
  { ar: 'العقبة', en: 'Aqaba' },
  { ar: 'مادبا', en: 'Madaba' },
  { ar: 'السلط', en: 'Salt' },
  { ar: 'المفرق', en: 'Mafraq' },
  { ar: 'معان', en: 'Ma\'an' },
  { ar: 'الطفيلة', en: 'Tafilah' },
  { ar: 'الكرك', en: 'Karak' },
  { ar: 'جرش', en: 'Jerash' },
  { ar: 'عجلون', en: 'Ajloun' },
];

const CartDrawer: React.FC<CartDrawerProps> = ({ 
  isOpen, onClose, cart, lang, onUpdateQuantity, onRemove, onCheckout, phone, city, isOrdering 
}) => {
  const [inputPhone, setInputPhone] = useState(phone);
  const [selectedCity, setSelectedCity] = useState(city || JORDAN_CITIES[0].en);

  const subtotal = cart.reduce((sum, item) => {
    const activePrice = item.discountPrice && item.discountPrice < item.price ? item.discountPrice : item.price;
    return sum + (activePrice * item.quantity);
  }, 0);
  
  const deliveryFee = subtotal >= 20 ? 0 : 2;
  const total = subtotal + deliveryFee;

  useEffect(() => {
    if (phone) setInputPhone(phone);
    if (city) setSelectedCity(city);
  }, [phone, city]);

  const handleCheckoutClick = () => {
    if (!/^7[0-9]{8}$/.test(inputPhone)) {
      alert(lang === 'ar' ? 'رقم الهاتف غير صحيح' : 'Invalid phone number');
      return;
    }
    onCheckout(inputPhone, selectedCity);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex justify-end overflow-hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className={`relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : (lang === 'ar' ? '-translate-x-full' : 'translate-x-full')}`}>
        
        {/* Premium Header */}
        <div className="px-6 py-6 bg-[#266041] text-white flex items-center justify-between shadow-lg z-20">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
              <i className="bi bi-cart4 text-2xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">{lang === 'ar' ? 'سلة المشتريات' : 'Your Basket'}</h2>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{cart.length} {lang === 'ar' ? 'أصناف مختارة' : 'Items Selected'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors">
            <i className="bi bi-x-lg text-xl"></i>
          </button>
        </div>

        {/* Scrollable List Area */}
        <div className="flex-grow overflow-y-auto bg-gray-50/50 p-4 pb-40 scrollbar-hide">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-10">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-5xl mb-6 opacity-40">🧺</div>
              <p className="text-gray-400 font-black text-lg">{lang === 'ar' ? 'السلة فارغة' : 'Your basket is empty'}</p>
              <button onClick={onClose} className="mt-4 text-[#266041] font-black underline">{lang === 'ar' ? 'تصفح المنتجات' : 'Browse Products'}</button>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => {
                const activePrice = item.discountPrice && item.discountPrice < item.price ? item.discountPrice : item.price;
                const hasDeal = item.discountPrice && item.discountPrice < item.price;
                return (
                  <div key={item.id} className="flex gap-4 p-4 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 shrink-0">
                      <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    </div>
                    
                    <div className="flex-grow min-w-0 py-0.5">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-black text-gray-800 text-sm truncate">{item.name[lang]}</h4>
                        <button onClick={() => onRemove(item.id)} className="text-gray-300 hover:text-red-500 transition-colors"><i className="bi bi-trash3-fill text-xs"></i></button>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-xl border border-gray-100">
                          <button onClick={() => onUpdateQuantity(item.id, item.quantity - 0.5)} className="w-6 h-6 flex items-center justify-center text-[#266041] hover:bg-white rounded-lg font-black transition-colors">-</button>
                          <span className="text-[11px] font-black min-w-[2.5rem] text-center">{item.quantity} <span className="text-[8px] opacity-40">{item.unit}</span></span>
                          <button onClick={() => onUpdateQuantity(item.id, item.quantity + 0.5)} className="w-6 h-6 flex items-center justify-center text-[#266041] hover:bg-white rounded-lg font-black transition-colors">+</button>
                        </div>
                        <div className="text-right">
                          <p className={`font-black text-sm ${hasDeal ? 'text-orange-600' : 'text-gray-900'}`}>{(activePrice * item.quantity).toFixed(2)} <span className="text-[9px]">JD</span></p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating Summary Section - Fixed at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-6 shadow-[0_-15px_40px_rgba(0,0,0,0.08)] z-30">
          {cart.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">{lang === 'ar' ? 'رقم الهاتف' : 'Phone'}</label>
                  <div className="flex items-center" dir="ltr">
                    <div className="bg-gray-50 border border-r-0 border-gray-200 px-3 py-2 rounded-l-xl text-gray-400 font-black text-[9px]">+962</div>
                    <input type="tel" placeholder="7XXXXXXXX" value={inputPhone} onChange={(e) => setInputPhone(e.target.value.replace(/\D/g, '').slice(0, 9))} className="flex-1 min-w-0 bg-white border border-gray-200 px-3 py-2 rounded-r-xl text-xs font-black tracking-widest focus:outline-none" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">{lang === 'ar' ? 'المدينة' : 'City'}</label>
                  <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-xs font-black text-[#266041] focus:outline-none appearance-none cursor-pointer">
                    {JORDAN_CITIES.map(c => <option key={c.en} value={c.en}>{lang === 'ar' ? c.ar : c.en}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <span>{lang === 'ar' ? 'المجموع' : 'Subtotal'}</span>
                  <span>{subtotal.toFixed(2)} JD</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <span>{lang === 'ar' ? 'توصيل' : 'Delivery'}</span>
                  <span className={deliveryFee === 0 ? 'text-emerald-600 font-black' : ''}>{deliveryFee === 0 ? 'FREE' : `${deliveryFee.toFixed(2)} JD`}</span>
                </div>
                <div className="pt-2 border-t border-dashed border-gray-200 flex justify-between items-center">
                  <span className="text-xs font-black text-gray-800 uppercase tracking-widest">{lang === 'ar' ? 'الإجمالي' : 'Total'}</span>
                  <span className="text-2xl font-black text-orange-600">{total.toFixed(2)} <span className="text-[10px]">JD</span></span>
                </div>
              </div>

              <button 
                disabled={cart.length === 0 || isOrdering} 
                onClick={handleCheckoutClick} 
                className="w-full bg-[#266041] hover:bg-[#1a4a32] text-white py-4 rounded-2xl font-black text-base shadow-xl disabled:opacity-40 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                {isOrdering ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <i className="bi bi-shield-check"></i>
                    <span>{lang === 'ar' ? 'تأكيد الطلب' : 'Confirm Order'}</span>
                  </>
                )}
              </button>
            </div>
          )}
          {cart.length === 0 && (
            <button 
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-400 py-4 rounded-2xl font-black text-sm uppercase tracking-widest"
            >
              {lang === 'ar' ? 'إغلاق' : 'Close'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
