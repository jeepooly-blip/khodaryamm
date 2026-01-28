
import { GoogleGenAI, Chat } from "@google/genai";
import { CartItem, Language } from "../types";

// Safe environment variable retrieval
const getApiKey = (): string => {
  try {
    const val = (typeof process !== 'undefined' && process.env ? process.env.API_KEY : null) || 
                (typeof (window as any).process !== 'undefined' && (window as any).process.env ? (window as any).process.env.API_KEY : null) ||
                (typeof (window as any).env !== 'undefined' ? (window as any).env.API_KEY : null);
    
    return typeof val === 'string' ? val : '';
  } catch (e) {
    return '';
  }
};

export const createShoppingAssistant = (lang: Language, cartItems: CartItem[]): Chat | null => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.warn("Gemini API Key missing. AI Assistant disabled.");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const ingredientList = cartItems.map(i => i.name[lang]).join(", ");
    
    return ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: `You are 'Khodarji AI', a friendly shopping assistant for a Jordanian fresh produce store. 
        The customer's language is ${lang === 'ar' ? 'Arabic' : 'English'}.
        Current cart contents: ${ingredientList || 'Empty'}.
        Help users with:
        1. Recipe ideas based on their cart.
        2. Storage tips for fruits and vegetables.
        3. Seasonal advice for Jordan.
        Keep responses helpful, concise, and professional. Use local Jordanian context where appropriate.`,
        temperature: 0.7,
      },
    });
  } catch (e) {
    console.error("Failed to initialize Gemini AI:", e);
    return null;
  }
};

export const sendAssistantMessage = async (chat: Chat, message: string): Promise<string> => {
  try {
    const result = await chat.sendMessage({ message });
    return result.text || "I'm sorry, I couldn't process that.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Service temporarily unavailable.";
  }
};
