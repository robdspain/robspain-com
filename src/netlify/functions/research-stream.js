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
  const BACKUP_GEMINI_API_KEY = process.env.GEMINI_API_KEY_BACKUP;
  const BACKUP_GEMINI_API_KEY_2 = process.env.GEMINI_API_KEY_BACKUP_2;

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

  // Enrich sparse PMC-only metadata (title/authors/year/journal)
  sources = await enrichSourcesMetadata(sources);

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

  const systemPrompt = `You are a research synthesis engine.
Generate a Google-style AI overview grounded only in the provided sources.
Format:
1) One-paragraph direct answer (plain language)
2) Key findings (3-5 bullet points)
3) Practical implications for school teams (2-4 bullets)
Rules:
- Cite sources inline as [Source N]
- Do not invent facts
- Keep it clear, concrete, and professional`;

  const userPrompt = `Based on these research excerpts, answer: "${query}"\n\n${contextText}\n\nCite sources as [Source N].`;

  const sseStream = new ReadableStream({
    async start(controller) {
      const send = (obj) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      try {
        const makeGeminiRequest = (apiKey) => fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:streamGenerateContent?alt=sse&key=${apiKey}`,
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

        let geminiRes = await makeGeminiRequest(GOOGLE_API_KEY);

        // Automatic backup-key failover on rate limit
        if (geminiRes.status === 429 && BACKUP_GEMINI_API_KEY) {
          geminiRes = await makeGeminiRequest(BACKUP_GEMINI_API_KEY);
        }
        if (geminiRes.status === 429 && BACKUP_GEMINI_API_KEY_2) {
          geminiRes = await makeGeminiRequest(BACKUP_GEMINI_API_KEY_2);
        }

        if (!geminiRes.ok) {
          const status = geminiRes.status;
          const fallbackText = status === 429
            ? 'AI summary is rate-limited right now (Gemini 429 after backup key failover). Showing source-backed fallback guidance below.'
            : `AI summary temporarily unavailable (Gemini ${status}). Showing source-backed fallback guidance below.`;

          const top = sources.slice(0, 3);
          const fallbackGuidance = top.length
            ? top
                .map((s, i) => {
                  const t = cleanTitle(s);
                  const snippet = (s.text || '').slice(0, 220).trim();
                  return `- ${t}${snippet ? `: ${snippet}` : ''} [Source ${i + 1}]`;
                })
                .join('\n')
            : '- No source snippets available in this response.';

          send({ type: 'answer', text: `${fallbackText}\n\nKey points from available sources:\n${fallbackGuidance}` });
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

function extractPmcId(source) {
  const candidates = [
    source.paperTitle,
    source.sourcePdf,
    source.source_pdf,
    source.chunkId,
    source.chunk_id,
  ].filter(Boolean);

  for (const c of candidates) {
    const m = String(c).match(/\b(PMC\d{5,})\b/i);
    if (m) return m[1].toUpperCase();
  }
  return null;
}

async function fetchEuropePmcMetadata(pmcId) {
  const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=PMCID:${pmcId}&format=json&pageSize=1`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  const item = json?.resultList?.result?.[0];
  if (!item) return null;
  return {
    paperTitle: item.title || null,
    authors: item.authorString || null,
    year: item.pubYear || null,
    journal: item.journalTitle || item.journal || null,
    doi: item.doi || null,
    sourcePdf: item.pmcid ? `https://pmc.ncbi.nlm.nih.gov/articles/${item.pmcid}/` : null,
  };
}

async function enrichSourcesMetadata(sources) {
  const out = [...sources];
  for (let i = 0; i < out.length; i++) {
    const s = out[i] || {};
    const titleLooksPmc = /^PMC\d{5,}$/i.test((s.paperTitle || '').trim());
    const missingMeta = !s.authors || !s.year || !s.journal || titleLooksPmc;
    if (!missingMeta) continue;

    const pmcId = extractPmcId(s);
    if (!pmcId) continue;

    try {
      const meta = await fetchEuropePmcMetadata(pmcId);
      if (!meta) continue;
      out[i] = {
        ...s,
        paperTitle: meta.paperTitle || s.paperTitle,
        authors: meta.authors || s.authors,
        year: meta.year || s.year,
        journal: meta.journal || s.journal || s.venue,
        doi: meta.doi || s.doi,
        sourcePdf: meta.sourcePdf || s.sourcePdf || s.source_pdf,
      };
    } catch {
      // keep original source if metadata fetch fails
    }
  }
  return out;
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
