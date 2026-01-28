
import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { Product, Order, User, Enrollment } from '../types';
import { INITIAL_PRODUCTS } from '../constants';

const FALLBACK_URL = 'https://xeagsfoxbtmqeazrnblm.supabase.co';
const FALLBACK_KEY = 'sb_publishable_tZzJ1zkrvLaKSPL1y1dLXQ_WNI95QGh';

const getEnv = (key: string): string => {
  try {
    const searchKeys = [key, `VITE_${key}`, `NEXT_PUBLIC_${key}`, `REACT_APP_${key}`];
    for (const k of searchKeys) {
      const val = (typeof process !== 'undefined' && process.env ? process.env[k] : null) || 
                  (typeof (window as any).process !== 'undefined' && (window as any).process.env ? (window as any).process.env[k] : null) ||
                  (typeof (window as any).env !== 'undefined' ? (window as any).env[k] : null);
      if (val && typeof val === 'string') return val;
    }
  } catch (e) { console.warn(`Error accessing env ${key}:`, e); }
  if (key === 'SUPABASE_URL') return FALLBACK_URL;
  if (key === 'SUPABASE_ANON_KEY') return FALLBACK_KEY;
  return '';
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

class SupabaseService {
  private get client(): SupabaseClient { return supabase; }

  async signOut() {
    await this.client.auth.signOut();
  }

  async signInWithGoogle() {
    await this.client.auth.signInWithOAuth({ 
      provider: 'google', 
      options: { redirectTo: window.location.origin } 
    });
  }

  async signInWithGithub() {
    await this.client.auth.signInWithOAuth({ 
      provider: 'github', 
      options: { redirectTo: window.location.origin } 
    });
  }

  async syncSocialUser(sbUser: SupabaseUser): Promise<User | null> {
    const phone = sbUser.phone || sbUser.email?.split('@')[0] || sbUser.id.substring(0, 9);
    const { data: existingUser } = await this.client
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (existingUser) return existingUser as User;

    const newUser: Partial<User> = {
      phone,
      role: (phone === '790000000' || sbUser.email?.includes('admin')) ? 'admin' : 'customer',
      city: 'Amman'
    };

    const { data: insertedUser } = await this.client
      .from('users')
      .insert([newUser])
      .select()
      .single();

    return insertedUser as User;
  }

  async signIn(phone: string, city?: string, pin?: string): Promise<{ user: User | null; error: string | null }> {
    if (!/^7[0-9]{8}$/.test(phone)) return { user: null, error: 'INVALID_PHONE' };
    
    const isAdminPhone = phone === '790000000';
    const defaultAdminPin = '123456';

    if (isAdminPhone) {
      if (!pin) return { user: null, error: 'PIN_REQUIRED' };
      if (pin !== defaultAdminPin) return { user: null, error: 'INCORRECT_ADMIN_PIN' };
      
      const adminUser: User = { 
        id: 'admin-master-bypass', 
        phone: '790000000', 
        role: 'admin', 
        city: city || 'Amman', 
        pin: defaultAdminPin 
      };

      this.client.from('users').upsert([adminUser]).then(({ error }) => {
        if (error) console.warn("Admin DB sync failed (Non-critical):", error);
      });

      return { user: adminUser, error: null };
    }

    try {
      const { data: existingUser, error: fetchError } = await this.client
        .from('users').select('*').eq('phone', phone).single();

      if (existingUser) {
        if (city && city !== existingUser.city) {
          await this.client.from('users').update({ city }).eq('phone', phone);
          existingUser.city = city;
        }
        return { user: existingUser as User, error: null };
      }

      const newUser: Partial<User> = { 
        phone, 
        city: city || 'Amman', 
        role: 'customer'
      };

      const { data: insertedUser, error: insertError } = await this.client
        .from('users').insert([newUser]).select().single();

      if (insertError) return { user: null, error: insertError.message };
      return { user: insertedUser as User, error: null };
    } catch (e: any) {
      return { user: null, error: e.message };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const { error } = await this.client.from('products').select('id').limit(1);
      return !error;
    } catch { return false; }
  }

  async seedProducts(): Promise<void> {
    await this.bulkSaveProducts(INITIAL_PRODUCTS);
  }

  async bulkSaveProducts(products: Product[]): Promise<void> {
    const payloads = products.map(p => ({
      id: p.id,
      name_en: p.name.en,
      name_ar: p.name.ar,
      category: p.category,
      price: p.price,
      discount_price: p.discountPrice || null,
      image: p.image,
      unit: p.unit,
      organic: p.organic
    }));
    await this.client.from('products').upsert(payloads);
  }

  async getProducts(): Promise<Product[]> {
    const { data, error } = await this.client.from('products').select('*').order('created_at', { ascending: false });
    if (error) return [];
    return data.map((p: any) => ({
      id: p.id,
      name: { en: p.name_en, ar: p.name_ar },
      category: p.category,
      price: Number(p.price),
      discountPrice: p.discount_price ? Number(p.discount_price) : undefined,
      image: p.image,
      unit: p.unit,
      organic: p.organic,
      description: p.description_en ? { en: p.description_en, ar: p.description_ar } : undefined
    }));
  }

  async saveProduct(product: Product): Promise<void> {
    const payload = {
      id: product.id,
      name_en: product.name.en,
      name_ar: product.name.ar,
      category: product.category,
      price: product.price,
      discount_price: product.discountPrice || null,
      image: product.image,
      unit: product.unit,
      organic: product.organic,
      description_en: product.description?.en,
      description_ar: product.description?.ar
    };
    await this.client.from('products').upsert([payload]);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.client.from('products').delete().eq('id', id);
  }

  async getOrders(phone?: string): Promise<Order[]> {
    let query = this.client.from('orders').select('*').order('created_at', { ascending: false });
    if (phone) query = query.eq('customer_phone', phone);
    const { data, error } = await query;
    if (error) return [];
    return data.map((o: any) => ({
      id: o.id,
      customerPhone: o.customer_phone,
      customerCity: o.customer_city,
      items: o.items,
      subtotal: Number(o.subtotal),
      deliveryFee: Number(o.delivery_fee),
      total: Number(o.total),
      status: o.status,
      createdAt: o.created_at
    }));
  }

  async createOrder(order: Order): Promise<void> {
    await this.client.from('orders').insert([{
      id: order.id,
      customer_phone: order.customerPhone,
      customer_city: order.customerCity,
      items: order.items,
      subtotal: order.subtotal,
      delivery_fee: order.deliveryFee,
      total: order.total,
      status: order.status,
      created_at: order.createdAt
    }]);
  }

  async updateOrderStatus(id: string, status: Order['status']): Promise<Order | null> {
    const { data, error } = await this.client.from('orders').update({ status }).eq('id', id).select().single();
    if (error) return null;
    return {
      id: data.id,
      customerPhone: data.customer_phone,
      customerCity: data.customer_city,
      items: data.items,
      subtotal: Number(data.subtotal),
      deliveryFee: Number(data.delivery_fee),
      total: Number(data.total),
      status: data.status,
      createdAt: data.created_at
    };
  }

  async deleteOrder(id: string): Promise<void> {
    await this.client.from('orders').delete().eq('id', id);
  }

  async addEnrollment(enrollment: Omit<Enrollment, 'id' | 'createdAt'>): Promise<void> {
    await this.client.from('enrollments').insert([{ name: enrollment.name, phone: enrollment.phone }]);
  }

  async getEnrollments(): Promise<Enrollment[]> {
    const { data, error } = await this.client.from('enrollments').select('*').order('created_at', { ascending: false });
    if (error) return [];
    return data.map((e: any) => ({ id: e.id, name: e.name, phone: e.phone, createdAt: e.created_at }));
  }
}

export const db = new SupabaseService();
