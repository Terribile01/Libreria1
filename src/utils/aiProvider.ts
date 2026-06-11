import { ApiKeyManager } from './apiKeys';

/**
 * AIProvider handles communication with LLM APIs (Gemini, Groq)
 */
export const AIProvider = {
  /**
   * Generates a chat response using Gemini or Groq
   */
  generateResponse: async (messages: { role: 'user' | 'assistant'; content: string }[]) => {
    const geminiKey = ApiKeyManager.get('GEMINI_API_KEY');
    const groqKey = ApiKeyManager.get('GROQ_API_KEY');

    // Prioritize Groq (Llama) as requested by user
    if (groqKey) {
      return await AIProvider.callGroq(messages, groqKey);
    } else if (geminiKey) {
      return await AIProvider.callGemini(messages, geminiKey);
    } else {
      throw new Error('Nessuna chiave API configurata per Rù (Groq o Gemini).');
    }
  },

  /**
   * Direct fetch call to Gemini (Google AI Studio)
   */
  callGemini: async (messages: any[], apiKey: string) => {
    // Format messages for Gemini API
    // Gemini expects { contents: [{ role: "user", parts: [{ text: "..." }] }] }
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Errore API Gemini');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  },

  /**
   * Call Groq Cloud API
   */
  callGroq: async (messages: any[], apiKey: string) => {
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Errore API Groq');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  },

  /**
   * Generates a poetic introduction for a book
   */
  generatePoeticIntro: async (title: string, author: string) => {
    const prompt = `Sei Rù, la guida letteraria del "Santuario". Scrivi una breve presentazione poetica e suggestiva (massimo 3-4 frasi) per il libro "${title}" di ${author}.
    Usa un tono accogliente, profondo e leggermente misterioso. Concentrati sull'essenza dell'opera e sul viaggio spirituale che offre al lettore. Non usare prefazioni come "Ecco la presentazione", vai direttamente al testo poetico.`;

    return await AIProvider.generateResponse([{ role: 'user', content: prompt }]);
  }
};
