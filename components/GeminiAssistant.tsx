
import React, { useState, useEffect, useRef } from 'react';
import { CartItem, Language, Product } from '../types';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';

interface GeminiAssistantProps {
  cartItems: CartItem[];
  products: Product[];
  lang: Language;
  onAddToCart: (p: Product, q: number) => void;
}

// Strictly following Guidelines for Encoding/Decoding
function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ cartItems, products, lang, onAddToCart }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [recentAdditions, setRecentAdditions] = useState<{name: string, qty: number, id: string}[]>([]);
  const [status, setStatus] = useState<string>('');

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopVoice();
    }
  }, [isOpen]);

  const addToBasketTool: FunctionDeclaration = {
    name: 'add_to_basket',
    parameters: {
      type: Type.OBJECT,
      description: 'Add specific items to the shopping basket based on user request.',
      properties: {
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              product_id: { type: Type.STRING, description: 'The unique product ID' },
              quantity: { type: Type.NUMBER, description: 'Amount to add' }
            },
            required: ['product_id', 'quantity']
          }
        }
      },
      required: ['items']
    }
  };

  const stopVoice = () => {
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (e) {}
      sessionRef.current = null;
    }
    setIsVoiceActive(false);
    setStatus('');
    for (const source of sourcesRef.current) {
      try { source.stop(); } catch (e) {}
    }
    sourcesRef.current.clear();
  };

  const startVoice = async () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      alert("AI Service Unavailable: API Key missing.");
      return;
    }

    try {
      setIsVoiceActive(true);
      setStatus(lang === 'ar' ? 'جاري الاتصال...' : 'Connecting...');
      
      const ai = new GoogleGenAI({ apiKey });
      
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      if (!outAudioContextRef.current) outAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const productCatalog = products.map(p => `- ID: ${p.id}, Name: ${p.name[lang]}, Price: ${p.price} JD/${p.unit}`).join('\n');

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          tools: [{ functionDeclarations: [addToBasketTool] }],
          systemInstruction: `You are the Khodarji Voice Concierge.
          Your specific task is to listen to customer orders and add them to their cart using the 'add_to_basket' tool.
          
          Product Catalog:
          ${productCatalog}
          
          Rules:
          1. Speak like a friendly Jordanian market assistant.
          2. When a user says an item name (e.g. "tomatoes"), find the closest match in ID.
          3. If the user specifies a quantity, use it. If not, assume 1 unit.
          4. Confirm what you've added verbally.
          5. After adding, tell the user they can review their cart anytime.
          6. Support both Arabic and English naturally.`
        },
        callbacks: {
          onopen: () => {
            setStatus(lang === 'ar' ? 'أسمعك، تفضل بالطلب' : 'Listening... Ask me for anything!');
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Handle Audio Playback
            const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outAudioContextRef.current) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outAudioContextRef.current.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outAudioContextRef.current, 24000, 1);
              const source = outAudioContextRef.current.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outAudioContextRef.current.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            // Handle Function Calls
            if (msg.toolCall) {
              for (const fc of msg.toolCall.functionCalls) {
                if (fc.name === 'add_to_basket') {
                  const items = (fc.args as any).items || [];
                  items.forEach((item: any) => {
                    const p = products.find(prod => prod.id === item.product_id);
                    if (p) {
                      onAddToCart(p, item.quantity);
                      setRecentAdditions(prev => [{name: p.name[lang], qty: item.quantity, id: p.id}, ...prev].slice(0, 5));
                    }
                  });
                  
                  sessionPromise.then(s => s.sendToolResponse({
                    functionResponses: {
                      id: fc.id,
                      name: fc.name,
                      response: { result: "Success: cart updated" }
                    }
                  }));
                }
              }
            }
          },
          onclose: () => {
            setIsVoiceActive(false);
            setStatus('');
          },
          onerror: (e) => {
            console.error("Assistant Error:", e);
            setIsVoiceActive(false);
            setStatus(lang === 'ar' ? 'عذراً، حدث خطأ' : 'Sorry, an error occurred');
          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (e) {
      console.error(e);
      setIsVoiceActive(false);
      setStatus('');
    }
  };

  return (
    <div className={`fixed bottom-6 ${lang === 'ar' ? 'left-6' : 'right-6'} z-[95]`}>
      {isOpen ? (
        <div className="bg-white w-85 md:w-96 h-[550px] rounded-[3rem] shadow-[0_20px_80px_rgba(0,0,0,0.3)] border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
          {/* Assistant Header */}
          <div className={`p-6 text-white flex items-center justify-between transition-all duration-500 ${isVoiceActive ? 'bg-emerald-600' : 'bg-[#266041]'}`}>
            <div className="flex items-center gap-4">
              <div className="bg-white/10 p-3 rounded-2xl border border-white/10 relative">
                {isVoiceActive && (
                  <div className="absolute -inset-1 bg-white/20 rounded-2xl animate-ping"></div>
                )}
                <i className={`bi ${isVoiceActive ? 'bi-mic-fill' : 'bi-robot'} text-xl`}></i>
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider">{lang === 'ar' ? 'مساعد خضرجي' : 'Khodarji AI'}</h3>
                <p className="text-[10px] font-bold opacity-50 uppercase tracking-[0.2em]">{isVoiceActive ? 'Live Connection' : 'Voice Ordering Ready'}</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-10 h-10 flex items-center justify-center hover:bg-black/10 rounded-full transition-colors">
              <i className="bi bi-x-lg text-lg"></i>
            </button>
          </div>

          {/* Visualizer & Status */}
          <div className="bg-gray-50 flex-grow p-6 flex flex-col">
            <div className="flex-grow flex flex-col items-center justify-center text-center">
              {isVoiceActive ? (
                <div className="space-y-6 w-full">
                  <div className="flex items-center justify-center gap-1.5 h-16">
                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                      <div key={i} className="w-1.5 bg-emerald-500 rounded-full animate-v-pulse" style={{ animationDelay: `${i * 0.1}s`, height: '20%' }}></div>
                    ))}
                  </div>
                  <p className="text-gray-800 font-black text-lg px-4 leading-tight">{status}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{lang === 'ar' ? 'قل مثلاً: كيلوين موز و١٠ كيلو بندورة' : 'Say: 2kg bananas and 10kg tomatoes'}</p>
                </div>
              ) : (
                <div className="space-y-4">
                   <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center text-3xl mx-auto mb-4">
                     🎙️
                   </div>
                   <h4 className="text-gray-800 font-black text-xl">{lang === 'ar' ? 'اطلب بصوتك' : 'Order with Voice'}</h4>
                   <p className="text-gray-400 text-sm font-bold max-w-[200px] mx-auto leading-relaxed">
                     {lang === 'ar' ? 'تحدث معي لتجهيز سلتك بالمنتجات الطازجة فوراً' : 'Talk to me to prepare your basket with fresh products instantly'}
                   </p>
                </div>
              )}
            </div>

            {/* Recent Additions Panel */}
            {recentAdditions.length > 0 && (
              <div className="mt-4 bg-white rounded-3xl p-5 border border-gray-100 shadow-sm animate-in slide-in-from-bottom-4">
                <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-50 pb-2">{lang === 'ar' ? 'آخر ما تمت إضافته' : 'Recent Voice Additions'}</h5>
                <div className="space-y-2">
                  {recentAdditions.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-emerald-50/50 p-2 rounded-xl border border-emerald-100 animate-in fade-in">
                       <span className="text-xs font-black text-emerald-900">{item.name}</span>
                       <span className="text-[10px] font-bold text-emerald-600 bg-white px-2 py-0.5 rounded-lg border border-emerald-100">{item.qty} units</span>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    // This will eventually open the cart via the parent's state
                    document.querySelector<HTMLButtonElement>('[aria-label="cart-toggle"]')?.click();
                  }}
                  className="w-full mt-4 text-[10px] font-black text-[#266041] hover:underline uppercase tracking-widest"
                >
                  {lang === 'ar' ? 'مراجعة السلة كاملة' : 'Review Full Basket'}
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-6 bg-white border-t border-gray-100">
            <button 
              onClick={isVoiceActive ? stopVoice : startVoice}
              className={`w-full py-5 rounded-3xl font-black text-base flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl ${
                isVoiceActive ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-emerald-600 text-white shadow-emerald-500/20'
              }`}
            >
              <i className={`bi ${isVoiceActive ? 'bi-stop-circle-fill' : 'bi-mic-fill'} text-2xl`}></i>
              <span>{isVoiceActive ? (lang === 'ar' ? 'إيقاف المساعد' : 'Stop Assistant') : (lang === 'ar' ? 'ابدأ الطلب بالصوت' : 'Start Voice Order')}</span>
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white w-16 h-16 md:w-20 md:h-20 rounded-full shadow-2xl shadow-orange-500/40 transition-all transform hover:scale-110 active:scale-90 flex items-center justify-center group"
        >
          <div className="absolute -top-12 right-0 bg-white text-gray-800 text-[10px] font-black py-2 px-4 rounded-xl shadow-lg border border-gray-100 opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none translate-y-2 group-hover:translate-y-0">
            {lang === 'ar' ? 'اطلب بصوتك 🎙️' : 'Order with your voice 🎙️'}
          </div>
          <i className="bi bi-mic-fill text-2xl md:text-3xl"></i>
        </button>
      )}

      <style>{`
        @keyframes v-pulse {
          0%, 100% { height: 20%; opacity: 0.5; }
          50% { height: 100%; opacity: 1; }
        }
        .animate-v-pulse {
          animation: v-pulse 0.8s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default GeminiAssistant;
