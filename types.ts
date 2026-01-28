
export type Language = 'en' | 'ar';

export interface LocalizedString {
  en: string;
  ar: string;
}

export interface Product {
  id: string;
  name: LocalizedString;
  category: 'fruits' | 'vegetables' | 'other' | 'organic';
  price: number;
  discountPrice?: number; // Optional discounted price for special deals
  image: string;
  unit: string;
  organic: boolean;
  description?: LocalizedString;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  customerPhone: string;
  customerCity: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface User {
  id: string;
  phone: string;
  city?: string;
  role: 'customer' | 'admin';
  pin?: string; // Secure PIN for admin access
}

export interface Enrollment {
  id: string;
  name?: string;
  phone: string;
  createdAt: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
