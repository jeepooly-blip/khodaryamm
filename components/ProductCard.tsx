
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
    <div className="bg-white rounded-2xl md:rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full hover:shadow-md transition-all duration-300 group">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-white">
        <img 
          src={product.image} 
          alt={product.name[lang]} 
          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Badges */}
        <div className="absolute top-1.5 right-1.5 md:top-3 md:right-3 flex flex-col gap-1">
          {product.organic && (
            <span className="bg-[#266041] text-white text-[8px] md:text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider shadow-sm">
              {lang === 'ar' ? 'عضوي' : 'Organic'}
            </span>
          )}
          {hasDiscount && (
            <span className="bg-[#ff5722] text-white text-[8px] md:text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider shadow-sm">
              {lang === 'ar' ? 'خصم' : 'Deal'}
            </span>
          )}
        </div>
      </div>

      {/* Content Area - Minimized vertical spacing */}
      <div className="px-2 pb-2 md:px-4 md:pb-4 flex flex-col flex-grow text-center">
        {/* Product Name - Margin minimized */}
        <h3 className="font-bold text-gray-800 text-xs md:text-base line-clamp-1 mb-0.5">
          {product.name[lang]}
        </h3>
        
        {/* Price Section - Compact and grouped */}
        <div className="flex flex-col items-center mb-1.5 md:mb-3">
          <div className="flex items-baseline gap-1">
            <span className="text-gray-400 text-[9px] md:text-[11px] font-bold uppercase tracking-tighter">
              JD / {product.unit}
            </span>
            <span className="text-[#ff5722] font-black text-sm md:text-xl leading-none">
              {currentPrice.toFixed(2)}
            </span>
          </div>
          {hasDiscount && (
            <span className="text-gray-300 text-[9px] md:text-xs line-through font-bold -mt-0.5">
              {product.price.toFixed(2)}
            </span>
          )}
        </div>

        {/* Controls Container */}
        <div className="mt-auto space-y-1.5 md:space-y-3">
          {/* Quantity Selector - Unit text made large and bold for readability */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl md:rounded-2xl p-0.5 md:p-1 border border-gray-100">
            <button 
              onClick={() => setQty(prev => Math.max(0.5, prev - 0.5))}
              className="w-6 h-6 md:w-9 md:h-9 flex items-center justify-center rounded-lg md:rounded-xl bg-white border border-gray-200 text-[#266041] font-black hover:bg-green-50 shadow-sm transition-colors text-xs md:text-base"
            >-</button>
            <div className="flex flex-col items-center leading-none">
              <span className="text-[10px] md:text-sm font-black text-gray-700">{qty}</span>
              <span className="text-[10px] md:text-xs text-gray-400 font-bold uppercase">{product.unit}</span>
            </div>
            <button 
              onClick={() => setQty(prev => prev + 0.5)}
              className="w-6 h-6 md:w-9 md:h-9 flex items-center justify-center rounded-lg md:rounded-xl bg-white border border-gray-200 text-[#266041] font-black hover:bg-green-50 shadow-sm transition-colors text-xs md:text-base"
            >+</button>
          </div>

          {/* Add to Cart Button */}
          <button 
            onClick={() => onAdd(product, qty)}
            className={`w-full py-2 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-sm font-black transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 ${
              hasDiscount ? 'bg-[#ff5722] hover:bg-[#e64a19] text-white' : 'bg-[#266041] hover:bg-[#1a4a32] text-white'
            }`}
          >
            <i className="bi bi-cart-plus text-xs md:text-lg"></i>
            <span>{lang === 'ar' ? 'أضف' : 'Add'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
