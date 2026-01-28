
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
      // Show iOS prompt after a short delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    } else if (isAndroid) {
      setPlatform('android');
      
      const handler = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setIsVisible(true);
      };

      window.addEventListener('beforeinstallprompt', handler);
      
      // Fallback: If event doesn't fire (e.g. already seen), show instructions after delay
      const timer = setTimeout(() => {
        if (!isVisible) setIsVisible(true);
      }, 5000);

      return () => {
        window.removeEventListener('beforeinstallprompt', handler);
        clearTimeout(timer);
      };
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('khodarji_install_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[1000] p-4 animate-in slide-in-from-bottom-full duration-500">
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-[0_-20px_50px_-15px_rgba(0,0,0,0.3)] border border-gray-100 overflow-hidden">
        <div className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-[#266041] rounded-2xl flex items-center justify-center text-2xl shadow-inner shrink-0">
            🥕
          </div>
          <div className="flex-grow">
            <h4 className="font-black text-gray-800 text-sm">
              {lang === 'ar' ? 'ثبت تطبيق خضرجي' : 'Install Khodarji App'}
            </h4>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
              {lang === 'ar' ? 'وصول أسرع لخضرتك الطازجة' : 'Faster access to fresh produce'}
            </p>
          </div>
          <button onClick={handleDismiss} className="p-2 text-gray-300 hover:text-gray-600 transition-colors">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="px-5 pb-5">
          {platform === 'ios' ? (
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
              <p className="text-xs font-bold text-gray-600 leading-relaxed text-center">
                {lang === 'ar' 
                  ? 'للتثبيت: اضغط على أيقونة "المشاركة" بالأسفل ثم اختر "إضافة إلى الشاشة الرئيسية".' 
                  : 'To install: Tap the "Share" icon below and then "Add to Home Screen".'}
              </p>
              <div className="flex justify-center items-center gap-6">
                 <div className="flex flex-col items-center gap-1">
                   <i className="bi bi-box-arrow-up text-blue-500 text-xl"></i>
                   <span className="text-[9px] font-black text-gray-400">SHARE</span>
                 </div>
                 <i className="bi bi-arrow-right text-gray-300"></i>
                 <div className="flex flex-col items-center gap-1">
                   <i className="bi bi-plus-square text-gray-700 text-xl"></i>
                   <span className="text-[9px] font-black text-gray-400">ADD TO HOME</span>
                 </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {deferredPrompt ? (
                <button 
                  onClick={handleInstallClick}
                  className="w-full bg-[#266041] text-white py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-green-900/20 active:scale-95 transition-all"
                >
                  {lang === 'ar' ? 'تثبيت الآن' : 'Install Now'}
                </button>
              ) : (
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-xs font-bold text-gray-600 leading-relaxed text-center">
                    {lang === 'ar' 
                      ? 'اضغط على النقاط الثلاث (⋮) ثم اختر "تثبيت التطبيق".' 
                      : 'Tap the three dots (⋮) and select "Install App".'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* iOS Arrow Pointer */}
        {platform === 'ios' && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r border-b border-gray-100 shadow-xl"></div>
        )}
      </div>
    </div>
  );
};

export default AddToHomeScreen;
