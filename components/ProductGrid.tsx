
import React, { useState, useMemo, useEffect } from 'react';
import { Product, Language } from '../types';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  lang: Language;
  onAddToCart: (p: Product, q: number) => void;
  searchTerm: string;
  isLoading?: boolean;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, lang, onAddToCart, searchTerm, isLoading }) => {
  const [filter, setFilter] = useState<Product['category'] | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = filter === 'all' || p.category === filter;
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        p.name.en.toLowerCase().includes(term) || 
        p.name.ar.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [products, filter, searchTerm]);

  const showPagination = filtered.length > itemsPerPage;
  
  const paginatedProducts = useMemo(() => {
    if (!showPagination) return filtered;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage, showPagination]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const categories = [
    { id: 'all', label: { ar: 'الكل', en: 'All' }, icon: '🥗' },
    { id: 'vegetables', label: { ar: 'خضروات', en: 'Veg' }, icon: '🥦' },
    { id: 'fruits', label: { ar: 'فواكه', en: 'Fruits' }, icon: '🍎' },
    { id: 'organic', label: { ar: 'عضوي', en: 'Org' }, icon: '🌿' },
    { id: 'other', label: { ar: 'أخرى', en: 'Other' }, icon: '🍯' },
  ];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto">
      {/* Category Filter Bar */}
      <div className="flex overflow-x-auto pb-4 md:pb-6 mb-2 scrollbar-hide gap-2 md:gap-4 justify-start lg:justify-center px-4">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id as any)}
            className={`px-4 md:px-6 py-2 md:py-3 rounded-2xl md:rounded-[1.5rem] font-black whitespace-nowrap transition-all duration-300 flex items-center gap-2 md:gap-3 flex-shrink-0 text-[11px] md:text-sm ${
              filter === cat.id 
                ? 'bg-[#266041] text-white shadow-xl ring-4 ring-green-100' 
                : 'bg-white text-gray-600 border border-gray-100 shadow-sm hover:shadow-md'
            }`}
          >
            <span className="text-lg md:text-xl">{cat.icon}</span>
            <span className="uppercase tracking-tight">{cat.label[lang]}</span>
          </button>
        ))}
      </div>

      <div className="px-2 md:px-4">
        {/* Updated Grid: 2 cols on mobile, 4 on md, 5 on lg, 6 on xl */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4 w-full">
          {paginatedProducts.map(product => (
            <div key={product.id} className="animate-in fade-in zoom-in duration-300">
              <ProductCard 
                product={product} 
                lang={lang} 
                onAdd={onAddToCart} 
              />
            </div>
          ))}
        </div>
        
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 mt-4 mx-2">
            <div className="text-5xl mb-4 grayscale opacity-20">🔍</div>
            <h3 className="text-lg font-black text-gray-800">
              {lang === 'ar' ? 'لم نجد نتائج تطابق بحثك' : 'No results found for your search'}
            </h3>
            <p className="text-gray-400 font-bold mt-2 text-sm">
              {lang === 'ar' ? 'جرب البحث عن منتج آخر' : 'Try searching for something else'}
            </p>
          </div>
        )}

        {showPagination && totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-10 md:mt-16 pb-12 px-4">
            <button
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-2xl bg-white border border-gray-100 text-[#266041] shadow-md disabled:opacity-30 active:scale-90 transition-all"
            >
              <i className={`bi bi-chevron-${lang === 'ar' ? 'right' : 'left'} text-lg`}></i>
            </button>
            
            <div className="flex gap-2 overflow-x-auto max-w-[200px] md:max-w-[400px] scrollbar-hide px-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`min-w-[40px] h-10 md:h-12 px-4 rounded-2xl font-black text-xs md:text-sm transition-all shadow-sm ${
                    currentPage === page 
                      ? 'bg-[#266041] text-white' 
                      : 'bg-white text-gray-400 border border-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-2xl bg-white border border-gray-100 text-[#266041] shadow-md disabled:opacity-30 active:scale-90 transition-all"
            >
              <i className={`bi bi-chevron-${lang === 'ar' ? 'left' : 'right'} text-lg`}></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductGrid;
