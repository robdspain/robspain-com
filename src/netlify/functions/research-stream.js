// research-stream.js — SSE streaming for AI Overview on research search
// Calls Convex to get vector search results, then streams Gemini synthesis

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { query, limit = 8 } = await req.json();
  if (!query) return new Response('Missing query', { status: 400 });

  const CONVEX_URL = process.env.CONVEX_URL || 'https://third-loris-453.convex.cloud';
  const CONVEX_DEPLOY_KEY = process.env.CONVEX_DEPLOY_KEY;
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

  if (!GOOGLE_API_KEY) return new Response('Missing GOOGLE_API_KEY', { status: 500 });

  // Step 1: Run vector search via Convex (non-streaming)
  let sources = [];
  try {
    const convexRes = await fetch(`${CONVEX_URL}/api/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(CONVEX_DEPLOY_KEY ? { 'Authorization': `Convex ${CONVEX_DEPLOY_KEY}` } : {}),
      },
      body: JSON.stringify({
        path: 'researchCorpus:search',
        args: { query, limit },
        format: 'json',
      }),
    });
    const convexData = await convexRes.json();
    const cv = convexData.value || {}; sources = cv.results || cv.sources || cv || [];
  } catch (e) {
    return new Response(`Convex error: ${e.message}`, { status: 500 });
  }

  if (!sources.length) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'answer', text: 'No relevant research found for that query.' })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'sources', sources: [] })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        controller.close();
      }
    });
    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' }
    });
  }

  // Step 2: Build context from sources
  const contextText = sources.map((s, i) => {
    const title = s.paperTitle && s.paperTitle !== 'Behavior Analysis Research' ? s.paperTitle : (s.sourcePdf || '').replace(/^.*\//, '').replace(/\.pdf$/, '');
    const authors = s.authors || '';
    const year = s.year || '';
    return `[Source ${i + 1}] ${title}${authors ? ' — ' + authors : ''}${year ? ' (' + year + ')' : ''}\n${s.text || s.snippet || ''}`;
  }).join('\n\n---\n\n');

  const systemPrompt = `You are a research assistant for Rob Spain, BCBA, IBA — a school-based behavior analyst with 25+ years of experience.

Your role is to synthesize behavior analysis research and answer questions grounded in ABA, ACT, RFT, and related evidence-based practices. Your scope includes student behavior, teacher/staff behavior, and school-wide systems.

Guidelines:
- Answer directly and practically, as a knowledgeable colleague would
- Cite sources inline as [Source N] — use multiple citations where relevant
- Be concise but thorough
- Use plain language, not academic jargon
- Do not refuse questions about adult staff behavior — staff behavior support is within school BCBA scope`;

  const userPrompt = `Based on the following research excerpts, answer this question: "${query}"

${contextText}

Provide a clear, evidence-based answer citing sources as [Source N].`;

  // Step 3: Stream Gemini response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
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
          const err = await geminiRes.text();
          send({ type: 'error', text: `Gemini error: ${err}` });
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
          buf = lines.pop(); // keep incomplete line in buffer

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (!raw || raw === '[DONE]') continue;
            try {
              const parsed = JSON.parse(raw);
              const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) send({ type: 'answer', text });
            } catch {
              // skip malformed
            }
          }
        }

        // Send sources after answer completes
        const cleanSources = sources.map((s) => {
          const srcPath = s.sourcePdf || s.source_pdf || '';
          const isGeneric = !s.paperTitle || s.paperTitle === 'Behavior Analysis Research' || s.paperTitle === 'Research Paper';
          let title = s.paperTitle || '';
          if (isGeneric && srcPath) {
            const base = srcPath.replace(/^.*\//, '').replace(/\.pdf$/i, '');
            title = /^\d{2}\.\d{4}/.test(base) ? base.replace(/_/g, '/') : base.replace(/[-_]/g, ' ');
          }
          const doi = (s.chunkId || s.chunk_id || '').replace(/_chunk\d+$/, '').replace('_', '/');
          return {
            paperTitle: title || 'Research Paper',
            authors: s.authors || '',
            year: s.year || '',
            journal: s.journal || s.venue || '',
            score: s.score,
            sourcePdf: srcPath,
            paperUrl: doi ? `https://doi.org/${doi}` : null,
            text: s.text || s.snippet || '',
          };
        });

        send({ type: 'sources', sources: cleanSources });
        send({ type: 'done' });
      } catch (e) {
        send({ type: 'error', text: e.message });
      }

      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
    }
  });
};

export const config = { path: '/api/research-stream' };
