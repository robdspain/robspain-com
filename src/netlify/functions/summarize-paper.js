// summarize-paper.js
// Generates a concise AI summary for a single paper card using Groq + OpenRouter free fallbacks.

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const { title = '', authors = '', year = '', journal = '', text = '' } = await req.json();
    const snippet = String(text || '').slice(0, 4000);

    if (!title && !snippet) {
      return json({ ok: false, error: 'Missing paper content' }, 400);
    }

    const prompt = `Summarize this behavior-analytic paper for a busy school BCBA.

Return exactly:
1) One-sentence takeaway
2) Key points (3 bullets)
3) Practical use in school setting (2 bullets)

Paper metadata:
Title: ${title || 'Unknown'}
Authors: ${authors || 'Unknown'}
Year: ${year || 'Unknown'}
Journal: ${journal || 'Unknown'}

Excerpt:
${snippet || 'No excerpt available.'}`;

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (GROQ_API_KEY) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: 'You are a concise research summarizer for school-based behavior analysts.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.2,
            max_tokens: 500,
          }),
        });
        if (groqRes.ok) {
          const gj = await groqRes.json();
          const summary = gj?.choices?.[0]?.message?.content?.trim();
          if (summary) return json({ ok: true, summary });
        }
      } catch {}
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (OPENROUTER_API_KEY) {
      const orModels = [
        'meta-llama/llama-3.1-8b-instruct:free',
        'google/gemma-2-9b-it:free',
        'mistralai/mistral-7b-instruct:free',
      ];
      for (const model of orModels) {
        try {
          const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://robspain.com',
              'X-Title': 'Behavior School',
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: 'You are a concise research summarizer for school-based behavior analysts.' },
                { role: 'user', content: prompt },
              ],
              temperature: 0.2,
              max_tokens: 500,
            }),
          });
          if (orRes.ok) {
            const oj = await orRes.json();
            const summary = oj?.choices?.[0]?.message?.content?.trim();
            if (summary) return json({ ok: true, summary });
          }
        } catch {}
      }
    }

    return json({ ok: false, error: 'All AI model fallbacks exhausted' }, 500);
  } catch (e) {
    return json({ ok: false, error: e.message || 'Unknown error' }, 500);
  }
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const config = { path: '/api/summarize-paper' };
