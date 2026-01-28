
import React, { useState, useEffect } from 'react';
import { Language } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (phone: string, city: string, pin?: string) => Promise<{ success: boolean, error?: string }>;
  lang: Language;
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

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, lang }) => {
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState(JORDAN_CITIES[0].en);
  const [pin, setPin] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-detect demo admin number
  useEffect(() => {
    if (phone === '790000000') {
      setIsAdminMode(true);
    }
  }, [phone]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    
    setLoading(true);
    setErrorMsg('');
    
    const result = await onLogin(phone, city, isAdminMode ? pin : undefined);
    
    if (!result.success) {
      if (result.error === 'INCORRECT_PIN') {
        setErrorMsg(lang === 'ar' ? 'رمز الدخول غير صحيح' : 'Incorrect PIN entered');
      } else {
        setErrorMsg(lang === 'ar' ? 'خطأ في تسجيل الدخول. تأكد من البيانات.' : 'Login failed. Please check your details.');
      }
    } else {
      // Clear fields on success
      setPhone('');
      setPin('');
      setIsAdminMode(false);
    }
    setLoading(false);
  };

  const toggleAdminMode = () => {
    setIsAdminMode(!isAdminMode);
    if (!isAdminMode) {
      setPhone('790000000');
    } else {
      setPhone('');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 p-8">
        <div className="text-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm transition-colors ${isAdminMode ? 'bg-indigo-50 text-indigo-700' : 'bg-green-50 text-green-700'}`}>
            {isAdminMode ? '🔐' : '🚚'}
          </div>
          <h2 className="text-xl font-black text-gray-800 mb-1">
            {isAdminMode 
              ? (lang === 'ar' ? 'دخول المدير' : 'Admin Login') 
              : (lang === 'ar' ? 'أهلاً بك في خضرجي' : 'Welcome to Khodarji')}
          </h2>
          <p className="text-gray-400 font-bold text-[10px] mb-6 uppercase tracking-widest">
            {isAdminMode 
              ? (lang === 'ar' ? 'يرجى إدخال رمز التحقق الخاص بك' : 'Please enter your secure PIN')
              : (lang === 'ar' ? 'يرجى إدخال بيانات التوصيل' : 'Please enter delivery details')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-left" dir="ltr">
              <label className="block text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest ml-1">
                WhatsApp Phone
              </label>
              <div className="flex">
                <span className={`inline-flex items-center px-3 rounded-l-xl border border-r-0 font-black text-xs transition-colors ${isAdminMode ? 'bg-indigo-50 border-indigo-100 text-indigo-400' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                  +962
                </span>
                <input
                  type="tel"
                  required
                  placeholder="7XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  className={`flex-1 block w-full rounded-none rounded-r-xl border p-3 text-lg font-black tracking-widest focus:outline-none transition-all ${isAdminMode ? 'bg-indigo-50/30 border-indigo-100 focus:ring-2 focus:ring-indigo-500' : 'bg-gray-50/50 border-gray-100 focus:ring-2 focus:ring-[#266041]'}`}
                />
              </div>
            </div>

            {isAdminMode && (
              <div className="text-left animate-in slide-in-from-top-2">
                <label className={`block text-[9px] font-black text-indigo-400 mb-1 uppercase tracking-widest ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                  {lang === 'ar' ? 'رمز الدخول (6 أرقام)' : 'Admin Access PIN (6 Digits)'}
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  placeholder="••••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 text-center text-2xl font-black tracking-[0.5em] focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            )}

            {!isAdminMode && (
              <div className="text-left">
                <label className={`block text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest ${lang === 'ar' ? 'text-right mr-1' : 'ml-1'}`}>
                  {lang === 'ar' ? 'مدينة التوصيل' : 'Delivery City'}
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-black text-[#266041] focus:ring-2 focus:ring-[#266041] focus:outline-none appearance-none"
                >
                  {JORDAN_CITIES.map(c => (
                    <option key={c.en} value={c.en}>
                      {lang === 'ar' ? c.ar : c.en}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {errorMsg && (
              <p className="text-red-500 text-[10px] font-black animate-bounce">{errorMsg}</p>
            )}

            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-black text-sm shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 ${isAdminMode ? 'bg-indigo-900 text-white' : 'bg-[#266041] text-white'}`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <i className={`bi ${isAdminMode ? 'bi-shield-lock' : 'bi-shop'}`}></i>
                  {isAdminMode 
                    ? (lang === 'ar' ? 'تأكيد الرمز' : 'Verify PIN') 
                    : (lang === 'ar' ? 'بدء التسوق' : 'Start Shopping')}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-center gap-4">
            <button 
              onClick={toggleAdminMode}
              className={`text-[9px] font-black uppercase tracking-widest transition-colors ${isAdminMode ? 'text-green-600' : 'text-indigo-400'}`}
            >
              {isAdminMode 
                ? (lang === 'ar' ? 'دخول الزبائن' : 'Customer Login') 
                : (lang === 'ar' ? 'دخول المدير' : 'Admin Login')}
            </button>
            <span className="text-gray-200">|</span>
            <button 
              onClick={onClose}
              className="text-[9px] text-gray-400 hover:text-gray-600 font-black uppercase tracking-widest"
            >
              {lang === 'ar' ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
