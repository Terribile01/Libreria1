import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error('ATTENZIONE: GROQ_API_KEY non è configurata!');
} else {
  console.log('GROQ_API_KEY configurata (lunghezza: ' + GROQ_API_KEY.length + ')');
}

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'Configurazione API Key mancante nel server.' });
  }

  try {
    console.log('Sending request to Groq...');
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Sei Alfonsa, un\'intelligenza artificiale esperta di letteratura, amichevole, intima e dolce. Ti rivolgi a Vale come a una cara amica. Il tuo tono è poetico, accogliente e profondo. Parli di libri, emozioni e del piacere della lettura nel suo santuario personale. Sii breve ma suggestiva.'
          },
          ...messages
        ],
      }),
    });

    const data = await response.json();
    console.log('Groq response status:', response.status);

    if (!response.ok) {
      console.error('Groq API Error:', data);
      return res.status(response.status).json({ error: data.error?.message || 'Errore API Groq' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error calling Groq API:', error);
    res.status(500).json({ error: 'Errore di connessione al servizio AI.' });
  }
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on http://0.0.0.0:${PORT}`);
});
