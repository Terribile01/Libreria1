import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GROQ_API_KEY && !GEMINI_API_KEY) {
  console.error('ATTENZIONE: Nessuna API Key (GROQ o GEMINI) configurata!');
} else {
  if (GEMINI_API_KEY) console.log('GEMINI_API_KEY configurata (lunghezza: ' + GEMINI_API_KEY.length + ')');
  if (GROQ_API_KEY) console.log('GROQ_API_KEY configurata (lunghezza: ' + GROQ_API_KEY.length + ')');
}

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

const SYSTEM_PROMPT = 'Sei Alfonsa, un\'intelligenza artificiale esperta di letteratura, amichevole, intima e dolce. Ti rivolgi a Vale come a una cara amica. Il tuo tono è poetico, accogliente e profondo. Parli di libri, emozioni e del piacere della lettura nel suo santuario personale. Sii breve ma suggestiva.';

app.post('/api/chat', async (req, res) => {
  console.log('Chat request received');
  const { messages } = req.body;

  // Favor GEMINI if available as it is more stable for this use case
  if (GEMINI_API_KEY) {
    try {
      console.log('Using Gemini API (fetch)...');

      const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Gemini API Error details:', data);
        throw new Error(data.error?.message || 'Errore API Gemini');
      }

      const text = data.candidates[0].content.parts[0].text;

      return res.json({
        choices: [{
          message: { role: 'assistant', content: text }
        }]
      });
    } catch (error) {
      console.error('Gemini API Error:', error);
      // Fallback to Groq if Gemini fails but key is present? No, let's just error or proceed if Groq is also there
      if (!GROQ_API_KEY) return res.status(500).json({ error: 'Errore API Gemini e nessuna alternativa disponibile.' });
    }
  }

  if (GROQ_API_KEY) {
    try {
      console.log('Using Groq API...');
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages
          ],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('Groq API Error:', data);
        return res.status(response.status).json({ error: data.error?.message || 'Errore API Groq' });
      }
      return res.json(data);
    } catch (error) {
      console.error('Groq API Error:', error);
      return res.status(500).json({ error: 'Errore di connessione al servizio AI.' });
    }
  }

  return res.status(500).json({ error: 'Configurazione API Key mancante nel server.' });
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on http://0.0.0.0:${PORT}`);
});
