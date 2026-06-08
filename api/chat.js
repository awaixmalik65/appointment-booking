/* ============================================================
   api/chat.js  —  Vercel Serverless Function
   This runs on Vercel's server. Your API key is NEVER
   sent to the browser. Clients cannot see it.

   Set your key in Vercel Dashboard:
   Project → Settings → Environment Variables
   Name:  GROQ_API_KEY   Value: gsk_xxxxxxxxxxxx
   OR
   Name:  GEMINI_API_KEY Value: AIzaxxxxxxxxxx
   ============================================================ */

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { messages, systemPrompt } = req.body;
  if (!messages || !systemPrompt) {
    return res.status(400).json({ error: 'Missing messages or systemPrompt' });
  }

  const groqKey   = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  try {
    let reply = '';

    if (groqKey) {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + groqKey },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 260,
          temperature: 0.2,
          messages: [{ role: 'system', content: systemPrompt }, ...messages]
        })
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message || 'Groq ' + r.status); }
      reply = (await r.json()).choices[0].message.content.trim();

    } else if (geminiKey) {
      const gemMsgs = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: gemMsgs,
            generationConfig: { maxOutputTokens: 260, temperature: 0.2 }
          })
        }
      );
      if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message || 'Gemini ' + r.status); }
      reply = (await r.json()).candidates[0].content.parts[0].text.trim();

    } else {
      return res.status(500).json({ error: 'No API key configured. Add GROQ_API_KEY or GEMINI_API_KEY in Vercel environment variables.' });
    }

    return res.status(200).json({ reply });

  } catch (err) {
    console.error('Proxy error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
