
import React, { useState, useEffect } from 'react';
import { Language } from '../types';

interface AddToHomeScreenProps {
  lang: Language;
}

const AddToHomeScreen: React.FC<AddToHomeScreenProps> = ({ lang }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // 1. Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');

    if (isStandalone) return;

    // 2. Check if dismissed recently
    const isDismissed = localStorage.getItem('khodarji_install_dismissed');
    if (isDismissed) return;

    // 3. Detect Platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    if (isIOS) {
      setPlatform('ios');
      const timer = setTimeout(() => setIsVisible(true), 4000);
      return () => clearTimeout(timer);
    } else if (isAndroid) {
      setPlatform('android');
      const handler = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setIsVisible(true);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('khodarji_install_dismissed', 'true');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Khodarji - خضرجي',
          text: lang === 'ar' ? 'اطلب خضرتك طازجة من تطبيق خضرجي' : 'Order fresh produce from Khodarji App',
          url: window.location.origin,
        });
      } catch (err) {
        console.log('Share failed:', err);
      }
    } else {
      alert(lang === 'ar' ? 'المشاركة غير مدعومة في هذا المتصفح' : 'Sharing not supported in this browser');
    }
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setIsVisible(false);
      setDeferredPrompt(null);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[1000] p-4 animate-in slide-in-from-bottom-full duration-700">
      <div className="max-w-md mx-auto bg-white rounded-[2.5rem] shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-100 overflow-hidden relative">
        <div className="p-6">
          <div className="flex items-start justify-between mb-2">
            <button onClick={handleDismiss} className="p-2 -mt-2 -ml-2 text-gray-300 hover:text-gray-600 transition-colors">
              <i className="bi bi-x-lg text-lg"></i>
            </button>
            <div className="flex flex-col items-center flex-1 text-center pr-8">
               <div className="w-14 h-14 bg-[#266041] rounded-[1.5rem] flex items-center justify-center text-3xl shadow-xl mb-3">
                🥕
              </div>
              <h4 className="font-black text-gray-800 text-lg">
                {lang === 'ar' ? 'ثبت تطبيق خضرجي' : 'Install Khodarji App'}
              </h4>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                {lang === 'ar' ? 'وصول أسرع لخضرتك الطازجة' : 'Faster access to fresh produce'}
              </p>
            </div>
          </div>

          <div className="mt-6 bg-gray-50/80 rounded-[2rem] p-6 border border-gray-100 space-y-5">
            <p className="text-xs font-bold text-gray-600 leading-relaxed text-center px-4">
              {platform === 'ios' 
                ? (lang === 'ar' ? 'للتثبيت: اضغط على أيقونة "المشاركة" بالأسفل ثم اختر "إضافة إلى الشاشة الرئيسية".' : 'To install: Tap "Share" below and select "Add to Home Screen".')
                : (lang === 'ar' ? 'اضغط على زر التثبيت للحصول على تجربة تطبيق كاملة.' : 'Tap Install for a full app experience.')
              }
            </p>
            
            <div className="flex justify-center items-center gap-8">
               <button 
                 onClick={handleShare}
                 className="flex flex-col items-center gap-2 group active:scale-95 transition-transform"
               >
                 <div className="bg-white p-3 rounded-2xl shadow-md border border-gray-100 group-hover:bg-blue-50">
                    <i className="bi bi-box-arrow-up text-blue-500 text-2xl"></i>
                 </div>
                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">SHARE</span>
               </button>

               <div className="text-gray-200">
                  <i className="bi bi-arrow-right text-xl"></i>
               </div>

               <button 
                 onClick={platform === 'android' ? handleInstallClick : undefined}
                 className="flex flex-col items-center gap-2 group active:scale-95 transition-transform"
               >
                 <div className={`p-3 rounded-2xl shadow-md border border-gray-100 group-hover:bg-green-50 ${platform === 'android' && deferredPrompt ? 'bg-green-500 text-white' : 'bg-white text-gray-700'}`}>
                    <i className={`bi ${platform === 'android' ? 'bi-download' : 'bi-plus-square'} text-2xl`}></i>
                 </div>
                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                   {platform === 'android' ? 'INSTALL' : 'ADD TO HOME'}
                 </span>
               </button>
            </div>
          </div>
          
          {platform === 'android' && deferredPrompt && (
            <button 
              onClick={handleInstallClick}
              className="mt-6 w-full bg-[#266041] text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-green-900/20 active:scale-95 transition-all"
            >
              {lang === 'ar' ? 'تثبيت الآن' : 'Install Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddToHomeScreen;
