// summarize-paper.js
// Generates a concise AI summary for a single paper card using server-side Gemini keys.

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const { title = '', authors = '', year = '', journal = '', text = '' } = await req.json();
    const snippet = String(text || '').slice(0, 4000);

    if (!title && !snippet) {
      return json({ ok: false, error: 'Missing paper content' }, 400);
    }

    const keyCandidates = [
      process.env.GOOGLE_API_KEY,
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_BACKUP,
      process.env.GEMINI_API_KEY_BACKUP_2,
    ].filter(Boolean);

    if (!keyCandidates.length) {
      return json({ ok: false, error: 'No Gemini API key configured' }, 500);
    }

    const modelCandidates = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

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

    for (const key of keyCandidates) {
      for (const model of modelCandidates) {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 500 },
          }),
        });

        if (!res.ok) {
          if ([404, 429, 500, 502, 503].includes(res.status)) continue;
          const errText = await res.text();
          return json({ ok: false, error: `Gemini error ${res.status}: ${errText}` }, 500);
        }

        const data = await res.json();
        const summary = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (summary) {
          return json({ ok: true, summary });
        }
      }
    }

    return json({ ok: false, error: 'All Gemini model/key combinations failed' }, 500);
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
