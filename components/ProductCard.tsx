
import React, { useState } from 'react';
import { Product, Language } from '../types';

interface ProductCardProps {
  product: Product;
  lang: Language;
  onAdd: (p: Product, q: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, lang, onAdd }) => {
  const [qty, setQty] = useState(1);
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const currentPrice = hasDiscount ? product.discountPrice! : product.price;

  return (
    <div className="bg-white rounded-lg md:rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full hover:shadow-lg transition-all duration-300 group">
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <img 
          src={product.image} 
          alt={product.name[lang]} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-1 right-1 md:top-3 md:right-3 flex flex-col gap-1">
          {product.organic && (
            <span className="bg-green-600 text-white text-[6px] md:text-[9px] px-1 md:px-2.5 py-0.5 md:py-1 rounded-full font-black uppercase tracking-wider shadow-lg">
              {lang === 'ar' ? 'عضوي' : 'Organic'}
            </span>
          )}
          {hasDiscount && (
            <span className="bg-orange-500 text-white text-[6px] md:text-[9px] px-1 md:px-2.5 py-0.5 md:py-1 rounded-full font-black uppercase tracking-wider shadow-lg">
              {lang === 'ar' ? 'خصم' : 'Deal'}
            </span>
          )}
        </div>
      </div>

      <div className="p-1.5 md:p-4 flex flex-col flex-grow">
        <h3 className="font-black text-gray-800 text-[10px] md:text-base line-clamp-2 min-h-[1.25rem] md:min-h-[2.5rem] mb-1 leading-tight">
          {product.name[lang]}
        </h3>
        
        <div className="flex items-center gap-1 md:gap-2 mb-1.5 md:mb-4">
          <div className="flex items-baseline gap-0.5 md:gap-1">
            <span className="text-[#ff5722] font-black text-xs md:text-xl">{currentPrice.toFixed(2)}</span>
            <span className="text-[6px] md:text-[10px] font-bold text-gray-400 uppercase tracking-tighter">JD / {product.unit}</span>
          </div>
          {hasDiscount && (
            <span className="text-gray-300 text-[7px] md:text-xs line-through font-bold">
              {product.price.toFixed(2)}
            </span>
          )}
        </div>

        <div className="mt-auto space-y-1 md:space-y-3">
          <div className="flex items-center justify-between bg-gray-50 rounded-md md:rounded-2xl p-0.5 md:p-1 border border-gray-100">
            <button 
              onClick={() => setQty(prev => Math.max(0.5, prev - 0.5))}
              className="w-5 h-5 md:w-8 md:h-8 flex items-center justify-center rounded-sm md:rounded-xl bg-white border border-gray-100 text-[#266041] font-black hover:bg-green-50 shadow-sm transition-colors text-[10px] md:text-base"
            >-</button>
            <span className="font-black text-[8px] md:text-xs">
              {qty} <span className="text-[6px] md:text-[9px] opacity-40 font-bold">{product.unit}</span>
            </span>
            <button 
              onClick={() => setQty(prev => prev + 0.5)}
              className="w-5 h-5 md:w-8 md:h-8 flex items-center justify-center rounded-sm md:rounded-xl bg-white border border-gray-100 text-[#266041] font-black hover:bg-green-50 shadow-sm transition-colors text-[10px] md:text-base"
            >+</button>
          </div>

          <button 
            onClick={() => onAdd(product, qty)}
            className={`w-full py-1 md:py-3 rounded-md md:rounded-2xl text-[8px] md:text-xs font-black transition-all flex items-center justify-center gap-1 md:gap-2 shadow-sm md:shadow-lg active:scale-95 ${
              hasDiscount ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-[#266041] hover:bg-[#1a4a32] text-white'
            }`}
          >
            <i className="bi bi-cart-plus text-[10px] md:text-lg"></i>
            <span>{lang === 'ar' ? 'أضف' : 'Add'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
