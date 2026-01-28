
import React, { useState } from 'react';
import { Language } from '../types';
import { db } from '../services/supabaseClient';

interface WhatsAppEnrollmentProps {
  lang: Language;
}

const WhatsAppEnrollment: React.FC<WhatsAppEnrollmentProps> = ({ lang }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^7[0-9]{8}$/.test(phone)) {
      alert(lang === 'ar' ? 'يرجى إدخال رقم هاتف صحيح' : 'Please enter a valid phone number');
      return;
    }

    setIsSubmitting(true);
    await db.addEnrollment({ name, phone });
    setIsSubmitting(false);
    setIsSuccess(true);
    
    // Optional: Also open WhatsApp if you still want that interaction
    /*
    const msg = lang === 'ar' 
      ? "مرحباً خضرجي! أرغب في الانضمام إلى قائمة العروض." 
      : "Hi Khodarji! I would like to join your promotion list.";
    window.open(`https://wa.me/962790801695?text=${encodeURIComponent(msg)}`, '_blank');
    */
  };

  if (isSuccess) {
    return (
      <div className="bg-[#266041] rounded-[2.5rem] p-12 text-center text-white shadow-2xl animate-in zoom-in duration-500">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-black mb-2">
          {lang === 'ar' ? 'تم الاشتراك بنجاح!' : 'Subscription Successful!'}
        </h2>
        <p className="opacity-80 font-bold">
          {lang === 'ar' ? 'سنقوم بإعلامك بأحدث العروض قريباً.' : 'We will notify you about our latest offers soon.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#266041] rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-green-900/20 group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700"></div>
      
      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10 justify-between">
        <div className="text-center lg:text-left flex-1">
          <h2 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
            {lang === 'ar' ? 'انضم لقائمة عروض خضرجي!' : 'Join Khodarji Offers!'}
          </h2>
          <p className="text-white/80 font-bold text-sm md:text-lg max-w-xl mx-auto lg:mx-0">
            {lang === 'ar' 
              ? 'احصل على الخصومات الحصرية مباشرة عبر الواتساب.' 
              : 'Get exclusive discounts delivered straight to your WhatsApp.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full lg:w-auto flex flex-col sm:flex-row gap-3 bg-white/10 p-2 rounded-3xl backdrop-blur-md border border-white/10">
          <input
            type="text"
            placeholder={lang === 'ar' ? 'الاسم (اختياري)' : 'Name (Optional)'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-white text-gray-800 px-6 py-4 rounded-2xl font-black text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/50 min-w-[150px]"
          />
          <div className="flex items-center bg-white rounded-2xl overflow-hidden" dir="ltr">
             <span className="pl-4 text-gray-400 font-black text-sm">+962</span>
             <input
              type="tel"
              required
              placeholder="7XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
              className="w-full text-gray-800 px-3 py-4 font-black text-sm focus:outline-none"
            />
          </div>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
          >
            {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (
              <>
                <i className="bi bi-bell"></i>
                <span>{lang === 'ar' ? 'اشترك الآن' : 'Subscribe Now'}</span>
              </>
            )}
          </button>
        </form>
      </div>
      
      <div className={`absolute top-4 ${lang === 'ar' ? 'left-4' : 'right-4'} text-white/10 text-8xl`}>
        <i className="bi bi-megaphone"></i>
      </div>
    </div>
  );
};

export default WhatsAppEnrollment;
