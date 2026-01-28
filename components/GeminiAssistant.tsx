
import React, { useState, useEffect, useRef } from 'react';
import { CartItem, Language, ChatMessage } from '../types';
import { createShoppingAssistant, sendAssistantMessage } from '../services/geminiService';
import { Chat } from '@google/genai';

interface GeminiAssistantProps {
  cartItems: CartItem[];
  lang: Language;
}

const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ cartItems, lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: lang === 'ar' ? 'أهلاً بك! أنا مساعد خضرجي الذكي، كيف يمكنني مساعدتك اليوم؟' : 'Hello! I am your Khodarji AI assistant. How can I help you today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Attempt to create assistant only if not already created
    if (!chatRef.current) {
      chatRef.current = createShoppingAssistant(lang, cartItems);
    }
  }, [lang, cartItems]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !chatRef.current || loading) {
      if (!chatRef.current) {
        setMessages(prev => [...prev, { role: 'model', text: lang === 'ar' ? 'عذراً، خدمة المساعد الذكي غير متوفرة حالياً.' : 'Sorry, the AI assistant is currently unavailable.' }]);
      }
      return;
    }

    const userMsg = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const response = await sendAssistantMessage(chatRef.current, userMsg);
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setLoading(false);
  };

  return (
    <div className={`fixed bottom-6 ${lang === 'ar' ? 'left-6' : 'right-6'} z-[90] flex flex-col items-end`}>
      {isOpen ? (
        <div className="bg-white w-80 md:w-96 h-[450px] rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-orange-500 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl text-xl">👨‍🍳</div>
              <div>
                <h3 className="font-bold text-sm leading-none">{lang === 'ar' ? 'مساعد خضرجي الذكي' : 'Khodarji AI Assistant'}</h3>
                <span className="text-[10px] opacity-70">Online & ready to help</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-black/10 rounded-full p-1 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                  m.role === 'user' 
                    ? 'bg-orange-500 text-white rounded-tr-none shadow-md' 
                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100 shadow-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-2 rounded-2xl border border-gray-100 flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input 
              type="text" 
              placeholder={lang === 'ar' ? 'اسألني عن وصفة...' : 'Ask about recipes...'}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              className="flex-grow bg-gray-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button 
              onClick={handleSend}
              disabled={loading || !inputValue.trim()}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white p-2 rounded-xl transition-all shadow-md active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${lang === 'ar' ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-full shadow-2xl shadow-orange-500/30 transition-all transform hover:scale-110 active:scale-90 group relative"
        >
          <div className="absolute -top-12 right-0 bg-white text-gray-800 text-[10px] font-bold py-1 px-3 rounded-xl shadow-lg border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {lang === 'ar' ? 'بحاجة لمساعدة في الطبخ؟' : 'Need cooking help?'}
          </div>
          <span className="text-3xl">🧑‍🍳</span>
        </button>
      )}
    </div>
  );
};

export default GeminiAssistant;
