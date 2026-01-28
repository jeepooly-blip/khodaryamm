
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
    <section className="py-4 md:py-6 bg-orange-50/20 border-y border-orange-100 mb-2 md:mb-6 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-3 md:mb-5">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="bg-orange-500 text-white p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-md">
              <i className="bi bi-lightning-fill text-sm md:text-xl"></i>
            </div>
            <div>
              <h2 className="text-lg md:text-2xl font-black text-gray-800">
                {lang === 'ar' ? 'عروض قوية' : "Hot Deals"}
              </h2>
              <p className="text-[7px] md:text-[9px] font-black text-orange-500 uppercase tracking-widest">
                {lang === 'ar' ? 'أسعار استثنائية' : 'Best local prices'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] md:text-xs font-black text-orange-600 bg-white/50 px-3 py-1 rounded-full border border-orange-100">
             <i className="bi bi-clock-history"></i>
             <span>{lang === 'ar' ? 'تنتهي قريباً' : 'Expiring Soon'}</span>
          </div>
        </div>

        <div className="flex overflow-x-auto pb-2 md:pb-4 gap-2 md:gap-5 scrollbar-hide snap-x">
          {deals.map(product => (
            <div key={product.id} className="min-w-[155px] md:min-w-[210px] snap-start">
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
