
import React from 'react';
import { Order, Language } from '../types';

interface OrderHistoryProps {
  orders: Order[];
  lang: Language;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ orders, lang, onCancel, onDelete }) => {
  const handleSendToWhatsApp = (order: Order) => {
    let msg = lang === 'ar' 
      ? `🥬 *طلب جديد مؤكد من متجر خضرجي*\n`
      : `🥬 *Confirmed New Order from Khodarji Store*\n`;
      
    msg += `--------------------------\n`;
    msg += `🆔 *Order ID: #${order.id}*\n`;
    msg += lang === 'ar' ? `📞 رقم الهاتف: ${order.customerPhone}\n` : `📞 Phone: ${order.customerPhone}\n`;
    msg += lang === 'ar' ? `📍 المدينة: ${order.customerCity}\n` : `📍 City: ${order.customerCity}\n`;
    msg += `\n*📦 ${lang === 'ar' ? 'المنتجات المطلوبة:' : 'Items:'}*\n`;
    
    order.items.forEach(item => {
      const activePrice = item.discountPrice && item.discountPrice < item.price ? item.discountPrice : item.price;
      const lineTotal = (activePrice * item.quantity).toFixed(2);
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

  const handleCancelClick = (orderId: string) => {
    const confirmMsg = lang === 'ar' ? 'هل أنت متأكد من إلغاء هذا الطلب؟' : 'Are you sure you want to cancel this order?';
    if (window.confirm(confirmMsg)) onCancel(orderId);
  };

  const handleDeleteClick = (orderId: string) => {
    const confirmMsg = lang === 'ar' ? 'سيتم حذف هذا الطلب نهائياً من القائمة. متابعة؟' : 'This order will be permanently removed from your list. Continue?';
    if (window.confirm(confirmMsg)) onDelete(orderId);
  };

  const pendingOrder = orders.find(o => o.status === 'pending');

  return (
    <div className="py-4 md:py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Action Required Spotlight - Optimized for mobile visibility */}
      {pendingOrder && (
        <div className="mb-10 relative">
          <div className="bg-white border-2 border-emerald-500 rounded-[2.5rem] p-6 md:p-10 shadow-2xl flex flex-col items-center text-center overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full translate-x-1/2 -translate-y-1/2 -z-0 opacity-50"></div>
            
            <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-3xl md:text-4xl mb-6 shadow-xl relative z-10">
              <i className="bi bi-whatsapp"></i>
            </div>
            
            <h2 className="text-2xl md:text-4xl font-black text-gray-900 mb-4 relative z-10">
              {lang === 'ar' ? 'أكمل طلبك الآن' : 'Complete Your Order'}
            </h2>
            
            <p className="text-gray-500 font-bold text-sm md:text-lg max-w-lg mb-8 relative z-10">
              {lang === 'ar' 
                ? 'تم تسجيل طلبك. يرجى الضغط للإرسال عبر الواتساب لتأكيد التوصيل فوراً.' 
                : 'Your order is recorded. Please tap below to send via WhatsApp for immediate confirmation.'}
            </p>

            <div className="w-full max-w-sm flex flex-col gap-3 relative z-10">
              <button 
                onClick={() => handleSendToWhatsApp(pendingOrder)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-2xl font-black text-xl shadow-xl transition-all flex items-center justify-center gap-4 active:scale-95 animate-pulse-subtle"
              >
                <i className="bi bi-send-check-fill"></i>
                <span>{lang === 'ar' ? 'إرسال للواتساب' : 'WhatsApp'}</span>
              </button>
              
              <button 
                onClick={() => handleCancelClick(pendingOrder.id)}
                className="text-red-400 hover:text-red-600 font-black text-[10px] uppercase tracking-widest py-2 transition-colors"
              >
                {lang === 'ar' ? 'إلغاء الطلب' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8 px-2">
        <h2 className="text-2xl md:text-3xl font-black text-gray-800 flex items-center gap-3">
          <span className="bg-[#266041] text-white p-2.5 rounded-xl shadow-lg border border-green-800/20">
            <i className="bi bi-clock-history"></i>
          </span>
          {lang === 'ar' ? 'سجل الطلبات' : 'Order History'}
        </h2>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-20 text-center border border-gray-100 shadow-sm">
          <div className="text-7xl mb-6 opacity-10 grayscale">🧺</div>
          <p className="text-gray-400 font-black text-lg uppercase tracking-widest italic">
            {lang === 'ar' ? 'لا يوجد طلبات سابقة' : 'No previous orders'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div 
              key={order.id} 
              className={`bg-white rounded-[2rem] border transition-all overflow-hidden relative group ${
                order.status === 'pending' ? 'border-emerald-100 shadow-xl ring-2 ring-emerald-50' : 
                order.status === 'cancelled' ? 'border-gray-50 opacity-60' :
                'border-gray-100 shadow-sm'
              }`}
            >
              {/* Contextual Delete button */}
              <button 
                onClick={() => handleDeleteClick(order.id)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all z-10"
              >
                <i className="bi bi-trash3 text-xs"></i>
              </button>

              <div className={`px-6 py-4 flex flex-wrap items-center justify-between gap-4 ${order.status === 'cancelled' ? 'bg-gray-100/30' : 'bg-gray-50/50'}`}>
                <div className="flex items-center gap-4">
                  <div className="bg-white px-3 py-1 rounded-xl border border-gray-100 font-mono font-black text-[#266041] text-[10px] shadow-sm">
                    #{order.id}
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {new Date(order.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-JO' : 'en-US')}
                  </span>
                </div>
                
                <div className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                  order.status === 'pending' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                  order.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                  order.status === 'cancelled' ? 'bg-gray-100 text-gray-400 border-gray-200' :
                  'bg-red-50 text-red-600 border-red-100'
                }`}>
                  {lang === 'ar' 
                    ? (order.status === 'pending' ? 'بانتظار التأكيد' : order.status === 'completed' ? 'مكتمل' : order.status === 'cancelled' ? 'ملغي' : 'غير معروف')
                    : order.status}
                </div>
              </div>

              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <h4 className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">Summary</h4>
                  <div className="space-y-2">
                    {order.items.slice(0, 2).map((item, i) => (
                      <div key={i} className="flex justify-between text-xs font-bold text-gray-600">
                        <span>{item.quantity} {item.unit} x {item.name[lang]}</span>
                        <span>{((item.discountPrice || item.price) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <p className="text-[9px] text-gray-300 italic font-bold">+{order.items.length - 2} items more...</p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col justify-center items-end border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8">
                   <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Total</p>
                   <p className={`text-3xl font-black ${order.status === 'cancelled' ? 'text-gray-300 line-through' : 'text-[#266041]'}`}>{order.total.toFixed(2)} <span className="text-xs">JD</span></p>
                   
                   <div className="mt-4 flex flex-wrap gap-4 justify-end">
                     {order.status === 'pending' && (
                       <button 
                         onClick={() => handleSendToWhatsApp(order)}
                         className="flex items-center gap-2 bg-[#266041] text-white px-4 py-2 rounded-xl text-[10px] font-black hover:bg-[#1a4a32] transition-all shadow-md active:scale-95"
                       >
                         <i className="bi bi-whatsapp"></i>
                         {lang === 'ar' ? 'إرسال تأكيد' : 'Send to WhatsApp'}
                       </button>
                     )}
                     
                     {order.status !== 'pending' && (
                        <button 
                          onClick={() => handleDeleteClick(order.id)}
                          className="text-gray-300 font-black text-[9px] hover:text-red-500 uppercase tracking-widest transition-colors"
                        >
                          {lang === 'ar' ? 'حذف من السجل' : 'Clear entry'}
                        </button>
                     )}
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse-subtle {
          0%, 100% { transform: scale(1); box-shadow: 0 20px 25px -5px rgba(16, 185, 129, 0.2); }
          50% { transform: scale(1.02); box-shadow: 0 25px 30px -5px rgba(16, 185, 129, 0.4); }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default OrderHistory;
