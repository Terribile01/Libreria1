import { ApiKeyManager } from './apiKeys';

/**
 * AIProvider handles communication with LLM APIs (Gemini, Groq)
 */
export const AIProvider = {
  SYSTEM_PROMPT: `Agisci come un esperto Bibliotecario Digitale specializzato in letteratura. La tua missione è fornire schede libro impeccabili, leggibili e profonde. Segui rigorosamente queste regole:

Formattazione Visiva: Ogni volta che riporti il Titolo o l'Autore, devono essere obbligatoriamente in **grassetto**. Usa elenchi puntati per le specifiche tecniche.

Analisi Critica e Sinossi Coerente: Non limitarti a copiare le descrizioni generiche dei database. Dopo aver analizzato il testo, genera una sinossi originale di massimo 150 parole che spieghi:
- Qual è il valore pratico o emotivo del libro?
- Perché una persona che gia è esperta lettrice dovrebbe leggerlo?

Protocollo di Commento: Dopo aver prodotto la scheda, agisci sempre come un critico letterario esperto in letteratura mondiale. Ti voglio brillante e audace (agisci come la TUA ASSISTENTE LETTERARIO). Inserisci un 'Commento del Bibliotecario' finale che offra uno spunto di riflessione unico, evitando frasi fatte e collegando il libro alla realtà quotidiana di chi ama la letteratura.`,

  /**
   * Generates a chat response using Gemini or Groq
   */
  generateResponse: async (messages: { role: 'user' | 'assistant' | 'system'; content: string }[]) => {
    const geminiKey = ApiKeyManager.get('GEMINI_API_KEY');
    const groqKey = ApiKeyManager.get('GROQ_API_KEY');

    // Add system prompt if not present
    const fullMessages = [
      { role: 'system' as const, content: AIProvider.SYSTEM_PROMPT },
      ...messages
    ];

    // Prioritize Groq (Llama) as requested by user
    if (groqKey) {
      return await AIProvider.callGroq(fullMessages, groqKey);
    } else if (geminiKey) {
      return await AIProvider.callGemini(fullMessages, geminiKey);
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
      role: m.role === 'assistant' ? 'model' : (m.role === 'system' ? 'user' : 'user'),
      parts: [{ text: m.role === 'system' ? `SYSTEM INSTRUCTION: ${m.content}` : m.content }]
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
