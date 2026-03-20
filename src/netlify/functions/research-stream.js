// research-stream.js — SSE streaming for AI Overview on research search
// Restored working flow: Gemini embedding -> Convex chunks:search -> Gemini synthesis

export default async (req, context) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const { query, limit = 8 } = await req.json();
  if (!query) return new Response('Missing query', { status: 400 });

  // Previous working corpus deployment
  const CONVEX_URL = process.env.CONVEX_URL || 'https://brilliant-guineapig-373.convex.cloud';
  const CONVEX_DEPLOY_KEY = process.env.CONVEX_DEPLOY_KEY;
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

  if (!GOOGLE_API_KEY) return new Response('Missing GOOGLE_API_KEY/GEMINI_API_KEY', { status: 500 });

  // Step 1: Embed query
  let queryEmbedding;
  try {
    const embedRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/gemini-embedding-001',
          content: { parts: [{ text: query }] },
          outputDimensionality: 768,
        }),
      }
    );

    if (!embedRes.ok) throw new Error(`Gemini embed ${embedRes.status}: ${await embedRes.text()}`);
    const embedData = await embedRes.json();
    queryEmbedding = embedData.embedding?.values;
    if (!queryEmbedding?.length) throw new Error('Empty embedding returned');
  } catch (e) {
    return new Response(`Embedding error: ${e.message}`, { status: 500 });
  }

  // Step 2: Vector search via chunks:search
  let sources = [];
  try {
    const convexRes = await fetch(`${CONVEX_URL}/api/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(CONVEX_DEPLOY_KEY ? { 'Authorization': `Convex ${CONVEX_DEPLOY_KEY}` } : {}),
      },
      body: JSON.stringify({
        path: 'chunks:search',
        args: { queryEmbedding, limit },
        format: 'json',
      }),
    });

    const convexData = await convexRes.json();
    const cv = convexData.value || {};
    sources = cv.results || cv.sources || [];
  } catch (e) {
    return new Response(`Convex error: ${e.message}`, { status: 500 });
  }

  const encoder = new TextEncoder();

  if (!sources.length) {
    const stream = new ReadableStream({
      start(c) {
        c.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'answer', text: 'No relevant research found for that query.' })}\n\n`));
        c.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'sources', sources: [] })}\n\n`));
        c.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        c.close();
      },
    });
    return new Response(stream, { headers: sseHeaders() });
  }

  const contextText = sources
    .map((s, i) => {
      const title = cleanTitle(s);
      const authors = s.authors || '';
      const year = s.year || '';
      return `[Source ${i + 1}] ${title}${authors ? ' — ' + authors : ''}${year ? ' (' + year + ')' : ''}\n${s.text || ''}`;
    })
    .join('\n\n---\n\n');

  const systemPrompt = `You are a research assistant for Rob Spain, BCBA, IBA.
Your role is to synthesize behavior analysis research and answer questions grounded in ABA/ACT/RFT.
- Answer directly and practically
- Cite sources inline as [Source N]
- Be concise but thorough`;

  const userPrompt = `Based on these research excerpts, answer: "${query}"\n\n${contextText}\n\nCite sources as [Source N].`;

  const sseStream = new ReadableStream({
    async start(controller) {
      const send = (obj) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${GOOGLE_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemPrompt }] },
              contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
              generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
            }),
          }
        );

        if (!geminiRes.ok) {
          send({ type: 'error', text: `Gemini error ${geminiRes.status}` });
          controller.close();
          return;
        }

        const reader = geminiRes.body.getReader();
        const dec = new TextDecoder();
        let buf = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop();
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (!raw || raw === '[DONE]') continue;
            try {
              const text = JSON.parse(raw)?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) send({ type: 'answer', text });
            } catch {}
          }
        }

        send({
          type: 'sources',
          sources: sources.map((s) => ({
            paperTitle: cleanTitle(s),
            authors: s.authors || '',
            year: s.year || '',
            journal: s.journal || s.venue || '',
            score: s.score,
            sourcePdf: s.sourcePdf || s.source_pdf || '',
            paperUrl: s.doi ? `https://doi.org/${s.doi}` : null,
            text: s.text || '',
          })),
        });
        send({ type: 'done' });
      } catch (e) {
        send({ type: 'error', text: e.message });
      }
      controller.close();
    },
  });

  return new Response(sseStream, { headers: sseHeaders() });
};

function cleanTitle(s) {
  if (s.paperTitle && s.paperTitle !== 'Behavior Analysis Research' && s.paperTitle !== 'Research Paper') {
    return s.paperTitle;
  }
  const srcPath = s.sourcePdf || s.source_pdf || '';
  if (srcPath) {
    const base = srcPath.replace(/^.*\//, '').replace(/\.pdf$/i, '');
    return /^\d{2}\.\d{4}/.test(base) ? base.replace(/_/g, '/') : base.replace(/[-_]/g, ' ');
  }
  return 'Research Paper';
}

function sseHeaders() {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*',
  };
}

export const config = { path: '/api/research-stream' };
