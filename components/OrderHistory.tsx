
import React from 'react';
import { Order, Language } from '../types';

interface OrderHistoryProps {
  orders: Order[];
  lang: Language;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ orders, lang }) => {
  const handleSendToWhatsApp = (order: Order) => {
    let msg = lang === 'ar' 
      ? `🥬 *طلب جديد مؤكد من متجر خضرجي*\n`
      : `🥬 *Confirmed New Order from Khodarji Store*\n`;
      
    msg += `--------------------------\n`;
    msg += `🆔 *Order ID: #${order.id}*\n`;
    msg += lang === 'ar' ? `📞 رقم الهاتف: ${order.customerPhone}\n` : `📞 Phone: ${order.customerPhone}\n`;
    msg += lang === 'ar' ? `📍 المدينة: ${order.customerCity}\n` : `📍 City: ${order.customerCity}\n`;
    msg += `\n*📦 ${lang === 'ar' ? 'المنتجات المطلوبة:' : 'Requested Items:'}*\n`;
    
    order.items.forEach(item => {
      const lineTotal = (item.price * item.quantity).toFixed(2);
      msg += `• ${item.name[lang]} (${item.quantity} ${item.unit}) -> ${lineTotal} JD\n`;
    });
    
    msg += `\n--------------------------\n`;
    msg += `💰 *${lang === 'ar' ? 'الإجمالي:' : 'Total:'}* ${order.total.toFixed(2)} JD\n`;
    
    if (order.deliveryFee === 0) {
      msg += lang === 'ar' ? `🚚 التوصيل: *مجاني* ✅\n` : `🚚 Delivery: *FREE* ✅\n`;
    } else {
      msg += lang === 'ar' ? `🚚 رسوم التوصيل: 2.00 JD\n` : `🚚 Delivery Fee: 2.00 JD\n`;
    }
    
    msg += `--------------------------\n`;
    msg += lang === 'ar' ? `🙏 يرجى تأكيد استلام الطلب وبدء التجهيز.` : `🙏 Please confirm receipt and start processing.`;

    const whatsappNumber = "962790801695";
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="py-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black text-gray-800 flex items-center gap-3">
          <span className="bg-green-100 p-2 rounded-2xl shadow-sm">📦</span>
          {lang === 'ar' ? 'طلباتي السابقة' : 'My Orders'}
        </h2>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-gray-100 shadow-inner">
          <div className="text-7xl mb-6 opacity-20">🧺</div>
          <p className="text-gray-400 font-black text-lg">
            {lang === 'ar' ? 'لا يوجد لديك طلبات حتى الآن' : 'You haven\'t placed any orders yet'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 text-[#266041] font-black underline hover:text-[#1a4a32]"
          >
            {lang === 'ar' ? 'اكتشف المنتجات الطازجة' : 'Discover fresh produce'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden group hover:border-green-200 transition-all">
              <div className="p-6 bg-gray-50 flex flex-wrap items-center justify-between gap-4 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 font-mono font-black text-green-800">
                    #{order.id}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                      {lang === 'ar' ? 'تاريخ الطلب' : 'Ordered on'}
                    </p>
                    <p className="text-sm font-bold text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-JO' : 'en-US')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                    order.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                    order.status === 'completed' ? 'bg-green-100 text-green-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {lang === 'ar' 
                      ? (order.status === 'pending' ? 'قيد الانتظار' : order.status === 'completed' ? 'مكتمل' : 'ملغي')
                      : order.status}
                  </span>
                </div>
              </div>

              <div className="p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">
                      {lang === 'ar' ? 'المنتجات' : 'Items List'}
                    </h5>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-3">
                          <img src={item.image} className="w-10 h-10 rounded-lg object-cover border border-gray-50" alt="" />
                          <span className="font-bold text-gray-700">{item.name[lang]} <span className="text-gray-400 font-medium">x{item.quantity}</span></span>
                        </div>
                        <span className="font-black text-gray-900">{(item.price * item.quantity).toFixed(2)} <span className="text-[10px] text-gray-400">JD</span></span>
                      </div>
                    ))}
                    <div className="pt-4 mt-4 border-t border-gray-50">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{lang === 'ar' ? 'عنوان التوصيل' : 'Delivery Location'}</p>
                      <p className="text-sm font-bold text-[#266041]">{order.customerCity}</p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between bg-green-50/30 p-6 rounded-3xl border border-green-50">
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-xs font-bold text-gray-500">
                        <span>{lang === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                        <span>{order.subtotal.toFixed(2)} JD</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-gray-500">
                        <span>{lang === 'ar' ? 'رسوم التوصيل' : 'Delivery'}</span>
                        <span>{order.deliveryFee === 0 ? (lang === 'ar' ? 'مجاني' : 'FREE') : `${order.deliveryFee.toFixed(2)} JD`}</span>
                      </div>
                      <div className="flex justify-between text-2xl font-black text-[#266041] pt-3 border-t border-dashed border-green-100">
                        <span>{lang === 'ar' ? 'الإجمالي' : 'Total'}</span>
                        <span>{order.total.toFixed(2)} JD</span>
                      </div>
                    </div>

                    {order.status === 'pending' && (
                      <button 
                        onClick={() => handleSendToWhatsApp(order)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-black text-base shadow-lg shadow-green-600/20 transition-all flex items-center justify-center gap-3 active:scale-95 group"
                      >
                        <i className="bi bi-whatsapp text-2xl group-hover:scale-110 transition-transform"></i>
                        {lang === 'ar' ? 'أرسل الطلب عبر واتساب الآن' : 'Send Order to WhatsApp Now'}
                      </button>
                    )}
                    
                    {order.status !== 'pending' && (
                      <div className="text-center py-4 bg-white/50 rounded-2xl border border-white/80">
                         <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                           {lang === 'ar' ? 'هذا الطلب مسجل لدينا' : 'This order is recorded'}
                         </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
