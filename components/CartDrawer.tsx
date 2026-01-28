
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

  // FIX: Use discount price for subtotal calculation
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

  const handleWhatsAppOrder = () => {
    if (cart.length === 0) return;
    let msg = lang === 'ar' ? `🥬 *طلب جديد من متجر خضرجي*\n` : `🥬 *New Order from Khodarji Store*\n`;
    msg += `--------------------------\n`;
    if (inputPhone) msg += lang === 'ar' ? `📞 رقم الهاتف: ${inputPhone}\n` : `📞 Phone: ${inputPhone}\n`;
    msg += lang === 'ar' ? `📍 المدينة: ${selectedCity}\n` : `📍 City: ${selectedCity}\n`;
    msg += `\n*📦 ${lang === 'ar' ? 'المنتجات المطلوبة:' : 'Requested Items:'}*\n`;
    
    cart.forEach(item => {
      const activePrice = item.discountPrice && item.discountPrice < item.price ? item.discountPrice : item.price;
      const lineTotal = (activePrice * item.quantity).toFixed(2);
      msg += `• ${item.name[lang]} (${item.quantity} ${item.unit}) -> ${lineTotal} JD\n`;
    });
    
    msg += `\n--------------------------\n`;
    msg += `💰 *${lang === 'ar' ? 'الإجمالي:' : 'Total:'}* ${total.toFixed(2)} JD\n`;
    msg += deliveryFee === 0 ? (lang === 'ar' ? `🚚 التوصيل: *مجاني* ✅\n` : `🚚 Delivery: *FREE* ✅\n`) : (lang === 'ar' ? `🚚 رسوم التوصيل: 2.00 JD\n` : `🚚 Delivery Fee: 2.00 JD\n`);
    msg += `--------------------------\n`;
    msg += lang === 'ar' ? `🙏 شكراً لتسوقكم معنا!` : `🙏 Thank you for shopping with us!`;
    window.open(`https://wa.me/962790801695?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleCheckoutClick = () => {
    if (!/^7[0-9]{8}$/.test(inputPhone)) {
      alert(lang === 'ar' ? 'رقم الهاتف غير صحيح' : 'Invalid phone number');
      return;
    }
    onCheckout(inputPhone, selectedCity);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex justify-end overflow-hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out overflow-hidden ${isOpen ? 'translate-x-0' : (lang === 'ar' ? '-translate-x-full' : 'translate-x-full')}`}>
        
        <div className="px-6 py-5 bg-[#266041] text-white flex items-center justify-between shadow-lg shrink-0">
          <div className="flex items-center gap-3">
             <div className="bg-white/20 p-2 rounded-xl"><i className="bi bi-bag-check text-2xl"></i></div>
             <h2 className="text-xl font-black">{lang === 'ar' ? 'سلة المشتريات' : 'My Shopping Basket'}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><i className="bi bi-x-lg text-xl"></i></button>
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-gray-50/50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-10 opacity-40">
              <div className="text-7xl mb-4">🧺</div><p className="text-lg font-black">{lang === 'ar' ? 'السلة فارغة' : 'Your basket is empty'}</p>
            </div>
          ) : (
            cart.map(item => {
              const activePrice = item.discountPrice && item.discountPrice < item.price ? item.discountPrice : item.price;
              const hasDeal = item.discountPrice && item.discountPrice < item.price;
              return (
                <div key={item.id} className="flex gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                  <img src={item.image} className="w-16 h-16 object-cover rounded-xl border border-gray-100" />
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-black text-gray-800 text-sm truncate pr-2">{item.name[lang]}</h4>
                      <button onClick={() => onRemove(item.id)} className="text-gray-300 hover:text-red-500 transition-colors"><i className="bi bi-x-circle-fill"></i></button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-100">
                        <button onClick={() => onUpdateQuantity(item.id, item.quantity - 0.5)} className="w-6 h-6 flex items-center justify-center text-[#266041] hover:bg-white rounded font-black">-</button>
                        <span className="text-xs font-black min-w-[2.5rem] text-center">{item.quantity} <span className="text-[9px] opacity-40">{item.unit}</span></span>
                        <button onClick={() => onUpdateQuantity(item.id, item.quantity + 0.5)} className="w-6 h-6 flex items-center justify-center text-[#266041] hover:bg-white rounded font-black">+</button>
                      </div>
                      <div className="text-right">
                        {hasDeal && <p className="text-[8px] font-black text-orange-500 uppercase leading-none mb-1">Deal Price</p>}
                        <span className={`font-black text-sm ${hasDeal ? 'text-orange-600' : 'text-gray-900'}`}>{(activePrice * item.quantity).toFixed(2)} JD</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="shrink-0 bg-white border-t border-gray-100 p-6 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] space-y-4">
          {cart.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block text-right mr-1">{lang === 'ar' ? 'رقم الهاتف' : 'Phone'}</label>
                <div className="flex items-center" dir="ltr">
                  <div className="bg-gray-50 border border-r-0 border-gray-200 px-3 py-2.5 rounded-l-xl text-gray-500 font-black text-[10px]">+962</div>
                  <input type="tel" placeholder="7XXXXXXXX" value={inputPhone} onChange={(e) => setInputPhone(e.target.value.replace(/\D/g, '').slice(0, 9))} className="flex-1 min-w-0 bg-white border border-gray-200 px-3 py-2.5 rounded-r-xl text-sm font-black tracking-widest focus:ring-2 focus:ring-[#266041] focus:outline-none transition-all" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block text-right mr-1">{lang === 'ar' ? 'المدينة' : 'City'}</label>
                <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="w-full bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl text-sm font-black text-[#266041] focus:ring-2 focus:ring-[#266041] focus:outline-none appearance-none">
                  {JORDAN_CITIES.map(c => <option key={c.en} value={c.en}>{lang === 'ar' ? c.ar : c.en}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="space-y-1 px-1">
            <div className="flex justify-between text-[10px] font-bold text-gray-400"><span>{lang === 'ar' ? 'المجموع' : 'Subtotal'}</span><span>{subtotal.toFixed(2)} JD</span></div>
            <div className="flex justify-between text-[10px] font-bold text-gray-400"><span>{lang === 'ar' ? 'التوصيل' : 'Delivery'}</span><span className={deliveryFee === 0 ? 'text-green-600' : ''}>{deliveryFee === 0 ? (lang === 'ar' ? 'مجاني' : 'FREE') : `${deliveryFee.toFixed(2)} JD`}</span></div>
            <div className="pt-2 border-t border-dashed border-gray-200 flex justify-between items-center"><span className="text-sm font-black text-gray-800">{lang === 'ar' ? 'الإجمالي' : 'Total'}</span><span className="text-xl font-black text-orange-600">{total.toFixed(2)} JD</span></div>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            <button disabled={cart.length === 0 || isOrdering} onClick={handleCheckoutClick} className="w-full bg-[#266041] hover:bg-[#1a4a32] text-white py-3.5 rounded-xl font-black text-base shadow-lg disabled:opacity-40 transition-all flex items-center justify-center gap-3">
              {isOrdering ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <>{lang === 'ar' ? 'تأكيد الطلب' : 'Confirm Order'}</>}
            </button>
            <button disabled={cart.length === 0} onClick={handleWhatsAppOrder} className="w-full bg-white border-2 border-green-500 text-green-600 py-2.5 rounded-xl font-black text-xs hover:bg-green-50 transition-all flex items-center justify-center gap-2"><i className="bi bi-whatsapp"></i>{lang === 'ar' ? 'اطلب عبر واتساب' : 'Order via WhatsApp'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
