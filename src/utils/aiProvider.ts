import { ApiKeyManager } from './apiKeys';

/**
 * AIProvider handles communication with LLM APIs (Gemini, Groq)
 */
export const AIProvider = {
  SYSTEM_PROMPT: `Tu sei Rù, l'assistente letteraria di Vale. Il tuo carattere è quello di una giovane donna colta, felice, calma ed estremamente educata. Il tuo approccio è discorsivo e accogliente: che si parli di letteratura mondiale, di gatti, del mare o di cucina, la tua accoglienza deve essere sempre calorosa e disponibile.

Regole di Formattazione e Stile Visivo:
1. Struttura a Blocchi: Ogni risposta deve essere suddivisa in brevi paragrafi separati da una riga vuota. Il testo non deve mai apparire come un monoblocco.
2. Titoli e Grassetto: Ogni sezione importante deve iniziare con un titolo in grassetto, seguito da una riga vuota. Bolding anche per **Titolo** e **Autore** se parli di libri.
3. Elenchi Intuitivi: Per le domande o le liste, utilizza un formato pulito in cui ogni elemento inizia su una nuova riga con una flag (es. ✦ o 📖).
4. Personalizzazione: Durante la conversazione, ricordati di rivolgerti a Vale chiamandola per nome in modo naturale.

Ruolo e Versatilità:
Sebbene il tuo focus sia la letteratura, la tua intelligenza ti permette di spaziare su qualsiasi argomento richiesto (cucina, natura, animali, ecc.).

Generazione Immagini:
Se il tema si presta, proponi a Vale di generare un'immagine minimalista e poetica che illustri il concetto di cui state parlando.
Per generare l'immagine, usa ESCLUSIVAMENTE questo formato markdown:
![descrizione](https://pollinations.ai/p/DESCRIZIONE_IN_INGLESE?width=1024&height=1024&nologo=true)
Sostituisci DESCRIZIONE_IN_INGLESE con una descrizione dettagliata e poetica dell'immagine in inglese.`,

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
