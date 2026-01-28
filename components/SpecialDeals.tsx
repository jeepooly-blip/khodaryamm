
import React from 'react';
import { Product, Language } from '../types';
import ProductCard from './ProductCard';

interface SpecialDealsProps {
  products: Product[];
  lang: Language;
  onAddToCart: (p: Product, q: number) => void;
}

const SpecialDeals: React.FC<SpecialDealsProps> = ({ products, lang, onAddToCart }) => {
  const deals = products.filter(p => p.discountPrice && p.discountPrice < p.price);

  if (deals.length === 0) return null;

  return (
    <section className="py-8 bg-orange-50/30 border-y border-orange-100 mb-8 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 text-white p-2 rounded-xl shadow-lg animate-bounce">
              <i className="bi bi-fire text-xl"></i>
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-800">
                {lang === 'ar' ? 'عروض اليوم الخاصة' : "Today's Special Offers"}
              </h2>
              <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">
                {lang === 'ar' ? 'أفضل الأسعار لفترة محدودة' : 'Best prices for a limited time'}
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs font-black text-orange-600">
             <i className="bi bi-clock-history"></i>
             <span>{lang === 'ar' ? 'تنتهي قريباً' : 'Ending soon'}</span>
          </div>
        </div>

        <div className="flex overflow-x-auto pb-4 gap-6 scrollbar-hide snap-x">
          {deals.map(product => (
            <div key={product.id} className="min-w-[280px] md:min-w-[320px] snap-start">
              <ProductCard 
                product={product} 
                lang={lang} 
                onAdd={onAddToCart} 
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SpecialDeals;
