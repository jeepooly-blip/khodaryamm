
import React, { useState, useEffect, useRef } from 'react';
import { CartItem, Language, Product } from '../types';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';

interface GeminiAssistantProps {
  cartItems: CartItem[];
  products: Product[];
  lang: Language;
  onAddToCart: (p: Product, q: number) => void;
  onOpenCart: () => void;
}

// Robust Base64 to Uint8Array decoding
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Precise PCM decoding for Live API stream
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // Use a DataView to ensure we don't crash on odd-length buffers and maintain alignment
  const view = new DataView(data.buffer);
  const frameCount = data.length / 2 / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Int16 is 2 bytes
      const offset = (i * numChannels + channel) * 2;
      if (offset + 1 < data.length) {
        channelData[i] = view.getInt16(offset, true) / 32768.0;
      }
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

const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ cartItems, products, lang, onAddToCart, onOpenCart }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<string | null>(null);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const stopAudioPlayback = () => {
    sourcesRef.current.forEach(source => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {}
    });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setIsSpeaking(false);
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
    stopAudioPlayback();
    setStatus('');
  };

  const startVoice = async () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return;

    setIsVoiceActive(true);
    setStatus(lang === 'ar' ? 'جاري الاتصال...' : 'Connecting...');

    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      if (!outAudioContextRef.current) outAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const streamPromise = navigator.mediaDevices.getUserMedia({ audio: true });
      await audioContextRef.current.resume();
      await outAudioContextRef.current.resume();

      const catalogInfo = products.map(p => `${p.name[lang]} (ID: ${p.id})`).join(', ');

      const ai = new GoogleGenAI({ apiKey });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { 
            voiceConfig: { 
              prebuiltVoiceConfig: { voiceName: 'Kore' } 
            } 
          },
          tools: [{ 
            functionDeclarations: [{
              name: 'add_to_basket',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        product_id: { type: Type.STRING },
                        quantity: { type: Type.NUMBER }
                      },
                      required: ['product_id', 'quantity']
                    }
                  }
                },
                required: ['items']
              }
            }] 
          }],
          systemInstruction: `You are 'Khodarji Voice', a friendly female Jordanian assistant. 
          
          CONCISION & QUALITY RULES:
          1. Keep responses ultra-concise but ALWAYS finish your sentence completely. 
          2. NEVER recite the catalog or list multiple items.
          3. When adding items, say: "تمت إضافة [Item] لسلتك." or "Added [Item] to your basket."
          4. If the user interrupts, stop talking immediately.
          5. Use natural Jordanian Arabic style.

          CATALOG IDs: ${catalogInfo}
          GREETING: Just say "${lang === 'ar' ? 'تفضل، كيف بقدر أساعدك؟' : 'How can I help you today?'}"`
        },
        callbacks: {
          onopen: async () => {
            const stream = await streamPromise;
            setStatus(lang === 'ar' ? 'أنا أسمعك...' : 'Listening...');
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Priority 1: Handle Interruption (Barge-in)
            if (msg.serverContent?.interrupted) {
              stopAudioPlayback();
              return;
            }

            // Priority 2: Handle Audio Stream
            const parts = msg.serverContent?.modelTurn?.parts || [];
            for (const part of parts) {
              const audioData = part.inlineData?.data;
              if (audioData && outAudioContextRef.current) {
                setIsSpeaking(true);
                // Ensure scheduling is gapless but strictly sequential
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outAudioContextRef.current.currentTime);
                
                const buffer = await decodeAudioData(decode(audioData), outAudioContextRef.current, 24000, 1);
                const source = outAudioContextRef.current.createBufferSource();
                source.buffer = buffer;
                source.connect(outAudioContextRef.current.destination);
                
                source.onended = () => {
                  sourcesRef.current.delete(source);
                  if (sourcesRef.current.size === 0) setIsSpeaking(false);
                };
                
                source.start(nextStartTimeRef.current);
                // Increment timeline by exact buffer duration
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
              }
            }

            // Priority 3: Handle Tool Calls
            if (msg.toolCall) {
              for (const fc of msg.toolCall.functionCalls) {
                if (fc.name === 'add_to_basket') {
                  const items = (fc.args as any).items || [];
                  let addedCount = 0;
                  items.forEach((item: any) => {
                    const p = products.find(prod => prod.id === item.product_id);
                    if (p) {
                      onAddToCart(p, item.quantity);
                      setLastAddedItem(p.name[lang]);
                      addedCount++;
                    }
                  });
                  
                  sessionPromise.then(s => s.sendToolResponse({
                    functionResponses: { 
                      id: fc.id, 
                      name: fc.name, 
                      response: { status: "ok", count: addedCount } 
                    }
                  }));

                  if (addedCount > 0) {
                    onOpenCart();
                    setTimeout(() => setLastAddedItem(null), 3000);
                  }
                }
              }
            }
          },
          onclose: () => stopVoice(),
          onerror: () => stopVoice()
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e) {
      stopVoice();
    }
  };

  return (
    <div className={`fixed bottom-6 ${lang === 'ar' ? 'left-6' : 'right-6'} z-[110]`}>
      {lastAddedItem && (
        <div className="absolute bottom-20 right-0 bg-orange-600 text-white px-6 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 font-black text-xs whitespace-nowrap">
          <i className="bi bi-cart-check-fill mr-2"></i>
          {lang === 'ar' ? `تم إضافة ${lastAddedItem}` : `Added ${lastAddedItem}`}
        </div>
      )}

      {isOpen ? (
        <div className="bg-white w-[300px] rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.3)] border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-300">
          <div className="bg-[#266041] p-5 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                <i className={`bi bi-mic-fill ${isSpeaking ? 'text-emerald-400 animate-pulse' : 'text-white/40'}`}></i>
              </div>
              <h3 className="font-black text-[10px] uppercase tracking-widest">{lang === 'ar' ? 'خضرجي فويس' : 'Khodarji Voice'}</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded-full">
              <i className="bi bi-x-lg text-[10px]"></i>
            </button>
          </div>

          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[180px]">
            {isVoiceActive ? (
              <>
                <div className="flex items-end gap-1 h-8">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div 
                      key={i} 
                      className={`w-1 bg-emerald-500 rounded-full transition-all duration-150 ${isSpeaking ? 'animate-pulse' : 'h-1'}`}
                      style={{ height: isSpeaking ? `${30 + Math.random() * 70}%` : '4px', animationDelay: `${i * 0.05}s` }}
                    ></div>
                  ))}
                </div>
                <p className="text-gray-800 font-black text-[11px] px-2">{status}</p>
              </>
            ) : (
              <>
                <div className="text-4xl animate-bounce">🥦</div>
                <p className="text-gray-400 text-[10px] font-bold px-4 leading-relaxed">
                  {lang === 'ar' ? 'تحدث معي، سأتوقف عن الكلام فور سماع صوتك.' : 'Talk to me. I will stop and listen the moment you speak back.'}
                </p>
              </>
            )}
          </div>

          <div className="p-5 bg-gray-50 border-t border-gray-100">
            <button 
              onClick={isVoiceActive ? stopVoice : startVoice}
              className={`w-full py-3.5 rounded-xl font-black text-[11px] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg ${
                isVoiceActive ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-[#266041] text-white shadow-emerald-900/20'
              }`}
            >
              <i className={`bi ${isVoiceActive ? 'bi-stop-circle-fill' : 'bi-mic-fill'}`}></i>
              <span>{isVoiceActive ? (lang === 'ar' ? 'إنهاء' : 'End') : (lang === 'ar' ? 'ابدأ الطلب' : 'Start Ordering')}</span>
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-[#ff5722] hover:bg-orange-700 text-white w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-2xl flex items-center justify-center border-4 border-white transition-all transform hover:scale-110 active:scale-90 group"
        >
          <i className="bi bi-mic-fill text-xl sm:text-2xl"></i>
        </button>
      )}
    </div>
  );
};

export default GeminiAssistant;
