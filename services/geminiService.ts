
import { GoogleGenAI, Chat } from "@google/genai";
import { CartItem, Language } from "../types";

// Assistant initialization strictly following @google/genai guidelines
export const createShoppingAssistant = (lang: Language, cartItems: CartItem[]): Chat | null => {
  // Guidelines: The API key must be obtained exclusively from the environment variable process.env.API_KEY.
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.warn("Gemini API Key missing. AI Assistant disabled.");
    return null;
  }

  try {
    // Guidelines: Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const ingredientList = cartItems.map(i => i.name[lang]).join(", ");
    
    // Guidelines: Use 'gemini-3-flash-preview' for basic text tasks
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
    // Guidelines: Use the .text property directly (not a method text())
    return result.text || "I'm sorry, I couldn't process that.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Service temporarily unavailable.";
  }
};
