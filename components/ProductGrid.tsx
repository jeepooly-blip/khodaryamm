
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
  const itemsPerPage = 20; // Increased items per page for the compact grid

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
      <div className="flex overflow-x-auto pb-3 md:pb-6 mb-1 scrollbar-hide gap-1.5 md:gap-3 justify-start lg:justify-center px-4">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id as any)}
            className={`px-3 md:px-5 py-1.5 md:py-2.5 rounded-xl md:rounded-2xl font-black whitespace-nowrap transition-all duration-300 flex items-center gap-1.5 md:gap-2 flex-shrink-0 text-[10px] md:text-xs ${
              filter === cat.id 
                ? 'bg-[#266041] text-white shadow-md ring-2 ring-green-100' 
                : 'bg-white text-gray-600 border border-gray-100'
            }`}
          >
            <span className="text-base md:text-lg">{cat.icon}</span>
            <span className="uppercase tracking-tight">{cat.label[lang]}</span>
          </button>
        ))}
      </div>

      <div className="px-0 md:px-4">
        {/* Changed gap to gap-[1px] on mobile for the tile look */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-[1px] md:gap-6 w-full bg-gray-100 md:bg-transparent border-y border-gray-100 md:border-0">
          {paginatedProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              lang={lang} 
              onAdd={onAddToCart} 
            />
          ))}
        </div>
        
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 mt-4 mx-4">
            <div className="text-4xl mb-4 grayscale opacity-20">🔍</div>
            <h3 className="text-sm font-black text-gray-800">
              {lang === 'ar' ? 'لم نجد نتائج' : 'No results found'}
            </h3>
          </div>
        )}

        {showPagination && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6 md:mt-12 pb-8 px-4">
            <button
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg bg-white border border-gray-100 text-[#266041] disabled:opacity-30"
            >
              <i className={`bi bi-chevron-${lang === 'ar' ? 'right' : 'left'}`}></i>
            </button>
            
            <div className="flex gap-1 overflow-x-auto max-w-[150px] md:max-w-[300px] scrollbar-hide">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`min-w-[32px] md:min-w-[40px] h-8 md:h-10 px-2 rounded-lg font-black text-[10px] md:text-xs transition-all ${
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
              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg bg-white border border-gray-100 text-[#266041] disabled:opacity-30"
            >
              <i className={`bi bi-chevron-${lang === 'ar' ? 'left' : 'right'}`}></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductGrid;
