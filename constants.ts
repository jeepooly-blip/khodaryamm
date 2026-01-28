
import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  // --- DEALS ---
  { 
    id: 'v1', 
    name: { en: "Local Baladi Tomatoes", ar: "بندورة بلدية" }, 
    category: "vegetables", 
    price: 0.85,
    discountPrice: 0.65, 
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500", 
    organic: false,
    unit: "KG"
  },
  { 
    id: 'f1', 
    name: { en: "Valencia Oranges", ar: "برتقال فالنسيا" }, 
    category: "fruits", 
    price: 1.10,
    discountPrice: 0.85, 
    image: "https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?w=500", 
    organic: false,
    unit: "KG"
  },
  { 
    id: 'o1', 
    name: { en: "Medjool Dates Premium", ar: "تمر مجهول نخب أول" }, 
    category: "other", 
    price: 7.00,
    discountPrice: 5.50, 
    image: "https://images.unsplash.com/photo-1589135091720-6d09323565e3?w=500", 
    organic: false,
    unit: "KG"
  },

  // --- VEGETABLES ---
  { 
    id: 'v2', 
    name: { en: "Fresh Cucumbers", ar: "خيار بلدي طازج" }, 
    category: "vegetables", 
    price: 0.75, 
    image: "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=500", 
    organic: false,
    unit: "KG"
  },
  { 
    id: 'v6', 
    name: { en: "Yellow Potatoes", ar: "بطاطا" }, 
    category: "vegetables", 
    price: 0.50, 
    image: "https://images.unsplash.com/photo-1518977676601-b53f02ac6d31?w=500", 
    organic: false,
    unit: "KG"
  },

  // --- FRUITS ---
  { 
    id: 'f3', 
    name: { en: "Red Gala Apples", ar: "تفاح أحمر جالا" }, 
    category: "fruits", 
    price: 1.35, 
    image: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=500", 
    organic: false,
    unit: "KG"
  },

  // --- OTHER ---
  { 
    id: 'o2', 
    name: { en: "Local Mountain Honey", ar: "عسل جبلي بلدي" }, 
    category: "other", 
    price: 12.00, 
    image: "https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=500", 
    organic: true,
    unit: "Jar"
  },
  { 
    id: 'o3', 
    name: { en: "Extra Virgin Olive Oil", ar: "زيت زيتون بكر" }, 
    category: "other", 
    price: 9.50, 
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500", 
    organic: true,
    unit: "Liter"
  }
];

export const COLORS = {
  primary: '#266041',
  secondary: '#ff5722',
  accent: '#1a4a32',
  price: '#ff6b35',
};
