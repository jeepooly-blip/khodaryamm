
import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { db } from '../services/supabaseClient';

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

  // Automatically toggle admin mode if phone matches designated admin phone
  useEffect(() => {
    if (phone === '790000000') {
      setIsAdminMode(true);
    } else {
      setIsAdminMode(false);
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
      } else if (result.error === 'PIN_REQUIRED') {
        setErrorMsg(lang === 'ar' ? 'يرجى إدخال رمز الدخول للمدير' : 'Admin PIN required');
      } else {
        setErrorMsg(lang === 'ar' ? 'خطأ في تسجيل الدخول. تأكد من الرقم.' : 'Login failed. Check number.');
      }
    } else {
      setPhone(''); 
      setPin(''); 
      setIsAdminMode(false);
    }
    setLoading(false);
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setLoading(true);
    if (provider === 'google') await db.signInWithGoogle();
    else await db.signInWithGithub();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 p-8">
        <div className="text-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm ${isAdminMode ? 'bg-indigo-50 text-indigo-700 animate-pulse' : 'bg-green-50 text-green-700'}`}>
            {isAdminMode ? '🔐' : '🚚'}
          </div>
          <h2 className="text-xl font-black text-gray-800 mb-1">
            {isAdminMode ? (lang === 'ar' ? 'دخول المدير' : 'Admin Login') : (lang === 'ar' ? 'أهلاً بك في خضرجي' : 'Welcome to Khodarji')}
          </h2>
          <p className="text-gray-400 font-bold text-[10px] mb-6 uppercase tracking-widest">
            {isAdminMode ? (lang === 'ar' ? 'أدخل الرمز السري' : 'Enter PIN') : (lang === 'ar' ? 'سجل دخولك للمتابعة' : 'Sign in to continue')}
          </p>

          {!isAdminMode && (
            <div className="space-y-3 mb-6">
              <button 
                type="button"
                onClick={() => handleSocialLogin('google')}
                className="w-full flex items-center justify-center gap-3 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-bold text-sm text-gray-700"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                {lang === 'ar' ? 'متابعة باستخدام جوجل' : 'Continue with Google'}
              </button>
              <button 
                type="button"
                onClick={() => handleSocialLogin('github')}
                className="w-full flex items-center justify-center gap-3 py-3 bg-gray-900 hover:bg-black transition-colors font-bold text-sm text-white rounded-xl"
              >
                <i className="bi bi-github text-lg"></i>
                {lang === 'ar' ? 'متابعة باستخدام جيت هب' : 'Continue with GitHub'}
              </button>
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-100"></div>
                <span className="flex-shrink mx-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">{lang === 'ar' ? 'أو' : 'OR'}</span>
                <div className="flex-grow border-t border-gray-100"></div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-left" dir="ltr">
              <label className="block text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Phone Number</label>
              <div className="flex">
                <span className={`inline-flex items-center px-3 rounded-l-xl border border-r-0 font-black text-xs ${isAdminMode ? 'bg-indigo-50 text-indigo-400' : 'bg-gray-50 text-gray-500'}`}>+962</span>
                <input
                  type="tel" required placeholder="7XXXXXXXX" value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  className={`flex-1 block w-full rounded-none rounded-r-xl border p-3 text-lg font-black tracking-widest focus:outline-none ${isAdminMode ? 'border-indigo-100 bg-indigo-50/20' : ''}`}
                />
              </div>
            </div>

            {isAdminMode && (
              <div className="text-left animate-in slide-in-from-top-2">
                <label className="block text-[9px] font-black text-indigo-300 mb-1 uppercase tracking-widest">Admin PIN</label>
                <input
                  type="password" maxLength={6} required placeholder="••••••" value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 text-center text-2xl font-black tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {!isAdminMode && (
              <div className="text-left">
                <label className="block text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Your City</label>
                <select
                  value={city} onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-black text-[#266041] appearance-none focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {JORDAN_CITIES.map(c => <option key={c.en} value={c.en}>{lang === 'ar' ? c.ar : c.en}</option>)}
                </select>
              </div>
            )}
            
            {errorMsg && (
              <div className="bg-red-50 text-red-500 p-3 rounded-xl text-[10px] font-black uppercase tracking-tight animate-shake">
                {errorMsg}
              </div>
            )}

            <button 
              type="submit" disabled={loading}
              className={`w-full py-4 rounded-xl font-black text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${isAdminMode ? 'bg-indigo-900 text-white shadow-indigo-900/20' : 'bg-[#266041] text-white shadow-green-900/20'}`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <i className={`bi ${isAdminMode ? 'bi-shield-lock' : 'bi-door-open'}`}></i>
                  {lang === 'ar' ? 'دخول' : 'Sign In'}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-center gap-4">
            <button 
              type="button"
              onClick={() => setIsAdminMode(!isAdminMode)} 
              className="text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-600 transition-colors"
            >
              {isAdminMode ? (lang === 'ar' ? 'رجوع للزبائن' : 'Back to Shop') : (lang === 'ar' ? 'هل أنت مدير؟' : 'Are you Admin?')}
            </button>
            <span className="text-gray-200">|</span>
            <button 
              type="button"
              onClick={onClose} 
              className="text-[9px] text-gray-400 font-black uppercase tracking-widest hover:text-gray-600 transition-colors"
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
